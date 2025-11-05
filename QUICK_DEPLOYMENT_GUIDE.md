# دليل النشر السريع - SocialProMax

## ⚠️ مهم جداً
عند عمل أي تعديلات، يجب رفعها على GitHub أو نشرها على Supabase حسب نوع الملف.

---

## 🔐 معلومات الاتصال بـ Git

**إعدادات Git الحالية:**
- `user.name`: `SocialPro`
- `user.email`: `socialpro@example.com`
- `remote.origin.url`: `https://github.com/anassewp/telegram-backend.git`

**ملاحظة:** عند الرفع لأول مرة أو إذا طُلب منك اسم المستخدم وكلمة المرور:
- استخدم **Personal Access Token** من GitHub بدلاً من كلمة المرور
- أو استخدم **SSH Keys** (الأكثر أماناً)

---

## 🎯 الأوامر الفعلية المستخدمة عند الرفع

**⚠️ مهم:** هذه هي الأوامر الفعلية التي يجب اتباعها عند رفع أي تعديل على GitHub.

### 1. عند تعديل `telegram-backend/main.py`:

```bash
# الانتقال إلى مجلد telegram-backend
cd telegram-backend

# التحقق من التغييرات
git status

# إضافة الملف المعدل فقط (لا ترفع كل شيء)
git add main.py

# إنشاء commit برسالة واضحة
git commit -m "feat: وصف التعديل"

# الرفع على GitHub
git push origin main
```

**مثال فعلي من عمليات الرفع السابقة:**
```bash
cd D:\SocialProMax\SocialProMax\telegram-backend
git add main.py
git commit -m "Improve group filtering logic for member visibility"
git push origin main
```

### 2. عند تعديل عدة ملفات في `telegram-backend/`:

```bash
cd telegram-backend
git add main.py requirements.txt  # ملفات محددة فقط
git commit -m "feat: تحديثات متعددة"
git push origin main
```

### 3. عند تعديل Frontend (`socialpro-saas/`):

```bash
# الانتقال إلى مجلد socialpro-saas
cd socialpro-saas

# التحقق من التغييرات
git status

# إضافة الملفات المعدلة (لا ترفع .env.local أو node_modules)
git add app/dashboard/telegram/campaigns/page.tsx
# أو لإضافة ملفات متعددة
git add app/dashboard/telegram/campaigns/

# إنشاء commit
git commit -m "feat: تحديث واجهة الحملات"

# الرفع على GitHub
git push origin main
```

### 4. عند إضافة Edge Function جديد:

```bash
# 1. نشر على Supabase أولاً
cd SocialProMax/SocialProMax
npx supabase functions deploy telegram-campaign-create --project-ref gigrtzamstdyynmvwljq

# 2. ثم رفع الكود على GitHub
git add supabase/functions/telegram-campaign-create/
git commit -m "feat: إضافة Edge Function telegram-campaign-create"
git push origin main
```

### 5. عند تعديل Edge Function موجود:

```bash
# 1. نشر على Supabase
cd SocialProMax/SocialProMax
npx supabase functions deploy telegram-send-message --project-ref gigrtzamstdyynmvwljq

# 2. رفع التعديلات على GitHub
git add supabase/functions/telegram-send-message/index.ts
git commit -m "fix: إصلاح خطأ في Edge Function"
git push origin main
```

### 6. عند إضافة Migration جديد:

```bash
# 1. تطبيق Migration على Supabase (عبر Dashboard أو CLI)
# 2. رفع ملف Migration على GitHub
cd SocialProMax/SocialProMax
git add supabase/migrations/20250105_add_telegram_campaigns_tables.sql
git commit -m "feat: إضافة جداول الحملات"
git push origin main
```

---

## ⚠️ قواعد مهمة عند الرفع

1. **لا ترفع كل شيء:**
   ```bash
   # ❌ سيء - يرفع كل شيء بما في ذلك ملفات غير مهمة
   git add .
   
   # ✅ جيد - رفع ملفات محددة فقط
   git add main.py
   git add app/dashboard/telegram/campaigns/page.tsx
   ```

2. **تحقق من التغييرات قبل الرفع:**
   ```bash
   git status  # دائماً قبل git add
   ```

3. **استخدم رسائل commit واضحة:**
   ```bash
   # ✅ جيد
   git commit -m "feat: إضافة نظام الحملات المتقدم"
   git commit -m "fix: إصلاح مشكلة في استخراج الأعضاء"
   
   # ❌ سيء
   git commit -m "تحديث"
   git commit -m "fix"
   ```

4. **لا ترفع ملفات حساسة:**
   - `.env` أو `.env.local`
   - `__pycache__/`
   - `node_modules/`
   - `.next/`
   - أي ملفات credentials

