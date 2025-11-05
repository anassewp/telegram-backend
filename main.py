from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from telethon import TelegramClient
from telethon.sessions import StringSession
from telethon.errors import SessionPasswordNeededError, FloodWaitError, UserBannedInChannelError
from telethon.tl.functions.messages import AddChatUserRequest, SearchGlobalRequest, ImportChatInviteRequest
from telethon.tl.functions.channels import GetFullChannelRequest, JoinChannelRequest
from telethon.tl.functions.contacts import SearchRequest
from telethon.tl.types import InputMessagesFilterEmpty, InputPeerEmpty, InputPeerChannel
import os
from typing import List, Optional, Dict
import asyncio
from datetime import datetime, timedelta
from collections import defaultdict
import random
import json

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
    username: Optional[str] = None  # username للمجموعة (اختياري)

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
    groups_only: Optional[bool] = False  # البحث في جميع المجموعات والقنوات بدون قيود

class JoinGroupRequest(BaseModel):
    session_string: str
    api_id: str
    api_hash: str
    group_id: Optional[int] = None
    username: Optional[str] = None  # username للمجموعة
    invite_link: Optional[str] = None  # رابط الدعوة

# Models جديدة للميزات المتقدمة
class SendToMemberRequest(BaseModel):
    session_string: str
    api_id: str
    api_hash: str
    member_telegram_id: int
    message: str
    personalize: Optional[bool] = False  # تخصيص بالاسم

class CampaignCreateRequest(BaseModel):
    name: str
    campaign_type: str  # 'groups', 'members', 'mixed'
    message_text: str
    target_type: str  # 'groups', 'members', 'both'
    selected_groups: Optional[List[int]] = []
    selected_members: Optional[List[int]] = []
    session_ids: List[str]  # قائمة session_ids
    distribution_strategy: Optional[str] = 'equal'  # 'equal', 'round_robin', 'random', 'weighted'
    max_messages_per_session: Optional[int] = 100
    max_messages_per_day: Optional[int] = 200
    delay_between_messages_min: Optional[int] = 30
    delay_between_messages_max: Optional[int] = 90
    delay_variation: Optional[bool] = True
    exclude_sent_members: Optional[bool] = True
    exclude_bots: Optional[bool] = True
    exclude_premium: Optional[bool] = False
    exclude_verified: Optional[bool] = False
    exclude_scam: Optional[bool] = True
    exclude_fake: Optional[bool] = True
    personalize_messages: Optional[bool] = False
    vary_emojis: Optional[bool] = False
    message_templates: Optional[List[str]] = []
    schedule_at: Optional[str] = None

class TransferMembersBatchRequest(BaseModel):
    session_ids: List[str]  # قائمة session_ids
    api_ids: Dict[str, str]  # {session_id: api_id}
    api_hashes: Dict[str, str]  # {session_id: api_hash}
    session_strings: Dict[str, str]  # {session_id: session_string}
    source_group_id: int
    target_group_id: int
    member_ids: List[int]
    distribution_strategy: Optional[str] = 'equal'
    delay_min: Optional[int] = 60  # ثواني
    delay_max: Optional[int] = 120  # ثواني
    max_per_day_per_session: Optional[int] = 50

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

# ============================================
# الوظائف المساعدة للميزات المتقدمة
# ============================================

def smart_delay(min_seconds: int = 30, max_seconds: int = 90, variation: bool = True) -> int:
    """
    حساب تأخير ذكي بين الرسائل (30-90 ثانية عشوائي)
    """
    if variation:
        # تنويع عشوائي
        delay = random.randint(min_seconds, max_seconds)
        # إضافة تنويع إضافي صغير (±5 ثواني)
        variation_amount = random.randint(-5, 5)
        delay = max(min_seconds, min(max_seconds, delay + variation_amount))
    else:
        # متوسط ثابت
        delay = (min_seconds + max_seconds) // 2
    return delay

