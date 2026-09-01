-- ============================================================
-- 007_quest_submissions.sql — Founder quest submissions
-- ============================================================

CREATE TABLE IF NOT EXISTS quest_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (
        status IN ('submitted', 'under_review', 'approved', 'rejected', 'completed')
    ),
    submission_text TEXT,
    submission_url TEXT,
    submission_files JSONB DEFAULT '[]'::jsonb,
    admin_feedback TEXT,
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER quest_submissions_updated_at
    BEFORE UPDATE ON quest_submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_submissions_user ON quest_submissions(user_id);
CREATE INDEX idx_submissions_quest ON quest_submissions(quest_id);
CREATE INDEX idx_submissions_status ON quest_submissions(status);
CREATE INDEX idx_submissions_user_quest ON quest_submissions(user_id, quest_id);
