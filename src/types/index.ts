// ==============================================================================
// Zuu Agent — Universal Multi-Agent Automation Platform
// TypeScript Domain Type Definitions
// ==============================================================================

export type UserRole = 'master_admin' | 'admin' | 'operator' | 'reviewer' | 'viewer';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  systemRole: UserRole;
  isActive: boolean;
  createdAt: string;
}

export type AgentStatus = 'draft' | 'testing' | 'active' | 'paused' | 'disabled' | 'error' | 'archived';

export type AgentCategory = 
  | 'social_media'
  | 'facebook_publishing'
  | 'instagram_content'
  | 'customer_support'
  | 'research'
  | 'document_processing'
  | 'personal_assistant'
  | 'scheduled_task'
  | 'data_analysis'
  | 'custom';

export interface TrollogiyaCategory {
  id: string;
  label: string;
  enabled: boolean;
}

export interface TrollogiyaConfigMetadata {
  language: 'bn-BD' | 'en' | 'bn-Latn'; // bn-BD = Bengali, bn-Latn = Banglish
  allowBanglish: boolean;
  dailyPostsCount: number;
  postDistribution: {
    short: number;
    long: number;
  };
  humorScale: number; // 1 - 10
  emotionalScale: number; // 1 - 10
  categories: TrollogiyaCategory[];
  hashtagConfig?: string[];
  ctaPreset?: string;
  selectedPageId?: string;
}

