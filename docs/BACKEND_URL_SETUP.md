# ✅ إعداد Backend URL في Supabase

**التاريخ:** 2025-01-05  
**Backend URL:** `https://socialpro-telegram-backend.onrender.com`

---

## ✅ التحقق من Backend

تم التحقق من أن Backend يعمل:
- ✅ URL: `https://socialpro-telegram-backend.onrender.com`
- ✅ Status: Online
- ✅ Service: Telegram Backend API
- ✅ Version: 1.0.0

---

## 🔧 الخطوات المطلوبة

### 1. إضافة Environment Variable في Supabase

1. افتح [Supabase Dashboard](https://supabase.com/dashboard/project/gigrtzamstdyynmvwljq)
2. انتقل إلى: **Settings** > **Edge Functions**
3. انتقل إلى: **Environment Variables**
4. أضف متغير جديد:
   - **Name:** `TELEGRAM_BACKEND_URL`
   - **Value:** `https://socialpro-telegram-backend.onrender.com`
5. **⚠️ مهم:** لا تضيف `/` في النهاية!
6. احفظ التغييرات

---

### 2. التحقق من Endpoints

افتح في المتصفح:
```
https://socialpro-telegram-backend.onrender.com/docs
```

يجب أن ترى FastAPI documentation مع جميع الـ endpoints:
- ✅ `POST /groups/search`
- ✅ `POST /groups/import/{session_id}`
- ✅ `POST /groups/join`
- ✅ `POST /messages/send`
- ✅ وغيرها...

---

### 3. اختبار Endpoint مباشرة

```bash
# اختبار /groups/search
curl -X POST https://socialpro-telegram-backend.onrender.com/groups/search \
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
- إذا كان 404: Endpoint غير موجود

---

### 4. الانتظار بعد إضافة Environment Variable

بعد إضافة `TELEGRAM_BACKEND_URL` في Supabase:
- ⏳ انتظر 2-3 دقائق حتى يتم تحديث Environment Variables
- 🔄 أو أعد نشر Edge Functions (اختياري)

---

## 📝 ملاحظات مهمة

1. **URL يجب أن يكون:**
   - ✅ `https://socialpro-telegram-backend.onrender.com`
   - ❌ `https://socialpro-telegram-backend.onrender.com/` (لا `/` في النهاية)

2. **بعد التحديث:**
   - انتظر 2-3 دقائق
   - جرّب البحث والاستيراد مرة أخرى

3. **إذا استمرت المشكلة:**
   - تحقق من Supabase Logs (Edge Functions logs)
   - تحقق من Render Logs (Backend logs)

---

## 🎯 الخطوات السريعة

1. ✅ Supabase Dashboard > Settings > Edge Functions > Environment Variables
2. ✅ أضف `TELEGRAM_BACKEND_URL` = `https://socialpro-telegram-backend.onrender.com`
3. ✅ احفظ
4. ⏳ انتظر 2-3 دقائق
5. ✅ جرّب البحث والاستيراد مرة أخرى

---

**آخر تحديث:** 2025-01-05

