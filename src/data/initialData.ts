import { 
  Agent, 
  AIProvider, 
  ProviderModel, 
  ToolDefinition, 
  IntegrationConnection, 
  FacebookPublishingRecord, 
  Execution, 
  ApprovalItem, 
  AgentMemory, 
  KnowledgeDocument, 
  NotificationItem, 
  AuditLogItem, 
  UserProfile 
} from '../types';

export const initialProfiles: UserProfile[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'admin@zuuagent.ai',
    fullName: 'Master Administrator',
    systemRole: 'master_admin',
    isActive: true,
    createdAt: '2026-10-01T00:00:00Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'operator@zuuagent.ai',
    fullName: 'Operations Lead',
    systemRole: 'operator',
    isActive: true,
    createdAt: '2026-10-02T00:00:00Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    email: 'reviewer@zuuagent.ai',
    fullName: 'Content Reviewer',
    systemRole: 'reviewer',
    isActive: true,
    createdAt: '2026-10-03T00:00:00Z',
  }
];

export const initialProviders: AIProvider[] = [
  {
    id: '11111111-1111-1111-1111-111111111101',
    name: 'Google Gemini',
    slug: 'google-gemini',
    adapterType: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com',
    isEnabled: true,
    supportsText: true,
    supportsVision: true,
    supportsImageGen: true,
    supportsEmbeddings: true,
    rateLimitRpm: 60,
    timeoutSeconds: 60,
    retryPolicy: { maxRetries: 3, backoffMs: 1000 },
    isFallback: false,
    fallbackPriority: 1,
    healthStatus: 'healthy',
    lastHealthCheck: '2026-10-12T17:50:00Z',
    hasStoredKey: true
  },
  {
    id: '11111111-1111-1111-1111-111111111102',
    name: 'OpenAI',
    slug: 'openai',
    adapterType: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    isEnabled: true,
    supportsText: true,
    supportsVision: true,
    supportsImageGen: true,
    supportsEmbeddings: true,
    rateLimitRpm: 60,
    timeoutSeconds: 60,
    retryPolicy: { maxRetries: 3, backoffMs: 1000 },
    isFallback: true,
    fallbackPriority: 2,
    healthStatus: 'healthy',
    lastHealthCheck: '2026-10-12T17:50:00Z',
    hasStoredKey: true
  },
  {
    id: '11111111-1111-1111-1111-111111111103',
    name: 'Anthropic Claude',
    slug: 'anthropic',
    adapterType: 'anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    isEnabled: true,
    supportsText: true,
    supportsVision: true,
    supportsImageGen: false,
    supportsEmbeddings: false,
    rateLimitRpm: 50,
    timeoutSeconds: 90,
    retryPolicy: { maxRetries: 2, backoffMs: 2000 },
    isFallback: false,
    fallbackPriority: 3,
    healthStatus: 'healthy',
    lastHealthCheck: '2026-10-12T17:50:00Z',
    hasStoredKey: false
  },
  {
    id: '11111111-1111-1111-1111-111111111104',
    name: 'Ollama (Local Node)',
    slug: 'ollama',
    adapterType: 'ollama',
    baseUrl: 'http://localhost:11434',
    isEnabled: true,
    supportsText: true,
    supportsVision: false,
    supportsImageGen: false,
    supportsEmbeddings: true,
    rateLimitRpm: 120,
    timeoutSeconds: 120,
    retryPolicy: { maxRetries: 1, backoffMs: 1000 },
    isFallback: false,
    fallbackPriority: 99,
    healthStatus: 'offline',
    lastHealthCheck: '2026-10-12T17:50:00Z',
    lastError: 'Connection refused at localhost:11434 (Daemon not running)',
    hasStoredKey: false
  },
  {
    id: '11111111-1111-1111-1111-111111111105',
    name: 'OpenRouter',
    slug: 'openrouter',
    adapterType: 'openrouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    isEnabled: false,
    supportsText: true,
    supportsVision: true,
    supportsImageGen: true,
    supportsEmbeddings: false,
    rateLimitRpm: 60,
    timeoutSeconds: 60,
    retryPolicy: { maxRetries: 2, backoffMs: 1000 },
    isFallback: false,
    fallbackPriority: 4,
    healthStatus: 'unknown',
    hasStoredKey: false
  }
];

