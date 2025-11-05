-- جدول تتبع عمليات نقل الأعضاء بين مجموعات Telegram
CREATE TABLE telegram_member_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source_group_id BIGINT NOT NULL,
    target_group_id BIGINT NOT NULL,
    session_id UUID NOT NULL REFERENCES telegram_sessions(id) ON DELETE CASCADE,
    member_telegram_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'transferring', 'transferred', 'failed')),
    error_message TEXT,
    transferred_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes للأداء
CREATE INDEX idx_telegram_member_transfers_user_id ON telegram_member_transfers(user_id);
CREATE INDEX idx_telegram_member_transfers_session_id ON telegram_member_transfers(session_id);
CREATE INDEX idx_telegram_member_transfers_source_group_id ON telegram_member_transfers(source_group_id);
CREATE INDEX idx_telegram_member_transfers_target_group_id ON telegram_member_transfers(target_group_id);
CREATE INDEX idx_telegram_member_transfers_status ON telegram_member_transfers(status);
CREATE INDEX idx_telegram_member_transfers_created_at ON telegram_member_transfers(created_at);

-- RLS Policies
ALTER TABLE telegram_member_transfers ENABLE ROW LEVEL SECURITY;

-- المستخدم يمكنه قراءة عمليات نقله فقط
CREATE POLICY "Users can view their own member transfers"
    ON telegram_member_transfers FOR SELECT
    USING (auth.uid() = user_id);

-- المستخدم يمكنه إضافة عمليات نقل جديدة
CREATE POLICY "Users can insert their own member transfers"
    ON telegram_member_transfers FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- المستخدم يمكنه تحديث عمليات نقله فقط
CREATE POLICY "Users can update their own member transfers"
    ON telegram_member_transfers FOR UPDATE
    USING (auth.uid() = user_id);

-- المستخدم يمكنه حذف عمليات نقله فقط
CREATE POLICY "Users can delete their own member transfers"
    ON telegram_member_transfers FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION update_telegram_member_transfers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER telegram_member_transfers_updated_at
    BEFORE UPDATE ON telegram_member_transfers
    FOR EACH ROW
    EXECUTE FUNCTION update_telegram_member_transfers_updated_at();

