import { db, SUPABASE_URL, SUPABASE_KEY } from './db.js';
import { pushSnapshotToSupabase } from './supabaseSync.js';

function headers(extra = {}) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    ...extra
  };
}

// Mapping: [localSqliteTable, supabaseTable, pkCol, allowedCols]
const RELATIONAL_MAP = [
  ['companies', 'companies', 'company_id', ['company_id', 'company_name']],
  ['branches', 'branches', 'branch_id', ['branch_id', 'company_id', 'branch_name', 'address', 'phone', 'email', 'manager_name', 'status', 'logo_url', 'invoice_footer']],
  ['stores', 'stores', 'store_id', ['store_id', 'store_name', 'branch_name']],
  ['users', 'erp_users', 'user_id', ['user_id', 'user_name', 'password', 'father_name', 'mother_name', 'address', 'email', 'mobile', 'opt_mobile', 'permission_type', 'operate_company', 'active', 'permissions_json']],
  ['trader_groups', 'trader_groups', 'group_id', ['group_id', 'group_name', 'active']],
  ['traders', 'traders', 'cs_id', ['cs_id', 'cs_name', 'group_id', 'group_name', 'mpo_id', 'mpo_name', 'address', 'mobile', 'phone', 'email', 'contact_person', 'credit_limit', 'bin', 'opening_balance', 'trader_type', 'customer_type', 'active', 'branch_name']],
  ['categories', 'categories', 'category_id', ['category_id', 'category_name', 'active']],
  ['product_groups', 'product_groups', 'group_id', ['group_id', 'group_name', 'active']],
  ['brands', 'brands', 'brand_id', ['brand_id', 'brand_name', 'active']],
  ['colors', 'colors', 'color_id', ['color_id', 'color_name', 'active']],
  ['products', 'products', 'product_id', ['product_id', 'product_name', 'category_id', 'category_name', 'group_id', 'group_name', 'brand_id', 'brand_name', 'barcode_id', 'description', 'location', 'color', 'size', 'serial_item', 'inventory_item', 'purchase_price', 'sales_price', 'unit', 'discount', 'wholesale_price', 'dealer_price', 'wholesale_comm', 'dealer_comm', 'sales_comm', 'warranty', 'reorder_level', 'red_level', 'vat', 'level_qty', 'active', 'image_url']],
  ['account_sub_groups', 'account_sub_groups', 'sub_group_id', ['sub_group_id', 'sub_group_name', 'group_id', 'group_name']],
  ['account_ledgers', 'account_ledgers', 'accounts_id', ['accounts_id', 'accounts_name', 'sub_group_id', 'sub_group_name', 'group_name', 'balance', 'active']],
  ['banks', 'banks', 'bank_id', ['bank_id', 'bank_name', 'active']],
  ['bank_accounts', 'bank_accounts', 'bk_br_id', ['bk_br_id', 'bank_id', 'bank_name', 'branch_name', 'address', 'routing_no', 'contact_person', 'contact_no', 'email', 'account_no', 'balance', 'active', 'account_type']],
  ['employees', 'employees', 'employee_id', ['employee_id', 'employee_name', 'father_name', 'mother_name', 'address', 'email', 'mobile', 'family_mobile', 'education', 'joining_date', 'basic_salary', 'gross_salary', 'designation', 'opening_balance', 'active', 'employee_type', 'salary_type']],
  ['stock_balances', 'stock_balances', 'id', ['branch_name', 'store_name', 'product_id', 'stock_type', 'qty']],
  ['product_serials', 'product_serials', 'id', ['serial_no', 'product_id', 'product_name', 'product_group', 'branch_name', 'store_name', 'stock_type', 'status', 'purchase_id', 'purchase_date', 'supplier_name', 'sales_id', 'sales_date', 'customer_name', 'warranty', 'unit_price']],
  ['service_groups', 'service_groups', 'service_group_id', ['service_group_id', 'service_group_name', 'active']],
  ['problem_groups', 'problem_groups', 'problem_group_id', ['problem_group_id', 'problem_group_name', 'active']],
  ['services', 'services', 'service_id', ['service_id', 'service_name', 'service_group_id', 'service_group_name', 'description', 'active']],
  ['problems', 'problems', 'problem_id', ['problem_id', 'problem_name', 'problem_group_id', 'problem_group_name', 'description', 'active']],
  ['service_bills', 'service_bills', 'service_bill_id', ['service_bill_id', 'ref_no', 'service_date', 'cash_customer', 'mobile_no', 'cs_group_name', 'customer_name', 'narration', 'engineer_name', 'total_amount', 'discount_amount', 'net_payable', 'branch_name', 'user_name']],
  ['bank_transactions', 'bank_transactions', 'bank_tr_id', ['bank_tr_id', 'ref_no', 'tr_date', 'type_id', 'tr_type', 'cheque_no', 'account_no', 'bank_name', 'branch_name_bank', 'cheque_date', 'narration', 'amount', 'branch_name', 'user_name']],
  ['balance_transfers', 'balance_transfers', 'transfer_id', ['transfer_id', 'ref_no', 'transfer_date', 'transfer_from', 'transfer_to', 'tr_type', 'account_no', 'narration', 'amount', 'approved', 'user_name']],
  ['purchases', 'purchases', 'purchase_id', ['purchase_id', 'ref_no', 'purchase_date', 'cs_group', 'cs_name', 'store_name', 'narration', 'commenc_date', 'total_amount', 'vat_amount', 'discount_amount', 'net_payable', 'payment_amount', 'branch_name', 'user_name']],
  ['sales', 'sales', 'sales_id', ['sales_id', 'ref_no', 'sales_date', 'mobile_no', 'cs_group', 'cs_name', 'cash_customer_name', 'store_name', 'price_tier', 'sales_type', 'collection_type', 'account_no', 'advance_sales', 'narration', 'total_amount', 'service_charge', 'extra_charge', 'tax_amount', 'vat_amount', 'discount_amount', 'net_payable', 'collection_amount', 'approved', 'branch_name', 'user_name']],
  ['payments', 'payments', 'payment_id', ['payment_id', 'ref_no', 'payment_date', 'cs_group', 'cs_name', 'narration', 'purchase_id', 'payment_type', 'bank_name', 'branch_name_bank', 'cheque_no', 'cheque_date', 'account_no', 'amount', 'approved', 'branch_name', 'user_name']],
  ['collections', 'collections', 'collection_id', ['collection_id', 'ref_no', 'collection_date', 'cs_group', 'cs_name', 'narration', 'sales_id', 'collection_type', 'bank_name', 'branch_name_bank', 'cheque_no', 'cheque_date', 'account_no', 'amount', 'approved', 'branch_name', 'user_name']],
  ['journal_vouchers', 'journal_vouchers', 'voucher_id', ['voucher_id', 'ref_no', 'voucher_date', 'tr_type', 'acc_sub_group_id', 'acc_head', 'accounts_id', 'accounts_name', 'accounts_to', 'narration', 'sales_id', 'cheque_no', 'due_amount', 'dr_amount', 'cr_amount', 'branch_name', 'user_name']],
  ['modification_logs', 'modification_logs', 'log_id', ['log_type', 'transaction_id', 'action', 'user_name', 'branch_name', 'log_date', 'details', 'amount']]
];

