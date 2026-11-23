import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useErp, getTodayStr } from '../context/ErpContext.jsx';
import AutocompleteInput from '../components/AutocompleteInput.jsx';

// Shared Stock Transfer Screen Builder for 26-29
function StockTransferTemplate({ mode, title, legend }) {
  const { master, refreshMaster, notify, openPrint } = useErp();
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [header, setHeader] = useState({
    ref_no: '',
    transfer_date: getTodayStr(),
    search_id: '',
    transfer_id: '',
    from_branch: 'HAZI TRADERS',
    to_branch: 'HAZI TRADERS-2',
    from_store: 'SHOW ROOM',
    to_store: 'SHOW ROOM',
    narration: ''
  });
  const [line, setLine] = useState({
    product_id: '',
    product_group: '',
    product_name: '',
    product_description: '',
    serial_common: '',
    serial_from: '',
    serial_to: '',
    qty: mode.includes('RMA') ? '1' : '1',
    com_stock: 0,
    rma_stock: 0
  });
  const [items, setItems] = useState([]);

  const loadList = useCallback(async () => {
    const res = await fetch(`/api/transfer/list?mode=${mode}`);
    if (res.ok) {
      const data = await res.json();
      setList(data.list || []);
    }
  }, [mode]);

  useEffect(() => {
    document.title = title;
    loadList();
  }, [title, loadList]);

  const handleSave = async () => {
    let nextItems = [...items];
    if (line.product_name.trim()) {
      nextItems.push({
        product_id: line.product_id || 'PRD00001',
        product_group: line.product_group,
        product_name: line.product_name,
        product_description: line.product_description || line.product_name,
        serial_no: line.serial_from || line.serial_common,
        qty: Number(line.qty || 1)
      });
      setItems(nextItems);
      setLine({ ...line, product_name: '', product_description: '', serial_from: '', qty: '1' });
    }
    if (nextItems.length === 0) return notify('Please select product item to transfer', 'error');

    const res = await fetch('/api/transfer/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...header, transfer_mode: mode, items: nextItems })
    });
    const data = await res.json();
    if (data.ok) {
      setHeader(h => ({ ...h, transfer_id: data.id }));
      notify(data.message);
      await refreshMaster();
      await loadList();
    }
  };

  return (
    <div className="erp-container">
      <fieldset className="erp-fieldset">
        <legend className="erp-legend">{legend}</legend>
        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">{mode === 'BR_TO_BR' ? 'Ref. No.' : 'Ref No./Memo No.'}</label></div>
          <div className="col-md-2"><input id="REF_NO" className="erp-input" value={header.ref_no} onChange={(e) => setHeader({ ...header, ref_no: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Transfer Date</label></div>
          <div className="col-md-2"><input id="TRANSFER_DATE" className="erp-input" value={header.transfer_date} onChange={(e) => setHeader({ ...header, transfer_date: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Transfer ID</label></div>
          <div className="col-md-3">
            <AutocompleteInput
              id="SEARCH_PURCHASE_ID"
              value={header.search_id}
              onChange={(v) => setHeader({ ...header, search_id: v })}
              options={list}
              labelKey="transfer_id"
              onSelect={(r) => { setHeader({ ...header, ...r, search_id: r.transfer_id }); setItems(r.items || []); }}
            />
          </div>
          <div className="col-md-2"><button id="PU_ID_SEARCH" className="erp-btn w-100" onClick={() => { if (list[0]) { setHeader({ ...header, ...list[0] }); setItems(list[0].items || []); } }}>Search</button></div>
        </div>

        {mode === 'BR_TO_BR' && (
          <div className="row g-1 align-items-center mb-1">
            <div className="col-md-1"><label className="erp-label">Branch Name</label></div>
            <div className="col-md-3">
              <AutocompleteInput
                id="COMPANY_NAME"
                value={header.to_branch}
                onChange={(v) => setHeader({ ...header, to_branch: v })}
                options={master.branches}
                labelKey="branch_name"
              />
            </div>
            <div className="col-md-1"><label className="erp-label">Transfer To</label></div>
            <div className="col-md-3">
              <select id="DropDownList_TransferTo" className="erp-select" value={header.to_store} onChange={(e) => setHeader({ ...header, to_store: e.target.value })}>
                <option value="SHOW ROOM">SHOW ROOM</option>
                <option value="MAIN GODOWN">MAIN GODOWN</option>
              </select>
            </div>
          </div>
        )}

        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Product Group</label></div>
          <div className="col-md-3"><AutocompleteInput id="PRODUCT_GROUP" value={line.product_group} onChange={(v) => setLine({ ...line, product_group: v })} options={master.productGroups} labelKey="group_name" /></div>
          <div className="col-md-1"><label className="erp-label">Item/Model No.</label></div>
          <div className="col-md-4">
            <AutocompleteInput
              id="PRODUCT_NAME"
              value={line.product_name}
              onChange={(v) => setLine({ ...line, product_name: v })}
              options={master.products}
              labelKey="product_name"
              onSelect={(p) => setLine({ ...line, product_id: p.product_id, product_group: p.group_name, product_name: p.product_name, product_description: p.description, com_stock: p.stock_qty, rma_stock: p.rma_stock_qty })}
            />
          </div>
          <div className="col-md-1"><label className="erp-label">Description</label></div>
          <div className="col-md-2"><input id="Product_Description" className="erp-input" value={line.product_description} readOnly /></div>
        </div>

        <div className="row g-1 align-items-center mb-2">
          <div className="col-md-1"><label className="erp-label">{mode === 'RMA_TO_COMM' ? 'Transfer To' : 'Transfer From'}</label></div>
          <div className="col-md-2">
            <select id="DropDownStore" className="erp-select" value={header.from_store} onChange={(e) => setHeader({ ...header, from_store: e.target.value })}>
              <option value=""></option>
              <option value="SHOW ROOM">SHOW ROOM</option>
              <option value="MAIN GODOWN">MAIN GODOWN</option>
            </select>
          </div>
          {mode === 'COMM_TO_COMM' && (
            <>
              <div className="col-md-1"><label className="erp-label">Transfer To</label></div>
              <div className="col-md-2">
                <select id="DropDownList_TransferTo" className="erp-select" value={header.to_store} onChange={(e) => setHeader({ ...header, to_store: e.target.value })}>
                  <option value=""></option>
                  <option value="SHOW ROOM">SHOW ROOM</option>
                  <option value="MAIN GODOWN">MAIN GODOWN</option>
                </select>
              </div>
            </>
          )}
          <div className="col-md-1"><label className="erp-label">Serial No/From</label></div>
          <div className="col-md-2"><input id="SERIAL_FROM" className="erp-input" value={line.serial_from} onChange={(e) => setLine({ ...line, serial_from: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Product Qty</label></div>
          <div className="col-md-1"><input id="PRODUCT_QTY" className="erp-input" value={line.qty} readOnly={mode.includes('RMA')} onChange={(e) => setLine({ ...line, qty: e.target.value })} /></div>
          <div className="col-md-1"><input id="TRANSFER_ID" className="erp-input" value={header.transfer_id} readOnly placeholder="Transfer ID" /></div>
        </div>

        <div className="d-flex flex-wrap gap-1 mb-2">
          <button id="SAVE_BUTTON" className="erp-btn" onClick={handleSave}>Save</button>
          <button id="EDIT" className="erp-btn" onClick={handleSave}>Edit</button>
          {mode === 'BR_TO_BR' && <button id="APPROVED" className="erp-btn" onClick={() => notify('Branch Transfer Approved')}>Approval</button>}
          {mode === 'COMM_TO_COMM' && <button id="DELETE" className="erp-btn" onClick={() => setLine({ ...line, serial_from: '' })}>Delete Serial</button>}
          {mode.includes('RMA') && (
            <>
              <button id="PURCHASE_ID_SELECT" className="erp-btn" onClick={() => notify('Transfer ID Selected')}>ID SELECT</button>
              <button id="DEELETE_SERIAL" className="erp-btn" onClick={() => setLine({ ...line, serial_from: '' })}>SERIAL DELETE</button>
            </>
          )}
          <button id="PRINT" className="erp-btn" onClick={() => openPrint({
            title: `${legend} Challan — ${header.transfer_id || 'NEW'}`,
            columns: ['Transfer ID', 'Transfer Date', 'Product ID', 'Product Description', 'Serial', 'Qty'],
            rows: items.map(it => [header.transfer_id || 'NEW', header.transfer_date, it.product_id, it.product_description || it.product_name, it.serial_no || '', it.qty])
          })}>Print</button>
          <button id="CLEAR" className="erp-btn" onClick={() => setItems([])}>Clear/New</button>
          <button id="EXIT" className="erp-btn" onClick={() => navigate('/GI/TREE.aspx')}>Exit</button>
        </div>

        <div className="erp-grid-box mb-2">
          <table id="GridView1" className="erp-table">
            <thead>
              <tr>
                {mode === 'BR_TO_BR' && <><th>SL</th><th>Company ID TO</th></>}
                <th>Transfer ID</th><th>Transfer Date</th><th>Product ID</th><th>Product Description</th><th>Qty</th><th>Selsect</th><th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i}>
                  {mode === 'BR_TO_BR' && <><td>{i + 1}</td><td>{header.to_branch}</td></>}
                  <td>{header.transfer_id || 'NEW'}</td><td>{header.transfer_date}</td><td>{it.product_id}</td><td>{it.product_description || it.product_name}</td><td>{it.qty}</td>
                  <td><button className="erp-btn" onClick={() => setLine({ ...line, ...it })}>Selsect</button></td>
                  <td><button className="erp-btn" onClick={() => setItems(items.filter((_, idx) => idx !== i))}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="erp-footer-panel" style={{ minHeight: '55px' }}>
          {mode === 'COMM_TO_COMM' && <div>Stock Qty.From : {line.com_stock} &nbsp;&nbsp;|&nbsp;&nbsp; Stock Qty.To : {line.com_stock}</div>}
          {mode === 'BR_TO_BR' && <div>Stock Qty : {line.com_stock} &nbsp;&nbsp;|&nbsp;&nbsp; Total Trnsf.Qty.: {items.reduce((s, it) => s + Number(it.qty || 0), 0)}</div>}
          {mode === 'COMM_TO_RMA' && <div>Com. Stock Qty : {line.com_stock} &nbsp;&nbsp;|&nbsp;&nbsp; RMA Stock Qty : {line.rma_stock}</div>}
          {mode === 'RMA_TO_COMM' && <div>RMA Stock Qty : {line.rma_stock} &nbsp;&nbsp;|&nbsp;&nbsp; Com. Stock Qty : {line.com_stock}</div>}
        </div>
      </fieldset>
    </div>
  );
}

export function StockTransferCommPage() {
  return <StockTransferTemplate mode="COMM_TO_COMM" title="Stock Transfer Commercial" legend="Stock Transfer Commercial" />;
}
export function StockTransferBrPage() {
  return <StockTransferTemplate mode="BR_TO_BR" title="Stock Transfer Branch to Branch" legend="Stock Transfer Branch to Branch" />;
}
export function StockTransferCommToRmaPage() {
  return <StockTransferTemplate mode="COMM_TO_RMA" title="Stock Transfer Commercial to RMA" legend="Stock Transfer Commercial to RMA" />;
}
export function StockTransferRmaToCommPage() {
  return <StockTransferTemplate mode="RMA_TO_COMM" title="Stock Transfer RMA to Commercial" legend="Stock Transfer RMA to Commercial" />;
}

// 30. STOCK_RECEIVED_BR_TO_BR_TR.aspx — Stock Received Br. To Br. Transfer
export function StockReceivedBrToBrPage() {
  const { notify, openPrint, refreshMaster } = useErp();
  const navigate = useNavigate();
  const [transfers, setTransfers] = useState([]);
  const [selectedId, setSelectedId] = useState('');

  const loadTransfers = useCallback(async () => {
    const res = await fetch('/api/transfer/list?mode=BR_TO_BR');
    if (res.ok) {
      const data = await res.json();
      setTransfers(data.list || []);
      if (data.list?.[0] && !selectedId) setSelectedId(data.list[0].transfer_id);
    }
  }, [selectedId]);

  useEffect(() => {
    document.title = 'Approval';
    loadTransfers();
  }, [loadTransfers]);

  const current = transfers.find(t => t.transfer_id === selectedId) || transfers[0];

  const handleReceive = async () => {
    if (!current) return notify('No transfer selected', 'error');
    const res = await fetch('/api/transfer/receive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transfer_id: current.transfer_id })
    });
    const data = await res.json();
    if (data.ok) {
      notify(data.message);
      await refreshMaster();
      await loadTransfers();
    }
  };

  return (
    <div className="erp-container erp-container-narrow">
      <fieldset className="erp-fieldset">
        <legend className="erp-legend">Stock Received Br. To Br. Transfer</legend>
        <div className="row g-2">
          <div className="col-md-5">
            <select
              id="MainContent_ListBoxAllID"
              multiple
              className="form-select"
              style={{ height: '180px', fontFamily: 'Arial Narrow', fontWeight: 'bold' }}
              value={selectedId ? [selectedId] : []}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {transfers.map(t => (
                <option key={t.transfer_id} value={t.transfer_id}>
                  {t.transfer_id} — {t.transfer_date} ({t.from_branch} -&gt; {t.to_branch}) [{t.received}]
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-7">
            <div className="d-flex flex-wrap gap-2 mb-3">
              <button id="TRANSFER_ID_SELECT" className="erp-btn" onClick={() => notify(`Selected ${current?.transfer_id || ''}`)}>ID SELECT</button>
              <button id="MainContent_VIEW" className="erp-btn" onClick={() => current && openPrint({
                title: `Branch Transfer Details — ${current.transfer_id}`,
                columns: ['Product ID', 'Product Name', 'Serial No.', 'Qty', 'Status'],
                rows: (current.items || []).map(it => [it.product_id, it.product_name, it.serial_no, it.qty, current.received])
              })}>View</button>
              <button id="MainContent_PRINTPREVIEW" className="erp-btn" onClick={() => current && openPrint({
                title: `Branch Transfer Receiving Slip — ${current.transfer_id}`,
                columns: ['Product ID', 'Product Name', 'Serial No.', 'Qty'],
                rows: (current.items || []).map(it => [it.product_id, it.product_name, it.serial_no, it.qty])
              })}>Print</button>
              <button id="MainContent_REVEIVED" className="erp-btn" onClick={handleReceive}>Received</button>
              <button id="MainContent_EXIT" className="erp-btn" onClick={() => navigate('/GI/TREE.aspx')}>Exit</button>
            </div>
            {current && (
              <div className="border rounded p-2" style={{ backgroundColor: '#f8f9fa' }}>
                <div><strong>Transfer ID:</strong> {current.transfer_id} | <strong>Status:</strong> {current.received}</div>
                <div><strong>From:</strong> {current.from_branch} ({current.from_store}) → <strong>To:</strong> {current.to_branch} ({current.to_store})</div>
                <div><strong>Items:</strong> {(current.items || []).map(i => `${i.product_name} (Qty: ${i.qty})`).join(', ')}</div>
              </div>
            )}
          </div>
        </div>
      </fieldset>
    </div>
  );
}

// 31. COMPLAIN_RECEIVE.aspx — Complain Receive
export function ComplainReceivePage() {
  const { master, notify, openPrint } = useErp();
  const navigate = useNavigate();
  const [complains, setComplains] = useState([]);
  const [header, setHeader] = useState({
    ref_no: '', receive_date: getTodayStr(), receive_id: 'CMR001260000001',
    cash_customer: '', mobile_no: '', narration: '',
    cs_group: '', cs_name: '', store_name: 'SHOW ROOM'
  });
  const [line, setLine] = useState({
    product_id: '', product_group: '', product_name: '', product_description: '',
    item_remarks: '', sold_serial: '', warranty: '', sales_id: '',
    qty: '1', unit_price: '0', sales_date: '', no_of_times: '1',
    job_ref_no: '', received_serial: '', under_warranty: 'Y',
    delivery_date: getTodayStr(), problem_name: '', engineer_name: '', charge_amount: '0', stock_qty: 0
  });
  const [items, setItems] = useState([]);

  useEffect(() => {
    document.title = 'Complain Receive';
    fetch('/api/rma/all').then(r => r.json()).then(d => {
      setComplains(d.complains || []);
      if (d.complains?.[0]) {
        setHeader(h => ({ ...h, ...d.complains[0] }));
        setItems(d.complains[0].items || []);
      }
    });
  }, []);

  const totalAmount = items.reduce((s, it) => s + Number(it.charge_amount || 0), 0);

  const handleSave = async () => {
    let nextItems = [...items];
    if (line.product_name.trim()) {
      const qty = Number(line.qty || 1);
      const up = Number(line.unit_price || 0);
      nextItems.push({ ...line, total_price: qty * up });
      setItems(nextItems);
    }
    const res = await fetch('/api/rma/complain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...header, items: nextItems })
    });
    const data = await res.json();
    if (data.ok) {
      setHeader(h => ({ ...h, receive_id: data.id }));
      notify(data.message);
    }
  };

  return (
    <div className="erp-container">
      <fieldset className="erp-fieldset">
        <legend className="erp-legend">Complain Receive</legend>
        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Ref./Bill No.</label></div>
          <div className="col-md-2"><input id="REF_NO" className="erp-input" value={header.ref_no} onChange={(e) => setHeader({ ...header, ref_no: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Receive Date</label></div>
          <div className="col-md-2"><input id="COM_RECEIVE_DATE" className="erp-input" value={header.receive_date} onChange={(e) => setHeader({ ...header, receive_date: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Receive ID</label></div>
          <div className="col-md-3">
            <AutocompleteInput
              id="SEARCH_SALES_ID"
              value={header.receive_id}
              onChange={(v) => setHeader({ ...header, receive_id: v })}
              options={complains}
              labelKey="receive_id"
              subKey="cs_name"
              onSelect={(c) => { setHeader({ ...header, ...c }); setItems(c.items || []); }}
            />
          </div>
          <div className="col-md-2"><button id="PU_ID_SEARCH" className="erp-btn w-100" onClick={() => { if (complains[0]) { setHeader({ ...header, ...complains[0] }); setItems(complains[0].items || []); } }}>Search</button></div>
        </div>

        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Cash Customer</label></div>
          <div className="col-md-3"><input id="CASH_SUPPLIER_NAEM" className="erp-input" value={header.cash_customer} onChange={(e) => setHeader({ ...header, cash_customer: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Mobile No.</label></div>
          <div className="col-md-3"><input id="MOBILE_NO" className="erp-input" value={header.mobile_no} onChange={(e) => setHeader({ ...header, mobile_no: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Narration</label></div>
          <div className="col-md-3"><input id="NARRATION" className="erp-input" value={header.narration} onChange={(e) => setHeader({ ...header, narration: e.target.value })} /></div>
        </div>

        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Customer Group</label></div>
          <div className="col-md-3"><AutocompleteInput id="CS_GROUP" value={header.cs_group} onChange={(v) => setHeader({ ...header, cs_group: v })} options={master.traderGroups} labelKey="group_name" /></div>
          <div className="col-md-1"><label className="erp-label">Customer Name</label></div>
          <div className="col-md-6"><AutocompleteInput id="CS_NAME" value={header.cs_name} onChange={(v) => setHeader({ ...header, cs_name: v })} options={master.traders} labelKey="cs_name" onSelect={(t) => setHeader({ ...header, cs_name: t.cs_name, cs_group: t.group_name, mobile_no: t.mobile })} /></div>
          <div className="col-md-1"><button id="ADD_CS" className="erp-btn w-100" onClick={() => navigate('/GI/CUSTOMERINFORMATION.aspx')}>Add</button></div>
        </div>

        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Product Group</label></div>
          <div className="col-md-3"><AutocompleteInput id="PRODUCT_GROUP" value={line.product_group} onChange={(v) => setLine({ ...line, product_group: v })} options={master.productGroups} labelKey="group_name" /></div>
          <div className="col-md-1"><label className="erp-label">Item/Model No.</label></div>
          <div className="col-md-6">
            <AutocompleteInput
              id="PRODUCT_NAME"
              value={line.product_name}
              onChange={(v) => setLine({ ...line, product_name: v })}
              options={master.products}
              labelKey="product_name"
              onSelect={(p) => setLine({ ...line, product_id: p.product_id, product_group: p.group_name, product_name: p.product_name, product_description: p.description, warranty: p.warranty, unit_price: String(p.sales_price), stock_qty: p.stock_qty })}
            />
          </div>
          <div className="col-md-1"><button id="MainContent_ADD_PRODUCT" className="erp-btn w-100" onClick={() => navigate('/GI/PRODUCTINFORMATION.aspx')}>Add</button></div>
        </div>

        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Sold Serial No</label></div>
          <div className="col-md-2">
            <AutocompleteInput
              id="SOLD_SERIAL"
              value={line.sold_serial}
              onChange={(v) => setLine({ ...line, sold_serial: v })}
              options={master.serials}
              labelKey="serial_no"
              subKey="product_name"
              onSelect={(sn) => {
                setLine({
                  ...line,
                  sold_serial: sn.serial_no,
                  received_serial: sn.serial_no,
                  product_id: sn.product_id,
                  product_name: sn.product_name,
                  product_group: sn.product_group,
                  sales_id: sn.sales_id || 'INV001260000001',
                  sales_date: sn.sales_date || '12/11/2026',
                  warranty: sn.warranty || '18 Months',
                  unit_price: String(sn.unit_price || 19800)
                });
              }}
            />
          </div>
          <div className="col-md-1"><button id="SEARCH_SERIAL" className="erp-btn w-100" onClick={() => notify('Serial history loaded')}>Search</button></div>
          <div className="col-md-1"><label className="erp-label">Sales ID</label></div>
          <div className="col-md-2"><input id="SALES_ID" className="erp-input" value={line.sales_id} onChange={(e) => setLine({ ...line, sales_id: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Sales Date</label></div>
          <div className="col-md-2"><input id="SALES_DATE" className="erp-input" value={line.sales_date} onChange={(e) => setLine({ ...line, sales_date: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Under Warranty</label></div>
          <div className="col-md-1">
            <select id="DropdownList_UnderWarr" className="erp-select" value={line.under_warranty} onChange={(e) => setLine({ ...line, under_warranty: e.target.value })}>
              <option value="Y">Yes</option>
              <option value="N">No</option>
            </select>
          </div>
        </div>

        <div className="row g-1 align-items-center mb-2">
          <div className="col-md-1"><label className="erp-label">Rec. Serial No.</label></div>
          <div className="col-md-2"><input id="RECEIVED_SERIAL" className="erp-input" value={line.received_serial} onChange={(e) => setLine({ ...line, received_serial: e.target.value })} /></div>
          <div className="col-md-1"><button id="SLGENERATE" className="erp-btn w-100" onClick={() => setLine({ ...line, received_serial: `RMA-${Date.now().toString().slice(-6)}` })}>Auto Generate SL</button></div>
          <div className="col-md-1"><label className="erp-label">Problem Name</label></div>
          <div className="col-md-2"><AutocompleteInput id="PROBLEM_NAME" value={line.problem_name} onChange={(v) => setLine({ ...line, problem_name: v })} options={master.problems} labelKey="problem_name" /></div>
          <div className="col-md-1"><label className="erp-label">Engineer Name</label></div>
          <div className="col-md-2"><AutocompleteInput id="ENGINEER_NAME" value={line.engineer_name} onChange={(v) => setLine({ ...line, engineer_name: v })} options={master.employees} labelKey="employee_name" /></div>
          <div className="col-md-1"><label className="erp-label">Charge Amount</label></div>
          <div className="col-md-1"><input id="AMOUNT" className="erp-input" value={line.charge_amount} onChange={(e) => setLine({ ...line, charge_amount: e.target.value })} /></div>
        </div>

        <div className="d-flex flex-wrap gap-1 mb-2">
          <button id="SAVE_BUTTON" className="erp-btn" onClick={handleSave}>Save</button>
          <button id="EDIT" className="erp-btn" onClick={handleSave}>Edit</button>
          <button id="MainContent_PRINTVIEW" className="erp-btn" onClick={() => openPrint({
            title: `RMA Complain Receive Token — ${header.receive_id}`,
            columns: ['Received ID', 'Product ID', 'Product Name', 'Serial', 'Problem', 'Qty', 'Charge Amount'],
            rows: items.map(it => [header.receive_id, it.product_id, it.product_name, it.received_serial || it.sold_serial, it.problem_name, it.qty, it.charge_amount])
          })}>Print Preview</button>
          <button id="PRINT" className="erp-btn" onClick={() => window.print()}>Print</button>
          <button id="PRINT_A5" className="erp-btn" onClick={() => openPrint({
            title: `RMA Complain Slip (A5) — ${header.receive_id}`,
            mode: 'a5',
            columns: ['Product Name', 'Serial No.', 'Problem', 'Warranty', 'Charge'],
            rows: items.map(it => [it.product_name, it.received_serial || it.sold_serial, it.problem_name, it.under_warranty, it.charge_amount])
          })}>Print A5</button>
          <button id="Clear" className="erp-btn" onClick={() => setItems([])}>Clear/New</button>
          <button id="MainContent_EXIT" className="erp-btn" onClick={() => navigate('/GI/TREE.aspx')}>Exit</button>
        </div>

        <div className="erp-grid-box mb-2">
          <table id="GridView1" className="erp-table">
            <thead>
              <tr><th>Received ID</th><th>Product ID</th><th>Product Name</th><th>Item Remarks</th><th>Qty</th><th>Unit Price</th><th>Total Price</th><th>Charge Amount</th><th>Select</th><th>Edit</th><th>Delete</th></tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i}>
                  <td>{header.receive_id}</td><td>{it.product_id}</td><td>{it.product_name}</td><td>{it.item_remarks}</td><td>{it.qty}</td><td>{it.unit_price}</td><td>{it.total_price}</td><td>{it.charge_amount}</td>
                  <td><button className="erp-btn" onClick={() => setLine({ ...line, ...it })}>Select</button></td>
                  <td><button className="erp-btn" onClick={() => { setLine({ ...line, ...it }); setItems(items.filter((_, idx) => idx !== i)); }}>Edit</button></td>
                  <td><button className="erp-btn" onClick={() => setItems(items.filter((_, idx) => idx !== i))}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="erp-footer-panel" style={{ minHeight: '45px' }}>
          Stock Qty. {line.stock_qty} &nbsp;&nbsp;|&nbsp;&nbsp; Total Amount: {totalAmount.toFixed(2)}
        </div>
      </fieldset>
    </div>
  );
}

// 32. REPLACE_OUT.aspx — Replace Out
export function ReplaceOutPage() {
  const { master, notify, openPrint } = useErp();
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [header, setHeader] = useState({
    ref_no: '', out_date: getTodayStr(), out_id: 'OUT001260000001',
    cs_group: '', cs_name: '', narration: '', store_name: 'SHOW ROOM'
  });
  const [line, setLine] = useState({
    receive_id: 'CMR001260000001', product_id: '', product_group: '', product_name: '',
    purchase_serial: '', out_serial: '', purchase_id: '', purchase_date: '',
    qty: '1', unit_price: '0', job_ref_no: '', problem_name: '', engineer_name: '', charge_amount: '0', under_warranty: 'Y'
  });
  const [items, setItems] = useState([]);

  useEffect(() => {
    document.title = 'REPLACE OUT';
    fetch('/api/rma/all').then(r => r.json()).then(d => {
      setList(d.replaceOuts || []);
      if (d.replaceOuts?.[0]) {
        setHeader(h => ({ ...h, ...d.replaceOuts[0] }));
        setItems(d.replaceOuts[0].items || []);
      }
    });
  }, []);

  const handleSave = async () => {
    let nextItems = [...items];
    if (line.product_name.trim()) nextItems.push({ ...line });
    setItems(nextItems);
    const res = await fetch('/api/rma/replace-out', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...header, items: nextItems })
    });
    const data = await res.json();
    if (data.ok) {
      setHeader(h => ({ ...h, out_id: data.id }));
      notify(data.message);
    }
  };

  return (
    <div className="erp-container">
      <fieldset className="erp-fieldset">
        <legend className="erp-legend">Replace Out</legend>
        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Ref./Bill No.</label></div>
          <div className="col-md-2"><input id="REF_NO" className="erp-input" value={header.ref_no} onChange={(e) => setHeader({ ...header, ref_no: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Out Date</label></div>
          <div className="col-md-2"><input id="OUT_DATE" className="erp-input" value={header.out_date} onChange={(e) => setHeader({ ...header, out_date: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Repl. Out ID</label></div>
          <div className="col-md-3"><AutocompleteInput id="SEARCH_SALES_ID" value={header.out_id} onChange={(v) => setHeader({ ...header, out_id: v })} options={list} labelKey="out_id" onSelect={(o) => { setHeader({ ...header, ...o }); setItems(o.items || []); }} /></div>
          <div className="col-md-2"><button id="Button1" className="erp-btn w-100" onClick={() => { if (list[0]) { setHeader({ ...header, ...list[0] }); setItems(list[0].items || []); } }}>Search</button></div>
        </div>

        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Supplier Group</label></div>
          <div className="col-md-3"><AutocompleteInput id="CS_GROUP" value={header.cs_group} onChange={(v) => setHeader({ ...header, cs_group: v })} options={master.traderGroups} labelKey="group_name" /></div>
          <div className="col-md-1"><label className="erp-label">Supplier Name</label></div>
          <div className="col-md-3"><AutocompleteInput id="CS_NAME" value={header.cs_name} onChange={(v) => setHeader({ ...header, cs_name: v })} options={master.traders} labelKey="cs_name" onSelect={(t) => setHeader({ ...header, cs_name: t.cs_name, cs_group: t.group_name })} /></div>
          <div className="col-md-1"><label className="erp-label">Narration</label></div>
          <div className="col-md-3"><input id="NARRATION" className="erp-input" value={header.narration} onChange={(e) => setHeader({ ...header, narration: e.target.value })} /></div>
        </div>

        <div className="row g-1 align-items-center mb-2">
          <div className="col-md-1"><label className="erp-label">Item/Model No.</label></div>
          <div className="col-md-3"><AutocompleteInput id="PRODUCT_NAME" value={line.product_name} onChange={(v) => setLine({ ...line, product_name: v })} options={master.products} labelKey="product_name" onSelect={(p) => setLine({ ...line, product_id: p.product_id, product_group: p.group_name, product_name: p.product_name, unit_price: String(p.purchase_price) })} /></div>
          <div className="col-md-1"><label className="erp-label">Pur./Rec.SL No.</label></div>
          <div className="col-md-2"><input id="PURCHASE_SERIAL" className="erp-input" value={line.purchase_serial} onChange={(e) => setLine({ ...line, purchase_serial: e.target.value, out_serial: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Out Serial No.</label></div>
          <div className="col-md-2"><input id="OUT_SERIAL" className="erp-input" value={line.out_serial} onChange={(e) => setLine({ ...line, out_serial: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Amount Charge</label></div>
          <div className="col-md-1"><input id="AMOUNT" className="erp-input" value={line.charge_amount} onChange={(e) => setLine({ ...line, charge_amount: e.target.value })} /></div>
        </div>

        <div className="d-flex flex-wrap gap-1 mb-2">
          <button id="SAVE_BUTTON" className="erp-btn" onClick={handleSave}>Save</button>
          <button id="EDIT" className="erp-btn" onClick={handleSave}>Edit</button>
          <button id="PRINTVIEW" className="erp-btn" onClick={() => openPrint({
            title: `RMA Replace Out Challan — ${header.out_id}`,
            columns: ['Out ID', 'Received ID', 'Product ID', 'Product Name', 'Serial No.', 'Qty', 'Unit Price'],
            rows: items.map(it => [header.out_id, it.receive_id, it.product_id, it.product_name, it.out_serial || it.purchase_serial, it.qty, it.unit_price])
          })}>Print Preview</button>
          <button id="PRINT" className="erp-btn" onClick={() => window.print()}>Print</button>
          <button id="Clear" className="erp-btn" onClick={() => setItems([])}>Clear/New</button>
          <button id="MainContent_EXIT" className="erp-btn" onClick={() => navigate('/GI/TREE.aspx')}>Exit</button>
        </div>

        <div className="erp-grid-box">
          <table id="GridView1" className="erp-table">
            <thead><tr><th>Out ID</th><th>Received ID</th><th>Product ID</th><th>Product Name</th><th>Qty</th><th>Unit Price</th><th>Select</th><th>Edit</th><th>Delete</th></tr></thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i}>
                  <td>{header.out_id}</td><td>{it.receive_id}</td><td>{it.product_id}</td><td>{it.product_name}</td><td>{it.qty}</td><td>{it.unit_price}</td>
                  <td><button className="erp-btn" onClick={() => setLine({ ...line, ...it })}>Select</button></td>
                  <td><button className="erp-btn" onClick={() => { setLine({ ...line, ...it }); setItems(items.filter((_, idx) => idx !== i)); }}>Edit</button></td>
                  <td><button className="erp-btn" onClick={() => setItems(items.filter((_, idx) => idx !== i))}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </fieldset>
    </div>
  );
}

// 33. REPLACE_IN.aspx — Replace In
export function ReplaceInPage() {
  const { master, notify, openPrint } = useErp();
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [header, setHeader] = useState({
    ref_no: '', in_date: getTodayStr(), in_id: 'RIN001260000001',
    cs_group: '', cs_name: '', narration: '', store_name: 'SHOW ROOM',
    adjustment_type: 'Without Adjustment'
  });
  const [line, setLine] = useState({
    product_id: '', product_group: '', product_name: '',
    job_ref_no: '', out_serial: '', in_serial: '', qty: '1', unit_price: '0', charge_amount: '0'
  });
  const [items, setItems] = useState([]);

  const ADJ_OPTIONS = [
    'Without Adjustment',
    'Adjustment Receiveable',
    'Adjustment Payable',
    'Product with Adjustment Receiveable',
    'Product with Adjustment Payable'
  ];

  useEffect(() => {
    document.title = 'REPLACE IN';
    fetch('/api/rma/all').then(r => r.json()).then(d => {
      setList(d.replaceIns || []);
      if (d.replaceIns?.[0]) {
        setHeader(h => ({ ...h, ...d.replaceIns[0] }));
        setItems(d.replaceIns[0].items || []);
      }
    });
  }, []);

  const handleSave = async () => {
    let nextItems = [...items];
    if (line.product_name.trim()) nextItems.push({ ...line });
    setItems(nextItems);
    const res = await fetch('/api/rma/replace-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...header, items: nextItems })
    });
    const data = await res.json();
    if (data.ok) {
      setHeader(h => ({ ...h, in_id: data.id }));
      notify(data.message);
    }
  };

  return (
    <div className="erp-container">
      <fieldset className="erp-fieldset">
        <legend className="erp-legend">Replace In</legend>
        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Ref./Bill No.</label></div>
          <div className="col-md-2"><input id="REF_NO" className="erp-input" value={header.ref_no} onChange={(e) => setHeader({ ...header, ref_no: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Rep. In Date</label></div>
          <div className="col-md-2"><input id="IN_DATE" className="erp-input" value={header.in_date} onChange={(e) => setHeader({ ...header, in_date: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Repl. In ID</label></div>
          <div className="col-md-3"><AutocompleteInput id="SEARCH_SALES_ID" value={header.in_id} onChange={(v) => setHeader({ ...header, in_id: v })} options={list} labelKey="in_id" onSelect={(r) => { setHeader({ ...header, ...r }); setItems(r.items || []); }} /></div>
          <div className="col-md-2"><button id="PU_ID_SEARCH" className="erp-btn w-100" onClick={() => { if (list[0]) { setHeader({ ...header, ...list[0] }); setItems(list[0].items || []); } }}>Search</button></div>
        </div>

        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Supplier Group</label></div>
          <div className="col-md-3"><AutocompleteInput id="CS_GROUP" value={header.cs_group} onChange={(v) => setHeader({ ...header, cs_group: v })} options={master.traderGroups} labelKey="group_name" /></div>
          <div className="col-md-1"><label className="erp-label">Supplier Name</label></div>
          <div className="col-md-3"><AutocompleteInput id="CS_NAME" value={header.cs_name} onChange={(v) => setHeader({ ...header, cs_name: v })} options={master.traders} labelKey="cs_name" onSelect={(t) => setHeader({ ...header, cs_name: t.cs_name, cs_group: t.group_name })} /></div>
          <div className="col-md-1"><label className="erp-label">Item/Model No.</label></div>
          <div className="col-md-3"><AutocompleteInput id="PRODUCT_NAME" value={line.product_name} onChange={(v) => setLine({ ...line, product_name: v })} options={master.products} labelKey="product_name" onSelect={(p) => setLine({ ...line, product_id: p.product_id, product_group: p.group_name, product_name: p.product_name, unit_price: String(p.purchase_price) })} /></div>
        </div>

        <div className="d-flex flex-wrap gap-3 my-1 p-1 border rounded" style={{ backgroundColor: '#f8f9fa' }}>
          {ADJ_OPTIONS.map((opt, idx) => (
            <label key={opt} className="erp-label d-flex align-items-center gap-1">
              <input id={`RadioButton_${idx}`} type="radio" name="rinAdj" checked={header.adjustment_type === opt} onChange={() => setHeader({ ...header, adjustment_type: opt })} />
              {opt}
            </label>
          ))}
        </div>

        <div className="row g-1 align-items-center mb-2">
          <div className="col-md-1"><label className="erp-label">Out Serial No</label></div>
          <div className="col-md-3"><input id="OUT_SERIAL" className="erp-input" value={line.out_serial} onChange={(e) => setLine({ ...line, out_serial: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">New Serial No.</label></div>
          <div className="col-md-3"><input id="IN_SERIAL" className="erp-input" value={line.in_serial} onChange={(e) => setLine({ ...line, in_serial: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Unit Price</label></div>
          <div className="col-md-1"><input id="UNIT_PRICE" className="erp-input" value={line.unit_price} onChange={(e) => setLine({ ...line, unit_price: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Charge Amount</label></div>
          <div className="col-md-1"><input id="AMOUNT" className="erp-input" value={line.charge_amount} onChange={(e) => setLine({ ...line, charge_amount: e.target.value })} /></div>
        </div>

        <div className="d-flex flex-wrap gap-1 mb-2">
          <button id="SAVE_BUTTON" className="erp-btn" onClick={handleSave}>Save</button>
          <button id="EDIT" className="erp-btn" onClick={handleSave}>Edit</button>
          <button id="MainContent_PRINT" className="erp-btn" onClick={() => openPrint({
            title: `RMA Replace In Voucher — ${header.in_id}`,
            columns: ['Replace In ID', 'Product ID', 'Product Name', 'Old Serial', 'New Serial', 'Qty', 'Unit Price', 'Charge Amt.'],
            rows: items.map(it => [header.in_id, it.product_id, it.product_name, it.out_serial, it.in_serial, it.qty, it.unit_price, it.charge_amount])
          })}>Print</button>
          <button id="MainContent_PRINTVIEW" className="erp-btn" onClick={() => window.print()}>Print Preview</button>
          <button id="Clear" className="erp-btn" onClick={() => setItems([])}>Clear/New</button>
          <button id="MainContent_EXIT" className="erp-btn" onClick={() => navigate('/GI/TREE.aspx')}>Exit</button>
        </div>

        <div className="erp-grid-box">
          <table id="GridView1" className="erp-table">
            <thead><tr><th>Replace In ID</th><th>Product ID</th><th>Product Name</th><th>Qty</th><th>Unit Price</th><th>Charge Amt.</th><th>Select</th><th>Edit</th><th>Delete</th></tr></thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i}>
                  <td>{header.in_id}</td><td>{it.product_id}</td><td>{it.product_name}</td><td>{it.qty}</td><td>{it.unit_price}</td><td>{it.charge_amount}</td>
                  <td><button className="erp-btn" onClick={() => setLine({ ...line, ...it })}>Select</button></td>
                  <td><button className="erp-btn" onClick={() => { setLine({ ...line, ...it }); setItems(items.filter((_, idx) => idx !== i)); }}>Edit</button></td>
                  <td><button className="erp-btn" onClick={() => setItems(items.filter((_, idx) => idx !== i))}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </fieldset>
    </div>
  );
}

// 34. REPLACEMENT_DELIVERY.aspx — Replacement Delivery
export function ReplacementDeliveryPage() {
  const { master, notify, openPrint } = useErp();
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [header, setHeader] = useState({
    ref_no: '', delivery_date: getTodayStr(), delivery_id: 'RDV001260000001',
    mobile_no: '', delivery_person: '', narration: '',
    cs_group: '', cs_name: '', store_name: 'SHOW ROOM',
    adjustment_type: 'Without Adjustment'
  });
  const [line, setLine] = useState({
    complain_receive_id: 'CMR001260000001', job_ref_no: 'JOB-101',
    received_serial: 'HMK150-26001', replace_in_serial: 'HMK150-26099-NEW', delivery_serial: 'HMK150-26099-NEW',
    product_id: 'PRD00001', product_group: 'IPS & UPS BATTERY', product_name: 'HAMKO 150AH TUBULAR IPS BATTERY',
    qty: '1', amount: '0'
  });
  const [items, setItems] = useState([]);

  const ADJ_OPTIONS = [
    'Without Adjustment',
    'Adjustment Receiveable',
    'Adjustment Payable',
    'Product with Adjustment Receiveable',
    'Product with Adjustment Payable'
  ];

  useEffect(() => {
    document.title = 'Replacement Delivery';
    fetch('/api/rma/all').then(r => r.json()).then(d => setList(d.deliveries || []));
  }, []);

  const handleSave = async () => {
    let nextItems = [...items];
    if (line.product_name.trim()) nextItems.push({ ...line });
    setItems(nextItems);
    const res = await fetch('/api/rma/delivery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...header, items: nextItems })
    });
    const data = await res.json();
    if (data.ok) {
      setHeader(h => ({ ...h, delivery_id: data.id }));
      notify(data.message);
    }
  };

  return (
    <div className="erp-container">
      <fieldset className="erp-fieldset">
        <legend className="erp-legend">Replacement Delivery</legend>
        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Ref No./Memo No.</label></div>
          <div className="col-md-2"><input id="REF_NO" className="erp-input" value={header.ref_no} onChange={(e) => setHeader({ ...header, ref_no: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Delivery Date</label></div>
          <div className="col-md-2"><input id="DELIVERY_DATE" className="erp-input" value={header.delivery_date} onChange={(e) => setHeader({ ...header, delivery_date: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Delivery ID</label></div>
          <div className="col-md-3"><AutocompleteInput id="SEARCH_SALES_ID" value={header.delivery_id} onChange={(v) => setHeader({ ...header, delivery_id: v })} options={list} labelKey="delivery_id" onSelect={(d) => { setHeader({ ...header, ...d }); setItems(d.items || []); }} /></div>
          <div className="col-md-2"><button id="PU_ID_SEARCH" className="erp-btn w-100" onClick={() => { if (list[0]) { setHeader({ ...header, ...list[0] }); setItems(list[0].items || []); } }}>Search</button></div>
        </div>

        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Customer Name</label></div>
          <div className="col-md-3"><AutocompleteInput id="CS_NAME" value={header.cs_name} onChange={(v) => setHeader({ ...header, cs_name: v })} options={master.traders} labelKey="cs_name" onSelect={(t) => setHeader({ ...header, cs_name: t.cs_name, cs_group: t.group_name, mobile_no: t.mobile })} /></div>
          <div className="col-md-1"><label className="erp-label">Mobile</label></div>
          <div className="col-md-2"><input id="MOBILE_NO" className="erp-input" value={header.mobile_no} onChange={(e) => setHeader({ ...header, mobile_no: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Delivery Person</label></div>
          <div className="col-md-2"><input id="TDELIVERY_BY" className="erp-input" value={header.delivery_person} onChange={(e) => setHeader({ ...header, delivery_person: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Received Serial No</label></div>
          <div className="col-md-1"><input id="IN_SERIAL" className="erp-input" value={line.received_serial} onChange={(e) => setLine({ ...line, received_serial: e.target.value })} /></div>
        </div>

        <div className="d-flex flex-wrap gap-3 my-1 p-1 border rounded" style={{ backgroundColor: '#f8f9fa' }}>
          {ADJ_OPTIONS.map((opt, idx) => (
            <label key={opt} className="erp-label d-flex align-items-center gap-1">
              <input id={`RadioButtonList1_${idx}`} type="radio" name="rdvAdj" checked={header.adjustment_type === opt} onChange={() => setHeader({ ...header, adjustment_type: opt })} />
              {opt}
            </label>
          ))}
        </div>

        <div className="row g-1 align-items-center mb-2">
          <div className="col-md-1"><label className="erp-label">Caption/Model No.</label></div>
          <div className="col-md-3"><AutocompleteInput id="PRODUCT_NAME" value={line.product_name} onChange={(v) => setLine({ ...line, product_name: v })} options={master.products} labelKey="product_name" /></div>
          <div className="col-md-1"><label className="erp-label">Replace in Serial</label></div>
          <div className="col-md-2"><input id="MainContent_IN_NEW_SERIAL" className="erp-input" value={line.replace_in_serial} readOnly /></div>
          <div className="col-md-1"><label className="erp-label">Delivery Serial.</label></div>
          <div className="col-md-2"><input id="DELIVERY_SERIAL_NO" className="erp-input" value={line.delivery_serial} onChange={(e) => setLine({ ...line, delivery_serial: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Charge Amount</label></div>
          <div className="col-md-1"><input id="AMOUNT" className="erp-input" value={line.amount} onChange={(e) => setLine({ ...line, amount: e.target.value })} /></div>
        </div>

        <div className="d-flex flex-wrap gap-1 mb-2">
          <button id="SAVE_BUTTON" className="erp-btn" onClick={handleSave}>Save</button>
          <button id="EDIT" className="erp-btn" onClick={handleSave}>Edit</button>
          <button id="MainContent_PRINTVIEW" className="erp-btn" onClick={() => openPrint({
            title: `Replacement Delivery Gate Pass — ${header.delivery_id}`,
            columns: ['Delivery ID', 'Complain Received ID', 'Product ID', 'Product Name', 'Delivered Serial', 'Qty', 'Amount'],
            rows: items.map(it => [header.delivery_id, it.complain_receive_id, it.product_id, it.product_name, it.delivery_serial, it.qty, it.amount])
          })}>Print Preview</button>
          <button id="MainContent_PRINT" className="erp-btn" onClick={() => window.print()}>Print</button>
          <button id="Clear" className="erp-btn" onClick={() => setItems([])}>Clear/New</button>
          <button id="MainContent_EXIT" className="erp-btn" onClick={() => navigate('/GI/TREE.aspx')}>Exit</button>
        </div>

        <div className="erp-grid-box">
          <table id="GridView1" className="erp-table">
            <thead><tr><th>Delivery ID</th><th>Complain Received ID</th><th>Product ID</th><th>Product Name</th><th>Qty</th><th>Amount</th><th>Select</th><th>Edit</th><th>Delete</th></tr></thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i}>
                  <td>{header.delivery_id}</td><td>{it.complain_receive_id}</td><td>{it.product_id}</td><td>{it.product_name}</td><td>{it.qty}</td><td>{it.amount}</td>
                  <td><button className="erp-btn" onClick={() => setLine({ ...line, ...it })}>Select</button></td>
                  <td><button className="erp-btn" onClick={() => { setLine({ ...line, ...it }); setItems(items.filter((_, idx) => idx !== i)); }}>Edit</button></td>
                  <td><button className="erp-btn" onClick={() => setItems(items.filter((_, idx) => idx !== i))}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </fieldset>
    </div>
  );
}

// 35. RMA_SERIAL_SEARCH.aspx — Rma Product Search
export function RmaSerialSearchPage() {
  const { master, openPrint } = useErp();
  const navigate = useNavigate();
  const [serialNo, setSerialNo] = useState('');
  const [rows, setRows] = useState([]);

  const handleSearch = useCallback(async () => {
    const res = await fetch('/api/rma/all');
    if (res.ok) {
      const data = await res.json();
      const term = serialNo.trim().toLowerCase();
      const filtered = (data.history || []).filter(h =>
        !term ||
        String(h.serial_no || '').toLowerCase().includes(term) ||
        String(h.old_serial || '').toLowerCase().includes(term) ||
        String(h.new_serial || '').toLowerCase().includes(term)
      );
      setRows(filtered);
    }
  }, [serialNo]);

  useEffect(() => {
    document.title = 'RMA Product Search by Serial No.';
    handleSearch();
  }, []);

  return (
    <div className="erp-container">
      <fieldset className="erp-fieldset mb-2">
        <legend className="erp-legend">RMA Product Search by Serial No.</legend>
        <div className="row g-2 align-items-center">
          <div className="col-md-2"><label className="erp-label">Input Serial No.</label></div>
          <div className="col-md-4">
            <AutocompleteInput
              id="SERIALNO"
              value={serialNo}
              onChange={setSerialNo}
              options={master.serials}
              labelKey="serial_no"
              subKey="product_name"
            />
          </div>
          <div className="col-md-6 d-flex gap-2">
            <button id="SEARCH" className="erp-btn" onClick={handleSearch}>Search</button>
            <button id="MainContent_Button1" className="erp-btn" onClick={() => { setSerialNo(''); setRows([]); }}>Clear</button>
            <button id="MainContent_EXIT" className="erp-btn" onClick={() => navigate('/GI/TREE.aspx')}>Exit</button>
          </div>
        </div>
      </fieldset>

      <fieldset className="erp-fieldset">
        <legend className="erp-legend">Serial Wise Product All Information</legend>
        <div className="erp-grid-box">
          <table id="GridView1" className="erp-table">
            <thead>
              <tr>
                <th>Trancation Type</th>
                <th>Transcation ID</th>
                <th>Transcation Date</th>
                <th>CS Name</th>
                <th>Product Name</th>
                <th>Old Serial</th>
                <th>New Serial</th>
                <th>WARRANTY</th>
                <th>Problem</th>
                <th>Amount</th>
                <th>Print Preview</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>{r.transaction_type}</td>
                  <td>{r.transaction_id}</td>
                  <td>{r.transaction_date}</td>
                  <td>{r.cs_name}</td>
                  <td>{r.product_name}</td>
                  <td>{r.old_serial || r.serial_no}</td>
                  <td>{r.new_serial || r.serial_no}</td>
                  <td>{r.warranty}</td>
                  <td>{r.problem}</td>
                  <td>{Number(r.amount || 0).toFixed(2)}</td>
                  <td><button className="erp-btn" onClick={() => openPrint({
                    title: `RMA Serial Lifecycle — ${r.serial_no}`,
                    columns: ['Type', 'ID', 'Date', 'Party', 'Product', 'Old Serial', 'New Serial', 'Problem'],
                    rows: [[r.transaction_type, r.transaction_id, r.transaction_date, r.cs_name, r.product_name, r.old_serial, r.new_serial, r.problem]]
                  })}>Print Preview</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </fieldset>
    </div>
  );
}
