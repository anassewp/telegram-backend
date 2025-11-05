CREATE TABLE post_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    scheduled_accounts JSONB NOT NULL,
    scheduling_rules JSONB,
    status VARCHAR(50) DEFAULT 'scheduled',
    sent_accounts JSONB DEFAULT '[]',
    failed_accounts JSONB DEFAULT '[]',
    retry_count INTEGER DEFAULT 0,
    last_retry_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);