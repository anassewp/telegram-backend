# 🔧 إصلاح خطأ 404 Not Found - Backend

**التاريخ:** 2025-01-05

---

## ⚠️ المشكلة

الخطأ: `404 Not Found` عند استدعاء:
- `/groups/search` → 404
- `/groups/import/{session_id}` → 404

---

## ✅ الحلول الممكنة

### 1. التحقق من Backend URL في Supabase

**الخطوات:**
1. افتح [Supabase Dashboard](https://supabase.com/dashboard/project/gigrtzamstdyynmvwljq)
2. Settings > Edge Functions > Environment Variables
3. تأكد من وجود `TELEGRAM_BACKEND_URL`
4. تأكد من أن القيمة صحيحة:
   - ✅ `https://socialpro-telegram-backend-xxxx.onrender.com` (بدون `/` في النهاية)
   - ❌ `https://socialpro-telegram-backend-xxxx.onrender.com/` (مع `/`)

---

### 2. اختبار Backend مباشرة

افتح في المتصفح:
```
https://socialpro-telegram-backend-xxxx.onrender.com/docs
```

**إذا ظهرت FastAPI docs:**
- ✅ Backend يعمل
- ✅ المشكلة في Environment Variable أو الاستدعاء

**إذا ظهر خطأ:**
- ❌ Backend غير يعمل أو URL غير صحيح
- ✅ يجب التحقق من Render Dashboard

---

### 3. اختبار Endpoint مباشرة

افتح Terminal وجرّب:

```bash
# استبدل YOUR_BACKEND_URL بالـ URL الخاص بك
curl https://socialpro-telegram-backend-xxxx.onrender.com/groups/search \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"session_string":"test","api_id":"123","api_hash":"test","query":"test"}'
```

**النتيجة المتوقعة:**
- إذا كان Endpoint موجود: response (حتى لو كان خطأ في البيانات)
- إذا كان 404: Endpoint غير موجود في Backend

---

### 4. التحقق من Backend Code

تأكد من أن Backend يحتوي على:

```python
@app.post("/groups/search")
async def search_groups(request: SearchGroupsRequest):
    ...

@app.post("/groups/import/{session_id}")
async def import_groups(session_id: str, api_id: str, api_hash: str, session_string: str):
    ...
```

---

### 5. التحقق من Render Logs

1. افتح [Render Dashboard](https://dashboard.render.com)
2. اختر خدمة Backend
3. انتقل إلى Logs
4. راقب الأخطاء عند محاولة الاستدعاء

---

## 🔍 المشاكل المحتملة

### المشكلة 1: Backend URL غير صحيح
**الأعراض:** 404 Not Found  
**الحل:** 
- تأكد من أن URL صحيح في Supabase Environment Variables
- تأكد من عدم وجود `/` في النهاية
- تأكد من أن Backend يعمل على Render

### المشكلة 2: Backend غير مشغّل
**الأعراض:** Connection refused أو Timeout  
**الحل:** 
- افتح Render Dashboard
- تأكد من أن Backend في حالة "Live"
- إذا كان "Sleeping"، استخدم Keep-Alive أو Upgrade Plan

### المشكلة 3: Endpoint غير موجود في Backend
**الأعراض:** 404 Not Found  
**الحل:** 
- تأكد من أن Backend Code يحتوي على `/groups/search` و `/groups/import/{session_id}`
- تأكد من نشر آخر تحديثات Backend على Render

### المشكلة 4: Environment Variable غير محدث
**الأعراض:** 404 Not Found  
**الحل:** 
- بعد إضافة/تحديث Environment Variable في Supabase، انتظر 2-3 دقائق
- أو أعد نشر Edge Functions

---

## 📝 الخطوات السريعة

1. ✅ افتح `https://socialpro-telegram-backend-xxxx.onrender.com/docs` في المتصفح
2. ✅ إذا ظهرت FastAPI docs، Backend يعمل
3. ✅ افتح Supabase Dashboard > Settings > Edge Functions > Environment Variables
4. ✅ تأكد من `TELEGRAM_BACKEND_URL` = `https://socialpro-telegram-backend-xxxx.onrender.com` (بدون `/`)
5. ✅ انتظر 2-3 دقائق
6. ✅ جرّب مرة أخرى

---

## 🆘 إذا استمرت المشكلة

إذا استمر الخطأ 404 بعد التحقق من كل شيء:

1. **تحقق من Render Logs:**
   - قد يكون Backend يحتاج إلى إعادة تشغيل
   - قد يكون هناك خطأ في Backend Code

2. **تحقق من Backend Code:**
   - تأكد من أن `main.py` يحتوي على جميع الـ endpoints
   - تأكد من نشر آخر تحديثات Backend

3. **جرّب Backend URL مختلف:**
   - ربما Backend منشور على URL مختلف
   - تحقق من Render Dashboard للحصول على URL الصحيح

---

**آخر تحديث:** 2025-01-05

