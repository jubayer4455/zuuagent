import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useErp, getTodayStr, getMonthStartStr } from '../context/ErpContext.jsx';
import AutocompleteInput from '../components/AutocompleteInput.jsx';

// 18. PURCHASE.aspx — Purchase
export function PurchasePage() {
  const { master, refreshMaster, notify, openPrint } = useErp();
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState([]);
  const [navIdx, setNavIdx] = useState(-1);
  const [header, setHeader] = useState({
    ref_no: '',
    purchase_date: getTodayStr(),
    search_purchase_id: '',
    purchase_id: '',
    cs_group: '',
    cs_name: '',
    store_name: 'SHOW ROOM',
    narration: '',
    commenc_date: '',
    discount_amount: '0',
    vat_amount: '0',
    payment_amount: '0'
  });
  const [line, setLine] = useState({
    product_id: '',
    product_group: '',
    product_name: '',
    product_description: '',
    expiry_date: '',
    serial_mode: 'single',
    serial_clear: false,
    check_digit: false,
    check_digit_val: '',
    serial_common: '',
    serial_from: '',
    serial_to: '',
    warranty: '',
    qty: '1',
    unit_price: '0',
    stock_qty: 0
  });
  const [items, setItems] = useState([]);

  const loadList = useCallback(async () => {
    const res = await fetch('/api/trading/purchases');
    if (res.ok) {
      const data = await res.json();
      setPurchases(data.list || []);
    }
  }, []);

  useEffect(() => {
    document.title = 'Purchase';
    loadList();
  }, [loadList]);

  const selectedTrader = master.traders.find(t => t.cs_name === header.cs_name);
  const totalAmount = items.reduce((s, it) => s + Number(it.total_price || 0), 0);
  const totalQty = items.reduce((s, it) => s + Number(it.qty || 0), 0);
  const netPayable = totalAmount + Number(header.vat_amount || 0) - Number(header.discount_amount || 0);

  const loadRecord = (rec) => {
    if (!rec) return;
    setHeader({
      ref_no: rec.ref_no || '',
      purchase_date: rec.purchase_date || getTodayStr(),
      search_purchase_id: rec.purchase_id,
      purchase_id: rec.purchase_id,
      cs_group: rec.cs_group || '',
      cs_name: rec.cs_name || '',
      store_name: rec.store_name || 'SHOW ROOM',
      narration: rec.narration || '',
      commenc_date: rec.commenc_date || '',
      discount_amount: String(rec.discount_amount || 0),
      vat_amount: String(rec.vat_amount || 0),
      payment_amount: String(rec.payment_amount || 0)
    });
    setItems(rec.items || []);
  };

  const handleAddOrSave = async () => {
    let nextItems = [...items];
    if (line.product_name.trim()) {
      const qty = Number(line.qty || 1);
      const up = Number(line.unit_price || 0);
      let serialStr = line.serial_from || line.serial_common;
      if (line.serial_mode === 'seq' && line.serial_from && line.serial_to) {
        const f = parseInt(line.serial_from, 10);
        const t = parseInt(line.serial_to, 10);
        if (!isNaN(f) && !isNaN(t) && t >= f && t - f <= 200) {
          const arr = [];
          for (let k = f; k <= t; k++) arr.push(`${line.serial_common}${k}`);
          serialStr = arr.join(',');
        }
      } else if (line.serial_mode === 'auto') {
        const arr = [];
        for (let k = 1; k <= qty; k++) arr.push(`AUTO-${Date.now().toString().slice(-5)}-${k}`);
        serialStr = arr.join(',');
      }
      nextItems.push({
        product_id: line.product_id || 'PRD00001',
        product_group: line.product_group,
        product_name: line.product_name,
        product_description: line.product_description || line.product_name,
        warranty: line.warranty,
        expiry_date: line.expiry_date,
        serial_no: serialStr,
        qty,
        unit_price: up,
        total_price: qty * up
      });
      setItems(nextItems);
      setLine({ ...line, product_id: '', product_name: '', product_description: '', serial_common: '', serial_from: '', serial_to: '', qty: '1', unit_price: '0' });
    }

    if (!header.cs_name.trim()) return notify('Please select Supplier Name', 'error');
    if (nextItems.length === 0) return notify('Please add at least one product item', 'error');

    const res = await fetch('/api/trading/purchases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...header, items: nextItems })
    });
    const data = await res.json();
    if (data.ok) {
      setHeader(h => ({ ...h, purchase_id: data.id, search_purchase_id: data.id }));
      notify(data.message);
      await refreshMaster();
      await loadList();
    }
  };

  const handlePrint = () => {
    openPrint({
      title: 'PURCHASE VOUCHER / BILL',
      meta: {
        'Purchase ID': header.purchase_id || master.nextIds?.purchase,
        'Purchase Date': header.purchase_date,
        'Ref./Bill No.': header.ref_no,
        'Supplier Name': header.cs_name,
        'Supplier Group': header.cs_group,
        'Store Name': header.store_name
      },
      columns: ['SL', 'Product ID', 'Product Description', 'Serial No.', 'Warranty', 'Qty', 'Unit Price', 'Total Price'],
      rows: items.map((it, i) => [i + 1, it.product_id, it.product_description || it.product_name, it.serial_no || '', it.warranty || '', it.qty, Number(it.unit_price || 0).toFixed(2), Number(it.total_price || 0).toFixed(2)]),
      summary: {
        'Total Qty': totalQty,
        'Total Amount': totalAmount.toFixed(2),
        'Add VAT': Number(header.vat_amount || 0).toFixed(2),
        'Discount Amount': Number(header.discount_amount || 0).toFixed(2),
        'Net Payable Amt.': netPayable.toFixed(2),
        'Payment Amount': Number(header.payment_amount || 0).toFixed(2)
      }
    });
  };

  return (
    <div className="erp-container">
      <fieldset className="erp-fieldset">
        <legend className="erp-legend">Purchase</legend>

        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Ref./Bill No.</label></div>
          <div className="col-md-2"><input id="REF_NO" className="erp-input" value={header.ref_no} onChange={(e) => setHeader({ ...header, ref_no: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Purchase Date</label></div>
          <div className="col-md-2"><input id="PURCHASE_DATE" className="erp-input" value={header.purchase_date} onChange={(e) => setHeader({ ...header, purchase_date: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Purchase ID</label></div>
          <div className="col-md-3">
            <AutocompleteInput
              id="SEARCH_PURCHASE_ID"
              value={header.search_purchase_id}
              onChange={(v) => setHeader({ ...header, search_purchase_id: v })}
              options={purchases}
              labelKey="purchase_id"
              subKey="cs_name"
              onSelect={loadRecord}
            />
          </div>
          <div className="col-md-2">
            <button id="PU_ID_SEARCH" className="erp-btn w-100" onClick={() => {
              const found = purchases.find(p => p.purchase_id === header.search_purchase_id) || purchases[0];
              if (found) loadRecord(found);
            }}>Search</button>
          </div>
        </div>

        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Supplier Group</label></div>
          <div className="col-md-3">
            <AutocompleteInput
              id="CS_GROUP"
              value={header.cs_group}
              onChange={(v) => setHeader({ ...header, cs_group: v })}
              options={master.traderGroups}
              labelKey="group_name"
            />
          </div>
          <div className="col-md-1"><label className="erp-label">Supplier Name</label></div>
          <div className="col-md-5">
            <AutocompleteInput
              id="CS_NAME"
              value={header.cs_name}
              onChange={(v) => setHeader({ ...header, cs_name: v })}
              options={master.traders}
              labelKey="cs_name"
              subKey="group_name"
              onSelect={(t) => setHeader({ ...header, cs_name: t.cs_name, cs_group: t.group_name })}
            />
          </div>
          <div className="col-md-1"><button id="ADD_CS" className="erp-btn w-100" onClick={() => navigate('/GI/CUSTOMERINFORMATION.aspx')}>Add</button></div>
          <div className="col-md-1"><button id="LEDGER" className="erp-btn w-100" onClick={() => navigate('/GI/CS_REPORTS.aspx')}>Ledger.</button></div>
        </div>

        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Product Group</label></div>
          <div className="col-md-3">
            <AutocompleteInput
              id="PRODUCT_GROUP"
              value={line.product_group}
              onChange={(v) => setLine({ ...line, product_group: v })}
              options={master.productGroups}
              labelKey="group_name"
            />
          </div>
          <div className="col-md-1"><label className="erp-label">Item/Model No.</label></div>
          <div className="col-md-5">
            <AutocompleteInput
              id="PRODUCT_NAME"
              value={line.product_name}
              onChange={(v) => setLine({ ...line, product_name: v })}
              options={master.products}
              labelKey="product_name"
              subKey="stock_qty"
              onSelect={(p) => setLine({
                ...line,
                product_id: p.product_id,
                product_group: p.group_name,
                product_name: p.product_name,
                product_description: p.description || p.product_name,
                warranty: p.warranty || '12 Months',
                unit_price: String(p.purchase_price || 0),
                stock_qty: p.stock_qty || 0
              })}
            />
          </div>
          <div className="col-md-1"><button id="MainContent_ADD_PRODUCT" className="erp-btn w-100" onClick={() => navigate('/GI/PRODUCTINFORMATION.aspx')}>Add</button></div>
          <div className="col-md-1"><button id="PRODUCT_LEDGER" className="erp-btn w-100" onClick={() => navigate('/GI/STOCK_REPORTS.aspx')}>Item Ledger.</button></div>
        </div>

        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Description</label></div>
          <div className="col-md-3">
            <textarea id="MainContent_Product_Description" className="erp-textarea" rows={1} value={line.product_description} readOnly />
          </div>
          <div className="col-md-1"><label className="erp-label">Expiry Date</label></div>
          <div className="col-md-2"><input id="MainContent_EXPIRY_DATE" className="erp-input" placeholder="DD/MM/YYYY" value={line.expiry_date} onChange={(e) => setLine({ ...line, expiry_date: e.target.value })} /></div>
          <div className="col-md-5 d-flex flex-wrap gap-2 align-items-center">
            <label className="erp-label d-flex align-items-center gap-1">
              <input id="RadioButtonList2_0" type="radio" name="pSer" checked={line.serial_mode === 'single'} onChange={() => setLine({ ...line, serial_mode: 'single' })} />
              Single Serial
            </label>
            <label className="erp-label d-flex align-items-center gap-1">
              <input id="RadioButtonList2_1" type="radio" name="pSer" checked={line.serial_mode === 'seq'} onChange={() => setLine({ ...line, serial_mode: 'seq' })} />
              Secquance Available
            </label>
            <label className="erp-label d-flex align-items-center gap-1">
              <input id="RadioButtonList2_2" type="radio" name="pSer" checked={line.serial_mode === 'auto'} onChange={() => setLine({ ...line, serial_mode: 'auto' })} />
              Auto Generated Serial
            </label>
          </div>
        </div>

        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Serial Common</label></div>
          <div className="col-md-2"><input id="SERIAL_COMMON" className="erp-input" value={line.serial_common} onChange={(e) => setLine({ ...line, serial_common: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Serial No/From</label></div>
          <div className="col-md-2"><input id="SERIAL_FROM" className="erp-input" value={line.serial_from} onChange={(e) => setLine({ ...line, serial_from: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Serial To</label></div>
          <div className="col-md-2"><input id="SERIAL_TO" className="erp-input" value={line.serial_to} onChange={(e) => setLine({ ...line, serial_to: e.target.value })} /></div>
          <div className="col-md-3 d-flex gap-2 align-items-center">
            <label className="erp-label d-flex align-items-center gap-1">
              <input id="SERIAL_CLEAR" type="checkbox" checked={line.serial_clear} onChange={(e) => setLine({ ...line, serial_clear: e.target.checked, serial_common: '', serial_from: '', serial_to: '' })} />
              Serial Clear.
            </label>
            <label className="erp-label d-flex align-items-center gap-1">
              <input id="CHECK_DIGIT" type="checkbox" checked={line.check_digit} onChange={(e) => setLine({ ...line, check_digit: e.target.checked })} />
              Check Digit.
            </label>
            <input id="CHECK_DIGIT_TEXTBOX" className="erp-input" style={{ width: '55px' }} value={line.check_digit_val} onChange={(e) => setLine({ ...line, check_digit_val: e.target.value })} />
          </div>
        </div>

        <div className="row g-1 align-items-center mb-2">
          <div className="col-md-1"><label className="erp-label">Store Name</label></div>
          <div className="col-md-2">
            <select id="DropDownStore" className="erp-select" value={header.store_name} onChange={(e) => setHeader({ ...header, store_name: e.target.value })}>
              <option value=""></option>
              <option value="SHOW ROOM">SHOW ROOM</option>
              <option value="MAIN GODOWN">MAIN GODOWN</option>
            </select>
          </div>
          <div className="col-md-1"><label className="erp-label">Warranty</label></div>
          <div className="col-md-2"><input id="WARRANTY" className="erp-input" value={line.warranty} onChange={(e) => setLine({ ...line, warranty: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Product Qty</label></div>
          <div className="col-md-2"><input id="PRODUCT_QTY" className="erp-input text-center" value={line.qty} onChange={(e) => setLine({ ...line, qty: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Unit Price</label></div>
          <div className="col-md-2"><input id="TUNIT_PRICE" className="erp-input text-center" value={line.unit_price} onChange={(e) => setLine({ ...form => form, ...line, unit_price: e.target.value })} /></div>
        </div>

        {/* Toolbar */}
        <div className="d-flex flex-wrap gap-1 align-items-center mb-1">
          <button id="SAVE_BUTTON" className="erp-btn" onClick={handleAddOrSave}>Save</button>
          <button id="EDIT" className="erp-btn" onClick={handleAddOrSave}>Edit</button>
          <button id="PRICE_EDIT" className="erp-btn" onClick={handleAddOrSave}>Edit Price</button>
          <button id="EDIT_QTY" className="erp-btn" onClick={handleAddOrSave}>Edit Qty.</button>
          <button id="SERIAL_EDIT" className="erp-btn" onClick={handleAddOrSave}>Edit Serial</button>
          <button id="AL_ADJUST" className="erp-btn" onClick={() => notify('All Serials Adjusted')}>All Serial.Adj.</button>
          <button id="SERIAL_UPLOAD" className="erp-btn" onClick={() => notify('Serial Upload ready')}>Serial Upload</button>
          <button id="PRINT" className="erp-btn" onClick={handlePrint}>Print</button>
          <button id="MainContent_Button1" className="erp-btn" onClick={handlePrint}>Print Preview</button>
          <button id="BTNNARATION" className="erp-btn" onClick={() => {
            const n = window.prompt('Input Narration / Remarks:', header.narration);
            if (n !== null) setHeader({ ...header, narration: n });
          }}>Narration</button>
          <button id="VATB" className="erp-btn" onClick={() => {
            const v = window.prompt('Input VAT Amount:', header.vat_amount);
            if (v !== null) setHeader({ ...header, vat_amount: v });
          }}>VAT</button>
          <button id="QRCODEPRINT" className="erp-btn" onClick={() => openPrint({
            title: `QR Code Label — ${header.purchase_id || 'PUR001260000001'}`,
            customContent: (
              <div className="text-center p-3">
                <div className="d-inline-block border p-3" style={{ fontFamily: 'monospace' }}>
                  <div className="fw-bold">HAZI TRADERS QR TAG</div>
                  <div className="my-2" style={{ fontSize: '28px', letterSpacing: '4px' }}>[▣ ▤ ▥ ▦ ▣]</div>
                  <div>ID: {header.purchase_id || 'PUR001260000001'} | Supplier: {header.cs_name || 'N/A'}</div>
                </div>
              </div>
            )
          })}>QR Code</button>
          <button id="CLEAR" className="erp-btn" onClick={() => {
            setHeader({ ref_no: '', purchase_date: getTodayStr(), search_purchase_id: '', purchase_id: '', cs_group: '', cs_name: '', store_name: 'SHOW ROOM', narration: '', commenc_date: '', discount_amount: '0', vat_amount: '0', payment_amount: '0' });
            setItems([]);
          }}>Clear/New</button>
          <button id="EDIT_PAGE" className="erp-btn" onClick={() => { if (purchases[0]) loadRecord(purchases[0]); }}>Edit&gt;&gt;</button>
          <button id="EXIT" className="erp-btn" onClick={() => navigate('/GI/TREE.aspx')}>Exit</button>
          <button id="MainContent_PreviousImage" className="erp-nav-circle-btn" onClick={() => {
            const next = Math.min(purchases.length - 1, navIdx + 1);
            setNavIdx(next);
            loadRecord(purchases[next]);
          }}>&lt;</button>
          <button id="MainContent_PauseImage" className="erp-nav-circle-btn" onClick={() => loadRecord(purchases[0])}>||</button>
          <button id="MainContent_NextImage" className="erp-nav-circle-btn" onClick={() => {
            const prev = Math.max(0, navIdx - 1);
            setNavIdx(prev);
            loadRecord(purchases[prev]);
          }}>&gt;</button>
        </div>

        {/* GridView1 */}
        <div className="erp-grid-box mb-2">
          <table id="GridView1" className="erp-table">
            <thead>
              <tr>
                <th>SL</th>
                <th>Purchase ID</th>
                <th>Product ID</th>
                <th>Product Description</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total Price</th>
                <th>Select</th>
                <th>Edit</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{header.purchase_id || 'NEW'}</td>
                  <td>{it.product_id}</td>
                  <td>{it.product_description || it.product_name} {it.serial_no ? `(SL: ${it.serial_no})` : ''}</td>
                  <td>{it.qty}</td>
                  <td>{Number(it.unit_price || 0).toFixed(2)}</td>
                  <td>{Number(it.total_price || 0).toFixed(2)}</td>
                  <td><button className="erp-btn" onClick={() => setLine({ ...line, ...it })}>Select</button></td>
                  <td><button className="erp-btn" onClick={() => {
                    setLine({ ...line, ...it });
                    setItems(items.filter((_, i) => i !== idx));
                  }}>Edit</button></td>
                  <td><button className="erp-btn" onClick={() => setItems(items.filter((_, i) => i !== idx))}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer 3-Column Summary */}
        <div className="row g-2">
          <div className="col-md-3">
            <div className="erp-footer-panel">
              <div>Stock Qty.: {line.stock_qty}</div>
              <div>Ledger Amount: {selectedTrader ? Number(selectedTrader.current_balance || 0).toFixed(2) : '0.00'}</div>
              <div>Last Purch. Price: {line.unit_price}</div>
              <div>Last Purch. Serial: {line.serial_from || 'N/A'}</div>
              <div>Total Purch. Qty.: {totalQty}</div>
              <input id="PURCHASE_ID" className="erp-input mt-1" value={header.purchase_id} readOnly placeholder="Purchase ID" />
            </div>
          </div>
          <div className="col-md-5">
            <div className="erp-footer-panel">
              <div className="row g-1 align-items-center mb-1">
                <div className="col-4"><label className="erp-label">Commenc. Date</label></div>
                <div className="col-5"><input id="TPAYMENT_DATE" className="erp-input" placeholder="Date/Month/Year" value={header.commenc_date} onChange={(e) => setHeader({ ...header, commenc_date: e.target.value })} /></div>
                <div className="col-3"><button id="PAYMENT_DATE" className="erp-btn w-100" onClick={() => notify('Commencement Date set')}>Comm. Date</button></div>
              </div>
              <div className="row g-1 align-items-center mb-1">
                <div className="col-4"><label className="erp-label">Discount Amt.</label></div>
                <div className="col-5"><input id="PAY_DIS_AMT" className="erp-input" placeholder="Discount Amt." value={header.discount_amount} onChange={(e) => setHeader({ ...header, discount_amount: e.target.value })} /></div>
                <div className="col-3"><button id="PAYMENT_DISCOUNT" className="erp-btn w-100" onClick={() => notify('Discount Applied')}>Discount</button></div>
              </div>
              <div className="row g-1 align-items-center">
                <div className="col-4"><label className="erp-label">Payment Amt.</label></div>
                <div className="col-5"><input id="PAY_AMT" className="erp-input" placeholder="Payment Amt." value={header.payment_amount} onChange={(e) => setHeader({ ...header, payment_amount: e.target.value })} /></div>
                <div className="col-3"><button id="CASHPAYMENT" className="erp-btn w-100" onClick={() => notify('Payment Amount Applied')}>Payment</button></div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="erp-footer-panel text-end">
              <div>Total Amount: {totalAmount.toFixed(2)}</div>
              <div>Add VAT: {Number(header.vat_amount || 0).toFixed(2)}</div>
              <div>Discount Amount: {Number(header.discount_amount || 0).toFixed(2)}</div>
              <div>Net Payable Amt.: {netPayable.toFixed(2)}</div>
              <div>Payment Amtount: {Number(header.payment_amount || 0).toFixed(2)}</div>
            </div>
          </div>
        </div>
      </fieldset>
    </div>
  );
}

// 19. PURCHASE_RETURN.aspx — Purchase Return
export function PurchaseReturnPage() {
  const { master, refreshMaster, notify, openPrint } = useErp();
  const navigate = useNavigate();
  const [returnsList, setReturnsList] = useState([]);
  const [header, setHeader] = useState({
    ref_no: '', return_date: getTodayStr(), search_return_id: '', return_id: '',
    cs_group: '', cs_name: '', purchase_id: '', purchase_amount: '0',
    store_name: 'SHOW ROOM', narration: '', vat_amount: '0'
  });
  const [line, setLine] = useState({
    product_id: '', product_group: '', product_name: '', product_description: '',
    serial_common: '', serial_from: '', serial_to: '', warranty: '',
    qty: '1', unit_price: '0', purchase_price: '0', purchase_qty: '0', stock_qty: 0
  });
  const [items, setItems] = useState([]);

  useEffect(() => {
    document.title = 'Purchase Return';
    fetch('/api/trading/purchase-returns').then(r => r.json()).then(d => setReturnsList(d.list || []));
  }, []);

  const totalAmount = items.reduce((s, it) => s + Number(it.total_price || 0), 0);
  const totalQty = items.reduce((s, it) => s + Number(it.qty || 0), 0);
  const netAmount = totalAmount + Number(header.vat_amount || 0);

  const handleSave = async () => {
    let nextItems = [...items];
    if (line.product_name.trim()) {
      const qty = Number(line.qty || 1);
      const up = Number(line.unit_price || 0);
      nextItems.push({
        product_id: line.product_id || 'PRD00001',
        product_group: line.product_group,
        product_name: line.product_name,
        product_description: line.product_description || line.product_name,
        warranty: line.warranty,
        serial_no: line.serial_from || line.serial_common,
        qty,
        unit_price: up,
        total_price: qty * up
      });
      setItems(nextItems);
      setLine({ ...line, product_name: '', product_description: '', qty: '1', unit_price: '0' });
    }
    if (!header.cs_name.trim() || nextItems.length === 0) return notify('Select Supplier and add return item', 'error');
    const res = await fetch('/api/trading/purchase-returns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...header, items: nextItems })
    });
    const data = await res.json();
    if (data.ok) {
      setHeader(h => ({ ...h, return_id: data.id }));
      notify(data.message);
      await refreshMaster();
    }
  };

  return (
    <div className="erp-container">
      <fieldset className="erp-fieldset">
        <legend className="erp-legend">Purchase Return</legend>
        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Ref No.</label></div>
          <div className="col-md-2"><input id="MainContent_REF_NO" className="erp-input" value={header.ref_no} onChange={(e) => setHeader({ ...header, ref_no: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Return Date</label></div>
          <div className="col-md-2"><input id="PURCHASE_RETURN_DATE" className="erp-input" value={header.return_date} onChange={(e) => setHeader({ ...header, return_date: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Purch. Return ID</label></div>
          <div className="col-md-3">
            <AutocompleteInput
              id="SEARCH_PURCHASE_RETURN_ID"
              value={header.search_return_id}
              onChange={(v) => setHeader({ ...header, search_return_id: v })}
              options={returnsList}
              labelKey="return_id"
              subKey="cs_name"
              onSelect={(r) => { setHeader({ ...header, ...r, search_return_id: r.return_id }); setItems(r.items || []); }}
            />
          </div>
          <div className="col-md-2"><button id="PU_ID_SEARCH" className="erp-btn w-100" onClick={() => { if (returnsList[0]) { setHeader({ ...header, ...returnsList[0] }); setItems(returnsList[0].items || []); } }}>Search</button></div>
        </div>

        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Supplier Group</label></div>
          <div className="col-md-3"><AutocompleteInput id="CS_GROUP" value={header.cs_group} onChange={(v) => setHeader({ ...header, cs_group: v })} options={master.traderGroups} labelKey="group_name" /></div>
          <div className="col-md-1"><label className="erp-label">Supplier Name</label></div>
          <div className="col-md-3"><AutocompleteInput id="CS_NAME" value={header.cs_name} onChange={(v) => setHeader({ ...header, cs_name: v })} options={master.traders} labelKey="cs_name" onSelect={(t) => setHeader({ ...header, cs_name: t.cs_name, cs_group: t.group_name })} /></div>
          <div className="col-md-1"><label className="erp-label">Purchase ID</label></div>
          <div className="col-md-2"><input id="PURCHASE_ID" className="erp-input" value={header.purchase_id} onChange={(e) => setHeader({ ...header, purchase_id: e.target.value })} /></div>
          <div className="col-md-1"><input id="Inv_amt" className="erp-input" value={header.purchase_amount} readOnly disabled placeholder="Purch. Amt" /></div>
        </div>

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
              onSelect={(p) => setLine({ ...line, product_id: p.product_id, product_group: p.group_name, product_name: p.product_name, product_description: p.description, warranty: p.warranty, unit_price: String(p.purchase_price), purchase_price: String(p.purchase_price), stock_qty: p.stock_qty })}
            />
          </div>
          <div className="col-md-1"><label className="erp-label">Description</label></div>
          <div className="col-md-2"><input id="MainContent_Product_Description" className="erp-input" value={line.product_description} readOnly disabled /></div>
        </div>

        <div className="row g-1 align-items-center mb-2">
          <div className="col-md-1"><label className="erp-label">Dalivery From</label></div>
          <div className="col-md-2">
            <select id="MainContent_DropDownStore" className="erp-select" value={header.store_name} onChange={(e) => setHeader({ ...header, store_name: e.target.value })}>
              <option value=""></option>
              <option value="SHOW ROOM">SHOW ROOM</option>
            </select>
          </div>
          <div className="col-md-1"><label className="erp-label">Serial No/From</label></div>
          <div className="col-md-2"><input id="SERIAL_FROM" className="erp-input" value={line.serial_from} onChange={(e) => setLine({ ...line, serial_from: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Warranty</label></div>
          <div className="col-md-1"><input id="WARRANTY" className="erp-input" value={line.warranty} onChange={(e) => setLine({ ...line, warranty: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Product Qty</label></div>
          <div className="col-md-1"><input id="PRODUCT_QTY" className="erp-input" value={line.qty} onChange={(e) => setLine({ ...line, qty: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Unit Price</label></div>
          <div className="col-md-1"><input id="UNIT_PRICE" className="erp-input" value={line.unit_price} onChange={(e) => setLine({ ...line, unit_price: e.target.value })} /></div>
        </div>

        <div className="d-flex flex-wrap gap-1 mb-2">
          <button id="SAVE_BUTTON" className="erp-btn" onClick={handleSave}>Save</button>
          <button id="EDIT" className="erp-btn" onClick={handleSave}>Edit</button>
          <button id="ADD_VAT" className="erp-btn" onClick={() => {
            const v = window.prompt('Add VAT Amount:', header.vat_amount);
            if (v !== null) setHeader({ ...header, vat_amount: v });
          }}>Add VAT</button>
          <button id="MainContent_Button1" className="erp-btn" onClick={() => openPrint({
            title: 'Purchase Return Voucher',
            columns: ['Purchase Return ID', 'Product ID', 'Product Description', 'Qty', 'Unit Price', 'Total Price'],
            rows: items.map(it => [header.return_id || 'NEW', it.product_id, it.product_description || it.product_name, it.qty, it.unit_price, it.total_price])
          })}>Print Preview</button>
          <button id="MainContent_PRINTB" className="erp-btn" onClick={() => window.print()}>Print</button>
          <button id="MainContent_CHALLAN_PRINT" className="erp-btn" onClick={() => openPrint({
            title: 'Purchase Return Delivery Challan',
            columns: ['SL', 'Product ID', 'Product Description', 'Serial', 'Return Qty'],
            rows: items.map((it, i) => [i + 1, it.product_id, it.product_description || it.product_name, it.serial_no || '', it.qty])
          })}>Challan</button>
          <button id="INVOICEIDLIST" className="erp-btn" onClick={() => openPrint({
            title: 'Purchase Return List',
            columns: ['Return ID', 'Date', 'Supplier Name', 'Total Amount', 'Net Amount'],
            rows: returnsList.map(r => [r.return_id, r.return_date, r.cs_name, r.total_amount, r.net_amount])
          })}>Return List</button>
          <button id="BTNNARATION" className="erp-btn" onClick={() => {
            const n = window.prompt('Narration:', header.narration);
            if (n !== null) setHeader({ ...header, narration: n });
          }}>Narration</button>
          <button id="Clear" className="erp-btn" onClick={() => setItems([])}>Clear/New</button>
          <button id="Exit" className="erp-btn" onClick={() => navigate('/GI/TREE.aspx')}>Exit</button>
        </div>

        <div className="erp-grid-box mb-2">
          <table id="GridView1" className="erp-table">
            <thead>
              <tr>
                <th>Purchase Return ID</th><th>Product ID</th><th>Product Description</th><th>Qty</th><th>Unit Price</th><th>Total Price</th><th>Serial</th><th>Edit</th><th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i}>
                  <td>{header.return_id || 'NEW'}</td><td>{it.product_id}</td><td>{it.product_description || it.product_name}</td><td>{it.qty}</td><td>{it.unit_price}</td><td>{it.total_price}</td><td>{it.serial_no}</td>
                  <td><button className="erp-btn" onClick={() => { setLine({ ...line, ...it }); setItems(items.filter((_, idx) => idx !== i)); }}>Edit</button></td>
                  <td><button className="erp-btn" onClick={() => setItems(items.filter((_, idx) => idx !== i))}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="row g-2">
          <div className="col-md-6"><div className="erp-footer-panel"><div>Stock Qty: {line.stock_qty}</div><div>Purchase Qty.: {line.purchase_qty}</div><div>Total Return Qty.: {totalQty}</div></div></div>
          <div className="col-md-6"><div className="erp-footer-panel text-end"><div>Total Amount: {totalAmount.toFixed(2)}</div><div>Add VAT: {Number(header.vat_amount || 0).toFixed(2)}</div><div>Net Amount: {netAmount.toFixed(2)}</div></div></div>
        </div>
      </fieldset>
    </div>
  );
}

// 20. PRICEQUOTATION.aspx — Price Quotation
export function PriceQuotationPage() {
  const { master, notify, openPrint } = useErp();
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [showCost, setShowCost] = useState(false);
  const [header, setHeader] = useState({
    ref_no: '', mobile_no: '', quotation_date: getTodayStr(), quotation_id: '',
    subject: '', cash_customer: '', narration: '', conditions: '1. Validity 15 Days. 2. Delivery within 3 Days.',
    cs_group: '', customer_name: '', store_name: 'SHOW ROOM',
    service_charge: '0', others_charge: '0', tax_amount: '0', vat_amount: '0', discount_amount: '0'
  });
  const [line, setLine] = useState({
    product_id: '', product_group: '', product_name: '', product_description: '',
    item_remarks: '', warranty: '', qty: '1', unit_price: '0', vat_percent: '0', stock_qty: 0, cost_price: 0
  });
  const [items, setItems] = useState([]);

  useEffect(() => {
    document.title = 'Price Quotation';
    fetch('/api/trading/quotations').then(r => r.json()).then(d => {
      setQuotations(d.list || []);
      if (d.list?.[0]) {
        setHeader(h => ({ ...h, ...d.list[0] }));
        setItems(d.list[0].items || []);
      }
    });
  }, []);

  const totalAmount = items.reduce((s, it) => s + Number(it.total_price || 0), 0);
  const totalQty = items.reduce((s, it) => s + Number(it.qty || 0), 0);
  const netPayable = totalAmount + Number(header.service_charge || 0) + Number(header.others_charge || 0) + Number(header.tax_amount || 0) + Number(header.vat_amount || 0) - Number(header.discount_amount || 0);

  const handleSave = async () => {
    let nextItems = [...items];
    if (line.product_name.trim()) {
      const qty = Number(line.qty || 1);
      const up = Number(line.unit_price || 0);
      const vp = Number(line.vat_percent || 0);
      nextItems.push({
        product_id: line.product_id || 'PRD00001',
        product_group: line.product_group,
        product_name: line.product_name,
        product_description: line.product_description || line.product_name,
        item_remarks: line.item_remarks,
        warranty: line.warranty,
        qty,
        unit_price: up,
        vat_percent: vp,
        total_price: qty * up * (1 + vp / 100)
      });
      setItems(nextItems);
      setLine({ ...line, product_name: '', product_description: '', item_remarks: '', qty: '1', unit_price: '0', vat_percent: '0' });
    }
    const res = await fetch('/api/trading/quotations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...header, items: nextItems })
    });
    const data = await res.json();
    if (data.ok) {
      setHeader(h => ({ ...h, quotation_id: data.id }));
      notify(data.message);
    }
  };

  const handlePrintMode = (mode) => {
    openPrint({
      title: `PRICE QUOTATION — ${header.quotation_id || 'QTN001260000001'}`,
      subtitle: header.subject ? `Subject: ${header.subject}` : '',
      mode,
      meta: {
        'Quotation ID': header.quotation_id,
        'Date': header.quotation_date,
        'Customer Name': header.customer_name || header.cash_customer,
        'Mobile': header.mobile_no,
        'Terms & Conditions': header.conditions
      },
      columns: ['SL No.', 'Product ID', 'Product Description', 'Warranty', 'Qty', 'Unit Price', 'VAT(%)', 'Total Price'],
      rows: items.map((it, i) => [i + 1, it.product_id, it.product_description || it.product_name, it.warranty, it.qty, Number(it.unit_price || 0).toFixed(2), it.vat_percent || 0, Number(it.total_price || 0).toFixed(2)]),
      summary: {
        'Total Amount': totalAmount.toFixed(2),
        'Service Charge': Number(header.service_charge || 0).toFixed(2),
        'Discount Amount': Number(header.discount_amount || 0).toFixed(2),
        'Net Payable Amt.': netPayable.toFixed(2)
      }
    });
  };

  return (
    <div className="erp-container">
      <fieldset className="erp-fieldset">
        <legend className="erp-legend">Price Quotation</legend>
        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Ref No.</label></div>
          <div className="col-md-2"><input id="REF_NO" className="erp-input" value={header.ref_no} onChange={(e) => setHeader({ ...header, ref_no: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Mobile</label></div>
          <div className="col-md-2"><input id="MOBILE_NO" className="erp-input" value={header.mobile_no} onChange={(e) => setHeader({ ...header, mobile_no: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Quotation Date</label></div>
          <div className="col-md-2"><input id="QUOTATION_DATE" className="erp-input" value={header.quotation_date} onChange={(e) => setHeader({ ...header, quotation_date: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Quotation ID</label></div>
          <div className="col-md-1">
            <AutocompleteInput
              id="SEARCH_ORDER_ID"
              value={header.quotation_id}
              onChange={(v) => setHeader({ ...header, quotation_id: v })}
              options={quotations}
              labelKey="quotation_id"
              onSelect={(q) => { setHeader({ ...header, ...q }); setItems(q.items || []); }}
            />
          </div>
          <div className="col-md-1"><button id="PU_ID_SEARCH" className="erp-btn w-100" onClick={() => { if (quotations[0]) { setHeader({ ...header, ...quotations[0] }); setItems(quotations[0].items || []); } }}>Search</button></div>
        </div>

        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Subject</label></div>
          <div className="col-md-3"><input id="SUBJECTT" className="erp-input" value={header.subject} onChange={(e) => setHeader({ ...header, subject: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Cash Customer</label></div>
          <div className="col-md-3"><input id="CASH_SUPPLIER_NAEM" className="erp-input" value={header.cash_customer} onChange={(e) => setHeader({ ...header, cash_customer: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Narration</label></div>
          <div className="col-md-3"><input id="NARRATION" className="erp-input" value={header.narration} onChange={(e) => setHeader({ ...header, narration: e.target.value })} /></div>
        </div>

        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Customer Group</label></div>
          <div className="col-md-3"><AutocompleteInput id="CS_GROUP_NAME" value={header.cs_group} onChange={(v) => setHeader({ ...header, cs_group: v })} options={master.traderGroups} labelKey="group_name" /></div>
          <div className="col-md-1"><label className="erp-label">Customer Name</label></div>
          <div className="col-md-3"><AutocompleteInput id="CUSTOMER_NAME" value={header.customer_name} onChange={(v) => setHeader({ ...header, customer_name: v })} options={master.traders} labelKey="cs_name" onSelect={(t) => setHeader({ ...header, customer_name: t.cs_name, cs_group: t.group_name, mobile_no: t.mobile })} /></div>
          <div className="col-md-1"><label className="erp-label">Product Group</label></div>
          <div className="col-md-3"><AutocompleteInput id="PRODUCT_GROUP_NAME" value={line.product_group} onChange={(v) => setLine({ ...line, product_group: v })} options={master.productGroups} labelKey="group_name" /></div>
        </div>

        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Item/Model No.</label></div>
          <div className="col-md-3">
            <AutocompleteInput
              id="PRODUCT_NAME"
              value={line.product_name}
              onChange={(v) => setLine({ ...line, product_name: v })}
              options={master.products}
              labelKey="product_name"
              onSelect={(p) => setLine({ ...line, product_id: p.product_id, product_group: p.group_name, product_name: p.product_name, product_description: p.description, warranty: p.warranty, unit_price: String(p.sales_price), stock_qty: p.stock_qty, cost_price: p.purchase_price })}
            />
          </div>
          <div className="col-md-1"><label className="erp-label">Description</label></div>
          <div className="col-md-3"><input id="Product_Description" className="erp-input" value={line.product_description} readOnly disabled /></div>
          <div className="col-md-1"><label className="erp-label">Item Remarks</label></div>
          <div className="col-md-3"><input id="EXTRA_DESCRIPTION" className="erp-input" value={line.item_remarks} onChange={(e) => setLine({ ...line, item_remarks: e.target.value })} /></div>
        </div>

        <div className="row g-1 align-items-center mb-2">
          <div className="col-md-1"><label className="erp-label">Delivery From</label></div>
          <div className="col-md-2">
            <select id="DropDownStore" className="erp-select" value={header.store_name} onChange={(e) => setHeader({ ...header, store_name: e.target.value })}>
              <option value=""></option>
              <option value="SHOW ROOM">SHOW ROOM</option>
            </select>
          </div>
          <div className="col-md-1"><label className="erp-label">Warranty</label></div>
          <div className="col-md-2"><input id="WARRANTY" className="erp-input" value={line.warranty} onChange={(e) => setLine({ ...line, warranty: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Product Qty</label></div>
          <div className="col-md-1"><input id="PRODUCT_QTY" className="erp-input" value={line.qty} onChange={(e) => setLine({ ...line, qty: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Unit Price</label></div>
          <div className="col-md-1"><input id="UNIT_PRICE" className="erp-input" value={line.unit_price} onChange={(e) => setLine({ ...line, unit_price: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">VAT(%)</label></div>
          <div className="col-md-1"><input id="VATT" className="erp-input" value={line.vat_percent} onChange={(e) => setLine({ ...line, vat_percent: e.target.value })} /></div>
        </div>

        <div className="d-flex flex-wrap gap-1 mb-2">
          <button id="SAVE_BUTTON" className="erp-btn" onClick={handleSave}>Save</button>
          <button id="EDIT_BUTTON" className="erp-btn" onClick={handleSave}>Edit</button>
          <button id="EDIT_PRICE" className="erp-btn" onClick={handleSave}>Edit Price</button>
          <button id="SHOWCOST" className="erp-btn" onClick={() => { setShowCost(!showCost); notify(`Unit Cost: ${line.cost_price} BDT`); }}>Show Cost</button>
          <button id="MainContent_PRINT" className="erp-btn" onClick={() => handlePrintMode('invoice')}>Print</button>
          <button id="MainContent_PRINT1" className="erp-btn" onClick={() => handlePrintMode('invoice')}>Print1</button>
          <button id="MainContent_PADPRINT" className="erp-btn" onClick={() => handlePrintMode('pad')}>Pad Print</button>
          <button id="MainContent_PRINTVIEW" className="erp-btn" onClick={() => handlePrintMode('invoice')}>Convert Word</button>
          <button id="MainContent_EXCELPRINT" className="erp-btn" onClick={() => handlePrintMode('invoice')}>Convert Excel</button>
          <button id="MainContent_CONDITION" className="erp-btn" onClick={() => {
            const c = window.prompt('Terms & Conditions:', header.conditions);
            if (c !== null) setHeader({ ...header, conditions: c });
          }}>Condition</button>
          <button id="VAT_POPUP" className="erp-btn" onClick={() => {
            const sc = window.prompt('Service Charge:', header.service_charge);
            const dc = window.prompt('Discount Amount:', header.discount_amount);
            if (sc !== null) setHeader(h => ({ ...h, service_charge: sc, discount_amount: dc ?? h.discount_amount }));
          }}>VAT &amp; Others</button>
          <button id="Clear" className="erp-btn" onClick={() => setItems([])}>Clear/New</button>
          <button id="MainContent_EXIT" className="erp-btn" onClick={() => navigate('/GI/TREE.aspx')}>Exit</button>
        </div>

        <div className="erp-grid-box mb-2">
          <table id="GridView1" className="erp-table">
            <thead>
              <tr>
                <th>SL No.</th><th>Quotation ID</th><th>Product ID</th><th>Product Description</th><th>Warranty</th><th>Qty</th><th>Unit Price</th><th>VAT(%)</th><th>Total Price</th><th>Select</th><th>Edit</th><th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i}>
                  <td>{i + 1}</td><td>{header.quotation_id || 'NEW'}</td><td>{it.product_id}</td><td>{it.product_description || it.product_name}</td><td>{it.warranty}</td><td>{it.qty}</td><td>{Number(it.unit_price || 0).toFixed(2)}</td><td>{it.vat_percent || 0}</td><td>{Number(it.total_price || 0).toFixed(2)}</td>
                  <td><button className="erp-btn" onClick={() => setLine({ ...line, ...it })}>Select</button></td>
                  <td><button className="erp-btn" onClick={() => { setLine({ ...line, ...it }); setItems(items.filter((_, idx) => idx !== i)); }}>Edit</button></td>
                  <td><button className="erp-btn" onClick={() => setItems(items.filter((_, idx) => idx !== i))}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="row g-2">
          <div className="col-md-6"><div className="erp-footer-panel"><div>Stock Qty.: {line.stock_qty}</div><div>Total Qua. Qty.: {totalQty}</div>{showCost && <div className="text-danger">Unit Cost Price: {line.cost_price} BDT</div>}</div></div>
          <div className="col-md-6"><div className="erp-footer-panel text-end"><div>Total Amount: {totalAmount.toFixed(2)}</div><div>Service Charge: {Number(header.service_charge || 0).toFixed(2)}</div><div>Others Charge: {Number(header.others_charge || 0).toFixed(2)}</div><div>Add TAX: {Number(header.tax_amount || 0).toFixed(2)}</div><div>Add VAT: {Number(header.vat_amount || 0).toFixed(2)}</div><div>Discount Amount: {Number(header.discount_amount || 0).toFixed(2)}</div><div>Net Payable Amt. {netPayable.toFixed(2)}</div></div></div>
        </div>
      </fieldset>
    </div>
  );
}

// 21. SALES.aspx — Sales/Invoice (Exact pixel match to final_step_79.png)
export function SalesPage() {
  const { master, refreshMaster, notify, openPrint } = useErp();
  const navigate = useNavigate();
  const [salesList, setSalesList] = useState([]);
  const [navIdx, setNavIdx] = useState(-1);
  const [showCost, setShowCost] = useState(false);

  const [header, setHeader] = useState({
    ref_no: '',
    sales_date: getTodayStr(),
    mobile_no: '',
    search_sales_id: '',
    sales_id: '',
    cs_group: '',
    cs_name: '',
    price_tier: 'SALES_PRICE',
    advance_sales: false,
    store_name: 'SHOW ROOM',
    sales_type: 'CREDIT',
    collection_type: 'CASH',
    account_no: '',
    collection_amount: '',
    narration: '',
    service_charge: '0',
    extra_charge: '0',
    tax_amount: '0',
    vat_amount: '0',
    discount_amount: '0'
  });

  const [line, setLine] = useState({
    product_id: '',
    product_group: '',
    product_name: '',
    product_description: '',
    item_remarks: '',
    serial_mode: 'single',
    serial_clear: false,
    search_by_serial: false,
    check_digit: false,
    check_digit_val: '',
    serial_common: '',
    serial_from: '',
    serial_to: '',
    warranty: '',
    qty: '',
    unit_price: '0',
    discount: '0',
    vat_percent: '0',
    stock_qty: 0,
    cost_price: 0
  });

  const [items, setItems] = useState([]);

  const loadSales = useCallback(async () => {
    const res = await fetch('/api/trading/sales');
    if (res.ok) {
      const data = await res.json();
      setSalesList(data.list || []);
    }
  }, []);

  useEffect(() => {
    document.title = 'SALES/INVOICE';
    loadSales();
  }, [loadSales]);

  const selectedCustomer = master.traders.find(t => t.cs_name === header.cs_name);
  const totalAmount = items.reduce((s, it) => s + Number(it.total_price || 0), 0);
  const totalQty = items.reduce((s, it) => s + Number(it.qty || 0), 0);
  const netPayable = totalAmount + Number(header.service_charge || 0) + Number(header.extra_charge || 0) + Number(header.tax_amount || 0) + Number(header.vat_amount || 0) - Number(header.discount_amount || 0);

  const loadInvoice = (inv) => {
    if (!inv) return;
    setHeader({
      ref_no: inv.ref_no || '',
      sales_date: inv.sales_date || getTodayStr(),
      mobile_no: inv.mobile_no || '',
      search_sales_id: inv.sales_id,
      sales_id: inv.sales_id,
      cs_group: inv.cs_group || '',
      cs_name: inv.cs_name || '',
      price_tier: inv.price_tier || 'SALES_PRICE',
      advance_sales: Boolean(inv.advance_sales),
      store_name: inv.store_name || 'SHOW ROOM',
      sales_type: inv.sales_type || 'CREDIT',
      collection_type: inv.collection_type || 'CASH',
      account_no: inv.account_no || '',
      collection_amount: String(inv.collection_amount || ''),
      narration: inv.narration || '',
      service_charge: String(inv.service_charge || 0),
      extra_charge: String(inv.extra_charge || 0),
      tax_amount: String(inv.tax_amount || 0),
      vat_amount: String(inv.vat_amount || 0),
      discount_amount: String(inv.discount_amount || 0)
    });
    setItems(inv.items || []);
  };

  const handleSave = async () => {
    let nextItems = [...items];
    if (line.product_name.trim()) {
      const qty = Number(line.qty || 1);
      const up = Number(line.unit_price || 0);
      const disc = Number(line.discount || 0);
      const vp = Number(line.vat_percent || 0);
      nextItems.push({
        product_id: line.product_id || 'PRD00001',
        product_group: line.product_group,
        product_name: line.product_name,
        product_description: line.product_description || line.product_name,
        item_remarks: line.item_remarks,
        warranty: line.warranty,
        serial_no: line.serial_from || line.serial_common,
        qty,
        unit_price: up,
        discount: disc,
        vat_percent: vp,
        total_price: (qty * up - disc) * (1 + vp / 100)
      });
      setItems(nextItems);
      setLine({ ...line, product_id: '', product_name: '', product_description: '', item_remarks: '', serial_common: '', serial_from: '', serial_to: '', qty: '', unit_price: '0', discount: '0', vat_percent: '0' });
    }

    if (!header.cs_name.trim()) return notify('Please select Customer Name', 'error');
    if (nextItems.length === 0) return notify('Please add at least one product line item', 'error');

    const res = await fetch('/api/trading/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...header, items: nextItems })
    });
    const data = await res.json();
    if (data.ok) {
      setHeader(h => ({ ...h, sales_id: data.id, search_sales_id: data.id }));
      notify(data.message);
      await refreshMaster();
      await loadSales();
    }
  };

  const handlePrint = (type = 'invoice') => {
    openPrint({
      title: type === 'challan' ? 'DELIVERY CHALLAN' : 'SALES INVOICE / BILL',
      meta: {
        'Invoice ID': header.sales_id || master.nextIds?.sales,
        'Sales Date': header.sales_date,
        'Ref./Bill No.': header.ref_no,
        'Customer Name': header.cs_name,
        'Mobile No.': header.mobile_no,
        'Sales Type': header.sales_type
      },
      columns: type === 'challan'
        ? ['SL', 'Product ID', 'Product Description', 'Serial No.', 'Warranty', 'Qty']
        : ['SL', 'Product ID', 'Product Description', 'Warranty', 'Qty', 'Unit Price', 'Discount', 'VAT(%)', 'Total Price'],
      rows: items.map((it, i) => type === 'challan'
        ? [i + 1, it.product_id, it.product_description || it.product_name, it.serial_no || '', it.warranty, it.qty]
        : [i + 1, it.product_id, `${it.product_description || it.product_name}${it.serial_no ? ` [SL: ${it.serial_no}]` : ''}`, it.warranty, it.qty, Number(it.unit_price || 0).toFixed(2), Number(it.discount || 0).toFixed(2), it.vat_percent || 0, Number(it.total_price || 0).toFixed(2)]
      ),
      summary: type === 'challan'
        ? { 'Total Qty': totalQty }
        : {
            'Total Amount': totalAmount.toFixed(2),
            'Service Charge': Number(header.service_charge || 0).toFixed(2),
            'Extra Charge': Number(header.extra_charge || 0).toFixed(2),
            'Discount Amount': Number(header.discount_amount || 0).toFixed(2),
            'Net Payable Amt.': netPayable.toFixed(2),
            'Invoice Collection Amt.': Number(header.collection_amount || 0).toFixed(2),
            'Due Balance': (netPayable - Number(header.collection_amount || 0)).toFixed(2)
          }
    });
  };

  return (
    <div className="erp-container">
      <fieldset className="erp-fieldset">
        <legend className="erp-legend">Sales</legend>

        {/* Row 1 */}
        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Ref./Bill No.</label></div>
          <div className="col-md-2"><input id="REF_NO" className="erp-input" value={header.ref_no} onChange={(e) => setHeader({ ...header, ref_no: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Sales Date</label></div>
          <div className="col-md-1"><input id="SALES_DATE" className="erp-input text-center" value={header.sales_date} onChange={(e) => setHeader({ ...header, sales_date: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Mobile/WO No.</label></div>
          <div className="col-md-1"><input id="MOBILE_NO" className="erp-input" value={header.mobile_no} onChange={(e) => setHeader({ ...header, mobile_no: e.target.value })} /></div>
          <div className="col-md-1">
            <button id="MainContent_MOBILE_SEARCH" className="erp-btn w-100" onClick={() => {
              const found = salesList.find(s => s.mobile_no && s.mobile_no.includes(header.mobile_no));
              if (found) loadInvoice(found);
              else notify('No invoice found for this mobile number', 'error');
            }}>Seach</button>
          </div>
          <div className="col-md-1"><label className="erp-label">Sales ID</label></div>
          <div className="col-md-2">
            <AutocompleteInput
              id="SEARCH_SALES_ID"
              value={header.search_sales_id}
              onChange={(v) => setHeader({ ...header, search_sales_id: v })}
              options={salesList}
              labelKey="sales_id"
              subKey="cs_name"
              onSelect={loadInvoice}
            />
          </div>
          <div className="col-md-1">
            <button id="PU_ID_SEARCH" className="erp-btn w-100" onClick={() => {
              const found = salesList.find(s => s.sales_id === header.search_sales_id) || salesList[0];
              if (found) loadInvoice(found);
            }}>Search.</button>
          </div>
        </div>

        {/* Row 2 */}
        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Customer Group</label></div>
          <div className="col-md-4">
            <AutocompleteInput
              id="CS_GROUP"
              value={header.cs_group}
              onChange={(v) => setHeader({ ...header, cs_group: v })}
              options={master.traderGroups}
              labelKey="group_name"
            />
          </div>
          <div className="col-md-1"><label className="erp-label">Customer Name</label></div>
          <div className="col-md-4">
            <AutocompleteInput
              id="CS_NAME"
              placeholder="Search by Name or Mobile No."
              value={header.cs_name}
              onChange={(v) => setHeader({ ...header, cs_name: v })}
              options={master.traders}
              labelKey="cs_name"
              subKey="mobile"
              onSelect={(t) => setHeader({ ...header, cs_name: t.cs_name, cs_group: t.group_name, mobile_no: t.mobile || header.mobile_no })}
            />
          </div>
          <div className="col-md-1"><button id="ADD_CS" className="erp-btn w-100" onClick={() => navigate('/GI/CUSTOMERINFORMATION.aspx')}>Add</button></div>
          <div className="col-md-1"><button id="LEDGER" className="erp-btn w-100" onClick={() => navigate('/GI/CS_REPORTS.aspx')}>Ledger.</button></div>
        </div>

        {/* Row 3 */}
        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Product Group</label></div>
          <div className="col-md-4">
            <AutocompleteInput
              id="PRODUCT_GROUP"
              placeholder="Press F2 Group wise Stock"
              value={line.product_group}
              onChange={(v) => setLine({ ...line, product_group: v })}
              options={master.productGroups}
              labelKey="group_name"
            />
          </div>
          <div className="col-md-1"><label className="erp-label">Item/Model No.</label></div>
          <div className="col-md-4">
            <AutocompleteInput
              id="PRODUCT_NAME"
              value={line.product_name}
              onChange={(v) => setLine({ ...line, product_name: v })}
              options={master.products}
              labelKey="product_name"
              subKey="stock_qty"
              onSelect={(p) => {
                const tierPrice = header.price_tier === 'WHOLE_SALES_PRICE'
                  ? p.wholesale_price
                  : header.price_tier === 'DEALER_PRICE'
                  ? p.dealer_price
                  : p.sales_price;
                setLine({
                  ...line,
                  product_id: p.product_id,
                  product_group: p.group_name,
                  product_name: p.product_name,
                  product_description: p.description || p.product_name,
                  warranty: p.warranty || '12 Months',
                  unit_price: String(tierPrice || p.sales_price || 0),
                  stock_qty: p.stock_qty || 0,
                  cost_price: p.purchase_price || 0,
                  qty: '1'
                });
              }}
            />
          </div>
          <div className="col-md-1"><button id="ADD_PRODUCT" className="erp-btn w-100" onClick={() => navigate('/GI/PRODUCTINFORMATION.aspx')}>Add</button></div>
          <div className="col-md-1"><button id="PRODUCT_LEDGER" className="erp-btn w-100" onClick={() => navigate('/GI/STOCK_REPORTS.aspx')}>Item Ledger.</button></div>
        </div>

        {/* Row 4 */}
        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Description</label></div>
          <div className="col-md-4">
            <textarea id="MainContent_Product_Description" className="erp-textarea" rows={1} value={line.product_description} readOnly disabled />
          </div>
          <div className="col-md-1"><label className="erp-label">Item Remarks</label></div>
          <div className="col-md-4">
            <input id="MainContent_PRODUCT_REMARKS" className="erp-input" placeholder="Product Remarks" value={line.item_remarks} onChange={(e) => setLine({ ...line, item_remarks: e.target.value })} />
          </div>
          <div className="col-md-1">
            <select
              id="DropDownListSalesPrice"
              className="erp-select"
              value={header.price_tier}
              onChange={(e) => setHeader({ ...header, price_tier: e.target.value })}
            >
              <option value="SALES_PRICE">Sales Price</option>
              <option value="WHOLE_SALES_PRICE">Wholesale Price</option>
              <option value="DEALER_PRICE">Dealer Price</option>
            </select>
          </div>
          <div className="col-md-1">
            <label className="erp-label d-flex align-items-center gap-1">
              <input id="ADVANCESALES" type="checkbox" checked={header.advance_sales} onChange={(e) => setHeader({ ...header, advance_sales: e.target.checked })} />
              Advance Sales.
            </label>
          </div>
        </div>

        {/* Row 5: Serial Controls */}
        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-6"></div>
          <div className="col-md-6 d-flex flex-wrap gap-2 align-items-center justify-content-end">
            <label className="erp-label d-flex align-items-center gap-1">
              <input id="RadioButtonList2_0" type="radio" name="sSer" checked={line.serial_mode === 'single'} onChange={() => setLine({ ...line, serial_mode: 'single' })} />
              Single Serial
            </label>
            <label className="erp-label d-flex align-items-center gap-1">
              <input id="RadioButtonList2_1" type="radio" name="sSer" checked={line.serial_mode === 'seq'} onChange={() => setLine({ ...line, serial_mode: 'seq' })} />
              Secquance Available
            </label>
            <label className="erp-label d-flex align-items-center gap-1">
              <input id="SERIAL_CLEAR" type="checkbox" checked={line.serial_clear} onChange={(e) => setLine({ ...line, serial_clear: e.target.checked, serial_common: '', serial_from: '', serial_to: '' })} />
              Serial Clear.
            </label>
            <label className="erp-label d-flex align-items-center gap-1">
              <input id="PRODUCT_SEARCH" type="checkbox" checked={line.search_by_serial} onChange={(e) => setLine({ ...line, search_by_serial: e.target.checked })} />
              Search by Serial
            </label>
            <label className="erp-label d-flex align-items-center gap-1">
              <input id="CHECK_DIGIT" type="checkbox" checked={line.check_digit} onChange={(e) => setLine({ ...line, check_digit: e.target.checked })} />
              Check Digit.
            </label>
            <input id="CHECK_DIGIT_TEXTBOX" className="erp-input" style={{ width: '75px' }} value={line.check_digit_val} disabled={!line.check_digit} onChange={(e) => setLine({ ...line, check_digit_val: e.target.value })} />
          </div>
        </div>

        {/* Row 6: Serial Inputs */}
        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Serial Common</label></div>
          <div className="col-md-3"><input id="SERIAL_COMMON" className="erp-input" value={line.serial_common} onChange={(e) => setLine({ ...line, serial_common: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Serial No/From</label></div>
          <div className="col-md-3">
            <AutocompleteInput
              id="SERIAL_FROM"
              value={line.serial_from}
              onChange={(v) => setLine({ ...line, serial_from: v })}
              options={master.serials.filter(s => s.status === 'IN_STOCK')}
              labelKey="serial_no"
              subKey="product_name"
              onSelect={(sn) => {
                const p = master.products.find(pr => pr.product_id === sn.product_id);
                if (p) {
                  setLine({
                    ...line,
                    serial_from: sn.serial_no,
                    product_id: p.product_id,
                    product_group: p.group_name,
                    product_name: p.product_name,
                    product_description: p.description,
                    warranty: p.warranty,
                    unit_price: String(p.sales_price),
                    stock_qty: p.stock_qty,
                    qty: '1'
                  });
                }
              }}
            />
          </div>
          <div className="col-md-1"><label className="erp-label">Serial To</label></div>
          <div className="col-md-3"><input id="SERIAL_TO" className="erp-input" value={line.serial_to} onChange={(e) => setLine({ ...line, serial_to: e.target.value })} /></div>
        </div>

        {/* Row 7: Delivery From, Warranty, Quantity, Unit Price, Discount Amt, VAT(%) */}
        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Delivery From</label></div>
          <div className="col-md-1">
            <select id="DropDownStore" className="erp-select" value={header.store_name} onChange={(e) => setHeader({ ...header, store_name: e.target.value })}>
              <option value=""></option>
              <option value="SHOW ROOM">SHOW ROOM</option>
              <option value="MAIN GODOWN">MAIN GODOWN</option>
            </select>
          </div>
          <div className="col-md-1"><label className="erp-label">Warranty</label></div>
          <div className="col-md-1"><input id="WARRANTY" className="erp-input text-center" value={line.warranty} onChange={(e) => setLine({ ...line, warranty: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Quantity</label></div>
          <div className="col-md-1"><input id="PRODUCT_QTY" className="erp-input text-center" value={line.qty} onChange={(e) => setLine({ ...line, qty: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Unit Price</label></div>
          <div className="col-md-1"><input id="UNIT_PRICE" className="erp-input text-center" value={line.unit_price} onChange={(e) => setLine({ ...line, unit_price: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Discount Amt.</label></div>
          <div className="col-md-1"><input id="DISCOUNT_AMT_SINGLE" className="erp-input text-center" value={line.discount} onChange={(e) => setLine({ ...line, discount: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">VAT(%)</label></div>
          <div className="col-md-1"><input id="MainContent_VAT_PERCENT_ADD_PRODUCT" className="erp-input text-center" value={line.vat_percent} onChange={(e) => setLine({ ...line, vat_percent: e.target.value })} /></div>
        </div>

        {/* Action Toolbar */}
        <div className="d-flex flex-wrap gap-1 align-items-center mb-1">
          <button id="SAVE_BUTTON" className="erp-btn" onClick={handleSave}>Save</button>
          <button id="SAVEALL" className="erp-btn" onClick={handleSave}>Save All</button>
          <button id="EDIT" className="erp-btn" onClick={handleSave}>Edit</button>
          <button id="DELETE" className="erp-btn" onClick={handleSave}>Edit Price</button>
          <button id="MainContent_COSTBUTTON" className="erp-btn" onClick={() => { setShowCost(!showCost); notify(`Unit Cost: ${line.cost_price} BDT`); }}>Show Cost</button>
          <button id="SALES_PRICE" className="erp-btn" onClick={() => notify(`Sales Price: ${line.unit_price} BDT`)}>Sales Price</button>
          <button id="BPRINT" className="erp-btn" onClick={() => handlePrint('invoice')}>Print</button>
          <button id="MainContent_PRINTVIEW" className="erp-btn" onClick={() => handlePrint('invoice')}>Print Preview</button>
          <button id="CHALLAN_PRINT" className="erp-btn" onClick={() => handlePrint('challan')}>Challan Print</button>
          <button id="MainContent_SMS_SEND" className="erp-btn" onClick={() => notify(`SMS Sent to ${header.cs_name || 'Customer'} (${header.mobile_no || '01818524712'}): Invoice ${header.sales_id || 'NEW'} Amount ${netPayable.toFixed(2)} BDT`)}>SMS Send</button>
          <button id="BTNNARATION" className="erp-btn" onClick={() => {
            const n = window.prompt('Invoice Narration:', header.narration);
            if (n !== null) setHeader({ ...header, narration: n });
          }}>Narration</button>
          <button id="VAT_OTHERS" className="erp-btn" onClick={() => {
            const sc = window.prompt('Service Charge:', header.service_charge);
            const ec = window.prompt('Extra Charge:', header.extra_charge);
            const dc = window.prompt('Invoice Discount Amount:', header.discount_amount);
            if (sc !== null) setHeader({ ...header, service_charge: sc, extra_charge: ec ?? header.extra_charge, discount_amount: dc ?? header.discount_amount });
          }}>VAT &amp; Others</button>
          <button id="MainContent_SHOW" className="erp-btn" onClick={() => { if (salesList[0]) loadInvoice(salesList[0]); }}>Show</button>
          <button id="MainContent_EDITGO" className="erp-btn" onClick={() => navigate('/GI/DATE_WISE_BILL_SEARCH.aspx')}>Edit&gt;&gt;</button>
          <button id="Clear" className="erp-btn" onClick={() => {
            setHeader({
              ref_no: '', sales_date: getTodayStr(), mobile_no: '', search_sales_id: '', sales_id: '',
              cs_group: '', cs_name: '', price_tier: 'SALES_PRICE', advance_sales: false, store_name: 'SHOW ROOM',
              sales_type: 'CREDIT', collection_type: 'CASH', account_no: '', collection_amount: '', narration: '',
              service_charge: '0', extra_charge: '0', tax_amount: '0', vat_amount: '0', discount_amount: '0'
            });
            setItems([]);
          }}>Clear/New</button>
          <button id="MainContent_EXIT" className="erp-btn" onClick={() => navigate('/GI/TREE.aspx')}>Exit</button>
          <button id="MainContent_PreviousImage" className="erp-nav-circle-btn" onClick={() => {
            const next = Math.min(salesList.length - 1, navIdx + 1);
            setNavIdx(next);
            loadInvoice(salesList[next]);
          }}>&lt;</button>
          <button id="MainContent_PauseImage" className="erp-nav-circle-btn" onClick={() => loadInvoice(salesList[0])}>||</button>
          <button id="MainContent_NextImage" className="erp-nav-circle-btn" onClick={() => {
            const prev = Math.max(0, navIdx - 1);
            setNavIdx(prev);
            loadInvoice(salesList[prev]);
          }}>&gt;</button>
        </div>

        {/* GridView1 */}
        <div className="erp-grid-box mb-2">
          <table id="GridView1" className="erp-table">
            <thead>
              <tr>
                <th>SL</th>
                <th>Invoice ID</th>
                <th>Product ID</th>
                <th>Product Description</th>
                <th>Warranty</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Discount</th>
                <th>VAT(%)</th>
                <th>Total Price</th>
                <th>Select</th>
                <th>Edit</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{header.sales_id || 'NEW'}</td>
                  <td>{it.product_id}</td>
                  <td>{it.product_description || it.product_name} {it.serial_no ? `(SL: ${it.serial_no})` : ''}</td>
                  <td>{it.warranty}</td>
                  <td>{it.qty}</td>
                  <td>{Number(it.unit_price || 0).toFixed(2)}</td>
                  <td>{Number(it.discount || 0).toFixed(2)}</td>
                  <td>{it.vat_percent || 0}</td>
                  <td>{Number(it.total_price || 0).toFixed(2)}</td>
                  <td><button className="erp-btn" onClick={() => setLine({ ...line, ...it })}>Select</button></td>
                  <td><button className="erp-btn" onClick={() => {
                    setLine({ ...line, ...it });
                    setItems(items.filter((_, i) => i !== idx));
                  }}>Edit</button></td>
                  <td><button className="erp-btn" onClick={() => setItems(items.filter((_, i) => i !== idx))}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 4-Column Bottom Panel (Exact match to final_step_79.png) */}
        <div className="row g-2">
          <div className="col-md-2">
            <div className="erp-footer-panel">
              <div>Stock Qty.: {line.stock_qty}</div>
              <div>Ledger Amount: {selectedCustomer ? Number(selectedCustomer.current_balance || 0).toFixed(2) : ''}</div>
              <div>Last Sales Price: {line.unit_price !== '0' ? line.unit_price : ''}</div>
              <div>Last Sales Serial: {line.serial_from}</div>
              <div>Total Sales Qty.: {totalQty || ''}</div>
              {showCost && <div className="text-danger">Cost: {line.cost_price}</div>}
            </div>
          </div>

          <div className="col-md-3">
            <div className="erp-footer-panel">
              <div className="row g-1 align-items-center mb-1">
                <div className="col-4"><label className="erp-label">Sales Type</label></div>
                <div className="col-8">
                  <select id="DropDownList_Sales_Type" className="erp-select" value={header.sales_type} onChange={(e) => setHeader({ ...header, sales_type: e.target.value })}>
                    <option value="CREDIT">CREDIT</option>
                    <option value="CASH">CASH</option>
                    <option value="ON CONDITION">ON CONDITION</option>
                  </select>
                </div>
              </div>
              <div className="row g-1 align-items-center mb-1">
                <div className="col-4"><label className="erp-label">Collection Type</label></div>
                <div className="col-8">
                  <select id="DropDownCollType" className="erp-select" value={header.collection_type} onChange={(e) => setHeader({ ...header, collection_type: e.target.value })}>
                    <option value="CASH">CASH</option>
                    <option value="MOBILE BANKING">MOBILE BANKING</option>
                    <option value="BEFTN">BEFTN</option>
                    <option value="EFT">EFT</option>
                    <option value="NPSB">NPSB</option>
                  </select>
                </div>
              </div>
              <div className="row g-1 align-items-center mb-1">
                <div className="col-4"><label className="erp-label">Account No.</label></div>
                <div className="col-8">
                  <input id="ACC_NO" className="erp-input" value={header.account_no} disabled={header.collection_type === 'CASH'} onChange={(e) => setHeader({ ...header, account_no: e.target.value })} />
                </div>
              </div>
              <div className="row g-1 align-items-center">
                <div className="col-4"><label className="erp-label">Collection Amount</label></div>
                <div className="col-5">
                  <input id="COLL_AMT" className="erp-input" placeholder="Input Collection Amt." value={header.collection_amount} onChange={(e) => setHeader({ ...header, collection_amount: e.target.value })} />
                </div>
                <div className="col-3">
                  <button id="CASHCOLLECTIO" className="erp-btn w-100" onClick={() => notify(`Collection Amount ${header.collection_amount || 0} set`)}>Collection.</button>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="erp-footer-panel">
              {header.narration && <div>Narration: {header.narration}</div>}
            </div>
          </div>

          <div className="col-md-3">
            <div className="erp-footer-panel text-end">
              <div>Total Amount: {totalAmount ? totalAmount.toFixed(2) : ''}</div>
              <div>Service Charge: {Number(header.service_charge) ? Number(header.service_charge).toFixed(2) : ''}</div>
              <div>Extra Charge: {Number(header.extra_charge) ? Number(header.extra_charge).toFixed(2) : ''}</div>
              <div>Add TAX: {Number(header.tax_amount) ? Number(header.tax_amount).toFixed(2) : ''}</div>
              <div>Add VAT: {Number(header.vat_amount) ? Number(header.vat_amount).toFixed(2) : ''}</div>
              <div>Discount Amount: {Number(header.discount_amount) ? Number(header.discount_amount).toFixed(2) : ''}</div>
              <div>Net Payable Amt. {netPayable ? netPayable.toFixed(2) : ''}</div>
              <div>Invoice Collection Amt. {Number(header.collection_amount) ? Number(header.collection_amount).toFixed(2) : ''}</div>
            </div>
          </div>
        </div>
      </fieldset>
    </div>
  );
}

// 22. SALES_RETURN.aspx — Sales Return
export function SalesReturnPage() {
  const { master, refreshMaster, notify, openPrint } = useErp();
  const navigate = useNavigate();
  const [returnsList, setReturnsList] = useState([]);
  const [header, setHeader] = useState({
    ref_no: '', return_date: getTodayStr(), search_return_id: '', return_id: '',
    cs_group: '', cs_name: '', sales_id: '', invoice_amount: '0',
    store_name: 'SHOW ROOM', narration: '', vat_amount: '0'
  });
  const [line, setLine] = useState({
    product_id: '', product_group: '', product_name: '', product_description: '',
    serial_from: '', warranty: '', qty: '1', unit_price: '0', cost_price: '0', stock_qty: 0
  });
  const [items, setItems] = useState([]);

  useEffect(() => {
    document.title = 'Sales Return';
    fetch('/api/trading/sales-returns').then(r => r.json()).then(d => setReturnsList(d.list || []));
  }, []);

  const totalAmount = items.reduce((s, it) => s + Number(it.total_price || 0), 0);
  const totalQty = items.reduce((s, it) => s + Number(it.qty || 0), 0);
  const netAmount = totalAmount + Number(header.vat_amount || 0);

  const handleSave = async () => {
    let nextItems = [...items];
    if (line.product_name.trim()) {
      const qty = Number(line.qty || 1);
      const up = Number(line.unit_price || 0);
      nextItems.push({
        product_id: line.product_id || 'PRD00001',
        product_group: line.product_group,
        product_name: line.product_name,
        product_description: line.product_description || line.product_name,
        warranty: line.warranty,
        serial_no: line.serial_from,
        qty,
        unit_price: up,
        cost_price: Number(line.cost_price || 0),
        total_price: qty * up
      });
      setItems(nextItems);
      setLine({ ...line, product_name: '', product_description: '', qty: '1', unit_price: '0' });
    }
    if (!header.cs_name.trim() || nextItems.length === 0) return notify('Select Customer and add return item', 'error');
    const res = await fetch('/api/trading/sales-returns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...header, items: nextItems })
    });
    const data = await res.json();
    if (data.ok) {
      setHeader(h => ({ ...h, return_id: data.id }));
      notify(data.message);
      await refreshMaster();
    }
  };

  return (
    <div className="erp-container">
      <fieldset className="erp-fieldset">
        <legend className="erp-legend">Sales Return</legend>
        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Ref No.</label></div>
          <div className="col-md-2"><input id="REF_NO" className="erp-input" value={header.ref_no} onChange={(e) => setHeader({ ...header, ref_no: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Return Date</label></div>
          <div className="col-md-2"><input id="SALES_RETURN_DATE" className="erp-input" value={header.return_date} onChange={(e) => setHeader({ ...header, return_date: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Sales Return ID</label></div>
          <div className="col-md-3">
            <AutocompleteInput
              id="SEARCH_SALES_RETURN_ID"
              value={header.search_return_id}
              onChange={(v) => setHeader({ ...header, search_return_id: v })}
              options={returnsList}
              labelKey="return_id"
              onSelect={(r) => { setHeader({ ...header, ...r }); setItems(r.items || []); }}
            />
          </div>
          <div className="col-md-2"><button id="PU_ID_SEARCH" className="erp-btn w-100" onClick={() => { if (returnsList[0]) { setHeader({ ...header, ...returnsList[0] }); setItems(returnsList[0].items || []); } }}>Search</button></div>
        </div>

        <div className="row g-1 align-items-center mb-1">
          <div className="col-md-1"><label className="erp-label">Customer Group</label></div>
          <div className="col-md-3"><AutocompleteInput id="CS_GROUP" value={header.cs_group} onChange={(v) => setHeader({ ...header, cs_group: v })} options={master.traderGroups} labelKey="group_name" /></div>
          <div className="col-md-1"><label className="erp-label">Customer Name</label></div>
          <div className="col-md-3"><AutocompleteInput id="CS_NAME" value={header.cs_name} onChange={(v) => setHeader({ ...header, cs_name: v })} options={master.traders} labelKey="cs_name" onSelect={(t) => setHeader({ ...header, cs_name: t.cs_name, cs_group: t.group_name })} /></div>
          <div className="col-md-1"><label className="erp-label">Sales ID</label></div>
          <div className="col-md-2"><input id="SALES_ID" className="erp-input" value={header.sales_id} onChange={(e) => setHeader({ ...header, sales_id: e.target.value })} /></div>
          <div className="col-md-1"><input id="Inv_amt" className="erp-input" value={header.invoice_amount} readOnly disabled /></div>
        </div>

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
              onSelect={(p) => setLine({ ...line, product_id: p.product_id, product_group: p.group_name, product_name: p.product_name, product_description: p.description, warranty: p.warranty, unit_price: String(p.sales_price), cost_price: String(p.purchase_price), stock_qty: p.stock_qty })}
            />
          </div>
          <div className="col-md-1"><label className="erp-label">Description</label></div>
          <div className="col-md-2"><input id="MainContent_Product_Description" className="erp-input" value={line.product_description} readOnly disabled /></div>
        </div>

        <div className="row g-1 align-items-center mb-2">
          <div className="col-md-1"><label className="erp-label">Store Name</label></div>
          <div className="col-md-2">
            <select id="MainContent_DropDownStore" className="erp-select" value={header.store_name} onChange={(e) => setHeader({ ...header, store_name: e.target.value })}>
              <option value=""></option>
              <option value="SHOW ROOM">SHOW ROOM</option>
            </select>
          </div>
          <div className="col-md-1"><label className="erp-label">Serial No/From</label></div>
          <div className="col-md-2"><input id="SERIAL_FROM" className="erp-input" value={line.serial_from} onChange={(e) => setLine({ ...line, serial_from: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Product Qty</label></div>
          <div className="col-md-1"><input id="PRODUCT_QTY" className="erp-input" value={line.qty} onChange={(e) => setLine({ ...line, qty: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Unit Price</label></div>
          <div className="col-md-1"><input id="UNIT_PRICE" className="erp-input" value={line.unit_price} onChange={(e) => setLine({ ...line, unit_price: e.target.value })} /></div>
          <div className="col-md-1"><label className="erp-label">Total Price</label></div>
          <div className="col-md-1"><input id="TOTAL_PRICE" className="erp-input" value={Number(line.qty || 0) * Number(line.unit_price || 0)} readOnly disabled /></div>
        </div>

        <div className="d-flex flex-wrap gap-1 mb-2">
          <button id="SAVE_BUTTON" className="erp-btn" onClick={handleSave}>Save</button>
          <button id="EDIT" className="erp-btn" onClick={handleSave}>Edit</button>
          <button id="ADD_VAT" className="erp-btn" onClick={() => {
            const v = window.prompt('Add VAT Amount:', header.vat_amount);
            if (v !== null) setHeader({ ...header, vat_amount: v });
          }}>Add VAT</button>
          <button id="INVOICEIDLIST" className="erp-btn" onClick={() => openPrint({
            title: 'Sales Return Register List',
            columns: ['Return ID', 'Date', 'Customer Name', 'Sales ID', 'Net Amount'],
            rows: returnsList.map(r => [r.return_id, r.return_date, r.cs_name, r.sales_id, r.net_amount])
          })}>Return List</button>
          <button id="MainContent_Button1" className="erp-btn" onClick={() => openPrint({
            title: 'Sales Return Credit Note',
            columns: ['Return ID', 'Product ID', 'Product Description', 'Qty', 'Unit Price', 'Total Price'],
            rows: items.map(it => [header.return_id || 'NEW', it.product_id, it.product_description || it.product_name, it.qty, it.unit_price, it.total_price])
          })}>Print</button>
          <button id="BTNNARATION" className="erp-btn" onClick={() => {
            const n = window.prompt('Narration:', header.narration);
            if (n !== null) setHeader({ ...header, narration: n });
          }}>Narration</button>
          <button id="CLEAR" className="erp-btn" onClick={() => setItems([])}>Clear/New</button>
          <button id="EXIT" className="erp-btn" onClick={() => navigate('/GI/TREE.aspx')}>Exit</button>
        </div>

        <div className="erp-grid-box mb-2">
          <table id="GridView1" className="erp-table">
            <thead>
              <tr>
                <th>Return ID</th><th>Product ID</th><th>Product Description</th><th>Qty</th><th>Unit Price</th><th>Total Price</th><th>Serial</th><th>Edit</th><th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i}>
                  <td>{header.return_id || 'NEW'}</td><td>{it.product_id}</td><td>{it.product_description || it.product_name}</td><td>{it.qty}</td><td>{it.unit_price}</td><td>{it.total_price}</td><td>{it.serial_no}</td>
                  <td><button className="erp-btn" onClick={() => { setLine({ ...line, ...it }); setItems(items.filter((_, idx) => idx !== i)); }}>Edit</button></td>
                  <td><button className="erp-btn" onClick={() => setItems(items.filter((_, idx) => idx !== i))}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="row g-2">
          <div className="col-md-6"><div className="erp-footer-panel"><div>Stock Qty.: {line.stock_qty}</div><div>Total Return Qty.: {totalQty}</div></div></div>
          <div className="col-md-6"><div className="erp-footer-panel text-end"><div>Total Amount: {totalAmount.toFixed(2)}</div><div>Add VAT: {Number(header.vat_amount || 0).toFixed(2)}</div><div>Net Amount: {netAmount.toFixed(2)}</div></div></div>
        </div>
      </fieldset>
    </div>
  );
}

// 23. SERIAL_SEARCH.aspx — Product Search (By Serial)
export function SerialSearchPage() {
  const { master } = useErp();
  const navigate = useNavigate();
  const [serialNo, setSerialNo] = useState('');
  const [rows, setRows] = useState([]);

  const runSearch = useCallback(async (mode = 'exact') => {
    const res = await fetch(`/api/trading/serial-search?q=${encodeURIComponent(serialNo)}&mode=${mode}`);
    if (res.ok) {
      const data = await res.json();
      setRows(data.rows || []);
    }
  }, [serialNo]);

  useEffect(() => {
    document.title = 'Product Serial Search';
    runSearch('all');
  }, []);

  return (
    <div className="erp-container">
      <fieldset className="erp-fieldset mb-2">
        <legend className="erp-legend">Product Search by Serial No.</legend>
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
          <div className="col-md-6 d-flex flex-wrap gap-1">
            <button id="SEARCH" className="erp-btn" onClick={() => runSearch('exact')}>Search</button>
            <button id="SEARCHALL" className="erp-btn" onClick={() => runSearch('all')}>Search All</button>
            <button id="SEARCH_PAR" className="erp-btn" onClick={() => runSearch('first')}>1st Dig.By Sea.</button>
            <button id="SEARCH_LAST" className="erp-btn" onClick={() => runSearch('last')}>Last Dig.By Sea.</button>
            <button id="MainContent_Button1" className="erp-btn" onClick={() => { setSerialNo(''); setRows([]); }}>Clear</button>
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
                <th>Trancation Type</th>
                <th>Transcation ID</th>
                <th>Transcation Date</th>
                <th>CS Name</th>
                <th>Product Group</th>
                <th>Product Name</th>
                <th>Serial</th>
                <th>Warranty</th>
                <th>Narration</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>{r.transaction_type}</td>
                  <td>{r.transaction_id}</td>
                  <td>{r.transaction_date}</td>
                  <td>{r.cs_name}</td>
                  <td>{r.product_group}</td>
                  <td>{r.product_name}</td>
                  <td>{r.serial_no}</td>
                  <td>{r.warranty}</td>
                  <td>{r.narration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </fieldset>
    </div>
  );
}

// 24. MOBILE_SEARCH.aspx — Invoice Search By Mobile No.
export function MobileSearchPage() {
  const { openPrint } = useErp();
  const navigate = useNavigate();
  const [mobile, setMobile] = useState('');
  const [rows, setRows] = useState([]);

  useEffect(() => {
    document.title = 'Product Search By Mobile';
  }, []);

  const handleSearch = async () => {
    const res = await fetch(`/api/trading/mobile-search?mobile=${encodeURIComponent(mobile)}`);
    if (res.ok) {
      const data = await res.json();
      setRows(data.rows || []);
    }
  };

  return (
    <div className="erp-container">
      <fieldset className="erp-fieldset mb-2">
        <legend className="erp-legend">Invoice Search by Mobile No.</legend>
        <div className="row g-2 align-items-center">
          <div className="col-md-2"><label className="erp-label">Input Mobile No.</label></div>
          <div className="col-md-4"><input id="SERIALNO" className="erp-input" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="e.g. 01755112233 or 01922334455" /></div>
          <div className="col-md-6 d-flex gap-2">
            <button id="SEARCH" className="erp-btn" onClick={handleSearch}>Search</button>
            <button id="MainContent_Button1" className="erp-btn" onClick={() => { setMobile(''); setRows([]); }}>Clear</button>
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
                <th>SL</th><th>Invoice ID</th><th>Date</th><th>Customer Name</th><th>Mobile No.</th><th>Sales Type</th><th>Total Qty</th><th>Net Payable</th><th>Collected</th><th>Print</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.sales_id}>
                  <td>{i + 1}</td><td>{r.sales_id}</td><td>{r.sales_date}</td><td>{r.cs_name}</td><td>{r.mobile_no}</td><td>{r.sales_type}</td><td>{r.total_qty}</td><td>{Number(r.net_payable || 0).toFixed(2)}</td><td>{Number(r.collection_amount || 0).toFixed(2)}</td>
                  <td><button className="erp-btn" onClick={() => openPrint({
                    title: `Sales Invoice — ${r.sales_id}`,
                    meta: { 'Invoice ID': r.sales_id, 'Date': r.sales_date, 'Customer': r.cs_name, 'Mobile': r.mobile_no },
                    columns: ['Invoice ID', 'Customer', 'Qty', 'Total Amount', 'Net Payable', 'Collected'],
                    rows: [[r.sales_id, r.cs_name, r.total_qty, r.total_amount, r.net_payable, r.collection_amount]]
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

// 25. DATE_WISE_BILL_SEARCH.aspx — Date Wise Invoice Search
export function DateWiseBillSearchPage() {
  const { openPrint } = useErp();
  const navigate = useNavigate();
  const [date1, setDate1] = useState(getMonthStartStr());
  const [date2, setDate2] = useState(getTodayStr());
  const [rows, setRows] = useState([]);

  const handleSearch = useCallback(async () => {
    const res = await fetch(`/api/trading/date-wise-bills?date1=${encodeURIComponent(date1)}&date2=${encodeURIComponent(date2)}`);
    if (res.ok) {
      const data = await res.json();
      setRows(data.rows || []);
    }
  }, [date1, date2]);

  useEffect(() => {
    document.title = 'Date wise Invoice List';
    handleSearch();
  }, [handleSearch]);

  return (
    <div className="erp-container">
      <fieldset className="erp-fieldset mb-2">
        <legend className="erp-legend">Date wise Bill/Invoice Search</legend>
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
                <th>SL</th>
                <th>Type</th>
                <th>Sold by</th>
                <th>Transcation ID</th>
                <th>Date</th>
                <th>Customer Name</th>
                <th>Cash Customer Name</th>
                <th>Qty</th>
                <th>Total Price</th>
                <th>Approval</th>
                <th>Print</th>
                <th>Ledger</th>
                <th>Edit</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.sales_id}>
                  <td>{i + 1}</td>
                  <td>SALES</td>
                  <td>{r.user_name || 'JUBAYER'}</td>
                  <td>{r.sales_id}</td>
                  <td>{r.sales_date}</td>
                  <td>{r.cs_name}</td>
                  <td>{r.cash_customer_name || ''}</td>
                  <td>{Number(r.total_qty || 0).toFixed(2)}</td>
                  <td>{Number(r.net_payable || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td><button className="btn btn-success btn-sm py-0 px-2" disabled>Approved</button></td>
                  <td><button className="erp-btn" onClick={() => openPrint({
                    title: `SALES INVOICE — ${r.sales_id}`,
                    meta: { 'Invoice ID': r.sales_id, 'Date': r.sales_date, 'Customer': r.cs_name, 'Sold By': r.user_name },
                    columns: ['Invoice ID', 'Customer Name', 'Sales Date', 'Qty', 'Total Price'],
                    rows: [[r.sales_id, r.cs_name, r.sales_date, r.total_qty, Number(r.net_payable || 0).toFixed(2)]]
                  })}>Print</button></td>
                  <td><button className="erp-btn" onClick={() => navigate('/GI/CS_REPORTS.aspx')}>Ledger</button></td>
                  <td><button className="erp-btn" onClick={() => navigate('/GI/SALES.aspx')}>Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </fieldset>
    </div>
  );
}
