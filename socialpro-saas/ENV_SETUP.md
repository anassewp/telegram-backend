# ⚙️ إعداد Environment Variables

## 📝 خطوات إنشاء ملف .env.local

### 1. أنشئ ملف `.env.local` في مجلد `socialpro-saas/`

### 2. انسخ والصق المحتوى التالي:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://gigrtzamstdyynmvwljq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpZ3J0emFtc3RkeXlubXZ3bGpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMDg5MDMsImV4cCI6MjA3NzU4NDkwM30.OZMTpBkAK2Zc4m0CyOdBbHsoAV_MS7FK-OpQNvuxgmc

# Service Role Key (للاستخدام في Edge Functions فقط)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpZ3J0emFtc3RkeXlubXZ3bGpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjAwODkwMywiZXhwIjoyMDc3NTg0OTAzfQ.9wbREihcsQvLX5TS2Q_f6lxYNzBgdWNQS7wsZvYH6lc

# Telegram Backend (اختياري - للتطوير المحلي)
NEXT_PUBLIC_TELEGRAM_BACKEND_URL=http://localhost:8000

# Site URL (اختياري)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. احفظ الملف

---

## ✅ تم! الآن يمكنك تشغيل المشروع

```bash
npm run dev
```

---

## 📝 ملاحظات:

- ✅ ملف `.env.local` موجود في `.gitignore` (آمن)
- ⚠️ لا تشارك المفاتيح مع أي شخص
- ⚠️ Service Role Key حساس جداً - استخدمه فقط في Edge Functions

