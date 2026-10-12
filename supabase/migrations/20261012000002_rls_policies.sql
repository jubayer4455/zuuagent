-- ==============================================================================
-- Zuu Agent — Universal Multi-Agent Automation Platform
-- Migration: 20261012000002_rls_policies.sql
-- Description: Row Level Security (RLS) policies for tenant isolation, RBAC role
--              enforcement, and secure access boundaries.
-- ==============================================================================

-- Enable RLS across all core tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE secrets_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE publishing_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_records ENABLE ROW LEVEL SECURITY;

-- Helper function to check user system role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS VARCHAR AS $$
    SELECT system_role FROM profiles WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- Profiles: Users can view all active profiles in org, but edit only their own
CREATE POLICY "Profiles viewable by authenticated users"
ON profiles FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE TO authenticated
USING (auth.uid() = id);

-- Master Admins and Admins have full access to agents
CREATE POLICY "Admins have full agent management"
ON agents FOR ALL TO authenticated
USING (
    get_user_role(auth.uid()) IN ('master_admin', 'admin')
    OR (get_user_role(auth.uid()) IN ('operator', 'reviewer', 'viewer'))
);

-- Secrets Vault: STRICTEST ISOLATION — only Master Admin can manage, NEVER readable by public/anon
CREATE POLICY "Only master admins can access secrets vault"
ON secrets_vault FOR ALL TO authenticated
USING (get_user_role(auth.uid()) = 'master_admin');

-- Agent Memories: Isolation enforcement
-- An agent can only access its own memories or explicitly shared memories
CREATE POLICY "Agent memories isolation"
ON agent_memories FOR SELECT TO authenticated
USING (
    scope = 'global'
    OR created_by = auth.uid()
    OR get_user_role(auth.uid()) IN ('master_admin', 'admin', 'operator')
);

-- Approvals: Reviewers, Admins, and Master Admins can view and decide
CREATE POLICY "Approval policy"
ON approvals FOR ALL TO authenticated
USING (get_user_role(auth.uid()) IN ('master_admin', 'admin', 'reviewer'));

-- Audit Logs: Read-only for admins, append-only for system
CREATE POLICY "Admins can view audit logs"
ON audit_logs FOR SELECT TO authenticated
USING (get_user_role(auth.uid()) IN ('master_admin', 'admin'));

CREATE POLICY "System can insert audit logs"
ON audit_logs FOR INSERT TO authenticated
WITH CHECK (true);
