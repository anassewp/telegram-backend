CREATE TABLE user_platforms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    platform_id UUID NOT NULL REFERENCES platforms(id),
    is_connected BOOLEAN DEFAULT false,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    platform_user_id TEXT,
    platform_username TEXT,
    metadata JSONB,
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id,
    platform_id)
);