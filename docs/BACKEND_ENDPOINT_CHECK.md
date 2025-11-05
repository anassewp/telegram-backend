# 🔍 التحقق من Backend Endpoints

**التاريخ:** 2025-01-05

---

## ⚠️ المشكلة

الخطأ: `404 Not Found` عند استدعاء:
- `/groups/search`
- `/groups/import/{session_id}`

---

## ✅ الحل

### الخطوة 1: التحقق من Backend URL

افتح Terminal وجرّب:

```bash
# استبدل YOUR_BACKEND_URL بالـ URL الخاص بك
curl https://socialpro-telegram-backend-xxxx.onrender.com/docs

# أو
curl https://socialpro-telegram-backend-xxxx.onrender.com/
```

**النتيجة المتوقعة:**
- إذا كان Backend يعمل، يجب أن يعود response 200
- إذا كان يعمل، يجب أن ترى FastAPI docs على `/docs`

---

### الخطوة 2: التحقق من Endpoints

افتح في المتصفح:
```
https://socialpro-telegram-backend-xxxx.onrender.com/docs
```

يجب أن ترى:
- ✅ `/groups/search` - POST
- ✅ `/groups/import/{session_id}` - POST
- ✅ `/groups/join` - POST
- ✅ `/messages/send` - POST
- ✅ `/members/extract` - POST
- وغيرها...

---

### الخطوة 3: اختبار Endpoint مباشرة

```bash
# اختبار /groups/search
curl -X POST https://socialpro-telegram-backend-xxxx.onrender.com/groups/search \
  -H "Content-Type: application/json" \
  -d '{
    "session_string": "test",
    "api_id": "12345678",
    "api_hash": "test",
    "query": "test",
    "limit": 10
  }'
```

**النتيجة المتوقعة:**
- إذا كان Endpoint موجود: response (حتى لو كان خطأ في البيانات)
- إذا كان Endpoint غير موجود: 404 Not Found

---

### الخطوة 4: التحقق من Environment Variable في Supabase

1. افتح [Supabase Dashboard](https://supabase.com/dashboard/project/gigrtzamstdyynmvwljq)
2. Settings > Edge Functions > Environment Variables
3. تأكد من:
   - **Name:** `TELEGRAM_BACKEND_URL`
   - **Value:** `https://socialpro-telegram-backend-xxxx.onrender.com` (بدون `/` في النهاية)

**⚠️ مهم:** لا تضيف `/` في نهاية URL!

---

### الخطوة 5: التحقق من Backend Logs

إذا كان Backend على Render:
1. افتح Render Dashboard
2. اختر خدمة Backend
3. انتقل إلى Logs
4. راقب الأخطاء عند محاولة الاستدعاء

---

## 🔧 المشاكل الشائعة

### 1. Backend URL غير صحيح
**الأعراض:** 404 Not Found  
**الحل:** تأكد من أن URL صحيح وأنه لا ينتهي بـ `/`

### 2. Backend غير مشغّل
**الأعراض:** Connection refused أو Timeout  
**الحل:** تأكد من أن Backend يعمل على Render

### 3. Endpoint غير موجود
**الأعراض:** 404 Not Found  
**الحل:** تأكد من أن Backend يحتوي على `/groups/search` و `/groups/import/{session_id}`

### 4. CORS Error
**الأعراض:** CORS policy error  
**الحل:** تأكد من أن Backend يدعم CORS (يجب أن يكون موجوداً في الكود)

---

## 📝 ملاحظات

1. **URL يجب أن يكون:**
   - ✅ `https://socialpro-telegram-backend-xxxx.onrender.com`
   - ❌ `https://socialpro-telegram-backend-xxxx.onrender.com/` (لا `/` في النهاية)

2. **Backend يجب أن يحتوي على:**
   - ✅ FastAPI app
   - ✅ CORS middleware
   - ✅ Endpoints المطلوبة

3. **بعد تحديث Environment Variable:**
   - قد تحتاج إلى الانتظار بضع دقائق
   - أو إعادة نشر Edge Functions

---

**آخر تحديث:** 2025-01-05

