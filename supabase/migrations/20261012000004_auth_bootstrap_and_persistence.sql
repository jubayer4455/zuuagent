-- ==============================================================================
-- Zuu Agent — Universal Multi-Agent Automation Platform
-- Migration: 20261012000004_auth_bootstrap_and_persistence.sql
-- Description: Complete RLS policies for agent configs, prompts, execution pipelines,
--              first-admin bootstrap trigger, and session role resolution.
-- ==============================================================================

-- 1. Helper function: check if platform requires first admin bootstrap
CREATE OR REPLACE FUNCTION public.is_first_admin_needed()
RETURNS BOOLEAN AS $$
DECLARE
    admin_count INT;
BEGIN
    SELECT COUNT(*) INTO admin_count FROM public.profiles WHERE system_role = 'master_admin';
    RETURN admin_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger function: auto-create profile on auth.users signup
-- If no profile exists yet, the first user is automatically promoted to 'master_admin'.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    is_first_user BOOLEAN;
    assigned_role VARCHAR(50);
BEGIN
    SELECT (COUNT(*) = 0) INTO is_first_user FROM public.profiles;
    IF is_first_user THEN
        assigned_role := 'master_admin';
    ELSE
        assigned_role := 'operator';
    END IF;

    INSERT INTO public.profiles (id, email, full_name, system_role, is_active)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        assigned_role,
        TRUE
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to auth.users if not already created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Comprehensive RLS policies for Agent Sub-resources

-- Agent Configs
DROP POLICY IF EXISTS "Authenticated users manage agent configs" ON agent_configs;
CREATE POLICY "Authenticated users manage agent configs"
ON agent_configs FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Agent Prompts
DROP POLICY IF EXISTS "Authenticated users manage agent prompts" ON agent_prompts;
CREATE POLICY "Authenticated users manage agent prompts"
ON agent_prompts FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Prompt Versions
DROP POLICY IF EXISTS "Authenticated users manage prompt versions" ON prompt_versions;
CREATE POLICY "Authenticated users manage prompt versions"
ON prompt_versions FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- AI Providers & Models (readable by authenticated, editable by admins)
DROP POLICY IF EXISTS "Authenticated users view AI providers" ON ai_providers;
CREATE POLICY "Authenticated users view AI providers"
ON ai_providers FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users view provider models" ON provider_models;
CREATE POLICY "Authenticated users view provider models"
ON provider_models FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Admins manage AI providers" ON ai_providers;
CREATE POLICY "Admins manage AI providers"
ON ai_providers FOR ALL TO authenticated
USING (public.get_user_role(auth.uid()) IN ('master_admin', 'admin'))
WITH CHECK (public.get_user_role(auth.uid()) IN ('master_admin', 'admin'));

-- Tool Registry & Bindings
DROP POLICY IF EXISTS "Authenticated users view tool registry" ON tool_registry;
CREATE POLICY "Authenticated users view tool registry"
ON tool_registry FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Admins manage tool registry" ON tool_registry;
CREATE POLICY "Admins manage tool registry"
ON tool_registry FOR ALL TO authenticated
USING (public.get_user_role(auth.uid()) IN ('master_admin', 'admin'))
WITH CHECK (public.get_user_role(auth.uid()) IN ('master_admin', 'admin'));

DROP POLICY IF EXISTS "Authenticated users manage agent tools" ON agent_tools;
CREATE POLICY "Authenticated users manage agent tools"
ON agent_tools FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Executions, Steps & Outputs
DROP POLICY IF EXISTS "Authenticated users view and create executions" ON executions;
CREATE POLICY "Authenticated users view and create executions"
ON executions FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users view and create execution steps" ON execution_steps;
CREATE POLICY "Authenticated users view and create execution steps"
ON execution_steps FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users view and create execution outputs" ON execution_outputs;
CREATE POLICY "Authenticated users view and create execution outputs"
ON execution_outputs FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Schedules
DROP POLICY IF EXISTS "Authenticated users manage schedules" ON schedules;
CREATE POLICY "Authenticated users manage schedules"
ON schedules FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Knowledge Base
DROP POLICY IF EXISTS "Authenticated users manage knowledge documents" ON knowledge_documents;
CREATE POLICY "Authenticated users manage knowledge documents"
ON knowledge_documents FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users manage knowledge chunks" ON knowledge_chunks;
CREATE POLICY "Authenticated users manage knowledge chunks"
ON knowledge_chunks FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Workflows
DROP POLICY IF EXISTS "Authenticated users manage workflows" ON workflows;
CREATE POLICY "Authenticated users manage workflows"
ON workflows FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- System Settings
DROP POLICY IF EXISTS "Authenticated users view system settings" ON system_settings;
CREATE POLICY "Authenticated users view system settings"
ON system_settings FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Admins manage system settings" ON system_settings;
CREATE POLICY "Admins manage system settings"
ON system_settings FOR ALL TO authenticated
USING (public.get_user_role(auth.uid()) IN ('master_admin', 'admin'))
WITH CHECK (public.get_user_role(auth.uid()) IN ('master_admin', 'admin'));

-- Allow public read on providers and models for offline/pre-auth display
DROP POLICY IF EXISTS "Public read on providers" ON ai_providers;
CREATE POLICY "Public read on providers"
ON ai_providers FOR SELECT TO anon
USING (true);

DROP POLICY IF EXISTS "Public read on provider models" ON provider_models;
CREATE POLICY "Public read on provider models"
ON provider_models FOR SELECT TO anon
USING (true);
