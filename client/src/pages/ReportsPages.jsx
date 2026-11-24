import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useErp, getTodayStr, getMonthStartStr } from '../context/ErpContext.jsx';
import AutocompleteInput from '../components/AutocompleteInput.jsx';

// Exact 16 Purchase Reports
const PURCHASE_REPORT_LIST = [
  'Date Wise Purchase',
  'Date wise Net Purchase',
  'Date wise Purchase Details',
  'Product wise Purchase All',
  'Product wise Purchase Individual',
  'Product Purchase WOP',
  'Purchase List WOP',
  'Product Group wise Purchase',
  'Product Brand wise Purchase',
  'Product Group & Brand wise Purchase',
  'Supplier wise Purchase',
  'Supplier wise Product Group Purchase',
  'Supplier wise Product Brand Purchase',
  'Supplier wise Product Group & Brand Purchase',
  'Supplier wise Product Purchase',
  'Purchase Return'
];

// Exact 58 Sales Reports
const SALES_REPORT_LIST = [
  'Date Wise Sales',
  'Date Wise Sales Details (with Profit) Org. Cost',
  'Date Wise Sales Details (with Profit) Avg. Cost',
  'Date & Invoice Wise Gross Profit',
  'Date wise Discount/VAT/TAX/Extra Charge Summary',
  'Date & Cuseromer wise Discount/VAT/TAX/Extra Charge Summary',
  'Date wise Sales Summary',
  'Date wise Net Sales',
  'Product wise Profit (Individual)',
  'Product Group wise Profit (Individual)',
  'Product wise Gross Profit(Branch)',
  'Product Group/Brand wise Gross Profit(Branch)',
  'Product Group wise Sales Details',
  'Product Group & Brand Sales Summary',
  'Product/Group/Brand Summary',
  'Brand wise Sales Details',
  'Product Category wise Sales',
  'Product Category & Group Wise Sales',
  'Product Category & Brand Wise Sales',
  'Product wise Sales(All Product)',
  'Product wise Sales All Customer(Inividual)',
  'Product wise Sales Details(Inividual)',
  'Product & Customer Wise Sales(Inividual)',
  'Branch Sales Summary',
  'Branch wise Invoice Gross Profit',
  'Branch to Branch Transer List',
  'Branch to Branch Received List',
  'Cash Sales Customer Information',
  'Customer Sales & Collection (Invoice Wise)',
  'Customer Wise Sales',
  'Customer Sales Details',
  'Customer Wise Sales Summary',
  'Customer Wise Net Sales Summary All',
  'Customer Wise Sales Qty. Summary',
  'Customer wise Profit',
  'Supplier Wise Profit',
  'Supplier Wise Sales',
  'User wise Sales',
  'Advance Sales List',
  'MPO wise Sales Statement',
  'MPO wise Product Group/Brand Gross Profit',
  'MPO wise Product Sales',
  'MPO wise Product Sales Summary(Inividual)',
  'MPO wise Product Sales Details(Inividual)',
  'Date wise Challan',
  'Date wise Customer Challan',
  'Date wise Challan Return',
  'Date wise Price Quotation',
  'Customer wise Price Quotation',
  'Date wise Sales & Expenses Summary',
  'Customer Wise Product Sales',
  'Product/Group/Brand Monthly Statement',
  'Product/Group/Brand Monthly Statement & Amount',
  'MPO wise Sales',
  'Customer wise Sales & Collection (with Ageing)',
  'Customer wise Invoice Due (with Ageing)',
  'Group wise Sales & Collection (with Ageing)',
  'Sales Person Wise Sales'
];

// Exact 29 Trader Reports
const CS_REPORT_LIST = [
  'Supplier & Customer Ledger',
  'Supplier & Customer Ledger Preview',
  'Supplier & Customer Ledger Details',
  'Combine Supplier & Customer Ledger (All Branch)',
  'Supplier & Customer Ledger Preview (All Branch)',
  'Supplier & Customer Due List',
  'Supplier & Customer Due List (Group wise)',
  'Accounts Receivable',
  'Accounts Receivable (Group wise)',
  'Accounts Receivable (with Cheque Amount)',
  'Accounts Payable',
  'Accounts Payable (Group wise)',
  'Accounts Payable (with Cheque Amount)',
  'Date Wise Due Details',
  'Date Wise Due All',
  'Date Wise Due All (Dealer/Customer)',
  'Date Wise Receiable',
  'Date Wise Receiable (Individual MPO/SR)',
  'Date Wise Due All Dealer/Customer(Individual MPO/SR)',
  'Date Wise Due All Dealer/Customer(MPO/SR)',
  'Date Wise Due All Dealer/Customer with Qty.(MPO/SR)',
  'Date Wise Due all Dealer/Customer(Individual Area Manager)',
  'Date Wise Due all Dealer/Customer(Individual Group by)',
  'Date Wise Payable',
  'Customer Invoice Wise Due',
  'Customer Wise Sales & Collection',
  'Branch wise Supplier & Customer Due List',
  'Customer Leder',
  'Supplier Leder'
];

// Exact 29 Accounts Reports
const ACCOUNTS_REPORT_LIST = [
  'Cash Book',
  'Cash Book Preview',
  'Day Book',
  'Cash & Bank Summary',
  'General Accounts Ledger',
  'General Accounts Ledger Details',
  'Account To Summary',
  'General Accounts Group wise Details',
  'General Accounts Group wise Summary',
  'Date wise Branch Expenses All',
  'Date wise Collection',
  'Account wise Collection',
  'Promise Date wise Collection',
  'Customer wise Collection (Individual)',
  'Customer wise Collection All',
  'Group wise Collection',
  'Type wise Collection (Cash/Cheque/Mobile Banking etc)',
  'Date wise Payment',
  'Account wise Payment',
  'Promise Date wise Payment',
  'Suppplier wise Payment (Individual)',
  'Suppplier wise Payment All',
  'Group wise Payment',
  'Type wise Payment (Cash/Cheque/Mobile Banking etc)',
  'Trial Balance',
  'Profit & Loss Account',
  'Profit & Loss Account All Branch',
  'Income Statement',
  'Balance Sheet'
];

