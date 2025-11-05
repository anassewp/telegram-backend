CREATE TABLE social_platforms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform_name VARCHAR(50) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    icon_url TEXT,
    api_endpoint TEXT,
    max_posts_per_day INTEGER DEFAULT 50,
    supported_features JSONB,
    rate_limits JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);