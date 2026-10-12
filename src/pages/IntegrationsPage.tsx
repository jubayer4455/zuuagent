import React, { useState } from 'react';
import { 
  Share2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ShieldCheck, 
  ExternalLink,
  BookOpen,
  Info
} from 'lucide-react';
import { useIntegrationStore } from '../store/useIntegrationStore';

export const IntegrationsPage: React.FC = () => {
  const { integrations, testFacebookConnection, toggleDryRunSimulation, updatePageSettings } = useIntegrationStore();

  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; message: string; scopes: string[] } | null>(null);

  const fbConn = integrations.find(i => i.provider === 'meta_facebook') || integrations[0];

  const handleTestLink = async (connId: string) => {
    setTestingId(connId);
    setTestResult(null);
    const res = await testFacebookConnection(connId);
    setTestingId(null);
    setTestResult({ id: connId, message: res.message, scopes: res.scopes });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">
          Global API & Integration Manager
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage authorized external API connections, token permissions, and official Meta Graph API publishing.
        </p>
      </div>

      {/* Primary Integration: Meta Graph API (Facebook Page Publishing) */}
      {fbConn && (
        <div className="border border-slate-800 rounded-2xl bg-[#0f172a]/95 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-xl bg-blue-950/60 border border-blue-800/60 flex items-center justify-center text-blue-400 font-bold">
                <Share2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-bold text-slate-100">{fbConn.displayName}</h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-800">
                    {fbConn.connectionStatus}
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  Page ID: {fbConn.accountIdentifier} • Meta Graph API v21.0
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleTestLink(fbConn.id)}
                disabled={testingId === fbConn.id}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingId === fbConn.id ? 'animate-spin' : ''}`} />
                <span>Verify Token & Scopes</span>
              </button>
            </div>
          </div>

          {/* Test verification feedback */}
          {testResult?.id === fbConn.id && (
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 space-y-1">
              <div className="font-bold flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{testResult.message}</span>
              </div>
              <div className="text-[11px] text-emerald-400/80">
                Verified Meta Permission Scopes: {testResult.scopes.join(', ')}
              </div>
            </div>
          )}

          {/* Configuration Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="font-semibold text-slate-400 uppercase text-[10px]">Granted Meta OAuth Scopes</span>
              <div className="space-y-1 text-slate-300 font-mono text-[11px]">
                {fbConn.grantedScopes.map(sc => (
                  <div key={sc} className="flex items-center space-x-1.5">
                    <span className="text-emerald-400">✓</span>
                    <span>{sc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="font-semibold text-slate-400 uppercase text-[10px]">Assigned Agent</span>
              <div className="text-slate-200 font-bold">Trollogiya Content Agent</div>
              <p className="text-[11px] text-slate-400">
                Authorized to dispatch automated feed posts and generate photo captions through idempotency keys.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="font-semibold text-slate-400 uppercase text-[10px]">Publishing Safety Mode</span>
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-300">Dry-Run Simulation:</span>
                <button
                  onClick={() => toggleDryRunSimulation(fbConn.id, !fbConn.settings?.dryRunSimulation)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition ${
                    fbConn.settings?.dryRunSimulation 
                      ? 'bg-amber-950 text-amber-400 border border-amber-800' 
                      : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  }`}
                >
                  {fbConn.settings?.dryRunSimulation ? 'Active (Safe)' : 'Live Meta Posts'}
                </button>
              </div>
              <p className="text-[10px] text-slate-500">
                In dry-run mode, publishing requests generate trace payloads without pinging Meta servers.
              </p>
            </div>
          </div>

          {/* Meta Developer Configuration Guide */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3 text-xs">
            <div className="flex items-center space-x-2 text-cyan-400 font-bold">
              <BookOpen className="w-4 h-4" />
              <span>Meta Graph API Integration & Live Publishing Guide</span>
            </div>
            <ol className="list-decimal pl-4 space-y-2 text-slate-300 text-[11px] leading-relaxed">
              <li>
                <strong>Create Meta App:</strong> Go to <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="text-cyan-400 underline">developers.facebook.com</a> and create a "Business" type app.
              </li>
              <li>
                <strong>Add Permissions:</strong> Add <code>pages_manage_posts</code>, <code>pages_read_engagement</code>, and <code>pages_show_list</code> permissions in App Review / Graph API Explorer.
              </li>
              <li>
                <strong>Generate Page Access Token:</strong> Use the Graph API Explorer to generate a user token, then exchange it for a permanent <em>Never-Expiring Page Access Token</em>.
              </li>
              <li>
                <strong>Store in Environment / Vault:</strong> Set <code>FB_PAGE_ACCESS_TOKEN</code> and <code>FB_PAGE_ID</code> in server environment or secrets vault.
              </li>
              <li>
                <strong>Duplicate Protection:</strong> Zuu Agent automatically generates an <code>idempotency_key</code> for every publication to guarantee posts are never duplicated upon network retries.
              </li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};