export const initialModels: ProviderModel[] = [
  {
    id: 'm1',
    providerId: '11111111-1111-1111-1111-111111111101',
    modelIdentifier: 'gemini-2.0-flash',
    displayName: 'Gemini 2.0 Flash',
    contextWindow: 1048576,
    maxOutputTokens: 8192,
    inputCostPerMillionTokens: 0.10,
    outputCostPerMillionTokens: 0.40,
    supportsTools: true,
    supportsStreaming: true,
    isDefault: true
  },
  {
    id: 'm2',
    providerId: '11111111-1111-1111-1111-111111111101',
    modelIdentifier: 'gemini-1.5-pro',
    displayName: 'Gemini 1.5 Pro',
    contextWindow: 2097152,
    maxOutputTokens: 8192,
    inputCostPerMillionTokens: 1.25,
    outputCostPerMillionTokens: 5.00,
    supportsTools: true,
    supportsStreaming: true,
    isDefault: false
  },
  {
    id: 'm3',
    providerId: '11111111-1111-1111-1111-111111111102',
    modelIdentifier: 'gpt-4o',
    displayName: 'GPT-4o',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    inputCostPerMillionTokens: 2.50,
    outputCostPerMillionTokens: 10.00,
    supportsTools: true,
    supportsStreaming: true,
    isDefault: true
  },
  {
    id: 'm4',
    providerId: '11111111-1111-1111-1111-111111111102',
    modelIdentifier: 'gpt-4o-mini',
    displayName: 'GPT-4o Mini',
    contextWindow: 128000,
    maxOutputTokens: 16384,
    inputCostPerMillionTokens: 0.15,
    outputCostPerMillionTokens: 0.60,
    supportsTools: true,
    supportsStreaming: true,
    isDefault: false
  },
  {
    id: 'm5',
    providerId: '11111111-1111-1111-1111-111111111103',
    modelIdentifier: 'claude-3-5-sonnet-20241022',
    displayName: 'Claude 3.5 Sonnet',
    contextWindow: 200000,
    maxOutputTokens: 8192,
    inputCostPerMillionTokens: 3.00,
    outputCostPerMillionTokens: 15.00,
    supportsTools: true,
    supportsStreaming: true,
    isDefault: true
  },
  {
    id: 'm6',
    providerId: '11111111-1111-1111-1111-111111111104',
    modelIdentifier: 'llama3:8b',
    displayName: 'Llama 3 (8B)',
    contextWindow: 8192,
    maxOutputTokens: 4096,
    inputCostPerMillionTokens: 0.00,
    outputCostPerMillionTokens: 0.00,
    supportsTools: true,
    supportsStreaming: true,
    isDefault: true
  }
];

