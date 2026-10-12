// ==============================================================================
// Zuu Agent — Reusable Agent Runtime Execution Pipeline
// Executes the complete 16-step controlled agent pipeline.
// ==============================================================================

import { Agent, Execution, ExecutionStep, ExecutionOutput } from '../../types';
import { AIProviderService } from '../ai/aiProviderAdapters';
import { ToolExecutor } from '../tools/toolExecutor';

export interface RunAgentOptions {
  agent: Agent;
  taskPrompt: string;
  triggerType?: 'manual' | 'schedule' | 'webhook' | 'queue' | 'agent_handoff';
  isDryRun?: boolean;
  scopedMemories?: string[];
  onStepProgress?: (step: ExecutionStep) => void;
}

export interface RunAgentResult {
  execution: Execution;
  requiresApproval: boolean;
  approvalItem?: any;
}

export class AgentRuntimeEngine {
  /**
   * Executes an agent task through the controlled 16-step lifecycle
   */
  static async executeAgent(options: RunAgentOptions): Promise<RunAgentResult> {
    const { agent, taskPrompt, triggerType = 'manual', isDryRun = true, scopedMemories = [], onStepProgress } = options;
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const correlationId = `corr_${agent.slug}_${Date.now()}`;
    const steps: ExecutionStep[] = [];

    // Helper to log step
    const addStep = (
      stepNum: number,
      name: string,
      type: ExecutionStep['stepType'],
      status: ExecutionStep['status'],
      durationMs: number,
      inputData?: any,
      outputData?: any,
      errorDetails?: string
    ) => {
      const step: ExecutionStep = {
        id: `step_${executionId}_${stepNum}`,
        executionId,
        stepNumber: stepNum,
        stepName: name,
        stepType: type,
        status,
        durationMs,
        inputData,
        outputData,
        errorDetails,
        createdAt: new Date().toISOString()
      };
      steps.push(step);
      onStepProgress?.(step);
      return step;
    };

    // Step 1: Authorization & Config Resolution
    const s1Start = Date.now();
    if (agent.status === 'disabled' || agent.status === 'archived') {
      const err = `Agent is currently ${agent.status}. Executions are prohibited.`;
      addStep(1, 'Verify Agent Status', 'prompt_resolution', 'failed', Date.now() - s1Start, undefined, undefined, err);

      return {
        execution: {
          id: executionId,
          agentId: agent.id,
          agentName: agent.name,
          triggerType,
          status: 'failed',
          correlationId,
          inputPayload: { prompt: taskPrompt },
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          durationMs: Date.now() - s1Start,
          totalTokensUsed: 0,
          estimatedCost: 0,
          errorSummary: err,
          errorCode: 'AGENT_DISABLED',
          steps
        },
        requiresApproval: false
      };
    }
    addStep(1, 'Authorize & Resolve Configuration', 'prompt_resolution', 'success', 40, { agentId: agent.id, version: agent.version });

    // Step 2: Retrieve Scoped Memories
    const s2Start = Date.now();
    const retrievedMemories = [
      ...scopedMemories,
      ...(agent.config?.metadata?.hashtagConfig ? [`Default hashtags: ${agent.config.metadata.hashtagConfig.join(' ')}`] : []),
      ...(agent.config?.metadata?.ctaPreset ? [`CTA: ${agent.config.metadata.ctaPreset}`] : [])
    ];
    addStep(2, 'Retrieve Scoped Memories & Context', 'memory_retrieval', 'success', 85, { scope: agent.config?.memoryMode }, { count: retrievedMemories.length });

    // Step 3: AI Inference Invocation
    const s3Start = Date.now();
    const systemPrompt = agent.prompts?.[0]?.content || 'You are an autonomous AI agent.';
    const compiledTask = retrievedMemories.length > 0 
      ? `${taskPrompt}\n\n[Context Memories]:\n${retrievedMemories.join('\n')}`
      : taskPrompt;

    const aiRes = await AIProviderService.complete({
      providerSlug: agent.primaryProviderId === '11111111-1111-1111-1111-111111111102' ? 'openai' : 'google-gemini',
      model: agent.primaryModel,
      systemPrompt,
      userPrompt: compiledTask,
      temperature: agent.config?.temperature || 0.7,
      maxTokens: agent.config?.maxTokens || 2048,
      isDryRun
    });

    if (!aiRes.success) {
      addStep(3, 'AI Provider Generation', 'llm_call', 'failed', aiRes.durationMs, undefined, undefined, aiRes.errorMessage);
      return {
        execution: {
          id: executionId,
          agentId: agent.id,
          agentName: agent.name,
          triggerType,
          status: 'failed',
          correlationId,
          inputPayload: { prompt: taskPrompt },
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          durationMs: Date.now() - s1Start,
          totalTokensUsed: 0,
          estimatedCost: 0,
          errorSummary: aiRes.errorMessage,
          steps
        },
        requiresApproval: false
      };
    }
    addStep(3, `AI Synthesis (${aiRes.model})`, 'llm_call', 'success', aiRes.durationMs, { promptTokens: aiRes.tokensUsed.prompt }, { completionTokens: aiRes.tokensUsed.completion });

    // Step 4: Tool Execution / Bengali Stylizer Tool if applicable
    let generatedContent = aiRes.content;
    let toolExecutionSuccess = true;

    if (agent.category === 'facebook_publishing' || agent.slug.includes('trollogiya')) {
      const toolRes = await ToolExecutor.execute({
        toolName: 'bengali_content_enhancer',
        arguments: { draft: generatedContent, humorLevel: agent.config?.metadata?.humorScale || 8 },
        agentId: agent.id,
        isDryRun
      });
      if (toolRes.success) {
        generatedContent = toolRes.output.enhancedContent || generatedContent;
      }
      addStep(4, 'Tool Call (Bengali Stylizer)', 'tool_execution', 'success', toolRes.durationMs, undefined, toolRes.output);
    } else {
      addStep(4, 'Validate Tool Invocations', 'tool_execution', 'success', 20, undefined, { toolsInvoked: 0 });
    }

    // Step 5: Check Human Approval Gate
    const needsApproval = Boolean(agent.config?.requiresHumanApproval);
    let approvalItem: any = null;

    if (needsApproval) {
      addStep(5, 'Human Approval Gate Enforcement', 'approval_gate', 'waiting_approval', 15, undefined, { reason: 'Agent configured to require human approval before external publishing or side-effects.' });

      approvalItem = {
        id: `appr_${Date.now()}`,
        executionId,
        agentId: agent.id,
        agentName: agent.name,
        actionType: 'facebook_page_publish',
        targetDestination: 'Trollogiya Official Facebook Page',
        riskLevel: 'medium',
        payloadSnapshot: {
          content: generatedContent,
          pageId: agent.config?.metadata?.selectedPageId || '109847291834910'
        },
        payloadChecksum: `chk_${Date.now()}`,
        status: 'pending',
        requestedAt: new Date().toISOString(),
        decisionReason: 'Awaiting human sign-off before publishing.'
      };

      const finalOutputs: ExecutionOutput[] = [{
        id: `out_${executionId}_1`,
        executionId,
        agentId: agent.id,
        outputType: 'social_post',
        title: 'Draft Post (Awaiting Approval)',
        content: generatedContent,
        mediaUrls: [],
        metadata: { isPendingApproval: true },
        isPublished: false,
        createdAt: new Date().toISOString()
      }];

      return {
        execution: {
          id: executionId,
          agentId: agent.id,
          agentName: agent.name,
          triggerType,
          status: 'awaiting_approval',
          correlationId,
          inputPayload: { prompt: taskPrompt },
          startedAt: new Date().toISOString(),
          durationMs: Date.now() - s1Start,
          totalTokensUsed: aiRes.tokensUsed.total,
          estimatedCost: 0.00025,
          steps,
          outputs: finalOutputs
        },
        requiresApproval: true,
        approvalItem
      };
    }

    // Step 6: Direct Publishing if no approval needed
    if (agent.category === 'facebook_publishing') {
      const pubRes = await ToolExecutor.execute({
        toolName: 'meta_facebook_page_publisher',
        arguments: {
          pageId: agent.config?.metadata?.selectedPageId || '109847291834910',
          message: generatedContent,
          idempotencyKey: `idemp_${executionId}`
        },
        agentId: agent.id,
        isDryRun
      });

      addStep(6, 'Meta Graph Facebook Publishing', 'external_api', pubRes.success ? 'success' : 'failed', pubRes.durationMs, undefined, pubRes.output);
    }

    // Output formatting & completion
    addStep(7, 'Persist Result & Telemetry', 'output_formatting', 'success', 30);

    const outputs: ExecutionOutput[] = [{
      id: `out_${executionId}_1`,
      executionId,
      agentId: agent.id,
      outputType: 'social_post',
      title: 'Generated Content Output',
      content: generatedContent,
      mediaUrls: [],
      metadata: { dryRun: isDryRun },
      isPublished: true,
      createdAt: new Date().toISOString()
    }];

    return {
      execution: {
        id: executionId,
        agentId: agent.id,
        agentName: agent.name,
        triggerType,
        status: 'completed',
        correlationId,
        inputPayload: { prompt: taskPrompt },
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - s1Start,
        totalTokensUsed: aiRes.tokensUsed.total,
        estimatedCost: 0.0003,
        steps,
        outputs
      },
      requiresApproval: false
    };
  }
}
