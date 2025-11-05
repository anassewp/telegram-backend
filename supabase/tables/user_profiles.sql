CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    website_url TEXT,
    location VARCHAR(255),
    date_of_birth DATE,
    gender VARCHAR(20),
    company VARCHAR(255),
    job_title VARCHAR(255),
    social_links JSONB,
    profile_completion_score INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);