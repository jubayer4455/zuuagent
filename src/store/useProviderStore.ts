import { create } from 'zustand';
import { AIProvider, ProviderModel } from '../types';
import { initialProviders, initialModels } from '../data/initialData';

interface ProviderState {
  providers: AIProvider[];
  models: ProviderModel[];
  
  toggleProvider: (id: string, enabled: boolean) => void;
  saveProviderApiKey: (id: string, apiKey: string) => Promise<boolean>;
  testProviderConnection: (id: string) => Promise<{ success: boolean; latencyMs: number; message: string }>;
  getModelsByProvider: (providerId: string) => ProviderModel[];
}

export const useProviderStore = create<ProviderState>((set, get) => ({
  providers: initialProviders,
  models: initialModels,

  toggleProvider: (id, enabled) => {
    set(state => ({
      providers: state.providers.map(p => 
        p.id === id ? { ...p, isEnabled: enabled } : p
      )
    }));
  },

  saveProviderApiKey: async (id, apiKey) => {
    // In production, encrypts and stores in Supabase secrets_vault.
    // Frontend only receives masked confirmation.
    set(state => ({
      providers: state.providers.map(p => 
        p.id === id ? { ...p, hasStoredKey: Boolean(apiKey), healthStatus: 'healthy', lastHealthCheck: new Date().toISOString() } : p
      )
    }));
    return true;
  },

  testProviderConnection: async (id) => {
    const provider = get().providers.find(p => p.id === id);
    if (!provider) {
      return { success: false, latencyMs: 0, message: 'Provider not found' };
    }

    try {
      const res = await fetch('http://localhost:3001/api/providers/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerSlug: provider.slug })
      });

      if (res.ok) {
        const data = await res.json();
        const isHealthy = data.status === 'verified_live';
        const isDegraded = data.status === 'missing_credentials' || data.status === 'simulated_ready';

        set(state => ({
          providers: state.providers.map(p => 
            p.id === id ? { 
              ...p, 
              healthStatus: isHealthy ? 'healthy' : isDegraded ? 'degraded' : 'offline',
              lastHealthCheck: new Date().toISOString(),
              lastError: isHealthy ? undefined : data.message
            } : p
          )
        }));

        return {
          success: isHealthy,
          latencyMs: data.latencyMs || 40,
          message: data.message
        };
      }
    } catch (_) {}

    // Fallback simulation
    const latency = 120;
    set(state => ({
      providers: state.providers.map(p => 
        p.id === id ? { ...p, healthStatus: 'degraded', lastHealthCheck: new Date().toISOString(), lastError: 'Server-side endpoint unreachable. Operating in fallback simulation mode.' } : p
      )
    }));

    return {
      success: false,
      latencyMs: latency,
      message: `${provider.name}: Server-side check offline. Fallback simulation available.`
    };
  },

  getModelsByProvider: (providerId) => {
    return get().models.filter(m => m.providerId === providerId);
  }
}));
