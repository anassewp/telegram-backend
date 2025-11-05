# دليل النشر والتحديث - GitHub و Supabase Edge Functions

## 📋 نظرة عامة

هذا الدليل يشرح كيفية رفع التحديثات على GitHub ونشر Edge Functions على Supabase بطريقة احترافية وآمنة.

---

## 🚀 الجزء الأول: رفع التحديثات على GitHub

### المتطلبات الأساسية

1. **Git مثبت على النظام**
2. **حساب GitHub**
3. **مستودع GitHub موجود**
4. **GitHub CLI (اختياري) - للتسهيل**

### الخطوات الأساسية

#### 1. التحقق من حالة Git

```bash
# التحقق من فرع العمل الحالي
git status

# عرض جميع الفروع
git branch -a

# عرض آخر التغييرات
git log --oneline -10
```

#### 2. إضافة التغييرات

```bash
# إضافة جميع الملفات المعدلة
git add .

# أو إضافة ملفات محددة
git add path/to/file1.ts path/to/file2.ts

# إضافة مجلد كامل
git add supabase/functions/telegram-campaign-create/
```

#### 3. إنشاء Commit

```bash
# إنشاء commit مع رسالة واضحة
git commit -m "feat: إضافة نظام الحملات المتقدم مع توزيع ذكي"

# أو رسالة تفصيلية متعددة الأسطر
git commit -m "feat: إضافة نظام الحملات المتقدم

- إضافة جدول telegram_campaigns
- تنفيذ منطق التوزيع الذكي بين الجلسات
- إضافة Edge Function telegram-campaign-create
- تحديث واجهة الحملات مع جميع الخيارات"
```

#### 4. رفع التحديثات

```bash
# رفع إلى الفرع الحالي (main أو master)
git push origin main

# أو إذا كان اسم الفرع مختلف
git push origin <branch-name>

# رفع مع تعيين upstream (للمرة الأولى)
git push -u origin main
```

### أنواع رسائل Commit (Conventional Commits)

استخدم هذه البادئات لتوضيح نوع التغيير:

```bash
# إضافة ميزة جديدة
git commit -m "feat: إضافة نظام الحملات المتقدم"

# إصلاح خطأ
git commit -m "fix: إصلاح مشكلة في استخراج الأعضاء"

# تحديث الوثائق
git commit -m "docs: تحديث دليل النشر"

# تحسين الأداء
git commit -m "perf: تحسين سرعة البحث في المجموعات"

# إعادة هيكلة الكود
git commit -m "refactor: إعادة هيكلة Edge Functions"

# إضافة اختبارات
git commit -m "test: إضافة اختبارات لنظام الحملات"

# تحديث التبعيات
git commit -m "chore: تحديث package.json"
```

### العمل مع الفروع (Branches)

#### إنشاء فرع جديد

```bash
# إنشاء فرع جديد
git checkout -b feature/telegram-campaigns

# أو استخدام الطريقة الجديدة
git switch -c feature/telegram-campaigns

# رفع الفرع الجديد إلى GitHub
git push -u origin feature/telegram-campaigns
```

#### التبديل بين الفروع

```bash
# عرض جميع الفروع
git branch

# التبديل إلى فرع
git checkout main
# أو
git switch main

# حذف فرع محلي
git branch -d feature/old-branch

# حذف فرع من GitHub
git push origin --delete feature/old-branch
```

#### دمج الفروع

```bash
# التبديل إلى الفرع الرئيسي
git checkout main

# دمج الفرع
git merge feature/telegram-campaigns

# رفع التغييرات
git push origin main
```

### سحب التحديثات من GitHub

```bash
# سحب آخر التحديثات
git pull origin main

# أو fetch ثم merge
git fetch origin
git merge origin/main
```

### حل النزاعات (Conflicts)

إذا حدث تعارض:

```bash
# 1. سحب التحديثات
git pull origin main

# 2. فتح الملفات التي بها تعارض
# 3. البحث عن <<<<<<< HEAD و ======= و >>>>>>>
# 4. حل التعارض يدوياً
# 5. إضافة الملفات المحلولة
git add conflicted-file.ts

# 6. إكمال الدمج
git commit -m "fix: حل تعارض في دمج الفروع"
```

### تجاهل الملفات (.gitignore)

تأكد من وجود `.gitignore` في الجذر:

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
*.log

