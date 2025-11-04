from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from telethon import TelegramClient
from telethon.sessions import StringSession
from telethon.errors import SessionPasswordNeededError, FloodWaitError, UserBannedInChannelError
from telethon.tl.functions.messages import AddChatUserRequest, SearchGlobalRequest
from telethon.tl.functions.channels import GetFullChannelRequest
from telethon.tl.functions.contacts import SearchRequest
from telethon.tl.types import InputMessagesFilterEmpty, InputPeerEmpty, InputPeerChannel
import os
from typing import List, Optional, Dict
import asyncio
from datetime import datetime, timedelta
from collections import defaultdict

# FastAPI app
app = FastAPI(title="Telegram Backend API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # في الإنتاج، استبدل بـ domain الفعلي
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class SendCodeRequest(BaseModel):
    phone: str
    api_id: str
    api_hash: str

class VerifyCodeRequest(BaseModel):
    phone: str
    api_id: str
    api_hash: str
    code: str
    password: Optional[str] = None

class SessionData(BaseModel):
    session_string: str

class SendMessageRequest(BaseModel):
    session_string: str
    api_id: str
    api_hash: str
    group_id: int
    message: str
    schedule_at: Optional[str] = None  # ISO format timestamp

class SendMessageResponse(BaseModel):
    success: bool
    message_id: Optional[int] = None
    message: str
    sent_at: Optional[str] = None

class ExtractMembersRequest(BaseModel):
    session_string: str
    api_id: str
    api_hash: str
    group_id: int
    limit: Optional[int] = 100

class TransferMembersRequest(BaseModel):
    session_string: str
    api_id: str
    api_hash: str
    source_group_id: int
    target_group_id: int
    member_ids: List[int]  # List of telegram_user_id

class SearchGroupsRequest(BaseModel):
    session_string: str
    api_id: str
    api_hash: str
    query: str
    limit: Optional[int] = 20
    groups_only: Optional[bool] = True  # البحث في المجموعات فقط

# Dictionary to store temporary clients (في الإنتاج، استخدم Redis)
temp_clients = {}

# Rate Limiting: تخزين آخر مرة تم إرسال رسالة من كل جلسة
rate_limit_store: Dict[str, List[datetime]] = defaultdict(list)
RATE_LIMIT_MESSAGES = 20  # عدد الرسائل المسموح بها
RATE_LIMIT_WINDOW = timedelta(minutes=1)  # نافذة زمنية (دقيقة واحدة)

def check_rate_limit(session_string: str) -> bool:
    """
    التحقق من Rate Limit
    """
    now = datetime.now()
    # تنظيف الرسائل القديمة
    rate_limit_store[session_string] = [
        timestamp for timestamp in rate_limit_store[session_string]
        if now - timestamp < RATE_LIMIT_WINDOW
    ]
    
    # التحقق من العدد
    if len(rate_limit_store[session_string]) >= RATE_LIMIT_MESSAGES:
        return False
    
    return True

def record_message_sent(session_string: str):
    """
    تسجيل رسالة مرسلة
    """
    rate_limit_store[session_string].append(datetime.now())

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "Telegram Backend API",
        "version": "1.0.0"
    }

