import { create } from 'zustand';
import { UserProfile, UserRole } from '../types';
import { initialProfiles } from '../data/initialData';

interface AuthState {
  currentUser: UserProfile;
  availableProfiles: UserProfile[];
  setCurrentRole: (role: UserRole) => void;
  // RBAC Permission checks
  hasPermission: (permission: Permission) => boolean;
}

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

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: initialProfiles[0], // Defaults to Master Administrator
  availableProfiles: initialProfiles,

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
