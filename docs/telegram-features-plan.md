# خطة تطوير نظام تيليجرام الكامل - SocialPro

## 📋 الميزات المطلوبة (من الصور المرفقة)

### 1. نظام جلسات تيليجرام
- صفحة عرض الجلسات (بطاقات)
- إضافة جلسة جديدة (Modal بخطوتين)
- حذف جلسة
- عرض حالة (نشط/غير نشط)

### 2. نظام إدارة المجموعات
- صفحة عرض المجموعات المستوردة
- استيراد مجموعات من جلسة محددة
- البحث عن مجموعات جديدة (Modal متقدم)
- استخراج الأعضاء من المجموعة
- تحديث بيانات المجموعة
- حذف مجموعة
- فرز وتصفية
- بحث داخلي

### 3. نظام الحملات التسويقية
- صفحة عرض الحملات
- إنشاء حملة جديدة
- إرسال رسائل مخصصة للأعضاء

### 4. لوحة التحكم الرئيسية
- بطاقات إحصائية (4 بطاقات)
- النشاط الأخير (Timeline)
- إجراءات سريعة

---

## 🗄️ الجداول المطلوبة

### 1. telegram_sessions
```sql
- id (uuid)
- user_id (uuid) → profiles
- phone_number (text)
- api_id (text)
- api_hash (text, encrypted)
- session_string (text, encrypted)
- name (text) - اسم المستخدم في تيليجرام
- username (text) - @username
- status (text) - 'active' | 'inactive'
- created_at (timestamp)
- updated_at (timestamp)
```

### 2. telegram_groups
```sql
- id (uuid)
- user_id (uuid) → profiles
- session_id (uuid) → telegram_sessions
- group_id (bigint) - معرف المجموعة في تيليجرام
- title (text) - اسم المجموعة
- username (text) - @username للمجموعة
- type (text) - 'group' | 'supergroup' | 'channel'
- members_count (integer)
- description (text)
- is_active (boolean)
- imported_at (timestamp)
- last_updated (timestamp)
```

### 3. telegram_members
```sql
- id (uuid)
- group_id (uuid) → telegram_groups
- user_id_telegram (bigint) - معرف العضو في تيليجرام
- username (text)
- first_name (text)
- last_name (text)
- phone (text)
- is_bot (boolean)
- is_premium (boolean)
- extracted_at (timestamp)
```

### 4. campaigns
```sql
- id (uuid)
- user_id (uuid) → profiles
- session_id (uuid) → telegram_sessions
- title (text)
- message_text (text)
- status (text) - 'draft' | 'active' | 'paused' | 'completed'
- total_targets (integer)
- sent_count (integer)
- failed_count (integer)
- created_at (timestamp)
- started_at (timestamp)
- completed_at (timestamp)
```

### 5. campaign_targets
```sql
- id (uuid)
- campaign_id (uuid) → campaigns
- member_id (uuid) → telegram_members
- status (text) - 'pending' | 'sent' | 'failed'
- sent_at (timestamp)
- error_message (text)
```

### 6. activity_log
```sql
- id (uuid)
- user_id (uuid) → profiles
- action_type (text) - 'session_added' | 'group_imported' | 'campaign_created' etc.
- description (text)
- created_at (timestamp)
```

---

## 🐍 Python Backend - الوظائف المطلوبة

### API Endpoints:

#### 1. إدارة الجلسات
- `POST /api/telegram/sessions/send-code` - إرسال كود التحقق
- `POST /api/telegram/sessions/verify-code` - التحقق من الكود وإنشاء الجلسة
- `GET /api/telegram/sessions` - جلب جميع الجلسات
- `DELETE /api/telegram/sessions/:id` - حذف جلسة
- `PUT /api/telegram/sessions/:id/status` - تحديث حالة الجلسة

#### 2. إدارة المجموعات
- `POST /api/telegram/groups/import/:session_id` - استيراد المجموعات من جلسة
- `POST /api/telegram/groups/search` - البحث عن مجموعات جديدة
- `GET /api/telegram/groups` - جلب المجموعات المستوردة
- `POST /api/telegram/groups/:id/extract-members` - استخراج الأعضاء
- `PUT /api/telegram/groups/:id/update` - تحديث بيانات المجموعة
- `DELETE /api/telegram/groups/:id` - حذف مجموعة

