# Zuu Agent — Universal Multi-Agent Automation Platform

![Zuu Agent Logo](public/logo.svg)

> **Zuu Agent** is an enterprise-grade, extensible, universal multi-agent AI automation platform. Create, configure, operate, monitor, and manage independent AI agents from one centralized Master Admin Control Center.

---

## Key Capabilities

- **25-Section Master Control Center**:
  - Overview, All Agents, Universal Agent Builder, Templates, Marketplace, Tasks & Executions, Workflow Builder, Global AI Providers, API & Integrations, Memory Center, Knowledge Base, Prompt Library, Tool Registry, Schedules & Triggers, Approval Center, Notifications, Analytics, Execution Logs, System Health, Usage & Cost Controls, Users & RBAC, Security & Audit Logs, Backup & Restore, Import & Export, General Settings.
- **Universal 9-Step Agent Builder**:
  - Interactive guided creation wizard with live sandbox simulation before saving.
- **15-Tab Individual Agent Workspace**:
  - Complete control of agent configurations, prompts, scoped memories, tools, workflows, triggers, schedules, outputs, usage, permissions, and rollback version history.
- **Trollogiya Content Agent Flagship Template**:
  - Specialized Bangladeshi Bengali & Banglish viral content creator with humor scales (1-10), emotional intensity scales, 7 configurable content categories, 3-posts daily preset, hashtag management, and Meta Graph API Facebook Page publishing.
- **Meta Graph API Facebook Publishing**:
  - Official v21.0 endpoints, dry-run simulation mode, cryptographic idempotency keys to prevent duplicate publications, token diagnostic verification.
- **AI Provider Registry**:
  - Adapter support for Google Gemini (2.0 Flash / 1.5 Pro), OpenAI (GPT-4o / Mini), Anthropic Claude, Ollama (local), and OpenRouter.
- **5-Classification Tool Registry**:
  - `read_only`, `data_transformation`, `external_communication`, `external_mutation`, and `high_impact_action` with server-side argument validation.
- **Centralized Approval Center**:
  - Human-in-the-loop governance with tamper-proof SHA-256 payload checksums.
- **Role-Based Access Control (RBAC)**:
  - 5 roles: `master_admin`, `admin`, `operator`, `reviewer`, `viewer`.
- **Database & RLS**:
  - 32 normalized PostgreSQL tables with safe Supabase migrations.

---

## Quickstart

### 1. Installation
```bash
git clone https://github.com/your-username/zuu-agent.git
cd zuu-agent
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your Supabase credentials or test with local storage engine
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run Test Suite
```bash
npm test
```

### 5. Production Build
```bash
npm run build
```

---

## Documentation
- [System Architecture](docs/architecture.md)
- [Database Schema & Migrations](docs/database.md)
- [Security & RBAC Specifications](docs/security.md)
- [Meta Graph API & Facebook Publishing](docs/integrations.md)
- [Deployment Guide](docs/deployment.md)
- [Troubleshooting & Diagnostics](docs/troubleshooting.md)

---

## License
MIT License. Owned and controlled by you.
