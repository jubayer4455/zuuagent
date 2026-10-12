# Zuu Agent — Troubleshooting & Diagnostics Guide

## Common Scenarios & Remediation

### 1. "Ollama node offline at localhost:11434"
- **Cause**: Local Ollama daemon is not running on your machine or host container.
- **Remedy**: Start Ollama by running `ollama serve` in a terminal, or switch your agent to Google Gemini / OpenAI in **AI Provider Manager**.

### 2. "Meta Graph API Error 190 (Token Expired)"
- **Cause**: Facebook Page Access Token has expired or was revoked.
- **Remedy**: Navigate to **API & Integrations**, click **Verify Token & Scopes**, and generate a new long-lived Page Token via Meta Graph API Explorer.

### 3. "Insufficient Permissions: Missing 'pages_manage_posts'"
- **Cause**: The Meta Access Token lacks publishing permissions.
- **Remedy**: Add `pages_manage_posts` and `pages_read_engagement` in your Meta Developer App and re-generate the token.

### 4. "Database in Local Storage Engine Mode"
- **Cause**: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are empty.
- **Remedy**: The platform will safely use local interactive memory storage so you can build and test agents immediately. Provide Supabase credentials in `.env` to connect cloud PostgreSQL.

### 5. "Execution Awaiting Approval"
- **Cause**: The agent has `requiresHumanApproval` enabled or invoked a high-impact mutation tool.
- **Remedy**: Switch active role to **Reviewer** or **Admin**, open the **Approval Center**, and review the payload to authorize publication.
