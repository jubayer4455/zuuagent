import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useErp, getTodayStr } from '../context/ErpContext.jsx';
import AutocompleteInput from '../components/AutocompleteInput.jsx';
import { MENU_TREE, ALL_ROUTES_COUNT } from '../components/Layout.jsx';
import { scanBakFile, uploadMappedBakToServer } from '../utils/bakRestore.js';

const ACCOUNT_GROUPS = [
  { id: 'AG01', name: 'CAPITAL ACCOUNT' },
  { id: 'AG02', name: 'CURRENT ASSET' },
  { id: 'AG03', name: 'CURRENT LIABILITY' },
  { id: 'AG04', name: 'DIRECT EXPENSES' },
  { id: 'AG05', name: 'DIRECT INCOME' },
  { id: 'AG06', name: 'FIXED ASSETS' },
  { id: 'AG07', name: 'INDIRECT EXPENSES' },
  { id: 'AG08', name: 'INDIRECT INCOME' },
  { id: 'AG09', name: 'INVESTMENT' },
  { id: 'AG10', name: 'LOANS & LIABILITY' }
];

// 9. ACCOUNTSUBSGROUP.aspx — Account Sub Group
export function AccountSubGroupPage() {
  const { master, refreshMaster, notify } = useErp();
  const navigate = useNavigate();
  const [groupId, setGroupId] = useState('');
  const [groupName, setGroupName] = useState('');
  const [subGroupId, setSubGroupId] = useState('');
  const [subGroupName, setSubGroupName] = useState('');

  useEffect(() => {
    document.title = 'Accounts Sub-Group';
    setSubGroupId(master.nextIds?.accountSubGroup || 'ASG006');
  }, [master.nextIds?.accountSubGroup]);

  const handleClear = () => {
    setGroupId('');
    setGroupName('');
    setSubGroupId(master.nextIds?.accountSubGroup || 'ASG006');
    setSubGroupName('');
  };

  const handleAction = async (action) => {
    if (!subGroupName.trim() || !groupName) return notify('Select Accounts Group and enter Sub Group Name', 'error');
    const res = await fetch('/api/setup/account-sub-group', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, sub_group_id: subGroupId, sub_group_name: subGroupName, group_id: groupId, group_name: groupName })
    });
    const data = await res.json();
    if (data.ok) {
      notify(data.message);
      await refreshMaster();
      handleClear();
    }
  };

  return (
    <div className="erp-container erp-container-narrow">
      <fieldset className="erp-fieldset">
        <legend className="erp-legend">Account Sub Group</legend>
        <div className="row g-2 align-items-center mb-2">
          <div className="col-md-2"><label className="erp-label">Accounts Group ID</label></div>
          <div className="col-md-4"><input id="ACCOUNTS_GROUP_ID" className="erp-input" value={groupId} readOnly disabled /></div>
          <div className="col-md-2"><label className="erp-label">Accounts Group Name</label></div>
          <div className="col-md-4">
            <select
              id="DropDownAccGoupName"
              className="erp-select"
              value={groupName}
              onChange={(e) => {
                const found = ACCOUNT_GROUPS.find(g => g.name === e.target.value);
                setGroupName(e.target.value);
                setGroupId(found ? found.id : '');
              }}
            >
              <option value=""></option>
              {ACCOUNT_GROUPS.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
            </select>
          </div>
        </div>
        <div className="row g-2 align-items-center mb-3">
          <div className="col-md-2"><label className="erp-label">Acc. Sub Group ID</label></div>
          <div className="col-md-4"><input id="ACC_SUB_GROUP_ID" className="erp-input" value={subGroupId} readOnly disabled /></div>
          <div className="col-md-2"><label className="erp-label">Acc. Sub Group Name</label></div>
          <div className="col-md-4">
            <AutocompleteInput
              id="ACC_SUB_GROUP_NAME"
              value={subGroupName}
              onChange={setSubGroupName}
              options={master.accountSubGroups}
              labelKey="sub_group_name"
              subKey="group_name"
              onSelect={(sg) => {
                setSubGroupId(sg.sub_group_id);
                setSubGroupName(sg.sub_group_name);
                setGroupId(sg.group_id);
                setGroupName(sg.group_name);
              }}
            />
          </div>
        </div>
        <div className="d-flex gap-2">
          <button id="Button1" className="erp-btn" onClick={() => handleAction('save')}>Save</button>
          <button id="EDIT" className="erp-btn" onClick={() => handleAction('save')}>Edit</button>
          <button id="DELETE" className="erp-btn" onClick={() => handleAction('delete')}>Delete</button>
          <button id="CLEAR" className="erp-btn" onClick={handleClear}>Clear</button>
          <button id="EXIT" className="erp-btn" onClick={() => navigate('/GI/TREE.aspx')}>Exit</button>
        </div>
      </fieldset>
    </div>
  );
}

// 10. ACCOUNTSLEDGER.aspx — Account Ledger
export function AccountLedgerPage() {
  const { master, refreshMaster, notify } = useErp();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    sub_group_id: '', sub_group_name: '',
    accounts_id: '', accounts_name: '',
    balance: '0', active: 'Y'
  });

  useEffect(() => {
    document.title = 'Accounts Ledger Setup';
    setForm(f => ({ ...f, accounts_id: f.accounts_id || master.nextIds?.accountLedger || 'ACC0007' }));
  }, [master.nextIds?.accountLedger]);

  const handleClear = () => {
    setForm({
      sub_group_id: '', sub_group_name: '',
      accounts_id: master.nextIds?.accountLedger || 'ACC0007', accounts_name: '',
      balance: '0', active: 'Y'
    });
  };

  const handleAction = async (action) => {
    if (!form.accounts_name.trim()) return notify('Please input Accounts Name', 'error');
    const res = await fetch('/api/setup/account-ledger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, action })
    });
    const data = await res.json();
    if (data.ok) {
      notify(data.message);
      await refreshMaster();
      handleClear();
    }
  };

  return (
    <div className="erp-container erp-container-narrow">
      <fieldset className="erp-fieldset">
        <legend className="erp-legend">Account Ledger</legend>
        <div className="row g-2 align-items-center mb-2">
          <div className="col-md-2"><label className="erp-label">Accounts Sub Group ID</label></div>
          <div className="col-md-4"><input id="ACC_SUB_GROUP_ID" className="erp-input" value={form.sub_group_id} readOnly disabled /></div>
          <div className="col-md-2"><label className="erp-label">Accounts Sub Group Name</label></div>
          <div className="col-md-4">
            <AutocompleteInput
              id="MainContent_ACC_SUB_NAME"
              value={form.sub_group_name}
              onChange={(v) => setForm({ ...form, sub_group_name: v })}
              options={master.accountSubGroups}
              labelKey="sub_group_name"
              subKey="sub_group_id"
              onSelect={(sg) => setForm({ ...form, sub_group_id: sg.sub_group_id, sub_group_name: sg.sub_group_name })}
            />
          </div>
        </div>
        <div className="row g-2 align-items-center mb-2">
          <div className="col-md-2"><label className="erp-label">Accounts ID</label></div>
          <div className="col-md-4"><input id="ACCOUNTS_ID" className="erp-input" value={form.accounts_id} readOnly disabled /></div>
          <div className="col-md-2"><label className="erp-label">Accounts Name</label></div>
          <div className="col-md-4">
            <AutocompleteInput
              id="ACCOUNTS_NAME"
              value={form.accounts_name}
              onChange={(v) => setForm({ ...form, accounts_name: v })}
              options={master.accountLedgers}
              labelKey="accounts_name"
              subKey="sub_group_name"
              onSelect={(l) => setForm({
                sub_group_id: l.sub_group_id,
                sub_group_name: l.sub_group_name,
                accounts_id: l.accounts_id,
                accounts_name: l.accounts_name,
                balance: l.balance,
                active: l.active || 'Y'
              })}
            />
          </div>
        </div>
        <div className="row g-2 align-items-center mb-3">
          <div className="col-md-2"><label className="erp-label">Balance</label></div>
          <div className="col-md-4"><input id="TBALANCE" className="erp-input" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} /></div>
          <div className="col-md-2"><label className="erp-label">Active</label></div>
          <div className="col-md-4">
            <select id="DropDownActive" className="erp-select" value={form.active} onChange={(e) => setForm({ ...form, active: e.target.value })}>
              <option value="Y">Yes</option>
              <option value="N">No</option>
            </select>
          </div>
        </div>
        <div className="d-flex gap-2">
          <button id="Button1" className="erp-btn" onClick={() => handleAction('save')}>Save</button>
          <button id="EDIT" className="erp-btn" onClick={() => handleAction('save')}>Edit</button>
          <button id="DELETE" className="erp-btn" onClick={() => handleAction('delete')}>Delete</button>
          <button id="CLEAR" className="erp-btn" onClick={handleClear}>Clear</button>
          <button id="EXIT" className="erp-btn" onClick={() => navigate('/GI/TREE.aspx')}>Exit</button>
        </div>
      </fieldset>
    </div>
  );
}

