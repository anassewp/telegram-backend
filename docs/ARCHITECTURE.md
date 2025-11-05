# بنية المشروع - SocialProMax

## 📋 نظرة عامة

هذا المستند يشرح البنية التقنية الكاملة لمشروع SocialProMax، بما في ذلك المعمارية، التدفقات، والتفاصيل التقنية.

---

## 🏗️ المعمارية العامة

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Pages     │  │ Components  │  │    Lib      │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
│         │                │                │             │
│         └────────────────┴────────────────┘             │
│                        │                                │
│         ┌───────────────▼───────────────┐              │
│         │   Supabase Client (JS)        │              │
│         └───────────────┬───────────────┘              │
└─────────────────────────┼──────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
┌───────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
│   Supabase   │  │   Supabase  │  │  Telegram   │
│   Database   │  │  Edge Funcs │  │   Backend   │
│ (PostgreSQL) │  │   (Deno)    │  │  (FastAPI)  │
└──────────────┘  └─────────────┘  └─────────────┘
```

---

## 📁 هيكل المشروع التفصيلي

### 1. Frontend (`socialpro-saas/`)

```
socialpro-saas/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # الصفحة الرئيسية
│   ├── layout.tsx                # Layout الرئيسي
│   ├── login/                    # تسجيل الدخول
│   ├── signup/                   # التسجيل
│   ├── dashboard/                # لوحة التحكم
│   │   ├── layout.tsx           # Layout للوحة التحكم
│   │   ├── page.tsx             # الصفحة الرئيسية للوحة
│   │   └── telegram/            # صفحات Telegram
│   │       ├── page.tsx         # صفحة Telegram الرئيسية
│   │       ├── sessions/        # إدارة الجلسات
│   │       ├── groups/          # إدارة المجموعات
│   │       ├── members-extraction/  # استخراج الأعضاء
│   │       ├── members-transfer/   # نقل الأعضاء
│   │       └── campaigns/           # إدارة الحملات
│   ├── admin/                    # لوحة الإدارة
│   └── ...
├── components/                    # مكونات React
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   └── telegram-group-filter.tsx # فلتر المجموعات
├── lib/                          # مكتبات مساعدة
│   ├── supabase.ts               # Supabase Client
│   └── telegram-api.ts           # Telegram API Helpers
└── public/                       # ملفات عامة
```

#### التقنيات المستخدمة:
- **Next.js 14** - App Router
- **TypeScript** - Type Safety
- **Tailwind CSS** - Styling
- **React Hook Form + Zod** - Form Management
- **Recharts** - Charts & Analytics

---

### 2. Telegram Backend (`telegram-backend/`)

```
telegram-backend/
├── main.py                       # FastAPI Application
├── requirements.txt              # Python Dependencies
└── README.md                     # دليل Backend
```

#### الملف الرئيسي: `main.py`

**الوظائف الرئيسية:**

1. **إدارة الجلسات:**
   - `/auth/send-code` - إرسال رمز التحقق
   - `/auth/verify-code` - التحقق من الرمز (2FA support)

2. **البحث والاستيراد:**
   - `/groups/search` - البحث العالمي في المجموعات
   - `/groups/import/{session_id}` - استيراد مجموعات من جلسة

3. **إدارة المجموعات:**
   - `/groups/join` - الانضمام لمجموعة
   - `/members/extract` - استخراج الأعضاء

4. **نقل الأعضاء:**
   - `/members/transfer` - نقل أعضاء بين مجموعات

5. **إرسال الرسائل:**
   - `/messages/send` - إرسال رسالة لمجموعة
   - `/messages/send-to-member` - إرسال رسالة لعضو

**التقنيات المستخدمة:**
- **FastAPI** - REST API Framework
- **Telethon 1.38.1** - Telegram Client Library
- **Python 3.11** - Programming Language
- **Uvicorn** - ASGI Server

---

### 3. Supabase (`supabase/`)

#### 3.1 Edge Functions (`supabase/functions/`)

```
supabase/functions/
├── telegram-search-groups/              # البحث العالمي
├── telegram-import-groups/               # استيراد من البحث
├── telegram-import-groups-from-session/ # استيراد من الجلسة
├── telegram-extract-members/            # استخراج الأعضاء
├── telegram-join-group/                 # الانضمام لمجموعة
├── telegram-send-message/               # إرسال رسائل
├── telegram-transfer-members/            # نقل أعضاء
├── telegram-transfer-members-batch/      # نقل أعضاء (مجموعات)
├── telegram-campaign-create/            # إنشاء حملة
├── telegram-campaign-start/             # بدء حملة
├── telegram-campaign-pause/             # إيقاف حملة
├── telegram-campaign-resume/            # استئناف حملة
├── telegram-campaign-send-batch/        # إرسال دفعة
├── create-admin-user/                   # إنشاء admin
├── create-bucket-avatars-temp/          # إنشاء bucket
├── create-bucket-campaign-files-temp/   # إنشاء bucket
└── create-bucket-reports-temp/          # إنشاء bucket
```

**كل Edge Function:**
- يستخدم **Deno Runtime**
- يتصل بـ **Telegram Backend** عبر HTTP
- يتصل بـ **Supabase Database** عبر REST API
- يدعم **CORS** للطلبات من Frontend

#### 3.2 Database Migrations (`supabase/migrations/`)

**الجداول الرئيسية:**

**1. جداول المستخدمين:**
- `profiles` - ملفات المستخدمين
- `users` - المستخدمين الأساسيين
- `subscriptions` - الاشتراكات
- `subscription_plans` - خطط الاشتراك

**2. جداول Telegram:**
- `telegram_sessions` - جلسات Telegram
- `telegram_groups` - المجموعات المستوردة
- `telegram_members` - الأعضاء المستخرجين
- `telegram_campaigns` - الحملات
- `telegram_campaign_messages` - رسائل الحملات
- `telegram_member_transfers` - عمليات نقل الأعضاء
- `telegram_sent_members` - الأعضاء المرسل لهم

**3. جداول أخرى:**
- `campaigns` - الحملات العامة
- `contacts` - جهات الاتصال
- `reports` - التقارير
- `notifications` - الإشعارات

---

## 🔄 تدفقات البيانات

### 1. إضافة جلسة Telegram

```
Frontend → Supabase Auth → Edge Function
    ↓
