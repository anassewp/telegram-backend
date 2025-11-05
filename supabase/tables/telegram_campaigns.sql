-- جدول حملات Telegram المتقدمة
CREATE TABLE telegram_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    campaign_type VARCHAR(20) NOT NULL CHECK (campaign_type IN ('groups', 'members', 'mixed')),
    message_text TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed', 'failed')),
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('groups', 'members', 'both')),
    selected_groups JSONB DEFAULT '[]'::jsonb,
    selected_members JSONB DEFAULT '[]'::jsonb,
    session_ids JSONB NOT NULL DEFAULT '[]'::jsonb, -- قائمة session_ids
    distribution_strategy VARCHAR(20) NOT NULL DEFAULT 'equal' CHECK (distribution_strategy IN ('equal', 'round_robin', 'random', 'weighted')),
    max_messages_per_session INTEGER DEFAULT 100,
    max_messages_per_day INTEGER DEFAULT 200,
    delay_between_messages_min INTEGER DEFAULT 30, -- بالثواني
    delay_between_messages_max INTEGER DEFAULT 90, -- بالثواني
    delay_variation BOOLEAN DEFAULT true, -- تنويع عشوائي
    exclude_sent_members BOOLEAN DEFAULT true,
    exclude_bots BOOLEAN DEFAULT true,
    exclude_premium BOOLEAN DEFAULT false,
    exclude_verified BOOLEAN DEFAULT false,
    exclude_scam BOOLEAN DEFAULT true,
    exclude_fake BOOLEAN DEFAULT true,
    personalize_messages BOOLEAN DEFAULT false, -- تخصيص بالاسم
    vary_emojis BOOLEAN DEFAULT false, -- تنويع الإيموجي
    message_templates JSONB DEFAULT '[]'::jsonb, -- قوالب رسائل متعددة
    schedule_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    paused_at TIMESTAMPTZ,
    total_targets INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes للأداء
CREATE INDEX idx_telegram_campaigns_user_id ON telegram_campaigns(user_id);
CREATE INDEX idx_telegram_campaigns_status ON telegram_campaigns(status);
CREATE INDEX idx_telegram_campaigns_campaign_type ON telegram_campaigns(campaign_type);
CREATE INDEX idx_telegram_campaigns_created_at ON telegram_campaigns(created_at);
CREATE INDEX idx_telegram_campaigns_schedule_at ON telegram_campaigns(schedule_at) WHERE schedule_at IS NOT NULL;

-- RLS Policies
ALTER TABLE telegram_campaigns ENABLE ROW LEVEL SECURITY;

-- المستخدم يمكنه قراءة حملاته فقط
CREATE POLICY "Users can view their own telegram campaigns"
    ON telegram_campaigns FOR SELECT
    USING (auth.uid() = user_id);

-- المستخدم يمكنه إضافة حملات جديدة
CREATE POLICY "Users can insert their own telegram campaigns"
    ON telegram_campaigns FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- المستخدم يمكنه تحديث حملاته فقط
CREATE POLICY "Users can update their own telegram campaigns"
    ON telegram_campaigns FOR UPDATE
    USING (auth.uid() = user_id);

-- المستخدم يمكنه حذف حملاته فقط
CREATE POLICY "Users can delete their own telegram campaigns"
    ON telegram_campaigns FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION update_telegram_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER telegram_campaigns_updated_at
    BEFORE UPDATE ON telegram_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_telegram_campaigns_updated_at();

