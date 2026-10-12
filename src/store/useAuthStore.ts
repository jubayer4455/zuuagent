// ==============================================================================
// Zuu Agent — Authentication & RBAC Store
// Integrates with Supabase Auth session, first-admin bootstrap API, and RBAC matrix.
// ==============================================================================

import { create } from 'zustand';
import { UserProfile, UserRole } from '../types';
import { initialProfiles } from '../data/initialData';
import { supabase, isSupabaseConfigured } from '../services/supabase';

export type Permission = 
  | 'agents.create'
  | 'agents.edit'
  | 'agents.delete'
  | 'agents.execute'
  | 'prompts.edit'
  | 'memory.manage'
  | 'secrets.manage'
  | 'integrations.manage'
  | 'approvals.decide'
  | 'publishing.execute'
  | 'users.manage'
  | 'settings.edit'
  | 'data.export'
  | 'data.import';

// Role permission matrix (least-privilege model)
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  master_admin: [
    'agents.create', 'agents.edit', 'agents.delete', 'agents.execute',
    'prompts.edit', 'memory.manage', 'secrets.manage', 'integrations.manage',
    'approvals.decide', 'publishing.execute', 'users.manage', 'settings.edit',
    'data.export', 'data.import'
  ],
  admin: [
    'agents.create', 'agents.edit', 'agents.execute',
    'prompts.edit', 'memory.manage', 'integrations.manage',
    'approvals.decide', 'publishing.execute', 'settings.edit',
    'data.export', 'data.import'
  ],
  operator: [
    'agents.execute', 'memory.manage', 'data.export'
  ],
  reviewer: [
    'approvals.decide', 'data.export'
  ],
  viewer: [
    'data.export'
  ]
};

interface AuthState {
  currentUser: UserProfile;
  availableProfiles: UserProfile[];
  isAuthenticated: boolean;
  needsBootstrap: boolean;
  isLoading: boolean;
  authError: string | null;

  // Actions
  initAuthSession: () => Promise<void>;
  checkBootstrapStatus: () => Promise<boolean>;
  bootstrapMasterAdmin: (email: string, pass: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  setCurrentRole: (role: UserRole) => void;
  hasPermission: (permission: Permission) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: initialProfiles[0], // Defaults to Master Administrator in local/dev mode
  availableProfiles: initialProfiles,
  isAuthenticated: true,
  needsBootstrap: false,
  isLoading: false,
  authError: null,

  initAuthSession: async () => {
    // Check first-admin bootstrap requirement
    await get().checkBootstrapStatus();

    // If Supabase is configured, listen to active session
    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      try {
        const { data: { session } } = await client.auth.getSession();
        if (session?.user) {
          // Fetch user profile from public.profiles
          const { data: profile } = await client
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            set({
              isAuthenticated: true,
              currentUser: {
                id: profile.id,
                email: profile.email,
                fullName: profile.full_name || 'Master Administrator',
                systemRole: profile.system_role as UserRole,
                isActive: profile.is_active,
                avatarUrl: profile.avatar_url,
                createdAt: profile.created_at
              }
            });
          }
        }

        // Subscribe to auth state changes
        client.auth.onAuthStateChange(async (event, session) => {
          if (session?.user) {
            const { data: profile } = await client
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profile) {
              set({
                isAuthenticated: true,
                currentUser: {
                  id: profile.id,
                  email: profile.email,
                  fullName: profile.full_name || 'Administrator',
                  systemRole: profile.system_role as UserRole,
                  isActive: profile.is_active,
                  avatarUrl: profile.avatar_url,
                  createdAt: profile.created_at
                }
              });
            }
          } else if (event === 'SIGNED_OUT') {
            set({
              isAuthenticated: false,
              currentUser: {
                id: 'guest',
                email: 'guest@zuuagent.local',
                fullName: 'Guest User',
                systemRole: 'viewer',
                isActive: true,
                createdAt: new Date().toISOString()
              }
            });
          }
        });
      } catch (e) {
        console.warn('[useAuthStore] Session initialization error:', e);
      }
    }
  },

  checkBootstrapStatus: async () => {
    try {
      const res = await fetch('http://localhost:3001/api/auth/bootstrap');
      if (res.ok) {
        const data = await res.json();
        set({ needsBootstrap: Boolean(data.needsBootstrap) });
        return Boolean(data.needsBootstrap);
      }
    } catch (_) {}
    return false;
  },

  bootstrapMasterAdmin: async (email, pass, name) => {
    set({ isLoading: true, authError: null });
    try {
      const res = await fetch('http://localhost:3001/api/auth/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass, fullName: name })
      });
      const data = await res.json();

      if (!res.ok) {
        set({ isLoading: false, authError: data.error || 'Bootstrap failed.' });
        return { success: false, error: data.error || 'Bootstrap failed.' };
      }

      set({ needsBootstrap: false, isLoading: false });
      // Automatically attempt sign in
      return await get().signIn(email, pass);
    } catch (e: any) {
      set({ isLoading: false, authError: e.message });
      return { success: false, error: e.message };
    }
  },

  signIn: async (email, pass) => {
    set({ isLoading: true, authError: null });
    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      try {
        const { data, error } = await client.auth.signInWithPassword({
          email,
          password: pass
        });

        if (error) {
          set({ isLoading: false, authError: error.message });
          return { success: false, error: error.message };
        }

        if (data.user) {
          const { data: profile } = await client
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profile) {
            set({
              isAuthenticated: true,
              currentUser: {
                id: profile.id,
                email: profile.email,
                fullName: profile.full_name || 'Master Administrator',
                systemRole: profile.system_role as UserRole,
                isActive: profile.is_active,
                avatarUrl: profile.avatar_url,
                createdAt: profile.created_at
              },
              isLoading: false
            });
            return { success: true };
          }
        }
      } catch (err: any) {
        set({ isLoading: false, authError: err.message });
        return { success: false, error: err.message };
      }
    }

    // Local / Dev simulated login
    const found = initialProfiles.find(p => p.email.toLowerCase() === email.toLowerCase()) || initialProfiles[0];
    set({
      isAuthenticated: true,
      currentUser: found,
      isLoading: false
    });
    return { success: true };
  },

  signOut: async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (_) {}
    }
    set({
      isAuthenticated: false,
      currentUser: {
        id: 'guest',
        email: 'guest@zuuagent.local',
        fullName: 'Logged Out',
        systemRole: 'viewer',
        isActive: true,
        createdAt: new Date().toISOString()
      }
    });
  },

  setCurrentRole: (role: UserRole) => {
    const profile = initialProfiles.find(p => p.systemRole === role) || {
      ...initialProfiles[0],
      systemRole: role,
      fullName: `${role.replace('_', ' ').toUpperCase()} User`
    };
    set({ currentUser: profile });
  },

  hasPermission: (permission: Permission) => {
    const { currentUser } = get();
    const permissions = ROLE_PERMISSIONS[currentUser.systemRole] || [];
    return permissions.includes(permission);
  }
}));

// Auto-initialize auth on window startup
if (typeof window !== 'undefined') {
  useAuthStore.getState().initAuthSession();
}
