-- ============================================================
-- 006_quests.sql — Core and Side Quests
-- ============================================================

CREATE TABLE IF NOT EXISTS quests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    instructions TEXT,
    objective TEXT,
    expected_output TEXT,
    domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
    stage_id UUID NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
    level_id UUID NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
    milestone_id UUID NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
    quest_type TEXT NOT NULL CHECK (quest_type IN ('core', 'side')),
    difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
    points INTEGER DEFAULT 0,
    mandatory BOOLEAN DEFAULT TRUE,
    submission_type TEXT DEFAULT 'text' CHECK (submission_type IN ('text', 'url', 'file', 'image', 'multiple')),
    verification_required BOOLEAN DEFAULT TRUE,
    due_date TIMESTAMPTZ,
    quest_order INTEGER DEFAULT 1,
    resource_links JSONB DEFAULT '[]'::jsonb,
    attachments JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    is_archived BOOLEAN DEFAULT FALSE,
    is_seed_data BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER quests_updated_at
    BEFORE UPDATE ON quests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_quests_milestone ON quests(milestone_id);
CREATE INDEX idx_quests_domain ON quests(domain_id);
CREATE INDEX idx_quests_type ON quests(quest_type);
CREATE INDEX idx_quests_active ON quests(is_active, is_archived);
