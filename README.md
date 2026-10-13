# Zuu Agent — Universal Multi-Agent AI Automation Platform

![Zuu Agent Platform](public/logo.svg)

> **Zuu Agent** is an enterprise-grade, extensible, universal multi-agent AI automation platform. Create, configure, operate, monitor, and manage independent AI agents from one centralized Master Admin Control Center. Owned and fully controlled by you.

---

## 🏗️ System Architecture & Capabilities

```
┌────────────────────────────────────────────────────────────────────────┐
│               Zuu Agent Master Control Center (Port 3000)              │
│     React 18 • TypeScript • Tailwind CSS • Lucide Icons • Zustand      │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           ▼                                                   ▼
┌─────────────────────────────────────┐     ┌─────────────────────────────────────┐
│  Serverless API Router (Port 3001)  │     │       Client Storage Engine         │
│  Native Node.js / Vercel Serverless │     │     Dual-Write LocalStorage Cache   │
└──────────────────┬──────────────────┘     └─────────────────────────────────────┘
                   │
    ┌──────────────┼──────────────┬──────────────┬──────────────┐
    ▼              ▼              ▼              ▼              ▼
┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐
│ Supabase  │ │  Google   │ │   Meta    │ │  Vercel   │ │ Cryptogr. │
│PostgreSQL │ │  Gemini   │ │ Graph API │ │Cron Worker│ │ Approvals │
│ 32 Tables │ │2.0 Flash /│ │   v21.0   │ │DB-Locking │ │  SHA-256  │
│Active RLS │ │ Fallback  │ │Diagnostics│ │Stale Recov│ │ Checksum  │
└───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘
```

### 25-Section Master Control Navigation
1. **Overview**: Live metrics calculated dynamically from database records.
2. **All Agents**: Multi-agent lifecycle management (`draft`, `testing`, `active`, `paused`, `disabled`, `error`, `archived`).
3. **Universal Agent Builder**: 9-step guided agent creation with live preview.
4. **Agent Templates**: Out-of-the-box pre-configured agents (including Trollogiya).
5. **Agent Marketplace**: Extensible catalog of specialized agent personas.
6. **Tasks & Executions**: Detailed execution logs with correlation IDs and token tracking.
7. **Workflow Builder**: Graph-based drag-and-drop workflow pipeline with persistent state.
8. **Schedules & Triggers**: DB-backed cron dispatcher with atomic job locking.
9. **Approval Center**: Human-in-the-loop oversight with tamper-proof SHA-256 checksums.
10. **Content Calendar & Studio**: Dedicated Bengali social media content creator, duplicate detection, and visual asset generator.
11. **Global AI Providers**: Google Gemini, OpenAI, Claude, OpenRouter, and local Ollama adapters.
12. **API & Integrations**: Meta Graph API connection manager with live diagnostics.
13. **Tool Registry**: Typed tool definitions with server-side validation.
14. **Prompt Library**: Versioned prompts with diff viewer and rollback.
15. **Memory Center**: Partition-scoped memory isolation (`isolated`, `shared_explicit`, `global_read`, `none`) with JSON export.
16. **Knowledge Base**: Document indexing with agent access boundaries.
17. **Analytics**: Real database-driven token usage and activity metrics.
18. **Execution Logs**: Searchable, filterable execution audit trail.
19. **System Health**: Truthful probing of DB, Auth, AI, Meta Graph API, and scheduler.
20. **Usage & Cost Controls**: Token caps, spend limits, and cost forecasting.
21. **Users & Permissions**: Role-Based Access Control (5 roles: `master_admin`, `admin`, `operator`, `reviewer`, `viewer`).
22. **Security & Audit Logs**: Immutable administrative activity log.
23. **Backup & Restore**: Zero-secret configuration snapshots with checksum validation.
24. **Import & Export**: Interoperable JSON configuration exchange.
25. **General Settings**: System-wide configuration and timezone settings.

---

## 🔒 Security & Hardening Features

- **Zero Secrets in Frontend**: `SUPABASE_SERVICE_ROLE_KEY` and raw AI/Meta tokens are never exposed to browser bundles.
- **Cryptographic Approval Gate**: All mutation payloads calculate a SHA-256 hash. If content is tampered with prior to sign-off, the server rejects execution with `409 Conflict`.
- **Duplicate Content & Similarity Protection**:
  - Deterministic hash comparison prevents exact duplicates.
  - Jaccard token similarity engine flags posts exceeding a 70% threshold.
