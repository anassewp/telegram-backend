CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_preferences JSONB DEFAULT '{"email": true,
    "push": true,
    "sms": false}',
    privacy_settings JSONB DEFAULT '{"profile_visibility": "public",
    "show_online_status": true}',
    content_preferences JSONB DEFAULT '{"auto_publish": false,
    "draft_before_post": true}',
    interface_settings JSONB DEFAULT '{"theme": "light",
    "language": "ar",
    "timezone": "UTC"}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);