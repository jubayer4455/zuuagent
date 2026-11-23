import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ErpContext = createContext(null);

export function getTodayStr() {
  return '23/11/2026';
}

export function getMonthStartStr() {
  return '01/11/2026';
}

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
      { branch_id: 'BR001', branch_name: 'HAZI TRADERS' },
      { branch_id: 'BR002', branch_name: 'HAZI TRADERS-2' }
    ],
    serials: [],
    nextIds: {}
  });
  const [toast, setToast] = useState(null);
  const [modalDoc, setModalDoc] = useState(null);

  const notify = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const refreshMaster = useCallback(async () => {
    try {
      const branch = session?.branchName || 'HAZI TRADERS';
      const res = await fetch(`/api/master/all?branch=${encodeURIComponent(branch)}`);
      if (res.ok) {
        const data = await res.json();
        setMaster(data);
      }
    } catch (e) {
      console.error('Failed to load master data', e);
    }
  }, [session?.branchName]);

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
      return { ok: true };
    }
    return { ok: false, message: data.message || 'Invalid User ID or Password!' };
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setSession(null);
    localStorage.removeItem('hazi_erp_session');
  };

  const openPrint = (doc) => {
    setModalDoc(doc);
  };

  const closePrint = () => {
    setModalDoc(null);
  };

  return (
    <ErpContext.Provider value={{
      session,
      login,
      logout,
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
