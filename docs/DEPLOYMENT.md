# دليل النشر - SocialProMax

## 📋 نظرة عامة

هذا الدليل يشرح كيفية نشر SocialProMax على بيئة الإنتاج.

---

## 🎯 الخيارات المتاحة

### 1. Frontend (Next.js)
- ✅ **Vercel** (مُوصى به - مجاني)
- ✅ **Netlify** (مجاني)
- ✅ **VPS** (خادم خاص)

### 2. Telegram Backend (Python)
- ✅ **Render.com** (مجاني - Free Tier)
- ✅ **Railway** (مجاني - Free Tier)
- ✅ **VPS** (خادم خاص)

### 3. Database & Backend Services
- ✅ **Supabase** (Cloud - مجاني لحد معين)

---

## 🚀 الخيار 1: نشر Frontend على Vercel

### المتطلبات
- حساب [Vercel](https://vercel.com) (مجاني)
- GitHub repository للمشروع

### الخطوات

#### 1. رفع الكود على GitHub

```bash
cd socialpro-saas
git init
git add .
git commit -m "Initial SocialProMax Frontend"

# ربط مع GitHub
git remote add origin https://github.com/YOUR_USERNAME/socialpro-saas.git
git branch -M main
git push -u origin main
```

#### 2. ربط المشروع مع Vercel

1. اذهب إلى [Vercel Dashboard](https://vercel.com/dashboard)
2. اضغط "Add New Project"
3. اختر GitHub repository
4. املأ الإعدادات:
   ```
   Framework Preset: Next.js
   Root Directory: ./
   Build Command: npm run build
   Output Directory: .next
   ```

#### 3. إضافة Environment Variables

في Vercel Dashboard → Settings → Environment Variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_TELEGRAM_BACKEND_URL=https://your-backend.onrender.com
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

#### 4. النشر

1. اضغط "Deploy"
2. انتظر حتى يكتمل النشر (~2-3 دقائق)
3. ستحصل على URL: `https://your-app.vercel.app`

---

## 🐍 الخيار 2: نشر Telegram Backend على Render.com

### المتطلبات
- حساب [Render.com](https://render.com) (مجاني)
- GitHub repository للـ Backend

### الخطوات

#### 1. رفع الكود على GitHub

```bash
cd telegram-backend
git init
git add .
git commit -m "Initial Telegram Backend"

# ربط مع GitHub
git remote add origin https://github.com/YOUR_USERNAME/telegram-backend.git
git branch -M main
git push -u origin main
```

#### 2. إنشاء Web Service على Render

1. اذهب إلى [Render Dashboard](https://dashboard.render.com)
2. اضغط "New +" → "Web Service"
3. اختر GitHub repository
4. املأ الإعدادات:
   ```
   Name: socialpro-telegram-backend
   Environment: Python 3
   Region: (اختر أقرب منطقة)
   Branch: main
   Root Directory: ./
   Build Command: pip install -r requirements.txt
   Start Command: python main.py
   Plan: Free
   ```

#### 3. إضافة Environment Variables

في Render Dashboard → Environment:

```env
API_ID=your-api-id
API_HASH=your-api-hash
TELEGRAM_BACKEND_URL=https://your-backend.onrender.com
```

**ملاحظة:** على Free Tier، الخدمة "تنام" بعد 15 دقيقة عدم استخدام. أول طلب سيستغرق 30-60 ثانية للاستيقاظ.

#### 4. النشر

1. اضغط "Create Web Service"
2. انتظر حتى يكتمل النشر (~2-3 دقائق)
3. ستحصل على URL: `https://your-backend.onrender.com`

**اختبار Backend:**
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

---

## 🗄️ الخيار 3: إعداد Supabase

### 1. إنشاء مشروع جديد

1. اذهب إلى [Supabase Dashboard](https://app.supabase.com)
2. اضغط "New Project"
3. املأ المعلومات:
   - **Name:** SocialProMax Production
   - **Database Password:** (كلمة مرور قوية)
   - **Region:** (اختر أقرب منطقة للمستخدمين)

### 2. رفع Migrations

#### عبر Supabase CLI (مُوصى به):

```bash
# تثبيت Supabase CLI
npm install -g supabase

# تسجيل الدخول
supabase login

# ربط المشروع
supabase link --project-ref your-project-ref

# رفع جميع Migrations
supabase db push
```

#### عبر Supabase Dashboard:

1. اذهب إلى SQL Editor
2. افتح كل ملف migration من `supabase/migrations/` بالترتيب
3. قم بتشغيل كل migration

### 3. إعداد Storage Buckets

1. اذهب إلى Storage → Create Bucket
2. أنشئ 3 Buckets:
   - `avatars` (Public)
   - `campaign-files` (Private)
   - `reports` (Private)

### 4. نشر Edge Functions

```bash
# تسجيل الدخول
supabase login

# ربط المشروع
supabase link --project-ref your-project-ref

# نشر جميع Edge Functions
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

### 5. إعداد Environment Variables للـ Edge Functions

في Supabase Dashboard → Edge Functions → Settings:

```env
SUPABASE_URL=https://your-project.supabase.co
SERVICE_ROLE_KEY=your-service-role-key
TELEGRAM_BACKEND_URL=https://your-backend.onrender.com
```

---

## 🔄 تحديث التطبيق

### تحديث Frontend

```bash
cd socialpro-saas
git add .
git commit -m "Update: description"
git push origin main
```

Vercel سيُحدث التطبيق تلقائياً.

### تحديث Telegram Backend

```bash
cd telegram-backend
git add .
git commit -m "Update: description"
git push origin main
```

Render سيُحدث Backend تلقائياً (قد يستغرق 2-3 دقائق).

### تحديث Edge Functions

```bash
# تعديل Function
cd supabase/functions/telegram-search-groups

# نشر التحديث
supabase functions deploy telegram-search-groups
```

---

## 🔒 الأمان في الإنتاج

### 1. Environment Variables

✅ **لا ترفع `.env.local` أو `.env` على GitHub**
- أضف `.env*` إلى `.gitignore`
- استخدم Environment Variables في Vercel/Render

### 2. CORS Configuration

في `telegram-backend/main.py`:
```python
# في الإنتاج، حدد Domains فقط
allow_origins=[
    "https://your-app.vercel.app",
    "https://your-domain.com"
]
```

### 3. Supabase RLS

✅ تأكد من أن RLS Policies مفعلة على جميع الجداول
✅ راجع Policies في Supabase Dashboard → Authentication → Policies

### 4. Rate Limiting

✅ Render.com Free Tier لديه Rate Limiting تلقائي
✅ يمكن إضافة Rate Limiting في Edge Functions

---

## 📊 مراقبة الأداء

### Frontend (Vercel)

1. اذهب إلى Vercel Dashboard → Analytics
2. راجع:
   - Page Views
   - Response Times
   - Error Rates

### Telegram Backend (Render)

1. اذهب إلى Render Dashboard → Logs
2. راجع:
   - Request Logs
   - Error Logs
   - Response Times

### Supabase

1. اذهب إلى Supabase Dashboard → Database → Performance
2. راجع:
   - Query Performance
   - Database Size
   - Connection Pool

---

## 🔧 حل المشاكل

### مشكلة: Backend يعطي 502 Bad Gateway

**السبب:** Render.com Free Tier "ينام" الخدمة بعد 15 دقيقة

**الحل:**
1. افتح `https://your-backend.onrender.com/health` في المتصفح
2. انتظر 30-60 ثانية
3. حاول مرة أخرى

**للحل الدائم:** ترقية إلى Paid Plan

### مشكلة: Edge Functions لا تعمل

**الحل:**
1. تحقق من Environment Variables في Supabase
2. راجع Logs في Supabase Dashboard → Edge Functions → Logs
3. تأكد من أن `TELEGRAM_BACKEND_URL` صحيح

### مشكلة: CORS Errors

**الحل:**
1. تأكد من إضافة Domain في `telegram-backend/main.py`
2. تحقق من CORS headers في Edge Functions

---

## 📈 الترقية للإنتاج

### نصائح للترقية

1. **استخدم Paid Plans** للـ Backend (Render.com) لتجنب "النوم"
2. **أضف Custom Domain** للـ Frontend (Vercel)
3. **فعّل Monitoring** في Supabase
4. **أضف Error Tracking** (Sentry, LogRocket)
5. **أضف Analytics** (Google Analytics, Plausible)

---

## ✅ Checklist النشر

- [ ] Frontend منشور على Vercel
- [ ] Telegram Backend منشور على Render.com
- [ ] Supabase Migrations منشورة
- [ ] Edge Functions منشورة (17 function)
- [ ] Environment Variables مُعدة في جميع الخدمات
- [ ] CORS مُعد بشكل صحيح
- [ ] RLS Policies مفعلة
- [ ] Storage Buckets منشأة
- [ ] اختبار جميع الميزات
- [ ] مراقبة الأداء مفعلة

---

**آخر تحديث:** 2025-01-06

