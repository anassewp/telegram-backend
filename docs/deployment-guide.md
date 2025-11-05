# دليل النشر الكامل - منصة SaaS للتسويق الإلكتروني

## 📋 نظرة عامة

هذا الدليل يشرح كيفية نشر منصة SaaS للتسويق الإلكتروني من البداية إلى النهاية، بما في ذلك إعداد Supabase، تكامل Stripe، والنشر على خادم الإنتاج.

---

## 🎯 متطلبات ما قبل النشر

### 1. الحسابات المطلوبة
- ✅ حساب Supabase (مجاني أو مدفوع)
- ⏳ حساب Stripe (للمدفوعات)
- ✅ حساب Google Cloud (لتسجيل الدخول عبر Google)
- 🔜 نطاق مخصص (اختياري)

### 2. الأدوات المطلوبة
```bash
# Node.js (الإصدار 18 أو أحدث)
node --version  # يجب أن يكون >= 18.0.0

# npm أو yarn
npm --version

# Git (اختياري لإدارة الإصدارات)
git --version
```

---

## 🚀 المرحلة 1: إعداد Supabase

### الخطوة 1.1: إنشاء مشروع Supabase

1. **الذهاب إلى:** https://supabase.com/dashboard
2. **إنشاء مشروع جديد:**
   - اسم المشروع: `socialpro-saas`
   - كلمة مرور قاعدة البيانات: قوية وآمنة
   - المنطقة: اختر الأقرب للمستخدمين (مثال: Europe - Frankfurt)

3. **انتظر 2-3 دقائق** حتى يكتمل إنشاء المشروع

### الخطوة 1.2: تطبيق قاعدة البيانات

#### أ. إنشاء الجداول
انتقل إلى **SQL Editor** في لوحة تحكم Supabase وقم بتشغيل الملفات التالية بالترتيب:

```bash
# الملفات الموجودة في /workspace/supabase/migrations/
1. 001_create_profiles_table.sql
2. 002_create_subscription_plans_table.sql
3. 003_create_subscriptions_table.sql
4. 004_create_platforms_table.sql
5. 005_create_user_platforms_table.sql
6. 006_create_points_transactions_table.sql
7. 007_create_invoices_table.sql
8. 008_create_notifications_table.sql
9. 009_create_activities_table.sql
10. 010_create_features_table.sql
11. 011_create_plan_features_table.sql
12. 012_create_api_keys_table.sql
13. 013_create_campaigns_table.sql
14. 014_create_reports_table.sql
```

**ملاحظة:** يجب تشغيل كل ملف بشكل منفصل والتأكد من عدم وجود أخطاء.

#### ب. إدراج البيانات الأساسية

