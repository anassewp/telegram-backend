-- Migration: add_members_visibility_type
-- Created at: 2025-01-06
-- إضافة حقل members_visibility_type للفلترة المتقدمة

-- إضافة الحقل الجديد
ALTER TABLE telegram_groups 
ADD COLUMN IF NOT EXISTS members_visibility_type VARCHAR(20) DEFAULT 'hidden';

-- إضافة index للفلترة السريعة
CREATE INDEX IF NOT EXISTS idx_telegram_groups_members_visibility_type ON telegram_groups(members_visibility_type);

-- تعليق على الحقل
COMMENT ON COLUMN telegram_groups.members_visibility_type IS 'نوع ظهور الأعضاء: fully_visible (ظاهرين بالكامل), admin_only (الإدمن فقط), hidden (مخفيين)';

-- ملاحظة: سيتم تحديث القيم تلقائياً عند استيراد المجموعات من Backend
-- أو يمكن تحديثها يدوياً لاحقاً إذا لزم الأمر

