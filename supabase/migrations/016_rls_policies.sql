-- ============================================================
-- 016_rls_policies.sql — Row Level Security for all tables
-- ============================================================

-- Enable RLS on all tables
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

-- ── Profiles ────────────────────────────────────────────────
CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ── Domains, Stages, Levels, Milestones (read-only for everyone) ──
CREATE POLICY "Domains are viewable by everyone"
    ON domains FOR SELECT USING (true);

CREATE POLICY "Stages are viewable by everyone"
    ON stages FOR SELECT USING (true);

CREATE POLICY "Levels are viewable by everyone"
    ON levels FOR SELECT USING (true);

CREATE POLICY "Milestones are viewable by everyone"
    ON milestones FOR SELECT USING (true);

-- ── Quests ──────────────────────────────────────────────────
CREATE POLICY "Active quests are viewable by authenticated users"
    ON quests FOR SELECT
    TO authenticated
    USING (is_active = true AND is_archived = false);

-- ── Quest Submissions ───────────────────────────────────────
CREATE POLICY "Users can view own submissions"
    ON quest_submissions FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own submissions"
    ON quest_submissions FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own submissions"
    ON quest_submissions FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- ── Assessments ─────────────────────────────────────────────
CREATE POLICY "Users can view own assessment"
    ON founder_assessments FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own assessment"
    ON founder_assessments FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- ── Progress tables ─────────────────────────────────────────
CREATE POLICY "Users can view own founder progress"
    ON founder_progress FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own milestone progress"
    ON milestone_progress FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own level progress"
    ON level_progress FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own stage progress"
    ON stage_progress FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- ── Guilds ──────────────────────────────────────────────────
CREATE POLICY "Guilds are viewable by members"
    ON guilds FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Guild members viewable by guild members"
    ON guild_members FOR SELECT
    TO authenticated
    USING (
        guild_id IN (
            SELECT guild_id FROM guild_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Guild messages viewable by guild members"
    ON guild_messages FOR SELECT
    TO authenticated
    USING (
        guild_id IN (
            SELECT guild_id FROM guild_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Guild members can send messages"
    ON guild_messages FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id AND
        guild_id IN (
            SELECT guild_id FROM guild_members WHERE user_id = auth.uid()
        )
    );

-- ── Posts ────────────────────────────────────────────────────
CREATE POLICY "Active posts are viewable by authenticated users"
    ON posts FOR SELECT
    TO authenticated
    USING (is_active = true);

CREATE POLICY "Users can create own posts"
    ON posts FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own posts"
    ON posts FOR UPDATE
    TO authenticated
    USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own posts"
    ON posts FOR DELETE
    TO authenticated
    USING (auth.uid() = author_id);

-- ── Post Likes ──────────────────────────────────────────────
CREATE POLICY "Likes are viewable by authenticated users"
    ON post_likes FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can like posts"
    ON post_likes FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
    ON post_likes FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- ── Comments ────────────────────────────────────────────────
CREATE POLICY "Comments are viewable by authenticated users"
    ON comments FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can create comments"
    ON comments FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
    ON comments FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
    ON comments FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- ── Follows ─────────────────────────────────────────────────
CREATE POLICY "Follows are viewable by authenticated users"
    ON follows FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can follow others"
    ON follows FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
    ON follows FOR DELETE
    TO authenticated
    USING (auth.uid() = follower_id);

-- ── Announcements ───────────────────────────────────────────
CREATE POLICY "Published announcements viewable by authenticated users"
    ON announcements FOR SELECT
    TO authenticated
    USING (status = 'published');

-- ── Points ──────────────────────────────────────────────────
CREATE POLICY "Users can view own points"
    ON points_transactions FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- ── Notifications ───────────────────────────────────────────
CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- ── Achievements ────────────────────────────────────────────
CREATE POLICY "Achievements are viewable by everyone"
    ON achievements FOR SELECT
    USING (true);

CREATE POLICY "Users can view own earned achievements"
    ON founder_achievements FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