// 11. BANK.aspx — Bank Information
export function BankPage() {
  const { master, refreshMaster, notify, openPrint } = useErp();
  const navigate = useNavigate();
  const [bankId, setBankId] = useState('BK004');
  const [bankName, setBankName] = useState('');
  const [active, setActive] = useState('Y');

  useEffect(() => {
    document.title = 'Bank Information';
    setBankId(master.nextIds?.bank || 'BK004');
  }, [master.nextIds?.bank]);

  const handleClear = () => {
    setBankId(master.nextIds?.bank || 'BK004');
    setBankName('');
    setActive('Y');
  };

  const handleAction = async (action) => {
    if (!bankName.trim()) return notify('Please input Bank Name', 'error');
    const res = await fetch('/api/setup/bank', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, bank_id: bankId, bank_name: bankName, active })
    });
    const data = await res.json();
    if (data.ok) {
      notify(data.message);
      await refreshMaster();
      handleClear();
    }
  };

  return (
    <div className="erp-container erp-container-narrow">
      <fieldset className="erp-fieldset">
        <legend className="erp-legend">Bank Information</legend>
        <div className="row g-2 align-items-center mb-2">
          <div className="col-md-2"><label className="erp-label">Bank ID</label></div>
          <div className="col-md-4"><input id="BANK_ID" className="erp-input" value={bankId} readOnly disabled /></div>
          <div className="col-md-2"><label className="erp-label">Bank Name</label></div>
          <div className="col-md-4">
            <AutocompleteInput
              id="BANK_NAME"
              value={bankName}
              onChange={setBankName}
              options={master.banks}
              labelKey="bank_name"
              subKey="bank_id"
              onSelect={(b) => {
                setBankId(b.bank_id);
                setBankName(b.bank_name);
                setActive(b.active || 'Y');
              }}
            />
          </div>
        </div>
        <div className="row g-2 align-items-center mb-3">
          <div className="col-md-2"><label className="erp-label">Active</label></div>
          <div className="col-md-4">
            <select id="DropDownList1" className="erp-select" value={active} onChange={(e) => setActive(e.target.value)}>
              <option value="Y">Yes</option>
              <option value="N">No</option>
            </select>
          </div>
        </div>
        <div className="d-flex gap-2">
          <button id="Button2" className="erp-btn" onClick={() => handleAction('save')}>Save</button>
          <button id="PRINT" className="erp-btn" onClick={() => openPrint({
            title: 'Bank Master List',
            columns: ['SL', 'Bank ID', 'Bank Name', 'Active'],
            rows: master.banks.map((b, i) => [i + 1, b.bank_id, b.bank_name, b.active])
          })}>Print</button>
          <button id="EDIT" className="erp-btn" onClick={() => handleAction('save')}>Edit</button>
          <button id="DELETE" className="erp-btn" onClick={() => handleAction('delete')}>Delete</button>
          <button id="CLEAR" className="erp-btn" onClick={handleClear}>Clear</button>
          <button id="EXIT" className="erp-btn" onClick={() => navigate('/GI/TREE.aspx')}>Exit</button>
        </div>
      </fieldset>
    </div>
  );
}

