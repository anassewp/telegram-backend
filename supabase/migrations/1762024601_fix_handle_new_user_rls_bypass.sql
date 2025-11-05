-- Migration: fix_handle_new_user_rls_bypass
-- Created at: 1762024601


-- إعادة إنشاء function handle_new_user مع تجاوز RLS
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- إدخال profile جديد للمستخدم
  INSERT INTO public.profiles (id, full_name, total_points, subscription_status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    100, -- نقاط ترحيبية
    'free'
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- تسجيل الخطأ ومتابعة العملية
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- إعادة إنشاء trigger على auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- منح صلاحيات للـ function
GRANT EXECUTE ON FUNCTION handle_new_user() TO postgres;
GRANT EXECUTE ON FUNCTION handle_new_user() TO service_role;

-- إضافة policy جديدة للسماح بإدخال profiles من trigger
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;
CREATE POLICY "Service role can insert profiles"
  ON profiles
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- التأكد من أن الـ function يمكنها تجاوز RLS
ALTER FUNCTION handle_new_user() OWNER TO postgres;
;