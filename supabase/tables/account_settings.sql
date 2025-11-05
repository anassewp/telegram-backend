CREATE TABLE account_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
    auto_post BOOLEAN DEFAULT false,
    post_timing JSONB DEFAULT '{"days": [],
    "times": []}',
    content_filter JSONB DEFAULT '{}',
    hashtag_filter JSONB DEFAULT '{}',
    mention_responses JSONB DEFAULT '{}',
    analytics_enabled BOOLEAN DEFAULT true,
    notifications_enabled BOOLEAN DEFAULT true,
    custom_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);