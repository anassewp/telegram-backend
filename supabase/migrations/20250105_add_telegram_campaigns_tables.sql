-- Migration: إضافة جداول Telegram الجديدة
-- تاريخ: 2025-01-05
-- الوصف: إضافة جداول telegram_campaigns, telegram_sent_members, telegram_member_transfers
--        وتحديث telegram_campaign_messages

-- ============================================
-- 1. إنشاء جدول telegram_campaigns
-- ============================================
CREATE TABLE IF NOT EXISTS public.telegram_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    campaign_type VARCHAR(20) NOT NULL CHECK (campaign_type IN ('groups', 'members', 'mixed')),
    message_text TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed', 'failed')),
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('groups', 'members', 'both')),
    selected_groups JSONB DEFAULT '[]'::jsonb,
    selected_members JSONB DEFAULT '[]'::jsonb,
    session_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    distribution_strategy VARCHAR(20) NOT NULL DEFAULT 'equal' CHECK (distribution_strategy IN ('equal', 'round_robin', 'random', 'weighted')),
    max_messages_per_session INTEGER DEFAULT 100,
    max_messages_per_day INTEGER DEFAULT 200,
    delay_between_messages_min INTEGER DEFAULT 30,
    delay_between_messages_max INTEGER DEFAULT 90,
    delay_variation BOOLEAN DEFAULT true,
    exclude_sent_members BOOLEAN DEFAULT true,
    exclude_bots BOOLEAN DEFAULT true,
    exclude_premium BOOLEAN DEFAULT false,
    exclude_verified BOOLEAN DEFAULT false,
    exclude_scam BOOLEAN DEFAULT true,
    exclude_fake BOOLEAN DEFAULT true,
    personalize_messages BOOLEAN DEFAULT false,
    vary_emojis BOOLEAN DEFAULT false,
    message_templates JSONB DEFAULT '[]'::jsonb,
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

-- ============================================
-- 2. إنشاء جدول telegram_sent_members
-- ============================================
CREATE TABLE IF NOT EXISTS public.telegram_sent_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES telegram_campaigns(id) ON DELETE CASCADE,
    member_telegram_id BIGINT NOT NULL,
    group_id BIGINT,
    message_text TEXT,
    sent_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, campaign_id, member_telegram_id)
);

