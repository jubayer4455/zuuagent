# Zuu Agent — System Architecture Documentation

## Overview
**Zuu Agent** is an enterprise-grade, extensible, universal multi-agent AI automation platform. It is designed to create, configure, operate, monitor, and manage independent AI agents from a centralized Master Admin Dashboard.

---

## The 3-Tier Multi-Agent Model

```
+--------------------------------------------------------------------------+
| LEVEL 1: MASTER PLATFORM                                                 |
| - Authentication & RBAC (5 System Roles)                                 |
| - Secrets Vault (Masked Storage & Redaction)                            |
| - AI Provider Registry (Gemini, OpenAI, Claude, Ollama, OpenRouter)      |
| - Global API & Integrations (Meta Graph API for Facebook Pages)         |
| - Central Approval Gate & System Health Telemetry                        |
+--------------------------------------------------------------------------+
                                     |
                                     v
+--------------------------------------------------------------------------+
| LEVEL 2: INDIVIDUAL AGENTS                                               |
| - Universal Agent Builder (9-step wizard with live sandbox simulation)    |
| - 15-Tab Agent Workspace                                                 |
| - Scoped Memory Center (Isolated Agent Namespaces, 9 Categories)         |
| - Prompt & Persona Versioning (Immutable audit history & rollback)      |
| - Tool Binding Registry & Workflow Graph Orchestration                   |
+--------------------------------------------------------------------------+
                                     |
                                     v
+--------------------------------------------------------------------------+
| LEVEL 3: EXECUTIONS & TASKS                                              |
| - Reusable 16-Step Controlled Execution Pipeline                         |
| - Idempotency Keys (Duplicate Facebook post & mutation prevention)       |
| - Human Approval Checkpoints before sensitive external side-effects     |
| - Durable Job Scheduler & Correlation Trace Observability                |
+--------------------------------------------------------------------------+
```

---

## 16-Step Reusable Execution Pipeline

1. **Trigger Reception**: Manual trigger, database-backed cron schedule, webhook, or queue.
2. **Authentication & Authorization**: Verify actor role permissions against least-privilege matrix.
3. **Agent Status Check**: Ensure agent status is `active` or `testing` (aborts if `disabled` or `archived`).
4. **Quota & Rate Limiting**: Check daily execution quota and concurrent run limits.
5. **Config & Version Resolution**: Load active agent configuration and model parameters.
6. **Execution Record Creation**: Create durable record with unique Correlation ID.
7. **AI Provider Resolution**: Select designated adapter (e.g. Gemini 2.0 Flash, GPT-4o, Claude 3.5 Sonnet).
8. **Scoped Memory Retrieval**: Retrieve only private memories associated with this agent or global rules.
9. **Prompt Compilation**: Merge system prompt, memories, and task instructions.
10. **AI Inference Invocation**: Execute provider call with fallback simulation.
11. **Tool Invocation Request**: Validate proposed tool calls against schema and required permissions.
12. **Approval Gate Check**: If tool is `external_mutation` or agent requires human approval, pause execution with status `awaiting_approval`.
13. **Human Review**: Admin or Reviewer inspects tamper-proof payload in Central Approval Center.
14. **Action Fulfillment**: Dispatch verified request with unique idempotency key (e.g. Meta Graph API post).
15. **Telemetry & Output Logging**: Record tokens consumed, estimated cost, and output text.
16. **Finalize Execution**: Mark execution status as `completed` and stream trace events.
