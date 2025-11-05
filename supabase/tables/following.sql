CREATE TABLE following (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
    following_id_on_platform VARCHAR(255) NOT NULL,
    following_name VARCHAR(255),
    following_username VARCHAR(255),
    following_profile_url TEXT,
    following_avatar_url TEXT,
    is_verified BOOLEAN DEFAULT false,
    mutual_followers_count INTEGER DEFAULT 0,
    category VARCHAR(100),
    notes TEXT,
    is_favorite BOOLEAN DEFAULT false,
    unfollowed_at TIMESTAMP WITH TIME ZONE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);