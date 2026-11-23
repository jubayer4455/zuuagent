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
  const { session, logout, toast, hasRouteAccess, switchAccount } = useErp();
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

  // Dynamically filter menu items based on the logged-in user's assigned permissions!
  const visibleMenus = MENU_TREE.map((m) => ({
    ...m,
    items: m.items.filter((sub) => hasRouteAccess(sub.path))
  })).filter((m) => m.items.length > 0);

  return (
    <div id="BBB" className="erp-main-bg">
      <div id="SOFT_HEADER" ref={navRef}>
        <div className="soft-header-top">
          {session?.userId?.toLowerCase() !== 'jubayer' && (
            <button
              type="button"
              className="erp-btn me-2"
              style={{ height: '19px', fontSize: '11.5px', padding: '0 8px' }}
              onClick={() => switchAccount('jubayer')}
            >
              Back to Admin (JUBAYER)
            </button>
          )}
          <span id="Label1" style={{ color: 'Black' }}>Branch Name: </span>
          <span id="CMP_NAME" style={{ color: 'Black', marginRight: '6px' }}>{session?.branchName || 'HAZI TRADERS'}</span>
          <span id="Label3" style={{ color: 'Black' }}>Login by: </span>
          <span id="USER_NAME" style={{ color: 'Black' }}>{session?.userName || 'JUBAYER'}</span>
        </div>

        <nav className="navbar navbar-expand-lg navbar-light bg-light erp-navbar">
          <div className="container-fluid px-1">
            <div style={{ textAlign: 'left' }} className="d-flex align-items-center flex-wrap" id="navbarMenu">
              <ul id="ulMenu" className="navbar-nav d-flex flex-row flex-wrap mb-0 ms-0">
                {visibleMenus.map((m, idx) => (
                  <li
                    key={m.label}
                    className={`nav-item me-2 dropdown erp-nav-item ${openIdx === idx ? 'open' : ''}`}
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
                        {m.items.map((sub) => (
                          <li key={sub.path}>
                            <Link
                              to={sub.path}
                              className="erp-dropdown-item"
                              onClick={() => setOpenIdx(null)}
                            >
                              {sub.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                id="btnLogout"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </nav>
      </div>

      {toast && (
        <div style={{
          position: 'fixed',
          top: '56px',
          right: '18px',
          zIndex: 4500,
          backgroundColor: toast.type === 'error' ? '#dc3545' : '#14a44d',
          color: '#fff',
          padding: '6px 16px',
          borderRadius: '4px',
          fontWeight: 'bold',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
          {toast.msg}
        </div>
      )}

      <div>{children}</div>

      <PrintModal />
    </div>
  );
}
