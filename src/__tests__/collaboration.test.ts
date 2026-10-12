import { describe, it, expect } from 'vitest';
import { AgentCollaborationEngine, DelegationRule } from '../services/collaboration/agentCollaborationEngine';
import { initialAgents } from '../data/initialData';

describe('Agent-to-Agent Controlled Delegation (PART 18)', () => {
  const researchAgent = initialAgents.find(a => a.category === 'research')!;
  const contentAgent = initialAgents.find(a => a.slug.includes('trollogiya'))!;

  it('successfully executes a 2-agent handoff chain with output transformation', async () => {
    const rules: DelegationRule[] = [
      {
        id: 'r1',
        sourceAgentId: researchAgent.id,
        targetAgentId: contentAgent.id,
        name: 'Research -> Content Draft',
        triggerCondition: 'on_completed',
        transformPrompt: (out) => `Draft a witty Bengali story based on: ${out.substring(0, 100)}`,
        requiresApprovalBeforeHandoff: false
      }
    ];

    const result = await AgentCollaborationEngine.runDelegationChain(
      researchAgent,
      'Research Dhaka traffic patterns during monsoon rains',
      rules,
      initialAgents,
      true
    );

    expect(result.status).toBe('completed');
    expect(result.totalSteps).toBe(2);
    expect(result.steps[0].fromAgentId).toBe(researchAgent.id);
    expect(result.steps[0].toAgentId).toBe(contentAgent.id);
    expect(result.finalOutput).toBeDefined();
  });

  it('detects cycles and halts immediately when an agent delegates back to an ancestor in the chain', async () => {
    // Create an intentional loop: Agent A -> Agent B -> Agent A
    const rules: DelegationRule[] = [
      {
        id: 'r1',
        sourceAgentId: researchAgent.id,
        targetAgentId: contentAgent.id,
        name: 'A -> B',
        triggerCondition: 'on_completed',
        transformPrompt: (out) => out,
        requiresApprovalBeforeHandoff: false
      },
      {
        id: 'r2',
        sourceAgentId: contentAgent.id,
        targetAgentId: researchAgent.id, // Cycles back to researchAgent!
        name: 'B -> A (Cycle Loop)',
        triggerCondition: 'on_completed',
        transformPrompt: (out) => out,
        requiresApprovalBeforeHandoff: false
      }
    ];

    const result = await AgentCollaborationEngine.runDelegationChain(
      researchAgent,
      'Start cycle test',
      rules,
      initialAgents,
      true
    );

    expect(result.status).toBe('cycle_detected');
    expect(result.errorMessage).toContain('Cycle detected');
  });

  it('enforces human approval gate when delegation rule requires sign-off', async () => {
    const rules: DelegationRule[] = [
      {
        id: 'r1',
        sourceAgentId: researchAgent.id,
        targetAgentId: contentAgent.id,
        name: 'Research -> Content (Requires Approval)',
        triggerCondition: 'on_completed',
        transformPrompt: (out) => out,
        requiresApprovalBeforeHandoff: true // Enforce approval gate!
      }
    ];

    const result = await AgentCollaborationEngine.runDelegationChain(
      researchAgent,
      'Investigate sensitive market metrics',
      rules,
      initialAgents,
      true
    );

    expect(result.status).toBe('awaiting_approval');
    expect(result.errorMessage).toContain('Human approval required');
  });
});
