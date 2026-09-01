-- ============================================================
-- 005_milestones.sql — 3 Milestones per Level
-- Milestones are domain-specific (12 domains × 5 stages × 5 levels × 3 milestones = 900)
-- ============================================================

CREATE TABLE IF NOT EXISTS milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
    stage_id UUID NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
    level_id UUID NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    milestone_order INTEGER NOT NULL CHECK (milestone_order BETWEEN 1 AND 3),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(domain_id, level_id, milestone_order)
);

CREATE TRIGGER milestones_updated_at
    BEFORE UPDATE ON milestones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_milestones_domain ON milestones(domain_id);
CREATE INDEX idx_milestones_stage ON milestones(stage_id);
CREATE INDEX idx_milestones_level ON milestones(level_id);
CREATE INDEX idx_milestones_domain_level ON milestones(domain_id, level_id);