export const initialTools: ToolDefinition[] = [
  {
    id: '22222222-2222-2222-2222-222222222201',
    name: 'meta_facebook_page_publisher',
    displayName: 'Facebook Page Publisher',
    description: 'Publishes text and image posts to authorized Facebook Pages using the official Meta Graph API.',
    classification: 'external_mutation',
    inputSchema: {
      type: 'object',
      properties: {
        pageId: { type: 'string', description: 'Target Facebook Page ID' },
        message: { type: 'string', description: 'Post body text' },
        imageUrl: { type: 'string', description: 'Optional photo URL' },
        idempotencyKey: { type: 'string', description: 'Unique idempotency key' }
      },
      required: ['message', 'pageId']
    },
    outputSchema: {
      type: 'object',
      properties: {
        postId: { type: 'string' },
        permalinkUrl: { type: 'string' },
        publishedAt: { type: 'string' }
      }
    },
    requiredPermissions: ['facebook.publish'],
    isActive: true,
    requiresApproval: true,
    executionTimeoutMs: 30000,
    rateLimitPerMinute: 20,
    handlerIdentifier: 'tools/meta/facebookPublisher'
  },
  {
    id: '22222222-2222-2222-2222-222222222202',
    name: 'bengali_content_enhancer',
    displayName: 'Bengali Content Stylizer',
    description: 'Enhances Bengali and Banglish texts with witty phrasing, contextual humor, punchlines, and hashtag presets.',
    classification: 'data_transformation',
    inputSchema: {
      type: 'object',
      properties: {
        draft: { type: 'string' },
        humorLevel: { type: 'number', minimum: 1, maximum: 10 },
        style: { type: 'string', enum: ['conversational', 'story', 'troll', 'emotional'] }
      },
      required: ['draft']
    },
    outputSchema: {
      type: 'object',
      properties: {
        enhancedContent: { type: 'string' },
        suggestedHashtags: { type: 'array' }
      }
    },
    requiredPermissions: ['content.transform'],
    isActive: true,
    requiresApproval: false,
    executionTimeoutMs: 15000,
    rateLimitPerMinute: 60,
    handlerIdentifier: 'tools/content/bengaliEnhancer'
  },
  {
    id: '22222222-2222-2222-2222-222222222203',
    name: 'image_asset_generator',
    displayName: 'AI Image Asset Generator',
    description: 'Generates high quality visuals matching the generated content tone and theme.',
    classification: 'external_communication',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string' },
        aspectRatio: { type: 'string', enum: ['1:1', '16:9', '4:5', '9:16'] }
      },
      required: ['prompt']
    },
    outputSchema: {
      type: 'object',
      properties: {
        imageUrl: { type: 'string' },
        generationPrompt: { type: 'string' }
      }
    },
    requiredPermissions: ['ai.image'],
    isActive: true,
    requiresApproval: false,
    executionTimeoutMs: 45000,
    rateLimitPerMinute: 15,
    handlerIdentifier: 'tools/ai/imageGenerator'
  },
  {
    id: '22222222-2222-2222-2222-222222222204',
    name: 'web_search',
    displayName: 'Web & News Search',
    description: 'Searches live web for real-time trending news, facts, and public discussions.',
    classification: 'read_only',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        limit: { type: 'number' }
      },
      required: ['query']
    },
    outputSchema: {
      type: 'object',
      properties: {
        results: { type: 'array' }
      }
    },
    requiredPermissions: ['search.read'],
    isActive: true,
    requiresApproval: false,
    executionTimeoutMs: 20000,
    rateLimitPerMinute: 40,
    handlerIdentifier: 'tools/search/webSearch'
  },
  {
    id: '22222222-2222-2222-2222-222222222205',
    name: 'database_query',
    displayName: 'Database Query Reader',
    description: 'Safely executes parameterized read queries on permitted tables.',
    classification: 'read_only',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string' },
        filter: { type: 'object' }
      },
      required: ['table']
    },
    outputSchema: {
      type: 'object',
      properties: {
        rows: { type: 'array' }
      }
    },
    requiredPermissions: ['db.read'],
    isActive: true,
    requiresApproval: false,
    executionTimeoutMs: 15000,
    rateLimitPerMinute: 60,
    handlerIdentifier: 'tools/db/queryService'
  }
];

export const initialIntegrations: IntegrationConnection[] = [
  {
    id: 'int-fb-01',
    provider: 'meta_facebook',
    displayName: 'Trollogiya Official Facebook Page',
    accountIdentifier: '109847291834910', // Page ID
    connectionStatus: 'connected',
    grantedScopes: ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list', 'public_profile'],
    lastVerifiedAt: '2026-10-12T16:00:00Z',
    expiresAt: '2026-12-12T00:00:00Z',
    settings: {
      pageName: 'Trollogiya ট্রললজিয়া',
      category: 'Entertainment Website',
      followersCount: 24500,
      dryRunSimulation: false
    },
    assignedAgentIds: ['33333333-3333-3333-3333-333333333301']
  }
];

