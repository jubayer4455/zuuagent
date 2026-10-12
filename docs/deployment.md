# Zuu Agent — Deployment Guide (Vercel & Supabase)

## Recommended Deployment Stack
- **Frontend & Serverless Functions**: Vercel
- **Database & Authentication**: Supabase (PostgreSQL 15+)
- **Source Control**: GitHub

---

## 1. Supabase Setup
1. Create a new project on [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in the Supabase Dashboard.
3. Run the migrations in sequence:
   - Run `supabase/migrations/20261012000001_initial_schema.sql`
   - Run `supabase/migrations/20261012000002_rls_policies.sql`
   - Run `supabase/migrations/20261012000003_seed_data.sql`
4. Copy the **Project URL** and **anon public key** from Project Settings -> API.

---

## 2. Vercel Deployment
1. Push your repository to GitHub.
2. Import the project into Vercel.
3. Configure the following environment variables in the Vercel Dashboard:
   - `VITE_SUPABASE_URL`: Your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role Key (Keep secret)
   - `VITE_PLATFORM_NAME`: `Zuu Agent`
   - `VITE_DEFAULT_TIMEZONE`: `Asia/Dhaka`
4. Deploy. Vercel will automatically build the React application with Vite.

---

## 3. Free-Tier Operational Constraints
- **Vercel Hobby**: 10-second serverless execution limits. Zuu Agent's step-based pipeline executes each phase within bounded durations.
- **Supabase Free**: 500 MB database storage with 50,000 MAUs. Configure 30-day log retention in **General Settings**.
- **Cron Jobs**: Vercel Cron or external schedulers can hit the authenticated `/api/scheduler/cron-worker` endpoint daily.