- **Timeout Reconciliation**: If a Meta Graph API call times out, the server queries the Page feed before retrying to prevent embarrassing double-posts.
- **Atomic Job Locking**: Background workers acquire `status = 'locked'` with worker IDs and a 5-minute stale lock threshold for recovery.

---

## 📱 Meta Graph API & Facebook Integration

### 1. Meta Developer App Setup
1. Navigate to [developers.facebook.com](https://developers.facebook.com) and create an app with the **Business** app type.
2. In the App Dashboard, add the **Facebook Pages** product.
3. Required Permissions Checklist:
   - `pages_manage_posts` (Publish posts, status updates, photos, and captions)
   - `pages_read_engagement` (Read reactions, comments, and engagement)
   - `pages_show_list` (Discover Pages managed by the admin)

### 2. Generate Permanent Page Access Token
1. Open the **Graph API Explorer** in Meta Developer tools.
2. Select your App, User Token, and grant the permissions above.
3. Obtain your short-lived User Token, then exchange it for a Long-Lived Token:
   ```bash
   GET https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id={APP_ID}&client_secret={APP_SECRET}&fb_exchange_token={SHORT_LIVED_TOKEN}
   ```
4. Request the permanent Page Token:
   ```bash
   GET https://graph.facebook.com/v21.0/me/accounts?access_token={LONG_LIVED_USER_TOKEN}
   ```
5. Copy the `access_token` corresponding to your Page ID and set it as `FB_PAGE_ACCESS_TOKEN` in your `.env` file.

### 3. Meta Error Classification
| Error Code | Classification | Actionable Remedy |
|---|---|---|
| **190** | `OAuthException` | Token expired or invalid. Generate a new long-lived token. |
| **200** | `PermissionsException` | Connected token lacks `pages_manage_posts`. Check Page roles. |
| **368** | `TemporarilyBlocked` | Automated posting temporarily restricted by Meta. Pause for 24-48h. |
| **506** | `DuplicatePost` | Exact duplicate content rejected by Meta. Alter text or punchlines. |
| **4 / 17** | `RateLimit` | 200 calls/hour per user exceeded. Rely on scheduled intervals. |

---

## 🌐 Deployment Instructions

### 1. GitHub Repository Setup
```bash
git clone https://github.com/jubayer4455/zuuagent.git
cd zuuagent
npm install
```

### 2. Environment Configuration
Create a `.env` file in the project root based on `.env.example`:
```ini
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# AI Models
GEMINI_API_KEY=AIzaSy...
OPENAI_API_KEY=sk-...

# Facebook Meta Graph API
FB_PAGE_ID=109847291834910
FB_PAGE_ACCESS_TOKEN=EAA...

# Platform Security & Cron
CRON_SECRET_TOKEN=your_secure_cron_token_32_chars
```

### 3. Deploying to Vercel
1. Import repository on [vercel.com](https://vercel.com).
2. Configure **Environment Variables** matching your `.env` file.
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Vercel automatically deploys serverless functions in `/api` and executes the Cron schedule configured in `vercel.json`:
   ```json
   {
     "crons": [
       { "path": "/api/schedules/cron-worker", "schedule": "0 14 * * *" }
     ]
   }
   ```

---

## 📊 Free-Tier Constraints & Compatibility

| Service | Free-Tier Limits | Zuu Agent Mitigation Strategy |
|---|---|---|
| **Vercel Cron** | 1 cron job / day on Hobby tier | If multiple daily runs needed, configure an external cron trigger (e.g. GitHub Actions or cron-job.org) calling `/api/schedules/cron-worker` with `Authorization: Bearer <CRON_SECRET_TOKEN>`. |
| **Vercel Functions** | 10s default timeout (60s max) | Bounded HTTP timeouts: Meta calls (15s), Gemini calls (10s). |
| **Supabase DB** | 500 MB DB, inactive pause after 7 days | Periodic cron worker pings keep project active. LocalStorage fallback ensures zero downtime. |
| **Meta Graph API** | 200 requests / hour per user | Scheduling slots spaced across peak hours (e.g., 3-5 posts per day). |
| **Google Gemini** | 15 RPM, 1500 RPD on free tier | Local request rate limiter and prompt caching. |

---

## 🧪 Testing & Verification

Run the full automated test suite:
```bash
npm test -- --run
```
Expected output: **66/66 tests passing across 6 test suites**:
- `ai_engine_and_automation.test.ts`
- `facebook_and_hardening.test.ts`
- `core_engine.test.ts`
- `auth_and_persistence.test.ts`
- `integration_api.test.ts`
- `collaboration.test.ts`

Run production build verification:
```bash
npm run build
```

---

## 📄 License
MIT License. Owned and controlled by you.
