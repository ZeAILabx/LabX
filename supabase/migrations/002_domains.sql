-- ============================================================
-- 002_domains.sql — 12 Founder Domains
-- ============================================================

CREATE TABLE IF NOT EXISTS domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    display_order INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER domains_updated_at
    BEFORE UPDATE ON domains
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Add FK from profiles to domains
ALTER TABLE profiles ADD CONSTRAINT fk_profiles_domain
    FOREIGN KEY (domain_id) REFERENCES domains(id);
