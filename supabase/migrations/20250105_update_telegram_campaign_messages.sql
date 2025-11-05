-- Migration: تحديث جدول telegram_campaign_messages
-- تاريخ: 2025-01-05
-- الهدف: إضافة حقول جديدة وتصحيح المرجع إلى telegram_campaigns

-- 1. إضافة الحقول الجديدة (إذا لم تكن موجودة)
ALTER TABLE telegram_campaign_messages
ADD COLUMN IF NOT EXISTS member_id BIGINT,
ADD COLUMN IF NOT EXISTS member_telegram_id BIGINT,
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS delay_applied INTEGER, -- التأخير المطبق بالثواني
ADD COLUMN IF NOT EXISTS personalized_text TEXT; -- النص المخصص

-- 2. إنشاء Indexes جديدة للحقول المضافة
CREATE INDEX IF NOT EXISTS idx_telegram_campaign_messages_member_telegram_id 
    ON telegram_campaign_messages(member_telegram_id) 
    WHERE member_telegram_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_telegram_campaign_messages_retry_count 
    ON telegram_campaign_messages(retry_count);

-- 3. ملاحظة: تصحيح المرجع campaign_id يحتاج إلى migration منفصل
-- لأن الجدول قد يحتوي على بيانات موجودة تشير إلى campaigns(id)
-- يجب تنفيذ هذا بعد التأكد من عدم وجود بيانات مهمة أو بعد نقلها
-- ALTER TABLE telegram_campaign_messages
-- DROP CONSTRAINT IF EXISTS telegram_campaign_messages_campaign_id_fkey;
-- ALTER TABLE telegram_campaign_messages
-- ADD CONSTRAINT telegram_campaign_messages_campaign_id_fkey 
-- FOREIGN KEY (campaign_id) REFERENCES telegram_campaigns(id) ON DELETE CASCADE;

