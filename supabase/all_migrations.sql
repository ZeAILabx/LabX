-- ============================================================
-- LABX Platform — Complete Idempotent Migration Script
-- Safe to run multiple times. Skips existing objects.
-- ============================================================

-- ============================================================
-- STEP 1: Core Functions
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STEP 2: Tables (all IF NOT EXISTS)
-- ============================================================

-- Profiles
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    username TEXT UNIQUE,
    bio TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'founder' CHECK (role IN ('founder', 'admin')),
    domain_id UUID,
    guild_id UUID,
    total_points INTEGER DEFAULT 0,
    assessment_completed BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Domains
CREATE TABLE IF NOT EXISTS domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    display_order INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stages
CREATE TABLE IF NOT EXISTS stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    stage_order INTEGER NOT NULL UNIQUE CHECK (stage_order BETWEEN 1 AND 5),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Levels
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

-- Milestones
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

-- Quests
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

-- Quest Submissions
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

-- Founder Assessments
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

-- Progress Tables
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

-- Guilds
CREATE TABLE IF NOT EXISTS guilds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS guild_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(guild_id, user_id)
);

CREATE TABLE IF NOT EXISTS guild_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Events & Announcements
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'announcement' CHECK (type IN ('event', 'announcement')),
    event_date TIMESTAMPTZ,
    event_time TEXT,
    location TEXT,
    is_online BOOLEAN DEFAULT FALSE,
    meeting_url TEXT,
    banner_url TEXT,
    speaker TEXT,
    external_url TEXT,
    target_domain UUID REFERENCES domains(id),
    target_guild UUID REFERENCES guilds(id),
    target_stage UUID REFERENCES stages(id),
    status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Points
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

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    data JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Achievements
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

-- ============================================================
-- STEP 3: Foreign Key Constraints (safe, won't duplicate)
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_profiles_domain'
    ) THEN
        ALTER TABLE profiles ADD CONSTRAINT fk_profiles_domain
            FOREIGN KEY (domain_id) REFERENCES domains(id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_profiles_guild'
    ) THEN
        ALTER TABLE profiles ADD CONSTRAINT fk_profiles_guild
            FOREIGN KEY (guild_id) REFERENCES guilds(id);
    END IF;
END $$;

-- ============================================================
-- STEP 4: Triggers (DROP IF EXISTS then CREATE OR REPLACE)
-- ============================================================

-- Auth user trigger
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at triggers (safe: DROP then CREATE)
DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS domains_updated_at ON domains;
CREATE TRIGGER domains_updated_at
    BEFORE UPDATE ON domains FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS stages_updated_at ON stages;
CREATE TRIGGER stages_updated_at
    BEFORE UPDATE ON stages FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS levels_updated_at ON levels;
CREATE TRIGGER levels_updated_at
    BEFORE UPDATE ON levels FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS milestones_updated_at ON milestones;
CREATE TRIGGER milestones_updated_at
    BEFORE UPDATE ON milestones FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS quests_updated_at ON quests;
CREATE TRIGGER quests_updated_at
    BEFORE UPDATE ON quests FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS quest_submissions_updated_at ON quest_submissions;
CREATE TRIGGER quest_submissions_updated_at
    BEFORE UPDATE ON quest_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS founder_progress_updated_at ON founder_progress;
CREATE TRIGGER founder_progress_updated_at
    BEFORE UPDATE ON founder_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS milestone_progress_updated_at ON milestone_progress;
CREATE TRIGGER milestone_progress_updated_at
    BEFORE UPDATE ON milestone_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS level_progress_updated_at ON level_progress;
CREATE TRIGGER level_progress_updated_at
    BEFORE UPDATE ON level_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS stage_progress_updated_at ON stage_progress;
CREATE TRIGGER stage_progress_updated_at
    BEFORE UPDATE ON stage_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS guilds_updated_at ON guilds;
CREATE TRIGGER guilds_updated_at
    BEFORE UPDATE ON guilds FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS posts_updated_at ON posts;
CREATE TRIGGER posts_updated_at
    BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS comments_updated_at ON comments;
CREATE TRIGGER comments_updated_at
    BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS announcements_updated_at ON announcements;
CREATE TRIGGER announcements_updated_at
    BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- STEP 5: Indexes (all IF NOT EXISTS)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_levels_stage ON levels(stage_id);
