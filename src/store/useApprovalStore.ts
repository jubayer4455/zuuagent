import { create } from 'zustand';
import { ApprovalItem } from '../types';
import { initialApprovals } from '../data/initialData';
import { MetaGraphClient } from '../services/facebook/metaGraphClient';

interface ApprovalState {
  approvals: ApprovalItem[];
  addApproval: (item: ApprovalItem) => void;
  decideApproval: (
    approvalId: string, 
    decision: 'approved' | 'rejected', 
    reason: string, 
    decidedByEmail?: string
  ) => Promise<boolean>;
}

export const useApprovalStore = create<ApprovalState>((set, get) => ({
  approvals: initialApprovals,

  addApproval: (item) => {
    set(state => ({
      approvals: [item, ...state.approvals]
    }));
  },

  decideApproval: async (approvalId, decision, reason, decidedByEmail = 'admin@zuuagent.ai') => {
    const item = get().approvals.find(a => a.id === approvalId);
    if (!item) return false;

    // If approved and target is Facebook publishing, execute the mutation with confirmed payload
    if (decision === 'approved' && item.actionType.includes('facebook')) {
      await MetaGraphClient.publishToPage({
        pageId: item.payloadSnapshot?.pageId || '109847291834910',
        message: item.payloadSnapshot?.content || item.payloadSnapshot?.message || '',
        idempotencyKey: `appr_pub_${approvalId}`,
        isDryRun: true
      });
    }

    set(state => ({
      approvals: state.approvals.map(a => 
        a.id === approvalId 
          ? {
              ...a,
              status: decision,
              decidedAt: new Date().toISOString(),
              decidedBy: decidedByEmail,
              decisionReason: reason
            }
          : a
      )
    }));

    return true;
  }
}));