// Exact 55 Stock Reports
const STOCK_REPORT_LIST = [
  'Crrent Stock - All',
  'Current Stock - All (Without Cost)',
  'Product Category wise Stock',
  'Category & Group wise Stock',
  'Category & Brand wise Stock',
  'Category & Group & Brand wise Stock',
  'Product Group wise Stock',
  'Product Group wise Stock (without cost)',
  'Product Group & Brand wise Stock',
  'Product Group & Brand wise Stock (without cost)',
  'Product Brand wise Stock',
  'Product Brand wise Stock (without cost)',
  'Serial Wise Stock All',
  'Serial Wise Stock All (Without Cost)',
  'Product Serial Wise Stock',
  'Product Group Serial Wise Stock',
  'Product Group Serial Wise Stock (Without Cost)',
  'Product Group & Brand Serial Wise Stock',
  'Product Age Wise Stock',
  'Product Ledger',
  'Product Ledger without Cost',
  'Product Re-Order List',
  'Product Group Wise Re-Order List',
  'Product Brand Wise Re-Order List',
  'Real Time Stock View',
  'Branch wise Stock (Combind)',
  'Branch Wise Stock with Average Cost',
  'Branch Wise Stock withouth Cost',
  'Branch Wise Stock with Cost(Product Group wise)',
  'Branch Wise Stock withouth Cost(Product Group wise)',
  'Branch Wise Stock with Cost(Product Brand wise)',
  'Branch Wise Stock withouth Cost(Product Brand wise)',
  'Branch Wise Stock with Cost(Product Group & Brand wise)',
  'Branch Wise Stock withouth Cost(Product Group & Brand wise)',
  'Branch Wise Stock withouth Cost(Product wise)',
  'Branch Wise Stock with Cost(Product wise)',
  'Branch to Branch Product Transfer All',
  'Branch to Branch Product Transfer (Branch wise)',
  'Branch to Branch Product Transfer Group Wise',
  'Branch to Branch Product Transfer Brand Wise',
  'Branch to Branch Product Transfer Group & Brand Wise',
  'Stock Transfer Branch to Branch',
  'Store wise Stock',
  'Date wise Stock',
  'Date wise Stock Summary',
  'Date wise Stock Summary (Without Cost)',
  'Expiry Date wise Stock',
  'Supplier Wise Stock',
  'Supplier Wise Stock Only Serial',
  'Supplier wise Product Group Stock',
  'Supplier wise Product Group Stock Only Serial',
  'Supplier wise Product Brand Stock',
  'Supplier wise Product Brand Stock Only Serial',
  'Supplier wise Product Group & Brand Stock',
  'Stock Differance'
];

// Exact 16 Bank Reports
const BANK_REPORT_LIST = [
  'Bank Statement',
  'Date wise Cheque Receive',
  'Receipt Cheque Waiting For Deposit',
  'Receipt Cheque Waiting For Honor',
  'Customer wise Cheque Receive',
  'Customere wise Cheque Honor',
  'Customere wise Cheque Dishonor',
  'Date wise Cheque Payment',
  'Paid Cheque Waiting For Honor',
  'Account No. wise Paid Cheque Waiting For Honor',
  'Paid Cheque Waiting For Honor (Cheque Date)',
  'Supplier wise Cheque waiting For Honor',
  'Supplier wise Cheque Payment (Payment Date)',
  'Supplier wise Cheque Payment (Cheque Date)',
  'Supplier wise Cheque Honor',
  'Suppliere wise Cheque Dishonor'
];

// Exact 42 RMA Reports
const RMA_REPORT_LIST = [
  'Date wise Complain Received',
  'Customer wise Complain Received',
  'Product wise Complain Received',
  'Complain Received Pending (All)',
  'Date wise Complain Received Pending',
  'Customer wise Complain Received Pending',
  'Date wise Replace Out',
  'Supplier wise Replace Out',
  'Product wise Replace Out',
  'Replace Out Pending (In-House)',
  'Date wise Replace In',
  'Supplier wise Replace In',
  'Product wise Replace In',
  'Date wise Replace Delivery',
  'RMA Stock',
  'Customer wise Replace Delivery',
  'Product wise Replace Delivery',
  'Date wise Item Received',
  'Customer wise Item Received',
  'Customer wise Item Pending',
  'Date wise Item Pending',
  'Date wise Job Assigne',
  'Date wise Diagnosis',
  'Date wise Delivery',
  'Customer wise Delivery',
  'Date wise Bill Entry',
  'Date wise Guarenty Card Entry',
  'Dealer wise Guarenty Card Entry',
  'Date wise BSR Entry',
  'Dealer wise BSR Entry',
  'Date wise BSR Pending',
  'Dealer wise BSR Pending',
  'Date wise Replace Entry',
  'Executive wise BSR Summary',
  'Executive wise BSR Summary Pending',
  'Dealer wise BSR Summary',
  'Dealer wise BSR Pending Summary',
  'Dealer & Product wise BSR Summary (Individual)',
  'Date wie Replace Statement',
  'BSR & Replace Statement',
  'BSR & Replace Statement (Individual)',
  'Dealer Claim Battery Statistics'
];

// Exact 12 Modification Reports
const MODIFICATION_REPORT_LIST = [
  'Date wise/User wise Purchase Logs.',
  'Purchase ID wise Purchase Logs.',
  'Date wise/User wise Purchase Retrun Logs.',
  'Purchase Return ID wise Purchase Retrun Logs.',
  'Date wise/User wise Sales Logs.',
  'Invoice wise Sales Logs.',
  'Date wise/User wise Sales Return Logs.',
  'Sales Return ID wise Sales Return Logs.',
  'Date wise Payment logs.',
  'Date wise Collection logs.',
  'Date wise Bank Transcation logs.',
  'Date wise/User wise Journal Voucher Logs.'
];

// Exact 25 Export to Excel Reports
const EXPORT_EXCEL_LIST = [
  'Supplier wise Product Group Purchase',
  'Supplier wise Product Brand Purchase',
  'Supplier wise Product Group & Brand Purchase',
  'Product Group wise Purchase',
  'Product Brand wise Purchase',
  'Product Group & Brand wise Purchase',
  'Product Group wise Sales',
  'Product Brand wise Sales',
  'Product Group & Brand wise Sales',
  'Current Stock(All)',
  'Current Stock(All without Cost)',
  'Product Group Stock',
  'Product Brand Stock',
  'Product Group & Brand Stock',
  'Buyer Information',
  'Product Information',
  'CS Ledger',
  'Supplier & Customer Due List',
  'Accounts Receivable',
  'Accounts Payable',
  'Date wise Receivable',
  'Date wise Receivable (MPO)',
  'Date wise Payable',
  'Date wise Due All',
  'Product wise Purchase Details'
];

