import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useErp } from '../context/ErpContext.jsx';

export function LoginPage() {
  const { login } = useErp();
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState('HAZI TRADERS');
  const [branchName, setBranchName] = useState('HAZI TRADERS');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [branches, setBranches] = useState([
    { branch_id: 'CMP001', branch_name: 'HAZI TRADERS' },
    { branch_id: 'CMP002', branch_name: 'HAZI TRADERS-2' }
  ]);

  useEffect(() => {
    document.title = 'HAZI TRADERS — Software Login';
    fetch('/api/auth/options')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d.branches) && d.branches.length > 0) {
          setBranches(d.branches);
        }
      })
      .catch(() => {});
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setSubmitting(true);
    try {
      const res = await login({ userId, password, companyName, branchName });
      if (res.ok) {
        navigate('/GI/TREE.aspx');
      } else {
        setMessage(res.message || 'Invalid User ID or Password!');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-body-bg">
      <div className="login-shell">
        {/* Left Brand Identity Panel */}
        <div className="login-brand-panel">
          <img
            className="login-brand-logo"
            src="/IMAGE/hazi-logo.jpg"
            alt="HAZI TRADERS — Trust, Quality, Growth"
          />
          <div className="login-brand-address">
            Toyenbee Circular Road, Motijheel<br />
            Dhaka-1000, Bangladesh
          </div>
          <div className="login-brand-pill">
            <span>●</span>
            <span>Multi-Branch Inventory &amp; Accounts ERP</span>
          </div>
          <div className="login-brand-hotline">
            <span id="Label4">Management: 01955541444</span>
          </div>
        </div>

        {/* Right Sign-In Form Panel */}
        <div className="login-form-panel">
          <form id="form1" onSubmit={handleSubmit}>
            <div id="Label6" className="login-greeting">{greeting}</div>
            <h1 className="login-heading">Sign in to your account</h1>

            <div className="mb-2">
              <label htmlFor="COMPANY_MASTER" id="Label5" className="login-field-label">
                Company Name
              </label>
              <select
                name="COMPANY_MASTER"
                id="COMPANY_MASTER"
                className="login-select"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              >
                <option value="HAZI TRADERS">HAZI TRADERS</option>
              </select>
            </div>

            <div className="mb-2">
              <label htmlFor="DropDownListCompanyName" id="LCOMPANY_NAME" className="login-field-label">
                Branch / Shop Name
              </label>
              <select
                name="DropDownListCompanyName"
                id="DropDownListCompanyName"
                className="login-select"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
              >
                {branches.map((b) => (
                  <option key={b.branch_id} value={b.branch_name}>
                    {b.branch_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-2">
              <label htmlFor="USER_ID" className="login-field-label">
                User ID
              </label>
              <input
                name="USER_ID"
                type="text"
                id="USER_ID"
                className="login-input"
                placeholder="Enter User ID"
                autoComplete="username"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                autoFocus
              />
            </div>

            <div className="mb-3">
              <label htmlFor="Txtpassword" className="login-field-label">
                Password
              </label>
              <div className="login-pass-wrap">
                <input
                  name="Txtpassword"
                  type={showPass ? 'text' : 'password'}
                  id="Txtpassword"
                  className="login-input"
                  style={{ paddingRight: '58px' }}
                  placeholder="Enter Password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="login-pass-toggle"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {message && (
              <div
                id="MESSAGE"
                className="mb-2 px-2 py-1 rounded"
                style={{ background: '#fee2e2', color: '#b91c1c', fontSize: '12.5px', fontWeight: 600 }}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              name="SAVE"
              id="SAVE"
              className="login-btn"
              disabled={submitting}
            >
              {submitting ? 'Signing In...' : 'Login'}
            </button>

            <div className="mt-3 text-center" style={{ fontSize: '11.5px', color: '#64748b' }}>
              Need help? Call Management: <strong style={{ color: '#0f3264' }}>01955541444</strong>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

const QUICK_LAUNCH_TILES = [
  { path: '/GI/SALES.aspx', icon: '🧾', title: 'Sales / Invoice', desc: 'Instant barcode billing, print & WhatsApp bill' },
  { path: '/GI/PURCHASE.aspx', icon: '📦', title: 'Purchase Entry', desc: 'Stock in, serial scan & supplier bills' },
  { path: '/GI/DATE_WISE_BILL_SEARCH.aspx', icon: '🔎', title: 'Date Wise Invoices', desc: 'Search, print or WhatsApp historical bills' },
  { path: '/GI/COLLECTIONS.aspx', icon: '💰', title: 'Collection', desc: 'Receive customer dues via Cash / Bank' },
  { path: '/GI/PAYMENT.aspx', icon: '💳', title: 'Payment', desc: 'Supplier & expense cash/cheque payments' },
  { path: '/GI/PRODUCTINFORMATION.aspx', icon: '🏷️', title: 'Product Information', desc: 'Manage 2,700+ items, barcodes & pricing' },
  { path: '/GI/CUSTOMERINFORMATION.aspx', icon: '👥', title: 'Traders & Due Reminder', desc: 'Customers, suppliers & WhatsApp due alert' },
  { path: '/GI/SERIAL_SEARCH.aspx', icon: '🔢', title: 'Serial Search', desc: 'Trace product serial history & warranty' },
  { path: '/GI/STOCK_REPORTS.aspx', icon: '📊', title: 'Stock Register', desc: 'Live branch stock valuation & serial list' },
  { path: '/GI/DAILY_BUSINESS.aspx', icon: '📈', title: 'Daily Business', desc: 'Daily sales, cash, bank & profit summary' },
  { path: '/GI/USERENTRY.aspx', icon: '🛡️', title: 'Admin & Shop Control', desc: 'Add/edit admins, powers & shop branding' },
  { path: '/GI/DATABASEBACKUP.aspx', icon: '💾', title: 'Backup & .Bak Upload', desc: 'Backup DB or upload old site .Bak file' }
];

export function TreeDashboardPage() {
  const { session, hasRouteAccess } = useErp();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    document.title = 'HAZI TRADERS — Workspace';
    fetch('/api/admin/db-stats')
      .then(r => r.json())
      .then(d => {
        if (d.ok) setStats(d.stats);
      })
      .catch(() => {});
  }, []);

  const visibleTiles = QUICK_LAUNCH_TILES.filter(t => hasRouteAccess(t.path));
  const isAdmin =
    String(session?.userId || '').toLowerCase() === 'jubayer' ||
    session?.permissionType === 'A';

  return (
    <div className="home-workspace">
      <div className="home-welcome-card">
        <div className="home-welcome-left">
          <img src="/IMAGE/hazi-logo.jpg" alt="HAZI TRADERS" className="home-logo-box" />
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#0b254a', lineHeight: 1.2 }}>
              {session?.branchName || 'HAZI TRADERS'}
            </div>
            <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '2px' }}>
              Logged in as <strong style={{ color: '#0f172a' }}>{session?.userName || 'JUBAYER'}</strong>
              {' '}• {session?.permissions?.roleLabel || (isAdmin ? 'Super Admin (Full Power)' : 'Staff User')}
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
              Management Hotline: <strong>01955541444</strong> • Press <kbd style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '0 4px', borderRadius: '3px' }}>Ctrl+K</kbd> to jump to any page
            </div>
          </div>
        </div>
        <div className="d-flex flex-wrap gap-2">
          {hasRouteAccess('/GI/SALES.aspx') && (
            <Link to="/GI/SALES.aspx" className="erp-btn text-decoration-none" id="SAVE">
              + New Sales Invoice
            </Link>
          )}
          {hasRouteAccess('/GI/PURCHASE.aspx') && (
            <Link to="/GI/PURCHASE.aspx" className="erp-btn text-decoration-none">
              + New Purchase
            </Link>
          )}
          {hasRouteAccess('/GI/DATABASEBACKUP.aspx') && (
            <Link to="/GI/DATABASEBACKUP.aspx" className="erp-btn text-decoration-none">
              Upload .Bak Data
            </Link>
          )}
        </div>
      </div>

      {stats && (
        <div className="home-stat-grid">
          {[
            ['Active Products', stats.products, '#0f3264'],
            ['Customers / Suppliers', stats.traders, '#1d5bb8'],
            ['In-Stock Serials', stats.product_serials, '#0d9488'],
            ['Total Sales Bills', stats.sales, '#15803d'],
            ['Total Purchases', stats.purchases, '#ea580c'],
            ['Collections', stats.collections, '#4f46e5']
          ].map(([label, val, color]) => (
            <div key={label} className="home-stat-card" style={{ borderLeftColor: color }}>
              <div className="home-stat-label">{label}</div>
              <div className="home-stat-value">{Number(val || 0).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}

      <div className="home-section-title">Quick Launch — Daily Operations</div>
      <div className="home-tile-grid">
        {visibleTiles.map((tile) => (
          <Link key={tile.path} to={tile.path} className="home-tile">
            <div className="home-tile-icon">{tile.icon}</div>
            <div>
              <div className="home-tile-title">{tile.title}</div>
              <div className="home-tile-desc">{tile.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
