import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useErp, getTodayStr, getMonthStartStr } from '../context/ErpContext.jsx';
import AutocompleteInput from '../components/AutocompleteInput.jsx';

// 36. SERVICEGROUP.aspx — Service Group
export function ServiceGroupPage() {
  const { master, refreshMaster, notify } = useErp();
  const navigate = useNavigate();
  const [id, setId] = useState('SVG001');
  const [name, setName] = useState('');
  const [active, setActive] = useState('Y');

  useEffect(() => {
    document.title = 'Service Group';
    setId(master.nextIds?.serviceGroup || 'SVG003');
  }, [master.nextIds?.serviceGroup]);

  const handleAction = async (action) => {
    if (!name.trim()) return notify('Please input Service Group Name', 'error');
    const res = await fetch('/api/setup/service-group', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, service_group_id: id, service_group_name: name, active })
    });
    const data = await res.json();
    if (data.ok) {
      notify(data.message);
      await refreshMaster();
      setName('');
    }
  };

  return (
    <div className="erp-container erp-container-narrow">
      <fieldset className="erp-fieldset">
        <legend className="erp-legend">Service Group</legend>
        <div className="row g-2 align-items-center mb-2">
          <div className="col-md-2"><label className="erp-label">Service Group Id</label></div>
          <div className="col-md-4"><input id="SERVICE_GROUP_ID" className="erp-input" value={id} readOnly disabled /></div>
          <div className="col-md-2"><label className="erp-label">Service Group Name</label></div>
          <div className="col-md-4">
            <AutocompleteInput
              id="SERVICE_GROUP_NAME"
              value={name}
              onChange={setName}
              options={master.serviceGroups}
              labelKey="service_group_name"
              subKey="service_group_id"
              onSelect={(g) => { setId(g.service_group_id); setName(g.service_group_name); setActive(g.active || 'Y'); }}
            />
          </div>
        </div>
        <div className="row g-2 align-items-center mb-3">
          <div className="col-md-2"><label className="erp-label">Active</label></div>
          <div className="col-md-4">
            <select id="DropDownListActive" className="erp-select" value={active} onChange={(e) => setActive(e.target.value)}>
              <option value="Y">Yes</option>
              <option value="N">No</option>
            </select>
          </div>
        </div>
        <div className="d-flex gap-2">
          <button id="Button1" className="erp-btn" onClick={() => handleAction('save')}>Save</button>
          <button id="EDIT" className="erp-btn" onClick={() => handleAction('save')}>Edit</button>
          <button id="DELETE" className="erp-btn" onClick={() => handleAction('delete')}>Delete</button>
          <button id="CLEAR" className="erp-btn" onClick={() => { setId(master.nextIds?.serviceGroup || 'SVG003'); setName(''); }}>Clear</button>
          <button id="EXIT" className="erp-btn" onClick={() => navigate('/GI/TREE.aspx')}>Exit</button>
        </div>
      </fieldset>
    </div>
  );
}

// 37. PROBLEMGROUP.aspx — Problem Group
export function ProblemGroupPage() {
  const { master, refreshMaster, notify } = useErp();
  const navigate = useNavigate();
  const [id, setId] = useState('PRG002');
  const [name, setName] = useState('');
  const [active, setActive] = useState('Y');

  useEffect(() => {
    document.title = 'Problem Group';
    setId(master.nextIds?.problemGroup || 'PRG003');
  }, [master.nextIds?.problemGroup]);

  const handleAction = async (action) => {
    if (!name.trim()) return notify('Please input Problem Group Name', 'error');
    const res = await fetch('/api/setup/problem-group', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, problem_group_id: id, problem_group_name: name, active })
    });
    const data = await res.json();
    if (data.ok) {
      notify(data.message);
      await refreshMaster();
      setName('');
    }
  };

  return (
    <div className="erp-container erp-container-narrow">
      <fieldset className="erp-fieldset">
        <legend className="erp-legend">Problem Group</legend>
        <div className="row g-2 align-items-center mb-2">
          <div className="col-md-2"><label className="erp-label">Problem Group Id</label></div>
          <div className="col-md-4"><input id="PROBLEM_GROUP_ID" className="erp-input" value={id} readOnly disabled /></div>
          <div className="col-md-2"><label className="erp-label">Problem Group Name</label></div>
          <div className="col-md-4">
            <AutocompleteInput
              id="PROBLEM_GROUP_NAME"
              value={name}
              onChange={setName}
              options={master.problemGroups}
              labelKey="problem_group_name"
              subKey="problem_group_id"
              onSelect={(g) => { setId(g.problem_group_id); setName(g.problem_group_name); setActive(g.active || 'Y'); }}
            />
          </div>
        </div>
        <div className="row g-2 align-items-center mb-3">
          <div className="col-md-2"><label className="erp-label">Active</label></div>
          <div className="col-md-4">
            <select id="DropDownListActive" className="erp-select" value={active} onChange={(e) => setActive(e.target.value)}>
              <option value="Y">Yes</option>
              <option value="N">No</option>
            </select>
          </div>
        </div>
        <div className="d-flex gap-2">
          <button id="Button1" className="erp-btn" onClick={() => handleAction('save')}>Save</button>
          <button id="EDIT" className="erp-btn" onClick={() => handleAction('save')}>Edit</button>
          <button id="DELETE" className="erp-btn" onClick={() => handleAction('delete')}>Delete</button>
          <button id="CLEAR" className="erp-btn" onClick={() => { setId(master.nextIds?.problemGroup || 'PRG003'); setName(''); }}>Clear</button>
          <button id="EXIT" className="erp-btn" onClick={() => navigate('/GI/TREE.aspx')}>Exit</button>
        </div>
      </fieldset>
    </div>
  );
}

// 38. SERVICE.aspx — Service Information
export function ServicePage() {
  const { master, refreshMaster, notify, openPrint } = useErp();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    service_group_id: '', service_group_name: '',
    service_id: 'SV00000001', service_name: '', description: '', active: 'Y'
  });

  useEffect(() => {
    document.title = 'Service Name Entry';
    setForm(f => ({ ...f, service_id: master.nextIds?.service || 'SV00000003' }));
  }, [master.nextIds?.service]);

  const handleAction = async (action) => {
    if (!form.service_name.trim()) return notify('Please input Service Name', 'error');
    const res = await fetch('/api/setup/service', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, action })
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
        <legend className="erp-legend">Service Information</legend>
        <div className="row g-2 align-items-center mb-2">
          <div className="col-md-2"><label className="erp-label">Service Group ID</label></div>
          <div className="col-md-4"><input id="SERVICE_GROUP_ID" className="erp-input" value={form.service_group_id} readOnly disabled /></div>
          <div className="col-md-2"><label className="erp-label">Service Group</label></div>
          <div className="col-md-4">
            <AutocompleteInput
              id="SERVICE_GROUP_NAME"
              value={form.service_group_name}
              onChange={(v) => setForm({ ...form, service_group_name: v })}
              options={master.serviceGroups}
              labelKey="service_group_name"
              onSelect={(g) => setForm({ ...form, service_group_id: g.service_group_id, service_group_name: g.service_group_name })}
            />
          </div>
        </div>
        <div className="row g-2 align-items-center mb-2">
          <div className="col-md-2"><label className="erp-label">Service ID</label></div>
          <div className="col-md-4"><input id="SERVICE_ID" className="erp-input" value={form.service_id} readOnly disabled /></div>
          <div className="col-md-2"><label className="erp-label">Service Name</label></div>
          <div className="col-md-4">
            <AutocompleteInput
              id="SERVICE_NAME"
              value={form.service_name}
              onChange={(v) => setForm({ ...form, service_name: v })}
              options={master.services}
              labelKey="service_name"
              onSelect={(s) => setForm({ ...s })}
            />
          </div>
        </div>
        <div className="row g-2 align-items-center mb-3">
          <div className="col-md-2"><label className="erp-label">Description.</label></div>
          <div className="col-md-4"><textarea id="DESCRIPTION" className="erp-textarea" rows={1} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="col-md-2"><label className="erp-label">Active</label></div>
          <div className="col-md-4">
            <select id="DropDownListActive" className="erp-select" value={form.active} onChange={(e) => setForm({ ...form, active: e.target.value })}>
              <option value="Y">Yes</option>
              <option value="N">No</option>
            </select>
          </div>
        </div>
        <div className="d-flex gap-2">
          <button id="Save" className="erp-btn" onClick={() => handleAction('save')}>Save</button>
          <button id="EDIT" className="erp-btn" onClick={() => handleAction('save')}>Edit</button>
          <button id="DELETE" className="erp-btn" onClick={() => handleAction('delete')}>Delete</button>
          <button id="CLEAR" className="erp-btn" onClick={() => setForm({ service_group_id: '', service_group_name: '', service_id: master.nextIds?.service || 'SV00000003', service_name: '', description: '', active: 'Y' })}>Clear</button>
          <button id="EXIT" className="erp-btn" onClick={() => navigate('/GI/TREE.aspx')}>Exit</button>
          <button id="MainContent_PRINT" className="erp-btn" onClick={() => openPrint({
            title: 'Service Catalog Register',
            columns: ['SL', 'Service ID', 'Service Group', 'Service Name', 'Description', 'Active'],
            rows: master.services.map((s, i) => [i + 1, s.service_id, s.service_group_name, s.service_name, s.description, s.active])
          })}>Print Preview</button>
        </div>
      </fieldset>
    </div>
  );
}