export const initialAgents: Agent[] = [
  {
    id: '33333333-3333-3333-3333-333333333301',
    name: 'Trollogiya Content Agent',
    slug: 'trollogiya-content-agent',
    description: 'Bangladeshi Bengali & Banglish viral content creator specializing in witty humor, relatable daily-life scenarios, emotional storytelling, and Facebook Page automated publishing.',
    icon: 'sparkles',
    category: 'facebook_publishing',
    tags: ['bengali', 'facebook', 'humor', 'viral', 'bangladesh'],
    status: 'active',
    primaryProviderId: '11111111-1111-1111-1111-111111111101',
    primaryModel: 'gemini-2.0-flash',
    version: 1,
    isTemplate: false,
    createdAt: '2026-10-10T12:00:00Z',
    updatedAt: '2026-10-12T15:30:00Z',
    enabledToolsCount: 3,
    config: {
      id: 'cfg-troll-01',
      agentId: '33333333-3333-3333-3333-333333333301',
      version: 1,
      temperature: 0.85,
      maxTokens: 3000,
      topP: 1.0,
      timeoutSeconds: 60,
      retryPolicy: { maxRetries: 2, backoffMs: 1500 },
      memoryMode: 'isolated',
      requiresHumanApproval: true,
      maxDailyExecutions: 50,
      executionTimeoutMs: 120000,
      createdAt: '2026-10-10T12:00:00Z',
      metadata: {
        language: 'bn-BD',
        allowBanglish: true,
        dailyPostsCount: 3,
        postDistribution: { short: 2, long: 1 },
        humorScale: 8,
        emotionalScale: 6,
        selectedPageId: '109847291834910',
        categories: [
          { id: 'funny_troll', label: 'Funny & Troll Posts', enabled: true },
          { id: 'daily_life', label: 'Relatable Daily-Life Content', enabled: true },
          { id: 'emotional_stories', label: 'Emotional Short Stories', enabled: true },
          { id: 'relationship_humor', label: 'Relationship Humor', enabled: true },
          { id: 'observational_comedy', label: 'Observational Comedy', enabled: true },
          { id: 'audience_engagement', label: 'Audience Engagement / Polls', enabled: true },
          { id: 'longer_storytelling', label: 'Longer Storytelling', enabled: true }
        ],
        hashtagConfig: ['#Trollogiya', '#BanglaMemes', '#DhakaLife', '#RelatableBangla'],
        ctaPreset: 'আপনার কী মনে হয়? কমেন্টে জানান!'
      }
    },
    prompts: [
      {
        id: 'p-troll-01',
        agentId: '33333333-3333-3333-3333-333333333301',
        promptType: 'system',
        currentVersion: 1,
        content: `You are "Trollogiya Content Agent", the premier viral Bangladeshi social media storyteller and entertainer for Facebook. 
Your goal is to write captivating, authentic Bengali (and natural Banglish when fitting) posts that deeply resonate with Bangladeshi audiences.

Content Guidelines:
1. Tone: Witty, warm, perceptive, culturally attuned, humorously self-deprecating, or genuinely touching.
2. Formats:
   - Short Punchy Posts (2-4 lines): Sharp punchlines, relatable observational memes, everyday traffic/exam/office/adda situations.
   - Narrative & Storytelling (150-350 words): Vivid depictions of Dhaka rains, village nostalgias, friendship, family quirks, and youthful struggles.
3. Language: Clean, modern conversational Bangladeshi Bengali. Avoid textbook/archaic sadhu bhasha.
4. Audience Engagement: Naturally invite thoughts or reactions without cheap clickbait.
5. Safety: Keep it respectful, humorous, and universally enjoyable. Never publish vulgarity, hate speech, or harassment.`,
        updatedAt: '2026-10-10T12:00:00Z'
      }
    ],
    latestExecution: {
      id: 'exec-101',
      status: 'completed',
      startedAt: '2026-10-12T14:00:00Z',
      durationMs: 3820
    }
  },
  {
    id: '33333333-3333-3333-3333-333333333302',
    name: 'Zuu Customer Support Agent',
    slug: 'zuu-customer-support',
    description: 'Handles 24/7 customer queries, ticket classification, order tracking, and escalation routing with empathetic and rapid responses.',
    icon: 'headphones',
    category: 'customer_support',
    tags: ['support', 'tickets', 'triage', 'multilingual'],
    status: 'active',
    primaryProviderId: '11111111-1111-1111-1111-111111111102',
    primaryModel: 'gpt-4o-mini',
    version: 2,
    isTemplate: false,
    createdAt: '2026-10-08T09:00:00Z',
    updatedAt: '2026-10-11T16:00:00Z',
    enabledToolsCount: 2,
    config: {
      id: 'cfg-sup-01',
      agentId: '33333333-3333-3333-3333-333333333302',
      version: 2,
      temperature: 0.3,
      maxTokens: 1024,
      topP: 1.0,
      timeoutSeconds: 30,
      retryPolicy: { maxRetries: 2, backoffMs: 1000 },
      memoryMode: 'isolated',
      requiresHumanApproval: false,
      maxDailyExecutions: 500,
      executionTimeoutMs: 45000,
      createdAt: '2026-10-08T09:00:00Z'
    },
    latestExecution: {
      id: 'exec-102',
      status: 'completed',
      startedAt: '2026-10-12T15:10:00Z',
      durationMs: 1450
    }
  },
  {
    id: '33333333-3333-3333-3333-333333333303',
    name: 'Deep Research & Trend Scout',
    slug: 'deep-research-scout',
    description: 'Conducts autonomous deep web investigations, summarizes tech developments, synthesizes market trends, and outputs cited intelligence dossiers.',
    icon: 'search',
    category: 'research',
    tags: ['deep-research', 'analysis', 'synthesis', 'trends'],
    status: 'active',
    primaryProviderId: '11111111-1111-1111-1111-111111111103',
    primaryModel: 'claude-3-5-sonnet-20241022',
    version: 1,
    isTemplate: false,
    createdAt: '2026-10-09T11:00:00Z',
    updatedAt: '2026-10-12T10:00:00Z',
    enabledToolsCount: 3,
    config: {
      id: 'cfg-res-01',
      agentId: '33333333-3333-3333-3333-333333333303',
      version: 1,
      temperature: 0.4,
      maxTokens: 4096,
      topP: 0.95,
      timeoutSeconds: 120,
      retryPolicy: { maxRetries: 3, backoffMs: 2000 },
      memoryMode: 'isolated',
      requiresHumanApproval: false,
      maxDailyExecutions: 20,
      executionTimeoutMs: 180000,
      createdAt: '2026-10-09T11:00:00Z'
    },
    latestExecution: {
      id: 'exec-103',
      status: 'completed',
      startedAt: '2026-10-12T13:45:00Z',
      durationMs: 12400
    }
  },
  {
    id: '33333333-3333-3333-3333-333333333304',
    name: 'Contract & Document Processor',
    slug: 'contract-document-processor',
    description: 'Extracts critical clauses, analyzes regulatory risks, parses PDF tables, and indexes institutional files into the Knowledge Base.',
    icon: 'file-text',
    category: 'document_processing',
    tags: ['documents', 'extraction', 'legal', 'ocr'],
    status: 'paused',
    primaryProviderId: '11111111-1111-1111-1111-111111111101',
    primaryModel: 'gemini-1.5-pro',
    version: 1,
    isTemplate: false,
    createdAt: '2026-10-05T08:00:00Z',
    updatedAt: '2026-10-11T12:00:00Z',
    enabledToolsCount: 1,
    config: {
      id: 'cfg-doc-01',
      agentId: '33333333-3333-3333-3333-333333333304',
      version: 1,
      temperature: 0.2,
      maxTokens: 4096,
      topP: 1.0,
      timeoutSeconds: 90,
      retryPolicy: { maxRetries: 2, backoffMs: 1500 },
      memoryMode: 'isolated',
      requiresHumanApproval: true,
      maxDailyExecutions: 30,
      executionTimeoutMs: 120000,
      createdAt: '2026-10-05T08:00:00Z'
    }
  }
];

