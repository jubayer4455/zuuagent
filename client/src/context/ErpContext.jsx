import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ErpContext = createContext(null);

export function getTodayStr() {
  return '23/11/2026';
}

export function getMonthStartStr() {
  return '01/11/2026';
}

const DEFAULT_SUPER_PERMS = {
  all: true,
  roleLabel: 'Super Admin (Full Power)',
  actions: { create: true, edit: true, delete: true, print: true, manageAdmins: true, manageShops: true },
  routes: ['*']
};

export function ErpProvider({ children }) {
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem('hazi_erp_session');
    return saved ? JSON.parse(saved) : null;
  });
  const [master, setMaster] = useState({
    traderGroups: [],
    traders: [],
    categories: [],
    productGroups: [],
    brands: [],
    colors: [],
    products: [],
    branchPrices: [],
    accountSubGroups: [],
    accountLedgers: [],
    banks: [],
    bankAccounts: [],
    chequeBooks: [],
    employees: [],
    users: [],
    serviceGroups: [],
    problemGroups: [],
    services: [],
    problems: [],
    stores: [{ store_id: 'ST001', store_name: 'SHOW ROOM' }],
    branches: [
      { branch_id: 'BR001', branch_name: 'HAZI TRADERS', address: 'Motijheel Commercial Area, Dhaka', phone: '01818524712' },
      { branch_id: 'BR002', branch_name: 'HAZI TRADERS-2', address: 'Uttara Sector-7, Dhaka', phone: '01818524712' }
    ],
    serials: [],
    nextIds: {}
  });
  const [toast, setToast] = useState(null);
  const [modalDoc, setModalDoc] = useState(null);

  const notify = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3800);
  }, []);

  const refreshMaster = useCallback(async () => {
    try {
      const branch = session?.branchName || 'HAZI TRADERS';
      const res = await fetch(`/api/master/all?branch=${encodeURIComponent(branch)}`);
      if (res.ok) {
        const data = await res.json();
        setMaster(data);
        // Keep active session's permissions live-synced with latest user record
        if (session?.userId && Array.isArray(data.users)) {
          const liveUser = data.users.find(u => u.user_id.toLowerCase() === session.userId.toLowerCase());
          if (liveUser && liveUser.permissions) {
            const oldJson = JSON.stringify(session.permissions || {});
            const newJson = JSON.stringify(liveUser.permissions);
            if (oldJson !== newJson || session.permissionType !== liveUser.permission_type) {
              const updatedSess = {
                ...session,
                userName: liveUser.user_name,
                permissionType: liveUser.permission_type,
                permissions: liveUser.permissions
              };
              setSession(updatedSess);
              localStorage.setItem('hazi_erp_session', JSON.stringify(updatedSess));
            }
          }
        }
      }
    } catch (e) {
      console.error('Failed to load master data', e);
    }
  }, [session]);

  useEffect(() => {
    refreshMaster();
  }, [refreshMaster]);

  const login = async ({ userId, password, companyName, branchName }) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, password, companyName, branchName })
    });
    const data = await res.json();
    if (res.ok && data.ok) {
      setSession(data.session);
      localStorage.setItem('hazi_erp_session', JSON.stringify(data.session));
      await refreshMaster();
      return { ok: true, session: data.session };
    }
    return { ok: false, message: data.message || 'Invalid User ID or Password!' };
  };

  const switchAccount = async (targetUserId, branchName) => {
    const res = await fetch('/api/auth/switch-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId, branchName: branchName || session?.branchName })
    });
    const data = await res.json();
    if (res.ok && data.ok) {
      setSession(data.session);
      localStorage.setItem('hazi_erp_session', JSON.stringify(data.session));
      notify(data.message);
      await refreshMaster();
      return { ok: true };
    }
    notify(data.message || 'Failed to switch account', 'error');
    return { ok: false };
  };

  const switchShop = (newBranchName) => {
    if (!session) return;
    const updated = { ...session, branchName: newBranchName };
    setSession(updated);
    localStorage.setItem('hazi_erp_session', JSON.stringify(updated));
    notify(`Active Shop / Branch switched to: ${newBranchName}`);
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setSession(null);
    localStorage.removeItem('hazi_erp_session');
  };

  const hasRouteAccess = useCallback((path) => {
    if (!session) return false;
    if (path === '/GI/TREE.aspx') return true;
    const perms = session.permissions || (session.permissionType === 'A' ? DEFAULT_SUPER_PERMS : null);
    if (!perms) return true;
    if (perms.all || (Array.isArray(perms.routes) && perms.routes.includes('*'))) return true;
    if (Array.isArray(perms.routes)) {
      return perms.routes.some(r => r.toLowerCase() === String(path).toLowerCase());
    }
    return false;
  }, [session]);

  const hasActionAccess = useCallback((actionKey) => {
    if (!session) return false;
    const perms = session.permissions || (session.permissionType === 'A' ? DEFAULT_SUPER_PERMS : null);
    if (!perms || perms.all) return true;
    return Boolean(perms.actions?.[actionKey] ?? true);
  }, [session]);

  const isSuperAdmin = Boolean(
    session?.userId?.toLowerCase() === 'jubayer' ||
    session?.userId?.toLowerCase() === 'admin' ||
    session?.permissionType === 'A' ||
    session?.permissions?.all ||
    session?.permissions?.actions?.manageAdmins
  );

  const openPrint = (doc) => setModalDoc(doc);
  const closePrint = () => setModalDoc(null);

  return (
    <ErpContext.Provider value={{
      session,
      login,
      logout,
      switchAccount,
      switchShop,
      hasRouteAccess,
      hasActionAccess,
      isSuperAdmin,
      master,
      refreshMaster,
      toast,
      notify,
      modalDoc,
      openPrint,
      closePrint
    }}>
      {children}
    </ErpContext.Provider>
  );
}

export function useErp() {
  return useContext(ErpContext);
}
