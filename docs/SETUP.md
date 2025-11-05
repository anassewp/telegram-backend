# دليل الإعداد الشامل - SocialProMax

## 📋 نظرة عامة

هذا الدليل يشرح كيفية إعداد مشروع SocialProMax من الصفر على بيئة التطوير المحلية.

---

## 🎯 المتطلبات الأساسية

### البرمجيات المطلوبة
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Python** 3.11+ ([Download](https://www.python.org/downloads/))
- **Git** ([Download](https://git-scm.com/))
- **Supabase CLI** (اختياري للنشر المباشر)

### الحسابات المطلوبة
- حساب [Supabase](https://supabase.com) (مجاني)
- حساب [Render.com](https://render.com) (مجاني للـ Telegram Backend)
- Telegram API credentials (من [my.telegram.org](https://my.telegram.org))

---

## 📦 الخطوة 1: استنساخ المشروع

```bash
# استنساخ المشروع الرئيسي
git clone https://github.com/anassewp/telegram-backend.git
cd SocialProMax

# إذا كان telegram-backend هو submodule، قم بتحديثه:
git submodule update --init --recursive
```

---

## 🎨 الخطوة 2: إعداد Frontend (Next.js)

### 2.1 تثبيت الاعتماديات

```bash
cd socialpro-saas
npm install
```

### 2.2 إعداد متغيرات البيئة

```bash
# نسخ ملف القالب
cp env.local.template .env.local
```

قم بتعديل `.env.local` وإضافة:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Telegram Backend URL (سيتم إعدادها بعد نشر Backend)
NEXT_PUBLIC_TELEGRAM_BACKEND_URL=https://your-backend.onrender.com

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**كيفية الحصول على Supabase Credentials:**
1. اذهب إلى [Supabase Dashboard](https://app.supabase.com)
2. اختر مشروعك أو أنشئ مشروع جديد
3. اذهب إلى Settings → API
4. انسخ `Project URL` و `anon public` key

### 2.3 تشغيل المشروع

```bash
npm run dev
```

الموقع سيعمل على: `http://localhost:3000`

---

## 🐍 الخطوة 3: إعداد Telegram Backend (Python)

### 3.1 تثبيت متطلبات Python

```bash
cd telegram-backend
pip install -r requirements.txt
```

**ملاحظة:** يُفضل استخدام `venv`:

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

### 3.2 الحصول على Telegram API Credentials

1. اذهب إلى [my.telegram.org](https://my.telegram.org)
2. سجل الدخول برقم الهاتف
3. اذهب إلى "API development tools"
4. أنشئ تطبيق جديد واحصل على:
   - `api_id`
   - `api_hash`

### 3.3 إعداد متغيرات البيئة

أنشئ ملف `.env` في مجلد `telegram-backend`:

```env
# Telegram API Credentials (من my.telegram.org)
API_ID=your-api-id
API_HASH=your-api-hash

# Backend URL (بعد النشر على Render.com)
TELEGRAM_BACKEND_URL=https://your-backend.onrender.com
```

### 3.4 تشغيل Backend محلياً

```bash
python main.py
```

Backend سيعمل على: `http://localhost:8000`

**اختبار Backend:**
```bash
curl http://localhost:8000/health
```

يجب أن تحصل على:
```json
{
  "status": "healthy",
  "active_temp_clients": 0
}
```

---

## 🗄️ الخطوة 4: إعداد Supabase

### 4.1 إنشاء مشروع Supabase

1. اذهب إلى [Supabase Dashboard](https://app.supabase.com)
2. اضغط "New Project"
3. املأ المعلومات:
   - **Name:** SocialProMax
   - **Database Password:** (اختر كلمة مرور قوية)
   - **Region:** اختر أقرب منطقة
4. انتظر حتى يتم إنشاء المشروع (~2 دقيقة)

### 4.2 تشغيل Migrations

#### الطريقة الأولى: عبر Supabase Dashboard

1. اذهب إلى SQL Editor في Supabase Dashboard
2. افتح ملفات Migration من `supabase/migrations/` بالترتيب:
   - `1762010718_enable_rls_and_create_triggers.sql`
   - `1762010756_create_rls_policies.sql`
   - ... (جميع الملفات بالترتيب)
3. قم بتشغيل كل migration

#### الطريقة الثانية: عبر Supabase CLI

```bash
# تثبيت Supabase CLI
npm install -g supabase

# تسجيل الدخول
supabase login

# ربط المشروع
supabase link --project-ref your-project-ref

# رفع Migrations
supabase db push
```

### 4.3 إعداد Storage Buckets

1. اذهب إلى Storage في Supabase Dashboard
2. أنشئ 3 Buckets:
   - `avatars` (Public)
   - `campaign-files` (Private)
   - `reports` (Private)

**أو استخدم Edge Functions:**
```bash
supabase functions deploy create-bucket-avatars-temp
supabase functions deploy create-bucket-campaign-files-temp
supabase functions deploy create-bucket-reports-temp
```

### 4.4 نشر Edge Functions

```bash
# تسجيل الدخول
supabase login

# ربط المشروع
supabase link --project-ref your-project-ref

# نشر كل Edge Function
supabase functions deploy telegram-search-groups
supabase functions deploy telegram-import-groups
supabase functions deploy telegram-import-groups-from-session
supabase functions deploy telegram-extract-members
supabase functions deploy telegram-join-group
supabase functions deploy telegram-send-message
supabase functions deploy telegram-transfer-members
supabase functions deploy telegram-transfer-members-batch
supabase functions deploy telegram-campaign-create
supabase functions deploy telegram-campaign-start
supabase functions deploy telegram-campaign-pause
supabase functions deploy telegram-campaign-resume
supabase functions deploy telegram-campaign-send-batch
supabase functions deploy create-admin-user
```

**إعداد متغيرات البيئة للـ Edge Functions:**

في Supabase Dashboard:
1. اذهب إلى Edge Functions → Settings
2. أضف متغيرات البيئة:
   - `SUPABASE_URL`: https://your-project.supabase.co
   - `SERVICE_ROLE_KEY`: (من Settings → API)
   - `TELEGRAM_BACKEND_URL`: (بعد نشر Backend)

---

## 🚀 الخطوة 5: نشر Telegram Backend على Render.com

### 5.1 رفع الكود على GitHub

```bash
cd telegram-backend
git init
git add .
git commit -m "Initial Telegram Backend"

# ربط مع GitHub repository
git remote add origin https://github.com/YOUR_USERNAME/telegram-backend.git
git branch -M main
git push -u origin main
```

### 5.2 إنشاء Web Service على Render

1. اذهب إلى [Render Dashboard](https://dashboard.render.com)
2. اضغط "New +" → "Web Service"
3. اختر GitHub repository
4. املأ الإعدادات:
   ```
   Name: socialpro-telegram-backend
   Environment: Python 3
   Build Command: pip install -r requirements.txt
   Start Command: python main.py
   Plan: Free
   ```
5. أضف Environment Variables:
   ```
   API_ID=your-api-id
   API_HASH=your-api-hash
   ```
6. اضغط "Create Web Service"

### 5.3 انتظار النشر

سيستغرق النشر ~2-3 دقائق. ستحصل على URL مثل:
```
https://socialpro-telegram-backend-xxxx.onrender.com
```

**اختبار Backend:**
```bash
curl https://your-backend.onrender.com/health
```

### 5.4 تحديث متغيرات البيئة

بعد الحصول على Backend URL:

1. **في Frontend (.env.local):**
   ```env
   NEXT_PUBLIC_TELEGRAM_BACKEND_URL=https://your-backend.onrender.com
   ```

2. **في Supabase Edge Functions:**
   - اذهب إلى Edge Functions → Settings
   - أضف/حدث `TELEGRAM_BACKEND_URL`

---

## ✅ الخطوة 6: التحقق من الإعداد

### 6.1 اختبار Frontend

```bash
cd socialpro-saas
npm run dev
```

افتح `http://localhost:3000` وتحقق من:
- ✅ الصفحة الرئيسية تعمل
- ✅ يمكن التسجيل/تسجيل الدخول
- ✅ لوحة التحكم تظهر

### 6.2 اختبار Telegram Backend

```bash
curl https://your-backend.onrender.com/health
```

يجب أن تحصل على:
```json
{
  "status": "healthy",
  "active_temp_clients": 0
}
```

### 6.3 اختبار Supabase

1. اذهب إلى Supabase Dashboard
2. تحقق من:
   - ✅ الجداول موجودة (20+ جدول)
   - ✅ Storage Buckets موجودة (3 buckets)
   - ✅ Edge Functions منشورة (17 function)

### 6.4 اختبار Telegram Integration

1. سجل الدخول إلى التطبيق
2. اذهب إلى `/dashboard/telegram/sessions`
3. حاول إضافة جلسة جديدة:
   - أدخل رقم الهاتف
   - أدخل رمز التحقق من Telegram
   - يجب أن تُضاف الجلسة بنجاح

---

## 🔧 حل المشاكل الشائعة

### مشكلة: Frontend لا يتصل بـ Supabase

**الحل:**
- تحقق من `.env.local` وأن القيم صحيحة
- تأكد من أن Supabase Project نشط
- تحقق من CORS settings في Supabase

### مشكلة: Telegram Backend يعطي 502 Error

**الحل:**
- Render.com Free Tier ينام الخدمة بعد 15 دقيقة عدم استخدام
- افتح `https://your-backend.onrender.com/health` لاستيقاظ الخدمة
- انتظر 30-60 ثانية ثم حاول مرة أخرى

### مشكلة: Edge Functions لا تعمل

**الحل:**
- تحقق من Environment Variables في Supabase
- تأكد من أن `TELEGRAM_BACKEND_URL` صحيح
- راجع Logs في Supabase Dashboard

### مشكلة: Migrations فشلت

**الحل:**
- تأكد من تشغيل Migrations بالترتيب الصحيح
- تحقق من أخطاء SQL في Supabase Dashboard
- تأكد من أن RLS Policies تم إنشاؤها

---

## 📚 الخطوات التالية

بعد إكمال الإعداد:

1. ✅ اقرأ [DEPLOYMENT.md](DEPLOYMENT.md) للنشر على الإنتاج
2. ✅ اقرأ [ARCHITECTURE.md](ARCHITECTURE.md) لفهم البنية
3. ✅ راجع [TELEGRAM_DEVELOPMENT_PLAN.md](../TELEGRAM_DEVELOPMENT_PLAN.md) للميزات

---

## 🆘 الحصول على المساعدة

إذا واجهت مشاكل:

1. راجع [README.md](../README.md)
2. تحقق من [Supabase Docs](https://supabase.com/docs)
3. راجع Logs في:
   - Supabase Dashboard → Logs
   - Render Dashboard → Logs
   - Browser Console (F12)

---

**آخر تحديث:** 2025-01-06

