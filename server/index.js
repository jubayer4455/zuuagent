import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import { db, DB_PATH, BACKUP_DIR, initDatabase, nextId, adjustStock, getStockQty, logModification } from './db.js';
import { seedDatabase } from './seed.js';
import { generateReportData, inDateRange, matchFilter } from './reports.js';
import { hydrateFromSupabase, pushSnapshotToSupabase } from './supabaseSync.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const UPLOADS_DIR = isServerless ? path.join(os.tmpdir(), 'hazi-erp-uploads') : path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

initDatabase();
seedDatabase();

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '15mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(UPLOADS_DIR));

// Hydrate from Supabase on cold start & sync to Supabase after mutations
app.use(async (req, res, next) => {
  await hydrateFromSupabase();
  if (req.method === 'POST' && req.path.startsWith('/api/') && !req.path.startsWith('/api/reports/')) {
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        pushSnapshotToSupabase().catch(() => {});
      }
    });
  }
  next();
});

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOADS_DIR),
  filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '')}`)
});
const upload = multer({ storage });

// Session Store (stateless cookie + memory for Vercel Serverless persistence)
const sessions = new Map();

function getSession(req) {
  const token = req.cookies?.hazi_session || req.headers['x-session-token'];
  if (token && sessions.has(token)) return sessions.get(token);
  const rawCookie = req.cookies?.hazi_session_data;
  if (rawCookie) {
    try {
      const parsed = JSON.parse(Buffer.from(rawCookie, 'base64url').toString('utf8'));
      if (parsed?.userId) return parsed;
    } catch {}
  }
  return { userId: 'jubayer', userName: 'JUBAYER', companyName: 'HAZI TRADERS', branchName: 'HAZI TRADERS', permissionType: 'A' };
}

function parseUserPermissions(user) {
  if (!user) {
    return {
      all: true,
      roleLabel: 'Super Admin (Full Power)',
      actions: { create: true, edit: true, delete: true, print: true, manageAdmins: true, manageShops: true },
      routes: ['*']
    };
  }
  if (user.permissions_json) {
    try {
      const parsed = JSON.parse(user.permissions_json);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch {}
  }
  if (user.permission_type === 'A') {
    return {
      all: true,
      roleLabel: 'Super Admin (Full Power)',
      actions: { create: true, edit: true, delete: true, print: true, manageAdmins: true, manageShops: true },
      routes: ['*']
    };
  }
  return {
    all: false,
    roleLabel: 'Sales & Billing Admin',
    actions: { create: true, edit: true, delete: false, print: true, manageAdmins: false, manageShops: false },
    routes: ['/GI/SALES.aspx', '/GI/PRICEQUOTATION.aspx', '/GI/SERIAL_SEARCH.aspx', '/GI/MOBILE_SEARCH.aspx', '/GI/DATE_WISE_BILL_SEARCH.aspx']
  };
}

// ==================== AUTH ====================
app.get('/api/auth/options', (req, res) => {
  const companies = db.prepare(`SELECT * FROM companies`).all();
  const branches = db.prepare(`SELECT * FROM branches ORDER BY branch_id`).all();
  const stores = db.prepare(`SELECT * FROM stores`).all();
  res.json({ companies, branches, stores });
});

app.post('/api/auth/login', (req, res) => {
  const { userId, password, companyName = 'HAZI TRADERS', branchName = 'HAZI TRADERS' } = req.body;
  if (!userId || !password) {
    return res.status(400).json({ ok: false, message: 'Please enter User ID and Password!' });
  }
  const user = db.prepare(
    `SELECT * FROM users WHERE (LOWER(user_id) = LOWER(?) OR LOWER(user_name) = LOWER(?)) AND password = ? AND active = 'Y'`
  ).get(String(userId).trim(), String(userId).trim(), String(password).trim());

  if (!user) {
    return res.status(401).json({ ok: false, message: 'Invalid User ID or Password!' });
  }

  const permissions = parseUserPermissions(user);
  const token = `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const sessionData = {
    token,
    userId: user.user_id,
    userName: user.user_name.toUpperCase(),
    companyName: companyName || 'HAZI TRADERS',
    branchName: branchName || user.operate_company || 'HAZI TRADERS',
    permissionType: user.permission_type,
    permissions
  };
  sessions.set(token, sessionData);
  const encoded = Buffer.from(JSON.stringify(sessionData), 'utf8').toString('base64url');
  res.cookie('hazi_session', token, { httpOnly: false, path: '/', maxAge: 7 * 24 * 3600 * 1000 });
  res.cookie('hazi_session_data', encoded, { httpOnly: false, path: '/', maxAge: 7 * 24 * 3600 * 1000 });
  res.json({ ok: true, session: sessionData });
});

app.post('/api/auth/switch-user', (req, res) => {
  const { targetUserId, branchName } = req.body;
  const user = db.prepare(`SELECT * FROM users WHERE LOWER(user_id) = LOWER(?)`).get(String(targetUserId || '').trim());
  if (!user) return res.status(404).json({ ok: false, message: 'Admin/User not found!' });
  const permissions = parseUserPermissions(user);
  const token = `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const sessionData = {
    token,
    userId: user.user_id,
    userName: user.user_name.toUpperCase(),
    companyName: 'HAZI TRADERS',
    branchName: branchName || user.operate_company || 'HAZI TRADERS',
    permissionType: user.permission_type,
    permissions
  };
  sessions.set(token, sessionData);
  const encoded = Buffer.from(JSON.stringify(sessionData), 'utf8').toString('base64url');
  res.cookie('hazi_session', token, { httpOnly: false, path: '/', maxAge: 7 * 24 * 3600 * 1000 });
  res.cookie('hazi_session_data', encoded, { httpOnly: false, path: '/', maxAge: 7 * 24 * 3600 * 1000 });
  res.json({ ok: true, session: sessionData, message: `Switched active account to ${user.user_name} (${permissions.roleLabel || 'Custom Power'})` });
});

app.post('/api/auth/logout', (req, res) => {
  const token = req.cookies?.hazi_session;
  if (token) sessions.delete(token);
  res.clearCookie('hazi_session');
  res.clearCookie('hazi_session_data');
  res.json({ ok: true });
});

app.get('/api/auth/me', (req, res) => {
  const token = req.cookies?.hazi_session || req.headers['x-session-token'];
  if (token && sessions.has(token)) {
    return res.json({ authenticated: true, session: sessions.get(token) });
  }
  const rawCookie = req.cookies?.hazi_session_data;
  if (rawCookie) {
    try {
      const parsed = JSON.parse(Buffer.from(rawCookie, 'base64url').toString('utf8'));
      if (parsed?.userId) return res.json({ authenticated: true, session: parsed });
    } catch {}
  }
  return res.json({ authenticated: false });
});

// ==================== FILE UPLOAD ====================
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ ok: false, message: 'No file uploaded' });
  res.json({ ok: true, url: `/uploads/${req.file.filename}`, filename: req.file.originalname });
});

// ==================== MASTER LOOKUP & AUTOCOMPLETE ====================
app.get('/api/master/all', (req, res) => {
  const sess = getSession(req);
  const branch = req.query.branch || sess.branchName || 'HAZI TRADERS';
  const traderGroups = db.prepare(`SELECT * FROM trader_groups ORDER BY group_id`).all();
  const traders = db.prepare(`SELECT * FROM traders ORDER BY cs_id`).all();
  const categories = db.prepare(`SELECT * FROM categories ORDER BY category_id`).all();
  const productGroups = db.prepare(`SELECT * FROM product_groups ORDER BY group_id`).all();
  const brands = db.prepare(`SELECT * FROM brands ORDER BY brand_id`).all();
  const colors = db.prepare(`SELECT * FROM colors ORDER BY color_id`).all();
  const products = db.prepare(`SELECT * FROM products ORDER BY product_id`).all().map(p => ({
    ...p,
    stock_qty: getStockQty(branch, 'SHOW ROOM', p.product_id, 'COMMERCIAL'),
    rma_stock_qty: getStockQty(branch, 'SHOW ROOM', p.product_id, 'RMA')
  }));
  const branchPrices = db.prepare(`SELECT * FROM branch_prices ORDER BY id`).all();
  const accountSubGroups = db.prepare(`SELECT * FROM account_sub_groups ORDER BY sub_group_id`).all();
  const accountLedgers = db.prepare(`SELECT * FROM account_ledgers ORDER BY accounts_id`).all();
  const banks = db.prepare(`SELECT * FROM banks ORDER BY bank_id`).all();
  const bankAccounts = db.prepare(`SELECT * FROM bank_accounts ORDER BY bk_br_id`).all();
  const chequeBooks = db.prepare(`SELECT * FROM cheque_books ORDER BY id DESC`).all();
  const employees = db.prepare(`SELECT * FROM employees ORDER BY employee_id`).all();
  const users = db.prepare(`SELECT user_id, user_name, password, father_name, mother_name, address, email, mobile, opt_mobile, permission_type, operate_company, active, permissions_json FROM users ORDER BY user_name`).all().map(u => ({
    ...u,
    permissions: parseUserPermissions(u)
  }));
  const serviceGroups = db.prepare(`SELECT * FROM service_groups ORDER BY service_group_id`).all();
  const problemGroups = db.prepare(`SELECT * FROM problem_groups ORDER BY problem_group_id`).all();
  const services = db.prepare(`SELECT * FROM services ORDER BY service_id`).all();
  const problems = db.prepare(`SELECT * FROM problems ORDER BY problem_id`).all();
  const stores = db.prepare(`SELECT * FROM stores`).all();
  const branches = db.prepare(`SELECT * FROM branches`).all();
  const serials = db.prepare(`SELECT * FROM product_serials ORDER BY id DESC`).all();

  // Compute trader live ledger balances
  const traderBalances = {};
  for (const t of traders) {
    let bal = Number(t.opening_balance || 0);
    if (t.trader_type === 'C') {
      const sSum = db.prepare(`SELECT COALESCE(SUM(net_payable), 0) AS s FROM sales WHERE cs_name = ?`).get(t.cs_name).s;
      const cSum = db.prepare(`SELECT COALESCE(SUM(amount), 0) AS s FROM collections WHERE cs_name = ?`).get(t.cs_name).s;
      bal = bal + sSum - cSum;
    } else {
      const pSum = db.prepare(`SELECT COALESCE(SUM(net_payable), 0) AS s FROM purchases WHERE cs_name = ?`).get(t.cs_name).s;
      const pySum = db.prepare(`SELECT COALESCE(SUM(amount), 0) AS s FROM payments WHERE cs_name = ?`).get(t.cs_name).s;
      bal = bal + pSum - pySum;
    }
    traderBalances[t.cs_name] = bal;
  }

  res.json({
    traderGroups,
    traders: traders.map(t => ({ ...t, current_balance: traderBalances[t.cs_name] ?? t.opening_balance })),
    categories,
    productGroups,
    brands,
    colors,
    products,
    branchPrices,
    accountSubGroups,
    accountLedgers,
    banks,
    bankAccounts,
    chequeBooks,
    employees,
    users,
    serviceGroups,
    problemGroups,
    services,
    problems,
    stores,
    branches,
    serials,
    nextIds: {
      traderGroup: nextId('trader_groups', 'group_id', 'CSG', 3),
      trader: nextId('traders', 'cs_id', 'CS', 5),
      category: nextId('categories', 'category_id', 'CAT', 3),
      productGroup: nextId('product_groups', 'group_id', 'PG', 3),
      brand: nextId('brands', 'brand_id', 'BR', 3),
      color: nextId('colors', 'color_id', 'CLR', 3),
      product: nextId('products', 'product_id', 'PRD', 5),
      accountSubGroup: nextId('account_sub_groups', 'sub_group_id', 'ASG', 3),
      accountLedger: nextId('account_ledgers', 'accounts_id', 'ACC', 4),
      bank: nextId('banks', 'bank_id', 'BK', 3),
      bankAccount: nextId('bank_accounts', 'bk_br_id', 'BKB', 3),
      employee: nextId('employees', 'employee_id', 'EMP', 3),
      serviceGroup: nextId('service_groups', 'service_group_id', 'SVG', 3),
      problemGroup: nextId('problem_groups', 'problem_group_id', 'PRG', 3),
      service: nextId('services', 'service_id', 'SV', 8),
      problem: nextId('problems', 'problem_id', 'PR', 8),
      purchase: nextId('purchases', 'purchase_id', 'PUR00126', 7),
      purchaseReturn: nextId('purchase_returns', 'return_id', 'PRT00126', 7),
      quotation: nextId('price_quotations', 'quotation_id', 'QTN00126', 7),
      sales: nextId('sales', 'sales_id', 'INV00126', 7),
      salesReturn: nextId('sales_returns', 'return_id', 'SRT00126', 7),
      transferComm: nextId('stock_transfers', 'transfer_id', 'STC00126', 7),
      transferBr: nextId('stock_transfers', 'transfer_id', 'STB00126', 7),
      transferToRma: nextId('stock_transfers', 'transfer_id', 'STR00126', 7),
      transferFromRma: nextId('stock_transfers', 'transfer_id', 'SRC00126', 7),
      complainReceive: nextId('rma_complains', 'receive_id', 'CMR00126', 7),
      replaceOut: nextId('rma_replace_outs', 'out_id', 'OUT00126', 7),
      replaceIn: nextId('rma_replace_ins', 'in_id', 'RIN00126', 7),
      replacementDelivery: nextId('rma_deliveries', 'delivery_id', 'RDV00126', 7),
      serviceBill: nextId('service_bills', 'service_bill_id', 'SVB00126', 7),
      payment: nextId('payments', 'payment_id', 'PAY00126', 7),
      collection: nextId('collections', 'collection_id', 'COL00126', 7),
      bankTransaction: nextId('bank_transactions', 'bank_tr_id', 'BTR00126', 7),
      journal: nextId('journal_vouchers', 'voucher_id', 'JRN00126', 7),
      balanceTransfer: nextId('balance_transfers', 'transfer_id', 'BLT00126', 7)
    }
  });
});

// ==================== PRIMARY SETUP CRUD ====================
app.post('/api/setup/trader-group', (req, res) => {
  const { action = 'save', group_id, group_name, active = 'Y' } = req.body;
  if (action === 'delete') {
    db.prepare(`DELETE FROM trader_groups WHERE group_id = ? OR group_name = ?`).run(group_id, group_name);
    return res.json({ ok: true, message: 'Traders Group deleted successfully.' });
  }
  const id = group_id && db.prepare(`SELECT 1 FROM trader_groups WHERE group_id = ?`).get(group_id)
    ? group_id
    : nextId('trader_groups', 'group_id', 'CSG', 3);
  db.prepare(`INSERT OR REPLACE INTO trader_groups (group_id, group_name, active) VALUES (?, ?, ?)`).run(id, group_name, active);
  res.json({ ok: true, id, message: 'Traders Group saved successfully.' });
});

app.post('/api/setup/trader', (req, res) => {
  const {
    action = 'save', cs_id, cs_name, group_id = '', group_name = '', mpo_id = '', mpo_name = '',
    address = '', mobile = '', phone = '', email = '', contact_person = '', credit_limit = 0,
    bin = '', opening_balance = 0, trader_type = 'C', customer_type = 'RETAILER', active = 'Y'
  } = req.body;
  if (action === 'delete') {
    db.prepare(`DELETE FROM traders WHERE cs_id = ? OR cs_name = ?`).run(cs_id, cs_name);
    return res.json({ ok: true, message: 'Trader deleted successfully.' });
  }
  const id = cs_id && db.prepare(`SELECT 1 FROM traders WHERE cs_id = ?`).get(cs_id)
    ? cs_id
    : nextId('traders', 'cs_id', 'CS', 5);
  db.prepare(`
    INSERT OR REPLACE INTO traders (
      cs_id, cs_name, group_id, group_name, mpo_id, mpo_name, address, mobile, phone, email,
      contact_person, credit_limit, bin, opening_balance, trader_type, customer_type, active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, cs_name, group_id, group_name, mpo_id, mpo_name, address, mobile, phone, email, contact_person, Number(credit_limit || 0), bin, Number(opening_balance || 0), trader_type, customer_type, active);
  res.json({ ok: true, id, message: 'Trader Information saved successfully.' });
});