---

## 📁 Telegram Backend (Python) - `telegram-backend/main.py`

### عند تعديل `main.py` أو أي ملف في `telegram-backend/`:

```bash
# 1. الانتقال إلى مجلد telegram-backend
cd telegram-backend

# 2. التحقق من التغييرات
git status

# 3. إضافة التغييرات
git add main.py  # أو git add . لإضافة كل شيء

# 4. إنشاء commit
git commit -m "feat: وصف التعديل"

# 5. الرفع على GitHub
git push origin main
```

**⚠️ تنبيه:** لا ترفع ملفات `.env` أو `__pycache__` أو أي ملفات حساسة.

---

## 🔧 Supabase Edge Functions

### عند تعديل أو إضافة Edge Function في `supabase/functions/`:

```bash
# 1. الانتقال إلى الجذر
cd SocialProMax/SocialProMax

# 2. نشر Function واحد
npx supabase functions deploy telegram-campaign-create --project-ref gigrtzamstdyynmvwljq

# 3. أو نشر جميع Functions (استخدام السكريبت)
.\deploy-all-functions.ps1
```

**ملاحظة:** تأكد من إضافة Environment Variables في Supabase Dashboard إذا كان Function جديد يحتاجها.

---

## 🎨 Frontend (Next.js) - `socialpro-saas/`

### عند تعديل ملفات في `socialpro-saas/app/` أو `socialpro-saas/components/`:

```bash
# 1. الانتقال إلى مجلد socialpro-saas
cd socialpro-saas

# 2. التحقق من التغييرات
git status

# 3. إضافة التغييرات
git add .

# 4. إنشاء commit
git commit -m "feat: وصف التعديل"

# 5. الرفع على GitHub
git push origin main
```

**⚠️ تنبيه:** لا ترفع ملف `.env.local` أو مجلد `node_modules/` أو `.next/`.

---

## 📊 قاعدة البيانات (Supabase Migrations)

### عند إضافة جداول جديدة أو تعديل في `supabase/migrations/`:

```bash
# 1. تطبيق Migration على Supabase
# عبر Supabase Dashboard: SQL Editor > Run SQL
# أو عبر Supabase CLI:
supabase db push --project-ref gigrtzamstdyynmvwljq

# 2. رفع ملف Migration على GitHub
cd SocialProMax/SocialProMax
git add supabase/migrations/20250105_add_telegram_campaigns_tables.sql
git commit -m "feat: إضافة جداول الحملات"
git push origin main
```

---

## ✅ Checklist قبل الرفع

### قبل رفع أي تعديل على GitHub:

- [ ] تأكد من أنك لا ترفع ملفات حساسة (`.env`, `.env.local`, `credentials`)
- [ ] اختبر التعديلات محلياً
- [ ] تحقق من `git status` قبل الرفع
- [ ] استخدم رسالة commit واضحة

### قبل نشر Edge Function:

- [ ] اختبر Function محلياً: `supabase functions serve function-name`
- [ ] تأكد من إضافة Environment Variables المطلوبة
- [ ] تحقق من Logs بعد النشر

---

## 🚨 أمور مهمة

1. **Telegram Backend (`main.py`):**
   - بعد الرفع على GitHub، يجب رفعه على Render.com أيضاً (إذا كان متصل)
   - أو انتظر حتى يتم Deploy تلقائياً إذا كان متصل مع GitHub

2. **Edge Functions:**
   - لا ترفع على GitHub فقط، يجب نشرها على Supabase أيضاً
   - استخدم `npx supabase functions deploy` لكل Function

3. **Frontend:**
   - بعد الرفع على GitHub، قد يحتاج إعادة Deploy على MiniMax Space (إذا كان متصل)

---

## 📝 أمثلة سريعة

### مثال 1: تعديل `main.py`
```bash
cd telegram-backend
git add main.py
git commit -m "fix: إصلاح مشكلة في استخراج الأعضاء"
git push origin main
```

### مثال 2: إضافة Edge Function جديد
```bash
# 1. إنشاء Function
# 2. نشر على Supabase
npx supabase functions deploy telegram-campaign-create --project-ref gigrtzamstdyynmvwljq

# 3. رفع الكود على GitHub
cd SocialProMax/SocialProMax
git add supabase/functions/telegram-campaign-create/
git commit -m "feat: إضافة Edge Function للحملات"
git push origin main
```

### مثال 3: تعديل صفحة Frontend
```bash
cd socialpro-saas
git add app/dashboard/telegram/campaigns/page.tsx
git commit -m "feat: تحديث واجهة الحملات"
git push origin main
```

---

**ملاحظة:** هذا دليل مختصر. للتفاصيل الكاملة، راجع `DEPLOYMENT_GUIDE.md`.

