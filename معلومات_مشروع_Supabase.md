# 📊 معلومات مشروع Supabase - SocialProMax

**تاريخ التحليل:** 2025-11-03

---

## 🎯 المشروع المستخدم في النظام

### معلومات المشروع الرئيسي:

```
Project ID: gigrtzamstdyynmvwljq
Project URL: https://gigrtzamstdyynmvwljq.supabase.co
Dashboard URL: https://supabase.com/dashboard/project/gigrtzamstdyynmvwljq
```

**⚠️ ملاحظة مهمة:** اسم المشروع الفعلي (كما سميته عند الإنشاء) لا يمكن معرفته من الكود. يجب الدخول إلى Supabase Dashboard لرؤية الاسم.

---

## 📍 كيفية معرفة اسم المشروع

### الطريقة 1: من Supabase Dashboard

1. اذهب إلى: https://supabase.com/dashboard
2. سجل دخول بحسابك
3. ابحث عن المشروع: `gigrtzamstdyynmvwljq`
4. اضغط على المشروع
5. اذهب إلى **Settings** > **General**
6. ستجد **Project Name** في الأعلى

### الطريقة 2: من URL

المشروع URL يحتوي على Project ID فقط:
- `https://gigrtzamstdyynmvwljq.supabase.co`

اسم المشروع الفعلي موجود فقط في Dashboard.

---

## 🔑 المفاتيح المستخدمة

### Anon Key (Public):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpZ3J0emFtc3RkeXlubXZ3bGpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMDg5MDMsImV4cCI6MjA3NzU4NDkwM30.OZMTpBkAK2Zc4m0CyOdBbHsoAV_MS7FK-OpQNvuxgmc
```

**المصدر:** `code/check_database_correct.py`

**⚠️ Service Role Key:** يجب الحصول عليه من Supabase Dashboard (Settings > API)

---

## 📊 محتويات المشروع

### الجداول (35+ جدول):
- ✅ 14 جدول أساسي (profiles, campaigns, platforms, إلخ)
- ✅ 2 جدول Telegram (telegram_sessions, telegram_groups)
- ✅ 2 جدول Telegram جديد (telegram_campaign_messages, telegram_members)
- ✅ 17+ جدول إضافي (analytics, metrics, إلخ)

### Storage Buckets (3):
- ✅ `avatars` (5 MB)
- ✅ `campaign-files` (50 MB)
- ✅ `reports` (10 MB)

### Edge Functions (9):
- ✅ `telegram-search-groups`
- ✅ `telegram-import-groups`
- ✅ `telegram-send-message` (جديد)
- ✅ `telegram-extract-members` (جديد)
- ✅ `telegram-transfer-members` (جديد)
- ✅ `create-admin-user`
- ✅ `create-bucket-avatars-temp`
- ✅ `create-bucket-campaign-files-temp`
- ✅ `create-bucket-reports-temp`

### RLS Policies:
- ✅ 20+ سياسة أمان على جميع الجداول

---

## 🔍 أماكن استخدام المشروع في الكود

### ملفات Python:
- ✅ `code/check_database_correct.py`
- ✅ `code/check_database.py`
- ✅ `code/check_storage.py`
- ✅ `code/create_storage_buckets.py`
- ✅ `code/verify_storage_creation.py`
- ✅ `code/advanced_storage_check.py`
- ✅ `code/analyze_core_data.py`
- ✅ `code/quick_db_check.py`

### ملفات Frontend:
- ✅ `lib/supabase.ts` (تم تحديثه)

### ملفات الوثائق:
- ✅ جميع ملفات الوثائق في `docs/`
- ✅ جميع ملفات التقارير

---

## 🎯 الخلاصة

**المشروع المستخدم:** `gigrtzamstdyynmvwljq`

**لرؤية اسم المشروع الفعلي:**
1. اذهب إلى: https://supabase.com/dashboard/project/gigrtzamstdyynmvwljq
2. Settings > General
3. ستجد **Project Name** في الأعلى

**Project ID هو:** `gigrtzamstdyynmvwljq`  
**اسم المشروع الفعلي:** موجود فقط في Dashboard (يجب تسجيل الدخول لرؤيته)

---

**تم تحديث:** `lib/supabase.ts` لاستخدام المشروع الصحيح ✅