export const initialExecutions: Execution[] = [
  {
    id: 'exec-101',
    agentId: '33333333-3333-3333-3333-333333333301',
    agentName: 'Trollogiya Content Agent',
    triggerType: 'schedule',
    status: 'completed',
    correlationId: 'corr-troll-20261012-01',
    inputPayload: {
      category: 'daily_life',
      slot: 'afternoon_post',
      topic: 'Dhaka afternoon traffic & rain sudden cravings'
    },
    startedAt: '2026-10-12T14:00:00Z',
    completedAt: '2026-10-12T14:00:04Z',
    durationMs: 3820,
    totalTokensUsed: 1420,
    estimatedCost: 0.00032,
    steps: [
      {
        id: 's1',
        executionId: 'exec-101',
        stepNumber: 1,
        stepName: 'Resolve System Prompt & Config',
        stepType: 'prompt_resolution',
        status: 'success',
        durationMs: 45,
        createdAt: '2026-10-12T14:00:00Z'
      },
      {
        id: 's2',
        executionId: 'exec-101',
        stepNumber: 2,
        stepName: 'Retrieve Scoped Memories & Preferences',
        stepType: 'memory_retrieval',
        status: 'success',
        durationMs: 120,
        outputData: { memoriesRetrieved: 3 },
        createdAt: '2026-10-12T14:00:00Z'
      },
      {
        id: 's3',
        executionId: 'exec-101',
        stepNumber: 3,
        stepName: 'AI Synthesis (Gemini 2.0 Flash)',
        stepType: 'llm_call',
        status: 'success',
        durationMs: 2100,
        outputData: { tokens: 1420 },
        createdAt: '2026-10-12T14:00:01Z'
      },
      {
        id: 's4',
        executionId: 'exec-101',
        stepNumber: 4,
        stepName: 'Tool Execution (Bengali Content Stylizer)',
        stepType: 'tool_execution',
        status: 'success',
        durationMs: 250,
        createdAt: '2026-10-12T14:00:03Z'
      },
      {
        id: 's5',
        executionId: 'exec-101',
        stepNumber: 5,
        stepName: 'Human Approval Gate Check',
        stepType: 'approval_gate',
        status: 'success',
        durationMs: 15,
        outputData: { approvedBy: 'admin@zuuagent.ai' },
        createdAt: '2026-10-12T14:00:03Z'
      },
      {
        id: 's6',
        executionId: 'exec-101',
        stepNumber: 6,
        stepName: 'Meta Graph Facebook Publishing',
        stepType: 'external_api',
        status: 'success',
        durationMs: 1290,
        outputData: { postId: '109847291834910_884920193' },
        createdAt: '2026-10-12T14:00:04Z'
      }
    ],
    outputs: [
      {
        id: 'out-101',
        executionId: 'exec-101',
        agentId: '33333333-3333-3333-3333-333333333301',
        outputType: 'social_post',
        title: 'বৃষ্টি আর যানজটের অম্লমধুর প্রেম',
        content: `বৃষ্টি নামলেই ঢাকার রাস্তায় দুইটা জিনিস বাড়ে— এক, রিকশার ভাড়া; দুই, মনে খিচুড়ি খাওয়ার তীব্র অনুভূতি! ☔️🍛

বাসের জানালায় বৃষ্টির ফোঁটা দেখে নিজেকে রোমান্টিক নায়ক ভাবতে গিয়ে হঠাৎ মনে পড়ল, অফিসের ব্যাগটাতে ল্যাপটপ আছে আর ছাতাটা বাসায় টেবিলের উপরে শুকাইতে দিছিলাম! 🥲

আপনার আজকের বৃষ্টিতে ভিজে বাড়ি ফেরার রেটিং ১০ এ কত? কমেন্টে জানান! 👇`,
        mediaUrls: [],
        metadata: {
          hashtags: ['#Trollogiya', '#DhakaRain', '#BanglaMemes', '#RelatableDailyLife'],
          facebookPostId: '109847291834910_884920193'
        },
        isPublished: true,
        createdAt: '2026-10-12T14:00:04Z'
      }
    ]
  },
  {
    id: 'exec-102',
    agentId: '33333333-3333-3333-3333-333333333301',
    agentName: 'Trollogiya Content Agent',
    triggerType: 'manual',
    status: 'awaiting_approval',
    correlationId: 'corr-troll-20261012-02',
    inputPayload: {
      category: 'funny_troll',
      topic: 'বিশ্ববিদ্যালয়ের অ্যাসাইনমেন্ট ডেডলাইন ও শেষ রাতের অতিমানবীয় শক্তি'
    },
    startedAt: '2026-10-12T16:15:00Z',
    totalTokensUsed: 980,
    estimatedCost: 0.00018,
    steps: [
      {
        id: 's10',
        executionId: 'exec-102',
        stepNumber: 1,
        stepName: 'AI Generation & Bengali Stylization',
        stepType: 'llm_call',
        status: 'success',
        durationMs: 1850,
        createdAt: '2026-10-12T16:15:00Z'
      },
      {
        id: 's11',
        executionId: 'exec-102',
        stepNumber: 2,
        stepName: 'Facebook Publishing Gate',
        stepType: 'approval_gate',
        status: 'waiting_approval',
        errorDetails: 'Pending human review in Approval Center before external mutation.',
        createdAt: '2026-10-12T16:15:02Z'
      }
    ],
    outputs: [
      {
        id: 'out-102',
        executionId: 'exec-102',
        agentId: '33333333-3333-3333-3333-333333333301',
        outputType: 'social_post',
        title: 'শেষ রাতের ডেডলাইন সুপারহিরো',
        content: `পুরো সেমিস্টার পড়ালেখার সাথে কোনো সম্পর্ক নাই, কিন্তু ডেডলাইনের ঠিক আগের রাতে রাত ৩টায় মস্তিষ্কের যে নিউরনগুলা অ্যাক্টিভ হয়— আইনস্টাইন বেঁচে থাকলে নির্ঘাত এসে সালাম দিয়ে যেত! 🧠⚡️

"কাল সকালে জমা দেওয়া লাগবে, আর আমি এখনও টপিক সিলেক্ট করতেছি"— এই ক্যাটাগরির কারা কারা আছেন হাত তোলেন! 🙋‍♂️`,
        mediaUrls: [],
        metadata: {
          category: 'funny_troll',
          scheduledTime: '2026-10-12T20:00:00Z'
        },
        isPublished: false,
        createdAt: '2026-10-12T16:15:02Z'
      }
    ]
  }
];

