# 🔧 إعداد Telegram Backend URL

**التاريخ:** 2025-01-05

---

## ⚠️ المشكلة

الخطأ الذي يظهر:
```
POST http://localhost:8000/auth/verify-code 400 (Bad Request)
POST https://gigrtzamstdyynmvwljq.supabase.co/functions/v1/telegram-search-groups 500
```

**السبب:** `TELEGRAM_BACKEND_URL` غير مضبوط في Supabase Environment Variables أو يشير إلى `localhost:8000` الذي غير متاح.

---

## ✅ الحل

### الخطوة 1: الحصول على Telegram Backend URL

إذا كان Telegram Backend منشور على Render أو أي خدمة أخرى:

1. افتح Dashboard الخاص بخدمة النشر (Render/Heroku/etc.)
2. انسخ URL الخاص بالـ Backend
3. مثال: `https://your-backend.onrender.com`

أو إذا كان Backend يعمل محلياً:
- يجب أن يكون متاح على الإنترنت (مثل استخدام ngrok)
- أو نشره على خدمة سحابية

---

### الخطوة 2: إضافة Environment Variable في Supabase

1. افتح [Supabase Dashboard](https://supabase.com/dashboard)
2. اختر مشروعك: `gigrtzamstdyynmvwljq`
3. انتقل إلى **Settings** > **Edge Functions**
4. ابحث عن **Environment Variables**
5. أضف متغير جديد:
   - **Name:** `TELEGRAM_BACKEND_URL`
   - **Value:** `https://your-backend-url.com` (URL الخاص بك)
6. احفظ التغييرات

---

### الخطوة 3: التحقق من Edge Functions

بعد إضافة Environment Variable، تأكد من أن Edge Functions تستخدمه:

الـ Edge Functions المتأثرة:
- ✅ `telegram-search-groups` - تم إصلاحها
- ✅ `telegram-import-groups-from-session` - تم إصلاحها
- ✅ `telegram-send-message`
- ✅ `telegram-extract-members`
- ✅ `telegram-transfer-members`
- ✅ جميع Campaign Edge Functions

---

## 🔍 التحقق من المشكلة

### 1. فحص Environment Variables في Supabase:

```bash
# في Supabase Dashboard
Settings > Edge Functions > Environment Variables
```

تأكد من وجود:
- `TELEGRAM_BACKEND_URL` = `https://your-backend-url.com`
- `SUPABASE_URL` = موجود
- `SERVICE_ROLE_KEY` = موجود

### 2. اختبار Backend URL:

```bash
# في Terminal
curl https://your-backend-url.com/health
# أو
curl https://your-backend-url.com/docs
```

يجب أن يعود response 200.

---

## 📝 ملاحظات

1. **إذا كان Backend محلي:**
   - لا يمكن استخدام `localhost:8000` من Supabase Edge Functions
   - يجب نشر Backend على خدمة سحابية (Render, Heroku, Railway, etc.)
   - أو استخدام ngrok للوصول المؤقت

2. **إذا كان Backend منشور:**
   - تأكد من أن URL صحيح
   - تأكد من أن Backend يعمل
   - تحقق من CORS settings في Backend

3. **بعد إضافة Environment Variable:**
   - قد تحتاج إلى إعادة نشر Edge Functions
   - أو الانتظار بضع دقائق حتى يتم تحديث Environment Variables

---

## 🚀 الخطوات السريعة

1. ✅ افتح Supabase Dashboard
2. ✅ Settings > Edge Functions > Environment Variables
3. ✅ أضف `TELEGRAM_BACKEND_URL` = `https://your-backend-url.com`
4. ✅ احفظ
5. ✅ جرّب مرة أخرى

---

**آخر تحديث:** 2025-01-05

