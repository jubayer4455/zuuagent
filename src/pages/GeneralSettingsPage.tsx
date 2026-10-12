import React, { useState } from 'react';
import { Settings, Save, Key, ShieldCheck, Database, ExternalLink, BookOpen, AlertCircle } from 'lucide-react';
import { getDatabaseConnectionInfo } from '../services/supabase';
import { useSystemStore } from '../store/useSystemStore';

export const GeneralSettingsPage: React.FC = () => {
  const dbInfo = getDatabaseConnectionInfo();
  const { isDryRunGlobal, setDryRunGlobal } = useSystemStore();

  const [platformName, setPlatformName] = useState('Zuu Agent');
  const [defaultTimezone, setDefaultTimezone] = useState('Asia/Dhaka');
  const [logRetentionDays, setLogRetentionDays] = useState(30);

  const handleSave = () => {
    alert('General platform settings updated.');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">General Platform Settings</h1>
          <p className="text-slate-400 text-sm mt-1">
            Core environment variables, database synchronization, timezone conventions, and deployment specifications.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold shadow"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* Basic Brand & Operational Defaults */}
        <div className="border border-slate-800 rounded-2xl bg-[#0f172a]/95 p-6 space-y-4">
          <h2 className="text-xs font-bold uppercase text-slate-300 tracking-wider">
            Instance Branding & Schedule Defaults
          </h2>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Platform Brand Name</label>
            <input
              type="text"
              value={platformName}
              onChange={(e) => setPlatformName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Default Scheduler Timezone</label>
            <select
              value={defaultTimezone}
              onChange={(e) => setDefaultTimezone(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none"
            >
              <option value="Asia/Dhaka">Asia/Dhaka (GMT+6 - Default for Bangladesh)</option>
              <option value="UTC">UTC (Coordinated Universal Time)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Audit Log Retention (Days)</label>
            <input
              type="number"
              value={logRetentionDays}
              onChange={(e) => setLogRetentionDays(parseInt(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-start space-x-3">
            <input
              type="checkbox"
              id="dryRunGlobal"
              checked={isDryRunGlobal}
              onChange={(e) => setDryRunGlobal(e.target.checked)}
              className="mt-0.5 rounded bg-slate-900 border-slate-800 text-cyan-500"
            />
            <label htmlFor="dryRunGlobal" className="text-slate-300 cursor-pointer">
              <span className="font-bold text-slate-100">Global Dry-Run Simulation Mode:</span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Forces all AI generation and publishing tools to execute in simulated sandbox mode.
              </p>
            </label>
          </div>
        </div>

        {/* Database & Environment Variables */}
        <div className="border border-slate-800 rounded-2xl bg-[#0f172a]/95 p-6 space-y-4">
          <h2 className="text-xs font-bold uppercase text-slate-300 tracking-wider">
            Supabase PostgreSQL Connection
          </h2>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 font-mono text-[11px]">
            <div>Active Mode: <strong className="text-cyan-400">{dbInfo.mode}</strong></div>
            <div className="truncate">URL: <span className="text-slate-300">{dbInfo.url}</span></div>
          </div>

          <p className="text-slate-400 leading-relaxed text-[11px]">
            To connect a live cloud database, add your Supabase credentials in your <code>.env</code> file:
          </p>

          <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400 font-mono text-[11px] overflow-x-auto">
{`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...`}
          </pre>
        </div>
      </div>

      {/* Free Tier Limitations & Architecture Boundaries */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-3 text-xs">
        <div className="flex items-center space-x-2 text-cyan-400 font-bold">
          <BookOpen className="w-4 h-4" />
          <span>Deployment Architecture & Free-Tier Operational Guidelines</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 text-[11px]">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="font-bold text-slate-200">Supabase Free Tier</span>
            <p className="text-slate-400">
              500 MB database storage, 50,000 monthly active users, 1 GB file storage. Runs smoothly within bounds with periodic vacuum and log retention limits.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="font-bold text-slate-200">Vercel Serverless Limits</span>
            <p className="text-slate-400">
              Functions have 10-second default timeouts on hobby tier. Long-running research workflows should leverage chunked step runs or scheduled batch jobs.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="font-bold text-slate-200">Meta Graph API</span>
            <p className="text-slate-400">
              Standard tier allows generous publishing quotas for Facebook Pages with valid never-expiring page access tokens.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
