CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    platform_id UUID REFERENCES platforms(id),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);