@app.post("/auth/send-code")
async def send_code(request: SendCodeRequest):
    """
    إرسال رمز التحقق إلى رقم الهاتف
    """
    try:
        # إنشاء client جديد
        client = TelegramClient(
            StringSession(),
            int(request.api_id),
            request.api_hash
        )
        
        await client.connect()
        
        # إرسال رمز التحقق
        result = await client.send_code_request(request.phone)
        
        # حفظ الـ client مؤقتاً
        temp_clients[request.phone] = client
        
        return {
            "success": True,
            "phone_code_hash": result.phone_code_hash,
            "message": "تم إرسال رمز التحقق إلى تيليجرام"
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/auth/verify-code")
async def verify_code(request: VerifyCodeRequest):
    """
    التحقق من رمز التحقق وإنشاء session_string
    """
    try:
        # استرجاع الـ client المؤقت
        client = temp_clients.get(request.phone)
        
        if not client:
            # إذا لم يكن موجود، أنشئ واحد جديد
            client = TelegramClient(
                StringSession(),
                int(request.api_id),
                request.api_hash
            )
            await client.connect()
            await client.send_code_request(request.phone)
        
        try:
            # التحقق من الرمز
            await client.sign_in(request.phone, request.code)
        except SessionPasswordNeededError:
            # إذا كان هناك Two-Factor Authentication
            if not request.password:
                raise HTTPException(
                    status_code=400, 
                    detail="Two-factor authentication enabled. Password required."
                )
            await client.sign_in(password=request.password)
        
        # الحصول على session_string
        session_string = client.session.save()
        
        # حذف الـ client المؤقت
        if request.phone in temp_clients:
            del temp_clients[request.phone]
        
        # قطع الاتصال
        await client.disconnect()
        
        return {
            "success": True,
            "session_string": session_string,
            "message": "تم التحقق بنجاح"
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/groups/import/{session_id}")
async def import_groups(
    session_id: str,
    api_id: str,
    api_hash: str,
    session_string: str
):
    """
    استيراد المجموعات من حساب تيليجرام
    """
    try:
        # إنشاء client من session_string
        client = TelegramClient(
            StringSession(session_string),
            int(api_id),
            api_hash
        )
        
        await client.connect()
        
        if not await client.is_user_authorized():
            raise HTTPException(status_code=401, detail="Session expired or invalid")
        
        # جلب جميع الـ dialogs (محادثات)
        dialogs = await client.get_dialogs()
        
        groups = []
        for dialog in dialogs:
            entity = dialog.entity
            
            # فلترة المجموعات والقنوات فقط
            if hasattr(entity, 'megagroup') or hasattr(entity, 'broadcast'):
                group_type = 'supergroup' if getattr(entity, 'megagroup', False) else 'channel'
                if not hasattr(entity, 'megagroup') and not hasattr(entity, 'broadcast'):
                    group_type = 'group'
                
                groups.append({
                    "group_id": entity.id,
                    "title": entity.title,
                    "username": getattr(entity, 'username', None),
                    "members_count": getattr(entity, 'participants_count', 0),
                    "type": group_type
                })
        
        await client.disconnect()
        
        return {
            "success": True,
            "groups": groups,
            "total": len(groups)
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    """
    حذف جلسة (في الحقيقة، فقط نرجع success لأن session_string يُحذف من DB)
    """
    return {
        "success": True,
        "message": "Session deleted successfully"
    }

@app.post("/messages/send")
async def send_message(request: SendMessageRequest):
    """
    إرسال رسالة إلى مجموعة Telegram
    """
    try:
        # إنشاء client من session_string
        client = TelegramClient(
            StringSession(request.session_string),
            int(request.api_id),
            request.api_hash
        )
        
        await client.connect()
        
        if not await client.is_user_authorized():
            raise HTTPException(status_code=401, detail="Session expired or invalid")
        
        # البحث عن المجموعة
        try:
            entity = await client.get_entity(request.group_id)
        except Exception as e:
            raise HTTPException(status_code=404, detail=f"Group not found: {str(e)}")
        
        # التحقق من Rate Limit
        if not check_rate_limit(request.session_string):
            await client.disconnect()
            raise HTTPException(
                status_code=429, 
                detail=f"Rate limit exceeded. Maximum {RATE_LIMIT_MESSAGES} messages per minute. Please wait."
            )
        
        # إرسال الرسالة
        try:
            message = await client.send_message(entity, request.message)
            
            # تسجيل الرسالة المرسلة
            record_message_sent(request.session_string)
            
            # قطع الاتصال
            await client.disconnect()
            
            return {
                "success": True,
                "message_id": message.id,
                "message": "تم إرسال الرسالة بنجاح",
                "sent_at": message.date.isoformat() if message.date else None
            }
        except FloodWaitError as e:
            await client.disconnect()
            wait_time = e.seconds
            raise HTTPException(
                status_code=429, 
                detail=f"Telegram rate limit: Please wait {wait_time} seconds before sending more messages."
            )
        except UserBannedInChannelError:
            await client.disconnect()
            raise HTTPException(
                status_code=403, 
                detail="Account is banned or blocked from this group/channel"
            )
        except Exception as e:
            await client.disconnect()
            error_msg = str(e)
            
            # معالجة أخطاء محددة
            if "flood" in error_msg.lower() or "rate limit" in error_msg.lower():
                raise HTTPException(
                    status_code=429, 
                    detail="Rate limit exceeded. Please wait before sending more messages."
                )
            elif "banned" in error_msg.lower() or "blocked" in error_msg.lower():
                raise HTTPException(
                    status_code=403, 
                    detail="Account banned or blocked from this group"
                )
            elif "right" in error_msg.lower() or "permission" in error_msg.lower():
                raise HTTPException(
                    status_code=403,
                    detail="You don't have permission to send messages to this group"
                )
            else:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Failed to send message: {error_msg}"
                )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/members/extract")
async def extract_members(request: ExtractMembersRequest):
    """
    استخراج أعضاء مجموعة Telegram
    """
    try:
        # إنشاء client من session_string
        client = TelegramClient(
            StringSession(request.session_string),
            int(request.api_id),
            request.api_hash
        )
        
        await client.connect()
        
        if not await client.is_user_authorized():
            raise HTTPException(status_code=401, detail="Session expired or invalid")
        
        # البحث عن المجموعة
        try:
            # group_id قد يكون رقم (BIGINT) أو username
            # نحاول كرقم أولاً، ثم كـ entity
            try:
                # إذا كان group_id رقم، نحوله إلى int
                if isinstance(request.group_id, (int, str)) and str(request.group_id).isdigit():
                    entity = await client.get_entity(int(request.group_id))
                else:
                    # إذا كان username أو entity
                    entity = await client.get_entity(request.group_id)
            except (ValueError, TypeError):
                # إذا فشل، نحاول كـ entity مباشرة
                entity = await client.get_entity(request.group_id)
        except Exception as e:
            raise HTTPException(status_code=404, detail=f"Group not found (group_id: {request.group_id}): {str(e)}")
        
        # استخراج الأعضاء
        try:
            participants = []
            limit = request.limit or 100
            
            async for user in client.iter_participants(entity, limit=limit):
                # تخطي البوتات إذا لم تكن مطلوبة
                if user.bot:
                    continue
                
                # معالجة access_hash بشكل آمن (قد يكون None)
                access_hash = None
                if hasattr(user, 'access_hash') and user.access_hash is not None:
                    access_hash = user.access_hash
                
                participants.append({
                    "telegram_user_id": user.id,
                    "username": user.username if hasattr(user, 'username') else None,
                    "first_name": user.first_name if hasattr(user, 'first_name') else None,
                    "last_name": user.last_name if hasattr(user, 'last_name') else None,
                    "phone": user.phone if hasattr(user, 'phone') else None,
                    "is_bot": user.bot if hasattr(user, 'bot') else False,
                    "is_premium": getattr(user, 'premium', False),
                    "is_verified": getattr(user, 'verified', False),
                    "is_scam": getattr(user, 'scam', False),
                    "is_fake": getattr(user, 'fake', False),
                    "access_hash": access_hash
                })
            
            await client.disconnect()
            
            return {
                "success": True,
                "members": participants,
                "total": len(participants),
                "message": f"تم استخراج {len(participants)} عضو بنجاح"
            }
        except Exception as e:
            await client.disconnect()
            error_msg = str(e)
            
            # معالجة أخطاء محددة
            if "right" in error_msg.lower() or "permission" in error_msg.lower():
                raise HTTPException(status_code=403, detail="You don't have permission to view participants in this group")
            elif "banned" in error_msg.lower() or "blocked" in error_msg.lower():
                raise HTTPException(status_code=403, detail="Account banned or blocked from this group")
            else:
                raise HTTPException(status_code=400, detail=f"Failed to extract members: {error_msg}")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/members/transfer")
async def transfer_members(request: TransferMembersRequest):
    """
    نقل أعضاء من مجموعة إلى أخرى
    """
    try:
        # إنشاء client من session_string
        client = TelegramClient(
            StringSession(request.session_string),
            int(request.api_id),
            request.api_hash
        )
        
        await client.connect()
        
        if not await client.is_user_authorized():
            raise HTTPException(status_code=401, detail="Session expired or invalid")
        
        # البحث عن المجموعات
        try:
            source_entity = await client.get_entity(request.source_group_id)
            target_entity = await client.get_entity(request.target_group_id)
        except Exception as e:
            raise HTTPException(status_code=404, detail=f"Group not found: {str(e)}")
        
        # نقل الأعضاء
        transferred = []
        failed = []
        
        for member_id in request.member_ids:
            try:
                # الحصول على معلومات العضو
                user = await client.get_entity(member_id)
                
                # إضافة العضو إلى المجموعة الهدف
                await client(AddChatUserRequest(
                    chat_id=target_entity.id,
                    user_id=user.id
                ))
                
                transferred.append({
                    "telegram_user_id": member_id,
                    "username": user.username,
                    "first_name": user.first_name
                })
                
                # إضافة تأخير صغير لتجنب Rate Limiting
                await asyncio.sleep(2)
                
            except FloodWaitError as e:
                wait_time = e.seconds
                failed.append({
                    "telegram_user_id": member_id,
                    "error": f"Rate limit: wait {wait_time} seconds"
                })
                # انتظار قبل المحاولة التالية
                await asyncio.sleep(wait_time)
            except UserBannedInChannelError:
                failed.append({
                    "telegram_user_id": member_id,
                    "error": "Account is banned from this group"
                })
            except Exception as e:
                error_msg = str(e)
                
                # معالجة أخطاء محددة
                if "right" in error_msg.lower() or "permission" in error_msg.lower():
                    failed.append({
                        "telegram_user_id": member_id,
                        "error": "No permission to add users"
                    })
                elif "banned" in error_msg.lower() or "blocked" in error_msg.lower():
                    failed.append({
                        "telegram_user_id": member_id,
                        "error": "User banned or blocked"
                    })
                else:
                    failed.append({
                        "telegram_user_id": member_id,
                        "error": error_msg
                    })
        
        await client.disconnect()
        
        return {
            "success": True,
            "transferred": transferred,
            "failed": failed,
            "total_requested": len(request.member_ids),
            "total_transferred": len(transferred),
            "total_failed": len(failed),
            "message": f"تم نقل {len(transferred)} عضو بنجاح"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/groups/search")
async def search_groups(request: SearchGroupsRequest):
    """
    البحث العالمي عن مجموعات Telegram
    """
    try:
        # إنشاء client من session_string
        client = TelegramClient(
            StringSession(request.session_string),
            int(request.api_id),
            request.api_hash
        )
        
        await client.connect()
        
        if not await client.is_user_authorized():
            raise HTTPException(status_code=401, detail="Session expired or invalid")
        
        # البحث العالمي
        try:
            limit = min(request.limit or 20, 100)  # حد أقصى 100
            
            # جلب dialogs المستخدم لاستبعاد المجموعات التي هو عضو فيها (اختياري - فقط إذا طلب المستخدم)
            # ملاحظة: قد نريح هذا الشرط قليلاً إذا كانت النتائج قليلة
            user_group_ids = set()
            try:
                user_dialogs = await client.get_dialogs(limit=100)  # جلب أول 100 dialog فقط لتسريع العملية
                for dialog in user_dialogs:
                    entity = dialog.entity
                    if hasattr(entity, 'id'):
                        # حفظ معرفات المجموعات التي المستخدم عضو فيها
                        if hasattr(entity, 'megagroup') or hasattr(entity, 'broadcast'):
                            user_group_ids.add(entity.id)
            except Exception as e:
                # إذا فشل جلب dialogs، نتابع بدون فلترة
                print(f"Warning: Could not fetch user dialogs: {e}")
            
            # البحث في عدة مصادر للحصول على نتائج أكثر
            all_peers = {}
            
            # 1. البحث في الرسائل العالمية (SearchGlobalRequest)
            print("=== Searching in global messages ===")
            max_pages = 3
            messages_per_page = 100
            
            for page in range(max_pages):
                try:
                    result = await client(SearchGlobalRequest(
                        q=request.query,
                        filter=InputMessagesFilterEmpty(),
                        min_date=None,
                        max_date=None,
                        offset_rate=page * messages_per_page,
                        offset_peer=InputPeerEmpty(),
                        offset_id=0,
                        limit=messages_per_page
                    ))
                    
                    print(f"Page {page + 1}: Search returned {len(result.messages)} messages")
                    
                    # جمع جميع الـ peers من الرسائل
                    for message in result.messages:
                        if not message.peer_id:
                            continue
                        peer = message.peer_id
                        if hasattr(peer, 'channel_id'):
                            if peer.channel_id not in all_peers:
                                all_peers[peer.channel_id] = peer
                    
                    if len(result.messages) < messages_per_page:
                        break
                        
                except Exception as e:
                    print(f"Error searching page {page + 1}: {e}")
                    break
            
            # 2. البحث في جهات الاتصال والمجموعات (contacts.Search)
            print("=== Searching in contacts/groups ===")
            try:
                contacts_result = await client(SearchRequest(
                    q=request.query,
                    limit=100
                ))
                
                print(f"Contacts search returned {len(contacts_result.chats)} chats")
                
                # جمع المجموعات من نتائج البحث في جهات الاتصال
                for chat in contacts_result.chats:
                    if hasattr(chat, 'id'):
                        # إذا كانت قناة أو supergroup
                        if hasattr(chat, 'broadcast') or hasattr(chat, 'megagroup'):
                            if chat.id not in all_peers:
                                # إنشاء peer من chat
                                try:
                                    peer = await client.get_entity(chat)
                                    if hasattr(peer, 'id'):
                                        # استخدام access_hash لإنشاء peer صحيح
                                        from telethon.tl.types import InputPeerChannel
                                        if hasattr(chat, 'access_hash'):
                                            channel_peer = InputPeerChannel(
                                                channel_id=chat.id,
                                                access_hash=chat.access_hash
                                            )
                                            all_peers[chat.id] = channel_peer
                                        else:
                                            # إذا لم يكن access_hash متوفر، نحاول get_entity
                                            all_peers[chat.id] = peer
                                except Exception as e:
                                    print(f"Error processing chat {chat.id}: {e}")
                                    continue
                                    
            except Exception as e:
                print(f"Error in contacts search: {e}")
            
            # 3. محاولة البحث عن username مباشرة (إذا كان query يبدو كـ username)
            print("=== Trying direct username search ===")
            query_clean = request.query.strip().replace('@', '').lower()
            if query_clean and len(query_clean) > 3:  # فقط إذا كان query معقول
                try:
                    # محاولة البحث عن username مباشرة
                    try:
                        entity = await client.get_entity(query_clean)
                        if hasattr(entity, 'id'):
                            # إذا كانت قناة أو supergroup
                            if hasattr(entity, 'broadcast') or hasattr(entity, 'megagroup'):
                                if entity.id not in all_peers:
                                    all_peers[entity.id] = await client.get_input_entity(entity)
                                    print(f"Found direct match: {getattr(entity, 'title', 'Unknown')}")
                    except:
                        pass  # إذا لم يكن username صحيح، نتخطاه
                except Exception as e:
                    print(f"Error in direct username search: {e}")
            
            print(f"Search returned total {len(all_peers)} unique channels/groups for query: {request.query}")
            print(f"User has {len(user_group_ids)} groups in dialogs")
            print(f"Found {len(all_peers)} unique channels/groups in search results")
            
            groups = []
            seen_ids = set()
            skipped_no_username = 0
            skipped_user_group = 0
            skipped_broadcast = 0
            
            # استخراج المجموعات من النتائج
            for group_id, peer in all_peers.items():
                # تجنب التكرار
                if group_id in seen_ids:
                    continue
                
                try:
                    # الحصول على معلومات المجموعة
                    entity = await client.get_entity(peer)
                    
                    # فلترة: فقط المجموعات العامة (التي لها username)
                    has_username = hasattr(entity, 'username') and entity.username
                    
                    # إذا لم يكن لها username، نتخطاها (نريد فقط المجموعات العامة للبحث العالمي)
                    if not has_username:
                        skipped_no_username += 1
                        continue
                    
                    # إذا كانت المجموعة من مجموعات المستخدم، نتخطاها
                    if entity.id in user_group_ids:
                        skipped_user_group += 1
                        continue  # تخطي المجموعات التي المستخدم عضو فيها
                    
                    # فلترة: فقط المجموعات (supergroups) وليس القنوات إذا كان groups_only = True
                    if request.groups_only:
                        if hasattr(entity, 'broadcast') and entity.broadcast:
                            skipped_broadcast += 1
                            continue  # تخطي القنوات، فقط المجموعات
                    
                    # الحصول على عدد الأعضاء الحقيقي
                    # ملاحظة: GetFullChannelRequest قد يكون بطيئاً، لذلك نستخدمه فقط إذا كان متوفراً
                    members_count = 0
                    try:
                        # محاولة سريعة من entity أولاً
                        if hasattr(entity, 'participants_count') and entity.participants_count:
                            members_count = entity.participants_count
                        elif hasattr(entity, 'members_count') and entity.members_count:
                            members_count = entity.members_count
                        else:
                            # فقط إذا لم يكن متوفراً، نحاول GetFullChannelRequest (أبطأ)
                            try:
                                full_channel = await client(GetFullChannelRequest(entity))
                                if hasattr(full_channel, 'full_chat') and hasattr(full_channel.full_chat, 'participants_count'):
                                    members_count = full_channel.full_chat.participants_count
                                elif hasattr(full_channel, 'full_chat') and hasattr(full_channel.full_chat, 'members_count'):
                                    members_count = full_channel.full_chat.members_count
                            except:
                                pass  # إذا فشل، نستخدم 0
                    except Exception as e:
                        # إذا فشل كل شيء، نستخدم 0
                        members_count = 0
                    
                    seen_ids.add(group_id)
                    
                    group_info = {
                        "id": str(group_id),
                        "group_id": group_id,
                        "title": getattr(entity, 'title', 'Unknown'),
                        "username": getattr(entity, 'username', None),
                        "type": "channel" if getattr(entity, 'broadcast', False) else "supergroup",
                        "members_count": members_count,
                        "description": getattr(entity, 'about', None),
                        "is_public": True,  # إذا كان له username فهو عام
                        "verified": getattr(entity, 'verified', False),
                        "invite_link": f"https://t.me/{entity.username}" if entity.username else None
                    }
                    
                    groups.append(group_info)
                    
                    # إذا وصلنا للحد المطلوب، توقف
                    if len(groups) >= limit:
                        break
                        
                except Exception as e:
                    # تجاهل الأخطاء في جلب معلومات مجموعة معينة
                    continue
            
            await client.disconnect()
            
            print(f"Search summary: Found {len(groups)} groups. Skipped: {skipped_no_username} no username, {skipped_user_group} user groups, {skipped_broadcast} channels")
            
            return {
                "success": True,
                "data": {
                    "groups": groups,
                    "total": len(groups),
                    "query": request.query,
                    "has_more": len(groups) >= limit,
                    "search_metadata": {
                        "timestamp": datetime.now().isoformat(),
                        "api_version": "1.0",
                        "results_per_page": limit,
                        "debug": {
                            "total_unique_peers": len(all_peers),
                            "skipped_no_username": skipped_no_username,
                            "skipped_user_group": skipped_user_group,
                            "skipped_broadcast": skipped_broadcast,
                            "user_groups_count": len(user_group_ids)
                        }
                    }
                }
            }
            
        except FloodWaitError as e:
            await client.disconnect()
            raise HTTPException(
                status_code=429,
                detail=f"Telegram rate limit: Please wait {e.seconds} seconds before searching again."
            )
        except Exception as e:
            await client.disconnect()
            error_msg = str(e)
            
            # معالجة أخطاء محددة
            if "flood" in error_msg.lower() or "rate limit" in error_msg.lower():
                raise HTTPException(
                    status_code=429,
                    detail="Rate limit exceeded. Please wait before searching again."
                )
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"Failed to search groups: {error_msg}"
                )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "active_temp_clients": len(temp_clients)
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
