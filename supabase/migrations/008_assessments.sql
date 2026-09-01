-- ============================================================
-- 008_assessments.sql — Founder one-time assessment records
-- ============================================================

CREATE TABLE IF NOT EXISTS founder_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    q1_domain INTEGER NOT NULL,
    q2_project_state INTEGER NOT NULL,
    q3_evidence JSONB DEFAULT '[]'::jsonb,
    q4_execution INTEGER NOT NULL,
    q5_validation INTEGER NOT NULL,
    q6_product_maturity INTEGER NOT NULL,
    q7_completed_work INTEGER NOT NULL,
    calculated_domain TEXT NOT NULL,
    calculated_stage TEXT NOT NULL,
    calculated_level INTEGER NOT NULL,
    level_score NUMERIC(4,2),
    domain_id UUID REFERENCES domains(id),
    stage_id UUID REFERENCES stages(id),
    level_id UUID REFERENCES levels(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_assessments_user ON founder_assessments(user_id);
