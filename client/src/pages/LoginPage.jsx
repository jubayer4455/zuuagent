import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useErp } from '../context/ErpContext.jsx';

export function LoginPage() {
  const { login } = useErp();
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
    document.title = 'Software Login';
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

  return (
    <div className="login-body-bg">
      <div className="login-card">
        <form id="form1" onSubmit={handleSubmit}>
          <div className="text-center">
            <span id="Label6" style={{ fontFamily: 'Arial Narrow', fontSize: '20px', color: '#444' }}>
              {greeting}
            </span>
          </div>

          <div className="text-center p-2">
            <img
              style={{ width: '100px', height: '100px', backgroundColor: '#fff' }}
              className="shadow-lg rounded-circle p-1 mb-3"
              src="/IMAGE/unisoft.svg"
              alt="Unisoft Technology"
            />
          </div>

          <div className="mb-1">
            <span id="Label5" style={{ fontFamily: 'Arial Narrow', fontSize: '16px', color: '#444' }}>
              Company Name
            </span>
          </div>
          <div className="mb-2">
            <select
              name="COMPANY_MASTER"
              id="COMPANY_MASTER"
              className="login-select"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            >
              <option value=""></option>
              <option value="HAZI TRADERS">HAZI TRADERS</option>
            </select>
          </div>

          <div className="mb-1">
            <span id="LCOMPANY_NAME" style={{ fontFamily: 'Arial Narrow', fontSize: '16px', color: '#444' }}>
              Branch Name
            </span>
          </div>
          <div className="mb-2">
            <select
              name="DropDownListCompanyName"
              id="DropDownListCompanyName"
              className="login-select"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
            >
              <option value=""></option>
              {branches.map((b) => (
                <option key={b.branch_id} value={b.branch_name}>
                  {b.branch_name}
                </option>
              ))}
            </select>
          </div>

          <div className="login-input-wrap">
            <span className="login-floating-label">Enter User ID</span>
            <input
              name="USER_ID"
              type="text"
              id="USER_ID"
              className="login-input"
              autoComplete="off"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              autoFocus
            />
          </div>

          <div className="login-input-wrap">
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

          <div className="mt-3">
            <input
              type="submit"
              name="SAVE"
              value="LOGIN"
              id="SAVE"
              className="login-btn"
            />
          </div>

          <div className="mt-3">
            {message && (
              <div id="MESSAGE" style={{ fontFamily: 'Arial Narrow', color: '#dc3545', fontWeight: 'bold', marginBottom: '4px' }}>
                {message}
              </div>
            )}
            <span id="Label4" style={{ fontFamily: 'Arial Narrow', fontSize: '15.5px', color: '#444' }}>
              Management: 01818524712, 01402338209
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}

export function TreeDashboardPage() {
  useEffect(() => {
    document.title = 'Dash Board || WebMaster';
  }, []);

  return <div style={{ minHeight: 'calc(100vh - 55px)' }} />;
}
