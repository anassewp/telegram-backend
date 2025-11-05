-- Migration: simplify_profiles_rls
-- Created at: 1762030594


-- حذف جميع السياسات المعقدة
DROP POLICY IF EXISTS "Enable read for own or admin" ON profiles;
DROP POLICY IF EXISTS "Enable update for own or admin" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;

-- سياسات بسيطة وواضحة
-- 1. أي مستخدم مُسجّل دخول يمكنه قراءة جميع الـ profiles
CREATE POLICY "Authenticated users can read all profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- 2. المستخدمون يمكنهم تحديث profiles الخاصة بهم فقط
CREATE POLICY "Users can update own profile only"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. السماح بإدراج profile عبر trigger فقط
CREATE POLICY "Allow insert for service role"
ON profiles FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Allow insert for authenticated matching uid"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);
;