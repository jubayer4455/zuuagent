-- ==============================================================================
-- Zuu Agent — Universal Multi-Agent Automation Platform
-- Migration: 20261012000001_initial_schema.sql
-- Description: Core 32+ normalized tables for multi-agent management, RLS, execution,
--              memory, tool registry, approvals, and observability.
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. Identity, Workspaces & Access Control
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    plan VARCHAR(50) DEFAULT 'free',
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    system_role VARCHAR(50) DEFAULT 'operator' CHECK (system_role IN ('master_admin', 'admin', 'operator', 'reviewer', 'viewer')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'operator' CHECK (role IN ('master_admin', 'admin', 'operator', 'reviewer', 'viewer')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, profile_id)
);

-- -----------------------------------------------------------------------------
-- 2. AI Providers & Model Registry
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ai_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    adapter_type VARCHAR(50) NOT NULL CHECK (adapter_type IN ('openai', 'anthropic', 'gemini', 'ollama', 'openrouter', 'custom')),
    base_url TEXT,
    is_enabled BOOLEAN DEFAULT TRUE,
    supports_text BOOLEAN DEFAULT TRUE,
    supports_vision BOOLEAN DEFAULT FALSE,
    supports_image_gen BOOLEAN DEFAULT FALSE,
    supports_embeddings BOOLEAN DEFAULT FALSE,
    rate_limit_rpm INT DEFAULT 60,
    timeout_seconds INT DEFAULT 60,
    retry_policy JSONB DEFAULT '{"maxRetries": 3, "backoffMs": 1000}'::jsonb,
    is_fallback BOOLEAN DEFAULT FALSE,
    fallback_priority INT DEFAULT 99,
    health_status VARCHAR(50) DEFAULT 'unknown' CHECK (health_status IN ('healthy', 'degraded', 'offline', 'unknown')),
    last_health_check TIMESTAMPTZ,
    last_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS provider_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES ai_providers(id) ON DELETE CASCADE,
    model_identifier VARCHAR(150) NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    context_window INT DEFAULT 8192,
    max_output_tokens INT DEFAULT 4096,
    input_cost_per_million_tokens NUMERIC(10, 4) DEFAULT 0.00,
    output_cost_per_million_tokens NUMERIC(10, 4) DEFAULT 0.00,
    supports_tools BOOLEAN DEFAULT TRUE,
    supports_streaming BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(provider_id, model_identifier)
);

-- Encrypted server-side secret references (never stored unencrypted)
CREATE TABLE IF NOT EXISTS secrets_vault (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope_type VARCHAR(50) NOT NULL CHECK (scope_type IN ('provider', 'integration', 'global')),
    scope_id UUID,
    secret_key_name VARCHAR(150) NOT NULL,
    encrypted_payload TEXT NOT NULL,
    key_fingerprint VARCHAR(64) NOT NULL,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(scope_type, scope_id, secret_key_name)
);

-- -----------------------------------------------------------------------------
-- 3. Universal Agents & Configurations
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(100) DEFAULT 'bot',
    category VARCHAR(100) DEFAULT 'custom',
    tags TEXT[] DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'testing', 'active', 'paused', 'disabled', 'error', 'archived')),
    owner_id UUID REFERENCES profiles(id),
    primary_provider_id UUID REFERENCES ai_providers(id),
    primary_model VARCHAR(150),
    version INT DEFAULT 1,
    is_template BOOLEAN DEFAULT FALSE,
    template_origin VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    version INT NOT NULL DEFAULT 1,
    temperature NUMERIC(3, 2) DEFAULT 0.7,
    max_tokens INT DEFAULT 2048,
    top_p NUMERIC(3, 2) DEFAULT 1.0,
    timeout_seconds INT DEFAULT 60,
    retry_policy JSONB DEFAULT '{"maxRetries": 2, "backoffMs": 1500}'::jsonb,
    memory_mode VARCHAR(50) DEFAULT 'isolated' CHECK (memory_mode IN ('none', 'isolated', 'shared_explicit', 'global_read')),
    shared_agent_ids UUID[] DEFAULT '{}',
    requires_human_approval BOOLEAN DEFAULT FALSE,
    max_daily_executions INT DEFAULT 100,
    execution_timeout_ms INT DEFAULT 120000,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(agent_id, version)
);