# Production
build/
dist/
.next/
out/

# Environment variables
.env
.env.local
.env.production.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Supabase
.branches
.temp
```

---

## 🔧 الجزء الثاني: نشر Edge Functions على Supabase

### المتطلبات الأساسية

1. **Supabase CLI مثبت**
2. **حساب Supabase**
3. **مشروع Supabase نشط**
4. **مفاتيح المصادقة**

### تثبيت Supabase CLI

```bash
# باستخدام npm
npm install -g supabase

# أو باستخدام Homebrew (Mac)
brew install supabase/tap/supabase

# التحقق من التثبيت
supabase --version
```

### تسجيل الدخول إلى Supabase

```bash
# تسجيل الدخول
supabase login

# ربط المشروع المحلي
supabase link --project-ref <project-id>

# مثال: supabase link --project-ref gigrtzamstdyynmvwljq
```

### هيكل Edge Functions

```
supabase/
└── functions/
    ├── telegram-campaign-create/
    │   └── index.ts
    ├── telegram-campaign-start/
    │   └── index.ts
    └── ...
```

### نشر Edge Function واحد

```bash
# نشر function واحد
supabase functions deploy telegram-campaign-create

# مع تحديد المشروع
supabase functions deploy telegram-campaign-create --project-ref gigrtzamstdyynmvwljq
```

### نشر جميع Edge Functions

#### استخدام PowerShell (Windows)

```powershell
# ملف deploy-all-functions.ps1
$functions = @(
    "telegram-send-message",
    "telegram-extract-members",
    "telegram-transfer-members",
    "telegram-search-groups",
    "telegram-import-groups",
    "telegram-import-groups-from-session",
    "telegram-join-group",
    "telegram-campaign-create",
    "telegram-campaign-start",
    "telegram-campaign-send-batch",
    "telegram-campaign-pause",
    "telegram-campaign-resume",
    "telegram-transfer-members-batch"
)

foreach ($func in $functions) {
    Write-Host "Deploying $func..." -ForegroundColor Cyan
    npx supabase functions deploy $func --project-ref gigrtzamstdyynmvwljq
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ $func deployed successfully" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to deploy $func" -ForegroundColor Red
    }
    Write-Host ""
}
```

**الاستخدام:**
```powershell
.\deploy-all-functions.ps1
```

#### استخدام Bash (Linux/Mac)

```bash
#!/bin/bash
# deploy-all-functions.sh

functions=(
    "telegram-send-message"
    "telegram-extract-members"
    "telegram-transfer-members"
    "telegram-search-groups"
    "telegram-import-groups"
    "telegram-import-groups-from-session"
    "telegram-join-group"
    "telegram-campaign-create"
    "telegram-campaign-start"
    "telegram-campaign-send-batch"
    "telegram-campaign-pause"
    "telegram-campaign-resume"
    "telegram-transfer-members-batch"
)

for func in "${functions[@]}"; do
    echo "Deploying $func..."
    npx supabase functions deploy $func --project-ref gigrtzamstdyynmvwljq
    if [ $? -eq 0 ]; then
        echo "✓ $func deployed successfully"
    else
        echo "✗ Failed to deploy $func"
    fi
    echo ""
done
```

**الاستخدام:**
```bash
chmod +x deploy-all-functions.sh
./deploy-all-functions.sh
```

### إعداد Environment Variables

#### الطريقة 1: عبر Supabase Dashboard

1. اذهب إلى: **Project Settings > Edge Functions**
2. اختر Function
3. أضف المتغيرات:

```
TELEGRAM_BACKEND_URL=https://socialpro-telegram-backend.onrender.com
SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_URL=https://gigrtzamstdyynmvwljq.supabase.co
```

#### الطريقة 2: عبر CLI

```bash
# إضافة متغير بيئة لـ function واحد
supabase secrets set TELEGRAM_BACKEND_URL=https://socialpro-telegram-backend.onrender.com --project-ref gigrtzamstdyynmvwljq

# إضافة متغيرات متعددة
supabase secrets set \
  TELEGRAM_BACKEND_URL=https://socialpro-telegram-backend.onrender.com \
  SERVICE_ROLE_KEY=your_service_role_key \
  --project-ref gigrtzamstdyynmvwljq
