-- ============================================================
-- 015_achievements.sql — Achievements system
-- ============================================================

CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    points INTEGER DEFAULT 0,
    category TEXT DEFAULT 'general',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS founder_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_founder_achievements_user ON founder_achievements(user_id);

-- Seed achievements
INSERT INTO achievements (key, name, description, icon, category) VALUES
    ('first_quest', 'First Quest Completed', 'Completed your first quest', '🎯', 'quests'),
    ('first_milestone', 'First Milestone Completed', 'Completed your first milestone', '🏆', 'milestones'),
    ('first_level', 'First Level Completed', 'Completed your first level', '⭐', 'levels'),
    ('first_stage', 'First Stage Completed', 'Completed your first stage', '🚀', 'stages'),
    ('quests_10', '10 Quests Completed', 'Completed 10 quests', '🔟', 'quests'),
    ('quests_50', '50 Quests Completed', 'Completed 50 quests', '💎', 'quests'),
    ('first_post', 'First Social Post', 'Created your first social post', '📝', 'social'),
    ('first_follower', 'First Follower', 'Earned your first follower', '👥', 'social'),
    ('first_guild_message', 'First Guild Message', 'Sent your first guild message', '💬', 'guild'),
    ('roadmap_completed', 'Roadmap Completed', 'Completed the entire roadmap', '🌟', 'roadmap'),
    ('points_100', '100 LABX Points', 'Earned 100 LABX Points', '💰', 'points'),
    ('points_500', '500 LABX Points', 'Earned 500 LABX Points', '🏅', 'points'),
    ('points_1000', '1000 LABX Points', 'Earned 1000 LABX Points', '👑', 'points');
