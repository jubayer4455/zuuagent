import { db } from './db.js';

// Parse DD/MM/YYYY or DD-MM-YYYY to comparable YYYYMMDD integer
export function toDateNum(str) {
  if (!str) return 0;
  const parts = String(str).trim().split(/[\/\-]/);
  if (parts.length !== 3) return 0;
  if (parts[0].length === 4) {
    return parseInt(`${parts[0]}${parts[1].padStart(2, '0')}${parts[2].padStart(2, '0')}`, 10) || 0;
  }
  return parseInt(`${parts[2]}${parts[1].padStart(2, '0')}${parts[0].padStart(2, '0')}`, 10) || 0;
}

export function inDateRange(val, d1, d2) {
  const n = toDateNum(val);
  if (!n) return true;
  const n1 = toDateNum(d1);
  const n2 = toDateNum(d2);
  if (n1 && n < n1) return false;
  if (n2 && n > n2) return false;
  return true;
}

export function matchFilter(fieldVal, filterVal) {
  if (!filterVal || !String(filterVal).trim()) return true;
  return String(fieldVal || '').toLowerCase().includes(String(filterVal).trim().toLowerCase());
}

export function generateReportData(category, reportName, filters = {}) {
  const {
    date1 = '', date2 = '',
    csGroup = '', csName = '',
    productGroup = '', productName = '',
    brandName = '', categoryName = '',
    mpoName = '', userName = '',
    branchName = '', storeName = '',
    accountGroup = '', accountName = '',
    collType = '', accountNo = '',
    transactionId = ''
  } = filters;

  const rName = String(reportName || '').trim();
  const rLower = rName.toLowerCase();

  // 1. PURCHASE REPORTS
  if (category === 'PURCHASE' || (category === 'EXPORT_EXCEL' && rLower.includes('purchase'))) {
    if (rLower.includes('return')) {
      const rows = db.prepare(`
        SELECT pr.return_id, pr.return_date, pr.purchase_id, pr.cs_name, pri.product_id, pri.product_group, pri.product_name, pri.serial_no, pri.qty, pri.unit_price, pri.total_price
        FROM purchase_returns pr
        LEFT JOIN purchase_return_items pri ON pr.return_id = pri.return_id
      `).all().filter(r =>
        inDateRange(r.return_date, date1, date2) &&
        matchFilter(r.cs_name, csName) &&
        matchFilter(r.product_group, productGroup) &&
        matchFilter(r.product_name, productName)
      );
      return {
        title: rName || 'Purchase Return Report',
        columns: ['SL', 'Return ID', 'Date', 'Purchase ID', 'Supplier Name', 'Product ID', 'Product Name', 'Serial No', 'Qty', 'Unit Price', 'Total Price'],
        rows: rows.map((r, i) => [i + 1, r.return_id, r.return_date, r.purchase_id, r.cs_name, r.product_id, r.product_name, r.serial_no, r.qty, Number(r.unit_price || 0).toFixed(2), Number(r.total_price || 0).toFixed(2)]),
        summary: {
          'Total Return Qty': rows.reduce((s, r) => s + Number(r.qty || 0), 0),
          'Total Return Amount': rows.reduce((s, r) => s + Number(r.total_price || 0), 0).toFixed(2)
        }
      };
    }

    const items = db.prepare(`
      SELECT p.purchase_id, p.ref_no, p.purchase_date, p.cs_group, p.cs_name, p.store_name, p.discount_amount, p.vat_amount, p.net_payable, p.payment_amount,
             pi.product_id, pi.product_group, pi.product_name, pi.serial_no, pi.warranty, pi.qty, pi.unit_price, pi.total_price,
             pr.brand_name, pr.category_name
      FROM purchases p
      LEFT JOIN purchase_items pi ON p.purchase_id = pi.purchase_id
      LEFT JOIN products pr ON pi.product_id = pr.product_id
    `).all().filter(r =>
      inDateRange(r.purchase_date, date1, date2) &&
      matchFilter(r.cs_group, csGroup) &&
      matchFilter(r.cs_name, csName) &&
      matchFilter(r.product_group, productGroup) &&
      matchFilter(r.product_name, productName) &&
      matchFilter(r.brand_name, brandName)
    );

    const hidePrice = rLower.includes('wop');
    const cols = hidePrice
      ? ['SL', 'Purchase ID', 'Date', 'Ref No.', 'Supplier Name', 'Product Group', 'Brand', 'Product Name', 'Serial No.', 'Qty']
      : ['SL', 'Purchase ID', 'Date', 'Ref No.', 'Supplier Name', 'Product Group', 'Brand', 'Product Name', 'Qty', 'Unit Price', 'Total Price'];

    const mapped = items.map((r, i) => hidePrice
      ? [i + 1, r.purchase_id, r.purchase_date, r.ref_no, r.cs_name, r.product_group, r.brand_name || '', r.product_name, r.serial_no || '', r.qty]
      : [i + 1, r.purchase_id, r.purchase_date, r.ref_no, r.cs_name, r.product_group, r.brand_name || '', r.product_name, r.qty, Number(r.unit_price || 0).toFixed(2), Number(r.total_price || 0).toFixed(2)]
    );

    return {
      title: rName || 'Purchase Register Report',
      columns: cols,
      rows: mapped,
      summary: {
        'Total Qty': items.reduce((s, r) => s + Number(r.qty || 0), 0),
        ...(hidePrice ? {} : { 'Total Purchase Amount': items.reduce((s, r) => s + Number(r.total_price || 0), 0).toFixed(2) })
      }
    };
  }

  // 2. SALES REPORTS
  if (category === 'SALES' || (category === 'EXPORT_EXCEL' && rLower.includes('sales'))) {
    if (rLower.includes('quotation')) {
      const qRows = db.prepare(`
        SELECT q.quotation_id, q.quotation_date, q.customer_name, q.cash_customer, q.mobile_no, qi.product_name, qi.warranty, qi.qty, qi.unit_price, qi.total_price
        FROM price_quotations q
        LEFT JOIN price_quotation_items qi ON q.quotation_id = qi.quotation_id
      `).all().filter(r => inDateRange(r.quotation_date, date1, date2) && matchFilter(r.customer_name, csName));
      return {
        title: rName,
        columns: ['SL', 'Quotation ID', 'Date', 'Customer Name', 'Cash Customer', 'Mobile', 'Product Name', 'Warranty', 'Qty', 'Unit Price', 'Total Price'],
        rows: qRows.map((r, i) => [i + 1, r.quotation_id, r.quotation_date, r.customer_name, r.cash_customer, r.mobile_no, r.product_name, r.warranty, r.qty, Number(r.unit_price || 0).toFixed(2), Number(r.total_price || 0).toFixed(2)]),
        summary: {
          'Total Qty': qRows.reduce((s, r) => s + Number(r.qty || 0), 0),
          'Total Amount': qRows.reduce((s, r) => s + Number(r.total_price || 0), 0).toFixed(2)
        }
      };
    }

    const sItems = db.prepare(`
      SELECT s.sales_id, s.ref_no, s.sales_date, s.cs_group, s.cs_name, s.cash_customer_name, s.mobile_no, s.sales_type,
             s.discount_amount, s.vat_amount, s.tax_amount, s.extra_charge, s.service_charge, s.net_payable, s.collection_amount, s.user_name, s.branch_name,
             si.product_id, si.product_group, si.product_name, si.warranty, si.serial_no, si.qty, si.unit_price, si.cost_price, si.total_price,
             pr.brand_name, pr.category_name, pr.purchase_price,
             t.mpo_name
      FROM sales s
      LEFT JOIN sales_items si ON s.sales_id = si.sales_id
      LEFT JOIN products pr ON si.product_id = pr.product_id
      LEFT JOIN traders t ON s.cs_name = t.cs_name
    `).all().filter(r =>
      inDateRange(r.sales_date, date1, date2) &&
      matchFilter(r.cs_group, csGroup) &&
      matchFilter(r.cs_name, csName) &&
      matchFilter(r.product_group, productGroup) &&
      matchFilter(r.product_name, productName) &&
      matchFilter(r.brand_name, brandName) &&
      matchFilter(r.category_name, categoryName) &&
      matchFilter(r.mpo_name, mpoName) &&
      matchFilter(r.user_name, userName)
    );

    const showProfit = rLower.includes('profit');
    const cols = showProfit
      ? ['SL', 'Invoice ID', 'Date', 'Customer Name', 'Product Group', 'Brand', 'Product Name', 'Qty', 'Cost Price', 'Sales Price', 'Total Sales', 'Gross Profit']
      : ['SL', 'Invoice ID', 'Date', 'Customer Name', 'MPO/User', 'Product Group', 'Brand', 'Product Name', 'Serial', 'Qty', 'Unit Price', 'Total Price'];

    let totalCost = 0;
    let totalSales = 0;
    let totalProfit = 0;

    const rows = sItems.map((r, i) => {
      const qty = Number(r.qty || 0);
      const costUnit = Number(r.cost_price || r.purchase_price || 0);
      const saleTotal = Number(r.total_price || 0);
      const costTotal = costUnit * qty;
      const profit = saleTotal - costTotal;
      totalCost += costTotal;
      totalSales += saleTotal;
      totalProfit += profit;

      if (showProfit) {
        return [i + 1, r.sales_id, r.sales_date, r.cs_name, r.product_group, r.brand_name || '', r.product_name, qty, costUnit.toFixed(2), Number(r.unit_price || 0).toFixed(2), saleTotal.toFixed(2), profit.toFixed(2)];
      }
      return [i + 1, r.sales_id, r.sales_date, r.cs_name, r.mpo_name || r.user_name || 'JUBAYER', r.product_group, r.brand_name || '', r.product_name, r.serial_no || '', qty, Number(r.unit_price || 0).toFixed(2), saleTotal.toFixed(2)];
    });

    return {
      title: rName || 'Sales Register Report',
      columns: cols,
      rows,
      summary: {
        'Total Qty': sItems.reduce((s, r) => s + Number(r.qty || 0), 0),
        'Total Sales Amount': totalSales.toFixed(2),
        ...(showProfit ? { 'Total Cost': totalCost.toFixed(2), 'Total Gross Profit': totalProfit.toFixed(2) } : {})
      }
    };
  }

  // 3. TRADERS / CS REPORTS
  if (category === 'CS' || (category === 'EXPORT_EXCEL' && (rLower.includes('buyer') || rLower.includes('ledger') || rLower.includes('due') || rLower.includes('receivable') || rLower.includes('payable')))) {
    if (rLower.includes('ledger')) {
      // Combine Opening Balance + Purchases + Sales + Payments + Collections for traders
      const entries = [];
      const traders = db.prepare(`SELECT * FROM traders`).all().filter(t =>
        matchFilter(t.group_name, csGroup) && matchFilter(t.cs_name, csName) && matchFilter(t.mpo_name, mpoName)
      );
      for (const t of traders) {
        if (Number(t.opening_balance || 0) !== 0) {
          entries.push({
            date: '01/11/2026',
            vchId: 'OPENING',
            type: 'OPENING BALANCE',
            trader: t.cs_name,
            narration: 'Opening Balance B/F',
            debit: t.trader_type === 'C' ? Number(t.opening_balance) : 0,
            credit: t.trader_type === 'S' ? Number(t.opening_balance) : 0
          });
        }
      }
      for (const s of db.prepare(`SELECT * FROM sales`).all()) {
        if (inDateRange(s.sales_date, date1, date2) && matchFilter(s.cs_name, csName) && matchFilter(s.cs_group, csGroup)) {
          entries.push({ date: s.sales_date, vchId: s.sales_id, type: 'SALES INVOICE', trader: s.cs_name, narration: s.narration || 'Credit/Cash Sales', debit: Number(s.net_payable || 0), credit: 0 });
        }
      }
      for (const c of db.prepare(`SELECT * FROM collections`).all()) {
        if (inDateRange(c.collection_date, date1, date2) && matchFilter(c.cs_name, csName) && matchFilter(c.cs_group, csGroup)) {
          entries.push({ date: c.collection_date, vchId: c.collection_id, type: `COLLECTION (${c.collection_type})`, trader: c.cs_name, narration: c.narration || 'Received Voucher', debit: 0, credit: Number(c.amount || 0) });
        }
      }
      for (const p of db.prepare(`SELECT * FROM purchases`).all()) {
        if (inDateRange(p.purchase_date, date1, date2) && matchFilter(p.cs_name, csName) && matchFilter(p.cs_group, csGroup)) {
          entries.push({ date: p.purchase_date, vchId: p.purchase_id, type: 'PURCHASE BILL', trader: p.cs_name, narration: p.narration || 'Goods Purchase', debit: 0, credit: Number(p.net_payable || 0) });
        }
      }
      for (const py of db.prepare(`SELECT * FROM payments`).all()) {
        if (inDateRange(py.payment_date, date1, date2) && matchFilter(py.cs_name, csName) && matchFilter(py.cs_group, csGroup)) {
          entries.push({ date: py.payment_date, vchId: py.payment_id, type: `PAYMENT (${py.payment_type})`, trader: py.cs_name, narration: py.narration || 'Payment Voucher', debit: Number(py.amount || 0), credit: 0 });
        }
      }

      let running = 0;
      const rows = entries.map((e, i) => {
        running += (e.debit - e.credit);
        return [i + 1, e.date, e.vchId, e.type, e.trader, e.narration, e.debit.toFixed(2), e.credit.toFixed(2), running.toFixed(2)];
      });
      return {
        title: rName || 'Supplier & Customer Ledger',
        columns: ['SL', 'Date', 'Voucher ID', 'Transaction Type', 'Trader Name', 'Particulars / Narration', 'Debit (DR)', 'Credit (CR)', 'Balance'],
        rows,
        summary: {
          'Total Debit': entries.reduce((s, e) => s + e.debit, 0).toFixed(2),
          'Total Credit': entries.reduce((s, e) => s + e.credit, 0).toFixed(2),
          'Closing Balance': running.toFixed(2)
        }
      };
    }

    // Trader Due / Receivable / Payable Summary
    const allTraders = db.prepare(`SELECT * FROM traders`).all().filter(t =>
      matchFilter(t.group_name, csGroup) &&
      matchFilter(t.cs_name, csName) &&
      matchFilter(t.mpo_name, mpoName) &&
      (rLower.includes('payable') || rLower.includes('supplier leder') ? t.trader_type === 'S' :
       rLower.includes('receivable') || rLower.includes('receiable') || rLower.includes('customer') ? t.trader_type === 'C' : true)
    );

    let totalOpening = 0, totalBill = 0, totalPaid = 0, totalDue = 0;
    const rows = allTraders.map((t, idx) => {
      const opening = Number(t.opening_balance || 0);
      let billed = 0;
      let settled = 0;
      if (t.trader_type === 'C') {
        billed = db.prepare(`SELECT COALESCE(SUM(net_payable), 0) AS s FROM sales WHERE cs_name = ?`).get(t.cs_name).s;
        settled = db.prepare(`SELECT COALESCE(SUM(amount), 0) AS s FROM collections WHERE cs_name = ?`).get(t.cs_name).s;
      } else {
        billed = db.prepare(`SELECT COALESCE(SUM(net_payable), 0) AS s FROM purchases WHERE cs_name = ?`).get(t.cs_name).s;
        settled = db.prepare(`SELECT COALESCE(SUM(amount), 0) AS s FROM payments WHERE cs_name = ?`).get(t.cs_name).s;
      }
      const due = opening + billed - settled;
      totalOpening += opening;
      totalBill += billed;
      totalPaid += settled;
      totalDue += due;
      return [idx + 1, t.cs_id, t.cs_name, t.group_name, t.trader_type === 'S' ? 'SUPPLIER' : 'CUSTOMER', t.mobile, t.mpo_name || '', opening.toFixed(2), billed.toFixed(2), settled.toFixed(2), due.toFixed(2)];
    });

    return {
      title: rName || 'Trader Due & Balance Statement',
      columns: ['SL', 'Trader ID', 'Trader Name', 'Group', 'Type', 'Mobile', 'MPO/SR', 'Opening Bal.', 'Bill/Invoice Amt.', 'Paid/Coll. Amt.', 'Net Due Balance'],
      rows,
      summary: {
        'Total Opening': totalOpening.toFixed(2),
        'Total Bill/Sales': totalBill.toFixed(2),
        'Total Paid/Collected': totalPaid.toFixed(2),
        'Net Closing Due': totalDue.toFixed(2)
      }
    };
  }

  // 4. ACCOUNTS REPORTS
  if (category === 'ACCOUNTS') {
    if (rLower.includes('payment')) {
      const pRows = db.prepare(`SELECT * FROM payments`).all().filter(r =>
        inDateRange(r.payment_date, date1, date2) &&
        matchFilter(r.cs_group, csGroup) &&
        matchFilter(r.cs_name, csName) &&
        (!collType || r.payment_type === collType || collType === 'CASH')
      );
      return {
        title: rName,
        columns: ['SL', 'Payment ID', 'Date', 'Supplier Name', 'Purchase ID', 'Payment Type', 'Bank / Account', 'Cheque No.', 'Narration', 'Amount'],
        rows: pRows.map((r, i) => [i + 1, r.payment_id, r.payment_date, r.cs_name, r.purchase_id, r.payment_type, r.bank_name || r.account_no || 'CASH', r.cheque_no, r.narration, Number(r.amount || 0).toFixed(2)]),
        summary: { 'Total Payment': pRows.reduce((s, r) => s + Number(r.amount || 0), 0).toFixed(2) }
      };
    }

    if (rLower.includes('collection')) {
      const cRows = db.prepare(`SELECT * FROM collections`).all().filter(r =>
        inDateRange(r.collection_date, date1, date2) &&
        matchFilter(r.cs_group, csGroup) &&
        matchFilter(r.cs_name, csName)
      );
      return {
        title: rName,
        columns: ['SL', 'Collection ID', 'Date', 'Customer Name', 'Sales ID', 'Collection Type', 'Bank / Account', 'Cheque No.', 'Narration', 'Amount'],
        rows: cRows.map((r, i) => [i + 1, r.collection_id, r.collection_date, r.cs_name, r.sales_id, r.collection_type, r.bank_name || r.account_no || 'CASH', r.cheque_no, r.narration, Number(r.amount || 0).toFixed(2)]),
        summary: { 'Total Collection': cRows.reduce((s, r) => s + Number(r.amount || 0), 0).toFixed(2) }
      };
    }

    if (rLower.includes('profit') || rLower.includes('income statement') || rLower.includes('trial balance') || rLower.includes('balance sheet')) {
      const totSales = db.prepare(`SELECT COALESCE(SUM(net_payable), 0) AS s FROM sales`).get().s;
      const totService = db.prepare(`SELECT COALESCE(SUM(net_payable), 0) AS s FROM service_bills`).get().s;
      const totPurchases = db.prepare(`SELECT COALESCE(SUM(net_payable), 0) AS s FROM purchases`).get().s;
      const totExpenses = db.prepare(`SELECT COALESCE(SUM(dr_amount), 0) AS s FROM journal_vouchers`).get().s;
      const totCash = db.prepare(`SELECT COALESCE(SUM(balance), 0) AS s FROM account_ledgers WHERE accounts_name = 'CASH IN HAND'`).get().s;
      const totBank = db.prepare(`SELECT COALESCE(SUM(balance), 0) AS s FROM bank_accounts`).get().s;
      const netProfit = (totSales + totService) - (totPurchases * 0.72 + totExpenses);

      const rows = [
        [1, 'Sales Revenue (Commercial Invoices)', 'DIRECT INCOME', '0.00', totSales.toFixed(2)],
        [2, 'Servicing & Repair Bill Revenue', 'DIRECT INCOME', '0.00', totService.toFixed(2)],
        [3, 'Purchases & Cost of Merchandise', 'DIRECT EXPENSES', totPurchases.toFixed(2), '0.00'],
        [4, 'Operating & Office Expenses (Journal Vouchers)', 'INDIRECT EXPENSES', totExpenses.toFixed(2), '0.00'],
        [5, 'Cash in Hand Balance', 'CURRENT ASSET', totCash.toFixed(2), '0.00'],
        [6, 'Cash at Bank (All Bank Accounts)', 'CURRENT ASSET', totBank.toFixed(2), '0.00'],
        [7, 'Estimated Net Profit / Surplus', 'CAPITAL & RESERVES', '0.00', netProfit.toFixed(2)]
      ];
      return {
        title: rName,
        columns: ['SL', 'Account Head / Particulars', 'Account Group', 'Debit Amount (BDT)', 'Credit Amount (BDT)'],
        rows,
        summary: {
          'Total Revenue': (totSales + totService).toFixed(2),
          'Total Operating Expenses': totExpenses.toFixed(2),
          'Net Profit / Surplus': netProfit.toFixed(2)
        }
      };
    }

    // Default Accounts Report: Cash Book / Day Book / General Ledger
    const entries = [];
    for (const c of db.prepare(`SELECT * FROM collections`).all()) {
      if (inDateRange(c.collection_date, date1, date2)) {
        entries.push({ date: c.collection_date, vch: c.collection_id, head: c.cs_name, type: `COLLECTION (${c.collection_type})`, narration: c.narration, dr: Number(c.amount || 0), cr: 0 });
      }
    }
    for (const s of db.prepare(`SELECT * FROM service_bills`).all()) {
      if (inDateRange(s.service_date, date1, date2)) {
        entries.push({ date: s.service_date, vch: s.service_bill_id, head: s.customer_name || s.cash_customer, type: 'SERVICE BILL', narration: s.narration, dr: Number(s.net_payable || 0), cr: 0 });
      }
    }
    for (const p of db.prepare(`SELECT * FROM payments`).all()) {
      if (inDateRange(p.payment_date, date1, date2)) {
        entries.push({ date: p.payment_date, vch: p.payment_id, head: p.cs_name, type: `PAYMENT (${p.payment_type})`, narration: p.narration, dr: 0, cr: Number(p.amount || 0) });
      }
    }
    for (const j of db.prepare(`SELECT * FROM journal_vouchers`).all()) {
      if (inDateRange(j.voucher_date, date1, date2) && matchFilter(j.acc_head, accountGroup) && matchFilter(j.accounts_name, accountName)) {
        entries.push({ date: j.voucher_date, vch: j.voucher_id, head: j.accounts_name, type: `JOURNAL (${j.tr_type})`, narration: j.narration, dr: Number(j.cr_amount || 0), cr: Number(j.dr_amount || 0) });
      }
    }
    for (const b of db.prepare(`SELECT * FROM bank_transactions`).all()) {
      if (inDateRange(b.tr_date, date1, date2)) {
        const isIn = b.tr_type.toUpperCase().includes('WITHDRAW');
        entries.push({ date: b.tr_date, vch: b.bank_tr_id, head: `${b.bank_name} (${b.account_no})`, type: b.tr_type, narration: b.narration, dr: isIn ? Number(b.amount) : 0, cr: isIn ? 0 : Number(b.amount) });
      }
    }

    let bal = 0;
    const rows = entries.map((e, i) => {
      bal += (e.dr - e.cr);
      return [i + 1, e.date, e.vch, e.type, e.head, e.narration, e.dr.toFixed(2), e.cr.toFixed(2), bal.toFixed(2)];
    });
    return {
      title: rName || 'Cash Book & Day Book Register',
      columns: ['SL', 'Date', 'Voucher No.', 'Transaction Type', 'Account / Party Name', 'Narration', 'Receipt / DR', 'Payment / CR', 'Balance'],
      rows,
      summary: {
        'Total Receipt (DR)': entries.reduce((s, e) => s + e.dr, 0).toFixed(2),
        'Total Payment (CR)': entries.reduce((s, e) => s + e.cr, 0).toFixed(2),
        'Net Balance': bal.toFixed(2)
      }
    };
  }

  // 5. STOCK REPORTS
  if (category === 'STOCK' || (category === 'EXPORT_EXCEL' && (rLower.includes('stock') || rLower.includes('product information')))) {
    if (rLower.includes('serial')) {
      const sRows = db.prepare(`
        SELECT ps.*, p.brand_name, p.category_name, p.sales_price
        FROM product_serials ps
        LEFT JOIN products p ON ps.product_id = p.product_id
      `).all().filter(r =>
        matchFilter(r.product_group, productGroup) &&
        matchFilter(r.product_name, productName) &&
        matchFilter(r.brand_name, brandName) &&
        matchFilter(r.supplier_name, csName) &&
        (!rLower.includes('stock') || r.status === 'IN_STOCK')
      );
      const withoutCost = rLower.includes('without cost');
      return {
        title: rName,
        columns: withoutCost
          ? ['SL', 'Serial No.', 'Product ID', 'Product Group', 'Brand', 'Product Name', 'Store', 'Status', 'Warranty']
          : ['SL', 'Serial No.', 'Product ID', 'Product Group', 'Brand', 'Product Name', 'Supplier', 'Purchase ID', 'Purchase Price', 'Sales Price', 'Status'],
        rows: sRows.map((r, i) => withoutCost
          ? [i + 1, r.serial_no, r.product_id, r.product_group, r.brand_name || '', r.product_name, r.store_name, r.status, r.warranty]
          : [i + 1, r.serial_no, r.product_id, r.product_group, r.brand_name || '', r.product_name, r.supplier_name, r.purchase_id, Number(r.unit_price || 0).toFixed(2), Number(r.sales_price || 0).toFixed(2), r.status]
        ),
        summary: { 'Total Serials': sRows.length }
      };
    }

    if (rLower.includes('transfer')) {
      const trs = db.prepare(`
        SELECT st.*, sti.product_id, sti.product_group, sti.product_name, sti.serial_no, sti.qty
        FROM stock_transfers st
        LEFT JOIN stock_transfer_items sti ON st.transfer_id = sti.transfer_id
      `).all().filter(r => inDateRange(r.transfer_date, date1, date2) && matchFilter(r.product_group, productGroup) && matchFilter(r.product_name, productName));
      return {
        title: rName,
        columns: ['SL', 'Transfer ID', 'Date', 'Mode', 'From Branch/Store', 'To Branch/Store', 'Product ID', 'Product Name', 'Serial No.', 'Qty', 'Status'],
        rows: trs.map((r, i) => [i + 1, r.transfer_id, r.transfer_date, r.transfer_mode, `${r.from_branch} (${r.from_store})`, `${r.to_branch} (${r.to_store})`, r.product_id, r.product_name, r.serial_no, r.qty, r.received]),
        summary: { 'Total Transferred Qty': trs.reduce((s, r) => s + Number(r.qty || 0), 0) }
      };
    }

    const prods = db.prepare(`SELECT * FROM products`).all().filter(p =>
      matchFilter(p.group_name, productGroup) &&
      matchFilter(p.product_name, productName) &&
      matchFilter(p.brand_name, brandName) &&
      matchFilter(p.category_name, categoryName)
    );

    const withoutCost = rLower.includes('without cost') || rLower.includes('withouth cost');
    let totQty = 0;
    let totVal = 0;

    const rows = prods.map((p, i) => {
      const qRow = db.prepare(`
        SELECT COALESCE(SUM(qty), 0) AS q FROM stock_balances
        WHERE product_id = ? AND stock_type = 'COMMERCIAL'
        ${branchName ? 'AND branch_name = ?' : ''}
      `).get(...(branchName ? [p.product_id, branchName] : [p.product_id]));
      const qty = Number(qRow?.q || 0);
      const val = qty * Number(p.purchase_price || 0);
      totQty += qty;
      totVal += val;

      if (withoutCost) {
        return [i + 1, p.product_id, p.category_name, p.group_name, p.brand_name, p.product_name, p.unit, p.reorder_level, qty, Number(p.sales_price || 0).toFixed(2)];
      }
      return [i + 1, p.product_id, p.category_name, p.group_name, p.brand_name, p.product_name, p.unit, qty, Number(p.purchase_price || 0).toFixed(2), Number(p.sales_price || 0).toFixed(2), val.toFixed(2)];
    }).filter(r => !rLower.includes('re-order') || Number(r[7]) <= 15);

    return {
      title: rName || 'Current Stock Register',
      columns: withoutCost
        ? ['SL', 'Product ID', 'Category', 'Product Group', 'Brand', 'Item/Model No.', 'Unit', 'Re-Order Level', 'Stock Qty', 'Sales Price']
        : ['SL', 'Product ID', 'Category', 'Product Group', 'Brand', 'Item/Model No.', 'Unit', 'Stock Qty', 'Purchase Cost', 'Sales Price', 'Total Stock Value'],
      rows,
      summary: {
        'Total Stock Qty': totQty,
        ...(withoutCost ? {} : { 'Total Stock Valuation (BDT)': totVal.toFixed(2) })
      }
    };
  }

  // 6. BANK REPORTS
  if (category === 'BANK') {
    if (rLower.includes('statement')) {
      const bRows = db.prepare(`SELECT * FROM bank_transactions`).all().filter(r =>
        inDateRange(r.tr_date, date1, date2) && matchFilter(r.account_no, accountNo)
      );
      return {
        title: rName || 'Bank Statement',
        columns: ['SL', 'Transaction ID', 'Date', 'Bank Name', 'Account No.', 'Transaction Type', 'Cheque No.', 'Cheque Date', 'Narration', 'Amount'],
        rows: bRows.map((r, i) => [i + 1, r.bank_tr_id, r.tr_date, r.bank_name, r.account_no, r.tr_type, r.cheque_no, r.cheque_date, r.narration, Number(r.amount || 0).toFixed(2)]),
        summary: { 'Total Transaction Amount': bRows.reduce((s, r) => s + Number(r.amount || 0), 0).toFixed(2) }
      };
    }

    const cRows = db.prepare(`SELECT * FROM cheque_books WHERE status != 'UNUSED'`).all().filter(r =>
      matchFilter(r.account_no, accountNo) && matchFilter(r.trader_name, csName)
    );
    return {
      title: rName || 'Cheque Register Report',
      columns: ['SL', 'Bank Name', 'Branch', 'Account No.', 'Cheque No.', 'Status', 'Type', 'Transaction ID', 'Trader Name', 'Cheque Date', 'Amount'],
      rows: cRows.map((r, i) => [i + 1, r.bank_name, r.branch_name, r.account_no, r.cheque_no, r.status, r.transaction_type, r.transaction_id, r.trader_name, r.cheque_date, Number(r.amount || 0).toFixed(2)]),
      summary: { 'Total Cheque Amount': cRows.reduce((s, r) => s + Number(r.amount || 0), 0).toFixed(2) }
    };
  }

  // 7. RMA REPORTS
  if (category === 'RMA') {
    if (rLower.includes('replace out')) {
      const ro = db.prepare(`
        SELECT o.out_id, o.out_date, o.cs_name, oi.receive_id, oi.product_name, oi.purchase_serial, oi.out_serial, oi.problem_name, oi.engineer_name, oi.qty, oi.unit_price, oi.status
        FROM rma_replace_outs o
        LEFT JOIN rma_replace_out_items oi ON o.out_id = oi.out_id
      `).all().filter(r => inDateRange(r.out_date, date1, date2) && matchFilter(r.cs_name, csName) && matchFilter(r.product_name, productName));
      return {
        title: rName,
        columns: ['SL', 'Out ID', 'Out Date', 'Supplier Name', 'Complain ID', 'Product Name', 'Serial No.', 'Problem', 'Engineer', 'Qty', 'Status'],
        rows: ro.map((r, i) => [i + 1, r.out_id, r.out_date, r.cs_name, r.receive_id, r.product_name, r.out_serial || r.purchase_serial, r.problem_name, r.engineer_name, r.qty, r.status]),
        summary: { 'Total Units Out': ro.reduce((s, r) => s + Number(r.qty || 0), 0) }
      };
    }

    if (rLower.includes('replace in')) {
      const ri = db.prepare(`
        SELECT i.in_id, i.in_date, i.cs_name, i.adjustment_type, ii.job_ref_no, ii.product_name, ii.out_serial, ii.in_serial, ii.qty, ii.unit_price, ii.charge_amount
        FROM rma_replace_ins i
        LEFT JOIN rma_replace_in_items ii ON i.in_id = ii.in_id
      `).all().filter(r => inDateRange(r.in_date, date1, date2) && matchFilter(r.cs_name, csName) && matchFilter(r.product_name, productName));
      return {
        title: rName,
        columns: ['SL', 'Replace In ID', 'In Date', 'Supplier Name', 'Job Ref', 'Product Name', 'Old Serial', 'New Serial', 'Adjustment Type', 'Qty', 'Charge Amt.'],
        rows: ri.map((r, i) => [i + 1, r.in_id, r.in_date, r.cs_name, r.job_ref_no, r.product_name, r.out_serial, r.in_serial, r.adjustment_type, r.qty, Number(r.charge_amount || 0).toFixed(2)]),
        summary: { 'Total Units Replaced In': ri.reduce((s, r) => s + Number(r.qty || 0), 0) }
      };
    }

    if (rLower.includes('delivery')) {
      const rd = db.prepare(`
        SELECT d.delivery_id, d.delivery_date, d.cs_name, d.delivery_person, di.complain_receive_id, di.product_name, di.received_serial, di.delivery_serial, di.qty, di.amount
        FROM rma_deliveries d
        LEFT JOIN rma_delivery_items di ON d.delivery_id = di.delivery_id
      `).all().filter(r => inDateRange(r.delivery_date, date1, date2) && matchFilter(r.cs_name, csName));
      return {
        title: rName,
        columns: ['SL', 'Delivery ID', 'Date', 'Customer Name', 'Complain ID', 'Product Name', 'Old Serial', 'Delivered Serial', 'Delivered By', 'Qty', 'Charge'],
        rows: rd.map((r, i) => [i + 1, r.delivery_id, r.delivery_date, r.cs_name, r.complain_receive_id, r.product_name, r.received_serial, r.delivery_serial, r.delivery_person, r.qty, Number(r.amount || 0).toFixed(2)]),
        summary: { 'Total Delivered': rd.reduce((s, r) => s + Number(r.qty || 0), 0) }
      };
    }

    if (rLower.includes('rma stock')) {
      const rStock = db.prepare(`
        SELECT sb.*, p.product_name, p.group_name, p.brand_name
        FROM stock_balances sb
        LEFT JOIN products p ON sb.product_id = p.product_id
        WHERE sb.stock_type = 'RMA'
      `).all();
      return {
        title: 'RMA Stock Register',
        columns: ['SL', 'Branch', 'Store', 'Product ID', 'Product Group', 'Brand', 'Product Name', 'RMA Stock Qty'],
        rows: rStock.map((r, i) => [i + 1, r.branch_name, r.store_name, r.product_id, r.group_name, r.brand_name, r.product_name, r.qty]),
        summary: { 'Total RMA Stock Qty': rStock.reduce((s, r) => s + Number(r.qty || 0), 0) }
      };
    }

    // Default RMA: Complain Received / BSR / Pending
    const rc = db.prepare(`
      SELECT c.receive_id, c.receive_date, c.cs_name, c.cash_customer, c.mobile_no,
             ci.product_id, ci.product_name, ci.sold_serial, ci.received_serial, ci.under_warranty, ci.problem_name, ci.engineer_name, ci.delivery_date, ci.qty, ci.charge_amount, ci.status
      FROM rma_complains c
      LEFT JOIN rma_complain_items ci ON c.receive_id = ci.receive_id
    `).all().filter(r => inDateRange(r.receive_date, date1, date2) && matchFilter(r.cs_name, csName) && matchFilter(r.product_name, productName));

    return {
      title: rName || 'RMA Complain & Warranty Register',
      columns: ['SL', 'Receive ID', 'Date', 'Customer Name', 'Mobile', 'Product Name', 'Serial No.', 'Warranty', 'Problem', 'Engineer', 'Delivery Date', 'Status', 'Charge'],
      rows: rc.map((r, i) => [i + 1, r.receive_id, r.receive_date, r.cs_name || r.cash_customer, r.mobile_no, r.product_name, r.received_serial || r.sold_serial, r.under_warranty === 'Y' ? 'Yes' : 'No', r.problem_name, r.engineer_name, r.delivery_date, r.status, Number(r.charge_amount || 0).toFixed(2)]),
      summary: {
        'Total RMA Units': rc.length,
        'Total Service Charge': rc.reduce((s, r) => s + Number(r.charge_amount || 0), 0).toFixed(2)
      }
    };
  }

  // 8. MODIFICATION REPORTS
  if (category === 'MODIFICATION') {
    const logs = db.prepare(`SELECT * FROM modification_logs ORDER BY log_id DESC`).all().filter(l =>
      inDateRange(l.log_date, date1, date2) &&
      matchFilter(l.user_name, userName) &&
      matchFilter(l.transaction_id, transactionId)
    );
    return {
      title: rName || 'Modification & Audit Log Register',
      columns: ['SL', 'Log Date', 'Module Type', 'Transaction ID', 'Action', 'User Name', 'Branch', 'Details / Particulars', 'Amount (BDT)'],
      rows: logs.map((l, i) => [i + 1, l.log_date, l.log_type, l.transaction_id, l.action, l.user_name, l.branch_name, l.details, Number(l.amount || 0).toFixed(2)]),
      summary: { 'Total Audit Events': logs.length }
    };
  }

  // Fallback for Export to Excel Buyer Information
  const buyers = db.prepare(`SELECT * FROM traders`).all();
  return {
    title: rName || 'Traders Master Register',
    columns: ['SL', 'Trader ID', 'Trader Name', 'Group Name', 'Type', 'Mobile', 'Address', 'MPO/SR', 'Credit Limit', 'Opening Balance'],
    rows: buyers.map((b, i) => [i + 1, b.cs_id, b.cs_name, b.group_name, b.trader_type === 'S' ? 'SUPPLIER' : 'CUSTOMER', b.mobile, b.address, b.mpo_name, Number(b.credit_limit || 0).toFixed(2), Number(b.opening_balance || 0).toFixed(2)]),
    summary: { 'Total Traders': buyers.length }
  };
}
