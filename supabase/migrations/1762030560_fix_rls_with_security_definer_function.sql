-- Migration: fix_rls_with_security_definer_function
-- Created at: 1762030560


-- حذف السياسات القديمة
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- إنشاء function آمنة للتحقق من role المستخدم
-- SECURITY DEFINER تسمح بالوصول بدون RLS check
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = auth.uid();
  
  RETURN COALESCE(user_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- سياسة بسيطة: المستخدمون يقرأون profiles الخاصة بهم أو جميعها إذا كانوا admins
CREATE POLICY "Enable read access for users"
ON profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR auth.user_role() = 'admin'
);
;