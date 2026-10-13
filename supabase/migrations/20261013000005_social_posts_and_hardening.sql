-- ==============================================================================
-- Zuu Agent Migration 005: Social Posts, Duplicate Detection & Publishing Hardening
-- Adds normalized social_posts table, indexes, and RLS policies.
-- Safe non-destructive migration that preserves all existing tables and data.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.social_posts (
  id TEXT PRIMARY KEY,
  agent_id TEXT REFERENCES public.agents(id) ON DELETE SET NULL,
  platform TEXT NOT NULL DEFAULT 'facebook',
  external_post_id TEXT,
  post_content TEXT NOT NULL,
  content_hash TEXT,
  media_urls JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 
    'pending_approval', 
    'approved', 
    'scheduled', 
    'publishing', 
    'published', 
    'failed', 
    'rejected', 
    'archived'
  )),
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  is_dry_run BOOLEAN DEFAULT true,
  failure_reason TEXT,
  idempotency_key TEXT UNIQUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Performance and lookup indexes
CREATE INDEX IF NOT EXISTS idx_social_posts_agent_id ON public.social_posts(agent_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON public.social_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_posts_idempotency_key ON public.social_posts(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_social_posts_content_hash ON public.social_posts(content_hash);
CREATE INDEX IF NOT EXISTS idx_social_posts_created_at ON public.social_posts(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

-- Service Role Key has full unrestricted access
DROP POLICY IF EXISTS "Service role full access on social_posts" ON public.social_posts;
CREATE POLICY "Service role full access on social_posts" 
ON public.social_posts 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Authenticated users can view social posts
DROP POLICY IF EXISTS "Authenticated users can view social_posts" ON public.social_posts;
CREATE POLICY "Authenticated users can view social_posts" 
ON public.social_posts 
FOR SELECT 
TO authenticated 
USING (true);

-- Public / Anon read-safe access for overview dashboards
DROP POLICY IF EXISTS "Anon public can view social_posts" ON public.social_posts;
CREATE POLICY "Anon public can view social_posts" 
ON public.social_posts 
FOR SELECT 
TO anon 
USING (true);
