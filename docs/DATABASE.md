# LABX — Database Schema Documentation

This document describes the 25 normalized PostgreSQL tables, key relationships, constraints, and Row Level Security policies.

---

## Entity Relationship Overview

```
auth.users (Supabase)
  └── profiles (extends auth.users)
        ├── domains (12 Domains)
        │     └── guilds (12 Domain Guilds)
        │           ├── guild_members
        │           └── guild_messages
        ├── founder_assessments
        ├── founder_progress
        │     ├── stage_progress
        │     ├── level_progress
        │     └── milestone_progress
        ├── quest_submissions
        ├── posts
        │     ├── post_likes
        │     └── comments
        ├── follows
        ├── points_transactions
        ├── notifications
        └── founder_achievements
```

---

## Key Tables

### `profiles`
Extends `auth.users`. Stores role (`founder` vs `admin`), domain reference, total points, and assessment completion status.

### `domains`
12 fixed founder domains (AI/ML, Healthcare, EdTech, Cybersecurity, FinTech, etc.).

### `stages`
5 sequential stages (`Discover`, `Validate`, `Build`, `Launch`, `Grow`).

### `levels`
5 levels per stage (25 total levels).

### `milestones`
3 milestones per level per domain (900 total milestones generated via SQL loops). Unique constraint on `(domain_id, level_id, milestone_order)`.

### `quests`
Core and Side quests attached to milestones. Includes attributes: `quest_type`, `points`, `mandatory`, `submission_type`, `verification_required`, `is_seed_data`, `is_active`, `is_archived`.

### `quest_submissions`
Founder quest submissions. Status workflow: `submitted` -> `under_review` -> `approved` / `rejected` -> `completed`.

### `points_transactions`
Ledger of point awards. Has unique constraint `UNIQUE(user_id, quest_id)` to prevent duplicate point awards.

### `guilds`, `guild_members`, `guild_messages`
Domain-based private communities. Realtime enabled on `guild_messages`.

---

## Row Level Security (RLS) Summary

- **Profiles**: Viewable by all authenticated users; editable only by profile owner.
- **Roadmap Structure**: Domains, Stages, Levels, Milestones read-only for authenticated users.
- **Quests**: Active quests viewable by authenticated users.
- **Submissions**: Founders can view/insert/update only their own submissions.
- **Guild Chat**: Messages viewable/insertable only by members belonging to that specific Guild ID.