```sql
-- 1. إدراج المنصات (12 منصة)
INSERT INTO public.platforms (name, name_ar, icon, color, description, api_docs_url, is_active, category) VALUES
('WhatsApp', 'واتساب', 'message-circle', '#25D366', 'منصة المراسلة الأكثر شعبية', 'https://developers.facebook.com/docs/whatsapp', true, 'messaging'),
('Facebook', 'فيسبوك', 'facebook', '#1877F2', 'أكبر شبكة تواصل اجتماعي', 'https://developers.facebook.com/docs', true, 'social'),
('Instagram', 'إنستغرام', 'instagram', '#E4405F', 'منصة مشاركة الصور والفيديو', 'https://developers.facebook.com/docs/instagram', true, 'social'),
('Twitter', 'تويتر (X)', 'twitter', '#1DA1F2', 'منصة التدوين المصغر', 'https://developer.twitter.com/en/docs', true, 'social'),
('Telegram', 'تيليجرام', 'send', '#0088CC', 'تطبيق مراسلة سحابي', 'https://core.telegram.org/api', true, 'messaging'),
('LinkedIn', 'لينكد إن', 'linkedin', '#0A66C2', 'الشبكة المهنية', 'https://docs.microsoft.com/en-us/linkedin', true, 'professional'),
('TikTok', 'تيك توك', 'music', '#000000', 'منصة الفيديو القصير', 'https://developers.tiktok.com', true, 'social'),
('Pinterest', 'بينترست', 'pin', '#E60023', 'محرك بحث مرئي', 'https://developers.pinterest.com', true, 'social'),
('Snapchat', 'سناب شات', 'ghost', '#FFFC00', 'منصة محتوى سريع الزوال', 'https://kit.snapchat.com', true, 'social'),
('YouTube', 'يوتيوب', 'youtube', '#FF0000', 'أكبر منصة فيديو', 'https://developers.google.com/youtube', true, 'video'),
('Reddit', 'ريديت', 'message-square', '#FF4500', 'منصة المجتمعات', 'https://www.reddit.com/dev/api', true, 'social'),
('Discord', 'ديسكورد', 'message-circle', '#5865F2', 'منصة المجتمعات والدردشة', 'https://discord.com/developers/docs', true, 'messaging');

-- 2. إدراج خطط الاشتراك (4 خطط)
INSERT INTO public.subscription_plans (name, name_ar, price, currency, billing_cycle, max_platforms, max_campaigns, max_contacts, points_per_month, features, is_active, stripe_price_id) VALUES
('Free', 'مجاني', 0.00, 'USD', 'monthly', 2, 5, 100, 100, '["basic_analytics", "email_support"]', true, NULL),
('Monthly', 'شهري', 29.99, 'USD', 'monthly', 5, 50, 5000, 1000, '["advanced_analytics", "priority_support", "api_access", "custom_templates"]', true, 'price_monthly'),
('Annual', 'سنوي', 299.99, 'USD', 'yearly', 10, 200, 20000, 15000, '["advanced_analytics", "priority_support", "api_access", "custom_templates", "white_label", "dedicated_manager"]', true, 'price_annual'),
('Lifetime', 'مدى الحياة', 999.99, 'USD', 'lifetime', 12, 999, 100000, 999999, '["advanced_analytics", "priority_support", "api_access", "custom_templates", "white_label", "dedicated_manager", "lifetime_updates"]', true, 'price_lifetime');

-- 3. إدراج الميزات (12 ميزة)
INSERT INTO public.features (name, name_ar, description, icon, category, is_active) VALUES
('multi_platform', 'دعم منصات متعددة', 'إدارة حسابات متعددة عبر منصات مختلفة', 'layers', 'core', true),
('advanced_analytics', 'تحليلات متقدمة', 'تقارير وإحصائيات تفصيلية', 'bar-chart', 'analytics', true),
('campaign_management', 'إدارة الحملات', 'إنشاء وجدولة الحملات التسويقية', 'target', 'marketing', true),
('contact_management', 'إدارة جهات الاتصال', 'قاعدة بيانات عملاء متقدمة', 'users', 'crm', true),
('email_support', 'دعم بريد إلكتروني', 'دعم فني عبر البريد الإلكتروني', 'mail', 'support', true),
('priority_support', 'دعم أولوية', 'دعم فني فوري وذو أولوية', 'headphones', 'support', true),
('api_access', 'الوصول للـ API', 'تكامل عبر واجهة برمجية', 'code', 'integration', true),
('custom_templates', 'قوالب مخصصة', 'إنشاء وحفظ قوالب مخصصة', 'layout', 'customization', true),
('white_label', 'علامة تجارية خاصة', 'إزالة العلامة التجارية وتخصيص كامل', 'award', 'customization', true),
('dedicated_manager', 'مدير حساب مخصص', 'مدير حساب شخصي', 'user-check', 'support', true),
('lifetime_updates', 'تحديثات مدى الحياة', 'تحديثات وميزات جديدة مجاناً', 'refresh-cw', 'core', true),
('points_system', 'نظام النقاط', 'اكسب نقاط واستبدلها بمزايا', 'star', 'rewards', true);

-- 4. ربط الميزات بالخطط
INSERT INTO public.plan_features (plan_id, feature_id) 
SELECT sp.id, f.id 
FROM subscription_plans sp, features f 
WHERE (sp.name = 'Free' AND f.name IN ('multi_platform', 'campaign_management', 'contact_management', 'email_support', 'points_system'))
   OR (sp.name = 'Monthly' AND f.name IN ('multi_platform', 'campaign_management', 'contact_management', 'advanced_analytics', 'priority_support', 'api_access', 'custom_templates', 'points_system'))
   OR (sp.name = 'Annual' AND f.name IN ('multi_platform', 'campaign_management', 'contact_management', 'advanced_analytics', 'priority_support', 'api_access', 'custom_templates', 'white_label', 'dedicated_manager', 'points_system'))
   OR (sp.name = 'Lifetime' AND f.category IS NOT NULL);
```

