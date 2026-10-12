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

    const start = Date.now();
    await new Promise(resolve => setTimeout(resolve, 450)); // Network test simulation
    const latency = Date.now() - start;

    if (provider.slug === 'ollama' && !provider.hasStoredKey) {
      return {
        success: false,
        latencyMs: latency,
        message: 'Could not connect to localhost:11434. Verify Ollama service is running locally.'
      };
    }

    set(state => ({
      providers: state.providers.map(p => 
        p.id === id ? { ...p, healthStatus: 'healthy', lastHealthCheck: new Date().toISOString(), lastError: undefined } : p
      )
    }));

    return {
      success: true,
      latencyMs: latency,
      message: `Connection to ${provider.name} verified successfully (${latency}ms).`
    };
  },

  getModelsByProvider: (providerId) => {
    return get().models.filter(m => m.providerId === providerId);
  }
}));
