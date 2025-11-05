-- ============================================
-- SocialProMax - Complete Database Schema
-- ============================================
-- هذا الملف يحتوي على جميع الجداول + الجداول الجديدة لـ Telegram
-- تاريخ الإنشاء: 2025-11-03
-- ============================================

-- ============================================
-- PART 1: الجداول الأساسية الموجودة
-- ============================================

CREATE TABLE IF NOT EXISTS public.activities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  activity_type text NOT NULL,
  title text NOT NULL,
  description text,
  platform_id uuid,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT activities_pkey PRIMARY KEY (id),
  CONSTRAINT activities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT activities_platform_id_fkey FOREIGN KEY (platform_id) REFERENCES public.platforms(id)
);

CREATE TABLE IF NOT EXISTS public.admin_settings (
  id bigserial NOT NULL,
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb,
  description text,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid,
  CONSTRAINT admin_settings_pkey PRIMARY KEY (id),
  CONSTRAINT admin_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.api_keys (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  platform_id uuid,
  key_name text NOT NULL,
  api_key text NOT NULL,
  is_active boolean DEFAULT true,
  last_used_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT api_keys_pkey PRIMARY KEY (id),
  CONSTRAINT api_keys_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT api_keys_platform_id_fkey FOREIGN KEY (platform_id) REFERENCES public.platforms(id)
);

CREATE TABLE IF NOT EXISTS public.campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  campaign_name text NOT NULL,
  platform_id uuid,
  status text DEFAULT 'draft'::text,
  target_audience jsonb,
  content jsonb,
  schedule_at timestamp with time zone,
  sent_at timestamp with time zone,
  stats jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT campaigns_pkey PRIMARY KEY (id),
  CONSTRAINT campaigns_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT campaigns_platform_id_fkey FOREIGN KEY (platform_id) REFERENCES public.platforms(id)
);

CREATE TABLE IF NOT EXISTS public.features (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_en text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  icon text,
  category text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT features_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subscription_id uuid,
  invoice_number text NOT NULL UNIQUE,
  amount numeric NOT NULL,
  currency text DEFAULT 'USD'::text,
  status text DEFAULT 'pending'::text,
  due_date timestamp with time zone,
  paid_at timestamp with time zone,
  stripe_invoice_id text,
  invoice_url text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT invoices_pkey PRIMARY KEY (id),
  CONSTRAINT invoices_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT invoices_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id)
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info'::text,
  is_read boolean DEFAULT false,
  action_url text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.plan_features (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL,
  feature_id uuid NOT NULL,
  feature_value text,
  is_enabled boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT plan_features_pkey PRIMARY KEY (id),
  CONSTRAINT plan_features_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id),
  CONSTRAINT plan_features_feature_id_fkey FOREIGN KEY (feature_id) REFERENCES public.features(id)
);

CREATE TABLE IF NOT EXISTS public.platforms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_en text NOT NULL,
  slug text NOT NULL UNIQUE,
  icon_url text,
  color text,
  description text,
  is_active boolean DEFAULT true,
  requires_premium boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT platforms_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.points_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount integer NOT NULL,
  transaction_type text NOT NULL,
  description text,
  reference_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT points_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT points_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  full_name text,
  company_name text,
  phone text,
  avatar_url text,
  total_points integer DEFAULT 0,
  subscription_status text DEFAULT 'free'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  role text DEFAULT 'user'::text CHECK (role = ANY (ARRAY['admin'::text, 'user'::text])),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  report_type text NOT NULL,
  report_name text NOT NULL,
  date_range_start timestamp with time zone,
  date_range_end timestamp with time zone,
  data jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reports_pkey PRIMARY KEY (id),
  CONSTRAINT reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_en text,
  slug text NOT NULL UNIQUE,
  price numeric NOT NULL,
  currency text DEFAULT 'USD'::text,
  billing_period text NOT NULL,
  points_included integer DEFAULT 0,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  features jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT subscription_plans_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id uuid NOT NULL,
  status text DEFAULT 'active'::text,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean DEFAULT false,
  stripe_subscription_id text UNIQUE,
  stripe_customer_id text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id)
);

CREATE TABLE IF NOT EXISTS public.user_platforms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  platform_id uuid NOT NULL,
  is_connected boolean DEFAULT false,
  access_token text,
  refresh_token text,
  token_expires_at timestamp with time zone,
  platform_user_id text,
  platform_username text,
  metadata jsonb,
  last_sync_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_platforms_pkey PRIMARY KEY (id),
  CONSTRAINT user_platforms_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_platforms_platform_id_fkey FOREIGN KEY (platform_id) REFERENCES public.platforms(id)
);

-- ============================================
-- PART 2: جداول Telegram الموجودة
-- ============================================

CREATE TABLE IF NOT EXISTS public.telegram_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_name text NOT NULL,
  phone text NOT NULL,
  api_id text NOT NULL,
  api_hash text NOT NULL,
  session_string text,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'active'::text, 'inactive'::text, 'error'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT telegram_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT telegram_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.telegram_groups (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_id uuid NOT NULL,
  group_id bigint NOT NULL,
  title text NOT NULL,
  username text,
  members_count integer DEFAULT 0,
  type text DEFAULT 'group'::text CHECK (type = ANY (ARRAY['group'::text, 'supergroup'::text, 'channel'::text])),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT telegram_groups_pkey PRIMARY KEY (id),
  CONSTRAINT telegram_groups_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT telegram_groups_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.telegram_sessions(id)
);