### الخطوة 1.3: إنشاء Storage Buckets

انتقل إلى **Storage** في لوحة تحكم Supabase:

1. **Bucket: avatars**
   - اسم: `avatars`
   - Public: ✅ Yes
   - Allowed MIME types: `image/*`
   - Max file size: 5 MB

2. **Bucket: campaign-files**
   - اسم: `campaign-files`
   - Public: ✅ Yes
   - Allowed MIME types: `image/*`, `video/*`, `application/pdf`
   - Max file size: 50 MB

3. **Bucket: reports**
   - اسم: `reports`
   - Public: ❌ No
   - Allowed MIME types: `application/pdf`, `text/csv`
   - Max file size: 10 MB

### الخطوة 1.4: تفعيل Google OAuth

1. **في Supabase:**
   - انتقل إلى **Authentication** > **Providers**
   - فعّل **Google**
   - احفظ `Redirect URL`: `https://[PROJECT_ID].supabase.co/auth/v1/callback`

2. **في Google Cloud Console:**
   - انتقل إلى: https://console.cloud.google.com
   - أنشئ مشروع جديد أو اختر مشروع موجود
   - فعّل **Google+ API**
   - انتقل إلى **Credentials** > **Create Credentials** > **OAuth 2.0 Client ID**
   - اختر: **Web application**
   - أضف Authorized redirect URIs:
     ```
     https://[PROJECT_ID].supabase.co/auth/v1/callback
     ```
   - احفظ `Client ID` و `Client Secret`

3. **العودة إلى Supabase:**
   - الصق `Client ID` و `Client Secret` في إعدادات Google Provider
   - احفظ التغييرات

### الخطوة 1.5: احصل على مفاتيح API

من **Settings** > **API**:
- ✅ `Project URL`: https://[PROJECT_ID].supabase.co
- ✅ `anon/public key`: ابدأ بـ `eyJhbGc...`
- ✅ `service_role key`: ابدأ بـ `eyJhbGc...` (لا تشاركها مطلقاً)

---

## 💳 المرحلة 2: إعداد Stripe (اختياري - للمدفوعات)

### الخطوة 2.1: إنشاء حساب Stripe

1. سجل في: https://dashboard.stripe.com/register
2. أكمل معلومات الحساب والتحقق

### الخطوة 2.2: إنشاء المنتجات والأسعار

في **Products** في لوحة تحكم Stripe:

#### 1. المنتج الشهري
- الاسم: `SocialPro - Monthly Plan`
- السعر: `$29.99 USD / month`
- نوع الفوترة: `Recurring`
- احفظ `Price ID` (مثال: `price_1ABC123...`)

#### 2. المنتج السنوي
- الاسم: `SocialPro - Annual Plan`
- السعر: `$299.99 USD / year`
- نوع الفوترة: `Recurring`
- احفظ `Price ID`

#### 3. المنتج مدى الحياة
- الاسم: `SocialPro - Lifetime Access`
- السعر: `$999.99 USD`
- نوع الفوترة: `One-time`
- احفظ `Price ID`

### الخطوة 2.3: تحديث قاعدة البيانات

```sql
-- تحديث Price IDs في جدول subscription_plans
UPDATE subscription_plans SET stripe_price_id = 'price_1ABC...' WHERE name = 'Monthly';
UPDATE subscription_plans SET stripe_price_id = 'price_1DEF...' WHERE name = 'Annual';
UPDATE subscription_plans SET stripe_price_id = 'price_1GHI...' WHERE name = 'Lifetime';
```

### الخطوة 2.4: إنشاء Webhook

1. في Stripe Dashboard > **Developers** > **Webhooks**
2. أضف endpoint: `https://[YOUR_DOMAIN]/api/webhooks/stripe`
3. اختر الأحداث:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. احفظ `Webhook Secret` (يبدأ بـ `whsec_...`)

### الخطوة 2.5: احصل على مفاتيح API

من **Developers** > **API keys**:
- ✅ `Publishable key`: ابدأ بـ `pk_test_...` (للتطوير) أو `pk_live_...` (للإنتاج)
- ✅ `Secret key`: ابدأ بـ `sk_test_...` (للتطوير) أو `sk_live_...` (للإنتاج)