def distribute_tasks(tasks: List, session_ids: List[str], strategy: str = 'equal') -> Dict[str, List]:
    """
    توزيع المهام بين الجلسات باستخدام استراتيجيات مختلفة
    """
    distribution = {session_id: [] for session_id in session_ids}
    
    if not session_ids or not tasks:
        return distribution
    
    if strategy == 'equal':
        # توزيع متساوي
        tasks_per_session = len(tasks) // len(session_ids)
        remainder = len(tasks) % len(session_ids)
        
        start_idx = 0
        for i, session_id in enumerate(session_ids):
            end_idx = start_idx + tasks_per_session + (1 if i < remainder else 0)
            distribution[session_id] = tasks[start_idx:end_idx]
            start_idx = end_idx
    
    elif strategy == 'round_robin':
        # توزيع دوري
        for i, task in enumerate(tasks):
            session_id = session_ids[i % len(session_ids)]
            distribution[session_id].append(task)
    
    elif strategy == 'random':
        # توزيع عشوائي
        for task in tasks:
            session_id = random.choice(session_ids)
            distribution[session_id].append(task)
    
    elif strategy == 'weighted':
        # توزيع مرجح (حسب عدد المهام المكتملة لكل جلسة)
        # في هذا الإصدار، نستخدم توزيع متساوي (يمكن تحسينه لاحقاً)
        tasks_per_session = len(tasks) // len(session_ids)
        remainder = len(tasks) % len(session_ids)
        
        start_idx = 0
        for i, session_id in enumerate(session_ids):
            end_idx = start_idx + tasks_per_session + (1 if i < remainder else 0)
            distribution[session_id] = tasks[start_idx:end_idx]
            start_idx = end_idx
    
    return distribution

def personalize_message(message: str, first_name: Optional[str] = None, username: Optional[str] = None) -> str:
    """
    تخصيص الرسالة بالاسم
    """
    personalized = message
    
    if first_name:
        # استبدال {name} أو {first_name} بالاسم الأول
        personalized = personalized.replace('{name}', first_name)
        personalized = personalized.replace('{first_name}', first_name)
        personalized = personalized.replace('{NAME}', first_name.upper())
        personalized = personalized.replace('{FIRST_NAME}', first_name.upper())
    
    if username:
        # استبدال {username} بالاسم المستخدم
        personalized = personalized.replace('{username}', username)
        personalized = personalized.replace('{USERNAME}', username.upper())
    
    return personalized

def vary_emoji(message: str) -> str:
    """
    تنويع الإيموجي في الرسالة
    """
    # قائمة إيموجي بديلة
    emojis = ['👋', '🙋', '👌', '👍', '💪', '🎉', '🚀', '✨', '⭐', '💫']
    
    # البحث عن إيموجي في الرسالة واستبدالها
    # في هذا الإصدار البسيط، نضيف إيموجي عشوائي في النهاية إذا لم يكن موجود
    if not any(ord(char) > 0x1F000 for char in message):  # التحقق من وجود إيموجي
        emoji = random.choice(emojis)
        message = f"{message} {emoji}"
    
    return message

