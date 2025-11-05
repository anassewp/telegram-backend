-- جدول حفظ أعضاء Telegram المستخرجين
CREATE TABLE telegram_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    group_id BIGINT NOT NULL,
    telegram_user_id BIGINT NOT NULL,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    is_bot BOOLEAN DEFAULT false,
    is_premium BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    is_scam BOOLEAN DEFAULT false,
    is_fake BOOLEAN DEFAULT false,
    access_hash BIGINT,
    extracted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, group_id, telegram_user_id)
);

-- Indexes للأداء
CREATE INDEX idx_telegram_members_user_id ON telegram_members(user_id);
CREATE INDEX idx_telegram_members_group_id ON telegram_members(group_id);
CREATE INDEX idx_telegram_members_telegram_user_id ON telegram_members(telegram_user_id);
CREATE INDEX idx_telegram_members_extracted_at ON telegram_members(extracted_at);

-- RLS Policies
ALTER TABLE telegram_members ENABLE ROW LEVEL SECURITY;

-- المستخدم يمكنه قراءة أعضائه فقط
CREATE POLICY "Users can view their own telegram members"
    ON telegram_members FOR SELECT
    USING (auth.uid() = user_id);

-- المستخدم يمكنه إضافة أعضاء
CREATE POLICY "Users can insert their own telegram members"
    ON telegram_members FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- المستخدم يمكنه تحديث أعضائه فقط
CREATE POLICY "Users can update their own telegram members"
    ON telegram_members FOR UPDATE
    USING (auth.uid() = user_id);

-- المستخدم يمكنه حذف أعضائه فقط
CREATE POLICY "Users can delete their own telegram members"
    ON telegram_members FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION update_telegram_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER telegram_members_updated_at
    BEFORE UPDATE ON telegram_members
    FOR EACH ROW
    EXECUTE FUNCTION update_telegram_members_updated_at();

