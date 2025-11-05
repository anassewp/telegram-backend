#!/bin/bash

# نشر جميع Edge Functions تلقائياً
# SocialProMax - Deploy All Edge Functions

echo "🚀 بدء نشر Edge Functions..."
echo ""

# قائمة Edge Functions المطلوبة
functions=(
    "create-admin-user"
    "telegram-import-groups-from-session"
    "telegram-search-groups"
    "telegram-import-groups"
    "telegram-send-message"
    "telegram-extract-members"
    "telegram-transfer-members"
)

success_count=0
fail_count=0

for func in "${functions[@]}"; do
    echo "📦 نشر $func..."
    supabase functions deploy $func
    
    if [ $? -eq 0 ]; then
        echo "✅ تم نشر $func بنجاح"
        ((success_count++))
    else
        echo "❌ فشل نشر $func"
        ((fail_count++))
    fi
    echo ""
done

echo "═══════════════════════════════════════"
echo "📊 النتيجة النهائية:"
echo "✅ نجح: $success_count"
echo "❌ فشل: $fail_count"
echo "═══════════════════════════════════════"

if [ $fail_count -eq 0 ]; then
    echo ""
    echo "🎉 اكتمل نشر جميع Edge Functions بنجاح!"
else
    echo ""
    echo "⚠️ بعض Edge Functions فشل نشرها. تحقق من الأخطاء أعلاه."
fi

