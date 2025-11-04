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
git commit -m "Initial Telegram Backend for SocialPro"
git branch -M main
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```

### الخطوة 3: إنشاء Web Service على Render

1. في لوحة تحكم Render، اضغط **New +** → **Web Service**
2. اربط GitHub repository الخاص بك
3. املأ التفاصيل:
   ```
   Name: socialpro-telegram-backend
   Environment: Python 3
   Build Command: pip install -r requirements.txt
   Start Command: python main.py
   Plan: Free
   ```
4. اضغط **Create Web Service**

### الخطوة 4: الحصول على URL النهائي

بعد النشر بنجاح، ستحصل على URL مثل:
```
https://socialpro-telegram-backend-xxxx.onrender.com
```

### الخطوة 5: ربط Backend مع Frontend

في مشروع `socialpro-saas`، أضف ملف `.env.local`:
```
NEXT_PUBLIC_TELEGRAM_BACKEND_URL=https://socialpro-telegram-backend-xxxx.onrender.com
```

أعد البناء والنشر:
```bash
npm run build
# ثم deploy
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
  "groups": [...],
  "total": 15
}
```

### 4. إرسال رسالة
```
POST /messages/send
```

**Body:**
```json
{
  "session_string": "1AQAAAABC...",
  "api_id": "12345678",
  "api_hash": "abcdef1234567890",
  "group_id": 123456789,
  "message": "نص الرسالة",
  "schedule_at": "2025-11-03T10:00:00Z" // optional
}
```

**Response:**
```json
{
  "success": true,
  "message_id": 12345,
  "message": "تم إرسال الرسالة بنجاح",
  "sent_at": "2025-11-03T10:00:00Z"
}
```

**Rate Limiting:** 20 رسالة في الدقيقة الواحدة لكل جلسة

### 5. استخراج الأعضاء
```
POST /members/extract
```

**Body:**
```json
{
  "session_string": "1AQAAAABC...",
  "api_id": "12345678",
  "api_hash": "abcdef1234567890",
  "group_id": 123456789,
  "limit": 100 // optional, default: 100
}
```

**Response:**
```json
{
  "success": true,
  "members": [...],
  "total": 95,
  "message": "تم استخراج 95 عضو بنجاح"
}
```

### 6. نقل الأعضاء
```
POST /members/transfer
```

**Body:**
```json
{
  "session_string": "1AQAAAABC...",
  "api_id": "12345678",
  "api_hash": "abcdef1234567890",
  "source_group_id": 123456789,
  "target_group_id": 987654321,
  "member_ids": [111111, 222222, 333333]
}
```

**Response:**
```json
{
  "success": true,
  "transferred": [...],
  "failed": [...],
  "total_requested": 3,
  "total_transferred": 2,
  "total_failed": 1,
  "message": "تم نقل 2 عضو بنجاح"
}
```

### 7. حذف جلسة
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

### 8. فحص الصحة
```
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "active_temp_clients": 2
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

## Rate Limiting

النظام يطبق Rate Limiting تلقائياً:
- **الرسائل:** 20 رسالة في الدقيقة الواحدة لكل جلسة
- **النقل:** تأخير 2 ثانية بين كل عملية نقل
- **الحماية:** معالجة FloodWaitError من Telegram تلقائياً

## معالجة الأخطاء

النظام يتعامل مع الأخطاء التالية:
- **FloodWaitError:** انتظار تلقائي
- **UserBannedInChannelError:** إرجاع خطأ واضح
- **Rate Limit Exceeded:** رسالة خطأ مع وقت الانتظار
- **Permission Denied:** رسالة خطأ واضحة
- **Session Expired:** إرجاع خطأ 401

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
- استخدام Redis لـ Rate Limiting في بيئة متعددة الخوادم
- إضافة Authentication للـ API
- Logging محسّن
- Monitoring و Alerting

## الدعم

في حال واجهت أي مشاكل:
1. تحقق من Logs في Render Dashboard
2. تأكد من API credentials صحيحة
3. تأكد من رقم الهاتف بالصيغة الدولية (+966...)
4. تحقق من Rate Limiting إذا كانت الرسائل تفشل