Telegram Backend (FastAPI)
    ↓
Telegram API (Telethon)
    ↓
Supabase Database (Save Session)
    ↓
Frontend (Display Success)
```

### 2. البحث عن المجموعات

```
Frontend → Edge Function (telegram-search-groups)
    ↓
Telegram Backend (/groups/search)
    ↓
Telegram API (SearchGlobalRequest)
    ↓
Edge Function → Frontend (Display Results)
```

### 3. استيراد المجموعات

```
Frontend → Edge Function (telegram-import-groups)
    ↓
Telegram Backend (/groups/import/{session_id})
    ↓
Telegram API (Get Dialogs)
    ↓
Edge Function → Supabase Database (Insert Groups)
    ↓
Frontend (Display Success)
```

### 4. استخراج الأعضاء

```
Frontend → Edge Function (telegram-extract-members)
    ↓
Telegram Backend (/members/extract)
    ↓
Telegram API (Get Participants)
    ↓
Edge Function → Supabase Database (Insert Members)
    ↓
Frontend (Display Members)
```

### 5. إنشاء وإرسال حملة

```
Frontend → Edge Function (telegram-campaign-create)
    ↓
Supabase Database (Create Campaign)
    ↓
Frontend → Edge Function (telegram-campaign-start)
    ↓
Edge Function (telegram-campaign-send-batch)
    ↓
Telegram Backend (/messages/send-to-member)
    ↓
Telegram API (Send Message)
    ↓
Supabase Database (Update Status)
    ↓
Frontend (Display Progress)
```

---

## 🔐 الأمان

### 1. Row Level Security (RLS)

جميع الجداول محمية بـ RLS Policies:

```sql
-- مثال: profiles table
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);
```

### 2. Authentication

- **Supabase Auth** - للمصادقة الأساسية
- **JWT Tokens** - للجلسات
- **2FA Support** - في Telegram Sessions

### 3. API Security

- **CORS** - محدد للـ Domains المسموحة
- **Rate Limiting** - في Render.com (Free Tier)
- **Input Validation** - في جميع Edge Functions

---

## 📊 قاعدة البيانات

### Schema Overview

```
┌─────────────┐
│   profiles   │───┐
└─────────────┘   │
                  │
┌─────────────┐   │   ┌──────────────┐
│ subscriptions│───┼───│subscription_│
└─────────────┘   │   │    plans     │
                  │   └──────────────┘
┌─────────────┐   │
│telegram_    │───┘
│  sessions   │
└─────────────┘
      │
      ├───┐
      │   │
┌─────▼───▼─────┐
│telegram_groups│
└───────┬───────┘
        │
        ├───┐
        │   │
┌───────▼───▼──────┐
│telegram_members  │
└──────────────────┘
```

### العلاقات الرئيسية:

- `profiles` → `telegram_sessions` (One-to-Many)
- `telegram_sessions` → `telegram_groups` (One-to-Many)
- `telegram_groups` → `telegram_members` (One-to-Many)
- `telegram_campaigns` → `telegram_campaign_messages` (One-to-Many)

---

## 🚀 الأداء

### 1. Frontend

- **Next.js 14** - Server-Side Rendering
- **Image Optimization** - تلقائي
- **Code Splitting** - تلقائي

### 2. Backend

- **FastAPI** - Async/Await
- **Connection Pooling** - في Supabase
- **Caching** - يمكن إضافته

### 3. Database

- **Indexes** - على جميع Foreign Keys
- **Query Optimization** - في Supabase
- **Connection Limits** - حسب Plan

---

## 📈 التوسع

### الحالي:
- Frontend: Vercel (Free Tier)
- Backend: Render.com (Free Tier)
- Database: Supabase (Free Tier)

### للتوسع:
1. **ترقية Render.com** - لتجنب "النوم"
2. **CDN** - لتحسين الأداء
3. **Caching Layer** - Redis
4. **Load Balancer** - للـ Backend

---

## 🔧 الصيانة

### 1. Logs

- **Frontend:** Vercel Dashboard → Logs
- **Backend:** Render Dashboard → Logs
- **Database:** Supabase Dashboard → Logs
- **Edge Functions:** Supabase Dashboard → Edge Functions → Logs

### 2. Monitoring

- **Vercel Analytics** - للـ Frontend
- **Render Metrics** - للـ Backend
- **Supabase Metrics** - للـ Database

### 3. Backups

- **Supabase** - Backups تلقائية (حسب Plan)
- **GitHub** - للكود
- **Manual Backups** - للبيانات المهمة

---

**آخر تحديث:** 2025-01-06

