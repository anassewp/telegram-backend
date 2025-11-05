CREATE TABLE social_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform_id UUID NOT NULL REFERENCES social_platforms(id),
    account_name VARCHAR(255) NOT NULL,
    account_handle VARCHAR(255) NOT NULL,
    account_url TEXT,
    account_id_on_platform VARCHAR(255),
    follower_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    posts_count INTEGER DEFAULT 0,
    account_type VARCHAR(50) DEFAULT 'personal',
    verification_status VARCHAR(50) DEFAULT 'unverified',
    is_active BOOLEAN DEFAULT true,
    last_sync TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);