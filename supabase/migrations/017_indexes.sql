-- ============================================================
-- 017_indexes.sql — Additional performance indexes
-- ============================================================

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_quests_milestone_type 
    ON quests(milestone_id, quest_type) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_quests_domain_stage_level 
    ON quests(domain_id, stage_id, level_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_posts_active_created 
    ON posts(created_at DESC) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_announcements_published_date 
    ON announcements(event_date DESC) WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_profiles_role 
    ON profiles(role);

CREATE INDEX IF NOT EXISTS idx_profiles_domain 
    ON profiles(domain_id);

CREATE INDEX IF NOT EXISTS idx_profiles_active 
    ON profiles(is_active) WHERE is_active = true;
