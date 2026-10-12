// ==============================================================================
// Zuu Agent — Agent-to-Agent Controlled Collaboration & Delegation Engine
// Implements PART 18: Typed Handoffs, Depth Limits, Cycle Detection, and Audit Tracing.
// ==============================================================================

import { Agent, Execution, ExecutionStep } from '../../types';
import { AgentRuntimeEngine } from '../engine/agentRuntimeEngine';

export interface DelegationRule {
  id: string;
  sourceAgentId: string;
  targetAgentId: string;
  name: string;
  triggerCondition: string; // e.g. "on_output_completed"
  transformPrompt: (sourceOutput: string) => string;
  requiresApprovalBeforeHandoff: boolean;
}

export interface DelegationChainStep {
  stepIndex: number;
  fromAgentId: string;
  fromAgentName: string;
  toAgentId: string;
  toAgentName: string;
  inputPayload: string;
  outputPayload: string;
  status: 'completed' | 'failed' | 'awaiting_approval';
  executionId: string;
  durationMs: number;
}

export interface DelegationChainResult {
  chainCorrelationId: string;
  status: 'completed' | 'failed' | 'cycle_detected' | 'max_depth_exceeded' | 'awaiting_approval';
  totalSteps: number;
  steps: DelegationChainStep[];
  finalOutput?: string;
  errorMessage?: string;
}

export class AgentCollaborationEngine {
  private static MAX_DELEGATION_DEPTH = 4; // Hard security ceiling

  /**
   * Executes a multi-agent delegation pipeline with cycle detection and bounded depth
   */
  static async runDelegationChain(
    initialAgent: Agent,
    initialPrompt: string,
    delegationRules: DelegationRule[],
    allAgents: Agent[],
    isDryRun: boolean = true
  ): Promise<DelegationChainResult> {
    const chainCorrelationId = `chain_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const visitedAgentIds = new Set<string>();
    const chainSteps: DelegationChainStep[] = [];

    let currentAgent = initialAgent;
    let currentInput = initialPrompt;
    let depth = 0;

    while (depth < this.MAX_DELEGATION_DEPTH) {
      depth++;

      // Cycle Detection Check
      if (visitedAgentIds.has(currentAgent.id)) {
        return {
          chainCorrelationId,
          status: 'cycle_detected',
          totalSteps: chainSteps.length,
          steps: chainSteps,
          errorMessage: `Security Violation: Cycle detected. Agent "${currentAgent.name}" was already visited in this delegation chain.`
        };
      }
      visitedAgentIds.add(currentAgent.id);

      const stepStart = Date.now();
      // Execute current agent in chain
      const runResult = await AgentRuntimeEngine.executeAgent({
        agent: currentAgent,
        taskPrompt: currentInput,
        triggerType: 'agent_handoff',
        isDryRun
      });

      const currentOutput = runResult.execution.outputs?.[0]?.content || '';
      const stepDuration = Date.now() - stepStart;

      // Find if there is an authorized delegation rule to hand off to the next agent
      const nextRule = delegationRules.find(r => r.sourceAgentId === currentAgent.id);

      if (!nextRule) {
        // Natural end of delegation chain
        chainSteps.push({
          stepIndex: depth,
          fromAgentId: currentAgent.id,
          fromAgentName: currentAgent.name,
          toAgentId: 'CHAIN_TERMINUS',
          toAgentName: 'Pipeline Finished',
          inputPayload: currentInput,
          outputPayload: currentOutput,
          status: 'completed',
          executionId: runResult.execution.id,
          durationMs: stepDuration
        });

        return {
          chainCorrelationId,
          status: 'completed',
          totalSteps: chainSteps.length,
          steps: chainSteps,
          finalOutput: currentOutput
        };
      }

      // Check if next rule requires human approval
      const nextAgent = allAgents.find(a => a.id === nextRule.targetAgentId);
      if (!nextAgent) {
        return {
          chainCorrelationId,
          status: 'failed',
          totalSteps: chainSteps.length,
          steps: chainSteps,
          errorMessage: `Target agent ${nextRule.targetAgentId} for rule "${nextRule.name}" not found.`
        };
      }

      chainSteps.push({
        stepIndex: depth,
        fromAgentId: currentAgent.id,
        fromAgentName: currentAgent.name,
        toAgentId: nextAgent.id,
        toAgentName: nextAgent.name,
        inputPayload: currentInput,
        outputPayload: currentOutput,
        status: nextRule.requiresApprovalBeforeHandoff ? 'awaiting_approval' : 'completed',
        executionId: runResult.execution.id,
        durationMs: stepDuration
      });

      if (nextRule.requiresApprovalBeforeHandoff) {
        return {
          chainCorrelationId,
          status: 'awaiting_approval',
          totalSteps: chainSteps.length,
          steps: chainSteps,
          finalOutput: currentOutput,
          errorMessage: `Delegation paused: Human approval required before handoff from "${currentAgent.name}" to "${nextAgent.name}".`
        };
      }

      // Prepare input for next agent using typed transformation
      currentInput = nextRule.transformPrompt(currentOutput);
      currentAgent = nextAgent;
    }

    // Exceeded max depth
    return {
      chainCorrelationId,
      status: 'max_depth_exceeded',
      totalSteps: chainSteps.length,
      steps: chainSteps,
      errorMessage: `Security ceiling reached: Maximum delegation depth of ${this.MAX_DELEGATION_DEPTH} exceeded.`
    };
  }
}
