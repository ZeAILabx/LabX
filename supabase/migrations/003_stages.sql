-- ============================================================
-- 003_stages.sql — 5 Stages
-- ============================================================

CREATE TABLE IF NOT EXISTS stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    stage_order INTEGER NOT NULL UNIQUE CHECK (stage_order BETWEEN 1 AND 5),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER stages_updated_at
    BEFORE UPDATE ON stages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