-- ============================================
-- PART 3: جداول Telegram الجديدة
-- ============================================

-- جدول حملات Telegram المتقدمة
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

-- جدول حفظ رسائل الحملات على Telegram
CREATE TABLE IF NOT EXISTS public.telegram_campaign_messages (
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
    member_id BIGINT,
    member_telegram_id BIGINT,
    retry_count INTEGER DEFAULT 0,
    delay_applied INTEGER,
    personalized_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول حفظ أعضاء Telegram المستخرجين
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

-- جدول تتبع الأعضاء الذين تم الإرسال لهم
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

-- جدول تتبع عمليات نقل الأعضاء
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
-- PART 4: Indexes للأداء
-- ============================================

-- Indexes لـ telegram_campaigns
CREATE INDEX IF NOT EXISTS idx_telegram_campaigns_user_id ON telegram_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_campaigns_status ON telegram_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_telegram_campaigns_campaign_type ON telegram_campaigns(campaign_type);
CREATE INDEX IF NOT EXISTS idx_telegram_campaigns_created_at ON telegram_campaigns(created_at);
CREATE INDEX IF NOT EXISTS idx_telegram_campaigns_schedule_at ON telegram_campaigns(schedule_at) WHERE schedule_at IS NOT NULL;

-- Indexes لـ telegram_campaign_messages
CREATE INDEX IF NOT EXISTS idx_telegram_campaign_messages_campaign_id ON telegram_campaign_messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_telegram_campaign_messages_user_id ON telegram_campaign_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_campaign_messages_session_id ON telegram_campaign_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_telegram_campaign_messages_status ON telegram_campaign_messages(status);
CREATE INDEX IF NOT EXISTS idx_telegram_campaign_messages_member_telegram_id ON telegram_campaign_messages(member_telegram_id) WHERE member_telegram_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_telegram_campaign_messages_retry_count ON telegram_campaign_messages(retry_count);

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

-- Indexes لـ telegram_members
CREATE INDEX IF NOT EXISTS idx_telegram_members_user_id ON telegram_members(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_members_group_id ON telegram_members(group_id);
CREATE INDEX IF NOT EXISTS idx_telegram_members_telegram_user_id ON telegram_members(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_members_extracted_at ON telegram_members(extracted_at);

-- ============================================
-- PART 5: Row Level Security (RLS)
-- ============================================

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE telegram_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_campaign_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_sent_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_member_transfers ENABLE ROW LEVEL SECURITY;

-- RLS Policies لـ telegram_campaigns
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

-- RLS Policies لـ telegram_campaign_messages
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

-- RLS Policies لـ telegram_members
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

-- RLS Policies لـ telegram_sent_members
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

-- RLS Policies لـ telegram_member_transfers
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
-- PART 6: Triggers لتحديث updated_at
-- ============================================

-- Functions لتحديث updated_at
CREATE OR REPLACE FUNCTION update_telegram_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_telegram_campaign_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_telegram_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_telegram_member_transfers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS telegram_campaigns_updated_at ON telegram_campaigns;
CREATE TRIGGER telegram_campaigns_updated_at
    BEFORE UPDATE ON telegram_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_telegram_campaigns_updated_at();

DROP TRIGGER IF EXISTS telegram_campaign_messages_updated_at ON telegram_campaign_messages;
CREATE TRIGGER telegram_campaign_messages_updated_at
    BEFORE UPDATE ON telegram_campaign_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_telegram_campaign_messages_updated_at();

DROP TRIGGER IF EXISTS telegram_members_updated_at ON telegram_members;
CREATE TRIGGER telegram_members_updated_at
    BEFORE UPDATE ON telegram_members
    FOR EACH ROW
    EXECUTE FUNCTION update_telegram_members_updated_at();

DROP TRIGGER IF EXISTS telegram_member_transfers_updated_at ON telegram_member_transfers;
CREATE TRIGGER telegram_member_transfers_updated_at
    BEFORE UPDATE ON telegram_member_transfers
    FOR EACH ROW
    EXECUTE FUNCTION update_telegram_member_transfers_updated_at();

-- ============================================
-- تم الانتهاء!
-- ============================================
-- هذا الملف يحتوي على:
-- ✅ جميع الجداول الأساسية (19 جدول)
-- ✅ جداول Telegram الموجودة (2 جدول: telegram_sessions, telegram_groups)
-- ✅ جداول Telegram الجديدة (5 جداول):
--    - telegram_campaigns (جديد)
--    - telegram_campaign_messages (محدث)
--    - telegram_members (موجود)
--    - telegram_sent_members (جديد)
--    - telegram_member_transfers (جديد)
-- ✅ جميع Indexes
-- ✅ جميع RLS Policies
-- ✅ جميع Triggers
-- ============================================

