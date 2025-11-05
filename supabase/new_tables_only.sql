-- ============================================
-- SocialProMax - الجداول الجديدة فقط
-- ============================================
-- هذا الملف يحتوي على الجداول الجديدة فقط
-- آمن للنسخ واللصق مباشرة في Supabase SQL Editor
-- تاريخ الإنشاء: 2025-11-03
-- ============================================

-- ============================================
-- جدول telegram_campaign_messages
-- ============================================
CREATE TABLE IF NOT EXISTS public.telegram_campaign_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES telegram_sessions(id) ON DELETE CASCADE,
    group_id BIGINT NOT NULL,
    group_title TEXT,
    message_text TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes لـ telegram_campaign_messages
CREATE INDEX IF NOT EXISTS idx_telegram_campaign_messages_campaign_id ON telegram_campaign_messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_telegram_campaign_messages_user_id ON telegram_campaign_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_campaign_messages_session_id ON telegram_campaign_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_telegram_campaign_messages_status ON telegram_campaign_messages(status);

-- RLS Policies لـ telegram_campaign_messages
ALTER TABLE telegram_campaign_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own campaign messages" ON telegram_campaign_messages;
CREATE POLICY "Users can view their own campaign messages"
    ON telegram_campaign_messages FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own campaign messages" ON telegram_campaign_messages;
CREATE POLICY "Users can insert their own campaign messages"
    ON telegram_campaign_messages FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own campaign messages" ON telegram_campaign_messages;
CREATE POLICY "Users can update their own campaign messages"
    ON telegram_campaign_messages FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own campaign messages" ON telegram_campaign_messages;
CREATE POLICY "Users can delete their own campaign messages"
    ON telegram_campaign_messages FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger لـ telegram_campaign_messages
CREATE OR REPLACE FUNCTION update_telegram_campaign_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS telegram_campaign_messages_updated_at ON telegram_campaign_messages;
CREATE TRIGGER telegram_campaign_messages_updated_at
    BEFORE UPDATE ON telegram_campaign_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_telegram_campaign_messages_updated_at();

-- ============================================
-- جدول telegram_members
-- ============================================
CREATE TABLE IF NOT EXISTS public.telegram_members (
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

-- Indexes لـ telegram_members
CREATE INDEX IF NOT EXISTS idx_telegram_members_user_id ON telegram_members(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_members_group_id ON telegram_members(group_id);
CREATE INDEX IF NOT EXISTS idx_telegram_members_telegram_user_id ON telegram_members(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_members_extracted_at ON telegram_members(extracted_at);

-- RLS Policies لـ telegram_members
ALTER TABLE telegram_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own telegram members" ON telegram_members;
CREATE POLICY "Users can view their own telegram members"
    ON telegram_members FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own telegram members" ON telegram_members;
CREATE POLICY "Users can insert their own telegram members"
    ON telegram_members FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own telegram members" ON telegram_members;
CREATE POLICY "Users can update their own telegram members"
    ON telegram_members FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own telegram members" ON telegram_members;
CREATE POLICY "Users can delete their own telegram members"
    ON telegram_members FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger لـ telegram_members
CREATE OR REPLACE FUNCTION update_telegram_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS telegram_members_updated_at ON telegram_members;
CREATE TRIGGER telegram_members_updated_at
    BEFORE UPDATE ON telegram_members
    FOR EACH ROW
    EXECUTE FUNCTION update_telegram_members_updated_at();

-- ============================================
-- تم الانتهاء!
-- ============================================
-- تم إنشاء:
-- ✅ جدول telegram_campaign_messages
-- ✅ جدول telegram_members
-- ✅ جميع Indexes
-- ✅ جميع RLS Policies
-- ✅ جميع Triggers
-- ============================================