CREATE INDEX IF NOT EXISTS idx_milestones_domain ON milestones(domain_id);
CREATE INDEX IF NOT EXISTS idx_milestones_stage ON milestones(stage_id);
CREATE INDEX IF NOT EXISTS idx_milestones_level ON milestones(level_id);
CREATE INDEX IF NOT EXISTS idx_milestones_domain_level ON milestones(domain_id, level_id);
CREATE INDEX IF NOT EXISTS idx_quests_milestone ON quests(milestone_id);
CREATE INDEX IF NOT EXISTS idx_quests_domain ON quests(domain_id);
CREATE INDEX IF NOT EXISTS idx_quests_type ON quests(quest_type);
CREATE INDEX IF NOT EXISTS idx_quests_active ON quests(is_active, is_archived);
CREATE INDEX IF NOT EXISTS idx_submissions_user ON quest_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_quest ON quest_submissions(quest_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON quest_submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_user_quest ON quest_submissions(user_id, quest_id);
CREATE INDEX IF NOT EXISTS idx_assessments_user ON founder_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_founder_progress_user ON founder_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_milestone_progress_user ON milestone_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_milestone_progress_milestone ON milestone_progress(milestone_id);
CREATE INDEX IF NOT EXISTS idx_level_progress_user ON level_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_stage_progress_user ON stage_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_guild_members_guild ON guild_members(guild_id);
CREATE INDEX IF NOT EXISTS idx_guild_members_user ON guild_members(user_id);
CREATE INDEX IF NOT EXISTS idx_guild_messages_guild ON guild_messages(guild_id);
CREATE INDEX IF NOT EXISTS idx_guild_messages_created ON guild_messages(guild_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_post ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(status);
CREATE INDEX IF NOT EXISTS idx_announcements_type ON announcements(type);
CREATE INDEX IF NOT EXISTS idx_announcements_date ON announcements(event_date);
CREATE INDEX IF NOT EXISTS idx_points_user ON points_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_points_quest ON points_transactions(quest_id);
CREATE INDEX IF NOT EXISTS idx_points_created ON points_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_founder_achievements_user ON founder_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_quests_milestone_type ON quests(milestone_id, quest_type) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_quests_domain_stage_level ON quests(domain_id, stage_id, level_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_posts_active_created ON posts(created_at DESC) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_announcements_published_date ON announcements(event_date DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_domain ON profiles(domain_id);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON profiles(is_active) WHERE is_active = true;

-- ============================================================
-- STEP 6: Row Level Security
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE guilds ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies (DROP IF EXISTS then CREATE — safe re-run)
DO $$
DECLARE pol TEXT;
BEGIN
    -- Drop all existing policies for clean re-apply
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol, (
            SELECT tablename FROM pg_policies WHERE policyname = pol AND schemaname = 'public' LIMIT 1
        ));
    END LOOP;
END $$;

CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Domains are viewable by everyone"
    ON domains FOR SELECT USING (true);
CREATE POLICY "Stages are viewable by everyone"
    ON stages FOR SELECT USING (true);
CREATE POLICY "Levels are viewable by everyone"
    ON levels FOR SELECT USING (true);
CREATE POLICY "Milestones are viewable by everyone"
    ON milestones FOR SELECT USING (true);
CREATE POLICY "Active quests are viewable by authenticated users"
    ON quests FOR SELECT TO authenticated USING (is_active = true AND is_archived = false);
CREATE POLICY "Users can view own submissions"
    ON quest_submissions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own submissions"
    ON quest_submissions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own submissions"
    ON quest_submissions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view own assessment"
    ON founder_assessments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own assessment"
    ON founder_assessments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own founder progress"
    ON founder_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view own milestone progress"
    ON milestone_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view own level progress"
    ON level_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view own stage progress"
    ON stage_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Guilds are viewable by members"
    ON guilds FOR SELECT TO authenticated USING (true);
CREATE POLICY "Guild members viewable by guild members"
    ON guild_members FOR SELECT TO authenticated
    USING (guild_id IN (SELECT guild_id FROM guild_members WHERE user_id = auth.uid()));
CREATE POLICY "Guild messages viewable by guild members"
    ON guild_messages FOR SELECT TO authenticated
    USING (guild_id IN (SELECT guild_id FROM guild_members WHERE user_id = auth.uid()));
CREATE POLICY "Guild members can send messages"
    ON guild_messages FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id AND
        guild_id IN (SELECT guild_id FROM guild_members WHERE user_id = auth.uid()));
CREATE POLICY "Active posts are viewable by authenticated users"
    ON posts FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Users can create own posts"
    ON posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own posts"
    ON posts FOR UPDATE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "Users can delete own posts"
    ON posts FOR DELETE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "Likes are viewable by authenticated users"
    ON post_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can like posts"
    ON post_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike posts"
    ON post_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Comments are viewable by authenticated users"
    ON comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create comments"
    ON comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments"
    ON comments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments"
    ON comments FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Follows are viewable by authenticated users"
    ON follows FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can follow others"
    ON follows FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow"
    ON follows FOR DELETE TO authenticated USING (auth.uid() = follower_id);
CREATE POLICY "Published announcements viewable by authenticated users"
    ON announcements FOR SELECT TO authenticated USING (status = 'published');
CREATE POLICY "Users can view own points"
    ON points_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Achievements are viewable by everyone"
    ON achievements FOR SELECT USING (true);
CREATE POLICY "Users can view own earned achievements"
    ON founder_achievements FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- STEP 7: Seed Data (all ON CONFLICT DO NOTHING — safe re-run)
-- ============================================================

-- 12 Domains
INSERT INTO domains (name, description, display_order, icon) VALUES
    ('Artificial Intelligence & Machine Learning', 'AI models, machine learning systems, NLP, computer vision, and neural networks', 1, 'Brain'),
    ('Healthcare & MedTech', 'Digital health, medical devices, biotechnology, telemedicine, and healthcare management', 2, 'HeartPulse'),
    ('Smart Education', 'EdTech platforms, interactive learning, adaptive testing, and educational tools', 3, 'GraduationCap'),
    ('Women Safety & Social Impact', 'Safety devices, emergency response, non-profit technology, and social impact platforms', 4, 'ShieldAlert'),
    ('Cybersecurity', 'Network security, data protection, threat intelligence, and identity management', 5, 'Lock'),
    ('FinTech & Digital Economy', 'Payments, banking infrastructure, DeFi, financial management, and Web3 solutions', 6, 'Coins'),
    ('Smart Mobility & Logistics', 'Electric vehicles, autonomous tech, supply chain optimization, and smart fleet management', 7, 'Truck'),
    ('Sustainability', 'CleanTech, renewable energy, waste management, carbon tracking, and green tech', 8, 'Leaf'),
    ('Agriculture & Food Technology', 'AgriTech, precision farming, food supply chain, and sustainable agriculture', 9, 'Sprout'),
    ('Smart Cities & Infrastructure', 'IoT infrastructure, smart grids, urban planning technology, and civic tech', 10, 'Building2'),
    ('Media, Entertainment & Creator Technology', 'Creator economy tools, streaming platforms, digital media, and gaming tech', 11, 'Video'),
    ('Space, Robotics & Advanced Technology', 'Aerospace, industrial robotics, quantum computing, and hardware engineering', 12, 'Rocket')
ON CONFLICT (name) DO NOTHING;

-- 5 Stages
INSERT INTO stages (name, description, stage_order) VALUES
    ('Discover', 'Identify problem, explore opportunities, and conduct initial research', 1),
    ('Validate', 'Talk to potential users, validate problem-solution fit, and run experiments', 2),
    ('Build', 'Develop wireframes, prototypes, and a functional Minimum Viable Product (MVP)', 3),
    ('Launch', 'Deploy product to production, acquire early adopters, and launch publicly', 4),
    ('Grow', 'Scale marketing, generate recurring revenue, optimize operations, and expand', 5)
ON CONFLICT (name) DO NOTHING;

-- 25 Levels (5 per stage)
DO $$
DECLARE
    stage_rec RECORD;
    i INTEGER;
BEGIN
    FOR stage_rec IN SELECT id, stage_order, name FROM stages LOOP
        FOR i IN 1..5 LOOP
            INSERT INTO levels (stage_id, name, level_order, description)
            VALUES (
                stage_rec.id,
                'Level ' || i,
                i,
                stage_rec.name || ' Stage - Level ' || i || ' progression milestones'
            )
            ON CONFLICT (stage_id, level_order) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- 12 Guilds (1 per domain)
INSERT INTO guilds (name, description, domain_id)
SELECT
    d.name || ' Guild',
    'Exclusive private community for founders building in ' || d.name,
    d.id
FROM domains d
ON CONFLICT (name) DO NOTHING;

-- 900 Milestones (12 domains × 5 stages × 5 levels × 3 milestones)
DO $$
DECLARE
    dom_rec RECORD;
    stg_rec RECORD;
    lvl_rec RECORD;
    m_order INTEGER;
    m_name TEXT;
    m_desc TEXT;
BEGIN
    FOR dom_rec IN SELECT id, name FROM domains LOOP
        FOR stg_rec IN SELECT id, name, stage_order FROM stages LOOP
            FOR lvl_rec IN SELECT id, level_order FROM levels WHERE stage_id = stg_rec.id LOOP
                FOR m_order IN 1..3 LOOP
                    IF m_order = 1 THEN
                        m_name := stg_rec.name || ' L' || lvl_rec.level_order || ' - Foundation & Planning';
                    ELSIF m_order = 2 THEN
                        m_name := stg_rec.name || ' L' || lvl_rec.level_order || ' - Execution & Testing';
                    ELSE
                        m_name := stg_rec.name || ' L' || lvl_rec.level_order || ' - Evaluation & Delivery';
                    END IF;
                    m_desc := 'Milestone ' || m_order || ' for level ' || lvl_rec.level_order || ' of ' || stg_rec.name || ' stage in ' || dom_rec.name;
                    INSERT INTO milestones (domain_id, stage_id, level_id, name, description, milestone_order)
                    VALUES (dom_rec.id, stg_rec.id, lvl_rec.id, m_name, m_desc, m_order)
                    ON CONFLICT (domain_id, level_id, milestone_order) DO NOTHING;
                END LOOP;
            END LOOP;
        END LOOP;
    END LOOP;
END $$;

-- Achievements
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
    ('points_1000', '1000 LABX Points', 'Earned 1000 LABX Points', '👑', 'points')
ON CONFLICT (key) DO NOTHING;

-- Sample quests for Healthcare & MedTech → Discover → Level 1 → Milestone 1
DO $$
DECLARE
    h_domain_id UUID;
    d_stage_id UUID;
    l1_level_id UUID;
    m1_milestone_id UUID;
BEGIN
    SELECT id INTO h_domain_id FROM domains WHERE name = 'Healthcare & MedTech';
    SELECT id INTO d_stage_id FROM stages WHERE name = 'Discover';
    SELECT id INTO l1_level_id FROM levels WHERE stage_id = d_stage_id AND level_order = 1;
    SELECT id INTO m1_milestone_id FROM milestones
    WHERE domain_id = h_domain_id AND level_id = l1_level_id AND milestone_order = 1;

    IF m1_milestone_id IS NOT NULL THEN
        INSERT INTO quests (
            title, description, instructions, objective, expected_output,
            domain_id, stage_id, level_id, milestone_id,
            quest_type, difficulty, points, mandatory, submission_type,
            verification_required, quest_order, is_seed_data
        ) VALUES
        (
            'Define Healthcare Problem',
            'Clearly articulate the healthcare or medtech problem you are solving.',
            'Document the background, pain points, who suffers from this problem, and current inadequate solutions.',
            'Create a comprehensive problem statement document with root cause analysis.',
            'A 1-2 page PDF document or link to Notion page detailing the problem definition.',
            h_domain_id, d_stage_id, l1_level_id, m1_milestone_id,
            'core', 'easy', 100, true, 'text', true, 1, true
        ),
        (
            'Identify Target Users',
            'Identify the specific patient demographics, healthcare providers, or clinical users affected.',
            'List buyer personas, end-user personas, hospital decision makers, and key stakeholders.',
            'Define 2 detailed buyer/user personas including demographics, pain points, and workflows.',
            'User persona document with user journey mapping.',
            h_domain_id, d_stage_id, l1_level_id, m1_milestone_id,
            'core', 'medium', 100, true, 'url', true, 2, true
        ),
        (
            'Research 5 Competitors',
            'Conduct a competitive analysis of existing solutions in your healthcare niche.',
            'Identify 5 existing products or incumbent solutions. Benchmark features, pricing, and drawbacks.',
            'Build a competitive matrix comparing your value proposition against competitors.',
            'Spreadsheet link or PDF of competitive matrix.',
            h_domain_id, d_stage_id, l1_level_id, m1_milestone_id,
            'side', 'medium', 50, false, 'url', true, 3, true
        )
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