```

**ملاحظة:** المتغيرات التي تبدأ بـ `SUPABASE_` تُضاف تلقائياً.

### اختبار Edge Function محلياً

```bash
# تشغيل Function محلياً
supabase functions serve telegram-campaign-create

# مع تحديد المنفذ
supabase functions serve telegram-campaign-create --port 54321

# اختبار Function
curl -X POST http://localhost:54321/functions/v1/telegram-campaign-create \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### عرض Logs

```bash
# عرض logs لـ function
supabase functions logs telegram-campaign-create --project-ref gigrtzamstdyynmvwljq

# مع فلترة
supabase functions logs telegram-campaign-create --project-ref gigrtzamstdyynmvwljq --follow

# آخر 100 سطر
supabase functions logs telegram-campaign-create --project-ref gigrtzamstdyynmvwljq -n 100
```

---

## 📝 سير العمل الكامل (Workflow)

### 1. تطوير محلي

```bash
# 1. إنشاء فرع جديد
git checkout -b feature/new-edge-function

# 2. تطوير الكود
# ... كتابة الكود ...

# 3. اختبار محلي
supabase functions serve new-function

# 4. إضافة التغييرات
git add .
git commit -m "feat: إضافة Edge Function جديد"
```

### 2. رفع على GitHub

```bash
# 1. رفع الفرع
git push -u origin feature/new-edge-function

# 2. إنشاء Pull Request على GitHub
# (أو دمج مباشرة إذا كان لديك صلاحيات)
```

### 3. نشر على Supabase

```bash
# 1. التبديل إلى الفرع الرئيسي
git checkout main
git pull origin main

# 2. نشر Edge Function
supabase functions deploy new-function --project-ref gigrtzamstdyynmvwljq

# 3. التحقق من النشر
supabase functions logs new-function --project-ref gigrtzamstdyynmvwljq
```

---

## 🔄 سكريبتات النشر التلقائي

### سكريبت PowerShell شامل

```powershell
# deploy-telegram-system.ps1
param(
    [string]$Action = "all",
    [string]$FunctionName = ""
)

$projectRef = "gigrtzamstdyynmvwljq"

# جميع Edge Functions
$allFunctions = @(
    "telegram-send-message",
    "telegram-extract-members",
    "telegram-transfer-members",
    "telegram-search-groups",
    "telegram-import-groups",
    "telegram-import-groups-from-session",
    "telegram-join-group",
    "telegram-campaign-create",
    "telegram-campaign-start",
    "telegram-campaign-send-batch",
    "telegram-campaign-pause",
    "telegram-campaign-resume",
    "telegram-transfer-members-batch"
)

function Deploy-Function {
    param([string]$funcName)
    
    Write-Host "`n🚀 Deploying $funcName..." -ForegroundColor Cyan
    $result = npx supabase functions deploy $funcName --project-ref $projectRef
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ $funcName deployed successfully" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ Failed to deploy $funcName" -ForegroundColor Red
        return $false
    }
}

function Deploy-All {
    Write-Host "`n📦 Deploying all Edge Functions..." -ForegroundColor Yellow
    
    $successCount = 0
    $failCount = 0
    
    foreach ($func in $allFunctions) {
        if (Deploy-Function -funcName $func) {
            $successCount++
        } else {
            $failCount++
        }
        Start-Sleep -Seconds 2  # تأخير بين كل function
    }
    
    Write-Host "`n📊 Deployment Summary:" -ForegroundColor Yellow
    Write-Host "   ✅ Success: $successCount" -ForegroundColor Green
    Write-Host "   ❌ Failed: $failCount" -ForegroundColor Red
}

function Deploy-Single {
    param([string]$funcName)
    
    if ($allFunctions -contains $funcName) {
        Deploy-Function -funcName $funcName
    } else {
        Write-Host "❌ Function '$funcName' not found in list" -ForegroundColor Red
        Write-Host "Available functions:" -ForegroundColor Yellow
        $allFunctions | ForEach-Object { Write-Host "  - $_" }
    }
}

