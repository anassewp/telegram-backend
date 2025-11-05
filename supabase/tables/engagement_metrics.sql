CREATE TABLE engagement_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES social_accounts(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    total_likes INTEGER DEFAULT 0,
    total_comments INTEGER DEFAULT 0,
    total_shares INTEGER DEFAULT 0,
    total_saves INTEGER DEFAULT 0,
    total_clicks INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5,2) DEFAULT 0,
    avg_likes_per_post DECIMAL(8,2) DEFAULT 0,
    avg_comments_per_post DECIMAL(8,2) DEFAULT 0,
    avg_shares_per_post DECIMAL(8,2) DEFAULT 0,
    viral_posts_count INTEGER DEFAULT 0,
    best_performing_content JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);