async function executeReport(category, reportName, filters, openPrint) {
  const res = await fetch('/api/reports/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, reportName, filters })
  });
  const data = await res.json();
  if (data.ok) {
    openPrint({
      ...data.report,
      subtitle: `Period: ${filters.date1 || 'All'} To ${filters.date2 || 'All'}`,
      excelParams: { category, reportName, filters }
    });
  }
}

function fmtDdMmYyyy(d) {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function QuickDatePills({ onSelect }) {
  const applyPreset = (preset) => {
    const now = new Date();
    const today = fmtDdMmYyyy(now);
    if (preset === 'today') return onSelect(today, today);
    if (preset === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const ys = fmtDdMmYyyy(y);
      return onSelect(ys, ys);
    }
    if (preset === 'week') {
      const w = new Date(now);
      w.setDate(w.getDate() - 6);
      return onSelect(fmtDdMmYyyy(w), today);
    }
    if (preset === 'month') {
      return onSelect(`01/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`, today);
    }
    if (preset === 'lastMonth') {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = new Date(now.getFullYear(), now.getMonth(), 0);
      return onSelect(fmtDdMmYyyy(first), fmtDdMmYyyy(last));
    }
    if (preset === 'year') {
      return onSelect(`01/01/${now.getFullYear()}`, today);
    }
  };

  return (
    <div className="erp-date-pills mt-1 mb-2">
      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, alignSelf: 'center', marginRight: '2px' }}>Quick Date:</span>
      <button type="button" className="erp-date-pill" onClick={() => applyPreset('today')}>Today</button>
      <button type="button" className="erp-date-pill" onClick={() => applyPreset('yesterday')}>Yesterday</button>
      <button type="button" className="erp-date-pill" onClick={() => applyPreset('week')}>Last 7 Days</button>
      <button type="button" className="erp-date-pill" onClick={() => applyPreset('month')}>This Month</button>
      <button type="button" className="erp-date-pill" onClick={() => applyPreset('lastMonth')}>Last Month</button>
      <button type="button" className="erp-date-pill" onClick={() => applyPreset('year')}>This Year</button>
    </div>
  );
}

