# LABX — Production Deployment Guide

This guide outlines production deployment instructions for React frontend, Flask backend, and Supabase production setup.

---

## 1. Supabase Production Configuration

1. **Production Project**: Create a production project in Supabase.
2. **Run Migrations**: Run migration scripts `001_profiles.sql` through `020_seed_sample_quests.sql` in the Supabase SQL Editor.
3. **Enable Realtime**: Ensure Realtime is enabled on the `guild_messages` table under **Database -> Realtime**.
4. **Storage Buckets**: Create buckets:
   - `avatars` (Public viewable)
   - `quest-submissions` (Private authenticated)
   - `post-images` (Public viewable)

---

## 2. Flask Backend Deployment (Render / Railway / AWS / Heroku)

1. Use `gunicorn` as WSGI server:
   ```bash
   gunicorn run:app --bind 0.0.0.0:5000 --workers 4
   ```
2. Configure Production Environment Variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SECRET_KEY` (Strong random string)
   - `CORS_ORIGINS` (Set to production frontend domain, e.g., `https://labx.vercel.app`)

---

## 3. React Frontend Deployment (Vercel / Netlify)

1. Set Build Settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
2. Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_URL` (Set to live Flask backend URL, e.g., `https://api.labx.com/api`)

---

## 4. Security & CORS Checklist

- Verify `SUPABASE_SERVICE_ROLE_KEY` is NEVER bundled into React build artifacts.
- Verify RLS policies are active on all 25 tables.
- Restrict CORS origins in Flask to authorized domains only.
