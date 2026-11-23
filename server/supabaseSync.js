import { db, SUPABASE_URL, SUPABASE_KEY } from './db.js';

const SYNC_TABLES = [
  'companies', 'branches', 'stores', 'users', 'modification_logs',
  'trader_groups', 'traders', 'categories', 'product_groups', 'brands',
  'colors', 'products', 'branch_prices', 'account_sub_groups', 'account_ledgers',
  'banks', 'bank_accounts', 'cheque_books', 'employees', 'salary_processes',
  'stock_balances', 'product_serials', 'serial_history',
  'purchases', 'purchase_items', 'purchase_returns', 'purchase_return_items',
  'price_quotations', 'price_quotation_items', 'sales', 'sales_items',
  'sales_returns', 'sales_return_items', 'stock_transfers', 'stock_transfer_items',
  'rma_complains', 'rma_complain_items', 'rma_replace_outs', 'rma_replace_out_items',
  'rma_replace_ins', 'rma_replace_in_items', 'rma_deliveries', 'rma_delivery_items',
  'service_groups', 'problem_groups', 'services', 'problems',
  'service_bills', 'service_bill_items', 'payments', 'collections',
  'bank_transactions', 'journal_vouchers', 'balance_transfers'
];

let hydrated = false;

export async function hydrateFromSupabase() {
  if (hydrated) return;
  hydrated = true;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/erp_snapshots?snapshot_key=eq.hazi_erp_live_state&select=payload`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });
    if (!res.ok) return;
    const rows = await res.json();
    const payload = rows?.[0]?.payload;
    if (!payload || typeof payload !== 'object') return;

    for (const tbl of SYNC_TABLES) {
      const tableRows = payload[tbl];
      if (!Array.isArray(tableRows) || tableRows.length === 0) continue;
      db.prepare(`DELETE FROM ${tbl}`).run();
      const cols = Object.keys(tableRows[0]);
      const placeholders = cols.map(() => '?').join(', ');
      const stmt = db.prepare(`INSERT OR REPLACE INTO ${tbl} (${cols.join(', ')}) VALUES (${placeholders})`);
      for (const r of tableRows) {
        stmt.run(...cols.map(c => r[c] ?? null));
      }
    }
  } catch (e) {
    console.error('Supabase hydration note:', e.message);
  }
}

export async function pushSnapshotToSupabase() {
  try {
    const payload = {};
    for (const tbl of SYNC_TABLES) {
      payload[tbl] = db.prepare(`SELECT * FROM ${tbl}`).all();
    }
    await fetch(`${SUPABASE_URL}/rest/v1/erp_snapshots`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        snapshot_key: 'hazi_erp_live_state',
        payload,
        updated_at: new Date().toISOString()
      })
    });
  } catch (e) {
    console.error('Supabase snapshot sync note:', e.message);
  }
}
