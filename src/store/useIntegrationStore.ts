import { create } from 'zustand';
import { IntegrationConnection } from '../types';
import { initialIntegrations } from '../data/initialData';
import { MetaGraphClient } from '../services/facebook/metaGraphClient';

const LOCAL_STORAGE_INTEGRATIONS_KEY = 'zuu_integration_credentials_v2';

interface IntegrationState {
  integrations: IntegrationConnection[];
  isVerifying: boolean;

  testFacebookConnection: (integrationId: string, pageIdOverride?: string, tokenOverride?: string) => Promise<{ success: boolean; scopes: string[]; message: string; details?: any }>;
  saveFacebookCredentials: (integrationId: string, pageId: string, pageAccessToken: string, pageName?: string, appSecret?: string) => Promise<{ success: boolean; message: string }>;
  toggleDryRunSimulation: (integrationId: string, enabled: boolean) => void;
  updatePageSettings: (integrationId: string, pageId: string, pageName: string) => void;
  disconnectIntegration: (integrationId: string) => void;
}

function loadInitialIntegrations(): IntegrationConnection[] {
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_INTEGRATIONS_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) {}
  return initialIntegrations;
}

export const useIntegrationStore = create<IntegrationState>((set, get) => ({
  integrations: loadInitialIntegrations(),
  isVerifying: false,

  testFacebookConnection: async (integrationId, pageIdOverride, tokenOverride) => {
    set({ isVerifying: true });
    const conn = get().integrations.find(i => i.id === integrationId) || get().integrations[0];
    const targetPageId = pageIdOverride || conn?.accountIdentifier || '109847291834910';
    const targetToken = tokenOverride || conn?.settings?.pageAccessToken || '';

    const verification = await MetaGraphClient.verifyPageToken(targetPageId, targetToken);
    set({ isVerifying: false });

    if (verification.valid) {
      const updated = get().integrations.map(i => 
        i.id === integrationId 
          ? { 
              ...i, 
              accountIdentifier: targetPageId,
              displayName: verification.details?.pageName || i.displayName,
              connectionStatus: 'connected' as const, 
              grantedScopes: verification.scopes,
              lastVerifiedAt: new Date().toISOString(), 
              lastError: undefined,
              settings: {
                ...i.settings,
                pageAccessToken: targetToken || i.settings?.pageAccessToken,
                pageName: verification.details?.pageName || i.settings?.pageName,
                hasConfiguredToken: Boolean(targetToken || i.settings?.pageAccessToken)
              }
            } 
          : i
      );

      set({ integrations: updated });
      try {
        localStorage.setItem(LOCAL_STORAGE_INTEGRATIONS_KEY, JSON.stringify(updated));
      } catch (_) {}

      return {
        success: true,
        scopes: verification.scopes,
        message: verification.details?.message || 'Meta Graph API connection verified! Page permissions active.',
        details: verification.details
      };
    } else {
      set(state => ({
        integrations: state.integrations.map(i => 
          i.id === integrationId 
            ? { ...i, connectionStatus: 'error' as const, lastError: verification.errorMessage } 
            : i
        )
      }));

      return {
        success: false,
        scopes: [],
        message: verification.errorMessage || 'Failed to verify Facebook Page connection.',
        details: verification.details
      };
    }
  },

  saveFacebookCredentials: async (integrationId, pageId, pageAccessToken, pageName, appSecret) => {
    set({ isVerifying: true });

    // Test token live before persisting
    const verification = await MetaGraphClient.verifyPageToken(pageId, pageAccessToken);
    set({ isVerifying: false });

    const updated = get().integrations.map(i => {
      if (i.id !== integrationId && i.provider !== 'meta_facebook') return i;
      return {
        ...i,
        accountIdentifier: pageId,
        displayName: pageName || verification.details?.pageName || i.displayName,
        connectionStatus: verification.valid ? ('connected' as const) : ('error' as const),
        grantedScopes: verification.scopes || ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list'],
        lastVerifiedAt: new Date().toISOString(),
        lastError: verification.valid ? undefined : verification.errorMessage,
        settings: {
          ...i.settings,
          pageAccessToken: pageAccessToken || i.settings?.pageAccessToken,
          pageName: pageName || verification.details?.pageName,
          hasConfiguredToken: Boolean(pageAccessToken || i.settings?.pageAccessToken),
          dryRunSimulation: false // User connected real credentials, ready for live or safe use
        }
      };
    });

    set({ integrations: updated });
    try {
      localStorage.setItem(LOCAL_STORAGE_INTEGRATIONS_KEY, JSON.stringify(updated));
    } catch (_) {}

    return {
      success: verification.valid,
      message: verification.valid 
        ? `Successfully connected & verified Facebook Page "${pageName || pageId}"!` 
        : `Credentials saved, but verification failed: ${verification.errorMessage}`
    };
  },

  toggleDryRunSimulation: (integrationId, enabled) => {
    const updated = get().integrations.map(i => 
      i.id === integrationId 
        ? { ...i, settings: { ...i.settings, dryRunSimulation: enabled } } 
        : i
    );
    set({ integrations: updated });
    try {
      localStorage.setItem(LOCAL_STORAGE_INTEGRATIONS_KEY, JSON.stringify(updated));
    } catch (_) {}
  },

  updatePageSettings: (integrationId, pageId, pageName) => {
    const updated = get().integrations.map(i => 
      i.id === integrationId 
        ? { 
            ...i, 
            accountIdentifier: pageId, 
            settings: { ...i.settings, pageName },
            lastVerifiedAt: new Date().toISOString()
          } 
        : i
    );
    set({ integrations: updated });
    try {
      localStorage.setItem(LOCAL_STORAGE_INTEGRATIONS_KEY, JSON.stringify(updated));
    } catch (_) {}
  },

  disconnectIntegration: (integrationId) => {
    const updated = get().integrations.map(i => 
      i.id === integrationId ? { ...i, connectionStatus: 'disconnected' as const, settings: { ...i.settings, hasConfiguredToken: false } } : i
    );
    set({ integrations: updated });
    try {
      localStorage.setItem(LOCAL_STORAGE_INTEGRATIONS_KEY, JSON.stringify(updated));
    } catch (_) {}
  }
}));
