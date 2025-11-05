# نشر جميع Edge Functions تلقائياً
# SocialProMax - Deploy All Edge Functions

Write-Host "🚀 بدء نشر Edge Functions..." -ForegroundColor Green
Write-Host ""

# قائمة Edge Functions المطلوبة
$functions = @(
    "create-admin-user",
    "telegram-import-groups-from-session",
    "telegram-search-groups",
    "telegram-import-groups",
    "telegram-send-message",
    "telegram-extract-members",
    "telegram-transfer-members"
)

$successCount = 0
$failCount = 0

foreach ($func in $functions) {
    Write-Host "📦 نشر $func..." -ForegroundColor Yellow
    npx supabase functions deploy $func
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ تم نشر $func بنجاح" -ForegroundColor Green
        $successCount++
    } else {
        Write-Host "❌ فشل نشر $func" -ForegroundColor Red
        $failCount++
    }
    Write-Host ""
}

Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📊 النتيجة النهائية:" -ForegroundColor Cyan
Write-Host "✅ نجح: $successCount" -ForegroundColor Green
Write-Host "❌ فشل: $failCount" -ForegroundColor Red
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan

if ($failCount -eq 0) {
    Write-Host ""
    Write-Host "🎉 اكتمل نشر جميع Edge Functions بنجاح!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "⚠️ بعض Edge Functions فشل نشرها. تحقق من الأخطاء أعلاه." -ForegroundColor Yellow
}