# التنفيذ
switch ($Action) {
    "all" {
        Deploy-All
    }
    "single" {
        if ($FunctionName -eq "") {
            Write-Host "❌ Please specify function name: -FunctionName 'function-name'" -ForegroundColor Red
        } else {
            Deploy-Single -funcName $FunctionName
        }
    }
    default {
        Write-Host "Usage:" -ForegroundColor Yellow
        Write-Host "  .\deploy-telegram-system.ps1 -Action all"
        Write-Host "  .\deploy-telegram-system.ps1 -Action single -FunctionName 'telegram-campaign-create'"
    }
}
```

**الاستخدام:**
```powershell
# نشر جميع Functions
.\deploy-telegram-system.ps1 -Action all

# نشر function واحد
.\deploy-telegram-system.ps1 -Action single -FunctionName "telegram-campaign-create"
```

---

## 🛠️ حل المشاكل الشائعة

### مشكلة: "Function not found"

```bash
# تأكد من أنك في المجلد الصحيح
cd SocialProMax/SocialProMax

# تأكد من وجود المجلد
ls supabase/functions/

# تحقق من ربط المشروع
supabase status
```

### مشكلة: "Authentication failed"

```bash
# إعادة تسجيل الدخول
supabase logout
supabase login

# إعادة ربط المشروع
supabase link --project-ref gigrtzamstdyynmvwljq
```

### مشكلة: "Environment variable not found"

```bash
# التحقق من المتغيرات
supabase secrets list --project-ref gigrtzamstdyynmvwljq

# إضافة المتغير
supabase secrets set VARIABLE_NAME=value --project-ref gigrtzamstdyynmvwljq
```

### مشكلة: "Deployment timeout"

```bash
# زيادة timeout (إذا كان متاحاً)
# أو تقسيم النشر إلى دفعات أصغر
```

---

## 📋 Checklist قبل النشر

### قبل رفع على GitHub:

- [ ] اختبار الكود محلياً
- [ ] التحقق من عدم وجود أخطاء TypeScript/ESLint
- [ ] تحديث `.gitignore` إذا لزم الأمر
- [ ] كتابة رسالة commit واضحة
- [ ] التحقق من `git status` قبل الرفع

### قبل نشر Edge Functions:

- [ ] اختبار Function محلياً (`supabase functions serve`)
- [ ] التحقق من Environment Variables
- [ ] مراجعة الكود للتأكد من عدم وجود أخطاء
- [ ] التأكد من ربط المشروع الصحيح
- [ ] التحقق من Logs بعد النشر

---

## 🔐 أفضل الممارسات

### 1. الأمان

```typescript
// ❌ سيء - كشف معلومات حساسة
console.error('Error:', error);
console.log('API Key:', apiKey);

// ✅ جيد - إخفاء المعلومات الحساسة
console.error('Error:', error.message);
// لا تسجل API Keys أو معلومات حساسة
```

### 2. معالجة الأخطاء

```typescript
// ✅ معالجة شاملة للأخطاء
try {
    // الكود
} catch (error: any) {
    console.error('Error details:', {
        message: error.message,
        code: error.code,
        // لا تسجل معلومات حساسة
    });
    
    return new Response(
        JSON.stringify({
            error: {
                code: 'ERROR_CODE',
                message: 'User-friendly message'
            }
        }),
        { status: 500 }
    );
}
```

### 3. CORS Headers

```typescript
// ✅ CORS headers صحيحة
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
};
```

### 4. Logging

```typescript
// ✅ Logging مفيد للتصحيح
console.log('Function started:', {
    timestamp: new Date().toISOString(),
    function: 'telegram-campaign-create',
    user_id: user_id,  // فقط إذا كان آمن
    // لا تسجل session_string أو API keys
});
```

---

## 📚 روابط مفيدة

- **Supabase CLI Docs:** https://supabase.com/docs/reference/cli
- **Edge Functions Docs:** https://supabase.com/docs/guides/functions
- **GitHub Docs:** https://docs.github.com
- **Conventional Commits:** https://www.conventionalcommits.org

---

## 🎯 ملخص الأوامر السريعة

```bash
# Git
git status
git add .
git commit -m "feat: description"
git push origin main

# Supabase
supabase login
supabase link --project-ref gigrtzamstdyynmvwljq
supabase functions deploy function-name --project-ref gigrtzamstdyynmvwljq
supabase functions logs function-name --project-ref gigrtzamstdyynmvwljq
supabase secrets set KEY=value --project-ref gigrtzamstdyynmvwljq
```

---

**آخر تحديث:** 2025-01-05  
**الإصدار:** 1.0.0

