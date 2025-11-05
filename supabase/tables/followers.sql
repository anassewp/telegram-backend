CREATE TABLE followers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
    follower_id_on_platform VARCHAR(255) NOT NULL,
    follower_name VARCHAR(255),
    follower_username VARCHAR(255),
    follower_profile_url TEXT,
    follower_avatar_url TEXT,
    is_verified BOOLEAN DEFAULT false,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    is_mutual BOOLEAN DEFAULT false,
    last_interaction_at TIMESTAMP WITH TIME ZONE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);