import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useErp } from '../context/ErpContext.jsx';
import { MENU_TREE, ALL_ROUTES_COUNT } from '../components/Layout.jsx';

export function LoginPage() {
  const { login, master } = useErp();
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState('HAZI TRADERS');
  const [branchName, setBranchName] = useState('HAZI TRADERS');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [branches, setBranches] = useState([
    { branch_id: 'BR001', branch_name: 'HAZI TRADERS' },
    { branch_id: 'BR002', branch_name: 'HAZI TRADERS-2' }
  ]);

  useEffect(() => {
    document.title = 'HAZI TRADERS — Enterprise ERP Sign In';
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
    const res = await login({ userId, password, companyName, branchName });
    if (res.ok) {
      navigate('/GI/TREE.aspx');
    } else {
      setMessage(res.message || 'Invalid User ID or Password!');
    }
  };

  const quickFill = (u, p) => {
    setUserId(u);
    setPassword(p);
    setMessage('');
  };

  return (
    <div className="login-body-bg">
      <div className="login-shell">
        {/* Left Corporate Brand & Operations Panel */}
        <div className="login-brand-panel">
          <div>
            <div className="d-flex align-items-center gap-3 mb-4">
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '10px',
                backgroundColor: '#0d9488',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '20px',
                color: '#fff',
                boxShadow: '0 8px 20px rgba(13, 148, 136, 0.35)'
              }}>
                HT
              </div>
              <div>
                <div style={{ fontSize: '19px', fontWeight: 800, letterSpacing: '0.4px' }}>
                  HAZI TRADERS
                </div>
                <div style={{ fontSize: '12.5px', color: '#94a3b8' }}>
                  Enterprise Resource, Inventory &amp; Accounting Suite
                </div>
              </div>
            </div>

            <h2 style={{ fontSize: '24px', fontWeight: 800, lineHeight: 1.3, marginBottom: '14px' }}>
              Multi-Shop Commercial Trading, Serial Warranty &amp; Financial Control
            </h2>
            <p style={{ fontSize: '13.5px', color: '#cbd5e1', lineHeight: 1.6 }}>
              Centralized management for showroom billing, serial-tracked inventory, branch-to-branch stock transfers, RMA lifecycle, servicing, banking, and real-time role-based admin access control.
            </p>

            <div className="row g-2 mt-3">
              <div className="col-6">
                <div className="p-2 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Active Shops</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#2dd4bf' }}>{branches.length} Branches</div>
                </div>
              </div>
              <div className="col-6">
                <div className="p-2 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Modules &amp; Reports</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#38bdf8' }}>57 Screens / 282 Reports</div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 mt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.12)', fontSize: '12.5px', color: '#cbd5e1' }}>
            <div className="fw-bold text-white mb-1">Head Office &amp; Support</div>
            <div id="Label4">Management Hotline: 01818524712, 01402338209</div>
          </div>
        </div>

        {/* Right Sign-In Form Panel */}
        <div className="login-form-panel">
          <form id="form1" onSubmit={handleSubmit}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <span id="Label6" style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f766e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {greeting}
                </span>
                <h3 style={{ fontSize: '21px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Operator &amp; Admin Sign In
                </h3>
              </div>
              <span className="badge bg-light text-dark border">v4.2 Enterprise</span>
            </div>

            <div className="mb-2">
              <label id="Label5" className="erp-label mb-1 d-block">Organization / Company Name</label>
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

            <div className="mb-3">
              <label id="LCOMPANY_NAME" className="erp-label mb-1 d-block">Active Shop / Branch Name</label>
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
              <label className="erp-label mb-1 d-block">Admin / Operator User ID</label>
              <input
                name="USER_ID"
                type="text"
                id="USER_ID"
                className="login-input"
                placeholder="Enter User ID (e.g. jubayer)"
                autoComplete="off"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                autoFocus
              />
            </div>

            <div className="mb-3">
              <label className="erp-label mb-1 d-block">Password</label>
              <input
                name="Txtpassword"
                type="password"
                id="Txtpassword"
                className="login-input"
                placeholder="Enter Password"
                autoComplete="off"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {message && (
              <div id="MESSAGE" className="alert alert-danger py-2 px-3 mb-2 fw-bold" style={{ fontSize: '13px' }}>
                {message}
              </div>
            )}

            <div className="mt-2">
              <input
                type="submit"
                name="SAVE"
                value="SIGN IN TO WORKSPACE"
                id="SAVE"
                className="login-btn"
              />
            </div>

            {/* Quick Account Switcher for Testing Different Admin Powers */}
            <div className="mt-3 pt-3 border-top">
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748b', marginBottom: '6px' }}>
                QUICK TEST ACCOUNTS (CLICK TO FILL CREDENTIALS):
              </div>
              <div className="d-flex flex-wrap gap-1">
                <button
                  type="button"
                  className="erp-btn"
                  style={{ fontSize: '11.5px', height: '25px', padding: '1px 8px' }}
                  onClick={() => quickFill('jubayer', '555444')}
                >
                  jubayer (Super Admin - All Power)
                </button>
                <button
                  type="button"
                  className="erp-btn"
                  style={{ fontSize: '11.5px', height: '25px', padding: '1px 8px' }}
                  onClick={() => quickFill('bashiruddin', '123456')}
                >
                  bashiruddin (Shop Manager)
                </button>
                <button
                  type="button"
                  className="erp-btn"
                  style={{ fontSize: '11.5px', height: '25px', padding: '1px 8px' }}
                  onClick={() => quickFill('shawon', '123456')}
                >
                  shawon (Sales Admin)
                </button>
                <button
                  type="button"
                  className="erp-btn"
                  style={{ fontSize: '11.5px', height: '25px', padding: '1px 8px' }}
                  onClick={() => quickFill('rashed', '123456')}
                >
                  rashed (RMA &amp; Service)
                </button>
                <button
                  type="button"
                  className="erp-btn"
                  style={{ fontSize: '11.5px', height: '25px', padding: '1px 8px' }}
                  onClick={() => quickFill('babu', '123456')}
                >
                  babu (Accounts Admin)
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export function TreeDashboardPage() {
  const { session, master, hasRouteAccess, isSuperAdmin, switchAccount, switchShop } = useErp();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    document.title = 'Executive Command Center || HAZI TRADERS ERP';
    fetch('/api/admin/daily-business?date1=01/11/2026&date2=23/11/2026')
      .then(r => r.json())
      .then(d => setSummary(d))
      .catch(() => {});
  }, [session?.branchName]);

  const permittedModules = MENU_TREE.map((mod) => ({
    ...mod,
    items: mod.items.filter((sub) => hasRouteAccess(sub.path))
  })).filter((mod) => mod.items.length > 0);

  const permittedOptionsCount = permittedModules.reduce((acc, m) => acc + m.items.length, 0);

  return (
    <div className="erp-container">
      {/* Top Executive Welcome & Live Role/Shop Banner */}
      <div className="p-3 mb-3 rounded-3 d-flex flex-wrap justify-content-between align-items-center gap-3" style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#f8fafc',
        border: '1px solid #334155',
        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.12)'
      }}>
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="badge" style={{ backgroundColor: isSuperAdmin ? '#059669' : '#d97706', fontSize: '11.5px' }}>
              {session?.permissions?.roleLabel || (isSuperAdmin ? 'Super Admin (Full Power)' : 'Custom Power Admin')}
            </span>
            <span style={{ fontSize: '12.5px', color: '#94a3b8' }}>
              Active Shop: <strong className="text-info">{session?.branchName || 'HAZI TRADERS'}</strong>
            </span>
          </div>
          <h4 className="mb-0 fw-bold" style={{ fontSize: '20px' }}>
            Welcome, {session?.userName || 'JUBAYER'} — Enterprise Operations Workspace
          </h4>
          <div style={{ fontSize: '12.5px', color: '#cbd5e1', marginTop: '2px' }}>
            Your account currently has active power for <strong>{permittedOptionsCount}</strong> out of <strong>{ALL_ROUTES_COUNT}</strong> ERP screens across <strong>{permittedModules.length}</strong> modules.
          </div>
        </div>

        <div className="d-flex flex-wrap gap-2">
          {hasRouteAccess('/GI/SALES.aspx') && (
            <button className="btn btn-sm fw-bold" style={{ backgroundColor: '#0d9488', color: '#fff' }} onClick={() => navigate('/GI/SALES.aspx')}>
              + New Sales Invoice
            </button>
          )}
          {hasRouteAccess('/GI/PURCHASE.aspx') && (
            <button className="btn btn-sm fw-bold" style={{ backgroundColor: '#2563eb', color: '#fff' }} onClick={() => navigate('/GI/PURCHASE.aspx')}>
              + New Purchase Bill
            </button>
          )}
          {hasRouteAccess('/GI/COLLECTIONS.aspx') && (
            <button className="btn btn-sm fw-bold" style={{ backgroundColor: '#475569', color: '#fff' }} onClick={() => navigate('/GI/COLLECTIONS.aspx')}>
              + Money Receipt
            </button>
          )}
          {isSuperAdmin && (
            <button className="btn btn-sm fw-bold" style={{ backgroundColor: '#f59e0b', color: '#0f172a' }} onClick={() => navigate('/GI/USERENTRY.aspx')}>
              Manage Admins, Powers &amp; Shops
            </button>
          )}
        </div>
      </div>

      {/* Live Financial & Inventory KPI Strip */}
      <div className="row g-2 mb-3">
        {[
          { label: 'Total Sales (Nov)', val: summary?.cards?.sales ?? 141000, color: '#0f766e', path: '/GI/SALES_REPORTS.aspx' },
          { label: 'Current Stock Value', val: summary?.cards?.stock ?? 301840, color: '#1d4ed8', path: '/GI/STOCK_REPORTS.aspx' },
          { label: 'Customer Receivable', val: summary?.cards?.receivable ?? 50500, color: '#b45309', path: '/GI/CS_REPORTS.aspx' },
          { label: 'Supplier Payable', val: summary?.cards?.payable ?? 209000, color: '#be123c', path: '/GI/CS_REPORTS.aspx' },
          { label: 'Cash Book Balance', val: summary?.cards?.cashBook ?? 400500, color: '#047857', path: '/GI/ACCOUNTS_REPORTS.aspx' },
          { label: 'Bank Account Balance', val: summary?.cards?.bankBook ?? 1150000, color: '#0369a1', path: '/GI/BANK_REPORTS.aspx' }
        ].map((k, idx) => (
          <div key={idx} className="col-md-2 col-6">
            <div className="p-2 rounded bg-white border h-100 d-flex flex-column justify-content-between" style={{ borderLeft: `4px solid ${k.color}` }}>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{k.label}</div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>
                ৳ {Number(k.val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '11px', color: k.color, fontWeight: 700 }}>Live Synced</div>
            </div>
          </div>
        ))}
      </div>

      {/* Super Admin Quick Multi-Shop & Admin Power Switchboard */}
      {isSuperAdmin && (
        <div className="row g-3 mb-3">
          {/* Active Shops / Branches Panel */}
          <div className="col-md-5">
            <div className="erp-fieldset h-100">
              <div className="erp-legend">
                <span>Active Shops / Branches ({master.branches.length})</span>
                <button className="erp-btn" id="SAVE" onClick={() => navigate('/GI/USERENTRY.aspx?tab=shops')}>
                  + Open New Shop
                </button>
              </div>
              <div className="table-responsive">
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Shop / Branch Name</th>
                      <th>Address</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {master.branches.map((b) => (
                      <tr key={b.branch_id}>
                        <td className="fw-bold">{b.branch_id}</td>
                        <td className="fw-bold">{b.branch_name}</td>
                        <td>{b.address || 'Dhaka'}</td>
                        <td>
                          {session?.branchName === b.branch_name ? (
                            <span className="badge bg-success">Active Shop</span>
                          ) : (
                            <button className="erp-btn" onClick={() => switchShop(b.branch_name)}>
                              Switch Here
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Active Admins & Live Power Matrix Summary */}
          <div className="col-md-7">
            <div className="erp-fieldset h-100">
              <div className="erp-legend">
                <span>Admins &amp; Assigned Power Levels ({master.users.length})</span>
                <button className="erp-btn" id="SAVE" onClick={() => navigate('/GI/USERENTRY.aspx')}>
                  Configure Admin Powers &amp; Add Admin
                </button>
              </div>
              <div className="table-responsive" style={{ maxHeight: '210px', overflowY: 'auto' }}>
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Admin ID</th>
                      <th>Name</th>
                      <th>Assigned Shop</th>
                      <th>Role / Power Level</th>
                      <th>Allowed Options</th>
                      <th>Instant Test / Edit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {master.users.map((u) => {
                      const p = u.permissions || {};
                      const count = p.all || p.routes?.includes('*') ? ALL_ROUTES_COUNT : (p.routes?.length || 0);
                      return (
                        <tr key={u.user_id}>
                          <td className="fw-bold">{u.user_id}</td>
                          <td>{u.user_name}</td>
                          <td>{u.operate_company || 'HAZI TRADERS'}</td>
                          <td>
                            <span className={`badge ${p.all ? 'bg-success' : 'bg-primary'}`}>
                              {p.roleLabel || (u.permission_type === 'A' ? 'Super Admin' : 'Custom Admin')}
                            </span>
                          </td>
                          <td className="fw-bold">{count} / {ALL_ROUTES_COUNT} pages</td>
                          <td className="d-flex gap-1">
                            <button
                              className="erp-btn"
                              onClick={() => navigate(`/GI/USERENTRY.aspx?editUser=${encodeURIComponent(u.user_id)}`)}
                            >
                              Edit Power
                            </button>
                            {session?.userId?.toLowerCase() !== u.user_id.toLowerCase() && (
                              <button
                                className="erp-btn"
                                style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' }}
                                onClick={() => switchAccount(u.user_id, u.operate_company)}
                              >
                                Login as {u.user_id}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permitted Modules & Options Workspace Directory for Current Logged-in Admin */}
      <div className="erp-fieldset">
        <div className="erp-legend">
          <span>Your Permitted Modules &amp; Operations ({permittedOptionsCount} Active Options for {session?.userName})</span>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
            Only options granted to your Admin ID are visible below and in the top menu bar
          </span>
        </div>

        <div className="row g-3">
          {permittedModules.map((mod) => (
            <div key={mod.label} className="col-md-4 col-lg-3">
              <div className="border rounded p-2 h-100" style={{ backgroundColor: '#f8fafc' }}>
                <div className="d-flex justify-content-between align-items-center pb-1 mb-2 border-bottom">
                  <span className="fw-bold" style={{ fontSize: '14px', color: '#0f172a' }}>{mod.label}</span>
                  <span className="badge bg-secondary">{mod.items.length}</span>
                </div>
                <div className="d-flex flex-column gap-1">
                  {mod.items.map((sub) => (
                    <Link
                      key={sub.path}
                      to={sub.path}
                      className="text-decoration-none px-2 py-1 rounded d-flex justify-content-between align-items-center"
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        color: '#1e293b',
                        fontSize: '12.5px',
                        fontWeight: 600
                      }}
                    >
                      <span>{sub.label}</span>
                      <span style={{ color: '#0d9488' }}>→</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
