from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from telethon import TelegramClient
from telethon.sessions import StringSession
from telethon.errors import SessionPasswordNeededError
import os
from typing import List, Optional
import asyncio

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

# Dictionary to store temporary clients (في الإنتاج، استخدم Redis)
temp_clients = {}

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
