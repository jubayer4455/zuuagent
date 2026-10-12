import React from 'react';
import { ShieldAlert, ShieldCheck, Clock, Search } from 'lucide-react';
import { useSystemStore } from '../store/useSystemStore';

export const SecurityAuditPage: React.FC = () => {
  const { auditLogs } = useSystemStore();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">Security & Audit Logs</h1>
        <p className="text-slate-400 text-sm mt-1">
          Immutable event log tracking administrative mutations, agent configurations, and access boundaries.
        </p>
      </div>

      <div className="border border-slate-800 rounded-2xl bg-[#0f172a]/95 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400">
              <tr>
                <th className="p-3 pl-5">Timestamp</th>
                <th className="p-3">Actor Email</th>
                <th className="p-3">Action</th>
                <th className="p-3">Entity Type</th>
                <th className="p-3">Entity ID</th>
                <th className="p-3 pr-5">Client IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30">
                  <td className="p-3 pl-5 text-slate-400">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="p-3 text-cyan-400">{log.actorEmail || 'System'}</td>
                  <td className="p-3 font-semibold text-slate-200">{log.action}</td>
                  <td className="p-3 uppercase text-slate-400 text-[10px]">{log.entityType}</td>
                  <td className="p-3 text-slate-500 truncate max-w-xs">{log.entityId || 'N/A'}</td>
                  <td className="p-3 pr-5 text-slate-500">{log.ipAddress || '127.0.0.1'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
