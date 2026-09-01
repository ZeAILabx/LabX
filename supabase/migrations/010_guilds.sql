-- ============================================================
-- 010_guilds.sql — Domain-based guilds
-- ============================================================

CREATE TABLE IF NOT EXISTS guilds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER guilds_updated_at
    BEFORE UPDATE ON guilds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Add FK from profiles to guilds
ALTER TABLE profiles ADD CONSTRAINT fk_profiles_guild
    FOREIGN KEY (guild_id) REFERENCES guilds(id);

CREATE TABLE IF NOT EXISTS guild_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(guild_id, user_id)
);

CREATE INDEX idx_guild_members_guild ON guild_members(guild_id);
CREATE INDEX idx_guild_members_user ON guild_members(user_id);

CREATE TABLE IF NOT EXISTS guild_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_guild_messages_guild ON guild_messages(guild_id);
CREATE INDEX idx_guild_messages_created ON guild_messages(guild_id, created_at DESC);