-- ============================================
-- 3. إنشاء جدول telegram_member_transfers
-- ============================================
CREATE TABLE IF NOT EXISTS public.telegram_member_transfers (
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

-- ============================================
-- 4. تحديث جدول telegram_campaign_messages
-- ============================================
-- إضافة الحقول الجديدة
ALTER TABLE telegram_campaign_messages
ADD COLUMN IF NOT EXISTS member_id BIGINT,
ADD COLUMN IF NOT EXISTS member_telegram_id BIGINT,
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS delay_applied INTEGER,
ADD COLUMN IF NOT EXISTS personalized_text TEXT;

-- تصحيح المرجع (يجب تنفيذه بحذر إذا كان هناك بيانات موجودة)
-- ملاحظة: إذا كان الجدول يحتوي على بيانات، قد تحتاج إلى نقلها أولاًS
ALTER TABLE telegram_campaign_messages
DROP CONSTRAINT IF EXISTS telegram_campaign_messages_campaign_id_fkey;
ALTER TABLE telegram_campaign_messages
ADD CONSTRAINT telegram_campaign_messages_campaign_id_fkey 
FOREIGN KEY (campaign_id) REFERENCES telegram_campaigns(id) ON DELETE CASCADE;

-- ============================================
-- 5. إنشاء Indexes
-- ============================================
-- Indexes لـ telegram_campaigns
CREATE INDEX IF NOT EXISTS idx_telegram_campaigns_user_id ON telegram_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_campaigns_status ON telegram_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_telegram_campaigns_campaign_type ON telegram_campaigns(campaign_type);
CREATE INDEX IF NOT EXISTS idx_telegram_campaigns_created_at ON telegram_campaigns(created_at);
CREATE INDEX IF NOT EXISTS idx_telegram_campaigns_schedule_at ON telegram_campaigns(schedule_at) WHERE schedule_at IS NOT NULL;

-- Indexes لـ telegram_sent_members
CREATE INDEX IF NOT EXISTS idx_telegram_sent_members_user_id ON telegram_sent_members(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_sent_members_campaign_id ON telegram_sent_members(campaign_id) WHERE campaign_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_telegram_sent_members_member_telegram_id ON telegram_sent_members(member_telegram_id);
CREATE INDEX IF NOT EXISTS idx_telegram_sent_members_group_id ON telegram_sent_members(group_id) WHERE group_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_telegram_sent_members_sent_at ON telegram_sent_members(sent_at);

-- Indexes لـ telegram_member_transfers
CREATE INDEX IF NOT EXISTS idx_telegram_member_transfers_user_id ON telegram_member_transfers(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_member_transfers_session_id ON telegram_member_transfers(session_id);
CREATE INDEX IF NOT EXISTS idx_telegram_member_transfers_source_group_id ON telegram_member_transfers(source_group_id);
CREATE INDEX IF NOT EXISTS idx_telegram_member_transfers_target_group_id ON telegram_member_transfers(target_group_id);
CREATE INDEX IF NOT EXISTS idx_telegram_member_transfers_status ON telegram_member_transfers(status);
CREATE INDEX IF NOT EXISTS idx_telegram_member_transfers_created_at ON telegram_member_transfers(created_at);

-- Indexes إضافية لـ telegram_campaign_messages
CREATE INDEX IF NOT EXISTS idx_telegram_campaign_messages_member_telegram_id ON telegram_campaign_messages(member_telegram_id) WHERE member_telegram_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_telegram_campaign_messages_retry_count ON telegram_campaign_messages(retry_count);

-- ============================================
-- 6. تفعيل RLS
-- ============================================
ALTER TABLE telegram_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_sent_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_member_transfers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. RLS Policies
-- ============================================
-- Policies لـ telegram_campaigns
DROP POLICY IF EXISTS "Users can view their own telegram campaigns" ON telegram_campaigns;
CREATE POLICY "Users can view their own telegram campaigns"
    ON telegram_campaigns FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own telegram campaigns" ON telegram_campaigns;
CREATE POLICY "Users can insert their own telegram campaigns"
    ON telegram_campaigns FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own telegram campaigns" ON telegram_campaigns;
CREATE POLICY "Users can update their own telegram campaigns"
    ON telegram_campaigns FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own telegram campaigns" ON telegram_campaigns;
CREATE POLICY "Users can delete their own telegram campaigns"
    ON telegram_campaigns FOR DELETE
    USING (auth.uid() = user_id);

-- Policies لـ telegram_sent_members
DROP POLICY IF EXISTS "Users can view their own sent members" ON telegram_sent_members;
CREATE POLICY "Users can view their own sent members"
    ON telegram_sent_members FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own sent members" ON telegram_sent_members;
CREATE POLICY "Users can insert their own sent members"
    ON telegram_sent_members FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own sent members" ON telegram_sent_members;
CREATE POLICY "Users can update their own sent members"
    ON telegram_sent_members FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own sent members" ON telegram_sent_members;
CREATE POLICY "Users can delete their own sent members"
    ON telegram_sent_members FOR DELETE
    USING (auth.uid() = user_id);

-- Policies لـ telegram_member_transfers
DROP POLICY IF EXISTS "Users can view their own member transfers" ON telegram_member_transfers;
CREATE POLICY "Users can view their own member transfers"
    ON telegram_member_transfers FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own member transfers" ON telegram_member_transfers;
CREATE POLICY "Users can insert their own member transfers"
    ON telegram_member_transfers FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own member transfers" ON telegram_member_transfers;
CREATE POLICY "Users can update their own member transfers"
    ON telegram_member_transfers FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own member transfers" ON telegram_member_transfers;
CREATE POLICY "Users can delete their own member transfers"
    ON telegram_member_transfers FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 8. Triggers لتحديث updated_at
-- ============================================
-- Function لـ telegram_campaigns
CREATE OR REPLACE FUNCTION update_telegram_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS telegram_campaigns_updated_at ON telegram_campaigns;
CREATE TRIGGER telegram_campaigns_updated_at
    BEFORE UPDATE ON telegram_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_telegram_campaigns_updated_at();

-- Function لـ telegram_member_transfers
CREATE OR REPLACE FUNCTION update_telegram_member_transfers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS telegram_member_transfers_updated_at ON telegram_member_transfers;
CREATE TRIGGER telegram_member_transfers_updated_at
    BEFORE UPDATE ON telegram_member_transfers
    FOR EACH ROW
    EXECUTE FUNCTION update_telegram_member_transfers_updated_at();

