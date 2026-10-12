import React from 'react';
import { Users, Shield, Check, X, ShieldAlert, Key, BookOpen } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { initialProfiles } from '../data/initialData';
import { UserRole } from '../types';

export const UsersPermissionsPage: React.FC = () => {
  const { currentUser, setCurrentRole } = useAuthStore();

  const permissionsList = [
    { key: 'agents.create', label: 'Create New Agents' },
    { key: 'agents.edit', label: 'Edit Agent Configurations' },
    { key: 'agents.delete', label: 'Delete & Archive Agents' },
    { key: 'agents.execute', label: 'Trigger Executions & Tasks' },
    { key: 'prompts.edit', label: 'Edit System Prompts' },
    { key: 'memory.manage', label: 'Manage & Scoped Memories' },
    { key: 'secrets.manage', label: 'Manage Encrypted API Vault' },
    { key: 'integrations.manage', label: 'Connect & Edit Integrations' },
    { key: 'approvals.decide', label: 'Approve & Reject Actions' },
    { key: 'publishing.execute', label: 'Publish to Facebook Pages' },
    { key: 'users.manage', label: 'Manage Users & Roles' },
    { key: 'settings.edit', label: 'Edit Global System Settings' },
    { key: 'data.export', label: 'Export Data (JSON/CSV)' },
    { key: 'data.import', label: 'Import Configurations' }
  ];

  const roleMatrix: Record<UserRole, string[]> = {
    master_admin: permissionsList.map(p => p.key),
    admin: [
      'agents.create', 'agents.edit', 'agents.execute', 'prompts.edit',
      'memory.manage', 'integrations.manage', 'approvals.decide',
      'publishing.execute', 'settings.edit', 'data.export', 'data.import'
    ],
    operator: ['agents.execute', 'memory.manage', 'data.export'],
    reviewer: ['approvals.decide', 'data.export'],
    viewer: ['data.export']
  };

  const roles: UserRole[] = ['master_admin', 'admin', 'operator', 'reviewer', 'viewer'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">Users, Roles & RBAC Matrix</h1>
        <p className="text-slate-400 text-sm mt-1">
          Role-Based Access Control enforcing least-privilege policies on both database RLS and server API.
        </p>
      </div>

      {/* Active User Callout */}
      <div className="p-4 rounded-xl border border-slate-800 bg-[#0f172a]/90 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
        <div>
          <span className="text-slate-400">Currently Authenticated As:</span>
          <div className="font-bold text-slate-100 text-sm mt-0.5">{currentUser.fullName} ({currentUser.email})</div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-slate-400">Role:</span>
          <span className="px-3 py-1 rounded-full font-bold uppercase text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800">
            {currentUser.systemRole.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* RBAC Permission Matrix Table */}
      <div className="border border-slate-800 rounded-2xl bg-[#0f172a]/95 overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-xs font-bold uppercase text-slate-300 tracking-wider">
            Permission Matrix Across 5 System Roles
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400">
              <tr>
                <th className="p-3 pl-5">Permission Capability</th>
                {roles.map(r => (
                  <th key={r} className="p-3 text-center capitalize">{r.replace('_', ' ')}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {permissionsList.map((perm) => (
                <tr key={perm.key} className="hover:bg-slate-800/30">
                  <td className="p-3 pl-5 font-semibold text-slate-200">
                    <div>{perm.label}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{perm.key}</div>
                  </td>
                  {roles.map(r => {
                    const hasIt = roleMatrix[r].includes(perm.key);
                    return (
                      <td key={r} className="p-3 text-center">
                        {hasIt ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 text-slate-600">
                            <X className="w-3 h-3" />
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bootstrap Admin Documentation */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-3 text-xs">
        <div className="flex items-center space-x-2 text-cyan-400 font-bold">
          <BookOpen className="w-4 h-4" />
          <span>Secure Initial Administrator Bootstrap Guide</span>
        </div>
        <p className="text-slate-300 text-[11px] leading-relaxed">
          Public registration routes that grant administrator privileges are strictly prohibited. To initialize or grant Master Admin access:
        </p>
        <ol className="list-decimal pl-4 space-y-1.5 text-slate-400 text-[11px]">
          <li>Create the initial user record in Supabase Authentication Dashboard or via CLI.</li>
          <li>Assign <code>system_role = 'master_admin'</code> directly in the <code>profiles</code> table migration or SQL editor.</li>
          <li>Subsequent team members are invited by the Master Admin and assigned explicit roles (Admin, Operator, Reviewer, Viewer).</li>
        </ol>
      </div>
    </div>
  );
};
