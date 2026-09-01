# LABX — Zero-to-Running Setup Guide

This guide walks through configuring and running the LABX Founder Development & Progression Platform from scratch on a clean machine.

---

## 1. Prerequisites

Ensure you have the following installed:
- **Node.js**: v18+ and `npm`
- **Python**: v3.10+ and `pip`
- **Git**
- A free **Supabase** Account ([supabase.com](https://supabase.com))

---

## 2. Supabase Setup

1. Log in to [Supabase](https://database.new) and click **New Project**.
2. Name your project (e.g. `labx-platform`) and set a strong database password. Select your preferred region.
3. Once the database is provisioned, navigate to **Project Settings -> API**.
4. Retrieve the following credentials:
   - **Project URL**: `https://<your-project-ref>.supabase.co`
   - **Anon (Public) Key**: `eyJhb...` (Safe for frontend)
   - **Service Role Key**: `eyJhb...` (PRIVATE — ONLY for Flask backend)

> [!WARNING]
> **CRITICAL SECURITY REQUIREMENT**: The **Service Role Key** grants full administrative bypass of Row Level Security. NEVER put this key in frontend code, `.env` files in `frontend/`, or Git repositories!

---

## 3. Environment Variables Configuration

### Backend Environment (`backend/.env`)

Create `backend/.env` based on `backend/.env.example`:

```env
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
SECRET_KEY=labx-secret-jwt-key-2026
CORS_ORIGINS=http://localhost:5173
```

### Frontend Environment (`frontend/.env`)

Create `frontend/.env` based on `frontend/.env.example`:

```env
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
VITE_API_URL=http://localhost:5000/api
```

---

## 4. Run Database Migrations & Seeds

In your Supabase Dashboard, open **SQL Editor**. Copy and run each SQL script from `supabase/migrations/` in numerical order:

1. `001_profiles.sql` (User profiles & auth trigger)
2. `002_domains.sql` (Domains schema)
3. `003_stages.sql` (Stages schema)
4. `004_levels.sql` (Levels schema)
5. `005_milestones.sql` (Milestones schema)
6. `006_quests.sql` (Quests schema)
7. `007_quest_submissions.sql` (Submissions & review workflow)
8. `008_assessments.sql` (Assessment responses)
9. `009_progress.sql` (Progress tracking tables)
10. `010_guilds.sql` (Domain Guilds schema)
11. `011_social.sql` (Posts, likes, comments, follows)
12. `012_events.sql` (Events & Announcements)
13. `013_points.sql` (Points transactions)
14. `014_notifications.sql` (Notifications)
15. `015_achievements.sql` (Achievements system)
16. `016_rls_policies.sql` (Row Level Security)
17. `017_indexes.sql` (Performance indexes)
18. `018_seed_domains_stages.sql` (Seed 12 domains, 5 stages, 25 levels, 12 guilds)
19. `019_seed_levels_milestones.sql` (Generates 900 milestones via PL/pgSQL loop)
20. `020_seed_sample_quests.sql` (Seed sample quests for Healthcare domain)

---

## 5. Creating the First Admin Account

Admin users do NOT complete founder assessment or belong to founder guilds. To create an Admin:

1. Register a new user in the app UI or via Supabase Auth dashboard with an email like `admin@labx.com`.
2. In Supabase SQL Editor, run:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@labx.com';
```

Now when logging in with `admin@labx.com`, the system automatically routes to the **Admin Portal**.

---

## 6. Running Local Development Servers

### Backend (Flask)

```bash
cd backend
pip install -r requirements.txt
python run.py
```
Backend will start on `http://localhost:5000`.

### Frontend (React)

```bash
cd frontend
npm install
npm run dev
```
Frontend will start on `http://localhost:5173`.

---

## 7. Testing the Acceptance Flow

1. **Founder Signup**: Go to `http://localhost:5173/register` and create a new account.
2. **One-Time Assessment**: Complete the 7 diagnostic questions. Notice:
   - Selected Domain is saved.
   - Stage & Level calculated deterministically.
   - Automatically assigned to Domain Guild.
3. **Roadmap Navigation**: Go to Roadmap. Expand Discover Stage -> Level 1 -> Click Milestone 1.
4. **Quest Submission**: Open "Define Healthcare Problem" core quest, enter deliverable link, click **Submit Quest Work**. Status becomes **Under Review**.
5. **Admin Approval**: Log in as Admin (`admin@labx.com`). Navigate to **Quest Verification**. Click **Inspect & Verify**, then **Approve**.
6. **Verify Progression**: Switch back to Founder account. Notice:
   - +100 LABX Points awarded.
   - Milestone progress updated.
