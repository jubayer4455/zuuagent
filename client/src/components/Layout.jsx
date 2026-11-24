import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useErp } from '../context/ErpContext.jsx';
import PrintModal from './PrintModal.jsx';

export const MENU_TREE = [
  {
    label: 'Primary Setup',
    items: [
      { label: 'Traders Group', path: '/GI/CSGROUP.aspx' },
      { label: 'Traders Information', path: '/GI/CUSTOMERINFORMATION.aspx' },
      { label: 'Product Category', path: '/GI/CATEGORY.aspx' },
      { label: 'Product Group', path: '/GI/PRODUCTGROUP.aspx' },
      { label: 'Brand Information', path: '/GI/BRAND.aspx' },
      { label: 'Product Information', path: '/GI/PRODUCTINFORMATION.aspx' },
      { label: 'Price Setup', path: '/GI/PRICE_SETUP.aspx' },
      { label: 'Color Information', path: '/GI/COLOR.aspx' }
    ]
  },
  {
    label: 'Accounts Setup',
    items: [
      { label: 'Accounts Sub Group Setup', path: '/GI/ACCOUNTSUBSGROUP.aspx' },
      { label: 'Accounts Ledger', path: '/GI/ACCOUNTSLEDGER.aspx' },
      { label: 'Bank Setup', path: '/GI/BANK.aspx' },
      { label: 'Bank Account Setup', path: '/GI/BANKBRANCH.aspx' },
      { label: 'Cheque Book Entry', path: '/GI/CHQUE_ENTRY.aspx' }
    ]
  },
  {
    label: 'Admin Tools',
    items: [
      { label: 'User Information', path: '/GI/USERENTRY.aspx' },
      { label: 'Data Backup', path: '/GI/DATABASEBACKUP.aspx' },
      { label: 'Daily Business', path: '/GI/DAILY_BUSINESS.aspx' }
    ]
  },
  {
    label: 'HRM',
    items: [
      { label: 'Employee Information', path: '/GI/EMPLOYEE.aspx' }
    ]
  },
  {
    label: 'Trading',
    items: [
      { label: 'Purchase', path: '/GI/PURCHASE.aspx' },
      { label: 'Purchase Return', path: '/GI/PURCHASE_RETURN.aspx' },
      { label: 'Price Quotation', path: '/GI/PRICEQUOTATION.aspx' },
      { label: 'Sales/Invoice', path: '/GI/SALES.aspx' },
      { label: 'Sales Return', path: '/GI/SALES_RETURN.aspx' },
      { label: 'Product Search (By Serial)', path: '/GI/SERIAL_SEARCH.aspx' },
      { label: 'Invoice Search By Mobile No.', path: '/GI/MOBILE_SEARCH.aspx' },
      { label: 'Date Wise Invoice Search', path: '/GI/DATE_WISE_BILL_SEARCH.aspx' }
    ]
  },
  {
    label: 'Transfer',
    items: [
      { label: 'Stock Transfer Commercial', path: '/GI/STOCK_TR_COMM_TO_COMM.aspx' },
      { label: 'Stock Transfer Branch To Branch', path: '/GI/STOCK_TR_BR_TO_BR.aspx' },
      { label: 'Stock Transfer Commercial To Rma', path: '/GI/STOCK_TR_COMM_TO_RMA.aspx' },
      { label: 'Stock Transfer Rma To Commercial', path: '/GI/STOCK_TR_RMA_TO_COMM.aspx' },
      { label: 'Stock Received Br. To Br. Transfer', path: '/GI/STOCK_RECEIVED_BR_TO_BR_TR.aspx' }
    ]
  },
  {
    label: 'RMA',
    items: [
      { label: 'Complain Receive', path: '/GI/COMPLAIN_RECEIVE.aspx' },
      { label: 'Replace Out', path: '/GI/REPLACE_OUT.aspx' },
      { label: 'Replace In', path: '/GI/REPLACE_IN.aspx' },
      { label: 'Replacement Delivery', path: '/GI/REPLACEMENT_DELIVERY.aspx' },
      { label: 'Rma Product Search', path: '/GI/RMA_SERIAL_SEARCH.aspx' }
    ]
  },
  {
    label: 'Servicing',
    items: [
      { label: 'Service Group', path: '/GI/SERVICEGROUP.aspx' },
      { label: 'Problem Group', path: '/GI/PROBLEMGROUP.aspx' },
      { label: 'Service Name', path: '/GI/SERVICE.aspx' },
      { label: 'Problem Name', path: '/GI/PROBLEM.aspx' },
      { label: 'Service Bill', path: '/GI/SERVICEBILL.aspx' }
    ]
  },
  {
    label: 'Accounts',
    items: [
      { label: 'Payment', path: '/GI/PAYMENT.aspx' },
      { label: 'Collection', path: '/GI/COLLECTIONS.aspx' },
      { label: 'Bank Transcation', path: '/GI/BANKTRANSCATION.aspx' },
      { label: 'Journal Voucher', path: '/GI/JOURNAL.aspx' },
      { label: 'Cheque Search', path: '/GI/CHEQUE_SEARCH.aspx' },
      { label: 'Date Wise Collection Search', path: '/GI/DATE_WISE_COLLECTION_SEARCH.aspx' },
      { label: 'Salary Process', path: '/GI/SALARY_PROCESS.aspx' },
      { label: 'Balance Transfer', path: '/GI/BALANCETRANSFER.aspx' }
    ]
  },
  {
    label: 'Reports',
    items: [
      { label: 'Purchase Register', path: '/GI/PURCHASE_REPORTS.aspx' },
      { label: 'Sales Register', path: '/GI/SALES_REPORTS.aspx' },
      { label: 'Traders Reports', path: '/GI/CS_REPORTS.aspx' },
      { label: 'Accounts Register', path: '/GI/ACCOUNTS_REPORTS.aspx' },
      { label: 'Stock Register', path: '/GI/STOCK_REPORTS.aspx' },
      { label: 'Bank Register', path: '/GI/BANK_REPORTS.aspx' },
      { label: 'Rma Register', path: '/GI/RMA_REPORTS.aspx' },
      { label: 'Modification Register', path: '/GI/MODIFICATION_REPORTS.aspx' },
      { label: 'Export To Excel', path: '/GI/EXPORT_EXCEL.aspx' }
    ]
  }
];

