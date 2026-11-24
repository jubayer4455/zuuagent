import { parseSqlServerBak } from '../../../shared/bakParser.js';
import { mapBakTablesToErp } from '../../../shared/bakMapper.js';

const MASTER_TABLES = [
  'companies', 'branches', 'stores', 'users',
  'trader_groups', 'traders',
  'categories', 'product_groups', 'brands', 'colors', 'products', 'branch_prices',
  'account_sub_groups', 'account_ledgers', 'banks', 'bank_accounts', 'cheque_books',
  'employees', 'service_groups', 'problem_groups', 'services', 'problems',
  'stock_balances', 'product_serials'
];

const TRANSACTION_TABLES = [
  'purchases', 'purchase_items', 'purchase_returns', 'purchase_return_items',
  'price_quotations', 'price_quotation_items',
  'sales', 'sales_items', 'sales_returns', 'sales_return_items',
  'stock_transfers', 'stock_transfer_items',
  'payments', 'collections', 'bank_transactions', 'journal_vouchers', 'balance_transfers'
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export async function scanBakFile(file, onProgress = () => {}) {
  onProgress(2, `Reading ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)...`);
  await sleep(30);
  const arrayBuf = await file.arrayBuffer();
  onProgress(10, 'Parsing MS SQL Server .Bak database pages...');
  await sleep(30);

  const parsed = parseSqlServerBak(arrayBuf, {
    onProgress: (pct, msg) => onProgress(10 + Math.round(pct * 0.75), msg)
  });

  onProgress(90, 'Mapping tables to HaziERP format...');
  await sleep(20);
  const mapped = mapBakTablesToErp(parsed.tables);

  const summary = {
    branches: mapped.branches.length,
    stores: mapped.stores.length,
    users: mapped.users.length,
    categories: mapped.categories.length,
    product_groups: mapped.product_groups.length,
    brands: mapped.brands.length,
    products: mapped.products.length,
    traders: mapped.traders.length,
    stock_balances: mapped.stock_balances.length,
    product_serials: mapped.product_serials.length,
    purchases: mapped.purchases.length,
    purchase_items: mapped.purchase_items.length,
    sales: mapped.sales.length,
    sales_items: mapped.sales_items.length,
    collections: mapped.collections.length,
    payments: mapped.payments.length,
    journal_vouchers: mapped.journal_vouchers.length,
    stock_transfers: mapped.stock_transfers.length,
    employees: mapped.employees.length
  };

  onProgress(100, `Ready! Decoded ${summary.products} products, ${summary.traders} traders, ${summary.sales} sales, ${summary.purchases} purchases.`);
  return {
    fileName: file.name,
    fileSizeMB: (file.size / 1024 / 1024).toFixed(2),
    mapped,
    summary
  };
}

export async function uploadMappedBakToServer(mapped, options = {}, onProgress = () => {}) {
  const {
    fileName = 'HAZI_BACKUP.Bak',
    includeTransactions = true,
    preserveBranding = true
  } = options;

  const targetTables = includeTransactions
    ? [...MASTER_TABLES, ...TRANSACTION_TABLES]
    : [...MASTER_TABLES];

  onProgress(2, 'Clearing old/demo data on server (preserving Main Admin login)...');
  const startRes = await fetch('/api/admin/restore-bak/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tables: targetTables, preserveBranding })
  });
  const startData = await startRes.json();
  if (!startRes.ok || !startData.ok) {
    throw new Error(startData.message || 'Failed to start backup restore.');
  }

  // Build chunk list (800 rows per chunk keeps each POST safely under Vercel 4.5MB limit)
  const CHUNK_SIZE = 800;
  const chunks = [];
  for (const tbl of targetTables) {
    const rows = mapped[tbl] || [];
    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      chunks.push({ table: tbl, rows: rows.slice(i, i + CHUNK_SIZE) });
    }
  }

  for (let i = 0; i < chunks.length; i++) {
    const { table, rows } = chunks[i];
    const pct = 5 + Math.round(((i + 1) / Math.max(1, chunks.length)) * 83);
    onProgress(pct, `Uploading ${table} (${i + 1}/${chunks.length} batches, ${rows.length} rows)...`);
    const res = await fetch('/api/admin/restore-bak/chunk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table, rows })
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(data.message || `Upload failed at table ${table}`);
    }
  }

  onProgress(92, 'Finalizing indexes & syncing full database snapshot to Supabase cloud...');
  const finRes = await fetch('/api/admin/restore-bak/finish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName })
  });
  const finData = await finRes.json();
  if (!finRes.ok || !finData.ok) {
    throw new Error(finData.message || 'Restore finalization failed.');
  }

  onProgress(100, finData.message);
  return finData;
}