---

## ⚙️ المرحلة 3: تكوين التطبيق

### الخطوة 3.1: تحميل الكود

```bash
# تحميل مجلد المشروع
cd /workspace/socialpro-saas
```

### الخطوة 3.2: إنشاء ملف البيئة

أنشئ ملف `.env.local` في مجلد المشروع:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Stripe (اختياري)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # أو pk_live_...
STRIPE_SECRET_KEY=sk_test_... # أو sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### الخطوة 3.3: تثبيت الاعتماديات

```bash
npm install
# أو
yarn install
```

### الخطوة 3.4: التحقق من التكوين

```bash
# اختبار الاتصال بـ Supabase
npm run dev
# افتح: http://localhost:3000
```

---

## 🏗️ المرحلة 4: البناء والنشر

### الخيار أ: النشر على MiniMax Space (الحالي)

```bash
# بناء التطبيق
npm run build

# النشر باستخدام أداة MiniMax
# (التطبيق الحالي منشور على: https://afgm7qj3cfej.space.minimax.io)
```

### الخيار ب: النشر على Vercel

1. **ادفع الكود إلى GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/[USERNAME]/socialpro-saas.git
git push -u origin main
```

2. **في Vercel:**
   - انتقل إلى: https://vercel.com/new
   - استورد المشروع من GitHub
   - أضف متغيرات البيئة (نفس `.env.local`)
   - انقر على **Deploy**

3. **بعد النشر:**
   - احصل على URL: `https://socialpro-saas.vercel.app`
   - حدّث `NEXT_PUBLIC_APP_URL` في متغيرات البيئة

### الخيار ج: النشر على Netlify

```bash
# بناء التطبيق
npm run build

# تثبيت Netlify CLI
npm install -g netlify-cli

# تسجيل الدخول
netlify login

# النشر
netlify deploy --prod --dir=out
```

### الخيار د: النشر على خادم VPS

