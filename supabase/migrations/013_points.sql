-- ============================================================
-- 013_points.sql — LABX Points transactions
-- ============================================================

CREATE TABLE IF NOT EXISTS points_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    quest_id UUID REFERENCES quests(id),
    points INTEGER NOT NULL,
    transaction_type TEXT NOT NULL DEFAULT 'quest_completion' CHECK (
        transaction_type IN ('quest_completion', 'achievement', 'bonus', 'adjustment')
    ),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, quest_id)
);

CREATE INDEX idx_points_user ON points_transactions(user_id);
CREATE INDEX idx_points_quest ON points_transactions(quest_id);
CREATE INDEX idx_points_created ON points_transactions(user_id, created_at DESC);
