CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_en TEXT,
    slug TEXT UNIQUE NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    billing_period TEXT NOT NULL,
    points_included INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    features JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);