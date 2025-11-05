-- جدول تتبع الأعضاء الذين تم الإرسال لهم في حملات Telegram
CREATE TABLE telegram_sent_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES telegram_campaigns(id) ON DELETE CASCADE, -- NULL للاستبعاد العام
    member_telegram_id BIGINT NOT NULL,
    group_id BIGINT,
    message_text TEXT,
    sent_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, campaign_id, member_telegram_id) -- لمنع التكرار
);

-- Indexes للأداء
CREATE INDEX idx_telegram_sent_members_user_id ON telegram_sent_members(user_id);
CREATE INDEX idx_telegram_sent_members_campaign_id ON telegram_sent_members(campaign_id) WHERE campaign_id IS NOT NULL;
CREATE INDEX idx_telegram_sent_members_member_telegram_id ON telegram_sent_members(member_telegram_id);
CREATE INDEX idx_telegram_sent_members_group_id ON telegram_sent_members(group_id) WHERE group_id IS NOT NULL;
CREATE INDEX idx_telegram_sent_members_sent_at ON telegram_sent_members(sent_at);

-- RLS Policies
ALTER TABLE telegram_sent_members ENABLE ROW LEVEL SECURITY;

-- المستخدم يمكنه قراءة سجلاته فقط
CREATE POLICY "Users can view their own sent members"
    ON telegram_sent_members FOR SELECT
    USING (auth.uid() = user_id);

-- المستخدم يمكنه إضافة سجلات جديدة
CREATE POLICY "Users can insert their own sent members"
    ON telegram_sent_members FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- المستخدم يمكنه تحديث سجلاته فقط
CREATE POLICY "Users can update their own sent members"
    ON telegram_sent_members FOR UPDATE
    USING (auth.uid() = user_id);

-- المستخدم يمكنه حذف سجلاته فقط
CREATE POLICY "Users can delete their own sent members"
    ON telegram_sent_members FOR DELETE
    USING (auth.uid() = user_id);