// 39. PROBLEM.aspx — Problem Information
export function ProblemPage() {
  const { master, refreshMaster, notify, openPrint } = useErp();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    problem_group_id: '', problem_group_name: '',
    problem_id: 'PR00000002', problem_name: '', description: '', active: 'Y'
  });

  useEffect(() => {
    document.title = 'Problem Entry';
    setForm(f => ({ ...f, problem_id: master.nextIds?.problem || 'PR00000003' }));
  }, [master.nextIds?.problem]);

  const handleAction = async (action) => {
    if (!form.problem_name.trim()) return notify('Please input Problem Name', 'error');
    const res = await fetch('/api/setup/problem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, action })
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
        <legend className="erp-legend">Problem Information</legend>
        <div className="row g-2 align-items-center mb-2">
          <div className="col-md-2"><label className="erp-label">Group ID</label></div>
          <div className="col-md-4"><input id="PROBLEM_GROUP_ID" className="erp-input" value={form.problem_group_id} readOnly disabled /></div>
          <div className="col-md-2"><label className="erp-label">Problem Group</label></div>
          <div className="col-md-4">
            <AutocompleteInput
              id="PROBLEM_GROUP_NAME"
              value={form.problem_group_name}
              onChange={(v) => setForm({ ...form, problem_group_name: v })}
              options={master.problemGroups}
              labelKey="problem_group_name"
              onSelect={(g) => setForm({ ...form, problem_group_id: g.problem_group_id, problem_group_name: g.problem_group_name })}
            />
          </div>
        </div>
        <div className="row g-2 align-items-center mb-2">
          <div className="col-md-2"><label className="erp-label">Problem ID</label></div>
          <div className="col-md-4"><input id="PROBLEM_ID" className="erp-input" value={form.problem_id} readOnly disabled /></div>
          <div className="col-md-2"><label className="erp-label">Problem Name</label></div>
          <div className="col-md-4">
            <AutocompleteInput
              id="PROBLEM_NAME"
              value={form.problem_name}
              onChange={(v) => setForm({ ...form, problem_name: v })}
              options={master.problems}
              labelKey="problem_name"
              onSelect={(p) => setForm({ ...p })}
            />
          </div>
        </div>
        <div className="row g-2 align-items-center mb-3">
          <div className="col-md-2"><label className="erp-label">Description.</label></div>
          <div className="col-md-4"><textarea id="DESCRIPTION" className="erp-textarea" rows={1} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="col-md-2"><label className="erp-label">Active</label></div>
          <div className="col-md-4">
            <select id="DropDownListActive" className="erp-select" value={form.active} onChange={(e) => setForm({ ...form, active: e.target.value })}>
              <option value="Y">Yes</option>
              <option value="N">No</option>
            </select>
          </div>
        </div>
        <div className="d-flex gap-2">
          <button id="Save" className="erp-btn" onClick={() => handleAction('save')}>Save</button>
          <button id="EDIT" className="erp-btn" onClick={() => handleAction('save')}>Edit</button>
          <button id="DELETE" className="erp-btn" onClick={() => handleAction('delete')}>Delete</button>
          <button id="CLEAR" className="erp-btn" onClick={() => setForm({ problem_group_id: '', problem_group_name: '', problem_id: master.nextIds?.problem || 'PR00000003', problem_name: '', description: '', active: 'Y' })}>Clear</button>
          <button id="EXIT" className="erp-btn" onClick={() => navigate('/GI/TREE.aspx')}>Exit</button>
          <button id="MainContent_PRINT" className="erp-btn" onClick={() => openPrint({
            title: 'Problem List Register',
            columns: ['SL', 'Problem ID', 'Problem Group', 'Problem Name', 'Description', 'Active'],
            rows: master.problems.map((p, i) => [i + 1, p.problem_id, p.problem_group_name, p.problem_name, p.description, p.active])
          })}>Print Preview</button>
        </div>
      </fieldset>
    </div>
  );
}