def filter_members(
    members: List[Dict],
    exclude_bots: bool = True,
    exclude_premium: bool = False,
    exclude_verified: bool = False,
    exclude_scam: bool = True,
    exclude_fake: bool = True,
    exclude_sent_members: Optional[List[int]] = None
) -> List[Dict]:
    """
    فلترة الأعضاء حسب المعايير المحددة
    """
    filtered = []
    
    if exclude_sent_members is None:
        exclude_sent_members = []
    
    for member in members:
        # التحقق من البوتات
        if exclude_bots and member.get('is_bot', False):
            continue
        
        # التحقق من Premium
        if exclude_premium and member.get('is_premium', False):
            continue
        
        # التحقق من Verified
        if exclude_verified and member.get('is_verified', False):
            continue
        
        # التحقق من Scam
        if exclude_scam and member.get('is_scam', False):
            continue
        
        # التحقق من Fake
        if exclude_fake and member.get('is_fake', False):
            continue
        
        # التحقق من الأعضاء المرسل لهم سابقاً
        member_id = member.get('telegram_user_id')
        if member_id and member_id in exclude_sent_members:
            continue
        
        filtered.append(member)
    
    return filtered

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
            
            # استيراد جميع المجموعات والقنوات بدون أي فلترة
            # القنوات لها broadcast = True، المجموعات لها megagroup = True
            is_channel = getattr(entity, 'broadcast', False)
            is_megagroup = getattr(entity, 'megagroup', False)
            
            # نستورد جميع dialogs التي هي مجموعات أو قنوات (بدون أي استثناء)
            if is_megagroup or is_channel:
                try:
                    # جلب معلومات أساسية
                    is_restricted = getattr(entity, 'restricted', False)
                    participants_count = getattr(entity, 'participants_count', 0)
                    has_username = hasattr(entity, 'username') and entity.username is not None
                    is_private = not has_username  # إذا لم يكن لها username، فهي خاصة
                    
                    # محاولة جلب العدد الحقيقي للأعضاء أولاً (قبل الفحص)
                    try:
                        if hasattr(entity, 'id'):
                            full_info = await client(GetFullChannelRequest(entity))
                            actual_members_count = getattr(full_info.full_chat, 'participants_count', participants_count)
                    except Exception as e:
                        # إذا فشل، نستخدم العدد من dialog
                        actual_members_count = participants_count
                    
                    # التحقق من إمكانية رؤية الأعضاء بشكل دقيق
                    can_see_members = False
                    members_visible = False  # للتوافق مع الكود القديم
                    members_visibility_type = 'hidden'  # 'fully_visible', 'admin_only', 'hidden'
                    
                    try:
                        # محاولة جلب أول 30 عضو لتحديد نوع ظهور الأعضاء
                        visible_participants_count = 0
                        total_checked = 0
                        check_limit = 30
                        
                        async for user in client.iter_participants(entity, limit=check_limit):
                            total_checked += 1
                            if not user.bot:
                                visible_participants_count += 1
                        
                        # تحديد نوع ظهور الأعضاء بناءً على عدد الأعضاء الظاهرين
                        # المعايير الجديدة:
                        # - 0 عضو ظاهر → hidden (مخفيين)
                        # - 1-10 عضو ظاهر → admin_only (للإدمن فقط)
                        # - 11+ عضو ظاهر → fully_visible (ظاهرين بالكامل)
                        if visible_participants_count == 0:
                            # 0 عضو ظاهر → مخفيين
                            members_visibility_type = 'hidden'
                            members_visible = False
                            can_see_members = False
                        elif 1 <= visible_participants_count <= 10:
                            # 1-10 عضو ظاهر → للإدمن فقط
                            members_visibility_type = 'admin_only'
                            members_visible = True
                            can_see_members = True
                        elif visible_participants_count > 10:
                            # 11+ عضو ظاهر → ظاهرين بالكامل
                            members_visibility_type = 'fully_visible'
                            members_visible = True
                            can_see_members = True
                        
                    except Exception as e:
                        error_msg = str(e).lower()
                        if 'permission' in error_msg or 'right' in error_msg or 'forbidden' in error_msg or 'not allowed' in error_msg:
                            members_visibility_type = 'hidden'
                            members_visible = False
                            can_see_members = False
                        else:
                            members_visibility_type = 'hidden'
                            members_visible = False
                    
                    # التحقق من إمكانية الإرسال (بدون إرسال فعلي)
                    can_send = True
                    is_closed = False
                    try:
                        # التحقق من صلاحيات الإرسال من خلال full_chat
                        if hasattr(entity, 'id'):
                            try:
                                full_info = await client(GetFullChannelRequest(entity))
                                # التحقق من أن المجموعة ليست مقيدة للإرسال
                                if hasattr(full_info, 'full_chat'):
                                    # يمكن إضافة المزيد من الفحوصات هنا
                                    pass
                            except:
                                pass
                    except Exception as e:
                        # إذا فشل، نفترض أنه يمكن الإرسال
                        pass
                    
                    # تحديد نوع المجموعة: supergroup, group, أو channel
                    if is_channel:
                        group_type = 'channel'
                    elif is_megagroup:
                        group_type = 'supergroup'
                    else:
                        group_type = 'group'
                    
                    groups.append({
                        "group_id": entity.id,
                        "title": entity.title,
                        "username": getattr(entity, 'username', None),
                        "members_count": actual_members_count or participants_count or 0,
                        "type": group_type,
                        "members_visible": members_visible,  # للتوافق مع الكود القديم
                        "members_visibility_type": members_visibility_type,  # 'fully_visible', 'admin_only', 'hidden'
                        "is_private": is_private,  # خاصة أو عامة
                        "is_restricted": is_restricted,  # مقيدة
                        "can_send": can_send,  # يمكن الإرسال
                        "is_closed": is_closed  # مغلقة
                    })
                    
                    visibility_status = "visible" if members_visible else "hidden (admin only)"
                    privacy_status = "public" if not is_private else "private"
                    print(f"Added group: {getattr(entity, 'title', 'Unknown')} ({actual_members_count or participants_count} members, {privacy_status}, members: {visibility_status})")
                    
                except Exception as e:
                    # إذا فشل جلب المعلومات، نتخطى المجموعة
                    print(f"Warning: Could not get group info for {getattr(entity, 'title', 'Unknown')}: {e}")
                    continue
        
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
        # نحتاج username أيضاً إذا كان متوفراً
        entity = None
        group_id_int = int(request.group_id) if isinstance(request.group_id, (int, str)) and str(request.group_id).isdigit() else None
        username = request.username  # username من الطلب
        
        try:
            # أولاً: نحاول البحث في dialogs المستخدم (للمجموعات التي هو عضو فيها)
            if group_id_int:
                try:
                    dialogs = await client.get_dialogs(limit=200)
                    for dialog in dialogs:
                        if hasattr(dialog.entity, 'id') and dialog.entity.id == group_id_int:
                            entity = dialog.entity
                            print(f"Found group in dialogs: {getattr(entity, 'title', 'Unknown')} (ID: {entity.id})")
                            break
                except Exception as e:
                    print(f"Warning: Could not search dialogs: {e}")
            
            # ثانياً: إذا لم نجدها في dialogs، نحاول البحث باستخدام username (إذا كان متوفراً)
            if not entity and username:
                try:
                    # إزالة @ من username إذا كان موجوداً
                    clean_username = username.replace('@', '').strip()
                    if clean_username:
                        entity = await client.get_entity(clean_username)
                        # التحقق من أن النتيجة هي group/channel
                        if hasattr(entity, 'megagroup') or hasattr(entity, 'broadcast'):
                            print(f"Found group via username: {getattr(entity, 'title', 'Unknown')} (ID: {entity.id}, Username: {clean_username})")
                            # التحقق من أن ID يطابق (إذا كان متوفراً)
                            if group_id_int and hasattr(entity, 'id') and entity.id != group_id_int:
                                print(f"Warning: Username group ID ({entity.id}) doesn't match requested group_id ({group_id_int})")
                                entity = None
                        else:
                            entity = None
                except Exception as e:
                    print(f"Warning: Could not get entity via username '{username}': {e}")
            
            # ثالثاً: إذا لم نجدها، نحاول البحث في جميع dialogs
            if not entity and group_id_int:
                try:
                    dialogs = await client.get_dialogs()
                    for dialog in dialogs:
                        if hasattr(dialog.entity, 'id') and dialog.entity.id == group_id_int:
                            entity = dialog.entity
                            print(f"Found group in all dialogs: {getattr(entity, 'title', 'Unknown')} (ID: {entity.id})")
                            break
                except Exception as e:
                    print(f"Warning: Could not search all dialogs: {e}")
            
            # رابعاً: إذا لم نجدها في dialogs، نحاول get_entity مباشرة (قد يعمل للمجموعات العامة)
            if not entity:
                try:
                    if not group_id_int:
                        # إذا كان ليس رقم، قد يكون username
                        entity = await client.get_entity(request.group_id)
                    else:
                        # نحاول get_entity مباشرة (قد يعمل للمجموعات العامة في cache)
                        try:
                            entity = await client.get_entity(group_id_int)
                            # التحقق من أن النتيجة هي group/channel وليس user
                            if hasattr(entity, 'megagroup') or hasattr(entity, 'broadcast'):
                                print(f"Found group via get_entity: {getattr(entity, 'title', 'Unknown')} (ID: {entity.id})")
                            else:
                                entity = None
                        except Exception as e:
                            print(f"Could not get entity directly: {e}")
                except Exception as e:
                    print(f"Warning: Could not get entity: {e}")
            
            if not entity:
                error_msg = f"Group not found (group_id: {request.group_id}). "
                error_msg += "To extract members, you must be a member of the group. "
                error_msg += "For private groups, you need to join the group first using the invite link. "
                error_msg += "Groups imported from global search may not be accessible for member extraction if you're not a member. "
                error_msg += "Please join the group first, then try extracting members again."
                raise HTTPException(status_code=404, detail=error_msg)
                
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=404, 
                detail=f"Group not found (group_id: {request.group_id}): {str(e)}"
            )
        
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
            
            # ملاحظة: تم إزالة الفلترة - البحث في جميع المجموعات والقنوات بدون استبعاد
            # البحث شامل بدون أي قيود أو تأخيرات
            user_group_ids = set()  # محفوظ للتوافق مع الكود
            
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
                    
                    # معلومات أساسية (بدون تخطي)
                    has_username = hasattr(entity, 'username') and entity.username
                    is_private = not has_username  # إذا لم يكن لها username، فهي خاصة
                    is_restricted = getattr(entity, 'restricted', False)
                    
                    # ملاحظة: تم إزالة الفلترة - البحث في جميع المجموعات والقنوات
                    # لا نستبعد أي مجموعات أو قنوات
                    
                    # الحصول على عدد الأعضاء الحقيقي
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
                    
                    # التحقق من إمكانية رؤية الأعضاء بشكل دقيق
                    # نقوم بفحص أول 30 عضو لتحديد نوع ظهور الأعضاء
                    members_visible = False  # للتوافق مع الكود القديم
                    members_visibility_type = 'hidden'  # 'fully_visible', 'admin_only', 'hidden'
                    can_send = True  # افتراضي: يمكن الإرسال
                    is_closed = False
                    
                    # محاولة جلب أعضاء للتحقق من الصلاحيات
                    try:
                        visible_participants_count = 0
                        total_checked = 0
                        check_limit = 30  # عدد الأعضاء للفحص
                        
                        async for user in client.iter_participants(entity, limit=check_limit):
                            total_checked += 1
                            if not user.bot:
                                visible_participants_count += 1
                        
                        # تحديد نوع ظهور الأعضاء بناءً على عدد الأعضاء الظاهرين
                        # المعايير الجديدة:
                        # - 0 عضو ظاهر → hidden (مخفيين)
                        # - 1-10 عضو ظاهر → admin_only (للإدمن فقط)
                        # - 11+ عضو ظاهر → fully_visible (ظاهرين بالكامل)
                        if visible_participants_count == 0:
                            # 0 عضو ظاهر → مخفيين
                            members_visibility_type = 'hidden'
                            members_visible = False
                        elif 1 <= visible_participants_count <= 10:
                            # 1-10 عضو ظاهر → للإدمن فقط
                            members_visibility_type = 'admin_only'
                            members_visible = True
                        elif visible_participants_count > 10:
                            # 11+ عضو ظاهر → ظاهرين بالكامل
                            members_visibility_type = 'fully_visible'
                            members_visible = True
                        
                        print(f"Group: {getattr(entity, 'title', 'Unknown')}, Members: {members_count}, Visible: {visible_participants_count}, Type: {members_visibility_type}")
                        
                    except Exception as e:
                        error_msg = str(e).lower()
                        print(f"Error checking members visibility for {getattr(entity, 'title', 'Unknown')}: {error_msg}")
                        # إذا كان الخطأ يتعلق بالصلاحيات، يعني الأعضاء مخفيين
                        if any(keyword in error_msg for keyword in ['permission', 'right', 'forbidden', 'not allowed', 'admin', 'administrator']):
                            members_visibility_type = 'hidden'
                            members_visible = False
                        else:
                            # خطأ آخر، قد يكون network issue، نعتبره مخفيين للتحفظ
                            members_visibility_type = 'hidden'
                            members_visible = False
                    
                    # التحقق من إمكانية الإرسال
                    # ملاحظة: لا يمكن التحقق من الإرسال بدون محاولة إرسال فعلية
                    # لكن يمكن التحقق من بعض المؤشرات:
                    # 1. المجموعات المقيدة (restricted) قد تكون مغلقة
                    # 2. القنوات (channels) تحتاج صلاحيات للإرسال
                    if is_restricted:
                        can_send = False
                    
                    # إذا كانت قناة (broadcast) وليست مجموعة، قد تكون الإرسال مقيد
                    if hasattr(entity, 'broadcast') and entity.broadcast:
                        # القنوات تحتاج صلاحيات للإرسال، لكن لا يمكن التحقق بدون محاولة
                        can_send = True  # افتراضي: يمكن الإرسال (سيتم التحقق لاحقاً عند محاولة الإرسال)
                    
                    seen_ids.add(group_id)
                    
                    group_info = {
                        "id": str(group_id),
                        "group_id": group_id,
                        "title": getattr(entity, 'title', 'Unknown'),
                        "username": getattr(entity, 'username', None),
                        "type": "channel" if getattr(entity, 'broadcast', False) else "supergroup",
                        "members_count": members_count,
                        "description": getattr(entity, 'about', None),
                        "is_public": not is_private,  # عامة إذا كان لها username
                        "verified": getattr(entity, 'verified', False),
                        "invite_link": f"https://t.me/{entity.username}" if entity.username else None,
                        # الحقول الجديدة للفلترة
                        "members_visible": members_visible,  # للتوافق مع الكود القديم
                        "members_visibility_type": members_visibility_type,  # 'fully_visible', 'admin_only', 'hidden'
                        "is_private": is_private,
                        "is_restricted": is_restricted,
                        "can_send": can_send,
                        "is_closed": is_closed
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

@app.post("/groups/join")
async def join_group(request: JoinGroupRequest):
    """
    الانضمام إلى مجموعة Telegram
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
        
        entity = None
        
        try:
            # أولاً: إذا كان لدينا username، نستخدمه
            if request.username:
                clean_username = request.username.replace('@', '').strip()
                try:
                    entity = await client.get_entity(clean_username)
                    if not (hasattr(entity, 'megagroup') or hasattr(entity, 'broadcast')):
                        raise HTTPException(status_code=400, detail="Username is not a group or channel")
                except Exception as e:
                    raise HTTPException(status_code=404, detail=f"Group not found by username: {str(e)}")
            
            # ثانياً: إذا كان لدينا invite_link، نستخدمه
            elif request.invite_link:
                try:
                    # استخراج hash من رابط الدعوة
                    # مثال: https://t.me/joinchat/ABC123xyz
                    if 'joinchat/' in request.invite_link:
                        invite_hash = request.invite_link.split('joinchat/')[-1]
                        result = await client(ImportChatInviteRequest(invite_hash))
                        entity = result.chats[0] if result.chats else None
                    elif 't.me/+' in request.invite_link:
                        # استخراج hash من رابط +invite
                        invite_hash = request.invite_link.split('+')[-1].split('/')[-1]
                        result = await client(ImportChatInviteRequest(invite_hash))
                        entity = result.chats[0] if result.chats else None
                    else:
                        raise HTTPException(status_code=400, detail="Invalid invite link format")
                except Exception as e:
                    raise HTTPException(status_code=400, detail=f"Failed to join via invite link: {str(e)}")
            
            # ثالثاً: إذا كان لدينا group_id فقط، نحاول البحث في dialogs أو استخدام username
            elif request.group_id:
                group_id_int = int(request.group_id)
                # البحث في dialogs أولاً
                try:
                    dialogs = await client.get_dialogs(limit=200)
                    for dialog in dialogs:
                        if hasattr(dialog.entity, 'id') and dialog.entity.id == group_id_int:
                            entity = dialog.entity
                            # إذا كان المستخدم عضو بالفعل
                            raise HTTPException(status_code=400, detail="You are already a member of this group")
                except HTTPException:
                    raise
                except:
                    pass
                
                # إذا لم نجدها في dialogs، نحاول get_entity
                if not entity:
                    try:
                        entity = await client.get_entity(group_id_int)
                        if not (hasattr(entity, 'megagroup') or hasattr(entity, 'broadcast')):
                            entity = None
                    except:
                        pass
                
                if not entity:
                    raise HTTPException(
                        status_code=404, 
                        detail="Group not found. Please provide username or invite_link to join"
                    )
            
            else:
                raise HTTPException(status_code=400, detail="Either username, invite_link, or group_id must be provided")
            
            # الانضمام للمجموعة
            try:
                if hasattr(entity, 'broadcast') or hasattr(entity, 'megagroup'):
                    # للمجموعات والقنوات
                    await client(JoinChannelRequest(entity))
                else:
                    # للمجموعات العادية (نادر)
                    me = await client.get_me()
                    await client(AddChatUserRequest(
                        chat_id=entity.id,
                        user_id=me.id
                    ))
                
                await client.disconnect()
                
                return {
                    "success": True,
                    "message": f"تم الانضمام إلى المجموعة بنجاح: {getattr(entity, 'title', 'Unknown')}",
                    "group_id": entity.id if hasattr(entity, 'id') else None,
                    "group_title": getattr(entity, 'title', 'Unknown'),
                    "username": getattr(entity, 'username', None)
                }
                
            except Exception as e:
                await client.disconnect()
                error_msg = str(e)
                
                if "already" in error_msg.lower() or "member" in error_msg.lower():
                    raise HTTPException(status_code=400, detail="You are already a member of this group")
                elif "invite" in error_msg.lower() or "link" in error_msg.lower():
                    raise HTTPException(status_code=400, detail="Invalid invite link or you need an invite link to join")
                elif "right" in error_msg.lower() or "permission" in error_msg.lower():
                    raise HTTPException(status_code=403, detail="You don't have permission to join this group")
                else:
                    raise HTTPException(status_code=400, detail=f"Failed to join group: {error_msg}")
        
        except HTTPException:
            raise
        except Exception as e:
            await client.disconnect()
            raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/messages/send-to-member")
async def send_to_member(request: SendToMemberRequest):
    """
    إرسال رسالة مباشرة إلى عضو (DM)
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
        
        # البحث عن العضو
        try:
            user = await client.get_entity(request.member_telegram_id)
        except Exception as e:
            await client.disconnect()
            raise HTTPException(status_code=404, detail=f"Member not found: {str(e)}")
        
        # التحقق من Rate Limit
        if not check_rate_limit(request.session_string):
            await client.disconnect()
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded. Maximum {RATE_LIMIT_MESSAGES} messages per minute. Please wait."
            )
        
        # تخصيص الرسالة إذا طُلب
        message_text = request.message
        if request.personalize:
            first_name = getattr(user, 'first_name', None)
            username = getattr(user, 'username', None)
            message_text = personalize_message(message_text, first_name, username)
        
        # إرسال الرسالة
        try:
            message = await client.send_message(user, message_text)
            
            # تسجيل الرسالة المرسلة
            record_message_sent(request.session_string)
            
            await client.disconnect()
            
            return {
                "success": True,
                "message_id": message.id,
                "message": "تم إرسال الرسالة بنجاح",
                "sent_at": message.date.isoformat() if message.date else None,
                "member_telegram_id": request.member_telegram_id
            }
        except FloodWaitError as e:
            await client.disconnect()
            raise HTTPException(
                status_code=429,
                detail=f"Telegram rate limit: Please wait {e.seconds} seconds before sending more messages."
            )
        except Exception as e:
            await client.disconnect()
            error_msg = str(e)
            
            if "flood" in error_msg.lower() or "rate limit" in error_msg.lower():
                raise HTTPException(
                    status_code=429,
                    detail="Rate limit exceeded. Please wait before sending more messages."
                )
            elif "privacy" in error_msg.lower() or "blocked" in error_msg.lower():
                raise HTTPException(
                    status_code=403,
                    detail="User has privacy settings that prevent receiving messages"
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

@app.post("/campaigns/create")
async def create_campaign(request: CampaignCreateRequest):
    """
    إنشاء حملة جديدة (يجب حفظها في قاعدة البيانات من Edge Function)
    هذا endpoint يتحقق من صحة البيانات فقط
    """
    # التحقق من صحة البيانات
    if request.campaign_type not in ['groups', 'members', 'mixed']:
        raise HTTPException(status_code=400, detail="Invalid campaign_type. Must be 'groups', 'members', or 'mixed'")
    
    if request.target_type not in ['groups', 'members', 'both']:
        raise HTTPException(status_code=400, detail="Invalid target_type. Must be 'groups', 'members', or 'both'")
    
    if request.distribution_strategy not in ['equal', 'round_robin', 'random', 'weighted']:
        raise HTTPException(status_code=400, detail="Invalid distribution_strategy")
    
    if not request.session_ids:
        raise HTTPException(status_code=400, detail="At least one session_id is required")
    
    if request.delay_between_messages_min > request.delay_between_messages_max:
        raise HTTPException(status_code=400, detail="delay_between_messages_min must be <= delay_between_messages_max")
    
    # التحقق من وجود targets
    if request.target_type in ['groups', 'both'] and not request.selected_groups:
        raise HTTPException(status_code=400, detail="selected_groups is required for this target_type")
    
    if request.target_type in ['members', 'both'] and not request.selected_members:
        raise HTTPException(status_code=400, detail="selected_members is required for this target_type")
    
    return {
        "success": True,
        "message": "Campaign data validated successfully",
        "campaign": {
            "name": request.name,
            "campaign_type": request.campaign_type,
            "target_type": request.target_type,
            "total_sessions": len(request.session_ids),
            "total_groups": len(request.selected_groups) if request.selected_groups else 0,
            "total_members": len(request.selected_members) if request.selected_members else 0
        }
    }

@app.post("/campaigns/start/{campaign_id}")
async def start_campaign(campaign_id: str):
    """
    بدء تنفيذ الحملة (يجب أن يتم استدعاؤه من Edge Function مع بيانات الحملة)
    """
    # هذا endpoint يحتاج بيانات الحملة من قاعدة البيانات
    # سيتم تنفيذه في Edge Function
    return {
        "success": True,
        "message": "Campaign start endpoint - to be implemented in Edge Function",
        "campaign_id": campaign_id
    }

@app.post("/campaigns/pause/{campaign_id}")
async def pause_campaign(campaign_id: str):
    """
    إيقاف الحملة مؤقتاً
    """
    return {
        "success": True,
        "message": "Campaign pause endpoint - to be implemented in Edge Function",
        "campaign_id": campaign_id
    }

@app.post("/campaigns/resume/{campaign_id}")
async def resume_campaign(campaign_id: str):
    """
    استئناف الحملة
    """
    return {
        "success": True,
        "message": "Campaign resume endpoint - to be implemented in Edge Function",
        "campaign_id": campaign_id
    }

@app.post("/members/transfer-batch")
async def transfer_members_batch(request: TransferMembersBatchRequest):
    """
    نقل دفعة من الأعضاء مع توزيع ذكي وتأخير ذكي
    """
    try:
        if not request.session_ids or not request.member_ids:
            raise HTTPException(status_code=400, detail="session_ids and member_ids are required")
        
        # توزيع المهام بين الجلسات
        distributed_members = distribute_tasks(
            request.member_ids,
            request.session_ids,
            request.distribution_strategy
        )
        
        results = {
            "transferred": [],
            "failed": [],
            "total_requested": len(request.member_ids),
            "total_transferred": 0,
            "total_failed": 0,
            "session_results": {}
        }
        
        # معالجة كل جلسة
        for session_id, member_ids in distributed_members.items():
            if not member_ids:
                continue
            
            session_string = request.session_strings.get(session_id)
            api_id = request.api_ids.get(session_id)
            api_hash = request.api_hashes.get(session_id)
            
            if not all([session_string, api_id, api_hash]):
                results["failed"].extend([
                    {"member_id": mid, "error": f"Missing session data for {session_id}"}
                    for mid in member_ids
                ])
                continue
            
            try:
                # إنشاء client
                client = TelegramClient(
                    StringSession(session_string),
                    int(api_id),
                    api_hash
                )
                
                await client.connect()
                
                if not await client.is_user_authorized():
                    await client.disconnect()
                    results["failed"].extend([
                        {"member_id": mid, "error": "Session expired or invalid"}
                        for mid in member_ids
                    ])
                    continue
                
                # البحث عن المجموعات
                try:
                    source_entity = await client.get_entity(request.source_group_id)
                    target_entity = await client.get_entity(request.target_group_id)
                except Exception as e:
                    await client.disconnect()
                    results["failed"].extend([
                        {"member_id": mid, "error": f"Group not found: {str(e)}"}
                        for mid in member_ids
                    ])
                    continue
                
                # نقل الأعضاء
                session_transferred = []
                session_failed = []
                
                for member_id in member_ids:
                    try:
                        # تأخير ذكي قبل كل عملية نقل
                        delay = smart_delay(request.delay_min, request.delay_max, variation=True)
                        await asyncio.sleep(delay)
                        
                        # الحصول على معلومات العضو
                        user = await client.get_entity(member_id)
                        
                        # إضافة العضو إلى المجموعة الهدف
                        await client(AddChatUserRequest(
                            chat_id=target_entity.id,
                            user_id=user.id
                        ))
                        
                        session_transferred.append({
                            "telegram_user_id": member_id,
                            "username": getattr(user, 'username', None),
                            "first_name": getattr(user, 'first_name', None)
                        })
                        
                    except FloodWaitError as e:
                        wait_time = e.seconds
                        session_failed.append({
                            "telegram_user_id": member_id,
                            "error": f"Rate limit: wait {wait_time} seconds"
                        })
                        await asyncio.sleep(wait_time)
                    except Exception as e:
                        error_msg = str(e)
                        session_failed.append({
                            "telegram_user_id": member_id,
                            "error": error_msg
                        })
                
                await client.disconnect()
                
                results["transferred"].extend(session_transferred)
                results["failed"].extend(session_failed)
                results["session_results"][session_id] = {
                    "transferred": len(session_transferred),
                    "failed": len(session_failed)
                }
                
            except Exception as e:
                results["failed"].extend([
                    {"member_id": mid, "error": f"Session error: {str(e)}"}
                    for mid in member_ids
                ])
        
        results["total_transferred"] = len(results["transferred"])
        results["total_failed"] = len(results["failed"])
        
        return {
            "success": True,
            "data": results,
            "message": f"تم نقل {results['total_transferred']} عضو بنجاح"
        }
    
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
