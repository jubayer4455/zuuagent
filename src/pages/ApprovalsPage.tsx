import React, { useState } from 'react';
import { 
  CheckSquare, 
  Check, 
  X, 
  ShieldAlert, 
  Clock, 
  Bot, 
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { useApprovalStore } from '../store/useApprovalStore';
import { useAuthStore } from '../store/useAuthStore';
import { ApprovalItem } from '../types';

export const ApprovalsPage: React.FC = () => {
  const { approvals, decideApproval } = useApprovalStore();
  const { currentUser, hasPermission } = useAuthStore();

  const [selectedApproval, setSelectedApproval] = useState<ApprovalItem | null>(
    approvals.find(a => a.status === 'pending') || approvals[0] || null
  );
  const [rejectReason, setRejectReason] = useState('');
  const [isDeciding, setIsDeciding] = useState(false);

  const canApprove = hasPermission('approvals.decide');

  const handleDecision = async (decision: 'approved' | 'rejected') => {
    if (!selectedApproval) return;
    setIsDeciding(true);

    const reason = decision === 'rejected' 
      ? (rejectReason.trim() || 'Rejected by authorized reviewer')
      : 'Confirmed and authorized by reviewer';

    await decideApproval(selectedApproval.id, decision, reason, currentUser.email);
    setIsDeciding(false);
    setRejectReason('');

    // Update selected item view
    const updated = approvals.find(a => a.id === selectedApproval.id);
    if (updated) setSelectedApproval({ ...updated, status: decision });
    alert(`Action ${decision.toUpperCase()}: Mutation pipeline fulfilled.`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">
          Centralized Approval Center
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Enforce human-in-the-loop oversight before external publishing, high-impact mutations, or privileged tool execution.
        </p>
      </div>

      {!canApprove && (
        <div className="p-4 rounded-xl border border-amber-900/60 bg-amber-950/20 flex items-center space-x-3 text-xs text-amber-300">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            Read-only mode: Your active role ({currentUser.systemRole}) can inspect proposed actions, but requires Reviewer or Administrator credentials to submit approve/reject decisions.
          </span>
        </div>
      )}

      {/* Grid: Approvals List & Inspection Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Pending & Decided Queue */}
        <div className="space-y-3">
          <div className="border border-slate-800 rounded-xl bg-[#0f172a]/90 overflow-hidden">
            <div className="p-3 border-b border-slate-800 text-xs font-bold uppercase text-slate-400">
              Approval Queue ({approvals.length})
            </div>
            <div className="divide-y divide-slate-800/70">
              {approvals.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  No items in approval queue.
                </div>
              ) : (
                approvals.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedApproval(item)}
                    className={`p-4 hover:bg-slate-800/40 cursor-pointer transition text-xs space-y-1.5 ${
                      selectedApproval?.id === item.id ? 'bg-slate-800/60 border-l-2 border-cyan-400' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">{item.agentName}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        item.status === 'pending'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : item.status === 'approved'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono">
                      Action: {item.actionType}
                    </div>

                    <div className="text-[10px] text-slate-500 flex items-center justify-between">
                      <span>Risk: <strong className="text-amber-400 uppercase">{item.riskLevel}</strong></span>
                      <span>{new Date(item.requestedAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right 2 Cols: Deep Action Inspector & Decision Gate */}
        <div className="lg:col-span-2">
          {selectedApproval ? (
            <div className="border border-slate-800 rounded-2xl bg-[#0f172a]/95 p-6 space-y-5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-base font-extrabold text-slate-100">
                    Review Proposed Action: {selectedApproval.actionType}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Originating Agent: <strong className="text-cyan-400">{selectedApproval.agentName}</strong>
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono text-slate-500">Checksum: {selectedApproval.payloadChecksum.substring(0, 12)}...</span>
                  <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${
                    selectedApproval.riskLevel === 'high' ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                  }`}>
                    {selectedApproval.riskLevel} Risk
                  </span>
                </div>
              </div>

              {/* Destination Target */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Intended Target Destination</span>
                <div className="font-semibold text-slate-200">{selectedApproval.targetDestination}</div>
              </div>

              {/* Payload Snapshot Preview */}
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Verified Payload Snapshot (Tamper-Proof)
                </span>
                <div className="mt-1.5 p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 whitespace-pre-line leading-relaxed font-sans text-xs max-h-60 overflow-y-auto">
                  {selectedApproval.payloadSnapshot?.content || 
                   selectedApproval.payloadSnapshot?.message || 
                   JSON.stringify(selectedApproval.payloadSnapshot, null, 2)}
                </div>
              </div>

              {/* Status or Decision History */}
              {selectedApproval.status !== 'pending' ? (
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-200">Decided as:</span>
                    <span className="uppercase font-bold text-cyan-400">{selectedApproval.status}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">Decided by: {selectedApproval.decidedBy || 'Reviewer'}</div>
                  <div className="text-[11px] text-slate-400">Reason: {selectedApproval.decisionReason}</div>
                </div>
              ) : (
                /* Decision Action Controls */
                <div className="pt-4 border-t border-slate-800 space-y-4">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                      Decision Notes / Feedback (Required for Rejection)
                    </label>
                    <input
                      type="text"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Add reviewer notes or reason for modification..."
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="flex items-center justify-end space-x-3">
                    <button
                      onClick={() => handleDecision('rejected')}
                      disabled={!canApprove || isDeciding}
                      className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-bold transition disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      <span>Reject & Cancel Mutation</span>
                    </button>

                    <button
                      onClick={() => handleDecision('approved')}
                      disabled={!canApprove || isDeciding}
                      className="flex items-center space-x-1.5 px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950 transition disabled:opacity-50"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Authorize & Publish Now</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 border border-slate-800 rounded-2xl bg-[#0f172a]/95 text-center text-xs text-slate-500">
              Select an approval request to inspect.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
