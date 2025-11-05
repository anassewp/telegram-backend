# 🔧 حل مشكلة Environment Variables في Supabase

**تاريخ:** 2025-11-03

---

## ❌ المشكلة:

Supabase لا يقبل اسم `SUPABASE_SERVICE_ROLE_KEY`

---

## ✅ الحلول:

### الحل 1: استخدام اسم بديل (مستحسن)

إذا كان Supabase لا يقبل `SUPABASE_SERVICE_ROLE_KEY`، استخدم اسم بديل:

**في Supabase Dashboard:**
- **Name:** `SERVICE_ROLE_KEY` (بدون SUPABASE_ في البداية)
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpZ3J0emFtc3RkeXlubXZ3bGpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjAwODkwMywiZXhwIjoyMDc3NTg0OTAzfQ.9wbREihcsQvLX5TS2Q_f6lxYNzBgdWNQS7wsZvYH6lc`

ثم سنقوم بتحديث الكود لاستخدام الاسم الجديد.

---

### الحل 2: استخدام Secrets بدلاً من Environment Variables

في Supabase، يمكنك استخدام **Secrets** بدلاً من Environment Variables:

1. اذهب إلى **Edge Functions** > **Settings**
2. ابحث عن قسم **Secrets** (بدلاً من Environment Variables)
3. أضف المتغير هناك باسم `SUPABASE_SERVICE_ROLE_KEY`

---

### الحل 3: التحقق من المتغيرات المتاحة تلقائياً

في Supabase Edge Functions، بعض المتغيرات متاحة تلقائياً:
- `SUPABASE_URL` - متاح تلقائياً
- `SUPABASE_ANON_KEY` - متاح تلقائياً

لكن `SUPABASE_SERVICE_ROLE_KEY` **يحتاج إضافته يدوياً**

---

## 🎯 الخطوات الموصى بها:

### الخطوة 1: جرب اسم بديل

أضف المتغير بهذا الاسم:
- **Name:** `SERVICE_ROLE_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpZ3J0emFtc3RkeXlubXZ3bGpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjAwODkwMywiZXhwIjoyMDc3NTg0OTAzfQ.9wbREihcsQvLX5TS2Q_f6lxYNzBgdWNQS7wsZvYH6lc`

### الخطوة 2: إذا نجح الاسم البديل

سأقوم بتحديث جميع Edge Functions لاستخدام الاسم الجديد.

---

## 📋 الأسماء المطلوبة:

### المتغيرات المطلوبة:

1. ✅ **TELEGRAM_BACKEND_URL**
   - Value: `http://localhost:8000`

2. ✅ **SUPABASE_URL**
   - Value: `https://gigrtzamstdyynmvwljq.supabase.co`
   - **ملاحظة:** قد يكون متاح تلقائياً، لا حاجة لإضافته

3. ⚠️ **SERVICE_ROLE_KEY** (بدلاً من SUPABASE_SERVICE_ROLE_KEY)
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpZ3J0emFtc3RkeXlubXZ3bGpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjAwODkwMywiZXhwIjoyMDc3NTg0OTAzfQ.9wbREihcsQvLX5TS2Q_f6lxYNzBgdWNQS7wsZvYH6lc`

---

## 🔄 التحديثات المطلوبة:

بعد إضافة المتغير بالاسم البديل، سأقوم بتحديث الكود لاستخدام:
- `SERVICE_ROLE_KEY` بدلاً من `SUPABASE_SERVICE_ROLE_KEY`

---

## ❓ أسئلة:

1. **ما هي الرسالة التي تظهر عند محاولة إضافة `SUPABASE_SERVICE_ROLE_KEY`؟**
   - هل تقول "اسم غير صحيح"؟
   - أم "متغير محجوز"؟
   - أم رسالة أخرى؟

2. **هل جربت إضافة `SERVICE_ROLE_KEY` (بدون SUPABASE_)?**
   - إذا نجح، أخبرني وسأقوم بتحديث الكود

---

**جرب الحل 1 أولاً (استخدام `SERVICE_ROLE_KEY`) وأخبرني بالنتيجة!** 🎯

