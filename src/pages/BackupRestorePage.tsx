import React, { useState } from 'react';
import { DatabaseBackup, RotateCcw, CheckCircle2, ShieldCheck } from 'lucide-react';

export const BackupRestorePage: React.FC = () => {
  const [backups, setBackups] = useState([
    {
      id: 'bk-01',
      type: 'full_config',
      size: '142 KB',
      checksum: 'sha256:4a8c9b2e817f09d3...',
      createdAt: '2026-10-12T12:00:00Z',
      status: 'completed'
    },
    {
      id: 'bk-02',
      type: 'agents_only',
      size: '64 KB',
      checksum: 'sha256:88fb19349c12a87e...',
      createdAt: '2026-10-11T12:00:00Z',
      status: 'completed'
    }
  ]);

  const handleCreateBackup = () => {
    const newBk = {
      id: `bk_${Date.now()}`,
      type: 'full_config',
      size: '148 KB',
      checksum: `sha256:${Math.random().toString(16).substring(2, 10)}...`,
      createdAt: new Date().toISOString(),
      status: 'completed'
    };
    setBackups([newBk, ...backups]);
    alert('Versioned configuration snapshot created successfully.');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">Backup & Configuration Restore</h1>
          <p className="text-slate-400 text-sm mt-1">
            Safe versioned configuration snapshots with checksum verification and rollback protection.
          </p>
        </div>

        <button
          onClick={handleCreateBackup}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold shadow"
        >
          <DatabaseBackup className="w-4 h-4" />
          <span>Create Snapshot Now</span>
        </button>
      </div>

      <div className="border border-slate-800 rounded-2xl bg-[#0f172a]/95 overflow-hidden">
        <div className="divide-y divide-slate-800/70">
          {backups.map(b => (
            <div key={b.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-200 capitalize">{b.type.replace('_', ' ')}</span>
                  <span className="font-mono text-[10px] text-cyan-400">{b.id}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Checksum: <span className="font-mono">{b.checksum}</span> • Size: {b.size}
                </div>
                <div className="text-[10px] text-slate-500">{new Date(b.createdAt).toLocaleString()}</div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => alert(`Previewing restoration diff for snapshot ${b.id}. Zero expired credentials will be reinstated.`)}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 font-semibold"
                >
                  Preview Restore
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
