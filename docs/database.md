# Zuu Agent — Database Architecture Specification

## Database Engine: Supabase PostgreSQL with Row Level Security (RLS)

The platform is designed around 32 normalized database tables, explicit foreign keys, indexes, and RLS policies.

---

## Normalized Entity Map

### 1. Identity & Workspaces
- `organizations`: Multi-tenant organization boundaries and plan limits.
- `profiles`: User accounts linked to `auth.users`, storing `system_role` (`master_admin`, `admin`, `operator`, `reviewer`, `viewer`).
- `memberships`: User memberships within organizations.

### 2. Universal Multi-Agent Model
- `agents`: Primary agent records (ID, name, slug, description, category, status, primary_provider_id, primary_model, version).
- `agent_configs`: Versioned configuration payloads (temperature, max_tokens, memory_mode, requires_human_approval, metadata).
- `agent_prompts`: Active system prompts and personas.
- `prompt_versions`: Immutable audit trail of every prompt edit with change summaries.
- `agent_tools`: Explicit tool assignments linking agents to authorized tools.

### 3. AI Providers & Model Registry
- `ai_providers`: Adapters for Google Gemini, OpenAI, Anthropic, Ollama, OpenRouter.
- `provider_models`: Context windows, token pricing, tool support flags.
- `secrets_vault`: Server-side encrypted storage for API keys and tokens. Never readable by public/anon clients.

### 4. Scoped Memory & Knowledge Base
- `agent_memories`: Scoped memory units with 9 categories (`identity`, `instruction`, `preference`, `summary`, `output`, `feedback`, `knowledge_ref`, `insight`, `workflow_state`).
- `knowledge_documents`: Files, notes, and references.
- `knowledge_chunks`: Document chunks with token counts and metadata.
- `knowledge_access`: Many-to-many permission grants binding documents to agents.

### 5. Integrations & Facebook Publishing
- `integration_connections`: Meta Graph API connections, account IDs, OAuth scopes, and expiration timestamps.
- `publishing_records`: Post payloads, idempotency keys, Facebook post IDs, permalink URLs, status.

### 6. Orchestration & Execution
- `workflows`: Workflow definitions with node schemas.
- `schedules`: Cron expressions, timezones, next-run timestamps.
- `jobs`: DB-backed queue with atomic locking (`locked_by`, `locked_at`).
- `executions`: Execution records with correlation IDs, tokens, costs, status.
- `execution_steps`: Detailed step traces (`prompt_resolution`, `memory_retrieval`, `llm_call`, `tool_execution`, `approval_gate`, `output_formatting`).
- `execution_outputs`: Persisted content outputs, social drafts, and media references.

### 7. Governance, Observability & RBAC
- `approvals`: Centralized approval queue with payload snapshots and cryptographic checksums.
- `notifications`: Multi-channel alert logs (in-app, email, telegram).
- `audit_logs`: Audit trail with actor email, action, entity, and IP address.
- `usage_records`: Daily metric aggregations for cost tracking.
- `system_settings`: Platform-wide configurations and feature switches.
- `backup_records`: Snapshot history and checksums.

---

## Safe Migrations Execution
All migrations are located in `supabase/migrations/`:
1. `20261012000001_initial_schema.sql` (Creates all 32 tables, keys, and indexes)
2. `20261012000002_rls_policies.sql` (Applies strict Row Level Security)
3. `20261012000003_seed_data.sql` (Seeds AI Providers, models, tool registry, Trollogiya agent)