app.post('/api/setup/category', (req, res) => {
  const { action = 'save', category_id, category_name, active = 'Y' } = req.body;
  if (action === 'delete') {
    db.prepare(`DELETE FROM categories WHERE category_id = ? OR category_name = ?`).run(category_id, category_name);
    return res.json({ ok: true, message: 'Category deleted successfully.' });
  }
  const id = category_id && db.prepare(`SELECT 1 FROM categories WHERE category_id = ?`).get(category_id)
    ? category_id
    : nextId('categories', 'category_id', 'CAT', 3);
  db.prepare(`INSERT OR REPLACE INTO categories (category_id, category_name, active) VALUES (?, ?, ?)`).run(id, category_name, active);
  res.json({ ok: true, id, message: 'Category saved successfully.' });
});

app.post('/api/setup/product-group', (req, res) => {
  const { action = 'save', group_id, group_name, active = 'Y' } = req.body;
  if (action === 'delete') {
    db.prepare(`DELETE FROM product_groups WHERE group_id = ? OR group_name = ?`).run(group_id, group_name);
    return res.json({ ok: true, message: 'Product Group deleted successfully.' });
  }
  const id = group_id && db.prepare(`SELECT 1 FROM product_groups WHERE group_id = ?`).get(group_id)
    ? group_id
    : nextId('product_groups', 'group_id', 'PG', 3);
  db.prepare(`INSERT OR REPLACE INTO product_groups (group_id, group_name, active) VALUES (?, ?, ?)`).run(id, group_name, active);
  res.json({ ok: true, id, message: 'Product Group saved successfully.' });
});

app.post('/api/setup/brand', (req, res) => {
  const { action = 'save', brand_id, brand_name, active = 'Y' } = req.body;
  if (action === 'delete') {
    db.prepare(`DELETE FROM brands WHERE brand_id = ? OR brand_name = ?`).run(brand_id, brand_name);
    return res.json({ ok: true, message: 'Brand deleted successfully.' });
  }
  const id = brand_id && db.prepare(`SELECT 1 FROM brands WHERE brand_id = ?`).get(brand_id)
    ? brand_id
    : nextId('brands', 'brand_id', 'BR', 3);
  db.prepare(`INSERT OR REPLACE INTO brands (brand_id, brand_name, active) VALUES (?, ?, ?)`).run(id, brand_name, active);
  res.json({ ok: true, id, message: 'Brand Information saved successfully.' });
});

app.post('/api/setup/color', (req, res) => {
  const { action = 'save', color_id, color_name, active = 'Y' } = req.body;
  if (action === 'delete') {
    db.prepare(`DELETE FROM colors WHERE color_id = ? OR color_name = ?`).run(color_id, color_name);
    return res.json({ ok: true, message: 'Color deleted successfully.' });
  }
  const id = color_id && db.prepare(`SELECT 1 FROM colors WHERE color_id = ?`).get(color_id)
    ? color_id
    : nextId('colors', 'color_id', 'CLR', 3);
  db.prepare(`INSERT OR REPLACE INTO colors (color_id, color_name, active) VALUES (?, ?, ?)`).run(id, color_name, active);
  res.json({ ok: true, id, message: 'Color Information saved successfully.' });
});

