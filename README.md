# Telegram Backend API

Backend service لإدارة اتصالات Telegram عبر Telethon API.

## المتطلبات

- Python 3.9 أو أحدث
- حساب Telegram
- API credentials من [my.telegram.org](https://my.telegram.org)

## التثبيت المحلي

1. تثبيت المتطلبات:
```bash
pip install -r requirements.txt
```

2. تشغيل السيرفر:
```bash
python main.py
```

السيرفر سيعمل على: `http://localhost:8000`

## النشر على Render.com (مجاناً)

### الخطوة 1: إنشاء حساب على Render.com

1. اذهب إلى [render.com](https://render.com)
2. سجل دخول باستخدام GitHub

### الخطوة 2: رفع الكود على GitHub

1. أنشئ repository جديد على GitHub
2. ارفع ملفات المشروع:
```bash
cd telegram-backend
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```

### الخطوة 3: إنشاء Web Service على Render

1. في لوحة تحكم Render، اضغط **New +** → **Web Service**
2. اربط GitHub repository الخاص بك
3. املأ التفاصيل:
   - **Name**: `telegram-backend` (أو أي اسم)
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python main.py`
   - **Plan**: `Free` (750 ساعة مجاناً شهرياً)

4. اضغط **Create Web Service**

### الخطوة 4: الحصول على URL النهائي

بعد النشر بنجاح، ستحصل على URL مثل:
```
https://telegram-backend-xxxx.onrender.com
```

### الخطوة 5: ربط Backend مع Frontend

في مشروع React الخاص بك، أضف متغير البيئة:

**`.env.local`**:
```
NEXT_PUBLIC_TELEGRAM_BACKEND_URL=https://telegram-backend-xxxx.onrender.com
```

ثم في الكود:
```typescript
const BACKEND_URL = process.env.NEXT_PUBLIC_TELEGRAM_BACKEND_URL;

// مثال: إرسال رمز التحقق
const response = await fetch(`${BACKEND_URL}/auth/send-code`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: '+966xxxxxxxxx',
    api_id: 'YOUR_API_ID',
    api_hash: 'YOUR_API_HASH',
  }),
});
```

## API Endpoints

### 1. إرسال رمز التحقق
```
POST /auth/send-code
```

**Body:**
```json
{
  "phone": "+966xxxxxxxxx",
  "api_id": "12345678",
  "api_hash": "abcdef1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "phone_code_hash": "xxxxx",
  "message": "تم إرسال رمز التحقق إلى تيليجرام"
}
```

### 2. التحقق من الرمز
```
POST /auth/verify-code
```

**Body:**
```json
{
  "phone": "+966xxxxxxxxx",
  "api_id": "12345678",
  "api_hash": "abcdef1234567890",
  "code": "12345",
  "password": "optional_2fa_password"
}
```

**Response:**
```json
{
  "success": true,
  "session_string": "1AQAAAABC...",
  "message": "تم التحقق بنجاح"
}
```

### 3. استيراد المجموعات
```
POST /groups/import/{session_id}?api_id=xxx&api_hash=xxx&session_string=xxx
```

**Response:**
```json
{
  "success": true,
  "groups": [
    {
      "group_id": 123456789,
      "title": "اسم المجموعة",
      "username": "group_username",
      "members_count": 1250,
      "type": "supergroup"
    }
  ],
  "total": 15
}
```

### 4. حذف جلسة
```
DELETE /sessions/{session_id}
```

**Response:**
```json
{
  "success": true,
  "message": "Session deleted successfully"
}
```

## الحصول على Telegram API Credentials

1. اذهب إلى [my.telegram.org](https://my.telegram.org)
2. سجل دخول برقم هاتفك
3. اضغط **API Development Tools**
4. املأ البيانات:
   - **App title**: اسم التطبيق (مثل: SocialPro)
   - **Short name**: اسم قصير (مثل: socialpro)
   - **Platform**: Other
5. اضغط **Create application**
6. احفظ:
   - **api_id**: رقم التطبيق
   - **api_hash**: كود الـ hash

⚠️ **مهم:** لا تشارك هذه البيانات مع أحد!

## ملاحظات مهمة

### Free Tier Limitations على Render.com:
- السيرفر ينام (sleep) بعد 15 دقيقة من عدم النشاط
- أول طلب بعد النوم قد يأخذ 30-60 ثانية
- 750 ساعة مجاناً شهرياً (كافية لاستخدام شخصي)

### الأمان:
- لا تحفظ API credentials في الكود
- استخدم Environment Variables
- في الإنتاج، استبدل `allow_origins=["*"]` بدومين موقعك الفعلي

### التحسينات المستقبلية:
- استخدام Redis لحفظ temp_clients بدلاً من الذاكرة
- إضافة Rate Limiting
- إضافة Authentication للـ API
- Logging محسّن

## الدعم

في حال واجهت أي مشاكل:
1. تحقق من Logs في Render Dashboard
2. تأكد من API credentials صحيحة
3. تأكد من رقم الهاتف بالصيغة الدولية (+966...)
