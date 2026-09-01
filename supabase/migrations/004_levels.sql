-- ============================================================
-- 004_levels.sql — 5 Levels per Stage (25 total)
-- ============================================================

CREATE TABLE IF NOT EXISTS levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stage_id UUID NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    level_order INTEGER NOT NULL CHECK (level_order BETWEEN 1 AND 5),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(stage_id, level_order)
);

CREATE TRIGGER levels_updated_at
    BEFORE UPDATE ON levels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_levels_stage ON levels(stage_id);