app.post('/api/setup/product', (req, res) => {
  const {
    action = 'save', product_id, product_name, category_id = '', category_name = '',
    group_id = '', group_name = '', brand_id = '', brand_name = '', barcode_id = '',
    description = '', location = '', color = '', size = '', serial_item = 'N',
    inventory_item = 'Y', purchase_price = 0, sales_price = 0, unit = 'PCS',
    discount = 0, wholesale_price = 0, dealer_price = 0, wholesale_comm = 0,
    dealer_comm = 0, sales_comm = 0, warranty = '', reorder_level = 0,
    red_level = 0, vat = 0, level_qty = 0, active = 'Y', image_url = ''
  } = req.body;
  if (action === 'delete') {
    db.prepare(`DELETE FROM products WHERE product_id = ? OR product_name = ?`).run(product_id, product_name);
    return res.json({ ok: true, message: 'Product deleted successfully.' });
  }
  const id = product_id && db.prepare(`SELECT 1 FROM products WHERE product_id = ?`).get(product_id)
    ? product_id
    : nextId('products', 'product_id', 'PRD', 5);
  const bc = barcode_id || `890${id.replace(/\D/g, '')}`;
  db.prepare(`
    INSERT OR REPLACE INTO products (
      product_id, product_name, category_id, category_name, group_id, group_name, brand_id, brand_name,
      barcode_id, description, location, color, size, serial_item, inventory_item,
      purchase_price, sales_price, unit, discount, wholesale_price, dealer_price,
      wholesale_comm, dealer_comm, sales_comm, warranty, reorder_level, red_level, vat, level_qty, active, image_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, product_name, category_id, category_name, group_id, group_name, brand_id, brand_name,
    bc, description, location, color, size, serial_item, inventory_item,
    Number(purchase_price || 0), Number(sales_price || 0), unit || 'PCS', Number(discount || 0),
    Number(wholesale_price || 0), Number(dealer_price || 0), Number(wholesale_comm || 0),
    Number(dealer_comm || 0), Number(sales_comm || 0), warranty, Number(reorder_level || 0),
    Number(red_level || 0), Number(vat || 0), Number(level_qty || 0), active, image_url
  );
  res.json({ ok: true, id, barcode_id: bc, message: 'Product Information saved successfully.' });
});

app.post('/api/setup/price-setup', (req, res) => {
  const {
    branch_name = 'HAZI TRADERS', all_branch = false, product_name, group_name = '', brand_name = '',
    purchase_price = 0, sales_price_with_tax = 0, sales_price_without_tax = 0,
    wholesale_price = 0, dealer_price = 0, red_level = 0
  } = req.body;

  const prod = db.prepare(`SELECT * FROM products WHERE product_name = ?`).get(product_name);
  const pid = prod ? prod.product_id : 'PRD00001';
  if (prod) {
    db.prepare(`
      UPDATE products SET purchase_price = ?, sales_price = ?, wholesale_price = ?, dealer_price = ?, red_level = ?
      WHERE product_id = ?
    `).run(Number(purchase_price || 0), Number(sales_price_with_tax || 0), Number(wholesale_price || 0), Number(dealer_price || 0), Number(red_level || 0), pid);
  }

  const targetBranches = all_branch ? ['HAZI TRADERS', 'HAZI TRADERS-2'] : [branch_name || 'HAZI TRADERS'];
  for (const br of targetBranches) {
    db.prepare(`
      INSERT INTO branch_prices (branch_name, product_id, product_name, group_name, brand_name, purchase_price, sales_price_with_tax, sales_price_without_tax, wholesale_price, dealer_price, red_level)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(branch_name, product_id) DO UPDATE SET
        purchase_price = excluded.purchase_price,
        sales_price_with_tax = excluded.sales_price_with_tax,
        sales_price_without_tax = excluded.sales_price_without_tax,
        wholesale_price = excluded.wholesale_price,
        dealer_price = excluded.dealer_price,
        red_level = excluded.red_level
    `).run(br, pid, product_name, group_name, brand_name, Number(purchase_price || 0), Number(sales_price_with_tax || 0), Number(sales_price_without_tax || sales_price_with_tax || 0), Number(wholesale_price || 0), Number(dealer_price || 0), Number(red_level || 0));
  }
  res.json({ ok: true, message: `Price Setup updated for ${targetBranches.join(', ')}.` });
});

// ==================== ACCOUNTS SETUP CRUD ====================
app.post('/api/setup/account-sub-group', (req, res) => {
  const { action = 'save', sub_group_id, sub_group_name, group_id = 'AG01', group_name } = req.body;
  if (action === 'delete') {
    db.prepare(`DELETE FROM account_sub_groups WHERE sub_group_id = ? OR sub_group_name = ?`).run(sub_group_id, sub_group_name);
    return res.json({ ok: true, message: 'Account Sub Group deleted.' });
  }
  const id = sub_group_id && db.prepare(`SELECT 1 FROM account_sub_groups WHERE sub_group_id = ?`).get(sub_group_id)
    ? sub_group_id
    : nextId('account_sub_groups', 'sub_group_id', 'ASG', 3);
  db.prepare(`INSERT OR REPLACE INTO account_sub_groups (sub_group_id, sub_group_name, group_id, group_name) VALUES (?, ?, ?, ?)`).run(id, sub_group_name, group_id, group_name);
  res.json({ ok: true, id, message: 'Account Sub Group saved.' });
});

app.post('/api/setup/account-ledger', (req, res) => {
  const { action = 'save', accounts_id, accounts_name, sub_group_id = '', sub_group_name = '', balance = 0, active = 'Y' } = req.body;
  if (action === 'delete') {
    db.prepare(`DELETE FROM account_ledgers WHERE accounts_id = ? OR accounts_name = ?`).run(accounts_id, accounts_name);
    return res.json({ ok: true, message: 'Account Ledger deleted.' });
  }
  const sg = db.prepare(`SELECT * FROM account_sub_groups WHERE sub_group_id = ? OR sub_group_name = ?`).get(sub_group_id, sub_group_name);
  const id = accounts_id && db.prepare(`SELECT 1 FROM account_ledgers WHERE accounts_id = ?`).get(accounts_id)
    ? accounts_id
    : nextId('account_ledgers', 'accounts_id', 'ACC', 4);
  db.prepare(`
    INSERT OR REPLACE INTO account_ledgers (accounts_id, accounts_name, sub_group_id, sub_group_name, group_name, balance, active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, accounts_name, sg?.sub_group_id || sub_group_id, sg?.sub_group_name || sub_group_name, sg?.group_name || 'INDIRECT EXPENSES', Number(balance || 0), active);
  res.json({ ok: true, id, message: 'Account Ledger saved.' });
});

app.post('/api/setup/bank', (req, res) => {
  const { action = 'save', bank_id, bank_name, active = 'Y' } = req.body;
  if (action === 'delete') {
    db.prepare(`DELETE FROM banks WHERE bank_id = ? OR bank_name = ?`).run(bank_id, bank_name);
    return res.json({ ok: true, message: 'Bank deleted.' });
  }
  const id = bank_id && db.prepare(`SELECT 1 FROM banks WHERE bank_id = ?`).get(bank_id)
    ? bank_id
    : nextId('banks', 'bank_id', 'BK', 3);
  db.prepare(`INSERT OR REPLACE INTO banks (bank_id, bank_name, active) VALUES (?, ?, ?)`).run(id, bank_name, active);
  res.json({ ok: true, id, message: 'Bank Information saved.' });
});

app.post('/api/setup/bank-account', (req, res) => {
  const {
    action = 'save', bk_br_id, bank_id = '', bank_name = '', branch_name = '',
    address = '', routing_no = '', contact_person = '', contact_no = '', email = '',
    account_no = '', balance = 0, active = 'Y', account_type = 'GENARAL'
  } = req.body;
  if (action === 'delete') {
    db.prepare(`DELETE FROM bank_accounts WHERE bk_br_id = ? OR account_no = ?`).run(bk_br_id, account_no);
    return res.json({ ok: true, message: 'Bank Account deleted.' });
  }
  const id = bk_br_id && db.prepare(`SELECT 1 FROM bank_accounts WHERE bk_br_id = ?`).get(bk_br_id)
    ? bk_br_id
    : nextId('bank_accounts', 'bk_br_id', 'BKB', 3);
  db.prepare(`
    INSERT OR REPLACE INTO bank_accounts (
      bk_br_id, bank_id, bank_name, branch_name, address, routing_no, contact_person, contact_no, email, account_no, balance, active, account_type
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, bank_id, bank_name, branch_name, address, routing_no, contact_person, contact_no, email, account_no, Number(balance || 0), active, account_type);
  res.json({ ok: true, id, message: 'Bank Account Information saved.' });
});

app.post('/api/setup/cheque-book', (req, res) => {
  const { bank_id = '', bank_name = '', bk_br_id = '', branch_name = '', account_no = '', mode = 'single', serial_comm = '', serial_from = '', serial_to = '' } = req.body;
  const insert = db.prepare(`
    INSERT INTO cheque_books (bank_id, bank_name, bk_br_id, branch_name, account_no, cheque_no, status)
    VALUES (?, ?, ?, ?, ?, ?, 'UNUSED')
  `);
  let created = 0;
  if (mode === 'single') {
    if (serial_comm) {
      insert.run(bank_id, bank_name, bk_br_id, branch_name, account_no, serial_comm);
      created = 1;
    }
  } else {
    const fromN = parseInt(serial_from, 10);
    const toN = parseInt(serial_to, 10);
    if (!isNaN(fromN) && !isNaN(toN) && toN >= fromN && (toN - fromN) <= 500) {
      for (let n = fromN; n <= toN; n++) {
        insert.run(bank_id, bank_name, bk_br_id, branch_name, account_no, `${serial_comm}${n}`);
        created++;
      }
    }
  }
  res.json({ ok: true, created, message: `${created} Cheque leaf/leaves registered successfully.` });
});

// ==================== ADMIN & HRM CRUD (USERS, PERMISSIONS, SHOPS) ====================
app.post('/api/admin/shops', (req, res) => {
  const {
    action = 'save',
    branch_id,
    company_id = 'CMP001',
    branch_name,
    address = 'Dhaka, Bangladesh',
    phone = '01818524712',
    email = 'info@hazierp.top',
    manager_name = 'JUBAYER AHMED',
    status = 'ACTIVE'
  } = req.body;

  if (action === 'delete') {
    if (branch_name === 'HAZI TRADERS' || branch_id === 'BR001') {
      return res.status(400).json({ ok: false, message: 'Primary Headquarters Shop (HAZI TRADERS) cannot be removed.' });
    }
    db.prepare(`DELETE FROM branches WHERE branch_id = ? OR branch_name = ?`).run(branch_id, branch_name);
    return res.json({ ok: true, message: `Shop "${branch_name}" removed successfully.` });
  }

  if (!branch_name || !String(branch_name).trim()) {
    return res.status(400).json({ ok: false, message: 'Please enter Shop / Branch Name.' });
  }
  const cleanName = String(branch_name).trim().toUpperCase();
  const existing = db.prepare(`SELECT * FROM branches WHERE branch_id = ? OR UPPER(branch_name) = ?`).get(branch_id, cleanName);
  const id = existing ? existing.branch_id : nextId('branches', 'branch_id', 'BR', 3);

  db.prepare(`
    INSERT OR REPLACE INTO branches (branch_id, company_id, branch_name, address, phone, email, manager_name, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, company_id, cleanName, address, phone, email, manager_name, status);

  // Ensure default store exists for new shop
  const stId = nextId('stores', 'store_id', 'ST', 3);
  try {
    db.prepare(`INSERT OR IGNORE INTO stores (store_id, store_name, branch_name) VALUES (?, ?, ?)`).run(stId, `${cleanName} SHOWROOM`, cleanName);
  } catch {}

  res.json({ ok: true, id, branch_name: cleanName, message: `Shop / Branch "${cleanName}" (${id}) opened & saved successfully.` });
});

app.post('/api/setup/user', (req, res) => {
  const {
    action = 'save', user_id, user_name, father_name = '', mother_name = '',
    address = '', email = '', mobile = '', opt_mobile = '', password = '',
    new_password = '', permission_type = 'U', operate_company = 'HAZI TRADERS',
    active = 'Y', permissions = null
  } = req.body;

  if (!user_id || !String(user_id).trim()) {
    return res.status(400).json({ ok: false, message: 'Please enter User ID' });
  }
  const cleanId = String(user_id).trim();
  const existing = db.prepare(`SELECT * FROM users WHERE LOWER(user_id) = LOWER(?)`).get(cleanId);

  if (action === 'delete') {
    if (cleanId.toLowerCase() === 'jubayer') {
      return res.status(400).json({ ok: false, message: 'Master Super Admin (jubayer) cannot be deleted!' });
    }
    db.prepare(`DELETE FROM users WHERE LOWER(user_id) = LOWER(?)`).run(cleanId);
    return res.json({ ok: true, message: `Admin / User "${cleanId}" removed permanently.` });
  }

  const finalPass = new_password || password || existing?.password || '123456';
  const finalPermsJson = permissions
    ? (typeof permissions === 'string' ? permissions : JSON.stringify(permissions))
    : (existing?.permissions_json || JSON.stringify(parseUserPermissions({ permission_type })));

  if (action === 'change_password' || action === 'save_permissions' || action === 'save') {
    const targetId = existing ? existing.user_id : cleanId;
    db.prepare(`
      INSERT OR REPLACE INTO users (
        user_id, user_name, password, father_name, mother_name, address, email,
        mobile, opt_mobile, permission_type, operate_company, active, permissions_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      targetId,
      (user_name || existing?.user_name || cleanId).toUpperCase(),
      finalPass,
      father_name ?? existing?.father_name ?? '',
      mother_name ?? existing?.mother_name ?? '',
      address ?? existing?.address ?? '',
      email ?? existing?.email ?? '',
      mobile ?? existing?.mobile ?? '',
      opt_mobile ?? existing?.opt_mobile ?? '',
      permission_type || existing?.permission_type || 'U',
      operate_company || existing?.operate_company || 'HAZI TRADERS',
      active || existing?.active || 'Y',
      finalPermsJson
    );
    const updatedUser = db.prepare(`SELECT * FROM users WHERE LOWER(user_id) = LOWER(?)`).get(targetId);
    return res.json({
      ok: true,
      user: { ...updatedUser, permissions: parseUserPermissions(updatedUser) },
      message: action === 'save_permissions'
        ? `Power & Permissions updated for Admin "${updatedUser.user_name}"!`
        : `Admin / User "${updatedUser.user_name}" saved successfully.`
    });
  }
});

app.post('/api/setup/employee', (req, res) => {
  const {
    action = 'save', employee_id, employee_name, father_name = '', mother_name = '',
    address = '', email = '', mobile = '', family_mobile = '', education = '',
    joining_date = '', basic_salary = 0, gross_salary = 0, designation = '',
    opening_balance = 0, active = 'Y', employee_type = 'Y', salary_type = 'Y'
  } = req.body;
  if (action === 'delete') {
    db.prepare(`DELETE FROM employees WHERE employee_id = ? OR employee_name = ?`).run(employee_id, employee_name);
    return res.json({ ok: true, message: 'Employee deleted.' });
  }
  const id = employee_id && db.prepare(`SELECT 1 FROM employees WHERE employee_id = ?`).get(employee_id)
    ? employee_id
    : nextId('employees', 'employee_id', 'EMP', 3);
  db.prepare(`
    INSERT OR REPLACE INTO employees (
      employee_id, employee_name, father_name, mother_name, address, email, mobile, family_mobile,
      education, joining_date, basic_salary, gross_salary, designation, opening_balance, active, employee_type, salary_type
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, employee_name, father_name, mother_name, address, email, mobile, family_mobile, education, joining_date, Number(basic_salary || 0), Number(gross_salary || 0), designation, Number(opening_balance || 0), active, employee_type, salary_type);
  res.json({ ok: true, id, message: 'Employee Information saved.' });
});

// ==================== SERVICING SETUP & BILL ====================
app.post('/api/setup/service-group', (req, res) => {
  const { action = 'save', service_group_id, service_group_name, active = 'Y' } = req.body;
  if (action === 'delete') {
    db.prepare(`DELETE FROM service_groups WHERE service_group_id = ? OR service_group_name = ?`).run(service_group_id, service_group_name);
    return res.json({ ok: true, message: 'Service Group deleted.' });
  }
  const id = service_group_id && db.prepare(`SELECT 1 FROM service_groups WHERE service_group_id = ?`).get(service_group_id)
    ? service_group_id
    : nextId('service_groups', 'service_group_id', 'SVG', 3);
  db.prepare(`INSERT OR REPLACE INTO service_groups (service_group_id, service_group_name, active) VALUES (?, ?, ?)`).run(id, service_group_name, active);
  res.json({ ok: true, id, message: 'Service Group saved.' });
});

app.post('/api/setup/problem-group', (req, res) => {
  const { action = 'save', problem_group_id, problem_group_name, active = 'Y' } = req.body;
  if (action === 'delete') {
    db.prepare(`DELETE FROM problem_groups WHERE problem_group_id = ? OR problem_group_name = ?`).run(problem_group_id, problem_group_name);
    return res.json({ ok: true, message: 'Problem Group deleted.' });
  }
  const id = problem_group_id && db.prepare(`SELECT 1 FROM problem_groups WHERE problem_group_id = ?`).get(problem_group_id)
    ? problem_group_id
    : nextId('problem_groups', 'problem_group_id', 'PRG', 3);
  db.prepare(`INSERT OR REPLACE INTO problem_groups (problem_group_id, problem_group_name, active) VALUES (?, ?, ?)`).run(id, problem_group_name, active);
  res.json({ ok: true, id, message: 'Problem Group saved.' });
});

app.post('/api/setup/service', (req, res) => {
  const { action = 'save', service_id, service_name, service_group_id = '', service_group_name = '', description = '', active = 'Y' } = req.body;
  if (action === 'delete') {
    db.prepare(`DELETE FROM services WHERE service_id = ? OR service_name = ?`).run(service_id, service_name);
    return res.json({ ok: true, message: 'Service deleted.' });
  }
  const id = service_id && db.prepare(`SELECT 1 FROM services WHERE service_id = ?`).get(service_id)
    ? service_id
    : nextId('services', 'service_id', 'SV', 8);
  db.prepare(`INSERT OR REPLACE INTO services (service_id, service_name, service_group_id, service_group_name, description, active) VALUES (?, ?, ?, ?, ?, ?)`).run(id, service_name, service_group_id, service_group_name, description, active);
  res.json({ ok: true, id, message: 'Service Information saved.' });
});

app.post('/api/setup/problem', (req, res) => {
  const { action = 'save', problem_id, problem_name, problem_group_id = '', problem_group_name = '', description = '', active = 'Y' } = req.body;
  if (action === 'delete') {
    db.prepare(`DELETE FROM problems WHERE problem_id = ? OR problem_name = ?`).run(problem_id, problem_name);
    return res.json({ ok: true, message: 'Problem deleted.' });
  }
  const id = problem_id && db.prepare(`SELECT 1 FROM problems WHERE problem_id = ?`).get(problem_id)
    ? problem_id
    : nextId('problems', 'problem_id', 'PR', 8);
  db.prepare(`INSERT OR REPLACE INTO problems (problem_id, problem_name, problem_group_id, problem_group_name, description, active) VALUES (?, ?, ?, ?, ?, ?)`).run(id, problem_name, problem_group_id, problem_group_name, description, active);
  res.json({ ok: true, id, message: 'Problem Information saved.' });
});

// ==================== TRADING: PURCHASE, PURCHASE RETURN, QUOTATION, SALES, SALES RETURN ====================
app.get('/api/trading/purchases', (req, res) => {
  const list = db.prepare(`SELECT * FROM purchases ORDER BY purchase_id DESC`).all().map(p => ({
    ...p,
    items: db.prepare(`SELECT * FROM purchase_items WHERE purchase_id = ?`).all(p.purchase_id)
  }));
  res.json({ list });
});

app.post('/api/trading/purchases', (req, res) => {
  const sess = getSession(req);
  const {
    purchase_id, ref_no = '', purchase_date, cs_group = '', cs_name, store_name = 'SHOW ROOM',
    narration = '', commenc_date = '', vat_amount = 0, discount_amount = 0, payment_amount = 0, items = []
  } = req.body;

  const isEdit = purchase_id && db.prepare(`SELECT 1 FROM purchases WHERE purchase_id = ?`).get(purchase_id);
  const id = isEdit ? purchase_id : nextId('purchases', 'purchase_id', 'PUR00126', 7);

  if (isEdit) {
    const oldItems = db.prepare(`SELECT * FROM purchase_items WHERE purchase_id = ?`).all(id);
    for (const oi of oldItems) {
      adjustStock(sess.branchName, store_name, oi.product_id, 'COMMERCIAL', -Number(oi.qty || 0));
    }
    db.prepare(`DELETE FROM purchase_items WHERE purchase_id = ?`).run(id);
  }

  const total_amount = items.reduce((s, it) => s + Number(it.total_price || (Number(it.qty || 1) * Number(it.unit_price || 0))), 0);
  const net_payable = total_amount + Number(vat_amount || 0) - Number(discount_amount || 0);

  db.prepare(`
    INSERT OR REPLACE INTO purchases (
      purchase_id, ref_no, purchase_date, cs_group, cs_name, store_name, narration, commenc_date,
      total_amount, vat_amount, discount_amount, net_payable, payment_amount, branch_name, user_name
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, ref_no, purchase_date, cs_group, cs_name, store_name, narration, commenc_date, total_amount, Number(vat_amount || 0), Number(discount_amount || 0), net_payable, Number(payment_amount || 0), sess.branchName, sess.userName);

  const insItem = db.prepare(`
    INSERT INTO purchase_items (purchase_id, product_id, product_group, product_name, product_description, warranty, expiry_date, serial_no, qty, unit_price, total_price)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const it of items) {
    const qty = Number(it.qty || 1);
    const up = Number(it.unit_price || 0);
    const tp = Number(it.total_price || qty * up);
    insItem.run(id, it.product_id || 'PRD00001', it.product_group || '', it.product_name, it.product_description || '', it.warranty || '', it.expiry_date || '', it.serial_no || '', qty, up, tp);
    adjustStock(sess.branchName, store_name, it.product_id || 'PRD00001', 'COMMERCIAL', qty);

    if (it.serial_no) {
      const serials = String(it.serial_no).split(',').map(s => s.trim()).filter(Boolean);
      for (const sn of serials) {
        db.prepare(`
          INSERT INTO product_serials (serial_no, product_id, product_name, product_group, branch_name, store_name, stock_type, status, purchase_id, purchase_date, supplier_name, warranty, unit_price)
          VALUES (?, ?, ?, ?, ?, ?, 'COMMERCIAL', 'IN_STOCK', ?, ?, ?, ?, ?)
        `).run(sn, it.product_id || 'PRD00001', it.product_name, it.product_group || '', sess.branchName, store_name, id, purchase_date, cs_name, it.warranty || '', up);
        db.prepare(`
          INSERT INTO serial_history (serial_no, old_serial, new_serial, transaction_type, transaction_id, transaction_date, cs_name, product_group, product_id, product_name, warranty, amount, narration, branch_name)
          VALUES (?, ?, ?, 'PURCHASE', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(sn, sn, sn, id, purchase_date, cs_name, it.product_group || '', it.product_id || 'PRD00001', it.product_name, it.warranty || '', up, narration || 'Purchase Entry', sess.branchName);
      }
    }
  }

  if (Number(payment_amount || 0) > 0 && !isEdit) {
    const payId = nextId('payments', 'payment_id', 'PAY00126', 7);
    db.prepare(`
      INSERT INTO payments (payment_id, ref_no, payment_date, cs_group, cs_name, narration, purchase_id, payment_type, invoice_amount, due_amount, total_due_amount, amount, branch_name, user_name)
      VALUES (?, ?, ?, ?, ?, 'Auto Cash Payment with Purchase', ?, 'CASH', ?, ?, ?, ?, ?, ?)
    `).run(payId, ref_no, purchase_date, cs_group, cs_name, id, net_payable, net_payable - Number(payment_amount), net_payable - Number(payment_amount), Number(payment_amount), sess.branchName, sess.userName);
  }

  logModification('PURCHASE', id, isEdit ? 'EDITED' : 'CREATED', sess.userName, sess.branchName, `Purchase ${id} (${cs_name})`, net_payable);
  res.json({ ok: true, id, message: `Purchase ${id} saved successfully.` });
});

app.get('/api/trading/purchase-returns', (req, res) => {
  const list = db.prepare(`SELECT * FROM purchase_returns ORDER BY return_id DESC`).all().map(r => ({
    ...r,
    items: db.prepare(`SELECT * FROM purchase_return_items WHERE return_id = ?`).all(r.return_id)
  }));
  res.json({ list });
});

app.post('/api/trading/purchase-returns', (req, res) => {
  const sess = getSession(req);
  const { return_id, ref_no = '', return_date, purchase_id = '', purchase_amount = 0, cs_group = '', cs_name, store_name = 'SHOW ROOM', narration = '', vat_amount = 0, items = [] } = req.body;
  const isEdit = return_id && db.prepare(`SELECT 1 FROM purchase_returns WHERE return_id = ?`).get(return_id);
  const id = isEdit ? return_id : nextId('purchase_returns', 'return_id', 'PRT00126', 7);
  if (isEdit) db.prepare(`DELETE FROM purchase_return_items WHERE return_id = ?`).run(id);

  const total_amount = items.reduce((s, it) => s + Number(it.total_price || (Number(it.qty || 1) * Number(it.unit_price || 0))), 0);
  const net_amount = total_amount + Number(vat_amount || 0);

  db.prepare(`
    INSERT OR REPLACE INTO purchase_returns (return_id, ref_no, return_date, purchase_id, purchase_amount, cs_group, cs_name, store_name, narration, total_amount, vat_amount, net_amount, branch_name, user_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, ref_no, return_date, purchase_id, Number(purchase_amount || 0), cs_group, cs_name, store_name, narration, total_amount, Number(vat_amount || 0), net_amount, sess.branchName, sess.userName);

  for (const it of items) {
    const qty = Number(it.qty || 1);
    const up = Number(it.unit_price || 0);
    db.prepare(`
      INSERT INTO purchase_return_items (return_id, product_id, product_group, product_name, product_description, warranty, serial_no, qty, unit_price, total_price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, it.product_id || 'PRD00001', it.product_group || '', it.product_name, it.product_description || '', it.warranty || '', it.serial_no || '', qty, up, qty * up);
    if (!isEdit) adjustStock(sess.branchName, store_name, it.product_id || 'PRD00001', 'COMMERCIAL', -qty);
  }
  logModification('PURCHASE_RETURN', id, isEdit ? 'EDITED' : 'CREATED', sess.userName, sess.branchName, `Purchase Return ${id}`, net_amount);
  res.json({ ok: true, id, message: `Purchase Return ${id} saved.` });
});

app.get('/api/trading/quotations', (req, res) => {
  const list = db.prepare(`SELECT * FROM price_quotations ORDER BY quotation_id DESC`).all().map(q => ({
    ...q,
    items: db.prepare(`SELECT * FROM price_quotation_items WHERE quotation_id = ?`).all(q.quotation_id)
  }));
  res.json({ list });
});

app.post('/api/trading/quotations', (req, res) => {
  const sess = getSession(req);
  const {
    quotation_id, ref_no = '', quotation_date, mobile_no = '', subject = '', cash_customer = '',
    narration = '', conditions = '', cs_group = '', customer_name = '', store_name = 'SHOW ROOM',
    service_charge = 0, others_charge = 0, tax_amount = 0, vat_amount = 0, discount_amount = 0, items = []
  } = req.body;
  const isEdit = quotation_id && db.prepare(`SELECT 1 FROM price_quotations WHERE quotation_id = ?`).get(quotation_id);
  const id = isEdit ? quotation_id : nextId('price_quotations', 'quotation_id', 'QTN00126', 7);
  if (isEdit) db.prepare(`DELETE FROM price_quotation_items WHERE quotation_id = ?`).run(id);

  const total_amount = items.reduce((s, it) => s + Number(it.total_price || (Number(it.qty || 1) * Number(it.unit_price || 0))), 0);
  const net_payable = total_amount + Number(service_charge || 0) + Number(others_charge || 0) + Number(tax_amount || 0) + Number(vat_amount || 0) - Number(discount_amount || 0);

  db.prepare(`
    INSERT OR REPLACE INTO price_quotations (
      quotation_id, ref_no, quotation_date, mobile_no, subject, cash_customer, narration, conditions,
      cs_group, customer_name, store_name, total_amount, service_charge, others_charge, tax_amount, vat_amount, discount_amount, net_payable, branch_name, user_name
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, ref_no, quotation_date, mobile_no, subject, cash_customer, narration, conditions, cs_group, customer_name, store_name, total_amount, Number(service_charge || 0), Number(others_charge || 0), Number(tax_amount || 0), Number(vat_amount || 0), Number(discount_amount || 0), net_payable, sess.branchName, sess.userName);

  for (const it of items) {
    const qty = Number(it.qty || 1);
    const up = Number(it.unit_price || 0);
    const vp = Number(it.vat_percent || 0);
    const tp = Number(it.total_price || (qty * up * (1 + vp / 100)));
    db.prepare(`
      INSERT INTO price_quotation_items (quotation_id, product_id, product_group, product_name, product_description, item_remarks, warranty, qty, unit_price, vat_percent, total_price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, it.product_id || 'PRD00001', it.product_group || '', it.product_name, it.product_description || '', it.item_remarks || '', it.warranty || '', qty, up, vp, tp);
  }
  res.json({ ok: true, id, message: `Price Quotation ${id} saved.` });
});

app.get('/api/trading/sales', (req, res) => {
  const list = db.prepare(`SELECT * FROM sales ORDER BY sales_id DESC`).all().map(s => ({
    ...s,
    items: db.prepare(`SELECT * FROM sales_items WHERE sales_id = ?`).all(s.sales_id)
  }));
  res.json({ list });
});

app.post('/api/trading/sales', (req, res) => {
  const sess = getSession(req);
  const {
    sales_id, ref_no = '', sales_date, mobile_no = '', cs_group = '', cs_name, cash_customer_name = '',
    store_name = 'SHOW ROOM', price_tier = 'SALES_PRICE', sales_type = 'CREDIT', collection_type = 'CASH',
    account_no = '', advance_sales = 0, narration = '', service_charge = 0, extra_charge = 0,
    tax_amount = 0, vat_amount = 0, discount_amount = 0, collection_amount = 0, items = []
  } = req.body;

  const isEdit = sales_id && db.prepare(`SELECT 1 FROM sales WHERE sales_id = ?`).get(sales_id);
  const id = isEdit ? sales_id : nextId('sales', 'sales_id', 'INV00126', 7);

  if (isEdit) {
    const oldItems = db.prepare(`SELECT * FROM sales_items WHERE sales_id = ?`).all(id);
    for (const oi of oldItems) {
      adjustStock(sess.branchName, store_name, oi.product_id, 'COMMERCIAL', Number(oi.qty || 0));
    }
    db.prepare(`DELETE FROM sales_items WHERE sales_id = ?`).run(id);
  }

  const total_amount = items.reduce((s, it) => s + Number(it.total_price || (Number(it.qty || 1) * Number(it.unit_price || 0))), 0);
  const net_payable = total_amount + Number(service_charge || 0) + Number(extra_charge || 0) + Number(tax_amount || 0) + Number(vat_amount || 0) - Number(discount_amount || 0);

  db.prepare(`
    INSERT OR REPLACE INTO sales (
      sales_id, ref_no, sales_date, mobile_no, cs_group, cs_name, cash_customer_name,
      store_name, price_tier, sales_type, collection_type, account_no, advance_sales, narration,
      total_amount, service_charge, extra_charge, tax_amount, vat_amount, discount_amount, net_payable, collection_amount, approved, branch_name, user_name
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Approved', ?, ?)
  `).run(
    id, ref_no, sales_date, mobile_no, cs_group, cs_name, cash_customer_name,
    store_name, price_tier, sales_type, collection_type, account_no, advance_sales ? 1 : 0, narration,
    total_amount, Number(service_charge || 0), Number(extra_charge || 0), Number(tax_amount || 0), Number(vat_amount || 0), Number(discount_amount || 0), net_payable, Number(collection_amount || 0), sess.branchName, sess.userName
  );

  for (const it of items) {
    const qty = Number(it.qty || 1);
    const up = Number(it.unit_price || 0);
    const disc = Number(it.discount || 0);
    const vp = Number(it.vat_percent || 0);
    const tp = Number(it.total_price || ((qty * up - disc) * (1 + vp / 100)));
    const prod = db.prepare(`SELECT * FROM products WHERE product_id = ? OR product_name = ?`).get(it.product_id, it.product_name);
    const cost = Number(prod?.purchase_price || 0);

    db.prepare(`
      INSERT INTO sales_items (sales_id, product_id, product_group, product_name, product_description, item_remarks, warranty, serial_no, qty, unit_price, cost_price, discount, vat_percent, total_price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, it.product_id || prod?.product_id || 'PRD00001', it.product_group || prod?.group_name || '', it.product_name, it.product_description || prod?.description || '', it.item_remarks || '', it.warranty || prod?.warranty || '', it.serial_no || '', qty, up, cost, disc, vp, tp);

    adjustStock(sess.branchName, store_name, it.product_id || prod?.product_id || 'PRD00001', 'COMMERCIAL', -qty);

    if (it.serial_no) {
      const serials = String(it.serial_no).split(',').map(s => s.trim()).filter(Boolean);
      for (const sn of serials) {
        db.prepare(`UPDATE product_serials SET status = 'SOLD', sales_id = ?, sales_date = ?, customer_name = ? WHERE serial_no = ?`).run(id, sales_date, cs_name, sn);
        db.prepare(`
          INSERT INTO serial_history (serial_no, old_serial, new_serial, transaction_type, transaction_id, transaction_date, cs_name, product_group, product_id, product_name, warranty, amount, narration, branch_name)
          VALUES (?, ?, ?, 'SALES', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(sn, sn, sn, id, sales_date, cs_name, it.product_group || '', it.product_id || 'PRD00001', it.product_name, it.warranty || '', up, narration || 'Sales Invoice', sess.branchName);
      }
    }
  }

  if (Number(collection_amount || 0) > 0 && !isEdit) {
    const colId = nextId('collections', 'collection_id', 'COL00126', 7);
    db.prepare(`
      INSERT INTO collections (collection_id, ref_no, collection_date, cs_group, cs_name, narration, sales_id, collection_type, account_no, invoice_amount, due_amount, total_due_amount, amount, branch_name, user_name)
      VALUES (?, ?, ?, ?, ?, 'Invoice Collection', ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(colId, ref_no, sales_date, cs_group, cs_name, id, collection_type, account_no, net_payable, net_payable - Number(collection_amount), net_payable - Number(collection_amount), Number(collection_amount), sess.branchName, sess.userName);
  }

  logModification('SALES', id, isEdit ? 'EDITED' : 'CREATED', sess.userName, sess.branchName, `Sales Invoice ${id} (${cs_name})`, net_payable);
  res.json({ ok: true, id, message: `Sales Invoice ${id} saved successfully.` });
});

app.get('/api/trading/sales-returns', (req, res) => {
  const list = db.prepare(`SELECT * FROM sales_returns ORDER BY return_id DESC`).all().map(r => ({
    ...r,
    items: db.prepare(`SELECT * FROM sales_return_items WHERE return_id = ?`).all(r.return_id)
  }));
  res.json({ list });
});

app.post('/api/trading/sales-returns', (req, res) => {
  const sess = getSession(req);
  const { return_id, ref_no = '', return_date, sales_id = '', invoice_amount = 0, cs_group = '', cs_name, store_name = 'SHOW ROOM', narration = '', vat_amount = 0, items = [] } = req.body;
  const isEdit = return_id && db.prepare(`SELECT 1 FROM sales_returns WHERE return_id = ?`).get(return_id);
  const id = isEdit ? return_id : nextId('sales_returns', 'return_id', 'SRT00126', 7);
  if (isEdit) db.prepare(`DELETE FROM sales_return_items WHERE return_id = ?`).run(id);

  const total_amount = items.reduce((s, it) => s + Number(it.total_price || (Number(it.qty || 1) * Number(it.unit_price || 0))), 0);
  const net_amount = total_amount + Number(vat_amount || 0);

  db.prepare(`
    INSERT OR REPLACE INTO sales_returns (return_id, ref_no, return_date, sales_id, invoice_amount, cs_group, cs_name, store_name, narration, total_amount, vat_amount, net_amount, branch_name, user_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, ref_no, return_date, sales_id, Number(invoice_amount || 0), cs_group, cs_name, store_name, narration, total_amount, Number(vat_amount || 0), net_amount, sess.branchName, sess.userName);

  for (const it of items) {
    const qty = Number(it.qty || 1);
    const up = Number(it.unit_price || 0);
    db.prepare(`
      INSERT INTO sales_return_items (return_id, product_id, product_group, product_name, product_description, warranty, serial_no, qty, unit_price, cost_price, total_price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, it.product_id || 'PRD00001', it.product_group || '', it.product_name, it.product_description || '', it.warranty || '', it.serial_no || '', qty, up, Number(it.cost_price || 0), qty * up);
    if (!isEdit) adjustStock(sess.branchName, store_name, it.product_id || 'PRD00001', 'COMMERCIAL', qty);
  }
  logModification('SALES_RETURN', id, isEdit ? 'EDITED' : 'CREATED', sess.userName, sess.branchName, `Sales Return ${id}`, net_amount);
  res.json({ ok: true, id, message: `Sales Return ${id} saved.` });
});

// ==================== TRADING SEARCHES ====================
app.get('/api/trading/serial-search', (req, res) => {
  const { q = '', mode = 'exact' } = req.query;
  const term = String(q).trim().toLowerCase();
  const all = db.prepare(`SELECT * FROM serial_history ORDER BY id DESC`).all();
  const rows = !term || mode === 'all'
    ? all
    : all.filter(r => {
        const s = String(r.serial_no || '').toLowerCase();
        if (mode === 'first') return s.startsWith(term);
        if (mode === 'last') return s.endsWith(term);
        return s.includes(term);
      });
  res.json({ rows });
});

app.get('/api/trading/mobile-search', (req, res) => {
  const { mobile = '' } = req.query;
  const term = String(mobile).trim().toLowerCase();
  const salesList = db.prepare(`
    SELECT s.*, COALESCE(SUM(si.qty), 0) AS total_qty
    FROM sales s
    LEFT JOIN sales_items si ON s.sales_id = si.sales_id
    GROUP BY s.sales_id
    ORDER BY s.sales_id DESC
  `).all().filter(s => !term || String(s.mobile_no || '').toLowerCase().includes(term) || String(s.cs_name || '').toLowerCase().includes(term));
  res.json({ rows: salesList });
});

app.get('/api/trading/date-wise-bills', (req, res) => {
  const { date1 = '', date2 = '' } = req.query;
  const rows = db.prepare(`
    SELECT s.*, COALESCE(SUM(si.qty), 0) AS total_qty
    FROM sales s
    LEFT JOIN sales_items si ON s.sales_id = si.sales_id
    GROUP BY s.sales_id
    ORDER BY s.sales_id DESC
  `).all().filter(s => inDateRange(s.sales_date, date1, date2));
  res.json({ rows });
});

// ==================== STOCK TRANSFERS ====================
app.get('/api/transfer/list', (req, res) => {
  const { mode } = req.query;
  const list = db.prepare(`SELECT * FROM stock_transfers ${mode ? 'WHERE transfer_mode = ?' : ''} ORDER BY transfer_id DESC`).all(...(mode ? [mode] : [])).map(t => ({
    ...t,
    items: db.prepare(`SELECT * FROM stock_transfer_items WHERE transfer_id = ?`).all(t.transfer_id)
  }));
  res.json({ list });
});

app.post('/api/transfer/save', (req, res) => {
  const sess = getSession(req);
  const {
    transfer_id, transfer_mode = 'COMM_TO_COMM', ref_no = '', transfer_date,
    from_branch = 'HAZI TRADERS', to_branch = 'HAZI TRADERS', from_store = 'SHOW ROOM',
    to_store = 'SHOW ROOM', narration = '', items = []
  } = req.body;

  const prefixMap = {
    COMM_TO_COMM: 'STC00126',
    BR_TO_BR: 'STB00126',
    COMM_TO_RMA: 'STR00126',
    RMA_TO_COMM: 'SRC00126'
  };
  const isEdit = transfer_id && db.prepare(`SELECT 1 FROM stock_transfers WHERE transfer_id = ?`).get(transfer_id);
  const id = isEdit ? transfer_id : nextId('stock_transfers', 'transfer_id', prefixMap[transfer_mode] || 'STC00126', 7);
  if (isEdit) db.prepare(`DELETE FROM stock_transfer_items WHERE transfer_id = ?`).run(id);

  db.prepare(`
    INSERT OR REPLACE INTO stock_transfers (transfer_id, transfer_mode, ref_no, transfer_date, from_branch, to_branch, from_store, to_store, narration, approved, received, user_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Approved', ?, ?)
  `).run(id, transfer_mode, ref_no, transfer_date, from_branch, to_branch, from_store, to_store, narration, transfer_mode === 'BR_TO_BR' ? 'Pending' : 'Received', sess.userName);

  for (const it of items) {
    const qty = Number(it.qty || 1);
    db.prepare(`
      INSERT INTO stock_transfer_items (transfer_id, product_id, product_group, product_name, product_description, serial_no, qty)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, it.product_id || 'PRD00001', it.product_group || '', it.product_name, it.product_description || '', it.serial_no || '', qty);

    if (!isEdit) {
      if (transfer_mode === 'COMM_TO_RMA') {
        adjustStock(from_branch, from_store, it.product_id || 'PRD00001', 'COMMERCIAL', -qty);
        adjustStock(from_branch, from_store, it.product_id || 'PRD00001', 'RMA', qty);
      } else if (transfer_mode === 'RMA_TO_COMM') {
        adjustStock(from_branch, from_store, it.product_id || 'PRD00001', 'RMA', -qty);
        adjustStock(from_branch, to_store, it.product_id || 'PRD00001', 'COMMERCIAL', qty);
      } else if (transfer_mode === 'COMM_TO_COMM') {
        adjustStock(from_branch, from_store, it.product_id || 'PRD00001', 'COMMERCIAL', -qty);
        adjustStock(from_branch, to_store, it.product_id || 'PRD00001', 'COMMERCIAL', qty);
      } else if (transfer_mode === 'BR_TO_BR') {
        adjustStock(from_branch, from_store, it.product_id || 'PRD00001', 'COMMERCIAL', -qty);
      }
    }
  }
  res.json({ ok: true, id, message: `Stock Transfer ${id} saved successfully.` });
});

app.post('/api/transfer/receive', (req, res) => {
  const { transfer_id } = req.body;
  const tr = db.prepare(`SELECT * FROM stock_transfers WHERE transfer_id = ?`).get(transfer_id);
  if (!tr) return res.status(404).json({ ok: false, message: 'Transfer ID not found' });
  const items = db.prepare(`SELECT * FROM stock_transfer_items WHERE transfer_id = ?`).all(transfer_id);
  if (tr.received !== 'Received') {
    for (const it of items) {
      adjustStock(tr.to_branch || 'HAZI TRADERS-2', tr.to_store || 'SHOW ROOM', it.product_id, 'COMMERCIAL', Number(it.qty || 1));
    }
    db.prepare(`UPDATE stock_transfers SET received = 'Received' WHERE transfer_id = ?`).run(transfer_id);
  }
  res.json({ ok: true, message: `Branch Transfer ${transfer_id} marked as Received and stock updated.` });
});

// ==================== RMA MODULE ====================
app.get('/api/rma/all', (req, res) => {
  const complains = db.prepare(`SELECT * FROM rma_complains ORDER BY receive_id DESC`).all().map(c => ({
    ...c,
    items: db.prepare(`SELECT * FROM rma_complain_items WHERE receive_id = ?`).all(c.receive_id)
  }));
  const replaceOuts = db.prepare(`SELECT * FROM rma_replace_outs ORDER BY out_id DESC`).all().map(o => ({
    ...o,
    items: db.prepare(`SELECT * FROM rma_replace_out_items WHERE out_id = ?`).all(o.out_id)
  }));
  const replaceIns = db.prepare(`SELECT * FROM rma_replace_ins ORDER BY in_id DESC`).all().map(i => ({
    ...i,
    items: db.prepare(`SELECT * FROM rma_replace_in_items WHERE in_id = ?`).all(i.in_id)
  }));
  const deliveries = db.prepare(`SELECT * FROM rma_deliveries ORDER BY delivery_id DESC`).all().map(d => ({
    ...d,
    items: db.prepare(`SELECT * FROM rma_delivery_items WHERE delivery_id = ?`).all(d.delivery_id)
  }));
  const history = db.prepare(`SELECT * FROM serial_history ORDER BY id DESC`).all();
  res.json({ complains, replaceOuts, replaceIns, deliveries, history });
});

app.post('/api/rma/complain', (req, res) => {
  const sess = getSession(req);
  const { receive_id, ref_no = '', receive_date, cash_customer = '', mobile_no = '', narration = '', cs_group = '', cs_name = '', store_name = 'SHOW ROOM', items = [] } = req.body;
  const isEdit = receive_id && db.prepare(`SELECT 1 FROM rma_complains WHERE receive_id = ?`).get(receive_id);
  const id = isEdit ? receive_id : nextId('rma_complains', 'receive_id', 'CMR00126', 7);
  if (isEdit) db.prepare(`DELETE FROM rma_complain_items WHERE receive_id = ?`).run(id);

  const total_amount = items.reduce((s, it) => s + Number(it.total_price || (Number(it.qty || 1) * Number(it.unit_price || 0))), 0);
  db.prepare(`
    INSERT OR REPLACE INTO rma_complains (receive_id, ref_no, receive_date, cash_customer, mobile_no, narration, cs_group, cs_name, store_name, total_amount, branch_name, user_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, ref_no, receive_date, cash_customer, mobile_no, narration, cs_group, cs_name, store_name, total_amount, sess.branchName, sess.userName);

  for (const it of items) {
    const qty = Number(it.qty || 1);
    const up = Number(it.unit_price || 0);
    db.prepare(`
      INSERT INTO rma_complain_items (receive_id, product_id, product_group, product_name, product_description, item_remarks, sold_serial, received_serial, under_warranty, warranty, sales_id, sales_date, no_of_times, job_ref_no, delivery_date, problem_name, engineer_name, qty, unit_price, total_price, charge_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, it.product_id || 'PRD00001', it.product_group || '', it.product_name, it.product_description || '', it.item_remarks || '', it.sold_serial || '', it.received_serial || it.sold_serial || '', it.under_warranty || 'Y', it.warranty || '', it.sales_id || '', it.sales_date || '', it.no_of_times || '1', it.job_ref_no || '', it.delivery_date || '', it.problem_name || '', it.engineer_name || '', qty, up, qty * up, Number(it.charge_amount || 0));

    const sn = it.received_serial || it.sold_serial;
    if (sn) {
      db.prepare(`
        INSERT INTO serial_history (serial_no, old_serial, new_serial, transaction_type, transaction_id, transaction_date, cs_name, product_group, product_id, product_name, warranty, problem, amount, narration, branch_name)
        VALUES (?, ?, ?, 'COMPLAIN_RECEIVE', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(sn, sn, sn, id, receive_date, cs_name || cash_customer, it.product_group || '', it.product_id || 'PRD00001', it.product_name, it.warranty || '', it.problem_name || '', Number(it.charge_amount || 0), narration, sess.branchName);
    }
  }
  res.json({ ok: true, id, message: `Complain Receive ${id} saved.` });
});

app.post('/api/rma/replace-out', (req, res) => {
  const sess = getSession(req);
  const { out_id, ref_no = '', out_date, cs_group = '', cs_name = '', narration = '', store_name = 'SHOW ROOM', items = [] } = req.body;
  const isEdit = out_id && db.prepare(`SELECT 1 FROM rma_replace_outs WHERE out_id = ?`).get(out_id);
  const id = isEdit ? out_id : nextId('rma_replace_outs', 'out_id', 'OUT00126', 7);
  if (isEdit) db.prepare(`DELETE FROM rma_replace_out_items WHERE out_id = ?`).run(id);

  const total_amount = items.reduce((s, it) => s + Number(it.qty || 1) * Number(it.unit_price || 0), 0);
  db.prepare(`
    INSERT OR REPLACE INTO rma_replace_outs (out_id, ref_no, out_date, cs_group, cs_name, narration, store_name, total_amount, branch_name, user_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, ref_no, out_date, cs_group, cs_name, narration, store_name, total_amount, sess.branchName, sess.userName);

  for (const it of items) {
    db.prepare(`
      INSERT INTO rma_replace_out_items (out_id, receive_id, product_id, product_group, product_name, product_description, purchase_serial, out_serial, under_warranty, purchase_id, purchase_date, no_of_times, job_ref_no, in_date, problem_name, engineer_name, qty, unit_price, charge_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, it.receive_id || 'CMR001260000001', it.product_id || 'PRD00001', it.product_group || '', it.product_name, it.product_description || '', it.purchase_serial || '', it.out_serial || it.purchase_serial || '', it.under_warranty || 'Y', it.purchase_id || '', it.purchase_date || '', it.no_of_times || '1', it.job_ref_no || '', it.in_date || '', it.problem_name || '', it.engineer_name || '', Number(it.qty || 1), Number(it.unit_price || 0), Number(it.charge_amount || 0));

    const sn = it.out_serial || it.purchase_serial;
    if (sn) {
      db.prepare(`
        INSERT INTO serial_history (serial_no, old_serial, new_serial, transaction_type, transaction_id, transaction_date, cs_name, product_group, product_id, product_name, warranty, problem, amount, narration, branch_name)
        VALUES (?, ?, ?, 'REPLACE_OUT', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(sn, sn, sn, id, out_date, cs_name, it.product_group || '', it.product_id || 'PRD00001', it.product_name, it.under_warranty || 'Y', it.problem_name || '', Number(it.charge_amount || 0), narration, sess.branchName);
    }
  }
  res.json({ ok: true, id, message: `Replace Out ${id} saved.` });
});

app.post('/api/rma/replace-in', (req, res) => {
  const sess = getSession(req);
  const { in_id, ref_no = '', in_date, cs_group = '', cs_name = '', narration = '', store_name = 'SHOW ROOM', adjustment_type = 'Without Adjustment', items = [] } = req.body;
  const isEdit = in_id && db.prepare(`SELECT 1 FROM rma_replace_ins WHERE in_id = ?`).get(in_id);
  const id = isEdit ? in_id : nextId('rma_replace_ins', 'in_id', 'RIN00126', 7);
  if (isEdit) db.prepare(`DELETE FROM rma_replace_in_items WHERE in_id = ?`).run(id);

  const total_amount = items.reduce((s, it) => s + Number(it.qty || 1) * Number(it.unit_price || 0), 0);
  db.prepare(`
    INSERT OR REPLACE INTO rma_replace_ins (in_id, ref_no, in_date, cs_group, cs_name, narration, store_name, adjustment_type, total_amount, branch_name, user_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, ref_no, in_date, cs_group, cs_name, narration, store_name, adjustment_type, total_amount, sess.branchName, sess.userName);

  for (const it of items) {
    db.prepare(`
      INSERT INTO rma_replace_in_items (in_id, job_ref_no, product_id, product_group, product_name, product_description, out_serial, in_serial, qty, unit_price, charge_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, it.job_ref_no || '', it.product_id || 'PRD00001', it.product_group || '', it.product_name, it.product_description || '', it.out_serial || '', it.in_serial || '', Number(it.qty || 1), Number(it.unit_price || 0), Number(it.charge_amount || 0));

    const sn = it.in_serial || it.out_serial;
    if (sn) {
      db.prepare(`
        INSERT INTO serial_history (serial_no, old_serial, new_serial, transaction_type, transaction_id, transaction_date, cs_name, product_group, product_id, product_name, warranty, problem, amount, narration, branch_name)
        VALUES (?, ?, ?, 'REPLACE_IN', ?, ?, ?, ?, ?, ?, 'Warranty', '', ?, ?, ?)
      `).run(sn, it.out_serial || sn, it.in_serial || sn, id, in_date, cs_name, it.product_group || '', it.product_id || 'PRD00001', it.product_name, Number(it.charge_amount || 0), narration, sess.branchName);
    }
  }
  res.json({ ok: true, id, message: `Replace In ${id} saved.` });
});

app.post('/api/rma/delivery', (req, res) => {
  const sess = getSession(req);
  const { delivery_id, ref_no = '', delivery_date, mobile_no = '', delivery_person = '', narration = '', cs_group = '', cs_name = '', store_name = 'SHOW ROOM', adjustment_type = 'Without Adjustment', items = [] } = req.body;
  const isEdit = delivery_id && db.prepare(`SELECT 1 FROM rma_deliveries WHERE delivery_id = ?`).get(delivery_id);
  const id = isEdit ? delivery_id : nextId('rma_deliveries', 'delivery_id', 'RDV00126', 7);
  if (isEdit) db.prepare(`DELETE FROM rma_delivery_items WHERE delivery_id = ?`).run(id);

  const total_amount = items.reduce((s, it) => s + Number(it.amount || 0), 0);
  db.prepare(`
    INSERT OR REPLACE INTO rma_deliveries (delivery_id, ref_no, delivery_date, mobile_no, delivery_person, narration, cs_group, cs_name, store_name, adjustment_type, total_amount, branch_name, user_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, ref_no, delivery_date, mobile_no, delivery_person, narration, cs_group, cs_name, store_name, adjustment_type, total_amount, sess.branchName, sess.userName);

  for (const it of items) {
    db.prepare(`
      INSERT INTO rma_delivery_items (delivery_id, complain_receive_id, job_ref_no, product_id, product_group, product_name, product_description, received_serial, replace_in_serial, delivery_serial, qty, amount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, it.complain_receive_id || 'CMR001260000001', it.job_ref_no || '', it.product_id || 'PRD00001', it.product_group || '', it.product_name, it.product_description || '', it.received_serial || '', it.replace_in_serial || '', it.delivery_serial || '', Number(it.qty || 1), Number(it.amount || 0));

    const sn = it.delivery_serial || it.received_serial;
    if (sn) {
      db.prepare(`
        INSERT INTO serial_history (serial_no, old_serial, new_serial, transaction_type, transaction_id, transaction_date, cs_name, product_group, product_id, product_name, warranty, problem, amount, narration, branch_name)
        VALUES (?, ?, ?, 'REPLACEMENT_DELIVERY', ?, ?, ?, ?, ?, ?, 'Warranty', 'Resolved & Delivered', ?, ?, ?)
      `).run(sn, it.received_serial || sn, it.delivery_serial || sn, id, delivery_date, cs_name, it.product_group || '', it.product_id || 'PRD00001', it.product_name, Number(it.amount || 0), narration, sess.branchName);
    }
  }
  res.json({ ok: true, id, message: `Replacement Delivery ${id} saved.` });
});

// ==================== SERVICING BILL ====================
app.get('/api/servicing/bills', (req, res) => {
  const list = db.prepare(`SELECT * FROM service_bills ORDER BY service_bill_id DESC`).all().map(b => ({
    ...b,
    items: db.prepare(`SELECT * FROM service_bill_items WHERE service_bill_id = ?`).all(b.service_bill_id)
  }));
  res.json({ list });
});

app.post('/api/servicing/bills', (req, res) => {
  const sess = getSession(req);
  const { service_bill_id, ref_no = '', service_date, cash_customer = '', mobile_no = '', cs_group_name = '', customer_name = '', narration = '', engineer_name = '', discount_amount = 0, items = [] } = req.body;
  const isEdit = service_bill_id && db.prepare(`SELECT 1 FROM service_bills WHERE service_bill_id = ?`).get(service_bill_id);
  const id = isEdit ? service_bill_id : nextId('service_bills', 'service_bill_id', 'SVB00126', 7);
  if (isEdit) db.prepare(`DELETE FROM service_bill_items WHERE service_bill_id = ?`).run(id);

  const total_amount = items.reduce((s, it) => s + Number(it.qty || 1) * Number(it.unit_price || 0), 0);
  const net_payable = total_amount - Number(discount_amount || 0);
  db.prepare(`
    INSERT OR REPLACE INTO service_bills (service_bill_id, ref_no, service_date, cash_customer, mobile_no, cs_group_name, customer_name, narration, engineer_name, total_amount, discount_amount, net_payable, branch_name, user_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, ref_no, service_date, cash_customer, mobile_no, cs_group_name, customer_name, narration, engineer_name, total_amount, Number(discount_amount || 0), net_payable, sess.branchName, sess.userName);

  for (const it of items) {
    const qty = Number(it.qty || 1);
    const up = Number(it.unit_price || 0);
    db.prepare(`
      INSERT INTO service_bill_items (service_bill_id, problem_group, problem_id, problem_name, problem_description, service_group, service_id, service_name, service_description, qty, unit_price, total_price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, it.problem_group || '', it.problem_id || 'PR00000001', it.problem_name || '', it.problem_description || '', it.service_group || '', it.service_id || 'SV00000001', it.service_name || '', it.service_description || '', qty, up, qty * up);
  }
  res.json({ ok: true, id, message: `Service Bill ${id} saved.` });
});

// ==================== ACCOUNTS MODULE ====================
app.get('/api/accounts/all', (req, res) => {
  const payments = db.prepare(`SELECT * FROM payments ORDER BY payment_id DESC`).all();
  const collections = db.prepare(`SELECT * FROM collections ORDER BY collection_id DESC`).all();
  const bankTransactions = db.prepare(`SELECT * FROM bank_transactions ORDER BY bank_tr_id DESC`).all();
  const journalVouchers = db.prepare(`SELECT * FROM journal_vouchers ORDER BY voucher_id DESC`).all();
  const balanceTransfers = db.prepare(`SELECT * FROM balance_transfers ORDER BY transfer_id DESC`).all();
  const salaryProcesses = db.prepare(`SELECT * FROM salary_processes ORDER BY id DESC`).all();
  const waitingCheques = db.prepare(`SELECT * FROM cheque_books WHERE status IN ('WAITING_FOR_HONOR', 'WAITING_FOR_DEPOSIT') ORDER BY id DESC`).all();
  res.json({ payments, collections, bankTransactions, journalVouchers, balanceTransfers, salaryProcesses, waitingCheques });
});

app.post('/api/accounts/payment', (req, res) => {
  const sess = getSession(req);
  const {
    action = 'save', payment_id, ref_no = '', payment_date, cs_group = '', cs_name, narration = '',
    purchase_id = '', payment_type = 'CASH', bank_name = '', branch_name_bank = '',
    cheque_no = '', cheque_date = '', account_no = '', dishonor_type = '--Select--',
    dishonor_cheque_no = '', invoice_amount = 0, due_amount = 0, total_due_amount = 0, amount = 0
  } = req.body;
  if (action === 'delete') {
    db.prepare(`DELETE FROM payments WHERE payment_id = ?`).run(payment_id);
    logModification('PAYMENT', payment_id, 'DELETED', sess.userName, sess.branchName, `Payment ${payment_id} deleted`, Number(amount || 0));
    return res.json({ ok: true, message: 'Payment deleted.' });
  }
  const isEdit = payment_id && db.prepare(`SELECT 1 FROM payments WHERE payment_id = ?`).get(payment_id);
  const id = isEdit ? payment_id : nextId('payments', 'payment_id', 'PAY00126', 7);

  db.prepare(`
    INSERT OR REPLACE INTO payments (
      payment_id, ref_no, payment_date, cs_group, cs_name, narration, purchase_id, payment_type,
      bank_name, branch_name_bank, cheque_no, cheque_date, account_no, dishonor_type, dishonor_cheque_no,
      invoice_amount, due_amount, total_due_amount, amount, approved, branch_name, user_name
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Approved', ?, ?)
  `).run(id, ref_no, payment_date, cs_group, cs_name, narration, purchase_id, payment_type, bank_name, branch_name_bank, cheque_no, cheque_date, account_no, dishonor_type, dishonor_cheque_no, Number(invoice_amount || 0), Number(due_amount || 0), Number(total_due_amount || 0), Number(amount || 0), sess.branchName, sess.userName);

  if (cheque_no) {
    db.prepare(`UPDATE cheque_books SET status = 'WAITING_FOR_HONOR', transaction_type = 'PAYMENT', transaction_id = ?, trader_name = ?, transaction_date = ?, cheque_date = ?, amount = ? WHERE cheque_no = ?`)
      .run(id, cs_name, payment_date, cheque_date || payment_date, Number(amount || 0), cheque_no);
  }
  logModification('PAYMENT', id, isEdit ? 'EDITED' : 'CREATED', sess.userName, sess.branchName, `Payment Voucher ${id} (${cs_name})`, Number(amount || 0));
  res.json({ ok: true, id, message: `Payment Voucher ${id} saved.` });
});

app.post('/api/accounts/collection', (req, res) => {
  const sess = getSession(req);
  const {
    action = 'save', collection_id, ref_no = '', collection_date, on_condition = false,
    cs_group = '', cs_name, narration = '', sales_id = '', collection_type = 'CASH',
    bank_name = '', branch_name_bank = '', cheque_no = '', cheque_date = '', account_no = '',
    dishonor_type = '--Select--', dishonor_cheque_no = '', invoice_amount = 0, due_amount = 0, total_due_amount = 0, amount = 0
  } = req.body;
  if (action === 'delete') {
    db.prepare(`DELETE FROM collections WHERE collection_id = ?`).run(collection_id);
    logModification('COLLECTION', collection_id, 'DELETED', sess.userName, sess.branchName, `Collection ${collection_id} deleted`, Number(amount || 0));
    return res.json({ ok: true, message: 'Collection deleted.' });
  }
  const isEdit = collection_id && db.prepare(`SELECT 1 FROM collections WHERE collection_id = ?`).get(collection_id);
  const id = isEdit ? collection_id : nextId('collections', 'collection_id', 'COL00126', 7);

  db.prepare(`
    INSERT OR REPLACE INTO collections (
      collection_id, ref_no, collection_date, on_condition, cs_group, cs_name, narration, sales_id,
      collection_type, bank_name, branch_name_bank, cheque_no, cheque_date, account_no, dishonor_type, dishonor_cheque_no,
      invoice_amount, due_amount, total_due_amount, amount, approved, branch_name, user_name
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Approved', ?, ?)
  `).run(id, ref_no, collection_date, on_condition ? 1 : 0, cs_group, cs_name, narration, sales_id, collection_type, bank_name, branch_name_bank, cheque_no, cheque_date, account_no, dishonor_type, dishonor_cheque_no, Number(invoice_amount || 0), Number(due_amount || 0), Number(total_due_amount || 0), Number(amount || 0), sess.branchName, sess.userName);

  if (cheque_no) {
    db.prepare(`
      INSERT INTO cheque_books (bank_id, bank_name, bk_br_id, branch_name, account_no, cheque_no, status, transaction_type, transaction_id, trader_name, transaction_date, cheque_date, amount)
      VALUES ('BK001', ?, 'BKB001', ?, ?, ?, 'WAITING_FOR_DEPOSIT', 'COLLECTION', ?, ?, ?, ?, ?)
    `).run(bank_name || 'CUSTOMER BANK', branch_name_bank || 'MAIN', account_no || '', cheque_no, id, cs_name, collection_date, cheque_date || collection_date, Number(amount || 0));
  }
  logModification('COLLECTION', id, isEdit ? 'EDITED' : 'CREATED', sess.userName, sess.branchName, `Collection Voucher ${id} (${cs_name})`, Number(amount || 0));
  res.json({ ok: true, id, message: `Received Voucher ${id} saved.` });
});

app.post('/api/accounts/bank-transaction', (req, res) => {
  const sess = getSession(req);
  const { action = 'save', bank_tr_id, ref_no = '', tr_date, tr_type, cheque_no = '', account_no, cheque_date = '', narration = '', amount = 0 } = req.body;
  if (action === 'delete') {
    db.prepare(`DELETE FROM bank_transactions WHERE bank_tr_id = ?`).run(bank_tr_id);
    return res.json({ ok: true, message: 'Bank Transaction deleted.' });
  }
  const isEdit = bank_tr_id && db.prepare(`SELECT 1 FROM bank_transactions WHERE bank_tr_id = ?`).get(bank_tr_id);
  const id = isEdit ? bank_tr_id : nextId('bank_transactions', 'bank_tr_id', 'BTR00126', 7);
  const ba = db.prepare(`SELECT * FROM bank_accounts WHERE account_no = ?`).get(account_no);

  db.prepare(`
    INSERT OR REPLACE INTO bank_transactions (bank_tr_id, ref_no, tr_date, type_id, tr_type, cheque_no, account_no, bank_name, branch_name_bank, cheque_date, narration, amount, branch_name, user_name)
    VALUES (?, ?, ?, 'BTT01', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, ref_no, tr_date, tr_type, cheque_no, account_no, ba?.bank_name || 'ISLAMI BANK BANGLADESH PLC', ba?.branch_name || 'MOTIJHEEL', cheque_date, narration, Number(amount || 0), sess.branchName, sess.userName);

  if (cheque_no) {
    const newStatus = String(tr_type).toUpperCase().includes('DISHONOR') ? 'DISHONORED' : 'HONORED';
    db.prepare(`UPDATE cheque_books SET status = ? WHERE cheque_no = ?`).run(newStatus, cheque_no);
  }
  logModification('BANK_TR', id, isEdit ? 'EDITED' : 'CREATED', sess.userName, sess.branchName, `Bank Transaction ${id} (${tr_type})`, Number(amount || 0));
  res.json({ ok: true, id, message: `Bank Transaction ${id} saved.` });
});

app.post('/api/accounts/journal', (req, res) => {
  const sess = getSession(req);
  const {
    action = 'save', voucher_id, ref_no = '', voucher_date, tr_type = 'DR',
    acc_sub_group_id = '', acc_head = '', accounts_id = '', accounts_name,
    accounts_to = '', narration = '', sales_id = '', cheque_no = '', due_amount = 0, amount = 0
  } = req.body;
  if (action === 'delete') {
    db.prepare(`DELETE FROM journal_vouchers WHERE voucher_id = ?`).run(voucher_id);
    return res.json({ ok: true, message: 'Journal Voucher deleted.' });
  }
  const isEdit = voucher_id && db.prepare(`SELECT 1 FROM journal_vouchers WHERE voucher_id = ?`).get(voucher_id);
  const id = isEdit ? voucher_id : nextId('journal_vouchers', 'voucher_id', 'JRN00126', 7);
  const dr = tr_type === 'DR' ? Number(amount || 0) : 0;
  const cr = tr_type === 'CR' ? Number(amount || 0) : 0;

  db.prepare(`
    INSERT OR REPLACE INTO journal_vouchers (
      voucher_id, ref_no, voucher_date, tr_type, acc_sub_group_id, acc_head, accounts_id, accounts_name,
      accounts_to, narration, sales_id, cheque_no, due_amount, dr_amount, cr_amount, branch_name, user_name
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, ref_no, voucher_date, tr_type, acc_sub_group_id, acc_head, accounts_id || 'ACC0002', accounts_name, accounts_to, narration, sales_id, cheque_no, Number(due_amount || 0), dr, cr, sess.branchName, sess.userName);

  logModification('JOURNAL', id, isEdit ? 'EDITED' : 'CREATED', sess.userName, sess.branchName, `Journal Voucher ${id} (${accounts_name})`, Number(amount || 0));
  res.json({ ok: true, id, message: `Journal Voucher ${id} saved.` });
});

app.post('/api/accounts/salary-process', (req, res) => {
  const sess = getSession(req);
  const { action = 'preview', accounts_name = 'SALARY EXPENSES', process_date = '23/11/2026', year = '2026', month = '11' } = req.body;
  const emps = db.prepare(`SELECT * FROM employees WHERE active = 'Y' AND salary_type = 'Y' ORDER BY employee_id`).all();

  if (action === 'delete') {
    db.prepare(`DELETE FROM salary_processes WHERE year = ? AND month = ?`).run(String(year), String(month));
    return res.json({ ok: true, rows: [], message: `Processed salary for ${month}/${year} deleted.` });
  }

  if (action === 'process') {
    db.prepare(`DELETE FROM salary_processes WHERE year = ? AND month = ?`).run(String(year), String(month));
    const ins = db.prepare(`
      INSERT INTO salary_processes (process_id, accounts_name, process_date, year, month, employee_id, employee_name, designation, basic_salary, gross_salary, status, branch_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PROCESSED', ?)
    `);
    let totalGross = 0;
    for (const e of emps) {
      ins.run(`SAL-${year}-${month}-${e.employee_id}`, accounts_name, process_date, String(year), String(month), e.employee_id, e.employee_name, e.designation, e.basic_salary, e.gross_salary, sess.branchName);
      totalGross += Number(e.gross_salary || 0);
    }
    const jId = nextId('journal_vouchers', 'voucher_id', 'JRN00126', 7);
    db.prepare(`
      INSERT INTO journal_vouchers (voucher_id, ref_no, voucher_date, tr_type, acc_sub_group_id, acc_head, accounts_id, accounts_name, accounts_to, narration, dr_amount, cr_amount, branch_name, user_name)
      VALUES (?, ?, ?, 'DR', 'ASG002', 'SALARY & ALLOWANCES', 'ACC0001', ?, 'CASH IN HAND', ?, ?, 0, ?, ?)
    `).run(jId, `SAL-${month}-${year}`, process_date, accounts_name, `Monthly Salary Process for ${month}/${year}`, totalGross, sess.branchName, sess.userName);

    const rows = db.prepare(`SELECT * FROM salary_processes WHERE year = ? AND month = ?`).all(String(year), String(month));
    return res.json({ ok: true, rows, message: `Salary processed for ${emps.length} active employees (Total: ${totalGross.toFixed(2)} BDT).` });
  }

  // Preview
  const existing = db.prepare(`SELECT * FROM salary_processes WHERE year = ? AND month = ?`).all(String(year), String(month));
  const rows = existing.length > 0 ? existing : emps.map(e => ({
    process_id: `PREVIEW-${year}-${month}-${e.employee_id}`,
    accounts_name,
    process_date,
    year,
    month,
    employee_id: e.employee_id,
    employee_name: e.employee_name,
    designation: e.designation,
    basic_salary: e.basic_salary,
    gross_salary: e.gross_salary,
    status: 'READY TO PROCESS'
  }));
  res.json({ ok: true, rows });
});

app.post('/api/accounts/balance-transfer', (req, res) => {
  const sess = getSession(req);
  const { action = 'save', transfer_id, ref_no = '', transfer_date, transfer_to, tr_type = 'CASH', account_no = '', narration = '', amount = 0 } = req.body;
  if (action === 'delete') {
    db.prepare(`DELETE FROM balance_transfers WHERE transfer_id = ?`).run(transfer_id);
    return res.json({ ok: true, message: 'Balance Transfer deleted.' });
  }
  const isEdit = transfer_id && db.prepare(`SELECT 1 FROM balance_transfers WHERE transfer_id = ?`).get(transfer_id);
  const id = isEdit ? transfer_id : nextId('balance_transfers', 'transfer_id', 'BLT00126', 7);
  db.prepare(`
    INSERT OR REPLACE INTO balance_transfers (transfer_id, ref_no, transfer_date, transfer_from, transfer_to, tr_type, account_no, narration, amount, approved, user_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Approved', ?)
  `).run(id, ref_no, transfer_date, sess.branchName, transfer_to, tr_type, account_no, narration, Number(amount || 0), sess.userName);
  res.json({ ok: true, id, message: `Balance Transfer ${id} saved.` });
});

// ==================== ADMIN TOOLS: DAILY BUSINESS & DATABASE BACKUP ====================
app.get('/api/admin/daily-business', (req, res) => {
  const { date1 = '', date2 = '', branch = '' } = req.query;

  const purchases = db.prepare(`SELECT * FROM purchases`).all().filter(r => inDateRange(r.purchase_date, date1, date2) && (!branch || r.branch_name === branch));
  const purchaseReturns = db.prepare(`SELECT * FROM purchase_returns`).all().filter(r => inDateRange(r.return_date, date1, date2) && (!branch || r.branch_name === branch));
  const sales = db.prepare(`SELECT * FROM sales`).all().filter(r => inDateRange(r.sales_date, date1, date2) && (!branch || r.branch_name === branch));
  const salesReturns = db.prepare(`SELECT * FROM sales_returns`).all().filter(r => inDateRange(r.return_date, date1, date2) && (!branch || r.branch_name === branch));
  const collections = db.prepare(`SELECT * FROM collections`).all().filter(r => inDateRange(r.collection_date, date1, date2) && (!branch || r.branch_name === branch));
  const payments = db.prepare(`SELECT * FROM payments`).all().filter(r => inDateRange(r.payment_date, date1, date2) && (!branch || r.branch_name === branch));
  const expenses = db.prepare(`SELECT * FROM journal_vouchers`).all().filter(r => inDateRange(r.voucher_date, date1, date2) && (!branch || r.branch_name === branch));

  const sumPurchase = purchases.reduce((s, r) => s + Number(r.net_payable || 0), 0);
  const sumPurRet = purchaseReturns.reduce((s, r) => s + Number(r.net_amount || 0), 0);
  const sumSales = sales.reduce((s, r) => s + Number(r.net_payable || 0), 0);
  const sumSalRet = salesReturns.reduce((s, r) => s + Number(r.net_amount || 0), 0);
  const sumCollection = collections.reduce((s, r) => s + Number(r.amount || 0), 0);
  const sumPayment = payments.reduce((s, r) => s + Number(r.amount || 0), 0);
  const sumExpense = expenses.reduce((s, r) => s + Number(r.dr_amount || 0), 0);

  // Stock Valuation
  const prods = db.prepare(`SELECT * FROM products`).all();
  let stockValue = 0;
  for (const p of prods) {
    const qty = db.prepare(`SELECT COALESCE(SUM(qty), 0) AS q FROM stock_balances WHERE product_id = ? AND stock_type = 'COMMERCIAL'`).get(p.product_id).q;
    stockValue += Number(qty || 0) * Number(p.purchase_price || 0);
  }

  // Receivables & Payables
  const traders = db.prepare(`SELECT * FROM traders`).all();
  let receivable = 0, payable = 0;
  for (const t of traders) {
    if (t.trader_type === 'C') {
      const s = db.prepare(`SELECT COALESCE(SUM(net_payable), 0) AS v FROM sales WHERE cs_name = ?`).get(t.cs_name).v;
      const c = db.prepare(`SELECT COALESCE(SUM(amount), 0) AS v FROM collections WHERE cs_name = ?`).get(t.cs_name).v;
      receivable += Number(t.opening_balance || 0) + s - c;
    } else {
      const p = db.prepare(`SELECT COALESCE(SUM(net_payable), 0) AS v FROM purchases WHERE cs_name = ?`).get(t.cs_name).v;
      const py = db.prepare(`SELECT COALESCE(SUM(amount), 0) AS v FROM payments WHERE cs_name = ?`).get(t.cs_name).v;
      payable += Number(t.opening_balance || 0) + p - py;
    }
  }

  const bankBook = db.prepare(`SELECT COALESCE(SUM(balance), 0) AS v FROM bank_accounts`).get().v;
  const cashBook = db.prepare(`SELECT COALESCE(SUM(balance), 0) AS v FROM account_ledgers WHERE accounts_name = 'CASH IN HAND'`).get().v + sumCollection - sumPayment - sumExpense;
  const profitLoss = (sumSales - sumSalRet) * 0.18 - sumExpense;

  // GridView11: Collection Type | NOP Customer | Amount
  const collByType = {};
  for (const c of collections) {
    const k = c.collection_type || 'CASH';
    if (!collByType[k]) collByType[k] = { type: k, count: 0, amount: 0 };
    collByType[k].count += 1;
    collByType[k].amount += Number(c.amount || 0);
  }
  const gridView11 = Object.values(collByType);
  if (gridView11.length === 0) gridView11.push({ type: 'CASH', count: 0, amount: 0 }, { type: 'ADJUSTMENT', count: 0, amount: 0 });

  // GridView12: Payment Type | NOP Supplier | Amount
  const payByType = {};
  for (const p of payments) {
    const k = p.payment_type || 'CASH';
    if (!payByType[k]) payByType[k] = { type: k, count: 0, amount: 0 };
    payByType[k].count += 1;
    payByType[k].amount += Number(p.amount || 0);
  }
  const gridView12 = Object.values(payByType);
  if (gridView12.length === 0) gridView12.push({ type: 'CASH', count: 0, amount: 0 }, { type: 'ADJUSTMENT', count: 0, amount: 0 });

  // GridView13: Account No. | Amount
  const gridView13 = db.prepare(`SELECT account_no, balance AS amount FROM bank_accounts`).all();

  res.json({
    cards: {
      purchase: sumPurchase,
      purchaseReturn: sumPurRet,
      sales: sumSales,
      salesReturn: sumSalRet,
      stock: stockValue,
      receivable,
      payable,
      profitLoss,
      collection: sumCollection,
      payment: sumPayment,
      bankBook,
      cashBook
    },
    gridView11,
    gridView12,
    gridView13
  });
});

app.post('/api/admin/backup', (req, res) => {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dest = path.join(BACKUP_DIR, `HAZI_ERP_BACKUP_${stamp}.db`);
  fs.copyFileSync(DB_PATH, dest);
  res.json({ ok: true, filename: path.basename(dest), path: dest, message: `Server Backup created: ${path.basename(dest)}` });
});

app.get('/api/admin/client-backup', (req, res) => {
  res.download(DB_PATH, `HAZI_ERP_BACKUP_${new Date().toISOString().slice(0, 10)}.db`);
});

app.get('/api/admin/net-test', (req, res) => {
  const t0 = Date.now();
  const tables = db.prepare(`SELECT COUNT(*) AS cnt FROM sqlite_master WHERE type='table'`).get().cnt;
  res.json({ ok: true, latencyMs: Date.now() - t0 + 1, tables, status: 'CONNECTED (SQLite WAL Active)' });
});

// ==================== DYNAMIC REPORTS & EXCEL EXPORT ====================
app.post('/api/reports/run', (req, res) => {
  const { category, reportName, filters } = req.body;
  const result = generateReportData(category, reportName, filters || {});
  res.json({ ok: true, report: result });
});

app.post('/api/reports/excel', (req, res) => {
  const { category, reportName, filters } = req.body;
  const result = generateReportData(category, reportName, filters || {});

  const sheetData = [
    ['HAZI TRADERS — ENTERPRISE RESOURCE PLANNING'],
    [result.title],
    [`Date Range: ${filters?.date1 || 'All'} To ${filters?.date2 || 'All'}`],
    [],
    result.columns,
    ...result.rows
  ];
  if (result.summary && Object.keys(result.summary).length > 0) {
    sheetData.push([]);
    for (const [k, v] of Object.entries(result.summary)) {
      sheetData.push([k, v]);
    }
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  const safeName = String(result.title || 'Report').replace(/[^a-zA-Z0-9_-]/g, '_');
  res.setHeader('Content-Disposition', `attachment; filename="${safeName}.xlsx"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
});

// ==================== SERVE BUILT FRONTEND ====================
const distDir = path.join(ROOT_DIR, 'dist');
const publicDir = path.join(ROOT_DIR, 'client', 'public');
app.use('/IMAGE', express.static(path.join(publicDir, 'IMAGE')));

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

const PORT = process.env.PORT || 5050;
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`HaziERP Backend & Web Server running at http://localhost:${PORT}`);
    pushSnapshotToSupabase().catch(() => {});
  });
}

export default app;