CREATE TABLE IF NOT EXISTS agent_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    prompt_type VARCHAR(50) DEFAULT 'system' CHECK (prompt_type IN ('system', 'instructions', 'task', 'tool_instruction', 'safety')),
    current_version INT DEFAULT 1,
    content TEXT NOT NULL,
    updated_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(agent_id, prompt_type)
);

CREATE TABLE IF NOT EXISTS prompt_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_prompt_id UUID NOT NULL REFERENCES agent_prompts(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    version INT NOT NULL,
    content TEXT NOT NULL,
    change_summary TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(agent_prompt_id, version)
);

-- -----------------------------------------------------------------------------
-- 4. Tool Registry & Bindings
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tool_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    classification VARCHAR(50) NOT NULL CHECK (classification IN ('read_only', 'data_transformation', 'external_communication', 'external_mutation', 'high_impact_action')),
    input_schema JSONB NOT NULL DEFAULT '{}'::jsonb,
    output_schema JSONB NOT NULL DEFAULT '{}'::jsonb,
    required_permissions TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    requires_approval BOOLEAN DEFAULT FALSE,
    execution_timeout_ms INT DEFAULT 30000,
    rate_limit_per_minute INT DEFAULT 30,
    handler_identifier VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_tools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    tool_id UUID NOT NULL REFERENCES tool_registry(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT TRUE,
    custom_config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(agent_id, tool_id)
);

-- -----------------------------------------------------------------------------
-- 5. Scoped Memory Center & Knowledge Base
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS agent_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    scope VARCHAR(50) DEFAULT 'agent' CHECK (scope IN ('agent', 'shared', 'global')),
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'identity', 'instruction', 'preference', 'summary', 
        'output', 'feedback', 'knowledge_ref', 'insight', 'workflow_state'
    )),
    key VARCHAR(255),
    content TEXT NOT NULL,
    source VARCHAR(100) DEFAULT 'manual',
    priority INT DEFAULT 0,
    expires_at TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'pinned', 'archived', 'deleted')),
    provenance JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS knowledge_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) DEFAULT 'text/plain',
    file_size_bytes BIGINT DEFAULT 0,
    storage_path TEXT,
    raw_content TEXT,
    processing_status VARCHAR(50) DEFAULT 'processed' CHECK (processing_status IN ('pending', 'processing', 'processed', 'failed')),
    error_message TEXT,
    version INT DEFAULT 1,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    chunk_content TEXT NOT NULL,
    token_count INT DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS knowledge_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(document_id, agent_id)
);

-- -----------------------------------------------------------------------------
-- 6. Integrations & Facebook Publishing
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS integration_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    provider VARCHAR(100) NOT NULL CHECK (provider IN ('meta_facebook', 'meta_instagram', 'telegram', 'slack', 'webhook', 'custom')),
    display_name VARCHAR(255) NOT NULL,
    account_identifier VARCHAR(255) NOT NULL,
    connection_status VARCHAR(50) DEFAULT 'connected' CHECK (connection_status IN ('connected', 'disconnected', 'expired', 'error')),
    granted_scopes TEXT[] DEFAULT '{}',
    last_verified_at TIMESTAMPTZ,
    last_error TEXT,
    expires_at TIMESTAMPTZ,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(provider, account_identifier)
);

