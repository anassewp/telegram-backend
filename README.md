# SocialProMax - منصة إدارة وسائل التواصل الاجتماعي 🚀

<div align="center">

![SocialProMax Banner](https://img.shields.io/badge/SocialProMax-Social%20Media%20Platform-9D4EDD?style=for-the-badge)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python)](https://www.python.org/)

### منصة شاملة لإدارة وسائل التواصل الاجتماعي مع تكامل تليجرام متقدم

[📖 التوثيق الكامل](#-التوثيق) • [🚀 الإعداد السريع](#-البدء-السريع) • [📱 Telegram Integration](#-تكامل-تليجرام)

</div>

---

## 📋 نظرة عامة

**SocialProMax** هي منصة SaaS متطورة لإدارة جميع حساباتك على وسائل التواصل الاجتماعي في مكان واحد، مع ميزات متقدمة للأتمتة والتحليلات والتكامل الكامل مع Telegram.

### ✨ الميزات الرئيسية

#### 🌐 دعم 15+ منصة اجتماعية
- **المراسلة:** WhatsApp، Telegram، Discord
- **التواصل الاجتماعي:** Facebook، Instagram، Twitter (X)، LinkedIn، TikTok، Pinterest، Snapchat، Reddit
- **الفيديو:** YouTube، Facebook Video، Instagram Reels

#### 💼 إدارة متقدمة
- ✅ إدارة حملات تسويقية متعددة
- ✅ قاعدة بيانات جهات اتصال ذكية
- ✅ جدولة منشورات تلقائية
- ✅ تحليلات وتقارير شاملة
- ✅ نظام نقاط ومكافآت
- ✅ تكامل Telegram كامل ومتقدم

#### 🤖 التكامل مع Telegram (مميز فريد)
- **إدارة الجلسات المتعددة** - إضافة وحذف جلسات Telegram
- **البحث العالمي** - البحث في جميع المجموعات والقنوات
- **استيراد المجموعات** - من الجلسات أو البحث العالمي
- **استخراج الأعضاء** - استخراج قوائم الأعضاء من المجموعات
- **نقل الأعضاء** - نقل أعضاء بين المجموعات
- **نظام الحملات** - إنشاء وإدارة حملات رسائل تلقائية
- **Edge Functions** - 17 وظيفة سحابية متقدمة

#### 💳 خطط اشتراك مرنة
| الخطة | السعر | المنصات | الحملات | جهات الاتصال | النقاط/شهر |
|------|------|---------|---------|--------------|-----------|
| 🆓 **مجاني** | $0 | 2 | 5 | 100 | 100 |
| 📅 **شهري** | $29.99 | 5 | 50 | 5,000 | 1,000 |
| 📆 **سنوي** | $299.99 | 10 | 200 | 20,000 | 15,000 |
| ♾️ **مدى الحياة** | $999.99 | 15 | غير محدود | 100,000 | غير محدود |

---

## 🏗️ البنية التقنية

### Frontend Stack
```
Next.js 14 (App Router) + TypeScript + React 19
├── Tailwind CSS 3.4       # تصميم وأنماط
├── shadcn/ui + Radix      # مكونات UI
├── Recharts 2.15          # رسوم بيانية تفاعلية
├── Lucide React           # أيقونات
└── React Hook Form + Zod  # إدارة النماذج والتحقق
```

### Backend Stack
```
Supabase (Backend-as-a-Service)
├── PostgreSQL             # قاعدة بيانات
├── Supabase Auth          # مصادقة المستخدمين
├── Supabase Storage       # تخزين الملفات
├── Row Level Security     # أمان على مستوى الصفوف
└── Edge Functions (17)    # وظائف سحابية

Telegram Integration
├── FastAPI (Python 3.11)  # REST API Backend
├── Telethon 1.38.1       # Telegram Client Library
├── Render.com             # Hosting للـ Backend
└── Uvicorn                # ASGI Server
```

### قاعدة البيانات (20+ جدول)
```sql
-- جداول المستخدمين والاشتراكات
profiles, subscriptions, subscription_plans, plan_features

-- جداول المنصات والحسابات
platforms, social_accounts, user_platforms

-- جداول الحملات والأنشطة
campaigns, post_schedules, posts, activities

-- جداول Telegram
telegram_sessions, telegram_groups, telegram_members
telegram_campaigns, telegram_campaign_messages
telegram_member_transfers, telegram_sent_members

-- جداول أخرى
contacts, reports, notifications, invoices
points_transactions, analytics_daily, engagement_metrics
```

### Edge Functions (17 وظيفة)
```
Telegram Functions:
├── telegram-search-groups              # البحث العالمي
├── telegram-import-groups              # استيراد من البحث
├── telegram-import-groups-from-session # استيراد من الجلسة
├── telegram-extract-members             # استخراج الأعضاء
├── telegram-join-group                  # الانضمام للمجموعات
├── telegram-send-message               # إرسال رسائل
├── telegram-transfer-members            # نقل أعضاء
├── telegram-transfer-members-batch      # نقل أعضاء (مجموعات)
├── telegram-campaign-create            # إنشاء حملة
├── telegram-campaign-start              # بدء حملة
├── telegram-campaign-pause             # إيقاف حملة
├── telegram-campaign-resume            # استئناف حملة
└── telegram-campaign-send-batch       # إرسال دفعة من الحملة

Utility Functions:
├── create-admin-user                    # إنشاء مستخدم admin
├── create-bucket-avatars-temp           # إنشاء bucket للصور
├── create-bucket-campaign-files-temp    # إنشاء bucket للملفات
└── create-bucket-reports-temp           # إنشاء bucket للتقارير
```

---

## 🚀 البدء السريع

### المتطلبات الأساسية
- Node.js 18+ 
- Python 3.11+
- Git
- حساب Supabase
- حساب Render.com (للـ Telegram Backend)
- Telegram API credentials (api_id و api_hash)

### 1. استنساخ المشروع
```bash
git clone https://github.com/anassewp/telegram-backend.git
cd SocialProMax
```

### 2. إعداد Frontend
```bash
cd socialpro-saas
npm install
cp env.local.template .env.local
# تعديل .env.local وإضافة متغيرات Supabase
npm run dev
# http://localhost:3000
```

### 3. إعداد Telegram Backend
```bash
cd telegram-backend
pip install -r requirements.txt
cp .env.example .env
# تعديل .env وإضافة API credentials
python main.py
# http://localhost:8000
```

### 4. إعداد Supabase
1. إنشاء مشروع جديد على [Supabase](https://supabase.com)
2. تشغيل Migrations:
   ```bash
   supabase db push
   ```
3. نشر Edge Functions:
   ```bash
   supabase functions deploy telegram-search-groups
   # كرر لكل function
   ```

### 5. إعداد متغيرات البيئة

#### Frontend (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_TELEGRAM_BACKEND_URL=https://your-backend.onrender.com
```

#### Telegram Backend (.env)
```env
TELEGRAM_BACKEND_URL=https://your-backend.onrender.com
```

#### Supabase Edge Functions
```env
SUPABASE_URL=https://your-project.supabase.co
SERVICE_ROLE_KEY=your-service-role-key
TELEGRAM_BACKEND_URL=https://your-backend.onrender.com
```

---

## 📁 هيكل المشروع

```
SocialProMax/
├── 📁 socialpro-saas/              # Frontend (Next.js)
│   ├── app/                        # صفحات Next.js App Router
│   │   ├── dashboard/              # لوحة التحكم
│   │   │   └── telegram/          # صفحات Telegram
│   │   │       ├── sessions/      # إدارة الجلسات
│   │   │       ├── groups/        # إدارة المجموعات
│   │   │       ├── members-extraction/  # استخراج الأعضاء
│   │   │       ├── members-transfer/    # نقل الأعضاء
│   │   │       └── campaigns/           # إدارة الحملات
│   │   ├── admin/                 # لوحة الإدارة
│   │   └── ...
│   ├── components/                # مكونات React
│   │   └── telegram-group-filter.tsx
│   ├── lib/                       # مكتبات مساعدة
│   │   ├── supabase.ts
│   │   └── telegram-api.ts
│   └── public/                     # ملفات عامة
│
├── 📁 telegram-backend/            # Backend (FastAPI)
│   ├── main.py                    # التطبيق الرئيسي
│   ├── requirements.txt           # متطلبات Python
│   └── README.md                   # دليل Telegram Backend
│
├── 📁 supabase/                    # Supabase Configuration
│   ├── functions/                  # Edge Functions (17)
│   ├── migrations/                 # Database Migrations
│   └── tables/                     # Table Definitions
│
├── 📁 docs/                        # التوثيق الشامل
│   ├── SETUP.md                    # دليل الإعداد التفصيلي
│   ├── DEPLOYMENT.md               # دليل النشر
│   ├── ARCHITECTURE.md             # بنية المشروع
│   └── ...
│
├── 📁 data/                        # بيانات المشروع
│   ├── features.json
│   ├── platforms.json
│   └── pricing-plans.json
│
├── 📁 imgs/                        # الصور والأيقونات
│   └── platforms/                  # شعارات المنصات
│
└── 📄 README.md                    # هذا الملف
```

---

## 🔧 الميزات المتقدمة

### 🎯 تكامل Telegram المتطور

#### إدارة الجلسات
- إضافة جلسات عبر رمز التحقق (2FA support)
- عرض وإدارة جميع الجلسات
- حذف الجلسات بأمان

#### البحث والاستيراد
- **البحث العالمي:** البحث في جميع المجموعات والقنوات بدون قيود
- **استيراد من البحث:** استيراد المجموعات المختارة من نتائج البحث
- **استيراد من الجلسة:** استيراد جميع مجموعات جلسة معينة

#### إدارة الأعضاء
- **استخراج الأعضاء:** استخراج قوائم كاملة من المجموعات
- **نقل الأعضاء:** نقل أعضاء بين مجموعات مختلفة
- **فلترة ذكية:** فلترة حسب نوع المجموعة، ظهور الأعضاء، وغيرها

#### نظام الحملات
- **إنشاء حملات:** إنشاء حملات رسائل تلقائية
- **توزيع ذكي:** توزيع الأعضاء على الجلسات بشكل متوازن
- **تأخير ذكي:** تطبيق تأخيرات بين الرسائل لتجنب الحظر
- **تتبع الحالة:** متابعة حالة كل رسالة (pending/sent/failed)

---

## 📖 التوثيق

### 📚 الملفات الرئيسية
- **[SETUP.md](docs/SETUP.md)** - دليل الإعداد التفصيلي
- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** - دليل النشر على Render.com و Supabase
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - بنية المشروع وتفاصيل تقنية

### 📱 Telegram Integration
- **[Telegram Backend README](telegram-backend/README.md)** - دليل Telegram Backend
- **[TELEGRAM_DEVELOPMENT_PLAN.md](TELEGRAM_DEVELOPMENT_PLAN.md)** - خطة التطوير

---

## 🌍 النشر والتشغيل

### معلومات النشر الحالية
- **Frontend:** يمكن النشر على Vercel أو Netlify
- **Telegram Backend:** Render.com (Free Tier)
- **Database:** Supabase (Cloud)
- **Edge Functions:** Supabase Edge Functions

### روابط GitHub
- **Main Repository:** `https://github.com/anassewp/telegram-backend.git`
- **Telegram Backend:** موجود كـ submodule

---

## 🗺️ خارطة الطريق

### ✅ الإصدار الحالي: v1.0.0
- ✅ البنية الأساسية الكاملة
- ✅ 15+ منصة مدعومة
- ✅ تكامل Telegram متكامل (17 Edge Function)
- ✅ نظام الاشتراكات
- ✅ لوحة التحكم الشاملة
- ✅ نظام الحملات المتقدم
- ✅ استخراج ونقل الأعضاء

### 🔜 الإصدارات القادمة
- [ ] تكامل Stripe للمدفوعات
- [ ] تفعيل جدولة المنشورات
- [ ] إشعارات في الوقت الفعلي
- [ ] تصدير التقارير (PDF/CSV)
- [ ] تطبيق الهاتف (React Native)

---

## 🔒 الأمان

### ميزات الأمان المطبقة
- ✅ **Row Level Security (RLS)** - حماية على مستوى الصفوف
- ✅ **Supabase Auth** - مصادقة آمنة
- ✅ **CORS Protection** - حماية من الطلبات غير المصرح بها
- ✅ **Input Validation** - التحقق من المدخلات
- ✅ **Rate Limiting** - منع الهجمات
- ✅ **Session Security** - حماية الجلسات

---

## 📊 إحصائيات المشروع

```
المكونات:
├── 17 Edge Functions              # وظائف سحابية
├── 20+ جدول قاعدة بيانات          # نظام بيانات شامل
├── 3 Storage Buckets               # تخزين منظم
├── 15+ صفحة Frontend               # واجهة مستخدم كاملة
└── 1 Python Backend                # Telegram Integration

الكود:
├── TypeScript: ~85%                # كود قوي وآمن
├── Python: ~10%                    # Telegram Backend
└── SQL: ~5%                        # Database Migrations
```

---

## 🛠️ التطوير والمساهمة

### إضافة ميزة جديدة
1. إنشاء فرع جديد: `git checkout -b feature/new-feature`
2. تطوير الميزة
3. اختبار الميزة
4. إنشاء Pull Request

### معايير الكود
- استخدام TypeScript للـ Frontend
- اتباع Conventional Commits
- كتابة توثيق واضح
- إضافة اختبارات عند الإمكان

---

## 📞 الدعم

### الموارد
- 📖 **الوثائق:** ابدأ بقراءة [SETUP.md](docs/SETUP.md)
- 🔧 **المشاكل التقنية:** راجع [ARCHITECTURE.md](docs/ARCHITECTURE.md)
- 🚀 **النشر:** اتبع [DEPLOYMENT.md](docs/DEPLOYMENT.md)

### الموارد الخارجية
- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [FastAPI Docs](https://fastapi.tiangolo.com)
- [Telethon Docs](https://docs.telethon.dev)

---

<div align="center">

### 🌟 مشروع جاهز للإنتاج!

**SocialProMax - الحل الشامل لإدارة وسائل التواصل الاجتماعي مع Telegram مدمج**

**آخر تحديث:** 2025-01-06  
**الإصدار:** 1.0.0  
**الحالة:** 🟢 مستقر ويعمل بكفاءة عالية

صُنع بـ ❤️ باستخدام Next.js و Supabase و Telegram API

</div>
