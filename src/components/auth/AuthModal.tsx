import React, { useState } from 'react';
import { Shield, KeyRound, User, Lock, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { UserRole } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { 
    currentUser, 
    needsBootstrap, 
    bootstrapMasterAdmin, 
    signIn, 
    setCurrentRole, 
    isLoading, 
    authError 
  } = useAuthStore();

  const [mode, setMode] = useState<'signin' | 'bootstrap'>(needsBootstrap ? 'bootstrap' : 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');

    if (mode === 'bootstrap') {
      const res = await bootstrapMasterAdmin(email, password, fullName);
      if (res.success) {
        setSuccessMsg('Master Admin bootstrapped & logged in successfully!');
        setTimeout(() => onClose(), 1200);
      }
    } else {
      const res = await signIn(email, password);
      if (res.success) {
        setSuccessMsg('Signed in successfully!');
        setTimeout(() => onClose(), 800);
      }
    }
  };

  const handleRoleSwitch = (role: UserRole) => {
    setCurrentRole(role);
    setSuccessMsg(`Switched active context to ${role.replace('_', ' ').toUpperCase()}`);
    setTimeout(() => onClose(), 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl shadow-cyan-950/40">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-3 mb-5">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">
              {needsBootstrap ? 'First-Admin Setup (Bootstrap)' : 'Authentication & Role Management'}
            </h2>
            <p className="text-xs text-slate-400">
              {needsBootstrap ? 'Initialize master administrator credentials' : 'Sign in or switch test security roles'}
            </p>
          </div>
        </div>

        {/* Tab switch if not forced bootstrap */}
        {!needsBootstrap && (
          <div className="flex p-1 mb-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={`flex-1 py-1.5 rounded-lg transition ${
                mode === 'signin' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('bootstrap')}
              className={`flex-1 py-1.5 rounded-lg transition ${
                mode === 'bootstrap' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Bootstrap Admin
            </button>
          </div>
        )}

        {authError && (
          <div className="flex items-start space-x-2 p-3 mb-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{authError}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center space-x-2 p-3 mb-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'bootstrap' && (
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Master Administrator"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Email Address
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@zuuagent.ai"
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Password {mode === 'bootstrap' && '(Min. 8 characters)'}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 mt-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-950 disabled:opacity-50 transition"
          >
            {isLoading ? 'Processing...' : mode === 'bootstrap' ? 'Initialize First Admin' : 'Sign In'}
          </button>
        </form>

        {/* Quick RBAC Role Simulator for Pair-Programming & Audit */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
            <span>Quick RBAC Switcher</span>
            <span className="text-[10px] text-cyan-400">Current: {currentUser.systemRole}</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {(['master_admin', 'admin', 'operator', 'reviewer', 'viewer'] as UserRole[]).map(role => (
              <button
                key={role}
                type="button"
                onClick={() => handleRoleSwitch(role)}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-bold capitalize transition border ${
                  currentUser.systemRole === role
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-400'
                    : 'bg-slate-950/60 border-slate-800/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                {role.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
