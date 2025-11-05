# 📝 شرح إضافة Environment Variables - خطوة بخطوة

**تاريخ:** 2025-11-03

---

## 🎯 الخطوة الثانية: إضافة Environment Variables

### ما هي Environment Variables؟
هي متغيرات بيئية تحتوي على معلومات مهمة (مثل URLs والمفاتيح) التي يحتاجها Edge Functions للعمل.

---

## 📋 الخطوات التفصيلية:

### الخطوة 1: فتح Supabase Dashboard

1. اذهب إلى: https://supabase.com/dashboard/project/gigrtzamstdyynmvwljq
2. سجل دخول بحسابك

---

### الخطوة 2: فتح إعدادات Edge Functions

1. من القائمة الجانبية، اضغط على **Edge Functions**
2. ستظهر قائمة بجميع Edge Functions
3. في الأعلى، ابحث عن زر **Settings** أو **⚙️ Settings** (أيقونة الترس)
4. اضغط عليه

---

### الخطوة 3: إضافة Environment Variables

ستجد قسم **Environment Variables** أو **Secrets**

#### أضف المتغيرات التالية:

1. **TELEGRAM_BACKEND_URL**
   - اضغط **Add new variable** أو **+ Add**
   - **Name:** `TELEGRAM_BACKEND_URL`
   - **Value:** `http://localhost:8000`
   - اضغط **Save**

2. **SUPABASE_URL**
   - اضغط **Add new variable** مرة أخرى
   - **Name:** `SUPABASE_URL`
   - **Value:** `https://gigrtzamstdyynmvwljq.supabase.co`
   - اضغط **Save**

3. **SUPABASE_SERVICE_ROLE_KEY**
   - اضغط **Add new variable** مرة أخرى
   - **Name:** `SUPABASE_SERVICE_ROLE_KEY`
   - **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpZ3J0emFtc3RkeXlubXZ3bGpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjAwODkwMywiZXhwIjoyMDc3NTg0OTAzfQ.9wbREihcsQvLX5TS2Q_f6lxYNzBgdWNQS7wsZvYH6lc`
   - اضغط **Save**

---

## 📸 كيف تبدو في Supabase Dashboard:

```
┌─────────────────────────────────────────┐
│ Edge Functions Settings                 │
├─────────────────────────────────────────┤
│ Environment Variables                   │
│                                         │
│ Name                    Value          │
│ ─────────────────────────────────────  │
│ TELEGRAM_BACKEND_URL    http://local...│
│ SUPABASE_URL            https://gig... │
│ SUPABASE_SERVICE_ROLE_.. eyJhbGciOiJ... │
│                                         │
│ [+ Add new variable]                   │
└─────────────────────────────────────────┘
```

---

## ✅ التحقق من الإضافة:

بعد إضافة جميع المتغيرات، يجب أن ترى:
- ✅ `TELEGRAM_BACKEND_URL` موجود
- ✅ `SUPABASE_URL` موجود
- ✅ `SUPABASE_SERVICE_ROLE_KEY` موجود

---

## ⚠️ ملاحظات مهمة:

### 1. TELEGRAM_BACKEND_URL:
- إذا كان Backend يعمل محلياً: `http://localhost:8000`
- إذا كان Backend منشوراً على Render.com: استخدم URL الخاص به (مثل: `https://your-backend.onrender.com`)

### 2. SUPABASE_SERVICE_ROLE_KEY:
- هذا المفتاح حساس جداً ⚠️
- لا تشاركه مع أي شخص
- استخدمه فقط في Environment Variables

---

## 🎯 الخلاصة:

1. ✅ اذهب إلى Supabase Dashboard
2. ✅ افتح Edge Functions > Settings
3. ✅ أضف المتغيرات الثلاثة المذكورة أعلاه
4. ✅ احفظ كل متغير

---

**تم!** الآن Edge Functions جاهزة للعمل 🎉