// 12. BANKBRANCH.aspx — Bank Account Information
export function BankAccountPage() {
  const { master, refreshMaster, notify } = useErp();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    bank_id: '', bank_name: '',
    bk_br_id: '', branch_name: '',
    address: '', routing_no: '',
    contact_person: '', contact_no: '',
    email: '', account_no: '',
    balance: '0', active: 'Y', account_type: 'GENARAL'
  });

  useEffect(() => {
    document.title = 'Bank Account Information';
    setForm(f => ({ ...f, bk_br_id: f.bk_br_id || master.nextIds?.bankAccount || 'BKB004' }));
  }, [master.nextIds?.bankAccount]);

  const handleClear = () => {
    setForm({
      bank_id: '', bank_name: '',
      bk_br_id: master.nextIds?.bankAccount || 'BKB004', branch_name: '',
      address: '', routing_no: '',
      contact_person: '', contact_no: '',
      email: '', account_no: '',
      balance: '0', active: 'Y', account_type: 'GENARAL'
    });
  };

  const handleAction = async (action) => {
    if (!form.account_no.trim() || !form.bank_name.trim()) return notify('Please input Bank Name and Account No.', 'error');
    const res = await fetch('/api/setup/bank-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, action })
    });
    const data = await res.json();
    if (data.ok) {
      notify(data.message);
      await refreshMaster();
      handleClear();
    }
  };

  return (
    <div className="erp-container">
      <fieldset className="erp-fieldset">
        <legend className="erp-legend">Bank Account Information</legend>
        <div className="row g-2 align-items-center mb-2">
          <div className="col-md-2"><label className="erp-label">Bank ID</label></div>
          <div className="col-md-2"><input id="BANK_ID" className="erp-input" value={form.bank_id} readOnly disabled /></div>
          <div className="col-md-2"><label className="erp-label">Bank Name</label></div>
          <div className="col-md-6">
            <AutocompleteInput
              id="BANK_NAME"
              value={form.bank_name}
              onChange={(v) => setForm({ ...form, bank_name: v })}
              options={master.banks}
              labelKey="bank_name"
              subKey="bank_id"
              onSelect={(b) => setForm({ ...form, bank_id: b.bank_id, bank_name: b.bank_name })}
            />
          </div>
        </div>
        <div className="row g-2 align-items-center mb-2">
          <div className="col-md-2"><label className="erp-label">Bank Branch ID</label></div>
          <div className="col-md-2"><input id="BK_BR_ID" className="erp-input" value={form.bk_br_id} readOnly disabled /></div>
          <div className="col-md-2"><label className="erp-label">Branch Name</label></div>
          <div className="col-md-6">
            <AutocompleteInput
              id="BK_BR_NAME"
              value={form.branch_name}
              onChange={(v) => setForm({ ...form, branch_name: v })}
              options={master.bankAccounts}
              labelKey="branch_name"
              subKey="account_no"
              onSelect={(ba) => setForm({
                bank_id: ba.bank_id, bank_name: ba.bank_name,
                bk_br_id: ba.bk_br_id, branch_name: ba.branch_name,
                address: ba.address, routing_no: ba.routing_no,
                contact_person: ba.contact_person, contact_no: ba.contact_no,
                email: ba.email, account_no: ba.account_no,
                balance: ba.balance, active: ba.active || 'Y', account_type: ba.account_type || 'GENARAL'
              })}
            />
          </div>
        </div>
        <div className="row g-2 align-items-center mb-2">
          <div className="col-md-2"><label className="erp-label">Address</label></div>
          <div className="col-md-4"><input id="TAddress" className="erp-input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div className="col-md-2"><label className="erp-label">Routing No.</label></div>
          <div className="col-md-4"><input id="TRouting_No" className="erp-input" value={form.routing_no} onChange={(e) => setForm({ ...form, routing_no: e.target.value })} /></div>
        </div>
        <div className="row g-2 align-items-center mb-2">
          <div className="col-md-2"><label className="erp-label">Contact Person</label></div>
          <div className="col-md-3"><input id="TContact_Person" className="erp-input" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Contact No.</label></div>
          <div className="col-md-2"><input id="TContact_No" className="erp-input" value={form.contact_no} onChange={(e) => setForm({ ...form, contact_no: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Email</label></div>
          <div className="col-md-3"><input id="TEmail" className="erp-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        </div>
        <div className="row g-2 align-items-center mb-3">
          <div className="col-md-2"><label className="erp-label">Account No.</label></div>
          <div className="col-md-3">
            <AutocompleteInput
              id="Taccount_no"
              value={form.account_no}
              onChange={(v) => setForm({ ...form, account_no: v })}
              options={master.bankAccounts}
              labelKey="account_no"
              subKey="bank_name"
              onSelect={(ba) => setForm({ ...ba })}
            />
          </div>
          <div className="col-md-1"><label className="erp-label">Account Type</label></div>
          <div className="col-md-2">
            <select id="ACC_TYPE" className="erp-select" value={form.account_type} onChange={(e) => setForm({ ...form, account_type: e.target.value })}>
              <option value="GENARAL">GENARAL A/C</option>
              <option value="LOAN">LOAN A/C</option>
              <option value="CARD">CARD A/C</option>
              <option value="MOBILE">MOBILE BANKING</option>
            </select>
          </div>
          <div className="col-md-1"><label className="erp-label">Balance</label></div>
          <div className="col-md-1"><input id="Tbalance" className="erp-input" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Active</label></div>
          <div className="col-md-1">
            <select id="DropDownListActive" className="erp-select" value={form.active} onChange={(e) => setForm({ ...form, active: e.target.value })}>
              <option value="Y">Yes</option>
              <option value="N">No</option>
            </select>
          </div>
        </div>
        <div className="d-flex gap-2">
          <button id="Button2" className="erp-btn" onClick={() => handleAction('save')}>Save</button>
          <button id="EDIT" className="erp-btn" onClick={() => handleAction('save')}>Edit</button>
          <button id="ACC_NO_EDIT" className="erp-btn" onClick={() => handleAction('save')}>Acc.No.Edit</button>
          <button id="DELETE" className="erp-btn" onClick={() => handleAction('delete')}>Delete</button>
          <button id="CLEAR" className="erp-btn" onClick={handleClear}>Clear</button>
          <button id="EXIT" className="erp-btn" onClick={() => navigate('/GI/TREE.aspx')}>Exit</button>
        </div>
      </fieldset>
    </div>
  );
}

// 13. CHQUE_ENTRY.aspx — Cheque Book Entry
export function ChequeBookEntryPage() {
  const { master, refreshMaster, notify } = useErp();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    bank_id: '', bank_name: '',
    bk_br_id: '', branch_name: '',
    account_no: '',
    mode: 'single',
    serial_comm: '',
    serial_from: '',
    serial_to: ''
  });

  useEffect(() => {
    document.title = 'Cheque Book Entry';
  }, []);

  const totalCount = form.mode === 'single'
    ? (form.serial_comm ? 1 : 0)
    : Math.max(0, (parseInt(form.serial_to, 10) - parseInt(form.serial_from, 10) + 1) || 0);

  const handleSave = async () => {
    if (!form.account_no) return notify('Please select Account No.', 'error');
    const res = await fetch('/api/setup/cheque-book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (data.ok) {
      notify(data.message);
      await refreshMaster();
    }
  };

  return (
    <div className="erp-container erp-container-narrow">
      <fieldset className="erp-fieldset">
        <legend className="erp-legend">Cheque Book Entry</legend>
        <div className="row g-2 align-items-center mb-2">
          <div className="col-md-2"><label className="erp-label">Bsnk ID</label></div>
          <div className="col-md-3"><input id="BANK_ID" className="erp-input" value={form.bank_id} readOnly disabled /></div>
          <div className="col-md-2"><label className="erp-label">Bank Name</label></div>
          <div className="col-md-5">
            <AutocompleteInput
              id="BANK_NAME"
              value={form.bank_name}
              onChange={(v) => setForm({ ...form, bank_name: v })}
              options={master.banks}
              labelKey="bank_name"
              onSelect={(b) => setForm({ ...form, bank_id: b.bank_id, bank_name: b.bank_name })}
            />
          </div>
        </div>
        <div className="row g-2 align-items-center mb-2">
          <div className="col-md-2"><label className="erp-label">Bank Branch ID</label></div>
          <div className="col-md-3"><input id="BK_BR_ID" className="erp-input" value={form.bk_br_id} readOnly disabled /></div>
          <div className="col-md-2"><label className="erp-label">Branch Name</label></div>
          <div className="col-md-5">
            <AutocompleteInput
              id="BRANCH_NAME"
              value={form.branch_name}
              onChange={(v) => setForm({ ...form, branch_name: v })}
              options={master.bankAccounts}
              labelKey="branch_name"
              subKey="account_no"
              onSelect={(ba) => setForm({ ...form, bank_id: ba.bank_id, bank_name: ba.bank_name, bk_br_id: ba.bk_br_id, branch_name: ba.branch_name, account_no: ba.account_no })}
            />
          </div>
        </div>
        <div className="row g-2 align-items-center mb-2">
          <div className="col-md-2"><label className="erp-label">Account No.</label></div>
          <div className="col-md-4">
            <AutocompleteInput
              id="ACC_NO"
              value={form.account_no}
              onChange={(v) => setForm({ ...form, account_no: v })}
              options={master.bankAccounts}
              labelKey="account_no"
              subKey="bank_name"
              onSelect={(ba) => setForm({ ...form, bank_id: ba.bank_id, bank_name: ba.bank_name, bk_br_id: ba.bk_br_id, branch_name: ba.branch_name, account_no: ba.account_no })}
            />
          </div>
          <div className="col-md-6 d-flex gap-3">
            <label className="erp-label d-flex align-items-center gap-1">
              <input id="RadioButtonList2_0" type="radio" name="chqMode" checked={form.mode === 'single'} onChange={() => setForm({ ...form, mode: 'single' })} />
              Single Serial
            </label>
            <label className="erp-label d-flex align-items-center gap-1">
              <input id="RadioButtonList2_1" type="radio" name="chqMode" checked={form.mode === 'seq'} onChange={() => setForm({ ...form, mode: 'seq' })} />
              Sequantional Serial
            </label>
          </div>
        </div>
        <div className="row g-2 align-items-center mb-3">
          <div className="col-md-2"><label className="erp-label">Serial Comm/Single</label></div>
          <div className="col-md-2"><input id="Tserial_comm" className="erp-input" value={form.serial_comm} onChange={(e) => setForm({ ...form, serial_comm: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Serial From</label></div>
          <div className="col-md-2"><input id="Tserial_From" className="erp-input" value={form.serial_from} disabled={form.mode === 'single'} onChange={(e) => setForm({ ...form, serial_from: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Seria To.</label></div>
          <div className="col-md-2"><input id="Tserial_To" className="erp-input" value={form.serial_to} disabled={form.mode === 'single'} onChange={(e) => setForm({ ...form, serial_to: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Total Cheque No.</label></div>
          <div className="col-md-1"><input id="Total" className="erp-input" value={totalCount} disabled /></div>
        </div>
        <div className="d-flex gap-2">
          <button id="ORDERBYDESC" className="erp-btn" onClick={() => notify('Ordered by Cheque No. Descending')}>Order by Cheque No.</button>
          <button id="Button2" className="erp-btn" onClick={handleSave}>Save</button>
          <button id="CLEAR" className="erp-btn" onClick={() => setForm({ bank_id: '', bank_name: '', bk_br_id: '', branch_name: '', account_no: '', mode: 'single', serial_comm: '', serial_from: '', serial_to: '' })}>Clear</button>
          <button id="EXIT" className="erp-btn" onClick={() => navigate('/GI/TREE.aspx')}>Exit</button>
        </div>
      </fieldset>
    </div>
  );
}

// 14. USERENTRY.aspx — Admin, Power & Multi-Shop Control Center
const ALL_ROUTE_PATHS = MENU_TREE.flatMap(m => m.items.map(i => i.path));

const ROLE_PRESETS = {
  SUPER_ADMIN: {
    all: true,
    roleLabel: 'Super Admin (Full Power)',
    actions: { create: true, edit: true, delete: true, print: true, manageAdmins: true, manageShops: true },
    routes: [...ALL_ROUTE_PATHS]
  },
  SHOP_MANAGER: {
    all: false,
    roleLabel: 'Branch / Shop Manager',
    actions: { create: true, edit: true, delete: false, print: true, manageAdmins: false, manageShops: false },
    routes: [
      '/GI/CSGROUP.aspx', '/GI/CUSTOMERINFORMATION.aspx', '/GI/PRODUCTINFORMATION.aspx', '/GI/PRICE_SETUP.aspx',
      '/GI/DAILY_BUSINESS.aspx', '/GI/PURCHASE.aspx', '/GI/PRICEQUOTATION.aspx', '/GI/SALES.aspx',
      '/GI/SERIAL_SEARCH.aspx', '/GI/MOBILE_SEARCH.aspx', '/GI/DATE_WISE_BILL_SEARCH.aspx',
      '/GI/STOCK_TR_COMM_TO_COMM.aspx', '/GI/STOCK_TR_BR_TO_BR.aspx', '/GI/STOCK_RECEIVED_BR_TO_BR_TR.aspx',
      '/GI/PAYMENT.aspx', '/GI/COLLECTIONS.aspx', '/GI/PURCHASE_REPORTS.aspx', '/GI/SALES_REPORTS.aspx', '/GI/STOCK_REPORTS.aspx'
    ]
  },
  SALES_ADMIN: {
    all: false,
    roleLabel: 'Sales & Billing Admin',
    actions: { create: true, edit: true, delete: false, print: true, manageAdmins: false, manageShops: false },
    routes: [
      '/GI/CUSTOMERINFORMATION.aspx', '/GI/PRICEQUOTATION.aspx', '/GI/SALES.aspx', '/GI/SALES_RETURN.aspx',
      '/GI/SERIAL_SEARCH.aspx', '/GI/MOBILE_SEARCH.aspx', '/GI/DATE_WISE_BILL_SEARCH.aspx', '/GI/SALES_REPORTS.aspx'
    ]
  },
  ACCOUNTS_ADMIN: {
    all: false,
    roleLabel: 'Accounts & Cashier Admin',
    actions: { create: true, edit: true, delete: false, print: true, manageAdmins: false, manageShops: false },
    routes: [
      '/GI/ACCOUNTSUBSGROUP.aspx', '/GI/ACCOUNTSLEDGER.aspx', '/GI/BANK.aspx', '/GI/BANKBRANCH.aspx',
      '/GI/CHQUE_ENTRY.aspx', '/GI/PAYMENT.aspx', '/GI/COLLECTIONS.aspx', '/GI/BANKTRANSCATION.aspx',
      '/GI/JOURNAL.aspx', '/GI/CHEQUE_SEARCH.aspx', '/GI/DATE_WISE_COLLECTION_SEARCH.aspx',
      '/GI/SALARY_PROCESS.aspx', '/GI/BALANCETRANSFER.aspx', '/GI/ACCOUNTS_REPORTS.aspx', '/GI/BANK_REPORTS.aspx'
    ]
  },
  INVENTORY_ADMIN: {
    all: false,
    roleLabel: 'Inventory & Purchase Admin',
    actions: { create: true, edit: true, delete: false, print: true, manageAdmins: false, manageShops: false },
    routes: [
      '/GI/CATEGORY.aspx', '/GI/PRODUCTGROUP.aspx', '/GI/BRAND.aspx', '/GI/PRODUCTINFORMATION.aspx',
      '/GI/PRICE_SETUP.aspx', '/GI/COLOR.aspx', '/GI/PURCHASE.aspx', '/GI/PURCHASE_RETURN.aspx',
      '/GI/STOCK_TR_COMM_TO_COMM.aspx', '/GI/STOCK_TR_BR_TO_BR.aspx', '/GI/STOCK_TR_COMM_TO_RMA.aspx',
      '/GI/STOCK_TR_RMA_TO_COMM.aspx', '/GI/STOCK_RECEIVED_BR_TO_BR_TR.aspx', '/GI/STOCK_REPORTS.aspx'
    ]
  },
  RMA_SERVICE_ADMIN: {
    all: false,
    roleLabel: 'RMA & Service Admin',
    actions: { create: true, edit: true, delete: false, print: true, manageAdmins: false, manageShops: false },
    routes: [
      '/GI/COMPLAIN_RECEIVE.aspx', '/GI/REPLACE_OUT.aspx', '/GI/REPLACE_IN.aspx', '/GI/REPLACEMENT_DELIVERY.aspx',
      '/GI/RMA_SERIAL_SEARCH.aspx', '/GI/SERVICEGROUP.aspx', '/GI/PROBLEMGROUP.aspx', '/GI/SERVICE.aspx',
      '/GI/PROBLEM.aspx', '/GI/SERVICEBILL.aspx', '/GI/RMA_REPORTS.aspx'
    ]
  },
  NONE: {
    all: false,
    roleLabel: 'Restricted Admin (Custom)',
    actions: { create: false, edit: false, delete: false, print: true, manageAdmins: false, manageShops: false },
    routes: []
  }
};

export function UserEntryPage() {
  const { master, refreshMaster, notify, switchAccount, switchShop, session } = useErp();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState('admins');
  const [showPass, setShowPass] = useState(false);

  const [form, setForm] = useState({
    user_id: '', user_name: '', father_name: '', mother_name: '',
    address: '', email: '', mobile: '', opt_mobile: '',
    password: '', repassword: '', new_password: '',
    permission_type: 'U', operate_company: 'HAZI TRADERS', active: 'Y'
  });

  const [perms, setPerms] = useState({
    all: false,
    roleLabel: 'Custom Power Admin',
    actions: { create: true, edit: true, delete: false, print: true, manageAdmins: false, manageShops: false },
    routes: [...ROLE_PRESETS.SALES_ADMIN.routes]
  });

  const [shopForm, setShopForm] = useState({
    branch_id: '',
    branch_name: '',
    address: '',
    phone: '01955541444',
    email: 'info@hazierp.top',
    manager_name: 'JUBAYER AHMED',
    status: 'ACTIVE',
    logo_url: '/IMAGE/hazi-logo.jpg',
    invoice_footer: 'Warranty void if sticker removed or burn/physical damage.'
  });

  const handleShopLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (data.ok) {
      setShopForm(s => ({ ...s, logo_url: data.url }));
      notify('Shop Logo uploaded');
    }
  };

  const selectUserForEdit = useCallback((u) => {
    if (!u) return;
    setForm({
      user_id: u.user_id || '',
      user_name: u.user_name || '',
      father_name: u.father_name || '',
      mother_name: u.mother_name || '',
      address: u.address || '',
      email: u.email || '',
      mobile: u.mobile || '',
      opt_mobile: u.opt_mobile || '',
      password: u.password || '',
      repassword: u.password || '',
      new_password: '',
      permission_type: u.permission_type || 'U',
      operate_company: u.operate_company || 'HAZI TRADERS',
      active: u.active || 'Y'
    });
    const p = u.permissions || {};
    const isAll = Boolean(p.all || (Array.isArray(p.routes) && p.routes.includes('*')));
    setPerms({
      all: isAll,
      roleLabel: p.roleLabel || (isAll ? 'Super Admin (Full Power)' : 'Custom Power Admin'),
      actions: p.actions || { create: true, edit: true, delete: isAll, print: true, manageAdmins: isAll, manageShops: isAll },
      routes: isAll ? [...ALL_ROUTE_PATHS] : (Array.isArray(p.routes) ? [...p.routes] : [])
    });
  }, []);

  useEffect(() => {
    document.title = 'Admin Power, Role & Multi-Shop Control Center';
    const params = new URLSearchParams(location.search);
    if (params.get('tab') === 'shops') {
      setActiveTab('shops');
    }
    const editUserParam = params.get('editUser');
    if (editUserParam && master.users.length > 0) {
      const target = master.users.find(u => u.user_id.toLowerCase() === editUserParam.toLowerCase());
      if (target) selectUserForEdit(target);
    } else if (!form.user_id && master.users.length > 0) {
      const defaultTarget = master.users.find(u => u.user_id === 'shawon') || master.users[0];
      if (defaultTarget) selectUserForEdit(defaultTarget);
    }
  }, [location.search, master.users]);

  const applyPreset = (presetKey) => {
    const p = ROLE_PRESETS[presetKey];
    if (!p) return;
    setPerms({
      all: p.all,
      roleLabel: p.roleLabel,
      actions: { ...p.actions },
      routes: [...p.routes]
    });
    setForm(f => ({ ...f, permission_type: p.all ? 'A' : 'U' }));
  };

  const toggleRoute = (routePath) => {
    const exists = perms.routes.includes(routePath);
    const nextRoutes = exists
      ? perms.routes.filter(r => r !== routePath)
      : [...perms.routes, routePath];
    const isNowAll = nextRoutes.length === ALL_ROUTE_PATHS.length;
    setPerms({
      ...perms,
      all: isNowAll,
      roleLabel: isNowAll ? 'Super Admin (Full Power)' : `Custom Power (${nextRoutes.length} Options)`,
      routes: nextRoutes
    });
    setForm(f => ({ ...f, permission_type: isNowAll ? 'A' : 'U' }));
  };

  const toggleModuleAll = (mod) => {
    const modPaths = mod.items.map(i => i.path);
    const allChecked = modPaths.every(p => perms.routes.includes(p));
    let nextRoutes;
    if (allChecked) {
      nextRoutes = perms.routes.filter(r => !modPaths.includes(r));
    } else {
      const set = new Set([...perms.routes, ...modPaths]);
      nextRoutes = Array.from(set);
    }
    const isNowAll = nextRoutes.length === ALL_ROUTE_PATHS.length;
    setPerms({
      ...perms,
      all: isNowAll,
      roleLabel: isNowAll ? 'Super Admin (Full Power)' : `Custom Power (${nextRoutes.length} Options)`,
      routes: nextRoutes
    });
    setForm(f => ({ ...f, permission_type: isNowAll ? 'A' : 'U' }));
  };

  const handleSaveUserAndPower = async (action = 'save') => {
    if (!form.user_id.trim()) return notify('Please enter Admin / User ID', 'error');
    const payloadPerms = {
      ...perms,
      routes: perms.all ? ['*'] : perms.routes
    };
    const res = await fetch('/api/setup/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        action,
        permissions: payloadPerms
      })
    });
    const data = await res.json();
    if (res.ok && data.ok) {
      notify(data.message);
      await refreshMaster();
    } else {
      notify(data.message || 'Operation failed', 'error');
    }
  };

  const handleShopAction = async (action = 'save', shopOverride = null) => {
    const payload = shopOverride || shopForm;
    const res = await fetch('/api/admin/shops', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, action })
    });
    const data = await res.json();
    if (res.ok && data.ok) {
      notify(data.message);
      await refreshMaster();
      if (action === 'save') {
        setShopForm({ branch_id: '', branch_name: '', address: '', phone: '01818524712', email: 'info@hazierp.top', manager_name: 'JUBAYER AHMED', status: 'ACTIVE' });
      }
    } else {
      notify(data.message || 'Shop operation failed', 'error');
    }
  };

  return (
    <div className="erp-container">
      <fieldset className="erp-fieldset mb-2">
        <legend className="erp-legend">User Information</legend>

        <div className="row g-2 align-items-center mb-1">
          <div className="col-md-2"><label className="erp-label">User ID</label></div>
          <div className="col-md-4">
            <AutocompleteInput
              id="USER_ID"
              value={form.user_id}
              onChange={(v) => setForm({ ...form, user_id: v })}
              options={master.users}
              labelKey="user_id"
              subKey="user_name"
              onSelect={selectUserForEdit}
            />
          </div>
          <div className="col-md-2"><label className="erp-label">User Name</label></div>
          <div className="col-md-4"><input id="TUSER_NAME" className="erp-input" value={form.user_name} onChange={(e) => setForm({ ...form, user_name: e.target.value })} /></div>
        </div>

        <div className="row g-2 align-items-center mb-1">
          <div className="col-md-2"><label className="erp-label">Father Name</label></div>
          <div className="col-md-4"><input id="M_FATHER_NAME" className="erp-input" value={form.father_name} onChange={(e) => setForm({ ...form, father_name: e.target.value })} /></div>
          <div className="col-md-2"><label className="erp-label">Mother Name</label></div>
          <div className="col-md-4"><input id="M_MOTHER_NAME" className="erp-input" value={form.mother_name} onChange={(e) => setForm({ ...form, mother_name: e.target.value })} /></div>
        </div>

        <div className="row g-2 align-items-center mb-1">
          <div className="col-md-2"><label className="erp-label">Address</label></div>
          <div className="col-md-4"><input id="M_ADDRESS" className="erp-input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div className="col-md-2"><label className="erp-label">Email</label></div>
          <div className="col-md-4"><input id="M_EMAIL" className="erp-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        </div>

        <div className="row g-2 align-items-center mb-1">
          <div className="col-md-2"><label className="erp-label">Mobile</label></div>
          <div className="col-md-4"><input id="M_MOBILE" className="erp-input" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /></div>
          <div className="col-md-2"><label className="erp-label">Opt. Mobile</label></div>
          <div className="col-md-4"><input id="OPT_MOBILE" className="erp-input" value={form.opt_mobile} onChange={(e) => setForm({ ...form, opt_mobile: e.target.value })} /></div>
        </div>

        <div className="row g-2 align-items-center mb-1">
          <div className="col-md-2"><label className="erp-label">Permission Type</label></div>
          <div className="col-md-2">
            <select
              id="DropDownUserType"
              className="erp-select"
              value={form.permission_type}
              onChange={(e) => {
                const val = e.target.value;
                setForm({ ...form, permission_type: val });
                if (val === 'A') applyPreset('SUPER_ADMIN');
              }}
            >
              <option value="A">ADMINISTRATOR</option>
              <option value="U">USER</option>
            </select>
          </div>
          <div className="col-md-2"><label className="erp-label">Operate Company</label></div>
          <div className="col-md-2">
            <select id="DropDownCompanyName" className="erp-select" value={form.operate_company} onChange={(e) => setForm({ ...form, operate_company: e.target.value })}>
              <option value=""></option>
              {master.branches.map((b) => (
                <option key={b.branch_id} value={b.branch_name}>{b.branch_name}</option>
              ))}
            </select>
          </div>
          <div className="col-md-2"><label className="erp-label">Active</label></div>
          <div className="col-md-2">
            <select id="DropDownListActive" className="erp-select" value={form.active} onChange={(e) => setForm({ ...form, active: e.target.value })}>
              <option value="Y">Yes</option>
              <option value="N">No</option>
            </select>
          </div>
        </div>

        <div className="row g-2 align-items-center mb-2">
          <div className="col-md-2"><label className="erp-label">Password</label></div>
          <div className="col-md-2"><input id="txtPassword" type={showPass ? 'text' : 'password'} className="erp-input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Re Password</label></div>
          <div className="col-md-2"><input id="REPASSWORD" type={showPass ? 'text' : 'password'} className="erp-input" value={form.repassword} onChange={(e) => setForm({ ...form, repassword: e.target.value })} /></div>
          <div className="col-md-1">
            <label className="erp-label d-flex align-items-center gap-1">
              <input id="MainContent_CheckBox1" type="checkbox" checked={showPass} onChange={(e) => setShowPass(e.target.checked)} />
              Show
            </label>
          </div>
          <div className="col-md-1"><label className="erp-label">New Password</label></div>
          <div className="col-md-3"><input id="CHANGE_PASSWORD" type="text" className="erp-input" value={form.new_password} onChange={(e) => setForm({ ...form, new_password: e.target.value })} /></div>
        </div>

        <div className="d-flex flex-wrap gap-1 mb-2">
          <button type="button" id="SAVE" className="erp-btn" onClick={() => handleSaveUserAndPower('save')}>Save / Add Admin</button>
          <button type="button" id="EDIT" className="erp-btn" onClick={() => handleSaveUserAndPower('save_permissions')}>Edit / Save Power</button>
          <button type="button" id="CHANGE_PASS" className="erp-btn" onClick={() => handleSaveUserAndPower('change_password')}>Change Password</button>
          <button type="button" id="DELETE" className="erp-btn" onClick={() => handleSaveUserAndPower('delete')}>Delete Admin</button>
          {form.user_id && (
            <button
              type="button"
              className="erp-btn"
              onClick={async () => {
                await handleSaveUserAndPower('save_permissions');
                const r = await switchAccount(form.user_id, form.operate_company);
                if (r.ok) navigate('/GI/TREE.aspx');
              }}
            >
              Login as {form.user_id}
            </button>
          )}
          <button type="button" id="MainContent_CLEAR" className="erp-btn" onClick={() => setForm({ user_id: '', user_name: '', father_name: '', mother_name: '', address: '', email: '', mobile: '', opt_mobile: '', password: '', repassword: '', new_password: '', permission_type: 'U', operate_company: 'HAZI TRADERS', active: 'Y' })}>Clear</button>
          <button
            type="button"
            className="erp-btn fw-bold"
            style={{ background: '#e7f1ff', borderColor: '#0d6efd', color: '#0b5ed7' }}
            onClick={() => navigate('/GI/DATABASEBACKUP.aspx')}
          >
            Upload Old Site .Bak Data
          </button>
          <button type="button" id="MainContent_EXIT" className="erp-btn" onClick={() => navigate('/GI/TREE.aspx')}>Exit</button>
        </div>

        {/* Admin Power Checkboxes (Power Increase / Decrease) */}
        <div className="erp-sublegend">
          Admin Power Setup for "{form.user_name || form.user_id || 'New Admin'}" ({perms.all ? ALL_ROUTES_COUNT : perms.routes.length}/{ALL_ROUTES_COUNT} Options Active)
        </div>
        <div className="d-flex flex-wrap gap-1 mb-2">
          <button type="button" className="erp-btn" onClick={() => applyPreset('SUPER_ADMIN')}>All Power (57)</button>
          <button type="button" className="erp-btn" onClick={() => applyPreset('SHOP_MANAGER')}>Shop Manager (19)</button>
          <button type="button" className="erp-btn" onClick={() => applyPreset('SALES_ADMIN')}>Sales Admin (8)</button>
          <button type="button" className="erp-btn" onClick={() => applyPreset('ACCOUNTS_ADMIN')}>Accounts Admin (15)</button>
          <button type="button" className="erp-btn" onClick={() => applyPreset('INVENTORY_ADMIN')}>Purchase &amp; Stock (14)</button>
          <button type="button" className="erp-btn" onClick={() => applyPreset('RMA_SERVICE_ADMIN')}>RMA &amp; Servicing (11)</button>
          <button type="button" className="erp-btn" onClick={() => applyPreset('NONE')}>Uncheck All (0)</button>
        </div>

        <div className="row g-1 mb-2" style={{ maxHeight: '230px', overflowY: 'auto', border: '1px solid #ced4da', padding: '6px', backgroundColor: '#f8f9fa' }}>
          {MENU_TREE.map((mod) => {
            const modPaths = mod.items.map(i => i.path);
            const checkedInMod = modPaths.filter(p => perms.routes.includes(p)).length;
            const allChecked = checkedInMod === modPaths.length;
            return (
              <div key={mod.label} className="col-md-3 col-6">
                <div className="border p-1 h-100" style={{ backgroundColor: '#fff' }}>
                  <label className="erp-label d-flex align-items-center justify-content-between border-bottom pb-1 mb-1" style={{ cursor: 'pointer', backgroundColor: '#cfe2ff', padding: '2px 5px' }}>
                    <span>
                      <input type="checkbox" className="me-1" checked={allChecked} onChange={() => toggleModuleAll(mod)} />
                      {mod.label}
                    </span>
                    <span>({checkedInMod}/{modPaths.length})</span>
                  </label>
                  {mod.items.map((sub) => (
                    <label key={sub.path} className="d-flex align-items-center gap-1" style={{ fontSize: '12px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={perms.routes.includes(sub.path)}
                        onChange={() => toggleRoute(sub.path)}
                      />
                      <span>{sub.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* All Admins List Table */}
        <div className="erp-grid-box mb-2" style={{ minHeight: '125px', maxHeight: '165px' }}>
          <table className="erp-table">
            <thead>
              <tr>
                <th>SL</th>
                <th>User ID</th>
                <th>User Name</th>
                <th>Password</th>
                <th>Shop / Branch</th>
                <th>Power Count</th>
                <th>Select / Edit Power</th>
                <th>Test Login</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {master.users.map((u, idx) => {
                const p = u.permissions || {};
                const isAll = Boolean(p.all || p.routes?.includes('*'));
                const count = isAll ? ALL_ROUTES_COUNT : (p.routes?.length || 0);
                return (
                  <tr key={u.user_id}>
                    <td>{idx + 1}</td>
                    <td>{u.user_id}</td>
                    <td>{u.user_name}</td>
                    <td>{u.password}</td>
                    <td>{u.operate_company || 'HAZI TRADERS'}</td>
                    <td>{count} / {ALL_ROUTES_COUNT} Options</td>
                    <td><button type="button" className="erp-btn" onClick={() => selectUserForEdit(u)}>Select / Power</button></td>
                    <td>
                      <button
                        type="button"
                        className="erp-btn"
                        onClick={async () => {
                          const r = await switchAccount(u.user_id, u.operate_company);
                          if (r.ok) navigate('/GI/TREE.aspx');
                        }}
                      >
                        Login as {u.user_id}
                      </button>
                    </td>
                    <td>
                      {u.user_id.toLowerCase() !== 'jubayer' && (
                        <button
                          type="button"
                          className="erp-btn"
                          onClick={async () => {
                            const res = await fetch('/api/setup/user', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ action: 'delete', user_id: u.user_id })
                            });
                            const d = await res.json();
                            if (d.ok) {
                              notify(d.message);
                              await refreshMaster();
                            }
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Open New Shop / Branch & Invoice Header Branding Section */}
        <div className="erp-sublegend">Open New Shop / Branch &amp; Invoice Header/Logo Branding</div>
        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Shop Name</label></div>
          <div className="col-md-2"><input id="NEW_SHOP_NAME" className="erp-input" placeholder="e.g. HAZI TRADERS-3" value={shopForm.branch_name} onChange={(e) => setShopForm({ ...shopForm, branch_name: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Address</label></div>
          <div className="col-md-2"><input id="NEW_SHOP_ADDRESS" className="erp-input" placeholder="Shop Address" value={shopForm.address} onChange={(e) => setShopForm({ ...shopForm, address: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Phone</label></div>
          <div className="col-md-1"><input id="NEW_SHOP_PHONE" className="erp-input" value={shopForm.phone} onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Invoice Footer</label></div>
          <div className="col-md-2"><input id="NEW_SHOP_FOOTER" className="erp-input" placeholder="Invoice Footer Note" value={shopForm.invoice_footer || ''} onChange={(e) => setShopForm({ ...shopForm, invoice_footer: e.target.value })} /></div>
          <div className="col-md-1">
            <label className="erp-btn d-inline-block text-center w-100" style={{ cursor: 'pointer' }}>
              Logo
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleShopLogoUpload} />
            </label>
          </div>
        </div>
        <div className="d-flex gap-1 mb-1">
          <button type="button" className="erp-btn" onClick={() => handleShopAction('save')}>Open / Save Shop &amp; Branding</button>
          <button type="button" className="erp-btn" onClick={() => setShopForm({ branch_id: '', branch_name: '', address: '', phone: '01955541444', email: 'info@hazierp.top', manager_name: 'JUBAYER AHMED', status: 'ACTIVE', logo_url: '/IMAGE/hazi-logo.jpg', invoice_footer: 'Warranty void if sticker removed or burn/physical damage.' })}>Clear Shop Form</button>
        </div>

        <div className="erp-grid-box" style={{ minHeight: '95px', maxHeight: '130px' }}>
          <table className="erp-table">
            <thead>
              <tr><th>Logo</th><th>Shop ID</th><th>Shop / Branch Name</th><th>Address</th><th>Phone</th><th>Invoice Footer</th><th>Switch Shop</th><th>Edit Branding</th><th>Delete</th></tr>
            </thead>
            <tbody>
              {master.branches.map((b) => (
                <tr key={b.branch_id}>
                  <td><img src={b.logo_url && b.logo_url !== '/IMAGE/unisoft.svg' ? b.logo_url : '/IMAGE/hazi-logo.jpg'} alt="logo" style={{ width: '26px', height: '26px', objectFit: 'contain', borderRadius: '4px', background: '#fff' }} /></td>
                  <td>{b.branch_id}</td>
                  <td>{b.branch_name}</td>
                  <td>{b.address}</td>
                  <td>{b.phone}</td>
                  <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.invoice_footer || 'Default'}</td>
                  <td><button type="button" className="erp-btn" onClick={() => switchShop(b.branch_name)}>{session?.branchName === b.branch_name ? 'Active' : 'Switch'}</button></td>
                  <td><button type="button" className="erp-btn" onClick={() => setShopForm({ ...shopForm, ...b })}>Edit</button></td>
                  <td>
                    {b.branch_id !== 'BR001' && (
                      <button type="button" className="erp-btn" onClick={() => handleShopAction('delete', b)}>Delete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </fieldset>
    </div>
  );
}

// 15. DATABASEBACKUP.aspx — Data Backup & Main Admin .Bak Data Upload/Restore
export function DatabaseBackupPage() {
  const { session, notify, refreshMaster } = useErp();
  const navigate = useNavigate();
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [dbStats, setDbStats] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [includeTransactions, setIncludeTransactions] = useState(true);
  const [preserveBranding, setPreserveBranding] = useState(true);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ pct: 0, text: '' });

  const isMainAdmin =
    String(session?.userId || '').toLowerCase() === 'jubayer' ||
    session?.permissionType === 'A' ||
    Boolean(session?.permissions?.actions?.manageAdmins);

  const loadDbStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/db-stats');
      if (res.ok) {
        const data = await res.json();
        if (data.ok) setDbStats(data.stats);
      }
    } catch {}
  }, []);

  useEffect(() => {
    document.title = 'Data Backup & .Bak Restore';
    loadDbStats();
  }, [loadDbStats]);

  const handleServerBackup = async () => {
    const res = await fetch('/api/admin/backup', { method: 'POST' });
    const data = await res.json();
    if (data.ok) {
      setStatusMsg(data.message);
      notify(data.message);
    }
  };

  const handleClientBackup = () => {
    window.location.href = '/api/admin/client-backup';
    notify('Client Database Backup download started');
  };

  const handleNetTest = async () => {
    const res = await fetch('/api/admin/net-test');
    const data = await res.json();
    if (data.ok) {
      const msg = `Network & DB Test Passed: ${data.status} | Latency: ${data.latencyMs}ms | Active Tables: ${data.tables}`;
      setStatusMsg(msg);
      notify(msg);
    }
  };

  const handleScanBak = async () => {
    if (!selectedFile) return notify('Please select a .Bak backup file first!', 'error');
    setBusy(true);
    setErrorMsg('');
    setStatusMsg('');
    setScanResult(null);
    try {
      const res = await scanBakFile(selectedFile, (pct, text) => {
        setProgress({ pct, text });
      });
      setScanResult(res);
      notify(`Scanned ${res.fileName}: ${res.summary.products} Products, ${res.summary.traders} Traders, ${res.summary.sales} Sales ready to upload!`);
    } catch (err) {
      setErrorMsg(`Scan failed: ${err.message}`);
      notify(`Scan failed: ${err.message}`, 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleUploadBakToLive = async () => {
    if (!scanResult?.mapped) return notify('Please scan the .Bak file first!', 'error');
    const ok = window.confirm(
      `This will replace old/demo data with:\n` +
      `• ${scanResult.summary.products} Products & ${scanResult.summary.product_serials} Stock Serials\n` +
      `• ${scanResult.summary.traders} Customers & Suppliers\n` +
      (includeTransactions ? `• ${scanResult.summary.sales} Sales, ${scanResult.summary.purchases} Purchases, ${scanResult.summary.collections} Collections, ${scanResult.summary.payments} Payments\n` : `• Master Data & Current Stock Only\n`) +
      `\nYour Main Admin (jubayer) login will stay active. Continue?`
    );
    if (!ok) return;

    setBusy(true);
    setErrorMsg('');
    setStatusMsg('');
    try {
      const res = await uploadMappedBakToServer(
        scanResult.mapped,
        {
          fileName: scanResult.fileName,
          includeTransactions,
          preserveBranding
        },
        (pct, text) => setProgress({ pct, text })
      );
      setStatusMsg(`${res.message}${res.syncedToSupabase ? ' (Synced to Supabase Cloud ✓)' : ''}`);
      notify(res.message);
      await loadDbStats();
      await refreshMaster();
    } catch (err) {
      setErrorMsg(`Upload failed: ${err.message}`);
      notify(`Upload failed: ${err.message}`, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="erp-container">
      <fieldset className="erp-fieldset mb-2">
        <legend className="erp-legend">Data Backup</legend>
        <div className="d-flex flex-wrap gap-2 my-2 align-items-center">
          <button id="MainContent_SAVE" className="erp-btn" onClick={handleServerBackup}>Server Backup</button>
          <button id="MainContent_NEW" className="erp-btn" onClick={handleClientBackup}>Client Backup</button>
          <button id="MainContent_NETTEST" className="erp-btn" onClick={handleNetTest}>Net Test</button>
          <button id="MainContent_EXIT" className="erp-btn" onClick={() => navigate('/GI/TREE.aspx')}>Exit</button>
        </div>
        {dbStats && (
          <div className="row g-1 mt-1 mb-1">
            {[
              ['Products', dbStats.products],
              ['Traders (C/S)', dbStats.traders],
              ['Brands', dbStats.brands],
              ['Groups', dbStats.product_groups],
              ['In-Stock Serials', dbStats.product_serials],
              ['Sales Invoices', dbStats.sales],
              ['Purchases', dbStats.purchases],
              ['Collections', dbStats.collections],
              ['Payments', dbStats.payments],
              ['Journals', dbStats.journal_vouchers]
            ].map(([label, val]) => (
              <div key={label} className="col-md-2 col-4">
                <div className="border rounded px-2 py-1 text-center" style={{ background: '#f8f9fa', fontSize: '12px' }}>
                  <div className="text-muted">{label}</div>
                  <div className="fw-bold text-primary" style={{ fontSize: '14px' }}>{Number(val || 0).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {statusMsg && <div className="alert alert-success py-1 px-2 mt-2 mb-0 fw-bold">{statusMsg}</div>}
        {errorMsg && <div className="alert alert-danger py-1 px-2 mt-2 mb-0 fw-bold">{errorMsg}</div>}
      </fieldset>

      {isMainAdmin && (
        <fieldset className="erp-fieldset mb-2">
          <legend className="erp-legend" style={{ color: '#0b5ed7' }}>
            Main Admin — Upload Old Site Backup (.Bak) &amp; Auto-Update All Data
          </legend>
          <div className="mb-2" style={{ fontSize: '12.5px', color: '#333' }}>
            Select any SQL Server <code>.Bak</code> backup file exported from your old site (<code>hazierp.top</code>). The system will decode all products, stock, serials, customers, suppliers, sales, purchases &amp; accounts directly in your browser and update the entire live site + Supabase cloud automatically.
          </div>

          <div className="row g-2 align-items-center mb-2">
            <div className="col-md-5">
              <input
                id="BAK_FILE_INPUT"
                type="file"
                accept=".bak,.Bak,.BAK"
                className="form-control form-control-sm"
                disabled={busy}
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setSelectedFile(f);
                  setScanResult(null);
                  setErrorMsg('');
                  setProgress({ pct: 0, text: '' });
                }}
              />
            </div>
            <div className="col-md-7 d-flex flex-wrap gap-2">
              <button
                id="BTN_SCAN_BAK"
                type="button"
                className="erp-btn fw-bold"
                disabled={busy || !selectedFile}
                onClick={handleScanBak}
              >
                1. Scan &amp; Preview .Bak File
              </button>
              <button
                id="BTN_UPLOAD_BAK"
                type="button"
                className="erp-btn fw-bold"
                style={{
                  background: scanResult ? '#dcfce7' : undefined,
                  borderColor: scanResult ? '#22c55e' : undefined,
                  color: scanResult ? '#15803d' : undefined
                }}
                disabled={busy || !scanResult}
                onClick={handleUploadBakToLive}
              >
                2. Upload &amp; Update All Live Data
              </button>
            </div>
          </div>

          <div className="d-flex flex-wrap gap-3 mb-2">
            <label className="erp-label d-flex align-items-center gap-1" style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={includeTransactions}
                disabled={busy}
                onChange={(e) => setIncludeTransactions(e.target.checked)}
              />
              Include Full History (Sales, Purchases, Collections, Payments, Journals, Transfers)
            </label>
            <label className="erp-label d-flex align-items-center gap-1" style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={preserveBranding}
                disabled={busy}
                onChange={(e) => setPreserveBranding(e.target.checked)}
              />
              Keep Custom Shop Logos &amp; Invoice Footers
            </label>
          </div>

          {(busy || progress.pct > 0) && (
            <div className="mb-2">
              <div className="d-flex justify-content-between mb-1" style={{ fontSize: '12px' }}>
                <span className="fw-bold text-primary">{progress.text}</span>
                <span className="fw-bold">{progress.pct}%</span>
              </div>
              <div className="progress" style={{ height: '14px' }}>
                <div
                  className={`progress-bar ${busy ? 'progress-bar-striped progress-bar-animated' : 'bg-success'}`}
                  style={{ width: `${progress.pct}%`, fontSize: '11px' }}
                >
                  {progress.pct}%
                </div>
              </div>
            </div>
          )}

          {scanResult && (
            <div className="erp-grid-box mt-2" style={{ minHeight: 'auto', maxHeight: '220px' }}>
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Backup File</th>
                    <th>Products</th>
                    <th>Traders</th>
                    <th>Brands / Groups</th>
                    <th>Stock Serials</th>
                    <th>Sales (+Items)</th>
                    <th>Purchases (+Items)</th>
                    <th>Collections / Payments</th>
                    <th>Journals / Transfers</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="fw-bold">{scanResult.fileName} ({scanResult.fileSizeMB} MB)</td>
                    <td className="fw-bold text-primary">{scanResult.summary.products.toLocaleString()}</td>
                    <td className="fw-bold">{scanResult.summary.traders.toLocaleString()}</td>
                    <td>{scanResult.summary.brands} / {scanResult.summary.product_groups}</td>
                    <td>{scanResult.summary.product_serials.toLocaleString()}</td>
                    <td>{scanResult.summary.sales.toLocaleString()} ({scanResult.summary.sales_items.toLocaleString()})</td>
                    <td>{scanResult.summary.purchases.toLocaleString()} ({scanResult.summary.purchase_items.toLocaleString()})</td>
                    <td>{scanResult.summary.collections.toLocaleString()} / {scanResult.summary.payments.toLocaleString()}</td>
                    <td>{scanResult.summary.journal_vouchers.toLocaleString()} / {scanResult.summary.stock_transfers.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </fieldset>
      )}

      <fieldset className="erp-fieldset">
        <legend className="erp-legend" style={{ color: '#dc3545' }}>Important Notice</legend>
        <div className="fw-bold" style={{ fontSize: '15px', color: '#0b5ed7' }}>
          Please take Software Backup &amp; it Store Google Dive/Hard Disk/SSD/Protable Drive/Pendrive !!!! Backup Saved Your Businees Saved.
        </div>
      </fieldset>
    </div>
  );
}

// 16. DAILY_BUSINESS.aspx — Daily Business Summary
export function DailyBusinessPage() {
  const { session, openPrint } = useErp();
  const navigate = useNavigate();
  const [date1, setDate1] = useState(getTodayStr());
  const [date2, setDate2] = useState(getTodayStr());
  const [data, setData] = useState({
    cards: {
      purchase: 0, purchaseReturn: 0, sales: 0, salesReturn: 0, stock: 0,
      receivable: 0, payable: 0, profitLoss: 0, collection: 0, payment: 0,
      bankBook: 0, cashBook: 0
    },
    gridView11: [],
    gridView12: [],
    gridView13: []
  });

  const loadSummary = useCallback(async (branchFilter = '') => {
    const res = await fetch(`/api/admin/daily-business?date1=${encodeURIComponent(date1)}&date2=${encodeURIComponent(date2)}&branch=${encodeURIComponent(branchFilter)}`);
    if (res.ok) setData(await res.json());
  }, [date1, date2]);

  useEffect(() => {
    document.title = 'Daily Business Summary';
    loadSummary('');
  }, [loadSummary]);

  const cardDefs = [
    { id: 'PURCHASE', title: 'Purchase', val: data.cards.purchase, cat: 'PURCHASE', rep: 'Date Wise Purchase' },
    { id: 'PURCHASE_RETURN', title: 'Purchase Return', val: data.cards.purchaseReturn, cat: 'PURCHASE', rep: 'Purchase Return' },
    { id: 'SALES', title: 'Sales', val: data.cards.sales, cat: 'SALES', rep: 'Date Wise Sales' },
    { id: 'SALES_RETURN', title: 'Sales Return', val: data.cards.salesReturn, cat: 'SALES', rep: 'Date wise Net Sales' },
    { id: 'STOCK', title: 'Stock', val: data.cards.stock, cat: 'STOCK', rep: 'Crrent Stock - All' },
    { id: 'RECEIABLE', title: 'Account Receiable', val: data.cards.receivable, cat: 'CS', rep: 'Accounts Receivable' },
    { id: 'PAYABLE', title: 'Account Payable', val: data.cards.payable, cat: 'CS', rep: 'Accounts Payable' },
    { id: 'EXPENSES_PROFIT', title: 'Profit & Loss', val: data.cards.profitLoss, cat: 'ACCOUNTS', rep: 'Profit & Loss Account' },
    { id: 'COLLECTION', title: 'Collection', val: data.cards.collection, cat: 'ACCOUNTS', rep: 'Date wise Collection' },
    { id: 'PAYMENT', title: 'Payment', val: data.cards.payment, cat: 'ACCOUNTS', rep: 'Date wise Payment' },
    { id: 'BANK_BOOK', title: 'Bank Book', val: data.cards.bankBook, cat: 'BANK', rep: 'Bank Statement' },
    { id: 'CASH_BOOK', title: 'Cash Book', val: data.cards.cashBook, cat: 'ACCOUNTS', rep: 'Cash Book' }
  ];

  const handleViewDetails = async (c) => {
    const res = await fetch('/api/reports/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: c.cat, reportName: c.rep, filters: { date1, date2 } })
    });
    const d = await res.json();
    if (d.ok) {
      openPrint({
        ...d.report,
        subtitle: `Date From ${date1} To ${date2}`,
        excelParams: { category: c.cat, reportName: c.rep, filters: { date1, date2 } }
      });
    }
  };

  return (
    <div className="erp-container">
      <fieldset className="erp-fieldset">
        <legend className="erp-legend">Daily Business Summary</legend>
        <div className="row g-2 align-items-center mb-3">
          <div className="col-md-1"><label className="erp-label">Date From</label></div>
          <div className="col-md-2"><input id="MainContent_DATE1" className="erp-input" value={date1} onChange={(e) => setDate1(e.target.value)} /></div>
          <div className="col-md-1"><label className="erp-label">Date to</label></div>
          <div className="col-md-2"><input id="MainContent_DATE2" className="erp-input" value={date2} onChange={(e) => setDate2(e.target.value)} /></div>
          <div className="col-md-6 d-flex flex-wrap gap-1">
            <button id="BUSINESS" className="erp-btn" onClick={() => loadSummary(session?.branchName || 'HAZI TRADERS')}>Business Current Branch</button>
            <button id="BUSINESS_ALL" className="erp-btn" onClick={() => loadSummary('')}>Business All Branch</button>
            <button id="PRINT" className="erp-btn" onClick={() => openPrint({
              title: 'Daily Business Summary Statement',
              subtitle: `From ${date1} To ${date2}`,
              columns: ['SL', 'Business Metric / Head', 'Amount (BDT)'],
              rows: cardDefs.map((c, i) => [i + 1, c.title, Number(c.val || 0).toFixed(2)])
            })}>Print</button>
            <button id="CASHFLOW" className="erp-btn" onClick={() => handleViewDetails({ cat: 'ACCOUNTS', rep: 'Cash Book' })}>Cash Flow</button>
            <button id="CLEAR" className="erp-btn" onClick={() => { setDate1('01/11/2026'); setDate2('23/11/2026'); }}>Clear</button>
            <button id="EXIT" className="erp-btn" onClick={() => navigate('/GI/TREE.aspx')}>Exit</button>
          </div>
        </div>

        <div className="row g-2 mb-3">
          {cardDefs.map((c) => (
            <div key={c.id} className="col-md-3 col-6">
              <div className="border rounded p-2 text-center" style={{ backgroundColor: '#eef2f7' }}>
                <div className="fw-bold" style={{ fontSize: '15px', color: '#0d6efd' }}>{c.title}</div>
                <div className="fw-bold my-1" style={{ fontSize: '18px' }}>{Number(c.val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <button id={c.id} className="erp-btn btn-sm" onClick={() => handleViewDetails(c)}>View Details</button>
              </div>
            </div>
          ))}
        </div>

        <div className="row g-2">
          <div className="col-md-4">
            <table id="GridView11" className="erp-table">
              <thead><tr><th>Collection Type</th><th>NOP Customer</th><th>Amount</th></tr></thead>
              <tbody>
                {data.gridView11.map((r, i) => (
                  <tr key={i}><td>{r.type}</td><td>{r.count}</td><td>{Number(r.amount || 0).toFixed(2)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="col-md-4">
            <table id="GridView12" className="erp-table">
              <thead><tr><th>Payment Type</th><th>NOP Supplier</th><th>Amount</th></tr></thead>
              <tbody>
                {data.gridView12.map((r, i) => (
                  <tr key={i}><td>{r.type}</td><td>{r.count}</td><td>{Number(r.amount || 0).toFixed(2)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="col-md-4">
            <table id="GridView13" className="erp-table">
              <thead><tr><th>Account No.</th><th>Amount</th></tr></thead>
              <tbody>
                {data.gridView13.map((r, i) => (
                  <tr key={i}><td>{r.account_no}</td><td>{Number(r.amount || 0).toFixed(2)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </fieldset>
    </div>
  );
}

// 17. EMPLOYEE.aspx — Employee Information
export function EmployeePage() {
  const { master, refreshMaster, notify } = useErp();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    employee_id: '', employee_name: '', father_name: '', mother_name: '',
    address: '', email: '', mobile: '', family_mobile: '',
    education: '', joining_date: '', basic_salary: '0', gross_salary: '0',
    designation: '', opening_balance: '0', active: 'Y', employee_type: 'Y', salary_type: 'Y'
  });

  useEffect(() => {
    document.title = 'Employee Information';
    setForm(f => ({ ...f, employee_id: f.employee_id || master.nextIds?.employee || 'EMP005' }));
  }, [master.nextIds?.employee]);

  const handleClear = () => {
    setForm({
      employee_id: master.nextIds?.employee || 'EMP005', employee_name: '', father_name: '', mother_name: '',
      address: '', email: '', mobile: '', family_mobile: '',
      education: '', joining_date: '', basic_salary: '0', gross_salary: '0',
      designation: '', opening_balance: '0', active: 'Y', employee_type: 'Y', salary_type: 'Y'
    });
  };

  const handleAction = async (action) => {
    if (!form.employee_name.trim()) return notify('Please input Employee Name', 'error');
    const res = await fetch('/api/setup/employee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, action })
    });
    const data = await res.json();
    if (data.ok) {
      notify(data.message);
      await refreshMaster();
      handleClear();
    }
  };

  return (
    <div className="erp-container">
      <fieldset className="erp-fieldset">
        <legend className="erp-legend">Employee Information</legend>
        <div className="row g-2 align-items-center mb-2">
          <div className="col-md-2"><label className="erp-label">Employee ID</label></div>
          <div className="col-md-4"><input id="EMPLOYEE_ID" className="erp-input" value={form.employee_id} readOnly disabled /></div>
          <div className="col-md-2"><label className="erp-label">Employee Name</label></div>
          <div className="col-md-4">
            <AutocompleteInput
              id="EMPLOYEE_NAME"
              value={form.employee_name}
              onChange={(v) => setForm({ ...form, employee_name: v })}
              options={master.employees}
              labelKey="employee_name"
              subKey="designation"
              onSelect={(emp) => setForm({ ...emp })}
            />
          </div>
        </div>
        <div className="row g-2 align-items-center mb-2">
          <div className="col-md-2"><label className="erp-label">Father Name</label></div>
          <div className="col-md-4"><input id="M_FATHER_NAME" className="erp-input" value={form.father_name} onChange={(e) => setForm({ ...form, father_name: e.target.value })} /></div>
          <div className="col-md-2"><label className="erp-label">Mother Name</label></div>
          <div className="col-md-4"><input id="M_MOTHER_NAME" className="erp-input" value={form.mother_name} onChange={(e) => setForm({ ...form, mother_name: e.target.value })} /></div>
        </div>
        <div className="row g-2 align-items-center mb-2">
          <div className="col-md-2"><label className="erp-label">Address</label></div>
          <div className="col-md-4"><input id="M_ADDRESS" className="erp-input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div className="col-md-2"><label className="erp-label">Email</label></div>
          <div className="col-md-4"><input id="M_EMAIL" className="erp-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        </div>
        <div className="row g-2 align-items-center mb-2">
          <div className="col-md-2"><label className="erp-label">Mobile</label></div>
          <div className="col-md-4"><input id="M_MOBILE" className="erp-input" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /></div>
          <div className="col-md-2"><label className="erp-label">Family Mobile</label></div>
          <div className="col-md-4"><input id="M_FA_MOBILE" className="erp-input" value={form.family_mobile} onChange={(e) => setForm({ ...form, family_mobile: e.target.value })} /></div>
        </div>
        <div className="row g-2 align-items-center mb-2">
          <div className="col-md-2"><label className="erp-label">Last Education</label></div>
          <div className="col-md-4"><input id="M_EDUCATION" className="erp-input" value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })} /></div>
          <div className="col-md-2"><label className="erp-label">Joining Date</label></div>
          <div className="col-md-4"><input id="M_JOIN_DATE" className="erp-input" placeholder="Date/Month/Year" value={form.joining_date} onChange={(e) => setForm({ ...form, joining_date: e.target.value })} /></div>
        </div>
        <div className="row g-2 align-items-center mb-2">
          <div className="col-md-2"><label className="erp-label">Basic Salary</label></div>
          <div className="col-md-4"><input id="BASIC_SALARY" className="erp-input" value={form.basic_salary} onChange={(e) => setForm({ ...form, basic_salary: e.target.value })} /></div>
          <div className="col-md-2"><label className="erp-label">Gross Salary</label></div>
          <div className="col-md-4"><input id="GROSS_SALARY" className="erp-input" value={form.gross_salary} onChange={(e) => setForm({ ...form, gross_salary: e.target.value })} /></div>
        </div>
        <div className="row g-2 align-items-center mb-2">
          <div className="col-md-2"><label className="erp-label">Designation</label></div>
          <div className="col-md-4"><input id="DESIGNATION" className="erp-input" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} /></div>
          <div className="col-md-2"><label className="erp-label">Opening Balance</label></div>
          <div className="col-md-4"><input id="M_BALANCE" className="erp-input" value={form.opening_balance} onChange={(e) => setForm({ ...form, opening_balance: e.target.value })} /></div>
        </div>
        <div className="row g-2 align-items-center mb-3">
          <div className="col-md-2"><label className="erp-label">Employee Type</label></div>
          <div className="col-md-2">
            <select id="DropDownListEmp_Type" className="erp-select" value={form.employee_type} onChange={(e) => setForm({ ...form, employee_type: e.target.value })}>
              <option value="Y">Permanant</option>
              <option value="N">Casual</option>
            </select>
          </div>
          <div className="col-md-2"><label className="erp-label">Salary Type</label></div>
          <div className="col-md-2">
            <select id="DropDownListSalType" className="erp-select" value={form.salary_type} onChange={(e) => setForm({ ...form, salary_type: e.target.value })}>
              <option value="Y">Salaried</option>
              <option value="N">Non-Salaried</option>
            </select>
          </div>
          <div className="col-md-2"><label className="erp-label">Active</label></div>
          <div className="col-md-2">
            <select id="DropDownListActive" className="erp-select" value={form.active} onChange={(e) => setForm({ ...form, active: e.target.value })}>
              <option value="Y">Yes</option>
              <option value="N">No</option>
            </select>
          </div>
        </div>
        <div className="d-flex gap-2">
          <button id="Button1" className="erp-btn" onClick={() => handleAction('save')}>Save</button>
          <button id="EDIT" className="erp-btn" onClick={() => handleAction('save')}>Edit</button>
          <button id="DELETE" className="erp-btn" onClick={() => handleAction('delete')}>Delete</button>
          <button id="CLIER" className="erp-btn" onClick={handleClear}>Clear</button>
          <button id="EXIT" className="erp-btn" onClick={() => navigate('/GI/TREE.aspx')}>Exit</button>
        </div>
      </fieldset>
    </div>
  );
}