#### 3. إدارة الحملات
- `POST /api/telegram/campaigns` - إنشاء حملة جديدة
- `GET /api/telegram/campaigns` - جلب جميع الحملات
- `POST /api/telegram/campaigns/:id/start` - بدء إرسال الحملة
- `PUT /api/telegram/campaigns/:id/pause` - إيقاف الحملة مؤقتاً
- `DELETE /api/telegram/campaigns/:id` - حذف حملة

#### 4. الإحصائيات
- `GET /api/telegram/stats` - جلب الإحصائيات للوحة التحكم

---

## 📁 الصفحات المطلوبة (Frontend)

### 1. /dashboard/telegram (الصفحة الرئيسية لتيليجرام)
- عرض إحصائيات ملخصة
- النشاط الأخير
- إجراءات سريعة

### 2. /dashboard/telegram/sessions
- عرض جميع الجلسات
- Modal إضافة جلسة جديدة (خطوتين)
- حذف جلسة

### 3. /dashboard/telegram/groups
- عرض المجموعات المستوردة (بطاقات)
- Modal استيراد مجموعات
- Modal بحث عن مجموعات جديدة
- فرز وتصفية
- استخراج الأعضاء
- تحديث/حذف

### 4. /dashboard/telegram/campaigns
- عرض الحملات
- إنشاء حملة جديدة
- إدارة الحملات

### 5. /dashboard/telegram/members
- عرض جميع الأعضاء المستخرجين
- فلترة حسب المجموعة
- تصدير البيانات

---

## ⚙️ المكونات (Components) المطلوبة

### Modals:
1. `AddSessionModal` - إضافة جلسة (خطوتين)
2. `ImportGroupsModal` - استيراد مجموعات
3. `SearchGroupsModal` - البحث عن مجموعات جديدة
4. `CreateCampaignModal` - إنشاء حملة جديدة
5. `ExtractMembersModal` - استخراج أعضاء

### Cards:
1. `SessionCard` - بطاقة الجلسة
2. `GroupCard` - بطاقة المجموعة
3. `CampaignCard` - بطاقة الحملة
4. `StatsCard` - بطاقة إحصائيات
5. `ActivityItem` - عنصر النشاط

---

## 🔧 المكتبات المطلوبة

### Backend (Python):
- FastAPI
- Telethon (للتفاعل مع Telegram API)
- asyncpg (للاتصال بـ Supabase)
- python-dotenv
- cryptography (لتشفير session strings)
- uvicorn

### Frontend (React):
- recharts (للرسوم البيانية في التقارير)
- date-fns (لتنسيق التواريخ)

---

## 📦 التقدير الزمني

### المرحلة 1: قاعدة البيانات (15 دقيقة)
- إنشاء 6 جداول
- RLS policies
- Indexes

### المرحلة 2: Frontend - الصفحات والواجهات (90 دقيقة)
- 5 صفحات رئيسية
- 5 Modals
- 5 أنواع Cards
- Integration مع Supabase

### المرحلة 3: Python Backend (120 دقيقة)
- FastAPI setup
- Telethon integration
- 15+ endpoints
- Error handling
- Docker configuration

### المرحلة 4: التعليمات والنشر (20 دقيقة)
- README
- Deployment guide (Render.com)
- Environment variables
- Testing

**المدة الإجمالية المقدرة: ~4 ساعات**

---

## ⚠️ ملاحظات مهمة

1. **الأمان:**
   - تشفير session_string و api_hash في قاعدة البيانات
   - Rate limiting على الـ endpoints
   - Validation صارم للمدخلات

2. **Telegram API Limits:**
   - حد استخراج الأعضاء: 200 عضو/10 ثوانٍ
   - حد إرسال الرسائل: 30 رسالة/ثانية
   - تنفيذ Queue system للحملات

3. **Backend Deployment:**
   - Render.com (مجاني)
   - متطلبات: Python 3.10+
   - Environment: SUPABASE_URL, SUPABASE_KEY, TELEGRAM_API_ID, TELEGRAM_API_HASH

4. **تطوير تدريجي:**
   - يمكن البدء بالميزات الأساسية أولاً
   - ثم إضافة الميزات المتقدمة تدريجياً