export interface AgentConfig {
  id: string;
  agentId: string;
  version: number;
  temperature: number;
  maxTokens: number;
  topP: number;
  timeoutSeconds: number;
  retryPolicy: {
    maxRetries: number;
    backoffMs: number;
  };
  memoryMode: 'none' | 'isolated' | 'shared_explicit' | 'global_read';
  sharedAgentIds?: string[];
  requiresHumanApproval: boolean;
  maxDailyExecutions: number;
  executionTimeoutMs: number;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface AgentPrompt {
  id: string;
  agentId: string;
  promptType: 'system' | 'instructions' | 'task' | 'tool_instruction' | 'safety';
  currentVersion: number;
  content: string;
  updatedAt: string;
}

export interface PromptVersion {
  id: string;
  agentPromptId: string;
  agentId: string;
  version: number;
  content: string;
  changeSummary: string;
  createdBy?: string;
  createdAt: string;
}

export interface Agent {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  category: AgentCategory;
  tags: string[];
  status: AgentStatus;
  ownerId?: string;
  primaryProviderId: string;
  primaryModel: string;
  version: number;
  isTemplate?: boolean;
  templateOrigin?: string;
  createdAt: string;
  updatedAt: string;
  // Computed / expanded fields
  config?: AgentConfig;
  prompts?: AgentPrompt[];
  enabledToolsCount?: number;
  latestExecution?: ExecutionSummary;
}

export interface ExecutionSummary {
  id: string;
  status: ExecutionStatus;
  startedAt: string;
  durationMs?: number;
}

// -----------------------------------------------------------------------------
// AI Providers & Models
// -----------------------------------------------------------------------------

export type ProviderAdapterType = 'openai' | 'anthropic' | 'gemini' | 'ollama' | 'openrouter' | 'custom';

export interface AIProvider {
  id: string;
  name: string;
  slug: string;
  adapterType: ProviderAdapterType;
  baseUrl?: string;
  isEnabled: boolean;
  supportsText: boolean;
  supportsVision: boolean;
  supportsImageGen: boolean;
  supportsEmbeddings: boolean;
  rateLimitRpm: number;
  timeoutSeconds: number;
  retryPolicy: {
    maxRetries: number;
    backoffMs: number;
  };
  isFallback: boolean;
  fallbackPriority: number;
  healthStatus: 'healthy' | 'degraded' | 'offline' | 'unknown';
  lastHealthCheck?: string;
  lastError?: string;
  hasStoredKey?: boolean; // Masked indicator for frontend
  apiKey?: string;
}

export interface ProviderModel {
  id: string;
  providerId: string;
  modelIdentifier: string;
  displayName: string;
  contextWindow: number;
  maxOutputTokens: number;
  inputCostPerMillionTokens: number;
  outputCostPerMillionTokens: number;
  supportsTools: boolean;
  supportsStreaming: boolean;
  isDefault: boolean;
}

// -----------------------------------------------------------------------------
// Tool Registry
// -----------------------------------------------------------------------------

export type ToolClassification = 
  | 'read_only' 
  | 'data_transformation' 
  | 'external_communication' 
  | 'external_mutation' 
  | 'high_impact_action';

export interface ToolDefinition {
  id: string;
  name: string;
  displayName: string;
  description: string;
  classification: ToolClassification;
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
  requiredPermissions: string[];
  isActive: boolean;
  requiresApproval: boolean;
  executionTimeoutMs: number;
  rateLimitPerMinute: number;
  handlerIdentifier: string;
}

export interface AgentToolBinding {
  id: string;
  agentId: string;
  toolId: string;
  isEnabled: boolean;
  customConfig?: Record<string, any>;
  tool?: ToolDefinition;
}

// -----------------------------------------------------------------------------
// Scoped Memory & Knowledge Base
// -----------------------------------------------------------------------------

export type MemoryCategory = 
  | 'identity' 
  | 'instruction' 
  | 'preference' 
  | 'summary' 
  | 'output' 
  | 'feedback' 
  | 'knowledge_ref' 
  | 'insight' 
  | 'workflow_state';

export interface AgentMemory {
  id: string;
  agentId?: string;
  scope: 'agent' | 'shared' | 'global';
  category: MemoryCategory;
  key?: string;
  content: string;
  source: string;
  priority: number;
  expiresAt?: string;
  status: 'active' | 'pinned' | 'archived' | 'deleted';
  provenance?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  fileType: string;
  fileSizeBytes: number;
  storagePath?: string;
  rawContent?: string;
  processingStatus: 'pending' | 'processing' | 'processed' | 'failed';
  errorMessage?: string;
  version: number;
  createdAt: string;
  assignedAgentIds?: string[];
}

// -----------------------------------------------------------------------------
// Integrations & Facebook Publishing
// -----------------------------------------------------------------------------

export type IntegrationProvider = 'meta_facebook' | 'meta_instagram' | 'telegram' | 'slack' | 'webhook' | 'custom';

export interface IntegrationConnection {
  id: string;
  provider: IntegrationProvider;
  displayName: string;
  accountIdentifier: string;
  connectionStatus: 'connected' | 'disconnected' | 'expired' | 'error';
  grantedScopes: string[];
  lastVerifiedAt?: string;
  lastError?: string;
  expiresAt?: string;
  settings?: Record<string, any>;
  assignedAgentIds?: string[];
}

export interface FacebookPublishingRecord {
  id: string;
  agentId: string;
  integrationId?: string;
  destinationType: 'facebook_page';
  destinationId: string;
  idempotencyKey: string;
  postType: 'text_only' | 'image' | 'text_and_image' | 'video';
  contentPayload: {
    message: string;
    imageUrl?: string;
    hashtags?: string[];
    category?: string;
  };
  externalPostId?: string;
  externalUrl?: string;
  status: 'draft' | 'pending_approval' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'cancelled';
  scheduledFor?: string;
  publishedAt?: string;
  errorMessage?: string;
  retryCount: number;
  createdAt: string;
}

// -----------------------------------------------------------------------------
// Execution Engine & Tasks
// -----------------------------------------------------------------------------

export type TriggerSource = 'manual' | 'schedule' | 'webhook' | 'queue' | 'agent_handoff';

export type ExecutionStatus = 'pending' | 'running' | 'awaiting_approval' | 'completed' | 'failed' | 'cancelled';

export interface Execution {
  id: string;
  agentId: string;
  agentName?: string;
  triggerType: TriggerSource;
  status: ExecutionStatus;
  correlationId: string;
  inputPayload: Record<string, any>;
  resolvedConfig?: Record<string, any>;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  totalTokensUsed: number;
  estimatedCost: number;
  errorSummary?: string;
  errorCode?: string;
  steps?: ExecutionStep[];
  outputs?: ExecutionOutput[];
}

export interface ExecutionStep {
  id: string;
  executionId: string;
  stepNumber: number;
  stepName: string;
  stepType: 'prompt_resolution' | 'memory_retrieval' | 'llm_call' | 'tool_execution' | 'approval_gate' | 'external_api' | 'output_formatting';
  status: 'running' | 'success' | 'failed' | 'skipped' | 'waiting_approval';
  inputData?: Record<string, any>;
  outputData?: Record<string, any>;
  durationMs?: number;
  errorDetails?: string;
  createdAt: string;
}

export interface ExecutionOutput {
  id: string;
  executionId: string;
  agentId: string;
  outputType: 'content_text' | 'social_post' | 'image_asset' | 'json_data' | 'report_doc';
  title?: string;
  content: string;
  mediaUrls: string[];
  metadata?: Record<string, any>;
  isPublished: boolean;
  createdAt: string;
}

// -----------------------------------------------------------------------------
// Governance: Approvals, Schedules, Notifications, Audit, Health
// -----------------------------------------------------------------------------

export interface ApprovalItem {
  id: string;
  executionId?: string;
  agentId: string;
  agentName?: string;
  actionType: string;
  targetDestination: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  payloadSnapshot: Record<string, any>;
  payloadChecksum: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  requestedAt: string;
  decidedBy?: string;
  decidedAt?: string;
  decisionReason?: string;
}

export interface ScheduleItem {
  id: string;
  agentId: string;
  agentName?: string;
  cronExpression: string;
  timezone: string;
  isActive: boolean;
  nextRunAt?: string;
  lastRunAt?: string;
  lastStatus?: string;
  description?: string;
}

export interface NotificationItem {
  id: string;
  level: 'info' | 'success' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  channel: 'in_app' | 'email' | 'telegram' | 'slack';
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  actorEmail?: string;
  action: string;
  entityType: string;
  entityId?: string;
  ipAddress?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  createdAt: string;
}

export interface SystemHealthMetric {
  component: string;
  status: 'healthy' | 'degraded' | 'offline' | 'not_configured';
  latencyMs?: number;
  message: string;
  lastChecked: string;
}