function SearchableReportTable({ category, list, filters, openPrint, tableId = 'GridView1' }) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const filtered = q ? list.filter(r => r.toLowerCase().includes(q)) : list;

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
        <div style={{ flex: 1, maxWidth: '380px' }}>
          <input
            className="erp-input"
            placeholder={`⌕ Search ${list.length} reports by keyword (e.g. Profit, Due, Serial)...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
          Showing {filtered.length} of {list.length} reports
        </span>
      </div>
      <div className="erp-grid-box" style={{ maxHeight: '500px' }}>
        <table id={tableId} className="erp-table">
          <thead>
            <tr>
              <th style={{ width: '52px' }}>SL</th>
              <th>Report Name</th>
              <th style={{ width: '130px', textAlign: 'center' }}>Preview / Excel</th>
              <th style={{ width: '84px', textAlign: 'center' }}>Print</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={4} className="erp-empty-grid">No report matched "{query}".</td></tr>
            ) : (
              filtered.map((r, idx) => (
                <tr key={r}>
                  <td>{idx + 1}</td>
                  <td style={{ fontWeight: 600 }}>{r}</td>
                  <td><button className="erp-btn erp-btn-sm w-100" onClick={() => executeReport(category, r, filters, openPrint)}>Preview / Excel</button></td>
                  <td><button id="PRINT" className="erp-btn erp-btn-sm w-100" onClick={() => executeReport(category, r, filters, openPrint)}>Print</button></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SearchableRadioList({ list, selected, onSelect, name, idPrefix, cols = 'col-md-6' }) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const filtered = q ? list.filter(r => r.toLowerCase().includes(q)) : list;

  return (
    <div className="mb-2">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
        <div style={{ flex: 1, maxWidth: '360px' }}>
          <input
            className="erp-input"
            placeholder={`⌕ Filter ${list.length} reports...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
          Showing {filtered.length} of {list.length} reports
        </span>
      </div>
      <div className="row g-2 p-2 border rounded" style={{ backgroundColor: '#fafcff', maxHeight: '380px', overflowY: 'auto' }}>
        {filtered.map((r, idx) => (
          <div key={r} className={cols}>
            <label className="erp-label d-flex align-items-center gap-2" style={{ cursor: 'pointer', whiteSpace: 'normal' }}>
              <input
                id={`${idPrefix}_${idx}`}
                type="radio"
                name={name}
                checked={selected === r}
                onChange={() => onSelect(r)}
              />
              {r}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

// 49. PURCHASE_REPORTS.aspx — Purchase Register
export function PurchaseReportsPage() {
  const { master, openPrint } = useErp();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    date1: getMonthStartStr(), date2: getTodayStr(),
    csGroup: '', csName: '', productGroup: '', productName: '', brandName: ''
  });

  useEffect(() => { document.title = 'Purchase Report'; }, []);

  return (
    <div className="erp-container">
      <fieldset className="erp-fieldset">
        <legend className="erp-legend">Purchase Register</legend>
        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Input Date</label></div>
          <div className="col-md-3"><input id="MainContent_DATE1" className="erp-input text-center" value={filters.date1} onChange={(e) => setFilters({ ...filters, date1: e.target.value })} /></div>
          <div className="col-md-1 text-center"><label className="erp-label">To</label></div>
          <div className="col-md-3"><input id="MainContent_DATE2" className="erp-input text-center" value={filters.date2} onChange={(e) => setFilters({ ...filters, date2: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Supplier Group</label></div>
          <div className="col-md-3"><AutocompleteInput id="GROUP_NAME" value={filters.csGroup} onChange={(v) => setFilters({ ...filters, csGroup: v })} options={master.traderGroups} labelKey="group_name" /></div>
        </div>
        <div className="row g-1 align-items-center mb-2">
          <div className="col-md-1"><label className="erp-label">Supplier Name</label></div>
          <div className="col-md-3"><AutocompleteInput id="CS_NAME" value={filters.csName} onChange={(v) => setFilters({ ...filters, csName: v })} options={master.traders} labelKey="cs_name" /></div>
          <div className="col-md-1"><label className="erp-label">Product Group</label></div>
          <div className="col-md-2"><AutocompleteInput id="PRODUCT_GROUP" value={filters.productGroup} onChange={(v) => setFilters({ ...filters, productGroup: v })} options={master.productGroups} labelKey="group_name" /></div>
          <div className="col-md-1"><label className="erp-label">Item/Model No.</label></div>
          <div className="col-md-2"><AutocompleteInput id="PRODUCT_NAME" value={filters.productName} onChange={(v) => setFilters({ ...filters, productName: v })} options={master.products} labelKey="product_name" /></div>
          <div className="col-md-1"><label className="erp-label">Brand Name</label></div>
          <div className="col-md-1"><AutocompleteInput id="BRAND_NAME" value={filters.brandName} onChange={(v) => setFilters({ ...filters, brandName: v })} options={master.brands} labelKey="brand_name" /></div>
        </div>

        <QuickDatePills onSelect={(date1, date2) => setFilters(f => ({ ...f, date1, date2 }))} />

        <div className="d-flex justify-content-between align-items-center mb-1">
          <div className="erp-sublegend mb-0">Select &amp; Run Purchase Report</div>
          <button id="MainContent_EXIT" className="erp-btn" onClick={() => navigate('/GI/TREE.aspx')}>Exit</button>
        </div>

        <SearchableReportTable category="PURCHASE" list={PURCHASE_REPORT_LIST} filters={filters} openPrint={openPrint} tableId="GridView1" />
      </fieldset>
    </div>
  );
}

// 50. SALES_REPORTS.aspx — Sales Register (Exact match to final_step_117.png)
export function SalesReportsPage() {
  const { master, openPrint } = useErp();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    date1: getMonthStartStr(), date2: getTodayStr(),
    csGroup: '', csName: '', mpoName: '', productGroup: '', productName: '', categoryName: '', brandName: '', userName: ''
  });

  useEffect(() => { document.title = 'Sales Reports'; }, []);

  return (
    <div className="erp-container">
      <fieldset className="erp-fieldset">
        <legend className="erp-legend">Sales Register</legend>
        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Input Sales Date</label></div>
          <div className="col-md-5"><input id="MainContent_DATE1" className="erp-input text-center" value={filters.date1} onChange={(e) => setFilters({ ...filters, date1: e.target.value })} /></div>
          <div className="col-md-1 text-center"><label className="erp-label">To</label></div>
          <div className="col-md-5"><input id="DATE2" className="erp-input text-center" value={filters.date2} onChange={(e) => setFilters({ ...filters, date2: e.target.value })} /></div>
        </div>
        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Customer Group</label></div>
          <div className="col-md-3"><AutocompleteInput id="CS_GROUP" value={filters.csGroup} onChange={(v) => setFilters({ ...filters, csGroup: v })} options={master.traderGroups} labelKey="group_name" /></div>
          <div className="col-md-1"><label className="erp-label">Customer Name</label></div>
          <div className="col-md-3"><AutocompleteInput id="CUSTOMER_NAME" value={filters.csName} onChange={(v) => setFilters({ ...filters, csName: v })} options={master.traders} labelKey="cs_name" /></div>
          <div className="col-md-1"><label className="erp-label">MPO Name</label></div>
          <div className="col-md-3"><AutocompleteInput id="MainContent_MPO_NAME" value={filters.mpoName} onChange={(v) => setFilters({ ...filters, mpoName: v })} options={master.employees} labelKey="employee_name" /></div>
        </div>
        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Product Group</label></div>
          <div className="col-md-3"><AutocompleteInput id="PRODUCT_GROUP" value={filters.productGroup} onChange={(v) => setFilters({ ...filters, productGroup: v })} options={master.productGroups} labelKey="group_name" /></div>
          <div className="col-md-1"><label className="erp-label">Item/Model No.</label></div>
          <div className="col-md-3"><AutocompleteInput id="PRODUCT_NAME" value={filters.productName} onChange={(v) => setFilters({ ...filters, productName: v })} options={master.products} labelKey="product_name" /></div>
          <div className="col-md-1"><label className="erp-label">Category Name</label></div>
          <div className="col-md-3"><AutocompleteInput id="MainContent_CATEGORY" value={filters.categoryName} onChange={(v) => setFilters({ ...filters, categoryName: v })} options={master.categories} labelKey="category_name" /></div>
        </div>
        <div className="row g-1 align-items-center mb-2">
          <div className="col-md-1"><label className="erp-label">Brand Name</label></div>
          <div className="col-md-3"><AutocompleteInput id="MainContent_BRAND_NAME" value={filters.brandName} onChange={(v) => setFilters({ ...filters, brandName: v })} options={master.brands} labelKey="brand_name" /></div>
          <div className="col-md-1"><label className="erp-label">User Name</label></div>
          <div className="col-md-3"><AutocompleteInput id="MainContent_USER_NAME" value={filters.userName} onChange={(v) => setFilters({ ...filters, userName: v })} options={master.users} labelKey="user_name" /></div>
          <div className="col-md-4 text-end"><button id="MainContent_EXIT" className="erp-btn" onClick={() => navigate('/GI/TREE.aspx')}>Exit</button></div>
        </div>

        <QuickDatePills onSelect={(date1, date2) => setFilters(f => ({ ...f, date1, date2 }))} />

        <div className="erp-sublegend">Select &amp; Run Sales Report</div>

        <SearchableReportTable category="SALES" list={SALES_REPORT_LIST} filters={filters} openPrint={openPrint} tableId="GridView1" />
      </fieldset>
    </div>
  );
}

// 51. CS_REPORTS.aspx — Traders Reports
export function TradersReportsPage() {
  const { master, openPrint } = useErp();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    date1: getMonthStartStr(), date2: getTodayStr(),
    allBr: false, csGroup: '', csName: '', areaManager: '', mpoName: ''
  });

  useEffect(() => { document.title = 'Trader Reports'; }, []);

  return (
    <div className="erp-container">
      <fieldset className="erp-fieldset">
        <legend className="erp-legend">Trader Register</legend>
        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Input Date</label></div>
          <div className="col-md-3"><input id="MainContent_DATE1" className="erp-input text-center" value={filters.date1} onChange={(e) => setFilters({ ...filters, date1: e.target.value })} /></div>
          <div className="col-md-1 text-center"><label className="erp-label">To</label></div>
          <div className="col-md-3"><input id="MainContent_DATE2" className="erp-input text-center" value={filters.date2} onChange={(e) => setFilters({ ...filters, date2: e.target.value })} /></div>
          <div className="col-md-2">
            <label className="erp-label d-flex align-items-center gap-1">
              <input id="ALLCS" type="checkbox" checked={filters.allBr} onChange={(e) => setFilters({ ...filters, allBr: e.target.checked })} />
              All Br.Traders
            </label>
          </div>
        </div>
        <div className="row g-1 align-items-center mb-2">
          <div className="col-md-1"><label className="erp-label">Trader Group</label></div>
          <div className="col-md-2"><AutocompleteInput id="CS_GROUP_NAME" value={filters.csGroup} onChange={(v) => setFilters({ ...filters, csGroup: v })} options={master.traderGroups} labelKey="group_name" /></div>
          <div className="col-md-1"><label className="erp-label">Trader Name</label></div>
          <div className="col-md-3"><AutocompleteInput id="CS_NAME" placeholder="Search by Name or Mobile No." value={filters.csName} onChange={(v) => setFilters({ ...filters, csName: v })} options={master.traders} labelKey="cs_name" /></div>
          <div className="col-md-1"><label className="erp-label">Area Manag Name</label></div>
          <div className="col-md-1"><input id="AREA_MANAGER_NAME" className="erp-input" value={filters.areaManager} onChange={(e) => setFilters({ ...filters, areaManager: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">MPO/SR Name</label></div>
          <div className="col-md-2"><AutocompleteInput id="MPO_NAME" value={filters.mpoName} onChange={(v) => setFilters({ ...filters, mpoName: v })} options={master.employees} labelKey="employee_name" /></div>
        </div>

        <QuickDatePills onSelect={(date1, date2) => setFilters(f => ({ ...f, date1, date2 }))} />

        <div className="d-flex justify-content-between align-items-center mb-1">
          <div className="erp-sublegend mb-0">Select &amp; Run Trader Report</div>
          <button id="MainContent_EXIT" className="erp-btn" onClick={() => navigate('/GI/TREE.aspx')}>Exit</button>
        </div>

        <SearchableReportTable category="CS" list={CS_REPORT_LIST} filters={filters} openPrint={openPrint} tableId="GridView2" />
      </fieldset>
    </div>
  );
}

// 52. ACCOUNTS_REPORTS.aspx — Accounts Register
export function AccountsReportsPage() {
  const { master, openPrint } = useErp();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    date1: getMonthStartStr(), date2: getTodayStr(),
    csGroup: '', csName: '', accountGroup: '', accountName: '', collType: 'CASH'
  });

  useEffect(() => { document.title = 'Accounts Reports'; }, []);

  return (
    <div className="erp-container">
      <fieldset className="erp-fieldset">
        <legend className="erp-legend">Accounts Register</legend>
        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Date From</label></div>
          <div className="col-md-3"><input id="MainContent_DATE1" className="erp-input text-center" value={filters.date1} onChange={(e) => setFilters({ ...filters, date1: e.target.value })} /></div>
          <div className="col-md-1 text-center"><label className="erp-label">To</label></div>
          <div className="col-md-3"><input id="MainContent_DATE2" className="erp-input text-center" value={filters.date2} onChange={(e) => setFilters({ ...filters, date2: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Coll./Pay.Type</label></div>
          <div className="col-md-3">
            <select id="DropDownListCollType" className="erp-select" value={filters.collType} onChange={(e) => setFilters({ ...filters, collType: e.target.value })}>
              {['CASH', 'CHEQUE', 'CASH CHEQUE', 'BEFTN', 'EFT', 'NPSB', 'MOBILE BANKING', 'CREDIT CARD', 'DEBIT CARD', 'P.O'].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <div className="row g-1 align-items-center mb-2">
          <div className="col-md-1"><label className="erp-label">Group Name</label></div>
          <div className="col-md-2"><AutocompleteInput id="GROUP_NAME" value={filters.csGroup} onChange={(v) => setFilters({ ...filters, csGroup: v })} options={master.traderGroups} labelKey="group_name" /></div>
          <div className="col-md-1"><label className="erp-label">Trader Name</label></div>
          <div className="col-md-2"><AutocompleteInput id="CS_NAME" value={filters.csName} onChange={(v) => setFilters({ ...filters, csName: v })} options={master.traders} labelKey="cs_name" /></div>
          <div className="col-md-1"><label className="erp-label">Account Group</label></div>
          <div className="col-md-2">
            <select id="MainContent_DropDownListAccGroupName" className="erp-select" value={filters.accountGroup} onChange={(e) => setFilters({ ...filters, accountGroup: e.target.value })}>
              <option value=""></option>
              <option value="OFFICE EXPENSES">OFFICE EXPENSES</option>
              {master.accountSubGroups.map(sg => <option key={sg.sub_group_id} value={sg.sub_group_name}>{sg.sub_group_name}</option>)}
            </select>
          </div>
          <div className="col-md-1"><label className="erp-label">Account Name</label></div>
          <div className="col-md-2">
            <select id="MainContent_DropDownListAccLedgerName" className="erp-select" value={filters.accountName} onChange={(e) => setFilters({ ...filters, accountName: e.target.value })}>
              <option value=""></option>
              {master.accountLedgers.map(l => <option key={l.accounts_id} value={l.accounts_name}>{l.accounts_name}</option>)}
            </select>
          </div>
        </div>

        <QuickDatePills onSelect={(date1, date2) => setFilters(f => ({ ...f, date1, date2 }))} />

        <div className="d-flex justify-content-between align-items-center mb-1">
          <div className="erp-sublegend mb-0">Select &amp; Run Accounts Report</div>
          <button id="MainContent_EXIT" className="erp-btn" onClick={() => navigate('/GI/TREE.aspx')}>Exit</button>
        </div>

        <SearchableReportTable category="ACCOUNTS" list={ACCOUNTS_REPORT_LIST} filters={filters} openPrint={openPrint} tableId="GridView1" />
      </fieldset>
    </div>
  );
}

// 53. STOCK_REPORTS.aspx — Stock Register
export function StockReportsPage() {
  const { master, openPrint } = useErp();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    date1: getMonthStartStr(), date2: getTodayStr(),
    branchName: 'HAZI TRADERS', storeName: 'SHOW ROOM',
    csGroup: '', csName: '', productGroup: '', productName: '', brandName: '', categoryName: ''
  });

  useEffect(() => { document.title = 'Stock Reports'; }, []);

  return (
    <div className="erp-container">
      <fieldset className="erp-fieldset">
        <legend className="erp-legend">Stock Register</legend>
        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Input Date</label></div>
          <div className="col-md-2"><input id="MainContent_DATE1" className="erp-input text-center" value={filters.date1} onChange={(e) => setFilters({ ...filters, date1: e.target.value })} /></div>
          <div className="col-md-1 text-center"><label className="erp-label">To</label></div>
          <div className="col-md-2"><input id="MainContent_DATE2" className="erp-input text-center" value={filters.date2} onChange={(e) => setFilters({ ...filters, date2: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Branch Name:</label></div>
          <div className="col-md-2">
            <select id="MainContent_COMPANY_NAME" className="erp-select" value={filters.branchName} onChange={(e) => setFilters({ ...filters, branchName: e.target.value })}>
              <option value=""></option>
              <option value="HAZI TRADERS">HAZI TRADERS</option>
              <option value="HAZI TRADERS-2">HAZI TRADERS-2</option>
            </select>
          </div>
          <div className="col-md-1"><label className="erp-label">Store</label></div>
          <div className="col-md-2">
            <select id="MainContent_DropDownListStore" className="erp-select" value={filters.storeName} onChange={(e) => setFilters({ ...filters, storeName: e.target.value })}>
              <option value=""></option>
              <option value="SHOW ROOM">SHOW ROOM</option>
            </select>
          </div>
        </div>
        <div className="row g-1 align-items-center mb-2">
          <div className="col-md-1"><label className="erp-label">Supplier Group</label></div>
          <div className="col-md-1"><AutocompleteInput id="CS_GROUP_NAME" value={filters.csGroup} onChange={(v) => setFilters({ ...filters, csGroup: v })} options={master.traderGroups} labelKey="group_name" /></div>
          <div className="col-md-1"><label className="erp-label">Supplier Name</label></div>
          <div className="col-md-2"><AutocompleteInput id="CS_NAME" value={filters.csName} onChange={(v) => setFilters({ ...filters, csName: v })} options={master.traders} labelKey="cs_name" /></div>
          <div className="col-md-1"><label className="erp-label">Product Group</label></div>
          <div className="col-md-1"><AutocompleteInput id="PRODUCT_GROUP" value={filters.productGroup} onChange={(v) => setFilters({ ...filters, productGroup: v })} options={master.productGroups} labelKey="group_name" /></div>
          <div className="col-md-1"><label className="erp-label">Item/Model No.</label></div>
          <div className="col-md-2"><AutocompleteInput id="PRODUCT" value={filters.productName} onChange={(v) => setFilters({ ...filters, productName: v })} options={master.products} labelKey="product_name" /></div>
          <div className="col-md-1"><label className="erp-label">Brand Name</label></div>
          <div className="col-md-1"><AutocompleteInput id="MainContent_BRAND_NAME" value={filters.brandName} onChange={(v) => setFilters({ ...filters, brandName: v })} options={master.brands} labelKey="brand_name" /></div>
        </div>

        <QuickDatePills onSelect={(date1, date2) => setFilters(f => ({ ...f, date1, date2 }))} />

        <div className="d-flex justify-content-between align-items-center mb-1">
          <div className="erp-sublegend mb-0">Select &amp; Run Stock Report</div>
          <button id="MainContent_EXIT" className="erp-btn" onClick={() => navigate('/GI/TREE.aspx')}>Exit</button>
        </div>

        <SearchableReportTable category="STOCK" list={STOCK_REPORT_LIST} filters={filters} openPrint={openPrint} tableId="GridView2" />
      </fieldset>
    </div>
  );
}

// 54. BANK_REPORTS.aspx — Bank Register
export function BankReportsPage() {
  const { master, openPrint, notify } = useErp();
  const navigate = useNavigate();
  const [selectedReport, setSelectedReport] = useState(BANK_REPORT_LIST[0]);
  const [filters, setFilters] = useState({
    date1: getMonthStartStr(), date2: getTodayStr(),
    accountNo: '', bankName: '', csGroup: '', csName: ''
  });

  useEffect(() => { document.title = 'Bank Repots'; }, []);

  return (
    <div className="erp-container">
      <fieldset className="erp-fieldset">
        <legend className="erp-legend">Bank Register</legend>
        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Input Date</label></div>
          <div className="col-md-3"><input id="MainContent_DATE1" className="erp-input text-center" value={filters.date1} onChange={(e) => setFilters({ ...filters, date1: e.target.value })} /></div>
          <div className="col-md-1 text-center"><label className="erp-label">To</label></div>
          <div className="col-md-3"><input id="MainContent_DATE2" className="erp-input text-center" value={filters.date2} onChange={(e) => setFilters({ ...filters, date2: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Account No.</label></div>
          <div className="col-md-3"><AutocompleteInput id="ACC_NO" value={filters.accountNo} onChange={(v) => setFilters({ ...filters, accountNo: v })} options={master.bankAccounts} labelKey="account_no" subKey="bank_name" onSelect={(ba) => setFilters({ ...filters, accountNo: ba.account_no, bankName: ba.bank_name })} /></div>
        </div>
        <div className="row g-1 align-items-center mb-2">
          <div className="col-md-1"><label className="erp-label">Bank Name</label></div>
          <div className="col-md-3"><input id="BANK_NAME" className="erp-input" value={filters.bankName} readOnly disabled /></div>
          <div className="col-md-1"><label className="erp-label">Trader Group</label></div>
          <div className="col-md-3"><AutocompleteInput id="MainContent_CS_GROUP_NAME" value={filters.csGroup} onChange={(v) => setFilters({ ...filters, csGroup: v })} options={master.traderGroups} labelKey="group_name" /></div>
          <div className="col-md-1"><label className="erp-label">Trader Name</label></div>
          <div className="col-md-3"><AutocompleteInput id="MainContent_CS_NAME" value={filters.csName} onChange={(v) => setFilters({ ...filters, csName: v })} options={master.traders} labelKey="cs_name" /></div>
        </div>

        <QuickDatePills onSelect={(date1, date2) => setFilters(f => ({ ...f, date1, date2 }))} />

        <div className="erp-sublegend">Select Bank Report</div>
        <SearchableRadioList
          list={BANK_REPORT_LIST}
          selected={selectedReport}
          onSelect={setSelectedReport}
          name="bankReport"
          idPrefix="MainContent_RadioButtonpurchas"
        />

        <div className="d-flex gap-2">
          <button id="PRINT" className="erp-btn erp-btn-primary" onClick={() => {
            if (!selectedReport) return notify('Please select a report', 'error');
            executeReport('BANK', selectedReport, filters, openPrint);
          }}>Print / Preview</button>
          <button id="MainContent_EXIT" className="erp-btn" onClick={() => navigate('/GI/TREE.aspx')}>Exit</button>
        </div>
      </fieldset>
    </div>
  );
}

// 55. RMA_REPORTS.aspx — Rma Register
export function RmaReportsPage() {
  const { master, openPrint } = useErp();
  const navigate = useNavigate();
  const [selectedReport, setSelectedReport] = useState(RMA_REPORT_LIST[0]);
  const [filters, setFilters] = useState({
    date1: getMonthStartStr(), date2: getTodayStr(),
    csGroup: '', csName: '', mpoName: '', productGroup: '', productName: ''
  });

  useEffect(() => { document.title = 'RMA Reports'; }, []);

  return (
    <div className="erp-container">
      <fieldset className="erp-fieldset">
        <legend className="erp-legend">RMA Register</legend>
        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Input Date</label></div>
          <div className="col-md-3"><input id="MainContent_DATE1" className="erp-input text-center" value={filters.date1} onChange={(e) => setFilters({ ...filters, date1: e.target.value })} /></div>
          <div className="col-md-1 text-center"><label className="erp-label">To</label></div>
          <div className="col-md-3"><input id="DATE2" className="erp-input text-center" value={filters.date2} onChange={(e) => setFilters({ ...filters, date2: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Trader Group</label></div>
          <div className="col-md-3"><AutocompleteInput id="CS_GROUP" value={filters.csGroup} onChange={(v) => setFilters({ ...filters, csGroup: v })} options={master.traderGroups} labelKey="group_name" /></div>
        </div>
        <div className="row g-1 align-items-center mb-2">
          <div className="col-md-1"><label className="erp-label">Trader Name</label></div>
          <div className="col-md-2"><AutocompleteInput id="CUSTOMER_NAME" value={filters.csName} onChange={(v) => setFilters({ ...filters, csName: v })} options={master.traders} labelKey="cs_name" /></div>
          <div className="col-md-1"><label className="erp-label">MPO Name</label></div>
          <div className="col-md-2"><AutocompleteInput id="MainContent_MPO_NAME" value={filters.mpoName} onChange={(v) => setFilters({ ...filters, mpoName: v })} options={master.employees} labelKey="employee_name" /></div>
          <div className="col-md-1"><label className="erp-label">Product Group</label></div>
          <div className="col-md-2"><AutocompleteInput id="PRODUCT_GROUP" value={filters.productGroup} onChange={(v) => setFilters({ ...filters, productGroup: v })} options={master.productGroups} labelKey="group_name" /></div>
          <div className="col-md-1"><label className="erp-label">Caption/Model No.</label></div>
          <div className="col-md-2"><AutocompleteInput id="PRODUCT_NAME" value={filters.productName} onChange={(v) => setFilters({ ...filters, productName: v })} options={master.products} labelKey="product_name" /></div>
        </div>

        <QuickDatePills onSelect={(date1, date2) => setFilters(f => ({ ...f, date1, date2 }))} />

        <div className="erp-sublegend">Select RMA Report</div>
        <SearchableRadioList
          list={RMA_REPORT_LIST}
          selected={selectedReport}
          onSelect={setSelectedReport}
          name="rmaReport"
          idPrefix="RadioButtonsales"
          cols="col-md-4"
        />

        <div className="d-flex gap-2">
          <button id="PRINT" className="erp-btn erp-btn-primary" onClick={() => executeReport('RMA', selectedReport, filters, openPrint)}>Print / Preview</button>
          <button id="MainContent_EXIT" className="erp-btn" onClick={() => navigate('/GI/TREE.aspx')}>Exit</button>
        </div>
      </fieldset>
    </div>
  );
}

// 56. MODIFICATION_REPORTS.aspx — Modification Register
export function ModificationReportsPage() {
  const { openPrint } = useErp();
  const navigate = useNavigate();
  const [selectedReport, setSelectedReport] = useState(MODIFICATION_REPORT_LIST[0]);
  const [filters, setFilters] = useState({
    date1: getMonthStartStr(), date2: getTodayStr(),
    transactionId: '', userName: ''
  });

  useEffect(() => { document.title = 'Modification/Delete Reports'; }, []);

  const USERS_LIST = ['', 'ADMINISTRATOR', 'BABU', 'BASHIR UDDIN', 'JABER', 'JAHANGIR', 'JAHID', 'JUBAYER', 'RASHED', 'ROBIN', 'SHAWON', 'SHEHAB'];

  return (
    <div className="erp-container">
      <fieldset className="erp-fieldset">
        <legend className="erp-legend">Modification Register</legend>
        <div className="row g-1 align-items-center mb-2">
          <div className="col-md-1"><label className="erp-label">Input Date</label></div>
          <div className="col-md-2"><input id="MainContent_DATE1" className="erp-input text-center" value={filters.date1} onChange={(e) => setFilters({ ...filters, date1: e.target.value })} /></div>
          <div className="col-md-1 text-center"><label className="erp-label">To</label></div>
          <div className="col-md-2"><input id="MainContent_DATE2" className="erp-input text-center" value={filters.date2} onChange={(e) => setFilters({ ...filters, date2: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Transcation ID</label></div>
          <div className="col-md-2"><input id="TRANSCATION_ID" className="erp-input" value={filters.transactionId} onChange={(e) => setFilters({ ...filters, transactionId: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">User Name</label></div>
          <div className="col-md-2">
            <select id="MainContent_DropDownListUser" className="erp-select" value={filters.userName} onChange={(e) => setFilters({ ...filters, userName: e.target.value })}>
              {USERS_LIST.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        <QuickDatePills onSelect={(date1, date2) => setFilters(f => ({ ...f, date1, date2 }))} />

        <div className="erp-sublegend">Select Modification Log Report</div>
        <SearchableRadioList
          list={MODIFICATION_REPORT_LIST}
          selected={selectedReport}
          onSelect={setSelectedReport}
          name="modReport"
          idPrefix="MainContent_RadioButtonsales"
        />

        <div className="d-flex gap-2">
          <button id="MainContent_PRINT1" className="erp-btn erp-btn-primary" onClick={() => executeReport('MODIFICATION', selectedReport, filters, openPrint)}>Print / Preview</button>
          <button id="MainContent_EXIT" className="erp-btn" onClick={() => navigate('/GI/TREE.aspx')}>Exit</button>
        </div>
      </fieldset>
    </div>
  );
}

// 57. EXPORT_EXCEL.aspx — Export To Excel
export function ExportExcelPage() {
  const { master, notify } = useErp();
  const navigate = useNavigate();
  const [selectedReport, setSelectedReport] = useState(EXPORT_EXCEL_LIST[9]);
  const [filters, setFilters] = useState({
    date1: getMonthStartStr(), date2: getTodayStr(),
    csGroup: '', csName: '', mpoName: '', productGroup: '', brandName: '', productName: ''
  });
  const [preview, setPreview] = useState(null);

  useEffect(() => { document.title = 'DATE WISE COLLECTION'; }, []);

  const handleSearch = async () => {
    const res = await fetch('/api/reports/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: 'EXPORT_EXCEL', reportName: selectedReport, filters })
    });
    const data = await res.json();
    if (data.ok) setPreview(data.report);
  };

  const handleExportExcel = async () => {
    const res = await fetch('/api/reports/excel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: 'EXPORT_EXCEL', reportName: selectedReport, filters })
    });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${String(selectedReport).replace(/[^a-zA-Z0-9_-]/g, '_')}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      notify(`Exported ${selectedReport} to Excel (.xlsx)`);
    }
  };

  return (
    <div className="erp-container">
      <fieldset className="erp-fieldset mb-2">
        <legend className="erp-legend">Accounts Register — Export to Excel</legend>
        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Date.</label></div>
          <div className="col-md-2"><input id="DATE1" className="erp-input text-center" value={filters.date1} onChange={(e) => setFilters({ ...filters, date1: e.target.value })} /></div>
          <div className="col-md-1 text-center"><label className="erp-label">to</label></div>
          <div className="col-md-2"><input id="DATE2" className="erp-input text-center" value={filters.date2} onChange={(e) => setFilters({ ...filters, date2: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Buyer Group</label></div>
          <div className="col-md-2"><AutocompleteInput id="CS_GROUP_NAME" value={filters.csGroup} onChange={(v) => setFilters({ ...filters, csGroup: v })} options={master.traderGroups} labelKey="group_name" /></div>
          <div className="col-md-1"><label className="erp-label">Buyer Name</label></div>
          <div className="col-md-2"><AutocompleteInput id="CS_NAME" value={filters.csName} onChange={(v) => setFilters({ ...filters, csName: v })} options={master.traders} labelKey="cs_name" /></div>
        </div>
        <div className="row g-1 align-items-center mb-2">
          <div className="col-md-1"><label className="erp-label">MPO/SR Name</label></div>
          <div className="col-md-2"><AutocompleteInput id="MPO" value={filters.mpoName} onChange={(v) => setFilters({ ...filters, mpoName: v })} options={master.employees} labelKey="employee_name" /></div>
          <div className="col-md-1"><label className="erp-label">Product Group</label></div>
          <div className="col-md-2"><AutocompleteInput id="PRODUCT_GROUP_NAME" value={filters.productGroup} onChange={(v) => setFilters({ ...filters, productGroup: v })} options={master.productGroups} labelKey="group_name" /></div>
          <div className="col-md-1"><label className="erp-label">Brand Name</label></div>
          <div className="col-md-2"><AutocompleteInput id="BRAND_NAME" value={filters.brandName} onChange={(v) => setFilters({ ...filters, brandName: v })} options={master.brands} labelKey="brand_name" /></div>
          <div className="col-md-1"><label className="erp-label">Product Name</label></div>
          <div className="col-md-2"><AutocompleteInput id="PRODUCT_NAME" value={filters.productName} onChange={(v) => setFilters({ ...filters, productName: v })} options={master.products} labelKey="product_name" /></div>
        </div>

        <QuickDatePills onSelect={(date1, date2) => setFilters(f => ({ ...f, date1, date2 }))} />

        <div className="erp-sublegend">Select Export Report</div>
        <SearchableRadioList
          list={EXPORT_EXCEL_LIST}
          selected={selectedReport}
          onSelect={setSelectedReport}
          name="excelReport"
          idPrefix="RadioButtonList1"
        />

        <div className="d-flex flex-wrap gap-2">
          <button id="SEARCH" className="erp-btn" onClick={handleSearch}>Preview Data</button>
          <button id="EXPORT" className="erp-btn erp-btn-primary" onClick={handleExportExcel}>⬇ Export to Excel (.xlsx)</button>
          <button id="MainContent_Button1" className="erp-btn" onClick={() => setPreview(null)}>Clear</button>
          <button id="MainContent_EXIT" className="erp-btn" onClick={() => navigate('/GI/TREE.aspx')}>Exit</button>
        </div>
      </fieldset>

      <fieldset className="erp-fieldset">
        <legend className="erp-legend">Your Searching Information.</legend>
        {preview ? (
          <div className="erp-grid-box">
            <table className="erp-table">
              <thead><tr>{preview.columns.map((c, i) => <th key={i}>{c}</th>)}</tr></thead>
              <tbody>
                {preview.rows.map((r, rIdx) => (
                  <tr key={rIdx}>{r.map((cell, cIdx) => <td key={cIdx}>{cell}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-muted py-2">Select a report and click Search or Export to Excel.</div>
        )}
      </fieldset>
    </div>
  );
}
