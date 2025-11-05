# 🚀 نشر Edge Functions تلقائياً - الطريقة الصحيحة

**تاريخ:** 2025-11-03

---

## ⚠️ ملاحظة مهمة:

Supabase CLI **لا يدعم** التثبيت عبر `npm install -g`!

---

## ✅ طرق التثبيت الصحيحة:

### الطريقة 1: استخدام Scoop (Windows - موصى بها)

```powershell
# تثبيت Scoop (إذا لم يكن مثبتاً)
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# إضافة Supabase bucket
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git

# تثبيت Supabase CLI
scoop install supabase
```

---

### الطريقة 2: استخدام Chocolatey (Windows)

```powershell
# تثبيت Chocolatey (إذا لم يكن مثبتاً)
# من: https://chocolatey.org/install

# تثبيت Supabase CLI
choco install supabase
```

---

### الطريقة 3: التحميل المباشر (Windows)

1. اذهب إلى: https://github.com/supabase/cli/releases
2. حمّل `supabase_windows_amd64.zip`
3. فك الضغط
4. أضف المسار إلى PATH

---

### الطريقة 4: استخدام npx (بدون تثبيت)

يمكنك استخدام Supabase CLI مباشرة بدون تثبيت:

```bash
npx supabase --version
```

---

## 📋 الخطوات بعد التثبيت:

### 1. تسجيل الدخول

```bash
supabase login
```

**أو باستخدام npx:**
```bash
npx supabase login
```

---

### 2. الانتقال إلى مجلد المشروع

```powershell
cd D:\SocialProMax\SocialProMax
```

---

### 3. ربط المشروع

```bash
supabase link --project-ref gigrtzamstdyynmvwljq
```

**أو باستخدام npx:**
```bash
npx supabase link --project-ref gigrtzamstdyynmvwljq
```

---

### 4. نشر Edge Functions (استخدام npx - لا يحتاج تثبيت!)

```bash
# نشر جميع Edge Functions
npx supabase functions deploy create-admin-user
npx supabase functions deploy telegram-import-groups-from-session
npx supabase functions deploy telegram-search-groups
npx supabase functions deploy telegram-import-groups
npx supabase functions deploy telegram-send-message
npx supabase functions deploy telegram-extract-members
npx supabase functions deploy telegram-transfer-members
```

---

## 🎯 الطريقة الأسهل: استخدام npx (بدون تثبيت!)

### خطوات سريعة:

```powershell
# 1. الانتقال إلى مجلد المشروع
cd D:\SocialProMax\SocialProMax

# 2. تسجيل الدخول
npx supabase login

# 3. ربط المشروع
npx supabase link --project-ref gigrtzamstdyynmvwljq

# 4. نشر Edge Functions
npx supabase functions deploy telegram-import-groups-from-session
npx supabase functions deploy telegram-search-groups
npx supabase functions deploy telegram-import-groups
npx supabase functions deploy telegram-send-message
npx supabase functions deploy telegram-extract-members
npx supabase functions deploy telegram-transfer-members
```

---

## 📝 Script جاهز (PowerShell):

قم بتشغيل هذا Script بعد تسجيل الدخول وربط المشروع:

```powershell
# نشر جميع Edge Functions
$functions = @(
    "create-admin-user",
    "telegram-import-groups-from-session",
    "telegram-search-groups",
    "telegram-import-groups",
    "telegram-send-message",
    "telegram-extract-members",
    "telegram-transfer-members"
)

foreach ($func in $functions) {
    Write-Host "📦 نشر $func..." -ForegroundColor Yellow
    npx supabase functions deploy $func
    Write-Host ""
}
```

---

## ✅ الخلاصة:

**الطريقة الأسهل (بدون تثبيت):**

1. ✅ `cd D:\SocialProMax\SocialProMax`
2. ✅ `npx supabase login`
3. ✅ `npx supabase link --project-ref gigrtzamstdyynmvwljq`
4. ✅ `npx supabase functions deploy [اسم_الـ_function]`

**أو استخدم Script الجاهز:** `deploy-all-functions.ps1` (محدث لاستخدام npx)

---

**تم! الآن جرب الطريقة الأسهل** 🚀