#### متطلبات الخادم:
- Ubuntu 22.04 أو أحدث
- Node.js 18+
- Nginx
- SSL Certificate (Let's Encrypt)

#### خطوات النشر:

```bash
# 1. الاتصال بالخادم
ssh user@your-server-ip

# 2. تثبيت Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. تثبيت Nginx
sudo apt-get install nginx

# 4. رفع الكود
scp -r /workspace/socialpro-saas user@your-server-ip:/var/www/

# 5. تثبيت الاعتماديات
cd /var/www/socialpro-saas
npm install

# 6. بناء التطبيق
npm run build

# 7. تكوين Nginx
sudo nano /etc/nginx/sites-available/socialpro-saas
```

**ملف تكوين Nginx:**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    root /var/www/socialpro-saas/out;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# 8. تفعيل التكوين
sudo ln -s /etc/nginx/sites-available/socialpro-saas /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 9. تثبيت SSL (Let's Encrypt)
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 10. إنشاء خدمة systemd (للتطبيقات الديناميكية)
sudo nano /etc/systemd/system/socialpro-saas.service
```

**ملف الخدمة:**
```ini
[Unit]
Description=SocialPro SaaS
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/socialpro-saas
ExecStart=/usr/bin/npm start
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
# 11. تفعيل وتشغيل الخدمة
sudo systemctl enable socialpro-saas
sudo systemctl start socialpro-saas
sudo systemctl status socialpro-saas
```

---

## 🔒 المرحلة 5: الأمان والإنتاج

### قائمة فحص الأمان

- [ ] تغيير جميع كلمات المرور الافتراضية
- [ ] تفعيل 2FA على Supabase و Stripe
- [ ] إخفاء `service_role key` (عدم استخدامها في Frontend)
- [ ] تحديد Rate Limiting على APIs
- [ ] تفعيل CORS بشكل صحيح
- [ ] تفعيل RLS على جميع الجداول في Supabase
- [ ] استخدام HTTPS فقط
- [ ] إعداد النسخ الاحتياطي التلقائي في Supabase
- [ ] مراجعة Stripe Webhook Signatures
- [ ] تفعيل CSP Headers
- [ ] إعداد مراقبة الأخطاء (Sentry)

### تحديثات ملف البيئة للإنتاج

```bash
# استخدم مفاتيح الإنتاج
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
```

### تكوين Nginx الآمن

```nginx
# إضافة Headers أمنية
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

---

## 📊 المرحلة 6: المراقبة والصيانة

### إعداد المراقبة

1. **Supabase Dashboard:**
   - راقب الاستخدام اليومي
   - تحقق من الأخطاء في Database Logs
   - راقب Auth Events

2. **Stripe Dashboard:**
   - راقب المدفوعات والاشتراكات
   - تحقق من Webhook Logs
   - راقب النزاعات (Disputes)

3. **Server Monitoring (للـ VPS):**
```bash
# تثبيت htop
sudo apt-get install htop

# مراقبة الموارد
htop

# مراقبة logs
sudo tail -f /var/log/nginx/error.log
sudo journalctl -u socialpro-saas -f
```

### النسخ الاحتياطي

```bash
# نسخ احتياطي لقاعدة البيانات (يومياً)
# في Supabase: Settings > Database > Backups (تلقائي)

# نسخ احتياطي للملفات (أسبوعياً)
tar -czf backup-$(date +%Y%m%d).tar.gz /var/www/socialpro-saas/
```

### التحديثات

```bash
# تحديث الاعتماديات
npm update
npm audit fix

# تحديث التطبيق
git pull origin main
npm install
npm run build
sudo systemctl restart socialpro-saas
```

---

## 🆘 استكشاف الأخطاء وإصلاحها

### مشكلة: فشل الاتصال بـ Supabase

**الحل:**
```bash
# تحقق من URL و API Keys
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# تحقق من الاتصال
curl https://[PROJECT_ID].supabase.co/rest/v1/
```

### مشكلة: Stripe Webhook لا يعمل

**الحل:**
1. تحقق من Webhook URL في Stripe Dashboard
2. تحقق من Webhook Secret
3. راجع Stripe Logs في Dashboard

### مشكلة: خطأ في RLS

**الحل:**
```sql
-- تحقق من السياسات
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- تعطيل RLS مؤقتاً للاختبار
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
```

### مشكلة: بطء في التحميل

**الحل:**
1. فعّل Caching في Nginx
2. استخدم CDN (Cloudflare)
3. قلل حجم الصور
4. فعّل Compression

---

## 📞 الدعم والموارد

### الوثائق
- **الوثائق الفنية:** `/workspace/docs/technical-documentation.md`
- **دليل المستخدم:** `/workspace/docs/user-guide.md`
- **هذا الدليل:** `/workspace/docs/deployment-guide.md`

### روابط مفيدة
- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Stripe Docs:** https://stripe.com/docs
- **Tailwind CSS:** https://tailwindcss.com/docs

### الدعم الفني
- **Supabase Discord:** https://discord.supabase.com
- **Stripe Support:** https://support.stripe.com

---

## ✅ قائمة فحص النشر النهائية

### قبل النشر
- [ ] اختبار جميع الوظائف محلياً
- [ ] مراجعة جميع متغيرات البيئة
- [ ] التحقق من تطبيق جميع Migrations
- [ ] اختبار عملية التسجيل وتسجيل الدخول
- [ ] اختبار Google OAuth
- [ ] اختبار Stripe Checkout (في وضع الاختبار)
- [ ] مراجعة RLS Policies
- [ ] تحسين الصور
- [ ] اختبار الاستجابة على الأجهزة المختلفة

### بعد النشر
- [ ] اختبار الموقع المباشر
- [ ] التحقق من SSL
- [ ] اختبار عملية الدفع (في الإنتاج)
- [ ] التحقق من Webhooks
- [ ] إعداد Google Analytics (اختياري)
- [ ] إعداد Sentry (اختياري)
- [ ] إنشاء أول مستخدم تجريبي
- [ ] إرسال بريد ترحيبي تجريبي
- [ ] مراقبة الأخطاء في أول 24 ساعة

---

## 🎉 تهانينا!

تطبيقك الآن منشور ومتاح للمستخدمين! 

**الموقع الحالي:** https://afgm7qj3cfej.space.minimax.io

للحصول على أفضل النتائج:
1. راقب الأداء بانتظام
2. استمع لملاحظات المستخدمين
3. حدّث التطبيق بشكل دوري
4. احتفظ بنسخ احتياطية منتظمة

---

**آخر تحديث:** 2025-11-02  
**الإصدار:** 1.0.0
