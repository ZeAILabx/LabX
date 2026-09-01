-- ============================================================
-- 012_events.sql — Events & Announcements (view only, no registration)
-- ============================================================

CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'announcement' CHECK (type IN ('event', 'announcement')),
    event_date TIMESTAMPTZ,
    event_time TEXT,
    location TEXT,
    is_online BOOLEAN DEFAULT FALSE,
    meeting_url TEXT,
    banner_url TEXT,
    speaker TEXT,
    external_url TEXT,
    target_domain UUID REFERENCES domains(id),
    target_guild UUID REFERENCES guilds(id),
    target_stage UUID REFERENCES stages(id),
    status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER announcements_updated_at
    BEFORE UPDATE ON announcements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_announcements_status ON announcements(status);
CREATE INDEX idx_announcements_type ON announcements(type);
CREATE INDEX idx_announcements_date ON announcements(event_date);
