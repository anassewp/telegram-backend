-- Migration: improve_handle_new_user_with_first_admin
-- Created at: 1762028324


-- إعادة إنشاء function handle_new_user مع منطق المستخدم الأول
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_count INTEGER;
  user_role TEXT;
BEGIN
  -- التحقق من عدد المستخدمين الحاليين
  SELECT COUNT(*) INTO user_count FROM profiles;
  
  -- إذا كان هذا أول مستخدم، اجعله admin
  IF user_count = 0 THEN
    user_role := 'admin';
  ELSE
    user_role := 'user';
  END IF;
  
  -- إدخال profile جديد للمستخدم
  INSERT INTO public.profiles (id, full_name, total_points, subscription_status, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    100, -- نقاط ترحيبية
    'free',
    user_role
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- تسجيل الخطأ ومتابعة العملية
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- حذف trigger القديم make_first_user_admin إذا كان موجوداً
DROP TRIGGER IF EXISTS set_first_user_as_admin ON profiles;
DROP FUNCTION IF EXISTS make_first_user_admin() CASCADE;
;