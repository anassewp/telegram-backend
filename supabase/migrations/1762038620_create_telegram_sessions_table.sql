-- Migration: create_telegram_sessions_table
-- Created at: 1762038620

-- إنشاء جدول جلسات تيليجرام
CREATE TABLE telegram_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    api_id TEXT NOT NULL,
    api_hash TEXT NOT NULL,
    session_string TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive', 'error')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- إضافة indexes للأداء
CREATE INDEX idx_telegram_sessions_user_id ON telegram_sessions(user_id);
CREATE INDEX idx_telegram_sessions_status ON telegram_sessions(status);

-- RLS policies
ALTER TABLE telegram_sessions ENABLE ROW LEVEL SECURITY;

-- المستخدم يمكنه قراءة جلساته فقط
CREATE POLICY "Users can view their own telegram sessions"
    ON telegram_sessions FOR SELECT
    USING (auth.uid() = user_id);

-- المستخدم يمكنه إضافة جلسة جديدة
CREATE POLICY "Users can insert their own telegram sessions"
    ON telegram_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- المستخدم يمكنه تحديث جلساته فقط
CREATE POLICY "Users can update their own telegram sessions"
    ON telegram_sessions FOR UPDATE
    USING (auth.uid() = user_id);

-- المستخدم يمكنه حذف جلساته فقط
CREATE POLICY "Users can delete their own telegram sessions"
    ON telegram_sessions FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION update_telegram_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER telegram_sessions_updated_at
    BEFORE UPDATE ON telegram_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_telegram_sessions_updated_at();;