import React, { useState } from 'react';
import { 
  Cpu, 
  CheckCircle2, 
  AlertCircle, 
  Activity, 
  Key, 
  RefreshCw, 
  ShieldCheck, 
  ExternalLink 
} from 'lucide-react';
import { useProviderStore } from '../store/useProviderStore';
import { useAuthStore } from '../store/useAuthStore';
import { AIProvider } from '../types';

export const ProvidersPage: React.FC = () => {
  const { providers, models, toggleProvider, saveProviderApiKey, testProviderConnection } = useProviderStore();
  const { hasPermission } = useAuthStore();

  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; message: string; success: boolean } | null>(null);
  const [keyModalProvider, setKeyModalProvider] = useState<AIProvider | null>(null);
  const [newKey, setNewKey] = useState('');

  const canManageSecrets = hasPermission('secrets.manage');

  const handleTest = async (provider: AIProvider) => {
    setTestingId(provider.id);
    setTestResult(null);
    const res = await testProviderConnection(provider.id);
    setTestingId(null);
    setTestResult({ id: provider.id, message: res.message, success: res.success });
  };

  const handleSaveKey = async () => {
    if (!keyModalProvider) return;
    await saveProviderApiKey(keyModalProvider.id, newKey.trim());
    setKeyModalProvider(null);
    setNewKey('');
    alert('API Key encrypted & stored in secrets vault. Masked confirmation active.');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">
          Global AI Provider Manager
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Adapter-based provider registry supporting Google Gemini, OpenAI, Claude, Ollama, and OpenRouter.
        </p>
      </div>

      {/* Provider Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {providers.map((p) => {
          const providerModels = models.filter(m => m.providerId === p.id);

          return (
            <div
              key={p.id}
              className="border border-slate-800 rounded-xl bg-[#0f172a]/90 p-5 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-950/40 border border-violet-800/50 flex items-center justify-center text-violet-400 font-bold">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-100 text-sm">{p.name}</h3>
                      <span className="font-mono text-[10px] text-cyan-400 capitalize">{p.adapterType} adapter</span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    p.healthStatus === 'healthy' 
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                      : p.healthStatus === 'offline'
                      ? 'bg-rose-950 text-rose-400 border border-rose-800'
                      : 'bg-amber-950 text-amber-400 border border-amber-800'
                  }`}>
                    {p.healthStatus}
                  </span>
                </div>

                {/* Capabilities */}
                <div className="flex flex-wrap gap-1 text-[10px]">
                  {p.supportsText && <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">Text</span>}
                  {p.supportsVision && <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">Vision</span>}
                  {p.supportsImageGen && <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">Image Gen</span>}
                  {p.supportsEmbeddings && <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">Embeddings</span>}
                </div>

                {/* Models List */}
                <div className="pt-2 border-t border-slate-800 text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Available Models:</span>
                  <div className="mt-1 space-y-0.5">
                    {providerModels.map(m => (
                      <div key={m.id} className="text-slate-300 font-mono text-[11px] flex items-center justify-between">
                        <span>{m.displayName}</span>
                        <span className="text-slate-500 text-[10px]">${m.inputCostPerMillionTokens}/1M tok</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Status */}
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 text-[11px] flex items-center justify-between">
                  <span className="text-slate-400">API Key Vault:</span>
                  <span className={`font-mono font-semibold ${p.hasStoredKey ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {p.hasStoredKey ? '•••••••••••• (Encrypted)' : 'Not Configured (Using Sim)'}
                  </span>
                </div>

                {testResult?.id === p.id && (
                  <div className={`p-2 rounded text-[10px] ${testResult.success ? 'bg-emerald-950/80 text-emerald-300' : 'bg-rose-950/80 text-rose-300'}`}>
                    {testResult.message}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                <button
                  onClick={() => handleTest(p)}
                  disabled={testingId === p.id}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition font-medium"
                >
                  <RefreshCw className={`w-3 h-3 ${testingId === p.id ? 'animate-spin' : ''}`} />
                  <span>Test Link</span>
                </button>

                <div className="flex items-center space-x-2">
                  {canManageSecrets && (
                    <button
                      onClick={() => setKeyModalProvider(p)}
                      className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 transition font-medium"
                      title="Set / Update Encrypted Secret"
                    >
                      <Key className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => toggleProvider(p.id, !p.isEnabled)}
                    className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
                      p.isEnabled ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {p.isEnabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Secret Vault Modal */}
      {keyModalProvider && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-slate-100 text-base">
              Set API Secret: {keyModalProvider.name}
            </h3>
            <p className="text-xs text-slate-400">
              Key is encrypted via server-side pgcrypto vault. Raw keys are never returned to client browsers.
            </p>

            <input
              type="password"
              placeholder="Paste provider API key..."
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            />

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setKeyModalProvider(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveKey}
                className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold"
              >
                Store Encrypted Secret
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
