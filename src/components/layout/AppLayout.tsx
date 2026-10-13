import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Bot, 
  PlusCircle, 
  Sparkles, 
  Store, 
  PlayCircle, 
  GitFork, 
  Cpu, 
  Share2, 
  BrainCircuit, 
  BookOpen, 
  Terminal, 
  Wrench, 
  Clock, 
  CheckSquare, 
  Calendar, 
  Bell, 
  BarChart3, 
  FileText, 
  Activity, 
  Coins, 
  Users, 
  ShieldAlert, 
  DatabaseBackup, 
  DownloadCloud, 
  Settings, 
  Menu, 
  X, 
  Search, 
  Sun, 
  Moon, 
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { useAuthStore, Permission } from '../../store/useAuthStore';
import { useSystemStore } from '../../store/useSystemStore';
import { useApprovalStore } from '../../store/useApprovalStore';
import { UserRole } from '../../types';
import { AuthModal } from '../auth/AuthModal';

interface NavItem {
  id: string;
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: Permission;
  badge?: () => number | string | null;
}

interface NavGroup {
  groupName: string;
  items: NavItem[];
}

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const { currentUser, setCurrentRole, hasPermission, needsBootstrap, signOut } = useAuthStore();
  const { theme, toggleTheme, isDryRunGlobal, setDryRunGlobal, notifications, markNotificationAsRead } = useSystemStore();
  const { approvals } = useApprovalStore();
  const navigate = useNavigate();

  const pendingApprovalsCount = approvals.filter(a => a.status === 'pending').length;
  const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;

  const navigationGroups: NavGroup[] = [
    {
      groupName: 'Core Operations',
      items: [
        { id: 'overview', name: 'Overview', path: '/', icon: LayoutDashboard },
        { id: 'agents', name: 'All Agents', path: '/agents', icon: Bot },
        { id: 'create-agent', name: 'Create New Agent', path: '/agents/new', icon: PlusCircle, permission: 'agents.create' },
        { id: 'templates', name: 'Agent Templates', path: '/templates', icon: Sparkles },
        { id: 'marketplace', name: 'Agent Marketplace', path: '/marketplace', icon: Store }
      ]
    },
    {
      groupName: 'Execution & Orchestration',
      items: [
        { id: 'tasks', name: 'Tasks & Executions', path: '/tasks', icon: PlayCircle },
        { id: 'workflow-builder', name: 'Workflow Builder', path: '/workflows', icon: GitFork },
        { id: 'schedules', name: 'Schedules & Triggers', path: '/schedules', icon: Clock },
        { 
          id: 'approvals', 
          name: 'Approval Center', 
          path: '/approvals', 
          icon: CheckSquare, 
          permission: 'approvals.decide',
          badge: () => pendingApprovalsCount > 0 ? pendingApprovalsCount : null 
        },
        { 
          id: 'content-calendar', 
          name: 'Content Calendar & Studio', 
          path: '/content-calendar', 
          icon: Calendar 
        }
      ]
    },
    {
      groupName: 'AI & Tools Engine',
      items: [
        { id: 'providers', name: 'Global AI Providers', path: '/providers', icon: Cpu },
        { id: 'integrations', name: 'API & Integrations', path: '/integrations', icon: Share2, permission: 'integrations.manage' },
        { id: 'tools', name: 'Tool Registry', path: '/tools', icon: Wrench },
        { id: 'prompts', name: 'Prompt Library', path: '/prompts', icon: Terminal, permission: 'prompts.edit' }
      ]
    },
    {
      groupName: 'Memory & Intelligence',
      items: [
        { id: 'memory', name: 'Memory Center', path: '/memory', icon: BrainCircuit, permission: 'memory.manage' },
        { id: 'knowledge', name: 'Knowledge Base', path: '/knowledge', icon: BookOpen }
      ]
    },
    {
      groupName: 'Observability & Monitoring',
      items: [
        { id: 'analytics', name: 'Analytics', path: '/analytics', icon: BarChart3 },
        { id: 'logs', name: 'Execution Logs', path: '/logs', icon: FileText },
        { id: 'system-health', name: 'System Health', path: '/health', icon: Activity },
        { id: 'usage-costs', name: 'Usage & Cost Controls', path: '/usage-costs', icon: Coins }
      ]
    },
    {
      groupName: 'Governance & Settings',
      items: [
        { id: 'users', name: 'Users & Permissions', path: '/users', icon: Users, permission: 'users.manage' },
        { id: 'security-audit', name: 'Security & Audit Logs', path: '/audit-logs', icon: ShieldAlert },
        { id: 'backup-restore', name: 'Backup & Restore', path: '/backup-restore', permission: 'settings.edit', icon: DatabaseBackup },
        { id: 'import-export', name: 'Import and Export', path: '/import-export', icon: DownloadCloud, permission: 'data.export' },
        { id: 'general-settings', name: 'General Settings', path: '/settings', icon: Settings, permission: 'settings.edit' }
      ]
    }
  ];

  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    setRoleSwitcherOpen(false);
  };

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'bg-[#0a0f1d] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* First Admin Bootstrap Required Banner */}
      {needsBootstrap && (
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 px-4 py-2 text-xs font-semibold text-white flex items-center justify-between shadow-md z-50">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0 animate-bounce" />
            <span>First-Time Setup: No Master Administrator configured yet. Initialize your master admin account.</span>
          </div>
          <button 
            onClick={() => setAuthModalOpen(true)}
            className="px-3 py-1 bg-white text-orange-700 font-bold rounded-lg text-xs hover:bg-orange-50 transition shadow"
          >
            Bootstrap Admin Now
          </button>
        </div>
      )}

      {/* Top Application Bar */}
      <header className={`h-16 border-b flex items-center justify-between px-4 sticky top-0 z-40 backdrop-blur-md ${
        theme === 'dark' ? 'bg-[#0f172a]/90 border-slate-800' : 'bg-white/90 border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => navigate('/')}>
            <img src="/logo.svg" alt="Zuu Agent" className="w-8 h-8 rounded-lg shadow-sm" />
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 bg-clip-text text-transparent">
                Zuu Agent
              </span>
              <span className="hidden sm:inline-block ml-2 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
                Universal Core v2.0
              </span>
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center space-x-3">
          {/* Dry Run Indicator */}
          <div className="hidden md:flex items-center px-3 py-1 rounded-full border text-xs font-medium space-x-2 bg-slate-900/60 border-slate-700/80">
            <span className={`w-2 h-2 rounded-full ${isDryRunGlobal ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></span>
            <span className="text-slate-300">
              {isDryRunGlobal ? 'Dry-Run Simulation Active' : 'Live Engine Mode'}
            </span>
            <button 
              onClick={() => setDryRunGlobal(!isDryRunGlobal)}
              className="text-[11px] underline text-cyan-400 hover:text-cyan-300 ml-1"
            >
              Toggle
            </button>
          </div>

          {/* Role Switcher (RBAC verification tool) */}
          <div className="relative">
            <button 
              onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-semibold bg-slate-800/80 border-slate-700 hover:border-cyan-500/50 transition"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span className="capitalize">{currentUser.systemRole.replace('_', ' ')}</span>
            </button>

            {roleSwitcherOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-2xl py-2 z-50 border bg-slate-900 border-slate-800 text-slate-200">
                <div className="px-3 py-1.5 text-[11px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-800">
                  Switch Active Role (RBAC Simulator)
                </div>
                {(['master_admin', 'admin', 'operator', 'reviewer', 'viewer'] as UserRole[]).map((role) => (
                  <button
                    key={role}
                    onClick={() => handleRoleChange(role)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 ${
                      currentUser.systemRole === role ? 'text-cyan-400 font-bold bg-slate-800/50' : 'text-slate-300'
                    }`}
                  >
                    <span className="capitalize">{role.replace('_', ' ')}</span>
                    {currentUser.systemRole === role && <span className="text-cyan-400">✓</span>}
                  </button>
                ))}
                <div className="border-t border-slate-800 pt-1 mt-1">
                  <button
                    onClick={() => { setAuthModalOpen(true); setRoleSwitcherOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-cyan-400 font-medium hover:bg-slate-800 transition"
                  >
                    🔑 Auth Setup / Sign In
                  </button>
                  <button
                    onClick={() => { signOut(); setRoleSwitcherOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-rose-400 font-medium hover:bg-slate-800 transition"
                  >
                    🚪 Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 relative transition"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500"></span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl shadow-2xl py-2 z-50 border bg-slate-900 border-slate-800 text-slate-200">
                <div className="px-3 py-1.5 flex items-center justify-between border-b border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Notifications</span>
                  <span className="text-[10px] text-cyan-400 font-medium">{unreadNotificationsCount} unread</span>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-xs text-center text-slate-500">No notifications</div>
                  ) : (
                    notifications.map(n => (
                      <div 
                        key={n.id} 
                        onClick={() => markNotificationAsRead(n.id)}
                        className={`p-3 text-xs hover:bg-slate-800/60 cursor-pointer ${!n.isRead ? 'bg-cyan-950/20' : ''}`}
                      >
                        <div className="font-semibold text-slate-200">{n.title}</div>
                        <div className="text-slate-400 text-[11px] mt-0.5">{n.message}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Theme Switcher */}
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Toggle Dark/Light Mode"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar (All 25 Sections) */}
        <aside className={`${
          sidebarOpen ? 'w-64' : 'w-16'
        } shrink-0 border-r flex flex-col transition-all duration-200 ${
          theme === 'dark' ? 'bg-[#0b1021] border-slate-800' : 'bg-white border-slate-200'
        } overflow-y-auto`}>
          <div className="py-3 space-y-6">
            {navigationGroups.map((group) => (
              <div key={group.groupName} className="px-2">
                {sidebarOpen && (
                  <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {group.groupName}
                  </div>
                )}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isPermitted = !item.permission || hasPermission(item.permission);
                    const Icon = item.icon;
                    const badgeVal = item.badge ? item.badge() : null;

                    if (!isPermitted) {
                      // Permission-aware dimmed link with lock indicator
                      return (
                        <div
                          key={item.id}
                          className="flex items-center px-3 py-2 rounded-lg text-xs text-slate-600 cursor-not-allowed opacity-50"
                          title="Access restricted by active RBAC role"
                        >
                          <Icon className="w-4 h-4 shrink-0 text-slate-600" />
                          {sidebarOpen && (
                            <span className="ml-3 truncate font-medium flex-1">
                              {item.name}
                            </span>
                          )}
                          {sidebarOpen && <span className="text-[10px] text-slate-600">🔒</span>}
                        </div>
                      );
                    }

                    return (
                      <NavLink
                        key={item.id}
                        to={item.path}
                        className={({ isActive }) => `
                          flex items-center px-3 py-2 rounded-lg text-xs font-medium transition group
                          ${isActive 
                            ? 'bg-gradient-to-r from-cyan-600/20 to-blue-600/10 text-cyan-400 border border-cyan-500/30' 
                            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                          }
                        `}
                        title={!sidebarOpen ? item.name : undefined}
                      >
                        <Icon className="w-4 h-4 shrink-0 transition-colors group-hover:text-cyan-400" />
                        {sidebarOpen && (
                          <span className="ml-3 truncate font-medium flex-1">
                            {item.name}
                          </span>
                        )}
                        {sidebarOpen && badgeVal && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white">
                            {badgeVal}
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Content Outlet */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Global Auth & First-Admin Bootstrap Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
};
