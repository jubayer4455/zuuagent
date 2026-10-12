# Zuu Agent — Security Architecture & RBAC Specifications

## Security Tenets

1. **Least-Privilege RBAC**:
   - `master_admin`: Full management of agents, secrets, users, integrations, and approvals.
   - `admin`: Manages agents, integrations, approvals, and prompts. Cannot manage Master Admin credentials.
   - `operator`: Can execute tasks, trigger agent runs, and manage memories. Cannot edit prompts or tool bindings.
   - `reviewer`: Specialized role with authority to approve/reject pending mutations in the Approval Center.
   - `viewer`: Read-only access with CSV export permissions.

2. **Server-Side Authorization**:
   - The AI model is **never** the authority that grants itself permissions.
   - Every tool call is intercepted by server-side policy checkers and schema validators.

3. **Strict Secrets Redaction**:
   - API keys and tokens are stored encrypted via server-side pgcrypto vault.
   - Secret values are masked in the UI (`••••••••••••`) and **never returned to client browsers**.
   - Execution logs automatically redact token headers and credential strings.

4. **Tamper-Proof Approval Gates**:
   - Approval items in the Approval Center are cryptographically bound to a SHA-256 checksum of the payload.
   - If an agent or operator modifies the payload text, the existing approval becomes invalid and requires re-approval.

5. **Prompt Injection Defense**:
   - Retrieved documents, web search outputs, and user inputs are strictly encapsulated as untrusted context data.
   - System prompts are stored in protected partitions that untrusted payloads cannot override.
