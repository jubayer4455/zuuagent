import { create } from 'zustand';
import { IntegrationConnection } from '../types';
import { initialIntegrations } from '../data/initialData';
import { MetaGraphClient } from '../services/facebook/metaGraphClient';

interface IntegrationState {
  integrations: IntegrationConnection[];
  isVerifying: boolean;

  testFacebookConnection: (integrationId: string) => Promise<{ success: boolean; scopes: string[]; message: string }>;
  toggleDryRunSimulation: (integrationId: string, enabled: boolean) => void;
  updatePageSettings: (integrationId: string, pageId: string, pageName: string) => void;
  disconnectIntegration: (integrationId: string) => void;
}

export const useIntegrationStore = create<IntegrationState>((set, get) => ({
  integrations: initialIntegrations,
  isVerifying: false,

  testFacebookConnection: async (integrationId) => {
    set({ isVerifying: true });
    const conn = get().integrations.find(i => i.id === integrationId);
    if (!conn) {
      set({ isVerifying: false });
      return { success: false, scopes: [], message: 'Integration not found.' };
    }

    const verification = await MetaGraphClient.verifyPageToken(conn.accountIdentifier, 'mock_token');
    set({ isVerifying: false });

    if (verification.valid) {
      set(state => ({
        integrations: state.integrations.map(i => 
          i.id === integrationId 
            ? { ...i, connectionStatus: 'connected', lastVerifiedAt: new Date().toISOString(), lastError: undefined } 
            : i
        )
      }));

      return {
        success: true,
        scopes: verification.scopes,
        message: 'Meta Graph API connection verified. Page permissions are active.'
      };
    } else {
      set(state => ({
        integrations: state.integrations.map(i => 
          i.id === integrationId 
            ? { ...i, connectionStatus: 'error', lastError: verification.errorMessage } 
            : i
        )
      }));

      return {
        success: false,
        scopes: [],
        message: verification.errorMessage || 'Failed to verify Facebook Page connection.'
      };
    }
  },

  toggleDryRunSimulation: (integrationId, enabled) => {
    set(state => ({
      integrations: state.integrations.map(i => 
        i.id === integrationId 
          ? { ...i, settings: { ...i.settings, dryRunSimulation: enabled } } 
          : i
      )
    }));
  },

  updatePageSettings: (integrationId, pageId, pageName) => {
    set(state => ({
      integrations: state.integrations.map(i => 
        i.id === integrationId 
          ? { 
              ...i, 
              accountIdentifier: pageId, 
              settings: { ...i.settings, pageName },
              lastVerifiedAt: new Date().toISOString()
            } 
          : i
      )
    }));
  },

  disconnectIntegration: (integrationId) => {
    set(state => ({
      integrations: state.integrations.map(i => 
        i.id === integrationId ? { ...i, connectionStatus: 'disconnected' } : i
      )
    }));
  }
}));
