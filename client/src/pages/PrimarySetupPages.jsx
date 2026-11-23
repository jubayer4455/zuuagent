import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useErp } from '../context/ErpContext.jsx';
import AutocompleteInput from '../components/AutocompleteInput.jsx';
import { openWhatsAppChat, buildWhatsAppDueText } from '../utils/whatsapp.js';

// 1. CSGROUP.aspx — Traders Group
export function TradersGroupPage() {
  const { master, refreshMaster, notify } = useErp();
  const navigate = useNavigate();
  const [groupId, setGroupId] = useState('');
  const [groupName, setGroupName] = useState('');
  const [active, setActive] = useState('Y');

  useEffect(() => {
    document.title = 'Buyer Group';
    setGroupId(master.nextIds?.traderGroup || 'CSG005');
  }, [master.nextIds?.traderGroup]);

  const handleClear = () => {
    setGroupId(master.nextIds?.traderGroup || 'CSG005');
    setGroupName('');
    setActive('Y');
  };

  const handleAction = async (action) => {
    if (!groupName.trim()) return notify('Please input Group Name', 'error');
    const res = await fetch('/api/setup/trader-group', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, group_id: groupId, group_name: groupName, active })
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
        <legend className="erp-legend">Traders Group</legend>
        <div className="row g-2 align-items-center mb-2">
          <div className="col-md-2"><label className="erp-label">Group ID</label></div>
          <div className="col-md-4"><input id="CS_GROUP_ID" className="erp-input" value={groupId} readOnly disabled /></div>
          <div className="col-md-2"><label className="erp-label">Group Name</label></div>
          <div className="col-md-4">
            <AutocompleteInput
              id="CS_GROUP_NAME"
              value={groupName}
              onChange={setGroupName}
              options={master.traderGroups}
              labelKey="group_name"
              subKey="group_id"
              onSelect={(g) => {
                setGroupId(g.group_id);
                setGroupName(g.group_name);
                setActive(g.active || 'Y');
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
          <button id="EDIT" className="erp-btn" onClick={() => handleAction('save')}>Edit</button>
          <button id="DELETE" className="erp-btn" onClick={() => handleAction('delete')}>Delete</button>
          <button id="CLEAR" className="erp-btn" onClick={handleClear}>Clear</button>
          <button id="EXIT" className="erp-btn" onClick={() => navigate('/GI/TREE.aspx')}>Exit</button>
        </div>
        <div className="mt-2" style={{ fontSize: '11.5px', color: '#555' }}>DHAKA</div>
      </fieldset>
    </div>
  );
}

// 2. CUSTOMERINFORMATION.aspx — Traders Information
export function TradersInfoPage() {
  const { user, master, refreshMaster, notify, openPrint } = useErp();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    group_id: '', group_name: '', mpo_id: '', mpo_name: '',
    cs_id: '', cs_name: '', address: '', mobile: '', phone: '',
    email: '', contact_person: '', credit_limit: '0', bin: '',
    opening_balance: '0', trader_type: 'S', customer_type: 'DEALER', active: 'Y'
  });

  useEffect(() => {
    document.title = 'Trader Information';
    setForm((f) => ({ ...f, cs_id: f.cs_id || master.nextIds?.trader || 'CS00009' }));
  }, [master.nextIds?.trader]);

  const handleClear = () => {
    setForm({
      group_id: '', group_name: '', mpo_id: '', mpo_name: '',
      cs_id: master.nextIds?.trader || 'CS00009', cs_name: '', address: '', mobile: '', phone: '',
      email: '', contact_person: '', credit_limit: '0', bin: '',
      opening_balance: '0', trader_type: 'S', customer_type: 'DEALER', active: 'Y'
    });
  };

  const handleAction = async (action) => {
    if (!form.cs_name.trim()) return notify('Please enter Trader Name', 'error');
    const res = await fetch('/api/setup/trader', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, action })
    });
    const data = await res.json();
    if (data.ok) {
      notify(data.message);
      await refreshMaster();
      if (action === 'delete') handleClear();
    }
  };

  const handlePrint = (filterMode) => {
    let rows = master.traders;
    if (filterMode === 'single' && form.cs_name) {
      rows = rows.filter(t => t.cs_name === form.cs_name);
    } else if (filterMode === 'group' && form.group_name) {
      rows = rows.filter(t => t.group_name === form.group_name);
    }
    openPrint({
      title: filterMode === 'group' ? `Group Wise Traders List (${form.group_name || 'All'})` : 'Traders Information Register',
      columns: ['SL', 'Trader ID', 'Trader Name', 'Group', 'Type', 'Customer Type', 'Mobile', 'Address', 'MPO/SR', 'Credit Limit', 'Opening Bal.'],
      rows: rows.map((t, i) => [i + 1, t.cs_id, t.cs_name, t.group_name, t.trader_type === 'S' ? 'SUPPLIER' : 'CUSTOMER', t.customer_type, t.mobile, t.address, t.mpo_name, t.credit_limit, t.opening_balance]),
      summary: { 'Total Traders': rows.length }
    });
  };

  return (
    <div className="erp-container">
      <fieldset className="erp-fieldset">
        <legend className="erp-legend">Trader Information</legend>
        <div className="row g-2 align-items-center mb-2">
          <div className="col-md-1"><label className="erp-label">Group ID</label></div>
          <div className="col-md-2"><input id="CS_GROUP_ID" className="erp-input" value={form.group_id} readOnly disabled /></div>
          <div className="col-md-1"><label className="erp-label">Group Name</label></div>
          <div className="col-md-4">
            <AutocompleteInput
              id="CS_GROUP_NAME"
              value={form.group_name}
              onChange={(v) => setForm({ ...form, group_name: v })}
              options={master.traderGroups}
              labelKey="group_name"
              subKey="group_id"
              onSelect={(g) => setForm({ ...form, group_id: g.group_id, group_name: g.group_name })}
            />
          </div>
          <div className="col-md-1"><button id="ADD" className="erp-btn w-100" onClick={() => navigate('/GI/CSGROUP.aspx')}>Add</button></div>
          <div className="col-md-1"><label className="erp-label">Trader Type</label></div>
          <div className="col-md-2">
            <select id="DropDownListCSStatus" className="erp-select" value={form.trader_type} onChange={(e) => setForm({ ...form, trader_type: e.target.value })}>
              <option value="S">SUPPLIER</option>
              <option value="C">CUSTOMER</option>
            </select>
          </div>
        </div>

        <div className="row g-2 align-items-center mb-2">
          <div className="col-md-1"><label className="erp-label">MPO/SR ID</label></div>
          <div className="col-md-2"><input id="MPO_ID" className="erp-input" value={form.mpo_id} readOnly disabled /></div>
          <div className="col-md-1"><label className="erp-label">MPO/SR Name</label></div>
          <div className="col-md-5">
            <AutocompleteInput
              id="MPO_NAME"
              value={form.mpo_name}
              onChange={(v) => setForm({ ...form, mpo_name: v })}
              options={master.employees}
              labelKey="employee_name"
              subKey="employee_id"
              onSelect={(emp) => setForm({ ...form, mpo_id: emp.employee_id, mpo_name: emp.employee_name })}
            />
          </div>
          <div className="col-md-1"><label className="erp-label">Customer Type</label></div>
          <div className="col-md-2">
            <select id="DropDownListCustomerType" className="erp-select" value={form.customer_type} onChange={(e) => setForm({ ...form, customer_type: e.target.value })}>
              <option value="DEALER">DEALER</option>
              <option value="RETAILER">RETAILER</option>
            </select>
          </div>
        </div>

        <div className="row g-2 align-items-center mb-2">
          <div className="col-md-1"><label className="erp-label">Trader ID</label></div>
          <div className="col-md-2"><input id="CS_ID" className="erp-input" value={form.cs_id} readOnly disabled /></div>
          <div className="col-md-1"><label className="erp-label">Trader Name</label></div>
          <div className="col-md-5">
            <AutocompleteInput
              id="CS_NAME"
              value={form.cs_name}
              onChange={(v) => setForm({ ...form, cs_name: v })}
              options={master.traders}
              labelKey="cs_name"
              subKey="mobile"
              onSelect={(t) => setForm({
                group_id: t.group_id, group_name: t.group_name,
                mpo_id: t.mpo_id, mpo_name: t.mpo_name,
                cs_id: t.cs_id, cs_name: t.cs_name,
                address: t.address, mobile: t.mobile, phone: t.phone,
                email: t.email, contact_person: t.contact_person,
                credit_limit: t.credit_limit, bin: t.bin,
                opening_balance: t.opening_balance,
                trader_type: t.trader_type || 'C',
                customer_type: t.customer_type || 'DEALER',
                active: t.active || 'Y'
              })}
            />
          </div>
          <div className="col-md-1"><label className="erp-label">Active</label></div>
          <div className="col-md-2">
            <select id="DropDownListActive" className="erp-select" value={form.active} onChange={(e) => setForm({ ...form, active: e.target.value })}>
              <option value="Y">Yes</option>
              <option value="N">No</option>
            </select>
          </div>
        </div>

        <div className="row g-2 align-items-center mb-2">
          <div className="col-md-1"><label className="erp-label">Address</label></div>
          <div className="col-md-5"><input id="TADDRESS" className="erp-input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Mobile No.</label></div>
          <div className="col-md-2"><input id="TMOBILE" className="erp-input" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Phone No.</label></div>
          <div className="col-md-2"><input id="PHONE" className="erp-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        </div>

        <div className="row g-2 align-items-center mb-3">
          <div className="col-md-1"><label className="erp-label">Email</label></div>
          <div className="col-md-2"><input id="TEMAIL" className="erp-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Contact Person</label></div>
          <div className="col-md-2"><input id="CONTACT_PERSON" className="erp-input" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Credit Limit</label></div>
          <div className="col-md-1"><input id="CREDIT_LIMIT" className="erp-input" value={form.credit_limit} onChange={(e) => setForm({ ...form, credit_limit: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">BIN</label></div>
          <div className="col-md-1"><input id="TBIN" className="erp-input" value={form.bin} onChange={(e) => setForm({ ...form, bin: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Opening Balance</label></div>
          <div className="col-md-1"><input id="BALANCE" className="erp-input" value={form.opening_balance} onChange={(e) => setForm({ ...form, opening_balance: e.target.value })} /></div>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <button id="SAVE" className="erp-btn" onClick={() => handleAction('save')}>Save</button>
          <button id="EDIT" className="erp-btn" onClick={() => handleAction('save')}>Edit</button>
          <button id="DELETE" className="erp-btn" onClick={() => handleAction('delete')}>Delete</button>
          <button id="PRINT" className="erp-btn" onClick={() => handlePrint('single')}>Print</button>
          <button id="PRINT_ALL" className="erp-btn" onClick={() => handlePrint('all')}>Print All</button>
          <button id="PRINT_GROUP" className="erp-btn" onClick={() => handlePrint('group')}>Group wise Print</button>
          <button id="PREVIEW" className="erp-btn" onClick={() => handlePrint('all')}>Preview All</button>
          <button
            id="WHATSAPP_DUE"
            className="erp-btn fw-bold"
            style={{ background: '#dcfce7', borderColor: '#22c55e', color: '#15803d' }}
            onClick={() => {
              const matched = (master.traders || []).find(t => t.cs_id === form.cs_id || t.cs_name === form.cs_name);
              const due = matched ? Number(matched.current_balance || form.opening_balance || 0) : Number(form.opening_balance || 0);
              const activeBranch = (master?.branches || []).find(b => b.branch_name === (user?.branch || 'HAZI TRADERS')) || master?.branches?.[0] || {};
              const msg = buildWhatsAppDueText({
                shopName: activeBranch.branch_name || user?.branch || 'HAZI TRADERS',
                shopPhone: activeBranch.phone || '',
                customerName: form.cs_name || 'Valued Customer',
                dueBalance: due,
                footerNote: activeBranch.invoice_footer || 'Please clear your due at your earliest convenience. Thank you!'
              });
              openWhatsAppChat(form.mobile || form.phone || '', msg);
            }}
          >
            WhatsApp Due Reminder
          </button>
          <button id="CLEAR" className="erp-btn" onClick={handleClear}>Clear</button>
          <button id="EXIT" className="erp-btn" onClick={() => navigate('/GI/TREE.aspx')}>Exit</button>
        </div>
      </fieldset>
    </div>
  );
}

// 3. CATEGORY.aspx — Category Information
export function CategoryPage() {
  const { master, refreshMaster, notify } = useErp();
  const navigate = useNavigate();
  const [catId, setCatId] = useState('');
  const [catName, setCatName] = useState('');
  const [active, setActive] = useState('Y');

  useEffect(() => {
    document.title = 'Category Information';
    setCatId(master.nextIds?.category || 'CAT004');
  }, [master.nextIds?.category]);

  const handleClear = () => {
    setCatId(master.nextIds?.category || 'CAT004');
    setCatName('');
    setActive('Y');
  };

  const handleAction = async (action) => {
    if (!catName.trim()) return notify('Please input Category Name', 'error');
    const res = await fetch('/api/setup/category', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, category_id: catId, category_name: catName, active })
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
        <legend className="erp-legend">Category Information</legend>
        <div className="row g-2 align-items-center mb-2">
          <div className="col-md-2"><label className="erp-label">Category ID</label></div>
          <div className="col-md-4"><input id="PRODUCT_GROUP_ID" className="erp-input" value={catId} readOnly disabled /></div>
          <div className="col-md-2"><label className="erp-label">Category Name</label></div>
          <div className="col-md-4">
            <AutocompleteInput
              id="PRODUCT_GROUP_NAME"
              value={catName}
              onChange={setCatName}
              options={master.categories}
              labelKey="category_name"
              subKey="category_id"
              onSelect={(c) => {
                setCatId(c.category_id);
                setCatName(c.category_name);
                setActive(c.active || 'Y');
              }}
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
          <button id="CLEAR" className="erp-btn" onClick={handleClear}>Clear</button>
          <button id="EXIT" className="erp-btn" onClick={() => navigate('/GI/TREE.aspx')}>Exit</button>
        </div>
      </fieldset>
    </div>
  );
}

// 4. PRODUCTGROUP.aspx — Product Group
export function ProductGroupPage() {
  const { master, refreshMaster, notify } = useErp();
  const navigate = useNavigate();
  const [groupId, setGroupId] = useState('');
  const [groupName, setGroupName] = useState('');
  const [active, setActive] = useState('Y');

  useEffect(() => {
    document.title = 'Product Group';
    setGroupId(master.nextIds?.productGroup || 'PG006');
  }, [master.nextIds?.productGroup]);

  const handleClear = () => {
    setGroupId(master.nextIds?.productGroup || 'PG006');
    setGroupName('');
    setActive('Y');
  };

  const handleAction = async (action) => {
    if (!groupName.trim()) return notify('Please input Group Name', 'error');
    const res = await fetch('/api/setup/product-group', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, group_id: groupId, group_name: groupName, active })
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
        <legend className="erp-legend">Product Group</legend>
        <div className="row g-2 align-items-center mb-2">
          <div className="col-md-2"><label className="erp-label">Group ID</label></div>
          <div className="col-md-4"><input id="PRODUCT_GROUP_ID" className="erp-input" value={groupId} readOnly disabled /></div>
          <div className="col-md-2"><label className="erp-label">Group Name</label></div>
          <div className="col-md-4">
            <AutocompleteInput
              id="PRODUCT_GROUP_NAME"
              value={groupName}
              onChange={setGroupName}
              options={master.productGroups}
              labelKey="group_name"
              subKey="group_id"
              onSelect={(g) => {
                setGroupId(g.group_id);
                setGroupName(g.group_name);
                setActive(g.active || 'Y');
              }}
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
          <button id="CLEAR" className="erp-btn" onClick={handleClear}>Clear</button>
          <button id="EXIT" className="erp-btn" onClick={() => navigate('/GI/TREE.aspx')}>Exit</button>
        </div>
      </fieldset>
    </div>
  );
}

// 5. BRAND.aspx — Brand Information
export function BrandPage() {
  const { master, refreshMaster, notify } = useErp();
  const navigate = useNavigate();
  const [brandId, setBrandId] = useState('');
  const [brandName, setBrandName] = useState('');
  const [active, setActive] = useState('Y');

  useEffect(() => {
    document.title = 'Brand Information';
    setBrandId(master.nextIds?.brand || 'BR006');
  }, [master.nextIds?.brand]);

  const handleClear = () => {
    setBrandId(master.nextIds?.brand || 'BR006');
    setBrandName('');
    setActive('Y');
  };

  const handleAction = async (action) => {
    if (!brandName.trim()) return notify('Please input Brand Name', 'error');
    const res = await fetch('/api/setup/brand', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, brand_id: brandId, brand_name: brandName, active })
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
        <legend className="erp-legend">Brand Information</legend>
        <div className="row g-2 align-items-center mb-2">
          <div className="col-md-2"><label className="erp-label">Brand ID</label></div>
          <div className="col-md-4"><input id="BRAND_ID" className="erp-input" value={brandId} readOnly disabled /></div>
          <div className="col-md-2"><label className="erp-label">Brand Name</label></div>
          <div className="col-md-4">
            <AutocompleteInput
              id="BRAND_NAME"
              value={brandName}
              onChange={setBrandName}
              options={master.brands}
              labelKey="brand_name"
              subKey="brand_id"
              onSelect={(b) => {
                setBrandId(b.brand_id);
                setBrandName(b.brand_name);
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
          <button id="Button1" className="erp-btn" onClick={() => handleAction('save')}>Save</button>
          <button id="EDIT" className="erp-btn" onClick={() => handleAction('save')}>Edit</button>
          <button id="DELETE" className="erp-btn" onClick={() => handleAction('delete')}>Delete</button>
          <button id="MainContent_CLEAR" className="erp-btn" onClick={handleClear}>Clear</button>
          <button id="MainContent_EXIT" className="erp-btn" onClick={() => navigate('/GI/TREE.aspx')}>Exit</button>
        </div>
      </fieldset>
    </div>
  );
}

// 6. PRODUCTINFORMATION.aspx — Product Information (Exact match to final_step_44.png)
export function ProductInfoPage() {
  const { master, refreshMaster, notify, openPrint } = useErp();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    category_id: '', category_name: '',
    group_id: '', group_name: '',
    brand_id: '', brand_name: '',
    product_id: '', product_name: '',
    barcode_id: '', description: '',
    location: '', color: '', size: '',
    serial_item: 'N', inventory_item: 'Y',
    purchase_price: '0', sales_price: '0', unit: 'PCS',
    discount: '0', wholesale_price: '0', dealer_price: '0',
    wholesale_comm: '0', dealer_comm: '0', sales_comm: '0',
    warranty: '', reorder_level: '0', red_level: '0',
    vat: '0', level_qty: '0', active: 'Y', image_url: ''
  });

  useEffect(() => {
    document.title = 'Product Information';
    setForm((f) => ({ ...f, product_id: f.product_id || master.nextIds?.product || 'PRD00006' }));
  }, [master.nextIds?.product]);

  const handleClear = () => {
    setForm({
      category_id: '', category_name: '',
      group_id: '', group_name: '',
      brand_id: '', brand_name: '',
      product_id: master.nextIds?.product || 'PRD00006', product_name: '',
      barcode_id: '', description: '',
      location: '', color: '', size: '',
      serial_item: 'N', inventory_item: 'Y',
      purchase_price: '0', sales_price: '0', unit: 'PCS',
      discount: '0', wholesale_price: '0', dealer_price: '0',
      wholesale_comm: '0', dealer_comm: '0', sales_comm: '0',
      warranty: '', reorder_level: '0', red_level: '0',
      vat: '0', level_qty: '0', active: 'Y', image_url: ''
    });
  };

  const handleAction = async (action) => {
    if (!form.product_name.trim()) return notify('Please enter Item/Model No.', 'error');
    const res = await fetch('/api/setup/product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, action })
    });
    const data = await res.json();
    if (data.ok) {
      notify(data.message);
      await refreshMaster();
      if (action === 'delete') handleClear();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (data.ok) {
      setForm({ ...form, image_url: data.url });
      notify('Product image uploaded');
    }
  };

  const [showInlineStock, setShowInlineStock] = useState(false);

  const handleStockView = () => {
    setShowInlineStock(true);
    openPrint({
      title: 'Real-Time Product Stock View',
      columns: ['SL', 'Product ID', 'Category', 'Group', 'Brand', 'Item/Model No.', 'Unit', 'Purchase Price', 'Sales Price', 'Commercial Stock', 'RMA Stock'],
      rows: master.products.map((p, i) => [i + 1, p.product_id, p.category_name, p.group_name, p.brand_name, p.product_name, p.unit, p.purchase_price, p.sales_price, p.stock_qty, p.rma_stock_qty]),
      summary: { 'Total Products': master.products.length }
    });
  };

  const handleLevelPrint = () => {
    const qty = Math.max(1, Math.min(24, Number(form.level_qty || 6)));
    const pName = form.product_name || 'HAMKO 150AH TUBULAR IPS BATTERY';
    const bCode = form.barcode_id || '89010001';
    const price = form.sales_price || '19800';
    openPrint({
      title: `Barcode Label Print (${pName})`,
      customContent: (
        <div className="d-flex flex-wrap gap-3 justify-content-center">
          {Array.from({ length: qty }).map((_, i) => (
            <div key={i} className="border rounded p-2 text-center" style={{ width: '190px', backgroundColor: '#fff' }}>
              <div className="fw-bold" style={{ fontSize: '12px' }}>HAZI TRADERS</div>
              <div style={{ fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pName}</div>
              <div style={{ fontFamily: 'monospace', fontSize: '16px', letterSpacing: '2px', borderTop: '2px solid #000', borderBottom: '2px solid #000', margin: '4px 0', padding: '2px 0' }}>
                ||| || |||| | |||
              </div>
              <div style={{ fontSize: '11.5px', fontWeight: 'bold' }}>{bCode} — TK. {price}</div>
            </div>
          ))}
        </div>
      )
    });
  };

  return (
    <div className="erp-container">
      <fieldset className="erp-fieldset">
        <legend className="erp-legend">Product Information</legend>

        <div className="row g-2 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Category ID</label></div>
          <div className="col-md-2"><input id="CATEGORY_ID" className="erp-input" value={form.category_id} readOnly disabled /></div>
          <div className="col-md-1"><label className="erp-label">Category Name</label></div>
          <div className="col-md-7">
            <AutocompleteInput
              id="CATEGORY"
              value={form.category_name}
              onChange={(v) => setForm({ ...form, category_name: v })}
              options={master.categories}
              labelKey="category_name"
              subKey="category_id"
              onSelect={(c) => setForm({ ...form, category_id: c.category_id, category_name: c.category_name })}
            />
          </div>
          <div className="col-md-1"><button id="MainContent_CAT" className="erp-btn w-100" onClick={() => navigate('/GI/CATEGORY.aspx')}>Add</button></div>
        </div>

        <div className="row g-2 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Group ID</label></div>
          <div className="col-md-2"><input id="PRODUCT_GROUP_ID" className="erp-input" value={form.group_id} readOnly disabled /></div>
          <div className="col-md-1"><label className="erp-label">Group Name</label></div>
          <div className="col-md-7">
            <AutocompleteInput
              id="PRODUCT_GROUP"
              value={form.group_name}
              onChange={(v) => setForm({ ...form, group_name: v })}
              options={master.productGroups}
              labelKey="group_name"
              subKey="group_id"
              onSelect={(g) => setForm({ ...form, group_id: g.group_id, group_name: g.group_name })}
            />
          </div>
          <div className="col-md-1"><button id="ADD_GROUP" className="erp-btn w-100" onClick={() => navigate('/GI/PRODUCTGROUP.aspx')}>Add</button></div>
        </div>

        <div className="row g-2 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Brand ID</label></div>
          <div className="col-md-2"><input id="BRAND_ID" className="erp-input" value={form.brand_id} readOnly disabled /></div>
          <div className="col-md-1"><label className="erp-label">Brand Name</label></div>
          <div className="col-md-7">
            <AutocompleteInput
              id="BRAND_NAME"
              value={form.brand_name}
              onChange={(v) => setForm({ ...form, brand_name: v })}
              options={master.brands}
              labelKey="brand_name"
              subKey="brand_id"
              onSelect={(b) => setForm({ ...form, brand_id: b.brand_id, brand_name: b.brand_name })}
            />
          </div>
          <div className="col-md-1"><button id="ADD_BRAND" className="erp-btn w-100" onClick={() => navigate('/GI/BRAND.aspx')}>Add</button></div>
        </div>

        <div className="row g-2 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Product ID</label></div>
          <div className="col-md-2"><input id="PRODUCT_ID" className="erp-input" value={form.product_id} readOnly disabled /></div>
          <div className="col-md-1"><label className="erp-label">Item/Model No.</label></div>
          <div className="col-md-7">
            <AutocompleteInput
              id="PRODUCT_NAME"
              value={form.product_name}
              onChange={(v) => setForm({ ...form, product_name: v })}
              options={master.products}
              labelKey="product_name"
              subKey="group_name"
              onSelect={(p) => setForm({
                category_id: p.category_id, category_name: p.category_name,
                group_id: p.group_id, group_name: p.group_name,
                brand_id: p.brand_id, brand_name: p.brand_name,
                product_id: p.product_id, product_name: p.product_name,
                barcode_id: p.barcode_id, description: p.description,
                location: p.location, color: p.color, size: p.size,
                serial_item: p.serial_item || 'N', inventory_item: p.inventory_item || 'Y',
                purchase_price: p.purchase_price, sales_price: p.sales_price,
                unit: p.unit || 'PCS', discount: p.discount,
                wholesale_price: p.wholesale_price, dealer_price: p.dealer_price,
                wholesale_comm: p.wholesale_comm, dealer_comm: p.dealer_comm,
                sales_comm: p.sales_comm, warranty: p.warranty,
                reorder_level: p.reorder_level, red_level: p.red_level,
                vat: p.vat, level_qty: p.level_qty,
                active: p.active || 'Y', image_url: p.image_url || ''
              })}
            />
          </div>
          <div className="col-md-1"><button id="STOCK" className="erp-btn w-100" onClick={handleStockView}>Stock View</button></div>
        </div>

        <div className="row g-2 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Barcode ID</label></div>
          <div className="col-md-2"><input id="BARCODE_ID" className="erp-input" value={form.barcode_id} disabled /></div>
          <div className="col-md-1"><label className="erp-label">Description.</label></div>
          <div className="col-md-7">
            <textarea id="PRODUCT_DESCRIPTION" className="erp-textarea" rows={1} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>

        <div className="row g-2 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Location</label></div>
          <div className="col-md-2"><input id="LOCATIONT" className="erp-input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Color</label></div>
          <div className="col-md-2">
            <AutocompleteInput
              id="COLORT"
              value={form.color}
              onChange={(v) => setForm({ ...form, color: v })}
              options={master.colors}
              labelKey="color_name"
            />
          </div>
          <div className="col-md-1"><label className="erp-label">Size</label></div>
          <div className="col-md-2"><input id="SIZET" className="erp-input" value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Serial</label></div>
          <div className="col-md-2">
            <select id="DropDownListSerial" className="erp-select" value={form.serial_item} onChange={(e) => setForm({ ...form, serial_item: e.target.value })}>
              <option value="N">No</option>
              <option value="Y">Yes</option>
            </select>
          </div>
        </div>

        <div className="row g-2 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Purchase Price</label></div>
          <div className="col-md-2"><input id="PURCHASE_PRICE" className="erp-input text-center" value={form.purchase_price} onChange={(e) => setForm({ ...form, purchase_price: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Sales Price</label></div>
          <div className="col-md-2"><input id="SALES_PRICE" className="erp-input text-center" value={form.sales_price} onChange={(e) => setForm({ ...form, sales_price: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Inventory</label></div>
          <div className="col-md-2">
            <select id="DropDownListInventory" className="erp-select" value={form.inventory_item} onChange={(e) => setForm({ ...form, inventory_item: e.target.value })}>
              <option value="Y">Yes</option>
              <option value="N">No</option>
            </select>
          </div>
          <div className="col-md-1"><label className="erp-label">Unit</label></div>
          <div className="col-md-2"><input id="UNIT" className="erp-input text-center" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div>
        </div>

        <div className="row g-2 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Discount</label></div>
          <div className="col-md-1"><input id="DISCOUNT" className="erp-input text-center" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Wholesale Price</label></div>
          <div className="col-md-1"><input id="WHOLE_SALES" className="erp-input text-center" value={form.wholesale_price} onChange={(e) => setForm({ ...form, wholesale_price: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Dealer Price</label></div>
          <div className="col-md-1"><input id="DEALER_PRICE" className="erp-input text-center" value={form.dealer_price} onChange={(e) => setForm({ ...form, dealer_price: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Who.Sal. Comm.</label></div>
          <div className="col-md-1"><input id="WHOLE_SALES_COMM" className="erp-input text-center" value={form.wholesale_comm} onChange={(e) => setForm({ ...form, wholesale_comm: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Dealer Comm.</label></div>
          <div className="col-md-1"><input id="DEALER_SALES_COMM" className="erp-input text-center" value={form.dealer_comm} onChange={(e) => setForm({ ...form, dealer_comm: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Sales Comm.</label></div>
          <div className="col-md-1"><input id="RETAIL_COMM" className="erp-input text-center" value={form.sales_comm} onChange={(e) => setForm({ ...form, sales_comm: e.target.value })} /></div>
        </div>

        <div className="row g-2 align-items-center mb-2">
          <div className="col-md-1"><label className="erp-label">Warranty</label></div>
          <div className="col-md-1"><input id="WARRANTY" className="erp-input text-center" value={form.warranty} onChange={(e) => setForm({ ...form, warranty: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Re-Order Level</label></div>
          <div className="col-md-1"><input id="REORDER_LEVEL" className="erp-input text-center" value={form.reorder_level} onChange={(e) => setForm({ ...form, reorder_level: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Red Level</label></div>
          <div className="col-md-1"><input id="RED_LEVEL" className="erp-input text-center" value={form.red_level} onChange={(e) => setForm({ ...form, red_level: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">VAT(%)</label></div>
          <div className="col-md-1"><input id="VAT" className="erp-input text-center" value={form.vat} onChange={(e) => setForm({ ...form, vat: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Level Qty.</label></div>
          <div className="col-md-1"><input id="LEVEL_QTY" className="erp-input text-center" value={form.level_qty} onChange={(e) => setForm({ ...form, level_qty: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Active</label></div>
          <div className="col-md-1">
            <select id="DropDownListActive" className="erp-select" value={form.active} onChange={(e) => setForm({ ...form, active: e.target.value })}>
              <option value="Y">Yes</option>
              <option value="N">No</option>
            </select>
          </div>
        </div>

        <div className="row g-2 align-items-center mb-2">
          <div className="col-md-8"></div>
          <div className="col-md-2">
            <input id="FileUpload1" type="file" accept="image/*" onChange={handleFileChange} style={{ fontSize: '12px' }} />
          </div>
          <div className="col-md-2">
            <div style={{ width: '150px', height: '85px', border: '1px solid #ced4da', backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {form.image_url ? (
                <img src={form.image_url} alt="Product" style={{ maxWidth: '100%', maxHeight: '100%' }} />
              ) : (
                <span style={{ fontSize: '11px', color: '#888' }}>SELECT IMAGE ▼</span>
              )}
            </div>
          </div>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <button type="button" id="Save" className="erp-btn" onClick={() => handleAction('save')}>Save</button>
          <button type="button" id="EDIT" className="erp-btn" onClick={() => handleAction('save')}>Edit</button>
          <button type="button" id="GROUP_EDIT" className="erp-btn" onClick={() => handleAction('save')}>Group Edit</button>
          <button type="button" id="SERIALUPDATE" className="erp-btn" onClick={() => handleAction('save')}>Serial Edit</button>
          <button type="button" id="DELETE" className="erp-btn" onClick={() => handleAction('delete')}>Delete</button>
          <button type="button" id="MainContent_PRINT" className="erp-btn" onClick={handleStockView}>Print</button>
          <button type="button" id="MainContent_LEVEL_PRINT" className="erp-btn" onClick={handleLevelPrint}>Level Print</button>
          <button type="button" id="MainContent_PRINT_PREVIEW" className="erp-btn" onClick={handleStockView}>Print Preview</button>
          <button type="button" id="CLEAR" className="erp-btn" onClick={handleClear}>Clear</button>
          <button type="button" id="EXIT" className="erp-btn" onClick={() => navigate('/GI/TREE.aspx')}>Exit</button>
        </div>

        {showInlineStock && (
          <div id="div_grid" className="erp-grid-box mt-2">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>SL</th><th>Product ID</th><th>Category</th><th>Group</th><th>Brand</th><th>Item/Model No.</th><th>Unit</th><th>Purchase Price</th><th>Sales Price</th><th>Commercial Stock</th><th>RMA Stock</th><th>Select</th>
                </tr>
              </thead>
              <tbody>
                {master.products.map((p, idx) => (
                  <tr key={p.product_id}>
                    <td>{idx + 1}</td><td>{p.product_id}</td><td>{p.category_name}</td><td>{p.group_name}</td><td>{p.brand_name}</td><td>{p.product_name}</td><td>{p.unit}</td><td>{p.purchase_price}</td><td>{p.sales_price}</td><td>{p.stock_qty}</td><td>{p.rma_stock_qty}</td>
                    <td><button type="button" className="erp-btn" onClick={() => setForm({ ...form, ...p })}>Select</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </fieldset>
    </div>
  );
}

// 7. PRICE_SETUP.aspx — Price Setup
export function PriceSetupPage() {
  const { master, refreshMaster, notify } = useErp();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    branch_name: 'HAZI TRADERS',
    all_branch: false,
    group_name: '',
    brand_name: '',
    product_name: '',
    purchase_price: '',
    sales_price_with_tax: '',
    sales_price_without_tax: '',
    wholesale_price: '',
    dealer_price: '',
    red_level: ''
  });

  useEffect(() => {
    document.title = 'Price Setup';
  }, []);

  const handleSave = async () => {
    if (!form.product_name.trim()) return notify('Please select Item/Model No.', 'error');
    const res = await fetch('/api/setup/price-setup', {
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
        <legend className="erp-legend">Price Setup</legend>
        <div className="row g-2 align-items-center mb-2">
          <div className="col-md-2"><label className="erp-label">Branch Name</label></div>
          <div className="col-md-4">
            <select id="MainContent_DropDownListCompany" className="erp-select" value={form.branch_name} onChange={(e) => setForm({ ...form, branch_name: e.target.value })}>
              <option value=""></option>
              <option value="HAZI TRADERS">HAZI TRADERS</option>
              <option value="HAZI TRADERS-2">HAZI TRADERS-2</option>
            </select>
          </div>
          <div className="col-md-2"><label className="erp-label">Group Name</label></div>
          <div className="col-md-4">
            <AutocompleteInput
              id="PRODUCT_GROUP"
              value={form.group_name}
              onChange={(v) => setForm({ ...form, group_name: v })}
              options={master.productGroups}
              labelKey="group_name"
            />
          </div>
        </div>

        <div className="row g-2 align-items-center mb-2">
          <div className="col-md-2"><label className="erp-label">Brand Name</label></div>
          <div className="col-md-4">
            <AutocompleteInput
              id="BRAND_NAME"
              value={form.brand_name}
              onChange={(v) => setForm({ ...form, brand_name: v })}
              options={master.brands}
              labelKey="brand_name"
            />
          </div>
          <div className="col-md-2"><label className="erp-label">Item/Model No.</label></div>
          <div className="col-md-4">
            <AutocompleteInput
              id="PRODUCT_NAME"
              value={form.product_name}
              onChange={(v) => setForm({ ...form, product_name: v })}
              options={master.products}
              labelKey="product_name"
              onSelect={(p) => setForm({
                ...form,
                product_name: p.product_name,
                group_name: p.group_name,
                brand_name: p.brand_name,
                purchase_price: p.purchase_price,
                sales_price_with_tax: p.sales_price,
                sales_price_without_tax: p.sales_price,
                wholesale_price: p.wholesale_price,
                dealer_price: p.dealer_price,
                red_level: p.red_level
              })}
            />
          </div>
        </div>

        <div className="row g-2 align-items-center mb-2">
          <div className="col-md-2"><label className="erp-label">Purchase Price</label></div>
          <div className="col-md-4"><input id="PURCHASE_PRICE" className="erp-input" value={form.purchase_price} onChange={(e) => setForm({ ...form, purchase_price: e.target.value })} /></div>
          <div className="col-md-2"><label className="erp-label">TP/Sales Price</label></div>
          <div className="col-md-3">
            <input
              id="SALES_PRICE_WITH_TAX"
              className="erp-input"
              value={form.sales_price_with_tax}
              onChange={(e) => setForm({ ...form, sales_price_with_tax: e.target.value, sales_price_without_tax: e.target.value })}
            />
          </div>
          <div className="col-md-1">
            <label className="erp-label d-flex align-items-center gap-1">
              <input id="ALL_BRANCH" type="checkbox" checked={form.all_branch} onChange={(e) => setForm({ ...form, all_branch: e.target.checked })} />
              All Branch
            </label>
          </div>
        </div>

        <div className="row g-2 align-items-center mb-2">
          <div className="col-md-2"><label className="erp-label">Sales Price</label></div>
          <div className="col-md-4"><input id="SALES_PRICE_WITHOUT_TAX" className="erp-input" value={form.sales_price_without_tax} readOnly disabled /></div>
          <div className="col-md-2"><label className="erp-label">WholeSale Price</label></div>
          <div className="col-md-4"><input id="WHOLE_PRICE" className="erp-input" value={form.wholesale_price} onChange={(e) => setForm({ ...form, wholesale_price: e.target.value })} /></div>
        </div>

        <div className="row g-2 align-items-center mb-3">
          <div className="col-md-2"><label className="erp-label">Dealer Price</label></div>
          <div className="col-md-4"><input id="DEALER_PRICE" className="erp-input" value={form.dealer_price} onChange={(e) => setForm({ ...form, dealer_price: e.target.value })} /></div>
          <div className="col-md-2"><label className="erp-label">Red Level</label></div>
          <div className="col-md-4"><input id="RED_LEVEL" className="erp-input" value={form.red_level} onChange={(e) => setForm({ ...form, red_level: e.target.value })} /></div>
        </div>

        <div className="d-flex gap-2">
          <button id="SAVE" className="erp-btn" onClick={handleSave}>Save</button>
          <button id="EDIT" className="erp-btn" onClick={handleSave}>Edit</button>
          <button id="CLEAR" className="erp-btn" onClick={() => setForm({ ...form, product_name: '', purchase_price: '', sales_price_with_tax: '', sales_price_without_tax: '', wholesale_price: '', dealer_price: '', red_level: '' })}>Clear</button>
          <button id="EXIT" className="erp-btn" onClick={() => navigate('/GI/TREE.aspx')}>Exit</button>
        </div>
      </fieldset>
    </div>
  );
}

// 8. COLOR.aspx — Color Information
export function ColorPage() {
  const { master, refreshMaster, notify } = useErp();
  const navigate = useNavigate();
  const [colorId, setColorId] = useState('');
  const [colorName, setColorName] = useState('');
  const [active, setActive] = useState('Y');

  useEffect(() => {
    document.title = 'Color Information';
    setColorId(master.nextIds?.color || 'CLR005');
  }, [master.nextIds?.color]);

  const handleClear = () => {
    setColorId(master.nextIds?.color || 'CLR005');
    setColorName('');
    setActive('Y');
  };

  const handleAction = async (action) => {
    if (!colorName.trim()) return notify('Please input Color Name', 'error');
    const res = await fetch('/api/setup/color', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, color_id: colorId, color_name: colorName, active })
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
        <legend className="erp-legend">Color Information</legend>
        <div className="row g-2 align-items-center mb-2">
          <div className="col-md-2"><label className="erp-label">Color ID</label></div>
          <div className="col-md-4"><input id="BRAND_ID" className="erp-input" value={colorId} readOnly disabled /></div>
          <div className="col-md-2"><label className="erp-label">Color Name</label></div>
          <div className="col-md-4">
            <AutocompleteInput
              id="BRAND_NAME"
              value={colorName}
              onChange={setColorName}
              options={master.colors}
              labelKey="color_name"
              subKey="color_id"
              onSelect={(c) => {
                setColorId(c.color_id);
                setColorName(c.color_name);
                setActive(c.active || 'Y');
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
          <button id="Button1" className="erp-btn" onClick={() => handleAction('save')}>Save</button>
          <button id="EDIT" className="erp-btn" onClick={() => handleAction('save')}>Edit</button>
          <button id="DELETE" className="erp-btn" onClick={() => handleAction('delete')}>Delete</button>
          <button id="MainContent_CLEAR" className="erp-btn" onClick={handleClear}>Clear</button>
          <button id="MainContent_EXIT" className="erp-btn" onClick={() => navigate('/GI/TREE.aspx')}>Exit</button>
        </div>
      </fieldset>
    </div>
  );
}