CREATE TABLE IF NOT EXISTS publishing_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    integration_id UUID REFERENCES integration_connections(id) ON DELETE SET NULL,
    destination_type VARCHAR(50) DEFAULT 'facebook_page',
    destination_id VARCHAR(255) NOT NULL,
    idempotency_key VARCHAR(255) UNIQUE NOT NULL,
    post_type VARCHAR(50) DEFAULT 'text_and_image' CHECK (post_type IN ('text_only', 'image', 'text_and_image', 'video')),
    content_payload JSONB NOT NULL,
    external_post_id VARCHAR(255),
    external_url TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('draft', 'pending_approval', 'scheduled', 'publishing', 'published', 'failed', 'cancelled')),
    scheduled_for TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    error_message TEXT,
    retry_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 7. Workflows & Schedules
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    version INT DEFAULT 1,
    workflow_schema JSONB NOT NULL DEFAULT '{"nodes": [], "edges": []}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    workflow_id UUID REFERENCES workflows(id) ON DELETE SET NULL,
    cron_expression VARCHAR(100) NOT NULL,
    timezone VARCHAR(100) DEFAULT 'UTC',
    is_active BOOLEAN DEFAULT TRUE,
    next_run_at TIMESTAMPTZ,
    last_run_at TIMESTAMPTZ,
    last_status VARCHAR(50),
    description VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID REFERENCES schedules(id) ON DELETE SET NULL,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    task_type VARCHAR(100) NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(50) DEFAULT 'queued' CHECK (status IN ('queued', 'locked', 'running', 'completed', 'failed', 'cancelled')),
    locked_by VARCHAR(255),
    locked_at TIMESTAMPTZ,
    scheduled_for TIMESTAMPTZ DEFAULT NOW(),
    attempt_count INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    idempotency_key VARCHAR(255) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 8. Execution Engine & Tracing
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    trigger_type VARCHAR(50) NOT NULL CHECK (trigger_type IN ('manual', 'schedule', 'webhook', 'queue', 'agent_handoff')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'awaiting_approval', 'completed', 'failed', 'cancelled')),
    correlation_id VARCHAR(255) NOT NULL,
    input_payload JSONB DEFAULT '{}'::jsonb,
    resolved_config JSONB DEFAULT '{}'::jsonb,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_ms INT,
    total_tokens_used INT DEFAULT 0,
    estimated_cost NUMERIC(10, 6) DEFAULT 0.000000,
    error_summary TEXT,
    error_code VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS execution_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id UUID NOT NULL REFERENCES executions(id) ON DELETE CASCADE,
    step_number INT NOT NULL,
    step_name VARCHAR(150) NOT NULL,
    step_type VARCHAR(50) NOT NULL CHECK (step_type IN ('prompt_resolution', 'memory_retrieval', 'llm_call', 'tool_execution', 'approval_gate', 'external_api', 'output_formatting')),
    status VARCHAR(50) DEFAULT 'running' CHECK (status IN ('running', 'success', 'failed', 'skipped', 'waiting_approval')),
    input_data JSONB,
    output_data JSONB,
    duration_ms INT,
    error_details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS execution_outputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id UUID NOT NULL REFERENCES executions(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    output_type VARCHAR(50) DEFAULT 'content_text' CHECK (output_type IN ('content_text', 'social_post', 'image_asset', 'json_data', 'report_doc')),
    title VARCHAR(255),
    content TEXT NOT NULL,
    media_urls TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}'::jsonb,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 9. Central Approval Center & Governance
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id UUID REFERENCES executions(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    action_type VARCHAR(100) NOT NULL,
    target_destination VARCHAR(255) NOT NULL,
    risk_level VARCHAR(50) DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    payload_snapshot JSONB NOT NULL,
    payload_checksum VARCHAR(64) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    decided_by UUID REFERENCES profiles(id),
    decided_at TIMESTAMPTZ,
    decision_reason TEXT,
    expires_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    level VARCHAR(50) DEFAULT 'info' CHECK (level IN ('info', 'success', 'warning', 'error', 'critical')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    channel VARCHAR(50) DEFAULT 'in_app' CHECK (channel IN ('in_app', 'email', 'telegram', 'slack')),
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usage_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES ai_providers(id) ON DELETE SET NULL,
    model_name VARCHAR(150),
    metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
    prompt_tokens INT DEFAULT 0,
    completion_tokens INT DEFAULT 0,
    image_generations INT DEFAULT 0,
    tool_calls INT DEFAULT 0,
    estimated_cost NUMERIC(10, 4) DEFAULT 0.0000,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(150) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    is_secret BOOLEAN DEFAULT FALSE,
    updated_by UUID REFERENCES profiles(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS backup_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_type VARCHAR(50) DEFAULT 'full_config' CHECK (backup_type IN ('full_config', 'agents_only', 'prompts_only', 'knowledge_only')),
    file_path TEXT NOT NULL,
    checksum VARCHAR(64) NOT NULL,
    size_bytes BIGINT DEFAULT 0,
    created_by UUID REFERENCES profiles(id),
    status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('in_progress', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Indexes for High Performance Querying
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_agents_org ON agents(organization_id);
CREATE INDEX IF NOT EXISTS idx_memories_agent_category ON agent_memories(agent_id, category);
CREATE INDEX IF NOT EXISTS idx_memories_status ON agent_memories(status);
CREATE INDEX IF NOT EXISTS idx_executions_agent_status ON executions(agent_id, status);
CREATE INDEX IF NOT EXISTS idx_executions_correlation ON executions(correlation_id);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status);
CREATE INDEX IF NOT EXISTS idx_jobs_status_scheduled ON jobs(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_publishing_records_status ON publishing_records(status);
CREATE INDEX IF NOT EXISTS idx_usage_agent_date ON usage_records(agent_id, metric_date);
