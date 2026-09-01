-- ============================================================
-- 009_progress.sql — Founder/milestone/level/stage progress
-- ============================================================

-- Overall founder progress
CREATE TABLE IF NOT EXISTS founder_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    domain_id UUID REFERENCES domains(id),
    current_stage_id UUID REFERENCES stages(id),
    current_level_id UUID REFERENCES levels(id),
    current_milestone_id UUID REFERENCES milestones(id),
    roadmap_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER founder_progress_updated_at
    BEFORE UPDATE ON founder_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Milestone-level progress
CREATE TABLE IF NOT EXISTS milestone_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    milestone_id UUID NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
    is_unlocked BOOLEAN DEFAULT FALSE,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_quests INTEGER DEFAULT 0,
    total_quests INTEGER DEFAULT 0,
    progress_percentage INTEGER DEFAULT 0,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, milestone_id)
);

CREATE TRIGGER milestone_progress_updated_at
    BEFORE UPDATE ON milestone_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Level-level progress
CREATE TABLE IF NOT EXISTS level_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    level_id UUID NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
    is_unlocked BOOLEAN DEFAULT FALSE,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, level_id)
);

CREATE TRIGGER level_progress_updated_at
    BEFORE UPDATE ON level_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Stage-level progress
CREATE TABLE IF NOT EXISTS stage_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    stage_id UUID NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
    is_unlocked BOOLEAN DEFAULT FALSE,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, stage_id)
);

CREATE TRIGGER stage_progress_updated_at
    BEFORE UPDATE ON stage_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_founder_progress_user ON founder_progress(user_id);
CREATE INDEX idx_milestone_progress_user ON milestone_progress(user_id);
CREATE INDEX idx_milestone_progress_milestone ON milestone_progress(milestone_id);
CREATE INDEX idx_level_progress_user ON level_progress(user_id);
CREATE INDEX idx_stage_progress_user ON stage_progress(user_id);
