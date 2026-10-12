import { create } from 'zustand';
import { Execution, ExecutionStatus, Agent } from '../types';
import { initialExecutions } from '../data/initialData';
import { AgentRuntimeEngine } from '../services/engine/agentRuntimeEngine';
import { useApprovalStore } from './useApprovalStore';

interface ExecutionState {
  executions: Execution[];
  activeExecutionId: string | null;
  isExecuting: boolean;

  // Actions
  triggerAgentExecution: (
    agent: Agent,
    taskPrompt: string,
    options?: { isDryRun?: boolean; triggerType?: Execution['triggerType'] }
  ) => Promise<Execution>;
  cancelExecution: (executionId: string) => void;
  retryExecution: (executionId: string, agent: Agent) => Promise<Execution | null>;
  getExecutionById: (id: string) => Execution | undefined;
  getExecutionsByAgentId: (agentId: string) => Execution[];
}

export const useExecutionStore = create<ExecutionState>((set, get) => ({
  executions: initialExecutions,
  activeExecutionId: null,
  isExecuting: false,

  triggerAgentExecution: async (agent, taskPrompt, options) => {
    set({ isExecuting: true });

    try {
      const result = await AgentRuntimeEngine.executeAgent({
        agent,
        taskPrompt,
        triggerType: options?.triggerType || 'manual',
        isDryRun: options?.isDryRun ?? true
      });

      // If execution triggered an approval gate, register the item in Approval Center
      if (result.requiresApproval && result.approvalItem) {
        useApprovalStore.getState().addApproval(result.approvalItem);
      }

      set(state => ({
        executions: [result.execution, ...state.executions],
        activeExecutionId: result.execution.id,
        isExecuting: false
      }));

      return result.execution;
    } catch (err: any) {
      set({ isExecuting: false });
      throw err;
    }
  },

  cancelExecution: (executionId) => {
    set(state => ({
      executions: state.executions.map(exec => 
        exec.id === executionId 
          ? { ...exec, status: 'cancelled' as ExecutionStatus, completedAt: new Date().toISOString() } 
          : exec
      )
    }));
  },

  retryExecution: async (executionId, agent) => {
    const existing = get().getExecutionById(executionId);
    if (!existing) return null;

    const taskPrompt = existing.inputPayload?.prompt || existing.inputPayload?.topic || 'Retry execution task';
    return get().triggerAgentExecution(agent, taskPrompt, {
      isDryRun: false,
      triggerType: existing.triggerType
    });
  },

  getExecutionById: (id) => get().executions.find(e => e.id === id),
  getExecutionsByAgentId: (agentId) => get().executions.filter(e => e.agentId === agentId)
}));
