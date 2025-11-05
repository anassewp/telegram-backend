# 📦 دليل نشر Edge Functions - خطوة بخطوة

**تاريخ:** 2025-11-03

---

## 🎯 الهدف:

إعادة نشر Edge Functions المحدثة على Supabase

---

## 📋 الطريقة الأولى: من Supabase Dashboard (الأسهل)

### الخطوة 1: فتح Supabase Dashboard

1. اذهب إلى: https://supabase.com/dashboard/project/gigrtzamstdyynmvwljq
2. سجل دخول بحسابك

---

### الخطوة 2: فتح Edge Functions

1. من القائمة الجانبية، اضغط على **Edge Functions**
2. ستظهر قائمة بجميع Edge Functions الموجودة

---

### الخطوة 3: نشر Edge Function الجديد (telegram-import-groups-from-session)

هذا Edge Function **جديد**، يجب إنشاؤه:

#### أ) إنشاء Edge Function جديد:

1. اضغط **Deploy new function** أو **+ New Function**
2. ستظهر نافذة لإنشاء Function جديد

#### ب) إدخال البيانات:

1. **Function Name:** `telegram-import-groups-from-session`
2. **Code:** انسخ محتوى الملف `supabase/functions/telegram-import-groups-from-session/index.ts`
3. اضغط **Deploy**

---

### الخطوة 4: تحديث Edge Functions الموجودة

لـ Edge Functions الموجودة، يمكنك:

#### الطريقة أ) تحديث من الكود:

1. اضغط على اسم Edge Function (مثل `telegram-send-message`)
2. اضغط **Edit** أو **Update**
3. انسخ محتوى الملف المحدث من مجلد `supabase/functions/`
4. الصق الكود الجديد
5. اضغط **Deploy** أو **Save**

#### الطريقة ب) حذف وإعادة إنشاء:

1. اضغط على Edge Function
2. اضغط **Delete** أو **Remove**
3. أنشئ Edge Function جديد بنفس الاسم
4. انسخ الكود الجديد
5. اضغط **Deploy**

---

## 📋 الطريقة الثانية: من Supabase CLI (للمستخدمين المتقدمين)

### الخطوة 1: تثبيت Supabase CLI

```bash
npm install -g supabase
```

### الخطوة 2: تسجيل الدخول

```bash
supabase login
```

### الخطوة 3: ربط المشروع

```bash
supabase link --project-ref gigrtzamstdyynmvwljq
```

### الخطوة 4: نشر Edge Functions

```bash
# من مجلد المشروع
cd SocialProMax

# نشر Edge Functions
supabase functions deploy telegram-import-groups-from-session
supabase functions deploy telegram-send-message
supabase functions deploy telegram-extract-members
supabase functions deploy telegram-transfer-members
supabase functions deploy telegram-import-groups
supabase functions deploy telegram-search-groups
```

---

## 🎯 الطريقة الموصى بها (الأسهل):

### ✅ استخدم Supabase Dashboard (الطريقة الأولى)

**لأنها:**
- ✅ لا تحتاج تثبيت أي شيء
- ✅ واجهة بصرية سهلة
- ✅ يمكنك رؤية الكود مباشرة

---

## 📝 خطوات مفصلة للطريقة الأولى:

### 1. Edge Function الجديد: telegram-import-groups-from-session

1. **افتح الملف:** `SocialProMax/supabase/functions/telegram-import-groups-from-session/index.ts`
2. **انسخ الكود كاملاً** (Ctrl+A ثم Ctrl+C)
3. **في Supabase Dashboard:**
   - Edge Functions → Deploy new function
   - Function Name: `telegram-import-groups-from-session`
   - الصق الكود
   - اضغط Deploy

---

### 2. تحديث Edge Functions الموجودة:

#### أ) telegram-send-message:

1. **افتح الملف:** `SocialProMax/supabase/functions/telegram-send-message/index.ts`
2. **انسخ الكود كاملاً**
3. **في Supabase Dashboard:**
   - اضغط على `telegram-send-message`
   - اضغط Edit
   - استبدل الكود بالكود الجديد
   - اضغط Deploy

#### ب) telegram-extract-members:

1. **افتح الملف:** `SocialProMax/supabase/functions/telegram-extract-members/index.ts`
2. **انسخ الكود كاملاً**
3. **في Supabase Dashboard:**
   - اضغط على `telegram-extract-members`
   - اضغط Edit
   - استبدل الكود بالكود الجديد
   - اضغط Deploy

#### ج) telegram-transfer-members:

1. **افتح الملف:** `SocialProMax/supabase/functions/telegram-transfer-members/index.ts`
2. **انسخ الكود كاملاً**
3. **في Supabase Dashboard:**
   - اضغط على `telegram-transfer-members`
   - اضغط Edit
   - استبدل الكود بالكود الجديد
   - اضغط Deploy

#### د) telegram-import-groups:

1. **افتح الملف:** `SocialProMax/supabase/functions/telegram-import-groups/index.ts`
2. **انسخ الكود كاملاً**
3. **في Supabase Dashboard:**
   - اضغط على `telegram-import-groups`
   - اضغط Edit
   - استبدل الكود بالكود الجديد
   - اضغط Deploy

#### هـ) telegram-search-groups:

1. **افتح الملف:** `SocialProMax/supabase/functions/telegram-search-groups/index.ts`
2. **انسخ الكود كاملاً**
3. **في Supabase Dashboard:**
   - اضغط على `telegram-search-groups`
   - اضغط Edit
   - استبدل الكود بالكود الجديد
   - اضغط Deploy

---

## ✅ التحقق من النجاح:

بعد النشر، يجب أن ترى:
- ✅ جميع Edge Functions في القائمة
- ✅ حالة "Active" أو "Deployed"
- ✅ لا توجد أخطاء

---

## 🎯 الخلاصة:

1. ✅ اذهب إلى Supabase Dashboard
2. ✅ Edge Functions → Deploy new function (للجديد)
3. ✅ Edge Functions → Edit (للموجودة)
4. ✅ انسخ الكود من الملفات
5. ✅ الصق في Dashboard
6. ✅ اضغط Deploy

---

## ⚠️ ملاحظة مهمة:

**Edge Functions الجديدة التي يجب إنشاؤها:**
- `telegram-import-groups-from-session` (جديد - يجب إنشاؤه)

**Edge Functions الموجودة التي يجب تحديثها:**
- `telegram-send-message`
- `telegram-extract-members`
- `telegram-transfer-members`
- `telegram-import-groups`
- `telegram-search-groups`

---

**تم! الآن جرب الخطوات وأخبرني إذا واجهت أي مشكلة** 🚀