export const ALL_ROUTES_COUNT = MENU_TREE.reduce((acc, m) => acc + m.items.length, 0);

function findRouteMeta(pathname) {
  const cur = String(pathname || '').toLowerCase();
  for (const m of MENU_TREE) {
    const found = m.items.find(it => it.path.toLowerCase() === cur);
    if (found) return { module: m.label.trim(), label: found.label, path: found.path };
  }
  return null;
}

export default function Layout({ children }) {
  const { session, master, logout, toast, hasRouteAccess, switchAccount, switchShop } = useErp();
  const [openIdx, setOpenIdx] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickJumpOpen, setQuickJumpOpen] = useState(false);
  const [quickQuery, setQuickQuery] = useState('');
  const [quickActive, setQuickActive] = useState(0);
  const [recentTabs, setRecentTabs] = useState(() => {
    try {
      const raw = sessionStorage.getItem('ht_recent_tabs');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const navRef = useRef(null);
  const quickInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Track recent visited pages for 1-click multitasking tabs
  useEffect(() => {
    setOpenIdx(null);
    setMobileMenuOpen(false);
    setQuickJumpOpen(false);
    const meta = findRouteMeta(location.pathname);
    if (meta) {
      setRecentTabs(prev => {
        const filtered = prev.filter(t => t.path.toLowerCase() !== meta.path.toLowerCase());
        const next = [meta, ...filtered].slice(0, 6);
        try { sessionStorage.setItem('ht_recent_tabs', JSON.stringify(next)); } catch {}
        return next;
      });
    }
  }, [location.pathname]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenIdx(null);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Global Keyboard Shortcuts Engine
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setQuickJumpOpen(prev => !prev);
        setQuickQuery('');
        setQuickActive(0);
        return;
      }
      if (e.key === 'Escape') {
        setOpenIdx(null);
        setQuickJumpOpen(false);
        return;
      }
      if (e.key === 'F2') {
        const el =
          document.getElementById('SALES_BARCODE_SCAN') ||
          document.getElementById('PURCHASE_BARCODE_SCAN') ||
          document.getElementById('PRODUCT_NAME');
        if (el) {
          e.preventDefault();
          el.focus();
          el.select?.();
        }
        return;
      }
      if (e.altKey && e.key.toLowerCase() === 's') {
        const btn =
          document.getElementById('SAVE_BUTTON') ||
          document.getElementById('SAVE') ||
          document.getElementById('Button2');
        if (btn) {
          e.preventDefault();
          btn.click();
        }
      } else if (e.altKey && e.key.toLowerCase() === 'p') {
        const btn =
          document.getElementById('BPRINT') ||
          document.getElementById('PRINT') ||
          document.getElementById('MainContent_PRINT');
        if (btn) {
          e.preventDefault();
          btn.click();
        }
      } else if (e.altKey && e.key.toLowerCase() === 'n') {
        const btn =
          document.getElementById('Clear') ||
          document.getElementById('CLEAR') ||
          document.getElementById('MainContent_CLEAR');
        if (btn) {
          e.preventDefault();
          btn.click();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (quickJumpOpen) {
      setTimeout(() => quickInputRef.current?.focus(), 20);
    }
  }, [quickJumpOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/LOGIN.aspx');
  };

  const visibleMenus = useMemo(() => {
    return MENU_TREE.map((m) => ({
      ...m,
      items: m.items.filter((sub) => hasRouteAccess(sub.path))
    })).filter((m) => m.items.length > 0);
  }, [hasRouteAccess]);

  const flatRoutes = useMemo(() => {
    const out = [{ module: 'Home', label: 'Workspace Dashboard', path: '/GI/TREE.aspx' }];
    for (const m of visibleMenus) {
      for (const item of m.items) {
        out.push({ module: m.label.trim(), label: item.label, path: item.path });
      }
    }
    return out;
  }, [visibleMenus]);

  const filteredQuickRoutes = useMemo(() => {
    const q = quickQuery.trim().toLowerCase();
    if (!q) return flatRoutes.slice(0, 14);
    return flatRoutes
      .filter(r => r.label.toLowerCase().includes(q) || r.module.toLowerCase().includes(q))
      .slice(0, 14);
  }, [flatRoutes, quickQuery]);

  const currentMeta = useMemo(() => findRouteMeta(location.pathname), [location.pathname]);
  const visibleRecentTabs = recentTabs.filter(t => hasRouteAccess(t.path));

  const isSuperAdmin =
    String(session?.userId || '').toLowerCase() === 'jubayer' ||
    session?.permissionType === 'A';

  return (
    <div id="BBB" className="erp-main-bg">
      <div id="SOFT_HEADER" ref={navRef}>
        {/* Tier 1: Pure White Clean Brand + Global Search + Shop Switcher + User */}
        <div className="erp-header-tier1">
          <Link to="/GI/TREE.aspx" className="erp-brand-link" title="HAZI TRADERS Home">
            <img src="/IMAGE/hazi-logo.jpg" alt="HT" className="erp-brand-thumb" />
            <div>
              <div className="erp-brand-title">HAZI TRADERS</div>
              <div className="erp-brand-sub">Hotline: 01955541444</div>
            </div>
          </Link>

          <button
            type="button"
            className="erp-center-search"
            onClick={() => {
              setQuickJumpOpen(true);
              setQuickQuery('');
              setQuickActive(0);
            }}
          >
            <span>⌕ &nbsp;Jump to Sales, Purchase, Stock, Reports...</span>
            <span className="erp-kbd">Ctrl+K</span>
          </button>

          <div className="erp-topbar-actions">
            {isSuperAdmin && (master?.branches || []).length > 1 ? (
              <select
                id="CMP_NAME"
                className="erp-shop-select"
                title="Switch Active Branch / Shop"
                value={session?.branchName || 'HAZI TRADERS'}
                onChange={(e) => switchShop(e.target.value)}
              >
                {master.branches.map(b => (
                  <option key={b.branch_id} value={b.branch_name}>{b.branch_name}</option>
                ))}
              </select>
            ) : (
              <span id="CMP_NAME" className="erp-user-pill" title="Active Branch">
                {session?.branchName || 'HAZI TRADERS'}
              </span>
            )}

            <span id="USER_NAME" className="erp-user-pill" title="Logged in user">
              <span className="erp-user-dot" />
              {session?.userName || 'JUBAYER'}
            </span>

            {session?.userId?.toLowerCase() !== 'jubayer' && (
              <button
                type="button"
                className="erp-btn erp-btn-sm"
                style={{ background: '#fff7ed', borderColor: '#fdba74', color: '#c2410c' }}
                onClick={() => switchAccount('jubayer')}
              >
                Back to Admin
              </button>
            )}

            <button type="button" id="btnLogout" onClick={handleLogout}>
              Logout
            </button>

            <button
              type="button"
              className="erp-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Tier 2: Crisp Soft-Light Horizontal Module Strip (Zero Wrapping on Laptops!) */}
        <div className={`erp-header-tier2 ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <nav className="navbar navbar-expand-lg erp-navbar">
            <ul id="ulMenu" className="navbar-nav d-flex flex-row flex-wrap mb-0 ms-0" style={{ gap: '2px' }}>
              <li className={`nav-item erp-nav-item ${location.pathname.toLowerCase() === '/gi/tree.aspx' ? 'active-mod' : ''}`}>
                <Link to="/GI/TREE.aspx" className="nav-link erp-nav-link">Home</Link>
              </li>
              {visibleMenus.map((m, idx) => {
                const isModActive = m.items.some(sub => sub.path.toLowerCase() === location.pathname.toLowerCase());
                return (
                  <li
                    key={m.label}
                    className={`nav-item dropdown erp-nav-item ${openIdx === idx ? 'open' : ''} ${isModActive ? 'active-mod' : ''}`}
                    style={{ position: 'relative' }}
                  >
                    <span
                      className="nav-link dropdown-toggle erp-nav-link"
                      role="button"
                      onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                    >
                      {m.label}
                    </span>
                    {openIdx === idx && (
                      <ul className="erp-dropdown-menu">
                        {m.items.map((sub) => {
                          const isActive = sub.path.toLowerCase() === location.pathname.toLowerCase();
                          return (
                            <li key={sub.path}>
                              <Link
                                to={sub.path}
                                className={`erp-dropdown-item ${isActive ? 'active-route' : ''}`}
                                onClick={() => setOpenIdx(null)}
                              >
                                <span>{sub.label}</span>
                                {isActive && <span style={{ fontSize: '10px', color: '#0f3264' }}>●</span>}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>

      {/* Sub-Header: 1-Click Recent Pages Tabs + Breadcrumb + Keyboard Hints */}
      {(currentMeta || visibleRecentTabs.length > 0) && (
        <div className="erp-subbar no-print">
          <div className="erp-recent-tabs">
            {currentMeta && (
              <span className="me-2" style={{ fontSize: '11.5px', color: '#64748b' }}>
                {currentMeta.module} › <strong style={{ color: '#0b254a' }}>{currentMeta.label}</strong>
              </span>
            )}
            {visibleRecentTabs.length > 0 && (
              <>
                <span style={{ color: '#cbd5e1' }}>|</span>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Recent:</span>
                {visibleRecentTabs.map((t) => {
                  const isActive = t.path.toLowerCase() === location.pathname.toLowerCase();
                  return (
                    <span key={t.path} className={`erp-recent-tab ${isActive ? 'active' : ''}`}>
                      <Link
                        to={t.path}
                        style={{ color: 'inherit', textDecoration: 'none' }}
                      >
                        {t.label}
                      </Link>
                      {!isActive && (
                        <button
                          type="button"
                          className="erp-recent-tab-close"
                          title="Remove tab"
                          onClick={(e) => {
                            e.preventDefault();
                            setRecentTabs(prev => {
                              const next = prev.filter(x => x.path !== t.path);
                              try { sessionStorage.setItem('ht_recent_tabs', JSON.stringify(next)); } catch {}
                              return next;
                            });
                          }}
                        >
                          ×
                        </button>
                      )}
                    </span>
                  );
                })}
              </>
            )}
          </div>
          <div className="erp-shortcut-hints">
            <span><kbd>Alt+S</kbd> Save</span>
            <span><kbd>Alt+P</kbd> Print</span>
            <span><kbd>Alt+N</kbd> Clear</span>
            <span><kbd>F2</kbd> Scan</span>
          </div>
        </div>
      )}

      {/* Polished Toast Notification */}
      {toast && (
        <div className={`erp-toast ${toast.type === 'error' ? 'erp-toast-error' : 'erp-toast-success'}`}>
          <span>{toast.type === 'error' ? '⚠' : '✓'}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Ctrl+K Quick Menu Jump Modal */}
      {quickJumpOpen && (
        <div className="quick-jump-backdrop no-print" onClick={() => setQuickJumpOpen(false)}>
          <div className="quick-jump-box" onClick={(e) => e.stopPropagation()}>
            <input
              ref={quickInputRef}
              className="quick-jump-input"
              placeholder="Type any page name (e.g. Sales, Purchase, Stock, Backup, User)..."
              value={quickQuery}
              onChange={(e) => {
                setQuickQuery(e.target.value);
                setQuickActive(0);
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setQuickActive(prev => Math.min(filteredQuickRoutes.length - 1, prev + 1));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setQuickActive(prev => Math.max(0, prev - 1));
                } else if (e.key === 'Enter' && filteredQuickRoutes[quickActive]) {
                  e.preventDefault();
                  navigate(filteredQuickRoutes[quickActive].path);
                  setQuickJumpOpen(false);
                }
              }}
            />
            <div className="quick-jump-list">
              {filteredQuickRoutes.length === 0 ? (
                <div className="text-center py-3 text-muted" style={{ fontSize: '12.5px' }}>
                  No matching menu option found.
                </div>
              ) : (
                filteredQuickRoutes.map((r, i) => (
                  <button
                    key={r.path}
                    type="button"
                    className={`quick-jump-item ${i === quickActive ? 'active' : ''}`}
                    onClick={() => {
                      navigate(r.path);
                      setQuickJumpOpen(false);
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{r.label}</span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>{r.module}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <div>{children}</div>

      <PrintModal />
    </div>
  );
}