export const initialApprovals: ApprovalItem[] = [
  {
    id: 'appr-01',
    executionId: 'exec-102',
    agentId: '33333333-3333-3333-3333-333333333301',
    agentName: 'Trollogiya Content Agent',
    actionType: 'facebook_page_publish',
    targetDestination: 'Trollogiya Official Facebook Page (ID: 109847291834910)',
    riskLevel: 'medium',
    payloadSnapshot: {
      message: `পুরো সেমিস্টার পড়ালেখার সাথে কোনো সম্পর্ক নাই, কিন্তু ডেডলাইনের ঠিক আগের রাতে রাত ৩টায় মস্তিষ্কের যে নিউরনগুলা অ্যাক্টিভ হয়— আইনস্টাইন বেঁচে থাকলে নির্ঘাত এসে সালাম দিয়ে যেত! 🧠⚡️

"কাল সকালে জমা দেওয়া লাগবে, আর আমি এখনও টপিক সিলেক্ট করতেছি"— এই ক্যাটাগরির কারা কারা আছেন হাত তোলেন! 🙋‍♂️`,
      hashtags: ['#Trollogiya', '#StudentLife', '#BanglaMemes'],
      targetPage: 'Trollogiya Official Facebook Page'
    },
    payloadChecksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    status: 'pending',
    requestedAt: '2026-10-12T16:15:02Z',
    decisionReason: 'Awaiting Administrator or Reviewer confirmation before sending live post to Facebook.'
  }
];

