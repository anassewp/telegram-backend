-- Migration: create_telegram_groups_table
-- Created at: 1762038622

-- إنشاء جدول مجموعات تيليجرام
CREATE TABLE telegram_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES telegram_sessions(id) ON DELETE CASCADE,
    group_id BIGINT NOT NULL,
    title TEXT NOT NULL,
    username TEXT,
    members_count INTEGER DEFAULT 0,
    type TEXT DEFAULT 'group' CHECK (type IN ('group', 'supergroup', 'channel')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, group_id)
);

-- إضافة indexes للأداء
CREATE INDEX idx_telegram_groups_user_id ON telegram_groups(user_id);
CREATE INDEX idx_telegram_groups_session_id ON telegram_groups(session_id);
CREATE INDEX idx_telegram_groups_group_id ON telegram_groups(group_id);
CREATE INDEX idx_telegram_groups_is_active ON telegram_groups(is_active);

-- RLS policies
ALTER TABLE telegram_groups ENABLE ROW LEVEL SECURITY;

-- المستخدم يمكنه قراءة مجموعاته فقط
CREATE POLICY "Users can view their own telegram groups"
    ON telegram_groups FOR SELECT
    USING (auth.uid() = user_id);

-- المستخدم يمكنه إضافة مجموعة جديدة
CREATE POLICY "Users can insert their own telegram groups"
    ON telegram_groups FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- المستخدم يمكنه تحديث مجموعاته فقط
CREATE POLICY "Users can update their own telegram groups"
    ON telegram_groups FOR UPDATE
    USING (auth.uid() = user_id);

-- المستخدم يمكنه حذف مجموعاته فقط
CREATE POLICY "Users can delete their own telegram groups"
    ON telegram_groups FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION update_telegram_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER telegram_groups_updated_at
    BEFORE UPDATE ON telegram_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_telegram_groups_updated_at();;