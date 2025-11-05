-- Migration: add_admin_role_system
-- Created at: 1762022472

-- إضافة عمود role في جدول profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user'));

-- إنشاء index للبحث السريع
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- تحديث RLS policy لجدول profiles
-- السماح للـ Admin بقراءة جميع الملفات الشخصية
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
  OR auth.uid() = id
);

-- السماح للـ Admin بتحديث أي ملف شخصي
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
CREATE POLICY "Admins can update any profile"
ON profiles FOR UPDATE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
  OR auth.uid() = id
);

-- إنشاء جدول admin_settings
CREATE TABLE IF NOT EXISTS admin_settings (
  id BIGSERIAL PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- RLS لجدول admin_settings
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only admins can manage settings" ON admin_settings;
CREATE POLICY "Only admins can manage settings"
ON admin_settings
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
);

-- Function لتعيين أول مستخدم كـ Admin
CREATE OR REPLACE FUNCTION make_first_user_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- التحقق من عدد المستخدمين
  IF (SELECT COUNT(*) FROM profiles) = 1 THEN
    -- تعيين أول مستخدم كـ Admin
    UPDATE profiles 
    SET role = 'admin' 
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger لتشغيل الـ Function عند إضافة مستخدم جديد
DROP TRIGGER IF EXISTS set_first_user_as_admin ON profiles;
CREATE TRIGGER set_first_user_as_admin
AFTER INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION make_first_user_admin();

-- إضافة بعض الإعدادات الافتراضية
INSERT INTO admin_settings (setting_key, setting_value, description) VALUES
('platform_name', '"SocialPro"', 'اسم المنصة'),
('max_free_campaigns', '5', 'الحد الأقصى للحملات المجانية'),
('default_points', '100', 'النقاط الافتراضية للمستخدمين الجدد'),
('maintenance_mode', 'false', 'وضع الصيانة')
ON CONFLICT (setting_key) DO NOTHING;;