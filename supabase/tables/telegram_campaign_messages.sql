-- جدول حفظ رسائل الحملات على Telegram
CREATE TABLE telegram_campaign_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES telegram_campaigns(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES telegram_sessions(id) ON DELETE CASCADE,
    group_id BIGINT NOT NULL,
    group_title TEXT,
    message_text TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    -- الحقول الجديدة المضافة
    member_id BIGINT, -- معرف العضو المحلي (من telegram_members)
    member_telegram_id BIGINT, -- معرف العضو في Telegram (للرسائل المباشرة DM)
    retry_count INTEGER DEFAULT 0, -- عدد المحاولات
    delay_applied INTEGER, -- التأخير المطبق بالثواني
    personalized_text TEXT, -- النص المخصص (إذا تم التخصيص)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes للأداء
CREATE INDEX idx_telegram_campaign_messages_campaign_id ON telegram_campaign_messages(campaign_id);
CREATE INDEX idx_telegram_campaign_messages_user_id ON telegram_campaign_messages(user_id);
CREATE INDEX idx_telegram_campaign_messages_session_id ON telegram_campaign_messages(session_id);
CREATE INDEX idx_telegram_campaign_messages_status ON telegram_campaign_messages(status);
CREATE INDEX idx_telegram_campaign_messages_member_telegram_id ON telegram_campaign_messages(member_telegram_id) WHERE member_telegram_id IS NOT NULL;
CREATE INDEX idx_telegram_campaign_messages_retry_count ON telegram_campaign_messages(retry_count);

-- RLS Policies
ALTER TABLE telegram_campaign_messages ENABLE ROW LEVEL SECURITY;

-- المستخدم يمكنه قراءة رسائله فقط
CREATE POLICY "Users can view their own campaign messages"
    ON telegram_campaign_messages FOR SELECT
    USING (auth.uid() = user_id);

-- المستخدم يمكنه إضافة رسائل جديدة
CREATE POLICY "Users can insert their own campaign messages"
    ON telegram_campaign_messages FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- المستخدم يمكنه تحديث رسائله فقط
CREATE POLICY "Users can update their own campaign messages"
    ON telegram_campaign_messages FOR UPDATE
    USING (auth.uid() = user_id);

-- Trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION update_telegram_campaign_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER telegram_campaign_messages_updated_at
    BEFORE UPDATE ON telegram_campaign_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_telegram_campaign_messages_updated_at();

