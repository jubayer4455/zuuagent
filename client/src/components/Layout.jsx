import React, { useState, useRef, useEffect } from 'react';
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
      { label: 'Admin, Power & Shop Control', path: '/GI/USERENTRY.aspx' },
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
    label: 'Accounts ',
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

export default function Layout({ children }) {
  const { session, logout, toast, master, hasRouteAccess, isSuperAdmin, switchShop, switchAccount } = useErp();
  const [openIdx, setOpenIdx] = useState(null);
  const navRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setOpenIdx(null);
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

  const handleLogout = async () => {
    await logout();
    navigate('/LOGIN.aspx');
  };

  // Filter menu items dynamically based on logged-in admin's assigned powers!
  const visibleMenus = MENU_TREE.map((mod) => ({
    ...mod,
    items: mod.items.filter((sub) => hasRouteAccess(sub.path))
  })).filter((mod) => mod.items.length > 0);

  const allowedCount = visibleMenus.reduce((acc, m) => acc + m.items.length, 0);

  return (
    <div id="BBB" className="erp-main-bg">
      <div id="SOFT_HEADER" ref={navRef}>
        {/* Top Enterprise Status & Control Bar */}
        <div className="erp-topbar">
          <div className="d-flex align-items-center gap-3">
            <Link to="/GI/TREE.aspx" className="erp-brand-badge">
              <div className="erp-brand-icon">HT</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '14.5px', letterSpacing: '0.3px', lineHeight: 1.1 }}>
                  HAZI TRADERS ERP
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Enterprise Resource, Inventory &amp; Accounting Suite
                </div>
              </div>
            </Link>

            <Link
              to="/GI/TREE.aspx"
              className="btn btn-sm"
              style={{
                backgroundColor: location.pathname === '/GI/TREE.aspx' ? '#0d9488' : '#1e293b',
                color: '#fff',
                fontWeight: 600,
                fontSize: '12px',
                padding: '3px 10px',
                border: '1px solid #334155'
              }}
            >
              Dashboard
            </Link>

            {isSuperAdmin && (
              <Link
                to="/GI/USERENTRY.aspx"
                className="btn btn-sm"
                style={{
                  backgroundColor: location.pathname === '/GI/USERENTRY.aspx' ? '#0284c7' : 'rgba(14, 165, 233, 0.15)',
                  color: '#7dd3fc',
                  fontWeight: 700,
                  fontSize: '12px',
                  padding: '3px 11px',
                  border: '1px solid rgba(56, 189, 248, 0.35)'
                }}
              >
                Admin Power &amp; Shop Control
              </Link>
            )}
          </div>

          <div className="d-flex align-items-center flex-wrap gap-2">
            {/* Active Shop / Branch Selector */}
            <div className="d-flex align-items-center gap-1 px-2 py-1 rounded" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
              <span id="Label1" style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: 600 }}>Shop / Branch:</span>
              <select
                id="CMP_NAME"
                value={session?.branchName || 'HAZI TRADERS'}
                onChange={(e) => switchShop(e.target.value)}
                style={{
                  background: 'transparent',
                  color: '#38bdf8',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '12.5px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {master.branches.map((b) => (
                  <option key={b.branch_id} value={b.branch_name} style={{ color: '#0f172a' }}>
                    {b.branch_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Active Admin Identity & Power Count Badge */}
            <div className="d-flex align-items-center gap-2 px-2 py-1 rounded" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
              <span id="Label3" style={{ fontSize: '11.5px', color: '#94a3b8' }}>Admin:</span>
              <span id="USER_NAME" style={{ fontSize: '12.5px', fontWeight: 700, color: '#f8fafc' }}>
                {session?.userName || 'JUBAYER'}
              </span>
              <span
                className="badge"
                style={{
                  backgroundColor: isSuperAdmin ? '#059669' : '#d97706',
                  color: '#ffffff',
                  fontSize: '10.5px',
                  fontWeight: 700
                }}
              >
                {session?.permissions?.roleLabel || (isSuperAdmin ? 'Super Admin' : 'Custom Admin')} ({allowedCount}/{ALL_ROUTES_COUNT} options)
              </span>
            </div>

            {/* Instant Return to Super Admin Button when testing a sub-admin account */}
            {session?.userId?.toLowerCase() !== 'jubayer' && (
              <button
                type="button"
                className="btn btn-sm"
                style={{
                  backgroundColor: '#f59e0b',
                  color: '#0f172a',
                  fontWeight: 700,
                  fontSize: '11.5px',
                  padding: '3px 10px'
                }}
                onClick={() => switchAccount('jubayer')}
              >
                Switch back to Master Admin (JUBAYER)
              </button>
            )}

            <button type="button" id="btnLogout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        {/* Dynamic Permission-Driven Module Navigation Bar */}
        <nav className="navbar navbar-expand-lg erp-navbar">
          <div className="container-fluid px-0">
            <div className="d-flex align-items-center flex-wrap" id="navbarMenu">
              <ul id="ulMenu" className="navbar-nav d-flex flex-row flex-wrap mb-0 ms-0 gap-1">
                {visibleMenus.map((m, idx) => (
                  <li
                    key={m.label}
                    className={`nav-item dropdown erp-nav-item ${openIdx === idx ? 'open' : ''}`}
                    style={{ position: 'relative' }}
                  >
                    <span
                      className="nav-link dropdown-toggle erp-nav-link"
                      role="button"
                      onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                    >
                      <span>{m.label}</span>
                      <span style={{ fontSize: '10px', opacity: 0.7 }}>({m.items.length})</span>
                    </span>
                    {openIdx === idx && (
                      <ul className="erp-dropdown-menu">
                        {m.items.map((sub) => (
                          <li key={sub.path}>
                            <Link
                              to={sub.path}
                              className="erp-dropdown-item"
                              onClick={() => setOpenIdx(null)}
                            >
                              <span>{sub.label}</span>
                              <span style={{ fontSize: '11px', color: '#94a3b8' }}>→</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </nav>
      </div>

      {toast && (
        <div style={{
          position: 'fixed',
          top: '94px',
          right: '20px',
          zIndex: 4500,
          backgroundColor: toast.type === 'error' ? '#e11d48' : '#0f766e',
          color: '#fff',
          padding: '8px 18px',
          borderRadius: '6px',
          fontWeight: '700',
          boxShadow: '0 10px 25px rgba(15,23,42,0.35)'
        }}>
          {toast.msg}
        </div>
      )}

      <div>{children}</div>

      <PrintModal />
    </div>
  );
}
