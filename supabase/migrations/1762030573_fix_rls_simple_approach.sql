-- Migration: fix_rls_simple_approach
-- Created at: 1762030573


-- حذف السياسات القديمة
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;

-- إنشاء function في public schema للتحقق من role
DROP FUNCTION IF EXISTS public.get_my_role();
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
  
  RETURN COALESCE(user_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- سياسة SELECT بسيطة
CREATE POLICY "Enable read for own or admin"
ON profiles FOR SELECT
TO authenticated
USING (
  id = auth.uid() OR 
  (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
);

-- سياسة UPDATE بسيطة
CREATE POLICY "Enable update for own or admin"
ON profiles FOR UPDATE
TO authenticated
USING (
  id = auth.uid() OR 
  (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
)
WITH CHECK (
  id = auth.uid() OR 
  (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
);
;