async function clearAndSyncTable(localTbl, supaTbl, pkCol, cols) {
  const delFilter = pkCol === 'id' || pkCol === 'log_id' ? `${pkCol}=gte.0` : `${pkCol}=neq.__NEVER_MATCH__`;
  const delRes = await fetch(`${SUPABASE_URL}/rest/v1/${supaTbl}?${delFilter}`, {
    method: 'DELETE',
    headers: headers()
  });
  if (!delRes.ok) {
    console.warn(`  [WARN] Delete ${supaTbl}: ${delRes.status} ${await delRes.text()}`);
  }

  const rows = db.prepare(`SELECT ${cols.join(', ')} FROM ${localTbl}`).all();
  if (!rows.length) {
    console.log(`  ${supaTbl.padEnd(22)}: cleared (0 rows)`);
    return;
  }

  const BATCH = 500;
  let uploaded = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH).map(r => {
      const clean = {};
      for (const c of cols) clean[c] = r[c] === undefined ? null : r[c];
      return clean;
    });
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${supaTbl}`, {
      method: 'POST',
      headers: headers({ Prefer: 'resolution=merge-duplicates' }),
      body: JSON.stringify(chunk)
    });
    if (!r.ok) {
      const txt = await r.text();
      console.error(`  [ERR] ${supaTbl} batch ${i}: ${r.status} ${txt.slice(0, 200)}`);
      break;
    }
    uploaded += chunk.length;
  }
  console.log(`  ${supaTbl.padEnd(22)}: uploaded ${uploaded} / ${rows.length} rows`);
}

console.log('Step 1: Pushing chunked gzipped SQLite snapshot to Supabase erp_snapshots...');
const snapOk = await pushSnapshotToSupabase({ force: true });
console.log('Snapshot push result:', snapOk ? 'SUCCESS' : 'FAILED');

console.log('\nStep 2: Clearing old demo rows & uploading real HaziERP data to all 31 Supabase Postgres tables...');
for (const [localTbl, supaTbl, pkCol, cols] of RELATIONAL_MAP) {
  await clearAndSyncTable(localTbl, supaTbl, pkCol, cols);
}
console.log('\nSupabase real-data sync COMPLETE!');
