# نشر Telegram Backend على Render.com

## الخطوات السريعة (5 دقائق)

### 1. رفع الكود على GitHub

```bash
cd /workspace/telegram-backend

# Initialize git
git init
git add .
git commit -m "Initial Telegram Backend for SocialPro"

# Create repository on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/socialpro-telegram-backend.git
git branch -M main
git push -u origin main
```

### 2. إنشاء Web Service على Render

1. اذهب إلى https://render.com
2. سجل دخول بحساب GitHub
3. اضغط **New +** → **Web Service**
4. اختر repository: `socialpro-telegram-backend`
5. املأ الإعدادات:
   ```
   Name: socialpro-telegram-backend
   Environment: Python 3
   Build Command: pip install -r requirements.txt
   Start Command: python main.py
   Plan: Free
   ```
6. اضغط **Create Web Service**

### 3. انتظر النشر

سيستغرق ~2-3 دقائق. ستحصل على URL مثل:
```
https://socialpro-telegram-backend-xxxx.onrender.com
```

### 4. اختبر Backend

افتح في المتصفح:
```
https://socialpro-telegram-backend-xxxx.onrender.com/health
```

يجب أن تحصل على:
```json
{
  "status": "healthy",
  "active_temp_clients": 0
}
```

### 5. ربط مع Frontend

في مشروع `socialpro-saas`، أضف ملف `.env.local`:
```
NEXT_PUBLIC_TELEGRAM_BACKEND_URL=https://socialpro-telegram-backend-xxxx.onrender.com
```

أعد البناء والنشر:
```bash
npm run build
# ثم deploy
```

## تم! 🎉

Backend الآن جاهز للاستخدام مع SocialPro.