export const initialMemories: AgentMemory[] = [
  {
    id: 'mem-01',
    agentId: '33333333-3333-3333-3333-333333333301',
    scope: 'agent',
    category: 'preference',
    key: 'humor_style_rule',
    content: 'Do not use slapstick or derogatory humor. Focus on universally relatable observations like Dhaka traffic, exam stress, rain cravings, and friendly addas.',
    source: 'admin_instruction',
    priority: 10,
    status: 'pinned',
    createdAt: '2026-10-10T12:00:00Z',
    updatedAt: '2026-10-10T12:00:00Z'
  },
  {
    id: 'mem-02',
    agentId: '33333333-3333-3333-3333-333333333301',
    scope: 'agent',
    category: 'instruction',
    key: 'bengali_font_rendering',
    content: 'Always format Bengali punctuation cleanly. Use genuine Unicode Bengali characters and avoid broken ligatures.',
    source: 'quality_review',
    priority: 8,
    status: 'active',
    createdAt: '2026-10-11T09:00:00Z',
    updatedAt: '2026-10-11T09:00:00Z'
  },
  {
    id: 'mem-03',
    scope: 'global',
    category: 'identity',
    key: 'platform_safety_charter',
    content: 'Platform Safety Charter: All agents across Zuu Agent must never generate or promote hate speech, unauthorized political endorsements, or unsolicited commercial spam.',
    source: 'master_admin',
    priority: 100,
    status: 'pinned',
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z'
  }
];

