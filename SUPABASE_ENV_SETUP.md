# 🔧 إعداد Environment Variables في Supabase

**التاريخ:** 2025-01-05  
**Backend URL:** `https://socialpro-telegram-backend.onrender.com`

---

## ✅ الخطوات المطلوبة

### 1. إضافة TELEGRAM_BACKEND_URL في Supabase

1. افتح [Supabase Dashboard](https://supabase.com/dashboard/project/gigrtzamstdyynmvwljq)
2. انتقل إلى: **Settings** > **Edge Functions**
3. انتقل إلى: **Environment Variables**
4. أضف متغير جديد:
   ```
   Name: TELEGRAM_BACKEND_URL
   Value: https://socialpro-telegram-backend.onrender.com
   ```
5. **⚠️ مهم جداً:** لا تضيف `/` في نهاية URL!
6. اضغط **Save** أو **Add**

---

### 2. التحقق من Environment Variables

بعد الإضافة، يجب أن ترى:
- ✅ `TELEGRAM_BACKEND_URL` = `https://socialpro-telegram-backend.onrender.com`
- ✅ `SUPABASE_URL` = موجود
- ✅ `SERVICE_ROLE_KEY` = موجود

---

### 3. الانتظار

بعد إضافة Environment Variable:
- ⏳ انتظر **2-3 دقائق** حتى يتم تحديث Environment Variables في Supabase
- 🔄 أو يمكنك إعادة نشر Edge Functions (اختياري)

---

### 4. إعادة نشر Edge Functions (اختياري)

إذا أردت التأكد من أن Edge Functions تستخدم Environment Variable الجديد:

```bash
cd D:\SocialProMax\SocialProMax
npx supabase functions deploy telegram-search-groups --project-ref gigrtzamstdyynmvwljq
npx supabase functions deploy telegram-import-groups-from-session --project-ref gigrtzamstdyynmvwljq
```

---

## 🔍 التحقق من Backend

تم التحقق من Backend:
- ✅ URL: `https://socialpro-telegram-backend.onrender.com`
- ✅ Status: Online
- ✅ Endpoints موجودة:
  - `/groups/search` ✅
  - `/groups/import/{session_id}` ✅

---

## 📝 ملاحظات

1. **URL الصحيح:**
   - ✅ `https://socialpro-telegram-backend.onrender.com`
   - ❌ `https://socialpro-telegram-backend.onrender.com/` (لا `/`)

2. **بعد الإضافة:**
   - انتظر 2-3 دقائق
   - جرّب البحث والاستيراد مرة أخرى

3. **إذا استمرت المشكلة:**
   - تحقق من Supabase Logs
   - تحقق من Render Logs

---

**آخر تحديث:** 2025-01-05

