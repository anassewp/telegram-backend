CREATE TABLE telegram_groups (
    id SERIAL PRIMARY KEY,
    telegram_group_id BIGINT UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    username VARCHAR(255),
    type VARCHAR(50) NOT NULL,
    description TEXT,
    members_count INTEGER DEFAULT 0,
    members_visible BOOLEAN DEFAULT true,
    is_private BOOLEAN DEFAULT false,
    is_restricted BOOLEAN DEFAULT false,
    can_send BOOLEAN DEFAULT true,
    is_closed BOOLEAN DEFAULT false,
    members_visibility_type VARCHAR(20) DEFAULT 'hidden',
    photo_url TEXT,
    is_public BOOLEAN DEFAULT true,
    verified BOOLEAN DEFAULT false,
    invite_link TEXT,
    language VARCHAR(10) DEFAULT 'unknown',
    region VARCHAR(100) DEFAULT 'unknown',
    category VARCHAR(100) DEFAULT 'General',
    imported_by UUID NOT NULL,
    import_status VARCHAR(50) DEFAULT 'pending',
    imported_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes لتسريع الاستعلامات الجديدة
CREATE INDEX idx_telegram_groups_members_visible ON telegram_groups(members_visible);
CREATE INDEX idx_telegram_groups_is_private ON telegram_groups(is_private);
CREATE INDEX idx_telegram_groups_can_send ON telegram_groups(can_send);
CREATE INDEX idx_telegram_groups_members_visibility_type ON telegram_groups(members_visibility_type);

-- تعليقات توضيحية للحقول الجديدة
COMMENT ON COLUMN telegram_groups.members_visible IS 'هل الأعضاء ظاهرين للجميع (true) أم مخفيين للإدمن فقط (false)';
COMMENT ON COLUMN telegram_groups.is_private IS 'هل المجموعة خاصة (true) أم عامة (false)';
COMMENT ON COLUMN telegram_groups.is_restricted IS 'هل المجموعة مقيدة';
COMMENT ON COLUMN telegram_groups.can_send IS 'هل يمكن الإرسال في المجموعة';
COMMENT ON COLUMN telegram_groups.is_closed IS 'هل المجموعة مغلقة';
COMMENT ON COLUMN telegram_groups.members_visibility_type IS 'نوع ظهور الأعضاء: fully_visible, admin_only, hidden';