export const initialKnowledgeDocs: KnowledgeDocument[] = [
  {
    id: 'doc-01',
    title: 'Trollogiya Brand Tone & Community Guidelines 2026.pdf',
    fileType: 'application/pdf',
    fileSizeBytes: 245800,
    processingStatus: 'processed',
    version: 1,
    createdAt: '2026-10-10T11:00:00Z',
    assignedAgentIds: ['33333333-3333-3333-3333-333333333301']
  },
  {
    id: 'doc-02',
    title: 'Zuu Support Escalation Matrix & SLA Policy.md',
    fileType: 'text/markdown',
    fileSizeBytes: 42100,
    rawContent: 'Tier 1 queries: Answer within 30s. Tier 2 technical bugs: Escalate to dev channel. Refunds: Require human manager sign-off.',
    processingStatus: 'processed',
    version: 2,
    createdAt: '2026-10-08T10:00:00Z',
    assignedAgentIds: ['33333333-3333-3333-3333-333333333302']
  }
];

export const initialNotifications: NotificationItem[] = [
  {
    id: 'notif-01',
    level: 'warning',
    title: 'Approval Required: Trollogiya Facebook Post',
    message: 'Trollogiya Content Agent produced a new Facebook post draft awaiting your review before publication.',
    channel: 'in_app',
    isRead: false,
    actionUrl: '/approvals',
    createdAt: '2026-10-12T16:15:02Z'
  },
  {
    id: 'notif-02',
    level: 'info',
    title: 'Ollama Node Offline',
    message: 'Local Ollama node at localhost:11434 is unreachable. Falling back to Google Gemini for agents.',
    channel: 'in_app',
    isRead: false,
    actionUrl: '/providers',
    createdAt: '2026-10-12T15:00:00Z'
  }
];

export const initialAuditLogs: AuditLogItem[] = [
  {
    id: 'log-01',
    actorEmail: 'admin@zuuagent.ai',
    action: 'agent.create',
    entityType: 'agent',
    entityId: '33333333-3333-3333-3333-333333333301',
    ipAddress: '103.145.74.12',
    createdAt: '2026-10-10T12:00:00Z'
  },
  {
    id: 'log-02',
    actorEmail: 'admin@zuuagent.ai',
    action: 'integration.connect',
    entityType: 'meta_facebook',
    entityId: '109847291834910',
    ipAddress: '103.145.74.12',
    createdAt: '2026-10-12T13:30:00Z'
  }
];