// 40. SERVICEBILL.aspx — Service Bill
export function ServiceBillPage() {
  const { master, notify, openPrint } = useErp();
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [header, setHeader] = useState({
    search_order_id: '', discount_amount: '0', ref_no: '',
    service_date: getTodayStr(), service_bill_id: '',
    cash_customer: '', mobile_no: '', cs_group_name: '', customer_name: '',
    narration: '', engineer_name: ''
  });
  const [line, setLine] = useState({
    problem_group: '', problem_id: '', problem_name: '', problem_description: '',
    service_group: '', service_id: '', service_name: '', service_description: '',
    qty: '1', unit_price: '0'
  });
  const [items, setItems] = useState([]);

  useEffect(() => {
    document.title = 'Service Bill';
    fetch('/api/servicing/bills').then(r => r.json()).then(d => {
      setBills(d.list || []);
      if (d.list?.[0]) {
        setHeader(h => ({ ...h, ...d.list[0] }));
        setItems(d.list[0].items || []);
      }
    });
  }, []);

  const totalAmount = items.reduce((s, it) => s + Number(it.qty || 1) * Number(it.unit_price || 0), 0);
  const netPayable = totalAmount - Number(header.discount_amount || 0);

  const handleSave = async () => {
    let nextItems = [...items];
    if (line.service_name.trim() || line.problem_name.trim()) {
      nextItems.push({ ...line, total_price: Number(line.qty || 1) * Number(line.unit_price || 0) });
      setItems(nextItems);
    }
    const res = await fetch('/api/servicing/bills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...header, items: nextItems })
    });
    const data = await res.json();
    if (data.ok) {
      setHeader(h => ({ ...h, service_bill_id: data.id }));
      notify(data.message);
    }
  };

  return (
    <div className="erp-container">
      <fieldset className="erp-fieldset">
        <legend className="erp-legend">Service Bill</legend>
        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-3">
            <AutocompleteInput
              id="SEARCH_ORDER_ID"
              placeholder="Input Order ID"
              value={header.search_order_id}
              onChange={(v) => setHeader({ ...header, search_order_id: v })}
              options={bills}
              labelKey="service_bill_id"
              onSelect={(b) => { setHeader({ ...header, ...b }); setItems(b.items || []); }}
            />
          </div>
          <div className="col-md-2"><button id="PU_ID_SEARCH" className="erp-btn w-100" onClick={() => { if (bills[0]) { setHeader({ ...header, ...bills[0] }); setItems(bills[0].items || []); } }}>Bill Search</button></div>
          <div className="col-md-3"><input id="INV_DIS_AMT" className="erp-input" placeholder="Input Discount Amt." value={header.discount_amount} onChange={(e) => setHeader({ ...header, discount_amount: e.target.value })} /></div>
          <div className="col-md-2"><button id="INVOICE_DISCOUNT" className="erp-btn w-100" onClick={() => notify('Discount Applied')}>Discount Amt.</button></div>
        </div>

        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Ref No.</label></div>
          <div className="col-md-3"><input id="REF_NO" className="erp-input" value={header.ref_no} onChange={(e) => setHeader({ ...header, ref_no: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Service Date</label></div>
          <div className="col-md-3"><input id="SERVICE_DATE" className="erp-input" value={header.service_date} onChange={(e) => setHeader({ ...header, service_date: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Service Bill ID</label></div>
          <div className="col-md-3"><input id="SERVICE_BILL_ID" className="erp-input" value={header.service_bill_id} readOnly /></div>
        </div>

        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Cash Customer</label></div>
          <div className="col-md-3"><input id="CASH_SUPPLIER_NAEM" className="erp-input" value={header.cash_customer} onChange={(e) => setHeader({ ...header, cash_customer: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Mobile No.</label></div>
          <div className="col-md-2"><input id="MOBILE_NO" className="erp-input" value={header.mobile_no} onChange={(e) => setHeader({ ...header, mobile_no: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">CS Group Name</label></div>
          <div className="col-md-2"><AutocompleteInput id="CS_GROUP_NAME" value={header.cs_group_name} onChange={(v) => setHeader({ ...header, cs_group_name: v })} options={master.traderGroups} labelKey="group_name" /></div>
          <div className="col-md-2"><AutocompleteInput id="CUSTOMER_NAME" placeholder="Customer Name" value={header.customer_name} onChange={(v) => setHeader({ ...header, customer_name: v })} options={master.traders} labelKey="cs_name" onSelect={(t) => setHeader({ ...header, customer_name: t.cs_name, cs_group_name: t.group_name, mobile_no: t.mobile })} /></div>
        </div>

        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Problem Group</label></div>
          <div className="col-md-2"><AutocompleteInput id="PROBLEM_GROUP" value={line.problem_group} onChange={(v) => setLine({ ...line, problem_group: v })} options={master.problemGroups} labelKey="problem_group_name" /></div>
          <div className="col-md-1"><label className="erp-label">Problem Name</label></div>
          <div className="col-md-3"><AutocompleteInput id="PROBLEM_NAME" value={line.problem_name} onChange={(v) => setLine({ ...line, problem_name: v })} options={master.problems} labelKey="problem_name" onSelect={(p) => setLine({ ...line, problem_id: p.problem_id, problem_name: p.problem_name, problem_group: p.problem_group_name, problem_description: p.description })} /></div>
          <div className="col-md-2"><label className="erp-label">Problem Description</label></div>
          <div className="col-md-3"><textarea id="Problem_Description" className="erp-textarea" rows={1} value={line.problem_description} readOnly /></div>
        </div>

        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Service Group</label></div>
          <div className="col-md-2"><AutocompleteInput id="SERVICE_GROUP" value={line.service_group} onChange={(v) => setLine({ ...line, service_group: v })} options={master.serviceGroups} labelKey="service_group_name" /></div>
          <div className="col-md-1"><label className="erp-label">Service Name</label></div>
          <div className="col-md-3"><AutocompleteInput id="SERVICE_NAME" value={line.service_name} onChange={(v) => setLine({ ...line, service_name: v })} options={master.services} labelKey="service_name" onSelect={(s) => setLine({ ...line, service_id: s.service_id, service_name: s.service_name, service_group: s.service_group_name, service_description: s.description, unit_price: '1200' })} /></div>
          <div className="col-md-2"><label className="erp-label">Service Description</label></div>
          <div className="col-md-3"><textarea id="SERVICE_DESCRIPTION" className="erp-textarea" rows={1} value={line.service_description} onChange={(e) => setLine({ ...line, service_description: e.target.value })} /></div>
        </div>

        <div className="row g-1 align-items-center mb-2">
          <div className="col-md-1"><label className="erp-label">Narration</label></div>
          <div className="col-md-3"><input id="NARRATION" className="erp-input" value={header.narration} onChange={(e) => setHeader({ ...header, narration: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Engineer Name</label></div>
          <div className="col-md-3"><AutocompleteInput id="ENGINEER_NAME" value={header.engineer_name} onChange={(v) => setHeader({ ...header, engineer_name: v })} options={master.employees} labelKey="employee_name" /></div>
          <div className="col-md-1"><label className="erp-label">Qty</label></div>
          <div className="col-md-1"><input id="PRODUCT_QTY" className="erp-input" value={line.qty} onChange={(e) => setLine({ ...line, qty: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Unit Price</label></div>
          <div className="col-md-1"><input id="UNIT_PRICE" className="erp-input" value={line.unit_price} onChange={(e) => setLine({ ...line, unit_price: e.target.value })} /></div>
        </div>

        <div className="d-flex flex-wrap gap-1 mb-2">
          <button id="SAVE_BUTTON" className="erp-btn" onClick={handleSave}>Save</button>
          <button id="EDIT_BUTTON" className="erp-btn" onClick={handleSave}>Edit</button>
          <button id="Clear" className="erp-btn" onClick={() => setItems([])}>Clear/New</button>
          <button id="PRINT" className="erp-btn" onClick={() => openPrint({
            title: `SERVICE BILL INVOICE — ${header.service_bill_id || 'SVB001260000001'}`,
            meta: { 'Bill ID': header.service_bill_id, 'Date': header.service_date, 'Customer': header.customer_name || header.cash_customer, 'Engineer': header.engineer_name },
            columns: ['Bill ID', 'Problem ID', 'Problem Name', 'Service ID', 'Service Name', 'Qty', 'Unit Price'],
            rows: items.map(it => [header.service_bill_id, it.problem_id, it.problem_name, it.service_id, it.service_name, it.qty, it.unit_price]),
            summary: { 'Total Amount': totalAmount.toFixed(2), 'Discount Amount': Number(header.discount_amount || 0).toFixed(2), 'Net Payable Amt.': netPayable.toFixed(2) }
          })}>Print</button>
          <button id="PRINTVIEW" className="erp-btn" onClick={() => window.print()}>Print Preview</button>
          <button id="EXIT" className="erp-btn" onClick={() => navigate('/GI/TREE.aspx')}>Exit</button>
        </div>

        <div className="erp-grid-box mb-2">
          <table id="GridView1" className="erp-table">
            <thead><tr><th>Bill ID</th><th>Problem ID</th><th>Problem Name</th><th>Service ID</th><th>Service Name</th><th>Qty</th><th>Unit Price</th><th>Edit</th><th>Delete</th></tr></thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i}>
                  <td>{header.service_bill_id || 'NEW'}</td><td>{it.problem_id}</td><td>{it.problem_name}</td><td>{it.service_id}</td><td>{it.service_name}</td><td>{it.qty}</td><td>{it.unit_price}</td>
                  <td><button className="erp-btn" onClick={() => { setLine({ ...line, ...it }); setItems(items.filter((_, idx) => idx !== i)); }}>Edit</button></td>
                  <td><button className="erp-btn" onClick={() => setItems(items.filter((_, idx) => idx !== i))}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="erp-footer-panel text-end" style={{ minHeight: '55px' }}>
          Total Amount: {totalAmount.toFixed(2)} &nbsp;&nbsp;|&nbsp;&nbsp; Discount Amount: {Number(header.discount_amount || 0).toFixed(2)} &nbsp;&nbsp;|&nbsp;&nbsp; Net Payable Amt. {netPayable.toFixed(2)}
        </div>
      </fieldset>
    </div>
  );
}

// 41. PAYMENT.aspx — Payment Voucher
export function PaymentPage() {
  const { master, refreshMaster, notify, openPrint } = useErp();
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [form, setForm] = useState({
    ref_no: '', payment_date: getTodayStr(), search_id: '', payment_id: '',
    cs_group: '', cs_name: '', narration: '', purchase_id: '',
    payment_type: 'CASH', bank_name: '', branch_name_bank: '',
    cheque_no: '', cheque_date: '', account_no: '',
    dishonor_type: '--Select--', dishonor_cheque_no: '',
    invoice_amount: '0', due_amount: '0', total_due_amount: '0', amount: '0'
  });

  const loadList = useCallback(async () => {
    const res = await fetch('/api/accounts/all');
    if (res.ok) {
      const data = await res.json();
      setList(data.payments || []);
    }
  }, []);

  useEffect(() => {
    document.title = 'Payment';
    loadList();
  }, [loadList]);

  const isBankMode = form.payment_type !== 'CASH';

  const handleSave = async (action = 'save', overrideId) => {
    if (action === 'save' && (!form.cs_name.trim() || !Number(form.amount))) {
      return notify('Select Supplier Name and input Payable Amount', 'error');
    }
    const res = await fetch('/api/accounts/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, payment_id: overrideId || form.payment_id, action })
    });
    const data = await res.json();
    if (data.ok) {
      if (data.id) setForm(f => ({ ...f, payment_id: data.id }));
      notify(data.message);
      await refreshMaster();
      await loadList();
    }
  };

  return (
    <div className="erp-container">
      <fieldset className="erp-fieldset">
        <legend className="erp-legend">Payment Voucher</legend>
        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Ref No.</label></div>
          <div className="col-md-2"><input id="REF_NO" className="erp-input" value={form.ref_no} onChange={(e) => setForm({ ...form, ref_no: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Date</label></div>
          <div className="col-md-2"><input id="PAYMENTDATE" className="erp-input" value={form.payment_date} onChange={(e) => setForm({ ...form, payment_date: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Payment ID</label></div>
          <div className="col-md-3">
            <AutocompleteInput
              id="SEARCH_PAYMENT_ID"
              value={form.search_id}
              onChange={(v) => setForm({ ...form, search_id: v })}
              options={list}
              labelKey="payment_id"
              subKey="cs_name"
              onSelect={(p) => setForm({ ...form, ...p, search_id: p.payment_id })}
            />
          </div>
          <div className="col-md-2"><button id="PAYMENT_ID_SEARCH" className="erp-btn w-100" onClick={() => { if (list[0]) setForm({ ...form, ...list[0] }); }}>Search</button></div>
        </div>

        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Supplier Group</label></div>
          <div className="col-md-3"><AutocompleteInput id="CS_GROUP" value={form.cs_group} onChange={(v) => setForm({ ...form, cs_group: v })} options={master.traderGroups} labelKey="group_name" /></div>
          <div className="col-md-1"><label className="erp-label">Supplier Name</label></div>
          <div className="col-md-3">
            <AutocompleteInput
              id="CS_NAME"
              value={form.cs_name}
              onChange={(v) => setForm({ ...form, cs_name: v })}
              options={master.traders}
              labelKey="cs_name"
              subKey="current_balance"
              onSelect={(t) => setForm({ ...form, cs_name: t.cs_name, cs_group: t.group_name, total_due_amount: String(t.current_balance || 0), due_amount: String(t.current_balance || 0) })}
            />
          </div>
          <div className="col-md-1"><label className="erp-label">Remarks</label></div>
          <div className="col-md-3"><input id="NARRATION" className="erp-input" value={form.narration} onChange={(e) => setForm({ ...form, narration: e.target.value })} /></div>
        </div>

        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Puchase ID</label></div>
          <div className="col-md-2"><input id="PURCHASEID" className="erp-input" value={form.purchase_id} onChange={(e) => setForm({ ...form, purchase_id: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Payment Type</label></div>
          <div className="col-md-2">
            <select id="DropDownListPayType" className="erp-select" value={form.payment_type} onChange={(e) => setForm({ ...form, payment_type: e.target.value })}>
              {['CASH', 'CHEQUE', 'BEFTN', 'EFT', 'NPSB', 'MOBILE BANKING', 'CREDIT CARD', 'DEBIT CARD', 'P.O'].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="col-md-1"><label className="erp-label">Bank Name</label></div>
          <div className="col-md-2"><AutocompleteInput id="BANK_NAME" value={form.bank_name} disabled={!isBankMode} onChange={(v) => setForm({ ...form, bank_name: v })} options={master.banks} labelKey="bank_name" /></div>
          <div className="col-md-1"><label className="erp-label">Bank Branch</label></div>
          <div className="col-md-2"><AutocompleteInput id="BRANCH_NAME" value={form.branch_name_bank} disabled={!isBankMode} onChange={(v) => setForm({ ...form, branch_name_bank: v })} options={master.bankAccounts} labelKey="branch_name" onSelect={(ba) => setForm({ ...form, branch_name_bank: ba.branch_name, account_no: ba.account_no, bank_name: ba.bank_name })} /></div>
        </div>

        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Account No.</label></div>
          <div className="col-md-2"><AutocompleteInput id="ACC_NO" value={form.account_no} disabled={!isBankMode} onChange={(v) => setForm({ ...form, account_no: v })} options={master.bankAccounts} labelKey="account_no" /></div>
          <div className="col-md-1"><label className="erp-label">Cheque No.</label></div>
          <div className="col-md-2"><AutocompleteInput id="CHEQUE_NO" value={form.cheque_no} disabled={!isBankMode} onChange={(v) => setForm({ ...form, cheque_no: v })} options={master.chequeBooks} labelKey="cheque_no" /></div>
          <div className="col-md-1"><label className="erp-label">Cheque Date</label></div>
          <div className="col-md-2"><input id="CHEQUE_DATE" className="erp-input" placeholder="Date/Mon/Year" disabled={!isBankMode} value={form.cheque_date} onChange={(e) => setForm({ ...form, cheque_date: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Disho. Against Pay.</label></div>
          <div className="col-md-2">
            <select id="DropDownListDishonor" className="erp-select" value={form.dishonor_type} onChange={(e) => setForm({ ...form, dishonor_type: e.target.value })}>
              <option value="--Select--">--Select--</option>
              <option value="PAID CHEQUE DISHONOR AGAINST PAYMENT">PAID CHEQUE DISHONOR AGAINST PAYMENT</option>
            </select>
          </div>
        </div>

        <div className="row g-1 align-items-center mb-2">
          <div className="col-md-1"><label className="erp-label">Invoice Amount</label></div>
          <div className="col-md-2"><input id="INVOCE_AMT" className="erp-input" value={form.invoice_amount} readOnly disabled /></div>
          <div className="col-md-1"><label className="erp-label">Inv. Due Amount</label></div>
          <div className="col-md-2"><input id="DUE_AMOUNT" className="erp-input" value={form.due_amount} readOnly disabled /></div>
          <div className="col-md-1"><label className="erp-label">Total Due Amount</label></div>
          <div className="col-md-2"><input id="TOTAL_DUE_AMT" className="erp-input" value={form.total_due_amount} readOnly disabled /></div>
          <div className="col-md-1"><label className="erp-label">Payable Amount</label></div>
          <div className="col-md-2"><input id="AMOUNT" className="erp-input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
        </div>

        <div className="d-flex flex-wrap gap-1 mb-2">
          <button id="SAVE_BUTTON" className="erp-btn" onClick={() => handleSave('save')}>Save</button>
          <button id="EDIT_BUTTON" className="erp-btn" onClick={() => handleSave('save')}>Edit</button>
          <button id="SMS_SEND" className="erp-btn" onClick={() => notify(`Payment SMS Sent to ${form.cs_name}: BDT ${form.amount}`)}>SMS Send</button>
          <button id="Button1" className="erp-btn" onClick={() => openPrint({
            title: `PAYMENT VOUCHER — ${form.payment_id || 'PAY001260000001'}`,
            meta: { 'Payment ID': form.payment_id, 'Date': form.payment_date, 'Paid To': form.cs_name, 'Payment Type': form.payment_type, 'Cheque No.': form.cheque_no },
            columns: ['Payment ID', 'Supplier Name', 'Purchase ID', 'Payment Type', 'Narration', 'Total Amount'],
            rows: [[form.payment_id || 'NEW', form.cs_name, form.purchase_id, form.payment_type, form.narration, Number(form.amount || 0).toFixed(2)]]
          })}>Print</button>
          <button id="Clear" className="erp-btn" onClick={() => setForm({ ...form, payment_id: '', cs_name: '', amount: '0', narration: '' })}>Clear/New</button>
          <button id="EDIT_GO" className="erp-btn" onClick={() => { if (list[0]) setForm({ ...form, ...list[0] }); }}>Edit&gt;&gt;</button>
          <button id="EXIT" className="erp-btn" onClick={() => navigate('/GI/TREE.aspx')}>Exit</button>
        </div>

        <div className="erp-grid-box">
          <table id="GridView1" className="erp-table">
            <thead><tr><th>Payment ID</th><th>Supplier ID</th><th>Purchase ID</th><th>Payment Type</th><th>Payment Date</th><th>Cheque No.</th><th>Cheque Date</th><th>Total Amount</th><th>Select</th><th>Edit</th><th>Delete</th></tr></thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.payment_id}>
                  <td>{p.payment_id}</td><td>{p.cs_name}</td><td>{p.purchase_id}</td><td>{p.payment_type}</td><td>{p.payment_date}</td><td>{p.cheque_no}</td><td>{p.cheque_date}</td><td>{Number(p.amount || 0).toFixed(2)}</td>
                  <td><button className="erp-btn" onClick={() => setForm({ ...form, ...p })}>Select</button></td>
                  <td><button className="erp-btn" onClick={() => setForm({ ...form, ...p })}>Edit</button></td>
                  <td><button className="erp-btn" onClick={() => handleSave('delete', p.payment_id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </fieldset>
    </div>
  );
}

// 42. COLLECTIONS.aspx — Collection (Received Voucher)
export function CollectionPage() {
  const { master, refreshMaster, notify, openPrint } = useErp();
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [form, setForm] = useState({
    ref_no: '', collection_date: getTodayStr(), on_condition: false,
    search_id: '', collection_id: '', cs_group: '', cs_name: '',
    narration: '', sales_id: '', collection_type: 'CASH',
    bank_name: '', branch_name_bank: '', cheque_no: '', cheque_date: '', account_no: '',
    dishonor_type: '--Select--', dishonor_cheque_no: '',
    invoice_amount: '0', due_amount: '0', total_due_amount: '0', amount: '0'
  });

  const loadList = useCallback(async () => {
    const res = await fetch('/api/accounts/all');
    if (res.ok) {
      const data = await res.json();
      setList(data.collections || []);
    }
  }, []);

  useEffect(() => {
    document.title = 'Collection';
    loadList();
  }, [loadList]);

  const isBankMode = form.collection_type !== 'CASH';

  const handleSave = async (action = 'save', overrideId) => {
    if (action === 'save' && (!form.cs_name.trim() || !Number(form.amount))) {
      return notify('Select Customer Name and input Receive Amount', 'error');
    }
    const res = await fetch('/api/accounts/collection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, collection_id: overrideId || form.collection_id, action })
    });
    const data = await res.json();
    if (data.ok) {
      if (data.id) setForm(f => ({ ...f, collection_id: data.id }));
      notify(data.message);
      await refreshMaster();
      await loadList();
    }
  };

  return (
    <div className="erp-container">
      <fieldset className="erp-fieldset">
        <legend className="erp-legend">Received Voucher</legend>
        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Ref No.</label></div>
          <div className="col-md-2"><input id="REF_NO" className="erp-input" value={form.ref_no} onChange={(e) => setForm({ ...form, ref_no: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Date</label></div>
          <div className="col-md-2"><input id="COLLECTION_DATE" className="erp-input" value={form.collection_date} onChange={(e) => setForm({ ...form, collection_date: e.target.value })} /></div>
          <div className="col-md-2">
            <label className="erp-label d-flex align-items-center gap-1">
              <input id="ON_CONDITION" type="checkbox" checked={form.on_condition} onChange={(e) => setForm({ ...form, on_condition: e.target.checked })} />
              OnCondition &amp; Expenses
            </label>
          </div>
          <div className="col-md-2">
            <AutocompleteInput
              id="SEARCH_COLLECTION_ID"
              value={form.search_id}
              onChange={(v) => setForm({ ...form, search_id: v })}
              options={list}
              labelKey="collection_id"
              subKey="cs_name"
              onSelect={(c) => setForm({ ...form, ...c, search_id: c.collection_id })}
            />
          </div>
          <div className="col-md-2"><button id="PU_ID_SEARCH" className="erp-btn w-100" onClick={() => { if (list[0]) setForm({ ...form, ...list[0] }); }}>Search</button></div>
        </div>

        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Customer Group</label></div>
          <div className="col-md-3"><AutocompleteInput id="CS_GROUP" value={form.cs_group} onChange={(v) => setForm({ ...form, cs_group: v })} options={master.traderGroups} labelKey="group_name" /></div>
          <div className="col-md-1"><label className="erp-label">Customer Name</label></div>
          <div className="col-md-3">
            <AutocompleteInput
              id="CS_NAME"
              value={form.cs_name}
              onChange={(v) => setForm({ ...form, cs_name: v })}
              options={master.traders}
              labelKey="cs_name"
              subKey="current_balance"
              onSelect={(t) => setForm({ ...form, cs_name: t.cs_name, cs_group: t.group_name, total_due_amount: String(t.current_balance || 0), due_amount: String(t.current_balance || 0) })}
            />
          </div>
          <div className="col-md-1"><label className="erp-label">Remarks</label></div>
          <div className="col-md-3"><input id="NARRATION" className="erp-input" value={form.narration} onChange={(e) => setForm({ ...form, narration: e.target.value })} /></div>
        </div>

        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Sales ID</label></div>
          <div className="col-md-2"><input id="SALESID" className="erp-input" value={form.sales_id} onChange={(e) => setForm({ ...form, sales_id: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Collection Type</label></div>
          <div className="col-md-2">
            <select id="DropDownListCollType" className="erp-select" value={form.collection_type} onChange={(e) => setForm({ ...form, collection_type: e.target.value })}>
              {['CASH', 'CHEQUE', 'CASH CHEQUE', 'BEFTN', 'EFT', 'NPSB', 'MOBILE BANKING', 'CREDIT CARD', 'DEBIT CARD', 'P.O'].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="col-md-1"><label className="erp-label">Bank Name</label></div>
          <div className="col-md-2"><AutocompleteInput id="BANK_NAME" value={form.bank_name} disabled={!isBankMode} onChange={(v) => setForm({ ...form, bank_name: v })} options={master.banks} labelKey="bank_name" /></div>
          <div className="col-md-1"><label className="erp-label">Bank Branch</label></div>
          <div className="col-md-2"><AutocompleteInput id="BRANCH_NAME" value={form.branch_name_bank} disabled={!isBankMode} onChange={(v) => setForm({ ...form, branch_name_bank: v })} options={master.bankAccounts} labelKey="branch_name" onSelect={(ba) => setForm({ ...form, branch_name_bank: ba.branch_name, account_no: ba.account_no, bank_name: ba.bank_name })} /></div>
        </div>

        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Account No.</label></div>
          <div className="col-md-2"><AutocompleteInput id="ACC_NO" value={form.account_no} disabled={!isBankMode} onChange={(v) => setForm({ ...form, account_no: v })} options={master.bankAccounts} labelKey="account_no" /></div>
          <div className="col-md-1"><label className="erp-label">Cheque No.</label></div>
          <div className="col-md-2"><input id="CHEQUE_NO" className="erp-input" disabled={!isBankMode} value={form.cheque_no} onChange={(e) => setForm({ ...form, cheque_no: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Cheque Date</label></div>
          <div className="col-md-2"><input id="COLCHEQUE_DATE" className="erp-input" disabled={!isBankMode} value={form.cheque_date} onChange={(e) => setForm({ ...form, cheque_date: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Disho.Again.Coll.</label></div>
          <div className="col-md-2">
            <select id="DropDownListDishonor" className="erp-select" value={form.dishonor_type} onChange={(e) => setForm({ ...form, dishonor_type: e.target.value })}>
              <option value="--Select--">--Select--</option>
              <option value="RECEIVED CHEQUE DISHONOR AGAINST COLLECTION">RECEIVED CHEQUE DISHONOR AGAINST COLLECTION</option>
            </select>
          </div>
        </div>

        <div className="row g-1 align-items-center mb-2">
          <div className="col-md-1"><label className="erp-label">Invoice Amount</label></div>
          <div className="col-md-2"><input id="INVOCE_AMT" className="erp-input" value={form.invoice_amount} readOnly disabled /></div>
          <div className="col-md-1"><label className="erp-label">Inv. Due Amount</label></div>
          <div className="col-md-2"><input id="DUE_AMOUNT" className="erp-input" value={form.due_amount} readOnly disabled /></div>
          <div className="col-md-1"><label className="erp-label">Total Due Amount</label></div>
          <div className="col-md-2"><input id="TOTAL_DUE_AMT" className="erp-input" value={form.total_due_amount} readOnly disabled /></div>
          <div className="col-md-1"><label className="erp-label">Receive Amount</label></div>
          <div className="col-md-2"><input id="AMOUNT" className="erp-input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
        </div>

        <div className="d-flex flex-wrap gap-1 mb-2">
          <button id="SAVE_BUTTON" className="erp-btn" onClick={() => handleSave('save')}>Save</button>
          <button id="EDIT_BUTTON" className="erp-btn" onClick={() => handleSave('save')}>Edit</button>
          <button id="SMS_SEND" className="erp-btn" onClick={() => notify(`Money Receipt SMS Sent to ${form.cs_name}: BDT ${form.amount}`)}>SMS Send</button>
          <button id="PRINTPREVIEW" className="erp-btn" onClick={() => openPrint({
            title: `MONEY RECEIPT / RECEIVED VOUCHER — ${form.collection_id || 'COL001260000001'}`,
            meta: { 'Collection ID': form.collection_id, 'Date': form.collection_date, 'Received From': form.cs_name, 'Collection Type': form.collection_type },
            columns: ['Collection ID', 'Customer Name', 'Invoice No.', 'Collection Type', 'Narration', 'Total Amount'],
            rows: [[form.collection_id || 'NEW', form.cs_name, form.sales_id, form.collection_type, form.narration, Number(form.amount || 0).toFixed(2)]]
          })}>Print</button>
          <button id="PRINT_A5" className="erp-btn" onClick={() => openPrint({
            title: `MONEY RECEIPT (A5) — ${form.collection_id || 'COL001260000001'}`,
            mode: 'a5',
            columns: ['Customer Name', 'Collection Type', 'Remarks', 'Amount'],
            rows: [[form.cs_name, form.collection_type, form.narration, Number(form.amount || 0).toFixed(2)]]
          })}>Print A5</button>
          <button id="Clear" className="erp-btn" onClick={() => setForm({ ...form, collection_id: '', cs_name: '', amount: '0', narration: '' })}>Clear/New</button>
          <button id="COLLEDIT" className="erp-btn" onClick={() => navigate('/GI/DATE_WISE_COLLECTION_SEARCH.aspx')}>Edit&gt;&gt;</button>
          <button id="EXIT" className="erp-btn" onClick={() => navigate('/GI/TREE.aspx')}>Exit</button>
        </div>

        <div className="erp-grid-box">
          <table id="GridView1" className="erp-table">
            <thead><tr><th>Collection ID</th><th>Invoice No.</th><th>Collection Type</th><th>Collection Date</th><th>Bank Name</th><th>Branch Name</th><th>Cheque No.</th><th>Cheque Date</th><th>Total Amount</th><th>Select</th><th>Edit</th><th>Delete</th></tr></thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.collection_id}>
                  <td>{c.collection_id}</td><td>{c.sales_id}</td><td>{c.collection_type}</td><td>{c.collection_date}</td><td>{c.bank_name}</td><td>{c.branch_name_bank}</td><td>{c.cheque_no}</td><td>{c.cheque_date}</td><td>{Number(c.amount || 0).toFixed(2)}</td>
                  <td><button className="erp-btn" onClick={() => setForm({ ...form, ...c })}>Select</button></td>
                  <td><button className="erp-btn" onClick={() => setForm({ ...form, ...c })}>Edit</button></td>
                  <td><button className="erp-btn" onClick={() => handleSave('delete', c.collection_id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </fieldset>
    </div>
  );
}

// 43. BANKTRANSCATION.aspx — Bank Transcation
export function BankTransactionPage() {
  const { master, refreshMaster, notify, openPrint } = useErp();
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [waitingCheques, setWaitingCheques] = useState([]);
  const [form, setForm] = useState({
    ref_no: '', tr_date: getTodayStr(), search_id: '', bank_tr_id: '',
    tr_type: 'CASH DEPOSIT', cheque_no: '', account_no: '', cheque_date: '', narration: '', amount: '0'
  });

  const loadData = useCallback(async () => {
    const res = await fetch('/api/accounts/all');
    if (res.ok) {
      const data = await res.json();
      setList(data.bankTransactions || []);
      setWaitingCheques(data.waitingCheques || []);
    }
  }, []);

  useEffect(() => {
    document.title = 'Bank Transcation';
    loadData();
  }, [loadData]);

  const handleSave = async (action = 'save', overrideId) => {
    if (action === 'save' && !form.account_no) return notify('Select Account No.', 'error');
    const res = await fetch('/api/accounts/bank-transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, bank_tr_id: overrideId || form.bank_tr_id, action })
    });
    const data = await res.json();
    if (data.ok) {
      if (data.id) setForm(f => ({ ...f, bank_tr_id: data.id }));
      notify(data.message);
      await refreshMaster();
      await loadData();
    }
  };

  return (
    <div className="erp-container">
      <fieldset className="erp-fieldset">
        <legend className="erp-legend">Bank Transcation</legend>
        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Ref No.</label></div>
          <div className="col-md-2"><input id="REF_NO" className="erp-input" value={form.ref_no} onChange={(e) => setForm({ ...form, ref_no: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Trnscation Date</label></div>
          <div className="col-md-2"><input id="BANK_TR_DATE" className="erp-input" value={form.tr_date} onChange={(e) => setForm({ ...form, tr_date: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Bank Tran. ID</label></div>
          <div className="col-md-3"><AutocompleteInput id="SEARCH_BANK_TR_ID" value={form.search_id} onChange={(v) => setForm({ ...form, search_id: v })} options={list} labelKey="bank_tr_id" onSelect={(b) => setForm({ ...form, ...b })} /></div>
          <div className="col-md-2"><button id="BANK_TR_ID_SEARCH" className="erp-btn w-100" onClick={() => { if (list[0]) setForm({ ...form, ...list[0] }); }}>Search</button></div>
        </div>

        <div className="row g-1 align-items-center mb-2">
          <div className="col-md-1"><label className="erp-label">Transcation Type</label></div>
          <div className="col-md-2">
            <AutocompleteInput
              id="TITLE_NAME"
              value={form.tr_type}
              onChange={(v) => setForm({ ...form, tr_type: v })}
              options={['CASH DEPOSIT', 'CASH WITHDRAW', 'CHEQUE HONOR', 'CHEQUE DISHONOR', 'BANK INTEREST', 'BANK CHARGE']}
            />
          </div>
          <div className="col-md-1"><label className="erp-label">Cheque No.</label></div>
          <div className="col-md-2"><AutocompleteInput id="CHEQUE_NO" value={form.cheque_no} onChange={(v) => setForm({ ...form, cheque_no: v })} options={waitingCheques} labelKey="cheque_no" subKey="trader_name" onSelect={(c) => setForm({ ...form, cheque_no: c.cheque_no, account_no: c.account_no, cheque_date: c.cheque_date, amount: String(c.amount) })} /></div>
          <div className="col-md-1"><label className="erp-label">Account No.</label></div>
          <div className="col-md-2"><AutocompleteInput id="ACC_NO" value={form.account_no} onChange={(v) => setForm({ ...form, account_no: v })} options={master.bankAccounts} labelKey="account_no" subKey="bank_name" /></div>
          <div className="col-md-1"><label className="erp-label">Amount</label></div>
          <div className="col-md-2"><input id="AMOUNT" className="erp-input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
        </div>

        <div className="d-flex flex-wrap gap-1 mb-2">
          <button id="SAVE_BUTTON" className="erp-btn" onClick={() => handleSave('save')}>Save</button>
          <button id="EDIT_BUTTON" className="erp-btn" onClick={() => handleSave('save')}>Edit</button>
          <button id="MainContent_PRINTPREVIEW" className="erp-btn" onClick={() => openPrint({
            title: 'Bank Transaction Register',
            columns: ['Transcation ID', 'Transcation Date', 'Transcation Type', 'Cheque No.', 'Account No.', 'Amount'],
            rows: list.map(b => [b.bank_tr_id, b.tr_date, b.tr_type, b.cheque_no, b.account_no, Number(b.amount || 0).toFixed(2)])
          })}>Print</button>
          <button id="CLEAR" className="erp-btn" onClick={() => setForm({ ...form, bank_tr_id: '', cheque_no: '', amount: '0' })}>Clear/New</button>
          <button id="EDITT" className="erp-btn" onClick={() => { if (list[0]) setForm({ ...form, ...list[0] }); }}>Edit&gt;&gt;</button>
          <button id="EXIT" className="erp-btn" onClick={() => navigate('/GI/TREE.aspx')}>Exit</button>
        </div>

        <div className="erp-grid-box mb-2" style={{ minHeight: '140px' }}>
          <table id="GridView1" className="erp-table">
            <thead><tr><th>Transcation ID</th><th>Transcation Date</th><th>Type ID</th><th>Transcation Type</th><th>Cheque No.</th><th>Cheque Date</th><th>Account No.</th><th>Amount</th><th>Edit</th><th>Delete</th></tr></thead>
            <tbody>
              {list.map((b) => (
                <tr key={b.bank_tr_id}>
                  <td>{b.bank_tr_id}</td><td>{b.tr_date}</td><td>{b.type_id}</td><td>{b.tr_type}</td><td>{b.cheque_no}</td><td>{b.cheque_date}</td><td>{b.account_no}</td><td>{Number(b.amount || 0).toFixed(2)}</td>
                  <td><button className="erp-btn" onClick={() => setForm({ ...form, ...b })}>Edit</button></td>
                  <td><button className="erp-btn" onClick={() => handleSave('delete', b.bank_tr_id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="erp-sublegend">Cheque List waiting for Transcation</div>
        <div className="erp-grid-box" style={{ minHeight: '90px' }}>
          <table className="erp-table">
            <thead><tr><th>Cheque No.</th><th>Account No.</th><th>Trader Name</th><th>Cheque Date</th><th>Status</th><th>Amount</th><th>Select</th></tr></thead>
            <tbody>
              {waitingCheques.map((c, i) => (
                <tr key={i}>
                  <td>{c.cheque_no}</td><td>{c.account_no}</td><td>{c.trader_name}</td><td>{c.cheque_date}</td><td>{c.status}</td><td>{Number(c.amount || 0).toFixed(2)}</td>
                  <td><button className="erp-btn" onClick={() => setForm({ ...form, tr_type: 'CHEQUE HONOR', cheque_no: c.cheque_no, account_no: c.account_no, cheque_date: c.cheque_date, amount: String(c.amount) })}>Select</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-end fw-bold mt-1">
          Grand Total: {list.reduce((s, b) => s + Number(b.amount || 0), 0).toFixed(2)}
        </div>
      </fieldset>
    </div>
  );
}

// 44. JOURNAL.aspx — Journal Voucher
export function JournalPage() {
  const { master, refreshMaster, notify, openPrint } = useErp();
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [form, setForm] = useState({
    ref_no: '', voucher_date: getTodayStr(), search_id: '', voucher_id: '',
    tr_type: 'DR', acc_sub_group_id: '', acc_head: '', accounts_id: '', accounts_name: '',
    accounts_to: '', narration: '', sales_id: '', cheque_no: '', due_amount: '0', amount: '0'
  });

  const loadList = useCallback(async () => {
    const res = await fetch('/api/accounts/all');
    if (res.ok) {
      const data = await res.json();
      setList(data.journalVouchers || []);
    }
  }, []);

  useEffect(() => {
    document.title = 'Journal Voucher';
    loadList();
  }, [loadList]);

  const handleSave = async (action = 'save', overrideId) => {
    if (action === 'save' && (!form.accounts_name.trim() || !Number(form.amount))) {
      return notify('Select Accounts Name and enter Amount', 'error');
    }
    const res = await fetch('/api/accounts/journal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, voucher_id: overrideId || form.voucher_id, action })
    });
    const data = await res.json();
    if (data.ok) {
      if (data.id) setForm(f => ({ ...f, voucher_id: data.id }));
      notify(data.message);
      await refreshMaster();
      await loadList();
    }
  };

  return (
    <div className="erp-container">
      <fieldset className="erp-fieldset">
        <legend className="erp-legend">Journal Voucher</legend>
        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Ref. No.</label></div>
          <div className="col-md-2"><input id="REF_NO" className="erp-input" value={form.ref_no} onChange={(e) => setForm({ ...form, ref_no: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Voucher Date</label></div>
          <div className="col-md-2"><input id="VOUCHER_DATE" className="erp-input" value={form.voucher_date} onChange={(e) => setForm({ ...form, voucher_date: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Vorcher ID</label></div>
          <div className="col-md-3"><AutocompleteInput id="SEARCH_JOURNAL_ID" value={form.search_id} onChange={(v) => setForm({ ...form, search_id: v })} options={list} labelKey="voucher_id" onSelect={(j) => setForm({ ...form, ...j, amount: String(j.dr_amount || j.cr_amount || 0) })} /></div>
          <div className="col-md-2"><button id="JUR_ID_SEARCH" className="erp-btn w-100" onClick={() => { if (list[0]) setForm({ ...form, ...list[0], amount: String(list[0].dr_amount || list[0].cr_amount || 0) }); }}>Search</button></div>
        </div>

        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Transcation Type</label></div>
          <div className="col-md-2">
            <select id="DropDownListTRType" className="erp-select" value={form.tr_type} onChange={(e) => setForm({ ...form, tr_type: e.target.value })}>
              <option value="DR">Debit</option>
              <option value="CR">Credit</option>
            </select>
          </div>
          <div className="col-md-1"><label className="erp-label">Accounts Group</label></div>
          <div className="col-md-3"><AutocompleteInput id="ACC_HEAD" value={form.acc_head} onChange={(v) => setForm({ ...form, acc_head: v })} options={master.accountSubGroups} labelKey="sub_group_name" onSelect={(sg) => setForm({ ...form, acc_head: sg.sub_group_name, acc_sub_group_id: sg.sub_group_id })} /></div>
          <div className="col-md-1"><label className="erp-label">Accounts Name</label></div>
          <div className="col-md-4"><AutocompleteInput id="ACC_NAME" value={form.accounts_name} onChange={(v) => setForm({ ...form, accounts_name: v })} options={master.accountLedgers} labelKey="accounts_name" subKey="sub_group_name" onSelect={(l) => setForm({ ...form, accounts_name: l.accounts_name, accounts_id: l.accounts_id, acc_head: l.sub_group_name, acc_sub_group_id: l.sub_group_id })} /></div>
        </div>

        <div className="row g-1 align-items-center mb-2">
          <div className="col-md-1"><label className="erp-label">Accounts To</label></div>
          <div className="col-md-3"><AutocompleteInput id="CS_NAME" value={form.accounts_to} onChange={(v) => setForm({ ...form, accounts_to: v })} options={master.accountLedgers} labelKey="accounts_name" /></div>
          <div className="col-md-1"><label className="erp-label">Narration</label></div>
          <div className="col-md-4"><input id="NARRATION" className="erp-input" value={form.narration} onChange={(e) => setForm({ ...form, narration: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Amount</label></div>
          <div className="col-md-2"><input id="AMOUNT" className="erp-input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
        </div>

        <div className="d-flex flex-wrap gap-1 mb-2">
          <button id="SAVE_BUTTON" className="erp-btn" onClick={() => handleSave('save')}>Save</button>
          <button id="EDIT_BUTTON" className="erp-btn" onClick={() => handleSave('save')}>Edit</button>
          <button id="MainContent_PRINTPREVIEW" className="erp-btn" onClick={() => openPrint({
            title: `JOURNAL VOUCHER — ${form.voucher_id || 'JRN001260000001'}`,
            columns: ['Journal Voucher ID', 'Voucher Date', 'Type', 'Accounts Name', 'Accounts To', 'Remarks', 'DR Amount', 'CR Amount'],
            rows: list.map(j => [j.voucher_id, j.voucher_date, j.tr_type, j.accounts_name, j.accounts_to, j.narration, Number(j.dr_amount || 0).toFixed(2), Number(j.cr_amount || 0).toFixed(2)])
          })}>Print</button>
          <button id="Clear" className="erp-btn" onClick={() => setForm({ ...form, voucher_id: '', accounts_name: '', amount: '0', narration: '' })}>Clear/New</button>
          <button id="EDITLINK" className="erp-btn" onClick={() => { if (list[0]) setForm({ ...form, ...list[0], amount: String(list[0].dr_amount || list[0].cr_amount || 0) }); }}>Edit&gt;&gt;</button>
          <button id="EXIT" className="erp-btn" onClick={() => navigate('/GI/TREE.aspx')}>Exit</button>
        </div>

        <div className="erp-grid-box">
          <table id="GridView1" className="erp-table">
            <thead><tr><th>Journal Voucher ID</th><th>Voucher Date</th><th>Transcation Type</th><th>Accounts ID</th><th>Accounts Name</th><th>Accounts To</th><th>Remarks</th><th>Sales ID</th><th>Cheque No.</th><th>DR Amount</th><th>CR Amount</th><th>Edit</th><th>Delete</th></tr></thead>
            <tbody>
              {list.map((j) => (
                <tr key={j.voucher_id}>
                  <td>{j.voucher_id}</td><td>{j.voucher_date}</td><td>{j.tr_type}</td><td>{j.accounts_id}</td><td>{j.accounts_name}</td><td>{j.accounts_to}</td><td>{j.narration}</td><td>{j.sales_id}</td><td>{j.cheque_no}</td><td>{Number(j.dr_amount || 0).toFixed(2)}</td><td>{Number(j.cr_amount || 0).toFixed(2)}</td>
                  <td><button className="erp-btn" onClick={() => setForm({ ...form, ...j, amount: String(j.dr_amount || j.cr_amount || 0) })}>Edit</button></td>
                  <td><button className="erp-btn" onClick={() => handleSave('delete', j.voucher_id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </fieldset>
    </div>
  );
}

// 45. CHEQUE_SEARCH.aspx — Cheque Search
export function ChequeSearchPage() {
  const { master, openPrint } = useErp();
  const navigate = useNavigate();
  const [chequeNo, setChequeNo] = useState('');

  useEffect(() => {
    document.title = 'Cheque Search';
  }, []);

  const term = chequeNo.trim().toLowerCase();
  const rows = master.chequeBooks.filter(c => !term || String(c.cheque_no || '').toLowerCase().includes(term) || String(c.trader_name || '').toLowerCase().includes(term));

  return (
    <div className="erp-container">
      <fieldset className="erp-fieldset mb-2">
        <legend className="erp-legend">Cheque Search by Cheque No.</legend>
        <div className="row g-2 align-items-center">
          <div className="col-md-2"><label className="erp-label">Input Cheque No.</label></div>
          <div className="col-md-4"><AutocompleteInput id="CHEQUENO" value={chequeNo} onChange={setChequeNo} options={master.chequeBooks} labelKey="cheque_no" subKey="status" /></div>
          <div className="col-md-6 d-flex gap-2">
            <button id="SEARCH" className="erp-btn" onClick={() => {}}>Search</button>
            <button id="MainContent_Button1" className="erp-btn" onClick={() => setChequeNo('')}>Clear</button>
            <button id="MainContent_EXIT" className="erp-btn" onClick={() => navigate('/GI/TREE.aspx')}>Exit</button>
          </div>
        </div>
      </fieldset>

      <fieldset className="erp-fieldset">
        <legend className="erp-legend">Cheque Transcation Bellow</legend>
        <div className="erp-grid-box">
          <table id="GridView1" className="erp-table">
            <thead><tr><th>Trancation Type</th><th>Cheqe Type</th><th>Transcation ID</th><th>Traders Name</th><th>Transcation Date</th><th>Cheque No.</th><th>Cheque Date</th><th>Amount</th><th>Cheque Status</th><th>Print</th></tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>{r.transaction_type || 'CHEQUE BOOK'}</td><td>CHEQUE</td><td>{r.transaction_id || '-'}</td><td>{r.trader_name || '-'}</td><td>{r.transaction_date || '-'}</td><td>{r.cheque_no}</td><td>{r.cheque_date || '-'}</td><td>{Number(r.amount || 0).toFixed(2)}</td><td>{r.status}</td>
                  <td><button className="erp-btn" onClick={() => openPrint({
                    title: `Cheque Leaf Status — ${r.cheque_no}`,
                    columns: ['Bank', 'Branch', 'Account No.', 'Cheque No.', 'Trader', 'Amount', 'Status'],
                    rows: [[r.bank_name, r.branch_name, r.account_no, r.cheque_no, r.trader_name, r.amount, r.status]]
                  })}>Print</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </fieldset>
    </div>
  );
}

// 46. DATE_WISE_COLLECTION_SEARCH.aspx — Date Wise Collection Search
export function DateWiseCollectionSearchPage() {
  const { openPrint } = useErp();
  const navigate = useNavigate();
  const [date1, setDate1] = useState(getMonthStartStr());
  const [date2, setDate2] = useState(getTodayStr());
  const [rows, setRows] = useState([]);

  const handleSearch = useCallback(async () => {
    const res = await fetch('/api/accounts/all');
    if (res.ok) {
      const data = await res.json();
      setRows(data.collections || []);
    }
  }, []);

  useEffect(() => {
    document.title = 'DATE WISE COLLECTION';
    handleSearch();
  }, [handleSearch]);

  return (
    <div className="erp-container">
      <fieldset className="erp-fieldset mb-2">
        <legend className="erp-legend">Date wise Collection Search</legend>
        <div className="row g-2 align-items-center">
          <div className="col-md-1"><label className="erp-label">Date.</label></div>
          <div className="col-md-2"><input id="DATE1" className="erp-input" value={date1} onChange={(e) => setDate1(e.target.value)} /></div>
          <div className="col-md-1 text-center"><label className="erp-label">to</label></div>
          <div className="col-md-2"><input id="DATE2" className="erp-input" value={date2} onChange={(e) => setDate2(e.target.value)} /></div>
          <div className="col-md-6 d-flex gap-2">
            <button id="SEARCH" className="erp-btn" onClick={handleSearch}>Search</button>
            <button id="MainContent_Button1" className="erp-btn" onClick={() => setRows([])}>Clear</button>
            <button id="MainContent_EXIT" className="erp-btn" onClick={() => navigate('/GI/TREE.aspx')}>Exit</button>
          </div>
        </div>
      </fieldset>

      <fieldset className="erp-fieldset">
        <legend className="erp-legend">Searched Information</legend>
        <div className="erp-grid-box">
          <table id="GridView1" className="erp-table">
            <thead>
              <tr>
                <th>SL</th><th>Type</th><th>User Name</th><th>Transcation ID</th><th>Customer Name</th><th>Transcation Date</th><th>Transcation Type</th><th>Cheque No.</th><th>Cheque Date</th><th>Invoice No.</th><th>Amount</th><th>Approval</th><th>Print</th><th>Edit</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.collection_id}>
                  <td>{i + 1}</td><td>COLLECTION</td><td>{r.user_name || 'JUBAYER'}</td><td>{r.collection_id}</td><td>{r.cs_name}</td><td>{r.collection_date}</td><td>{r.collection_type}</td><td>{r.cheque_no}</td><td>{r.cheque_date}</td><td>{r.sales_id}</td><td>{Number(r.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td><button className="btn btn-success btn-sm py-0 px-2" disabled>Approved</button></td>
                  <td><button className="erp-btn" onClick={() => openPrint({
                    title: `MONEY RECEIPT — ${r.collection_id}`,
                    columns: ['Collection ID', 'Customer Name', 'Date', 'Type', 'Invoice No.', 'Amount'],
                    rows: [[r.collection_id, r.cs_name, r.collection_date, r.collection_type, r.sales_id, Number(r.amount || 0).toFixed(2)]]
                  })}>Print</button></td>
                  <td><button className="erp-btn" onClick={() => navigate('/GI/COLLECTIONS.aspx')}>Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </fieldset>
    </div>
  );
}

// 47. SALARY_PROCESS.aspx — Salary Process
export function SalaryProcessPage() {
  const { notify, openPrint } = useErp();
  const navigate = useNavigate();
  const [accountsName, setAccountsName] = useState('SALARY EXPENSES');
  const [processDate, setProcessDate] = useState(getTodayStr());
  const [year, setYear] = useState('2026');
  const [month, setMonth] = useState('11');
  const [rows, setRows] = useState([]);

  const runAction = useCallback(async (action = 'preview') => {
    const res = await fetch('/api/accounts/salary-process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, accounts_name: accountsName, process_date: processDate, year, month })
    });
    const data = await res.json();
    if (data.ok) {
      setRows(data.rows || []);
      if (data.message) notify(data.message);
    }
  }, [accountsName, processDate, year, month, notify]);

  useEffect(() => {
    document.title = 'Salary Process';
    runAction('preview');
  }, []);

  return (
    <div className="erp-container">
      <fieldset className="erp-fieldset mb-2">
        <legend className="erp-legend">Employee Salary Process.</legend>
        <div className="row g-2 align-items-center mb-2">
          <div className="col-md-2"><label className="erp-label">Accounts Name</label></div>
          <div className="col-md-3"><input id="ACC_NAME" className="erp-input" value={accountsName} readOnly /></div>
          <div className="col-md-1"><label className="erp-label">Process Date</label></div>
          <div className="col-md-2"><input id="VOURCHER_DATE" className="erp-input" value={processDate} onChange={(e) => setProcessDate(e.target.value)} /></div>
          <div className="col-md-1"><label className="erp-label">Input Year.</label></div>
          <div className="col-md-1"><input id="SERIALNO" className="erp-input" value={year} onChange={(e) => setYear(e.target.value)} /></div>
          <div className="col-md-1"><label className="erp-label">Month</label></div>
          <div className="col-md-1">
            <select id="DropDownMonth" className="erp-select" value={month} onChange={(e) => setMonth(e.target.value)}>
              {[['1','January'],['2','February'],['3','March'],['4','April'],['5','May'],['6','June'],['7','July'],['8','August'],['9','September'],['10','October'],['11','November'],['12','December']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <button id="SEARCH" className="erp-btn" onClick={() => runAction('preview')}>Preview</button>
          <button id="PROCESS" className="erp-btn" onClick={() => runAction('process')}>Process</button>
          <button id="DELETE" className="erp-btn" onClick={() => runAction('delete')}>Process Delete</button>
          <button id="MainContent_PRINT" className="erp-btn" onClick={() => openPrint({
            title: `Monthly Salary Sheet — ${month}/${year}`,
            columns: ['SL', 'Employee ID', 'Employee Name', 'Designation', 'Basic Salary', 'Gross Salary', 'Status'],
            rows: rows.map((r, i) => [i + 1, r.employee_id, r.employee_name, r.designation, Number(r.basic_salary || 0).toFixed(2), Number(r.gross_salary || 0).toFixed(2), r.status]),
            summary: { 'Total Gross Salary': rows.reduce((s, r) => s + Number(r.gross_salary || 0), 0).toFixed(2) }
          })}>Print</button>
          <button id="MainContent_Button1" className="erp-btn" onClick={() => setRows([])}>Clear</button>
          <button id="MainContent_EXIT" className="erp-btn" onClick={() => navigate('/GI/TREE.aspx')}>Exit</button>
        </div>
      </fieldset>

      <fieldset className="erp-fieldset">
        <legend className="erp-legend">All  Active Employee Information.</legend>
        <div className="erp-grid-box">
          <table className="erp-table">
            <thead><tr><th>SL</th><th>Employee ID</th><th>Employee Name</th><th>Designation</th><th>Basic Salary</th><th>Gross Salary</th><th>Status</th></tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.employee_id}>
                  <td>{i + 1}</td><td>{r.employee_id}</td><td>{r.employee_name}</td><td>{r.designation}</td><td>{Number(r.basic_salary || 0).toFixed(2)}</td><td>{Number(r.gross_salary || 0).toFixed(2)}</td><td>{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </fieldset>
    </div>
  );
}

// 48. BALANCETRANSFER.aspx — Balance Transfer
export function BalanceTransferPage() {
  const { master, notify, openPrint } = useErp();
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [form, setForm] = useState({
    ref_no: '', transfer_date: getTodayStr(), search_id: '', transfer_id: '',
    transfer_to: 'HAZI TRADERS-2', tr_type: 'CASH', account_no: '', narration: '', amount: '0'
  });

  const loadList = useCallback(async () => {
    const res = await fetch('/api/accounts/all');
    if (res.ok) {
      const data = await res.json();
      setList(data.balanceTransfers || []);
    }
  }, []);

  useEffect(() => {
    document.title = 'Balance Transfer';
    loadList();
  }, [loadList]);

  const handleSave = async (action = 'save', overrideId) => {
    const res = await fetch('/api/accounts/balance-transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, transfer_id: overrideId || form.transfer_id, action })
    });
    const data = await res.json();
    if (data.ok) {
      if (data.id) setForm(f => ({ ...f, transfer_id: data.id }));
      notify(data.message);
      await loadList();
    }
  };

  return (
    <div className="erp-container">
      <fieldset className="erp-fieldset">
        <legend className="erp-legend">Balance Transfer Branch to Branch</legend>
        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Ref No.</label></div>
          <div className="col-md-2"><input id="REF_NO" className="erp-input" value={form.ref_no} onChange={(e) => setForm({ ...form, ref_no: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Transfer Date</label></div>
          <div className="col-md-2"><input id="TRANSFER_DATE" className="erp-input" value={form.transfer_date} onChange={(e) => setForm({ ...form, transfer_date: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Transfer ID</label></div>
          <div className="col-md-3"><AutocompleteInput id="SEARCH_PURCHASE_ID" value={form.search_id} onChange={(v) => setForm({ ...form, search_id: v })} options={list} labelKey="transfer_id" onSelect={(b) => setForm({ ...form, ...b })} /></div>
          <div className="col-md-2"><button id="PU_ID_SEARCH" className="erp-btn w-100" onClick={() => { if (list[0]) setForm({ ...form, ...list[0] }); }}>Search</button></div>
        </div>

        <div className="row g-1 align-items-center mb-2">
          <div className="col-md-1"><label className="erp-label">Branch Name</label></div>
          <div className="col-md-2"><AutocompleteInput id="COMPANY_NAME" value={form.transfer_to} onChange={(v) => setForm({ ...form, transfer_to: v })} options={master.branches} labelKey="branch_name" /></div>
          <div className="col-md-1"><label className="erp-label">Transcation Type</label></div>
          <div className="col-md-2">
            <select id="TRANSCATION_TYPE" className="erp-select" value={form.tr_type} onChange={(e) => setForm({ ...form, tr_type: e.target.value })}>
              <option value="CASH">CASH</option>
              <option value="BANK">BANK A/C</option>
            </select>
          </div>
          <div className="col-md-1"><label className="erp-label">Account No.</label></div>
          <div className="col-md-2"><AutocompleteInput id="ACCOUNT_NO" value={form.account_no} disabled={form.tr_type === 'CASH'} onChange={(v) => setForm({ ...form, account_no: v })} options={master.bankAccounts} labelKey="account_no" /></div>
          <div className="col-md-1"><label className="erp-label">Amount</label></div>
          <div className="col-md-2"><input id="AMOUNT" className="erp-input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
        </div>

        <div className="d-flex flex-wrap gap-1 mb-2">
          <button id="SAVE_BUTTON" className="erp-btn" onClick={() => handleSave('save')}>Save</button>
          <button id="EDIT" className="erp-btn" onClick={() => handleSave('save')}>Edit</button>
          <button id="PRINT" className="erp-btn" onClick={() => openPrint({
            title: 'Branch Balance Transfer Register',
            columns: ['Transfer ID', 'Date', 'From Branch', 'To Branch', 'Type', 'Account No.', 'Amount'],
            rows: list.map(b => [b.transfer_id, b.transfer_date, b.transfer_from, b.transfer_to, b.tr_type, b.account_no, Number(b.amount || 0).toFixed(2)])
          })}>Print</button>
          <button id="APPROVAL" className="erp-btn" onClick={() => notify('Balance Transfer Approved')}>Approve</button>
          <button id="CLEAR" className="erp-btn" onClick={() => setForm({ ...form, transfer_id: '', amount: '0' })}>Clear/New</button>
          <button id="EXIT" className="erp-btn" onClick={() => navigate('/GI/TREE.aspx')}>Exit</button>
        </div>

        <div className="erp-grid-box">
          <table id="GridView1" className="erp-table">
            <thead><tr><th>Transfer ID</th><th>Transfer Date</th><th>Tranasfer From</th><th>Transfer To</th><th>Transfer Type</th><th>Account No.</th><th>Amount</th><th>Selsect</th><th>Delete</th></tr></thead>
            <tbody>
              {list.map((b) => (
                <tr key={b.transfer_id}>
                  <td>{b.transfer_id}</td><td>{b.transfer_date}</td><td>{b.transfer_from}</td><td>{b.transfer_to}</td><td>{b.tr_type}</td><td>{b.account_no}</td><td>{Number(b.amount || 0).toFixed(2)}</td>
                  <td><button className="erp-btn" onClick={() => setForm({ ...form, ...b })}>Selsect</button></td>
                  <td><button className="erp-btn" onClick={() => handleSave('delete', b.transfer_id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </fieldset>
    </div>
  );
}
