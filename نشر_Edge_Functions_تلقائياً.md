# 🚀 نشر Edge Functions تلقائياً - Supabase CLI

**تاريخ:** 2025-11-03

---

## ✅ الطريقة: استخدام Supabase CLI

بدلاً من النسخ واللصق، يمكنك نشر جميع Edge Functions تلقائياً من Terminal!

---

## 📋 الخطوات:

### الخطوة 1: تثبيت Supabase CLI

```bash
npm install -g supabase
```

**أو إذا كنت تستخدم Windows:**
```powershell
# باستخدام Chocolatey
choco install supabase

# أو باستخدام Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

---

### الخطوة 2: تسجيل الدخول

```bash
supabase login
```

سيطلب منك:
1. فتح المتصفح
2. تسجيل الدخول بحساب Supabase
3. الموافقة على الوصول

---

### الخطوة 3: ربط المشروع

```bash
cd SocialProMax
supabase link --project-ref gigrtzamstdyynmvwljq
```

**ملاحظة:** `gigrtzamstdyynmvwljq` هو Project ID الخاص بك

---

### الخطوة 4: نشر Edge Functions (جميعها دفعة واحدة!)

```bash
# نشر جميع Edge Functions دفعة واحدة
supabase functions deploy telegram-import-groups-from-session
supabase functions deploy telegram-search-groups
supabase functions deploy telegram-import-groups
supabase functions deploy telegram-send-message
supabase functions deploy telegram-extract-members
supabase functions deploy telegram-transfer-members
```

**أو نشر كل Edge Function على حدة:**
```bash
supabase functions deploy create-admin-user
supabase functions deploy telegram-import-groups-from-session
supabase functions deploy telegram-search-groups
supabase functions deploy telegram-import-groups
supabase functions deploy telegram-send-message
supabase functions deploy telegram-extract-members
supabase functions deploy telegram-transfer-members
```

---

## 🎯 طريقة أسهل: نشر جميع Functions دفعة واحدة

يمكنك إنشاء ملف batch script لنشر جميع Functions:

### Windows (PowerShell):

أنشئ ملف `deploy-all-functions.ps1`:

```powershell
# نشر جميع Edge Functions
Write-Host "🚀 بدء نشر Edge Functions..." -ForegroundColor Green

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
    supabase functions deploy $func
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ تم نشر $func بنجاح" -ForegroundColor Green
    } else {
        Write-Host "❌ فشل نشر $func" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "🎉 اكتمل نشر جميع Edge Functions!" -ForegroundColor Green
```

**التشغيل:**
```powershell
.\deploy-all-functions.ps1
```

---

### Linux/Mac (Bash):

أنشئ ملف `deploy-all-functions.sh`:

```bash
#!/bin/bash

# نشر جميع Edge Functions
echo "🚀 بدء نشر Edge Functions..."

functions=(
    "create-admin-user"
    "telegram-import-groups-from-session"
    "telegram-search-groups"
    "telegram-import-groups"
    "telegram-send-message"
    "telegram-extract-members"
    "telegram-transfer-members"
)

for func in "${functions[@]}"; do
    echo "📦 نشر $func..."
    supabase functions deploy $func
    if [ $? -eq 0 ]; then
        echo "✅ تم نشر $func بنجاح"
    else
        echo "❌ فشل نشر $func"
    fi
    echo ""
done

echo "🎉 اكتمل نشر جميع Edge Functions!"
```

**التشغيل:**
```bash
chmod +x deploy-all-functions.sh
./deploy-all-functions.sh
```

---

## ⚙️ إعداد Environment Variables تلقائياً

يمكنك أيضاً إضافة Environment Variables من Terminal:

```bash
# إضافة Environment Variables
supabase secrets set TELEGRAM_BACKEND_URL=http://localhost:8000
supabase secrets set SERVICE_ROLE_KEY=your_service_role_key_here
```

**ملاحظة:** يجب استبدال `your_service_role_key_here` بالمفتاح الفعلي

---

## 📝 خطوات سريعة (ملخص):

```bash
# 1. تثبيت Supabase CLI
npm install -g supabase

# 2. تسجيل الدخول
supabase login

# 3. ربط المشروع
cd SocialProMax
supabase link --project-ref gigrtzamstdyynmvwljq

# 4. نشر Edge Functions
supabase functions deploy telegram-import-groups-from-session
supabase functions deploy telegram-search-groups
supabase functions deploy telegram-import-groups
supabase functions deploy telegram-send-message
supabase functions deploy telegram-extract-members
supabase functions deploy telegram-transfer-members
```

---

## ✅ التحقق من النشر:

بعد النشر، يمكنك التحقق من:
1. Supabase Dashboard → Edge Functions
2. يجب أن ترى جميع Edge Functions في القائمة
3. يجب أن تكون الحالة "Active" أو "Deployed"

---

## 🎯 الخلاصة:

- ✅ **تثبيت Supabase CLI:** `npm install -g supabase`
- ✅ **تسجيل الدخول:** `supabase login`
- ✅ **ربط المشروع:** `supabase link --project-ref gigrtzamstdyynmvwljq`
- ✅ **نشر Functions:** `supabase functions deploy [اسم_الـ_function]`

**أسهل بكثير من النسخ واللصق!** 🚀

