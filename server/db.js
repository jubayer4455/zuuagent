import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const dataDir = isServerless ? path.join(os.tmpdir(), 'hazi-erp-data') : path.join(__dirname, 'data');
const backupDir = path.join(dataDir, 'backups');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

export const DB_PATH = path.join(dataDir, 'hazierp.db');
export const BACKUP_DIR = backupDir;
export const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zlotgghqdfrbxeuinjjy.supabase.co';
export const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsb3RnZ2hxZGZyYnhldWluamp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4MDQzMTUsImV4cCI6MjEwNzM4MDMxNX0.-5C5gZzyi595pPdR6SB7eWb2lcchAz2qmXWnNHWaRBg';

let dbInstance;
try {
  const sqliteMod = await import('node:sqlite');
  dbInstance = new sqliteMod.DatabaseSync(DB_PATH);
  dbInstance.exec('PRAGMA journal_mode = WAL;');
  dbInstance.exec('PRAGMA foreign_keys = OFF;');
} catch {
  const initSqlJs = (await import('sql.js')).default;
  const SQL = await initSqlJs();
  const rawDb = fs.existsSync(DB_PATH) ? new SQL.Database(fs.readFileSync(DB_PATH)) : new SQL.Database();
  dbInstance = {
    exec(sql) {
      rawDb.run(sql);
    },
    prepare(sql) {
      return {
        all(...params) {
          const stmt = rawDb.prepare(sql);
          stmt.bind(params);
          const rows = [];
          while (stmt.step()) rows.push(stmt.getAsObject());
          stmt.free();
          return rows;
        },
        get(...params) {
          const rows = this.all(...params);
          return rows[0] || undefined;
        },
        run(...params) {
          rawDb.run(sql, params);
          return { changes: 1 };
        }
      };
    }
  };
}

export const db = dbInstance;

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS companies (
      company_id TEXT PRIMARY KEY,
      company_name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS branches (
      branch_id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      branch_name TEXT NOT NULL,
      address TEXT DEFAULT 'DHAKA',
      phone TEXT DEFAULT '01818524712, 01402338209',
      email TEXT DEFAULT 'info@hazierp.top',
      manager_name TEXT DEFAULT 'JUBAYER AHMED',
      status TEXT DEFAULT 'ACTIVE',
      logo_url TEXT DEFAULT '/IMAGE/unisoft.svg',
      invoice_footer TEXT DEFAULT 'Warranty void if sticker removed or burn/physical damage.'
    );

    CREATE TABLE IF NOT EXISTS stores (
      store_id TEXT PRIMARY KEY,
      store_name TEXT NOT NULL UNIQUE,
      branch_name TEXT DEFAULT 'HAZI TRADERS'
    );

    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY,
      user_name TEXT NOT NULL,
      password TEXT NOT NULL,
      father_name TEXT DEFAULT '',
      mother_name TEXT DEFAULT '',
      address TEXT DEFAULT '',
      email TEXT DEFAULT '',
      mobile TEXT DEFAULT '',
      opt_mobile TEXT DEFAULT '',
      permission_type TEXT DEFAULT 'A',
      operate_company TEXT DEFAULT 'HAZI TRADERS',
      active TEXT DEFAULT 'Y',
      permissions_json TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS modification_logs (
      log_id INTEGER PRIMARY KEY AUTOINCREMENT,
      log_type TEXT NOT NULL,
      transaction_id TEXT NOT NULL,
      action TEXT NOT NULL,
      user_name TEXT NOT NULL,
      branch_name TEXT DEFAULT 'HAZI TRADERS',
      log_date TEXT NOT NULL,
      details TEXT DEFAULT '',
      amount REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- PRIMARY SETUP
    CREATE TABLE IF NOT EXISTS trader_groups (
      group_id TEXT PRIMARY KEY,
      group_name TEXT NOT NULL,
      active TEXT DEFAULT 'Y'
    );

    CREATE TABLE IF NOT EXISTS traders (
      cs_id TEXT PRIMARY KEY,
      cs_name TEXT NOT NULL,
      group_id TEXT DEFAULT '',
      group_name TEXT DEFAULT '',
      mpo_id TEXT DEFAULT '',
      mpo_name TEXT DEFAULT '',
      address TEXT DEFAULT '',
      mobile TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      contact_person TEXT DEFAULT '',
      credit_limit REAL DEFAULT 0,
      bin TEXT DEFAULT '',
      opening_balance REAL DEFAULT 0,
      trader_type TEXT DEFAULT 'C',
      customer_type TEXT DEFAULT 'RETAILER',
      active TEXT DEFAULT 'Y',
      branch_name TEXT DEFAULT 'HAZI TRADERS'
    );

    CREATE TABLE IF NOT EXISTS categories (
      category_id TEXT PRIMARY KEY,
      category_name TEXT NOT NULL,
      active TEXT DEFAULT 'Y'
    );

    CREATE TABLE IF NOT EXISTS product_groups (
      group_id TEXT PRIMARY KEY,
      group_name TEXT NOT NULL,
      active TEXT DEFAULT 'Y'
    );

    CREATE TABLE IF NOT EXISTS brands (
      brand_id TEXT PRIMARY KEY,
      brand_name TEXT NOT NULL,
      active TEXT DEFAULT 'Y'
    );

    CREATE TABLE IF NOT EXISTS colors (
      color_id TEXT PRIMARY KEY,
      color_name TEXT NOT NULL,
      active TEXT DEFAULT 'Y'
    );

    CREATE TABLE IF NOT EXISTS products (
      product_id TEXT PRIMARY KEY,
      product_name TEXT NOT NULL,
      category_id TEXT DEFAULT '',
      category_name TEXT DEFAULT '',
      group_id TEXT DEFAULT '',
      group_name TEXT DEFAULT '',
      brand_id TEXT DEFAULT '',
      brand_name TEXT DEFAULT '',
      barcode_id TEXT DEFAULT '',
      description TEXT DEFAULT '',
      location TEXT DEFAULT '',
      color TEXT DEFAULT '',
      size TEXT DEFAULT '',
      serial_item TEXT DEFAULT 'N',
      inventory_item TEXT DEFAULT 'Y',
      purchase_price REAL DEFAULT 0,
      sales_price REAL DEFAULT 0,
      unit TEXT DEFAULT 'PCS',
      discount REAL DEFAULT 0,
      wholesale_price REAL DEFAULT 0,
      dealer_price REAL DEFAULT 0,
      wholesale_comm REAL DEFAULT 0,
      dealer_comm REAL DEFAULT 0,
      sales_comm REAL DEFAULT 0,
      warranty TEXT DEFAULT '1 Year',
      reorder_level REAL DEFAULT 0,
      red_level REAL DEFAULT 0,
      vat REAL DEFAULT 0,
      level_qty REAL DEFAULT 0,
      active TEXT DEFAULT 'Y',
      image_url TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS branch_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_name TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      group_name TEXT DEFAULT '',
      brand_name TEXT DEFAULT '',
      purchase_price REAL DEFAULT 0,
      sales_price_with_tax REAL DEFAULT 0,
      sales_price_without_tax REAL DEFAULT 0,
      wholesale_price REAL DEFAULT 0,
      dealer_price REAL DEFAULT 0,
      red_level REAL DEFAULT 0,
      UNIQUE(branch_name, product_id)
    );

    -- ACCOUNTS SETUP
    CREATE TABLE IF NOT EXISTS account_sub_groups (
      sub_group_id TEXT PRIMARY KEY,
      sub_group_name TEXT NOT NULL,
      group_id TEXT NOT NULL,
      group_name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS account_ledgers (
      accounts_id TEXT PRIMARY KEY,
      accounts_name TEXT NOT NULL,
      sub_group_id TEXT DEFAULT '',
      sub_group_name TEXT DEFAULT '',
      group_name TEXT DEFAULT '',
      balance REAL DEFAULT 0,
      active TEXT DEFAULT 'Y'
    );

    CREATE TABLE IF NOT EXISTS banks (
      bank_id TEXT PRIMARY KEY,
      bank_name TEXT NOT NULL,
      active TEXT DEFAULT 'Y'
    );

    CREATE TABLE IF NOT EXISTS bank_accounts (
      bk_br_id TEXT PRIMARY KEY,
      bank_id TEXT NOT NULL,
      bank_name TEXT NOT NULL,
      branch_name TEXT NOT NULL,
      address TEXT DEFAULT '',
      routing_no TEXT DEFAULT '',
      contact_person TEXT DEFAULT '',
      contact_no TEXT DEFAULT '',
      email TEXT DEFAULT '',
      account_no TEXT NOT NULL,
      balance REAL DEFAULT 0,
      active TEXT DEFAULT 'Y',
      account_type TEXT DEFAULT 'GENARAL'
    );

    CREATE TABLE IF NOT EXISTS cheque_books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bank_id TEXT NOT NULL,
      bank_name TEXT NOT NULL,
      bk_br_id TEXT NOT NULL,
      branch_name TEXT NOT NULL,
      account_no TEXT NOT NULL,
      cheque_no TEXT NOT NULL,
      status TEXT DEFAULT 'UNUSED',
      transaction_type TEXT DEFAULT '',
      transaction_id TEXT DEFAULT '',
      trader_name TEXT DEFAULT '',
      transaction_date TEXT DEFAULT '',
      cheque_date TEXT DEFAULT '',
      amount REAL DEFAULT 0
    );

    -- HRM
    CREATE TABLE IF NOT EXISTS employees (
      employee_id TEXT PRIMARY KEY,
      employee_name TEXT NOT NULL,
      father_name TEXT DEFAULT '',
      mother_name TEXT DEFAULT '',
      address TEXT DEFAULT '',
      email TEXT DEFAULT '',
      mobile TEXT DEFAULT '',
      family_mobile TEXT DEFAULT '',
      education TEXT DEFAULT '',
      joining_date TEXT DEFAULT '',
      basic_salary REAL DEFAULT 0,
      gross_salary REAL DEFAULT 0,
      designation TEXT DEFAULT '',
      opening_balance REAL DEFAULT 0,
      active TEXT DEFAULT 'Y',
      employee_type TEXT DEFAULT 'Y',
      salary_type TEXT DEFAULT 'Y'
    );

    CREATE TABLE IF NOT EXISTS salary_processes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      process_id TEXT NOT NULL,
      accounts_name TEXT DEFAULT 'SALARY EXPENSES',
      process_date TEXT NOT NULL,
      year TEXT NOT NULL,
      month TEXT NOT NULL,
      employee_id TEXT NOT NULL,
      employee_name TEXT NOT NULL,
      designation TEXT DEFAULT '',
      basic_salary REAL DEFAULT 0,
      gross_salary REAL DEFAULT 0,
      status TEXT DEFAULT 'PROCESSED',
      branch_name TEXT DEFAULT 'HAZI TRADERS'
    );

    -- INVENTORY & SERIAL ENGINE
    CREATE TABLE IF NOT EXISTS stock_balances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_name TEXT NOT NULL,
      store_name TEXT NOT NULL,
      product_id TEXT NOT NULL,
      stock_type TEXT DEFAULT 'COMMERCIAL',
      qty REAL DEFAULT 0,
      UNIQUE(branch_name, store_name, product_id, stock_type)
    );

    CREATE TABLE IF NOT EXISTS product_serials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      serial_no TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT DEFAULT '',
      product_group TEXT DEFAULT '',
      branch_name TEXT DEFAULT 'HAZI TRADERS',
      store_name TEXT DEFAULT 'SHOW ROOM',
      stock_type TEXT DEFAULT 'COMMERCIAL',
      status TEXT DEFAULT 'IN_STOCK',
      purchase_id TEXT DEFAULT '',
      purchase_date TEXT DEFAULT '',
      supplier_name TEXT DEFAULT '',
      sales_id TEXT DEFAULT '',
      sales_date TEXT DEFAULT '',
      customer_name TEXT DEFAULT '',
      warranty TEXT DEFAULT '',
      unit_price REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS serial_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      serial_no TEXT NOT NULL,
      old_serial TEXT DEFAULT '',
      new_serial TEXT DEFAULT '',
      transaction_type TEXT NOT NULL,
      transaction_id TEXT NOT NULL,
      transaction_date TEXT NOT NULL,
      cs_name TEXT DEFAULT '',
      product_group TEXT DEFAULT '',
      product_id TEXT DEFAULT '',
      product_name TEXT DEFAULT '',
      warranty TEXT DEFAULT '',
      problem TEXT DEFAULT '',
      amount REAL DEFAULT 0,
      narration TEXT DEFAULT '',
      branch_name TEXT DEFAULT 'HAZI TRADERS'
    );

    -- TRADING: PURCHASE, PURCHASE RETURN, QUOTATION, SALES, SALES RETURN
    CREATE TABLE IF NOT EXISTS purchases (
      purchase_id TEXT PRIMARY KEY,
      ref_no TEXT DEFAULT '',
      purchase_date TEXT NOT NULL,
      cs_group TEXT DEFAULT '',
      cs_id TEXT DEFAULT '',
      cs_name TEXT NOT NULL,
      store_name TEXT DEFAULT 'SHOW ROOM',
      narration TEXT DEFAULT '',
      commenc_date TEXT DEFAULT '',
      total_amount REAL DEFAULT 0,
      vat_amount REAL DEFAULT 0,
      discount_amount REAL DEFAULT 0,
      net_payable REAL DEFAULT 0,
      payment_amount REAL DEFAULT 0,
      branch_name TEXT DEFAULT 'HAZI TRADERS',
      user_name TEXT DEFAULT 'JUBAYER',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS purchase_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_group TEXT DEFAULT '',
      product_name TEXT NOT NULL,
      product_description TEXT DEFAULT '',
      warranty TEXT DEFAULT '',
      expiry_date TEXT DEFAULT '',
      serial_no TEXT DEFAULT '',
      qty REAL DEFAULT 1,
      unit_price REAL DEFAULT 0,
      total_price REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS purchase_returns (
      return_id TEXT PRIMARY KEY,
      ref_no TEXT DEFAULT '',
      return_date TEXT NOT NULL,
      purchase_id TEXT DEFAULT '',
      purchase_amount REAL DEFAULT 0,
      cs_group TEXT DEFAULT '',
      cs_id TEXT DEFAULT '',
      cs_name TEXT NOT NULL,
      store_name TEXT DEFAULT 'SHOW ROOM',
      narration TEXT DEFAULT '',
      total_amount REAL DEFAULT 0,
      vat_amount REAL DEFAULT 0,
      net_amount REAL DEFAULT 0,
      branch_name TEXT DEFAULT 'HAZI TRADERS',
      user_name TEXT DEFAULT 'JUBAYER'
    );

    CREATE TABLE IF NOT EXISTS purchase_return_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      return_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_group TEXT DEFAULT '',
      product_name TEXT NOT NULL,
      product_description TEXT DEFAULT '',
      warranty TEXT DEFAULT '',
      serial_no TEXT DEFAULT '',
      qty REAL DEFAULT 1,
      unit_price REAL DEFAULT 0,
      total_price REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS price_quotations (
      quotation_id TEXT PRIMARY KEY,
      ref_no TEXT DEFAULT '',
      quotation_date TEXT NOT NULL,
      mobile_no TEXT DEFAULT '',
      subject TEXT DEFAULT '',
      cash_customer TEXT DEFAULT '',
      narration TEXT DEFAULT '',
      conditions TEXT DEFAULT '1. Price validity 15 days. 2. Delivery within 3 days after confirmed order.',
      cs_group TEXT DEFAULT '',
      cs_id TEXT DEFAULT '',
      customer_name TEXT DEFAULT '',
      store_name TEXT DEFAULT 'SHOW ROOM',
      total_amount REAL DEFAULT 0,
      service_charge REAL DEFAULT 0,
      others_charge REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      vat_amount REAL DEFAULT 0,
      discount_amount REAL DEFAULT 0,
      net_payable REAL DEFAULT 0,
      branch_name TEXT DEFAULT 'HAZI TRADERS',
      user_name TEXT DEFAULT 'JUBAYER'
    );

    CREATE TABLE IF NOT EXISTS price_quotation_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quotation_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_group TEXT DEFAULT '',
      product_name TEXT NOT NULL,
      product_description TEXT DEFAULT '',
      item_remarks TEXT DEFAULT '',
      warranty TEXT DEFAULT '',
      qty REAL DEFAULT 1,
      unit_price REAL DEFAULT 0,
      vat_percent REAL DEFAULT 0,
      total_price REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sales (
      sales_id TEXT PRIMARY KEY,
      ref_no TEXT DEFAULT '',
      sales_date TEXT NOT NULL,
      mobile_no TEXT DEFAULT '',
      cs_group TEXT DEFAULT '',
      cs_id TEXT DEFAULT '',
      cs_name TEXT NOT NULL,
      cash_customer_name TEXT DEFAULT '',
      store_name TEXT DEFAULT 'SHOW ROOM',
      price_tier TEXT DEFAULT 'SALES_PRICE',
      sales_type TEXT DEFAULT 'CREDIT',
      collection_type TEXT DEFAULT 'CASH',
      account_no TEXT DEFAULT '',
      advance_sales INTEGER DEFAULT 0,
      narration TEXT DEFAULT '',
      total_amount REAL DEFAULT 0,
      service_charge REAL DEFAULT 0,
      extra_charge REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      vat_amount REAL DEFAULT 0,
      discount_amount REAL DEFAULT 0,
      net_payable REAL DEFAULT 0,
      collection_amount REAL DEFAULT 0,
      approved TEXT DEFAULT 'Approved',
      branch_name TEXT DEFAULT 'HAZI TRADERS',
      user_name TEXT DEFAULT 'JUBAYER',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sales_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sales_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_group TEXT DEFAULT '',
      product_name TEXT NOT NULL,
      product_description TEXT DEFAULT '',
      item_remarks TEXT DEFAULT '',
      warranty TEXT DEFAULT '',
      serial_no TEXT DEFAULT '',
      qty REAL DEFAULT 1,
      unit_price REAL DEFAULT 0,
      cost_price REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      vat_percent REAL DEFAULT 0,
      total_price REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sales_returns (
      return_id TEXT PRIMARY KEY,
      ref_no TEXT DEFAULT '',
      return_date TEXT NOT NULL,
      sales_id TEXT DEFAULT '',
      invoice_amount REAL DEFAULT 0,
      cs_group TEXT DEFAULT '',
      cs_id TEXT DEFAULT '',
      cs_name TEXT NOT NULL,
      store_name TEXT DEFAULT 'SHOW ROOM',
      narration TEXT DEFAULT '',
      total_amount REAL DEFAULT 0,
      vat_amount REAL DEFAULT 0,
      net_amount REAL DEFAULT 0,
      branch_name TEXT DEFAULT 'HAZI TRADERS',
      user_name TEXT DEFAULT 'JUBAYER'
    );

    CREATE TABLE IF NOT EXISTS sales_return_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      return_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_group TEXT DEFAULT '',
      product_name TEXT NOT NULL,
      product_description TEXT DEFAULT '',
      warranty TEXT DEFAULT '',
      serial_no TEXT DEFAULT '',
      qty REAL DEFAULT 1,
      unit_price REAL DEFAULT 0,
      cost_price REAL DEFAULT 0,
      total_price REAL DEFAULT 0
    );

    -- STOCK TRANSFERS
    CREATE TABLE IF NOT EXISTS stock_transfers (
      transfer_id TEXT PRIMARY KEY,
      transfer_mode TEXT NOT NULL,
      ref_no TEXT DEFAULT '',
      transfer_date TEXT NOT NULL,
      from_branch TEXT DEFAULT 'HAZI TRADERS',
      to_branch TEXT DEFAULT 'HAZI TRADERS',
      from_store TEXT DEFAULT 'SHOW ROOM',
      to_store TEXT DEFAULT 'SHOW ROOM',
      narration TEXT DEFAULT '',
      approved TEXT DEFAULT 'Approved',
      received TEXT DEFAULT 'Pending',
      user_name TEXT DEFAULT 'JUBAYER'
    );

    CREATE TABLE IF NOT EXISTS stock_transfer_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transfer_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_group TEXT DEFAULT '',
      product_name TEXT NOT NULL,
      product_description TEXT DEFAULT '',
      serial_no TEXT DEFAULT '',
      qty REAL DEFAULT 1
    );

    -- RMA
    CREATE TABLE IF NOT EXISTS rma_complains (
      receive_id TEXT PRIMARY KEY,
      ref_no TEXT DEFAULT '',
      receive_date TEXT NOT NULL,
      cash_customer TEXT DEFAULT '',
      mobile_no TEXT DEFAULT '',
      narration TEXT DEFAULT '',
      cs_group TEXT DEFAULT '',
      cs_name TEXT DEFAULT '',
      store_name TEXT DEFAULT 'SHOW ROOM',
      total_amount REAL DEFAULT 0,
      branch_name TEXT DEFAULT 'HAZI TRADERS',
      user_name TEXT DEFAULT 'JUBAYER'
    );

    CREATE TABLE IF NOT EXISTS rma_complain_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receive_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_group TEXT DEFAULT '',
      product_name TEXT NOT NULL,
      product_description TEXT DEFAULT '',
      item_remarks TEXT DEFAULT '',
      sold_serial TEXT DEFAULT '',
      received_serial TEXT DEFAULT '',
      under_warranty TEXT DEFAULT 'Y',
      warranty TEXT DEFAULT '',
      sales_id TEXT DEFAULT '',
      sales_date TEXT DEFAULT '',
      no_of_times TEXT DEFAULT '1',
      job_ref_no TEXT DEFAULT '',
      delivery_date TEXT DEFAULT '',
      problem_name TEXT DEFAULT '',
      engineer_name TEXT DEFAULT '',
      qty REAL DEFAULT 1,
      unit_price REAL DEFAULT 0,
      total_price REAL DEFAULT 0,
      charge_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'RECEIVED'
    );

    CREATE TABLE IF NOT EXISTS rma_replace_outs (
      out_id TEXT PRIMARY KEY,
      ref_no TEXT DEFAULT '',
      out_date TEXT NOT NULL,
      cs_group TEXT DEFAULT '',
      cs_name TEXT DEFAULT '',
      narration TEXT DEFAULT '',
      store_name TEXT DEFAULT 'SHOW ROOM',
      total_amount REAL DEFAULT 0,
      branch_name TEXT DEFAULT 'HAZI TRADERS',
      user_name TEXT DEFAULT 'JUBAYER'
    );

    CREATE TABLE IF NOT EXISTS rma_replace_out_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      out_id TEXT NOT NULL,
      receive_id TEXT DEFAULT '',
      product_id TEXT NOT NULL,
      product_group TEXT DEFAULT '',
      product_name TEXT NOT NULL,
      product_description TEXT DEFAULT '',
      purchase_serial TEXT DEFAULT '',
      out_serial TEXT DEFAULT '',
      under_warranty TEXT DEFAULT 'Y',
      purchase_id TEXT DEFAULT '',
      purchase_date TEXT DEFAULT '',
      no_of_times TEXT DEFAULT '1',
      job_ref_no TEXT DEFAULT '',
      in_date TEXT DEFAULT '',
      problem_name TEXT DEFAULT '',
      engineer_name TEXT DEFAULT '',
      qty REAL DEFAULT 1,
      unit_price REAL DEFAULT 0,
      charge_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'SENT_OUT'
    );

    CREATE TABLE IF NOT EXISTS rma_replace_ins (
      in_id TEXT PRIMARY KEY,
      ref_no TEXT DEFAULT '',
      in_date TEXT NOT NULL,
      cs_group TEXT DEFAULT '',
      cs_name TEXT DEFAULT '',
      narration TEXT DEFAULT '',
      store_name TEXT DEFAULT 'SHOW ROOM',
      adjustment_type TEXT DEFAULT 'Without Adjustment',
      total_amount REAL DEFAULT 0,
      branch_name TEXT DEFAULT 'HAZI TRADERS',
      user_name TEXT DEFAULT 'JUBAYER'
    );

    CREATE TABLE IF NOT EXISTS rma_replace_in_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      in_id TEXT NOT NULL,
      job_ref_no TEXT DEFAULT '',
      product_id TEXT NOT NULL,
      product_group TEXT DEFAULT '',
      product_name TEXT NOT NULL,
      product_description TEXT DEFAULT '',
      out_serial TEXT DEFAULT '',
      in_serial TEXT DEFAULT '',
      qty REAL DEFAULT 1,
      unit_price REAL DEFAULT 0,
      charge_amount REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS rma_deliveries (
      delivery_id TEXT PRIMARY KEY,
      ref_no TEXT DEFAULT '',
      delivery_date TEXT NOT NULL,
      mobile_no TEXT DEFAULT '',
      delivery_person TEXT DEFAULT '',
      narration TEXT DEFAULT '',
      cs_group TEXT DEFAULT '',
      cs_name TEXT DEFAULT '',
      store_name TEXT DEFAULT 'SHOW ROOM',
      adjustment_type TEXT DEFAULT 'Without Adjustment',
      total_amount REAL DEFAULT 0,
      branch_name TEXT DEFAULT 'HAZI TRADERS',
      user_name TEXT DEFAULT 'JUBAYER'
    );

    CREATE TABLE IF NOT EXISTS rma_delivery_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      delivery_id TEXT NOT NULL,
      complain_receive_id TEXT DEFAULT '',
      job_ref_no TEXT DEFAULT '',
      product_id TEXT NOT NULL,
      product_group TEXT DEFAULT '',
      product_name TEXT NOT NULL,
      product_description TEXT DEFAULT '',
      received_serial TEXT DEFAULT '',
      replace_in_serial TEXT DEFAULT '',
      delivery_serial TEXT DEFAULT '',
      qty REAL DEFAULT 1,
      amount REAL DEFAULT 0
    );

    -- SERVICING
    CREATE TABLE IF NOT EXISTS service_groups (
      service_group_id TEXT PRIMARY KEY,
      service_group_name TEXT NOT NULL,
      active TEXT DEFAULT 'Y'
    );

    CREATE TABLE IF NOT EXISTS problem_groups (
      problem_group_id TEXT PRIMARY KEY,
      problem_group_name TEXT NOT NULL,
      active TEXT DEFAULT 'Y'
    );

    CREATE TABLE IF NOT EXISTS services (
      service_id TEXT PRIMARY KEY,
      service_name TEXT NOT NULL,
      service_group_id TEXT DEFAULT '',
      service_group_name TEXT DEFAULT '',
      description TEXT DEFAULT '',
      active TEXT DEFAULT 'Y'
    );

    CREATE TABLE IF NOT EXISTS problems (
      problem_id TEXT PRIMARY KEY,
      problem_name TEXT NOT NULL,
      problem_group_id TEXT DEFAULT '',
      problem_group_name TEXT DEFAULT '',
      description TEXT DEFAULT '',
      active TEXT DEFAULT 'Y'
    );

    CREATE TABLE IF NOT EXISTS service_bills (
      service_bill_id TEXT PRIMARY KEY,
      ref_no TEXT DEFAULT '',
      service_date TEXT NOT NULL,
      cash_customer TEXT DEFAULT '',
      mobile_no TEXT DEFAULT '',
      cs_group_name TEXT DEFAULT '',
      customer_name TEXT DEFAULT '',
      narration TEXT DEFAULT '',
      engineer_name TEXT DEFAULT '',
      total_amount REAL DEFAULT 0,
      discount_amount REAL DEFAULT 0,
      net_payable REAL DEFAULT 0,
      branch_name TEXT DEFAULT 'HAZI TRADERS',
      user_name TEXT DEFAULT 'JUBAYER'
    );

    CREATE TABLE IF NOT EXISTS service_bill_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_bill_id TEXT NOT NULL,
      problem_group TEXT DEFAULT '',
      problem_id TEXT DEFAULT '',
      problem_name TEXT DEFAULT '',
      problem_description TEXT DEFAULT '',
      service_group TEXT DEFAULT '',
      service_id TEXT DEFAULT '',
      service_name TEXT DEFAULT '',
      service_description TEXT DEFAULT '',
      qty REAL DEFAULT 1,
      unit_price REAL DEFAULT 0,
      total_price REAL DEFAULT 0
    );

    -- ACCOUNTS: PAYMENTS, COLLECTIONS, BANK TRANSACTIONS, JOURNAL, BALANCE TRANSFER
    CREATE TABLE IF NOT EXISTS payments (
      payment_id TEXT PRIMARY KEY,
      ref_no TEXT DEFAULT '',
      payment_date TEXT NOT NULL,
      cs_group TEXT DEFAULT '',
      cs_id TEXT DEFAULT '',
      cs_name TEXT NOT NULL,
      narration TEXT DEFAULT '',
      purchase_id TEXT DEFAULT '',
      payment_type TEXT DEFAULT 'CASH',
      bank_name TEXT DEFAULT '',
      branch_name_bank TEXT DEFAULT '',
      cheque_no TEXT DEFAULT '',
      cheque_date TEXT DEFAULT '',
      account_no TEXT DEFAULT '',
      dishonor_type TEXT DEFAULT '--Select--',
      dishonor_cheque_no TEXT DEFAULT '',
      invoice_amount REAL DEFAULT 0,
      due_amount REAL DEFAULT 0,
      total_due_amount REAL DEFAULT 0,
      amount REAL DEFAULT 0,
      approved TEXT DEFAULT 'Approved',
      branch_name TEXT DEFAULT 'HAZI TRADERS',
      user_name TEXT DEFAULT 'JUBAYER'
    );

    CREATE TABLE IF NOT EXISTS collections (
      collection_id TEXT PRIMARY KEY,
      ref_no TEXT DEFAULT '',
      collection_date TEXT NOT NULL,
      on_condition INTEGER DEFAULT 0,
      cs_group TEXT DEFAULT '',
      cs_id TEXT DEFAULT '',
      cs_name TEXT NOT NULL,
      narration TEXT DEFAULT '',
      sales_id TEXT DEFAULT '',
      collection_type TEXT DEFAULT 'CASH',
      bank_name TEXT DEFAULT '',
      branch_name_bank TEXT DEFAULT '',
      cheque_no TEXT DEFAULT '',
      cheque_date TEXT DEFAULT '',
      account_no TEXT DEFAULT '',
      dishonor_type TEXT DEFAULT '--Select--',
      dishonor_cheque_no TEXT DEFAULT '',
      invoice_amount REAL DEFAULT 0,
      due_amount REAL DEFAULT 0,
      total_due_amount REAL DEFAULT 0,
      amount REAL DEFAULT 0,
      approved TEXT DEFAULT 'Approved',
      branch_name TEXT DEFAULT 'HAZI TRADERS',
      user_name TEXT DEFAULT 'JUBAYER'
    );

    CREATE TABLE IF NOT EXISTS bank_transactions (
      bank_tr_id TEXT PRIMARY KEY,
      ref_no TEXT DEFAULT '',
      tr_date TEXT NOT NULL,
      type_id TEXT DEFAULT 'BTT01',
      tr_type TEXT NOT NULL,
      cheque_no TEXT DEFAULT '',
      account_no TEXT NOT NULL,
      bank_name TEXT DEFAULT '',
      branch_name_bank TEXT DEFAULT '',
      cheque_date TEXT DEFAULT '',
      narration TEXT DEFAULT '',
      amount REAL DEFAULT 0,
      branch_name TEXT DEFAULT 'HAZI TRADERS',
      user_name TEXT DEFAULT 'JUBAYER'
    );

    CREATE TABLE IF NOT EXISTS journal_vouchers (
      voucher_id TEXT PRIMARY KEY,
      ref_no TEXT DEFAULT '',
      voucher_date TEXT NOT NULL,
      tr_type TEXT DEFAULT 'DR',
      acc_sub_group_id TEXT DEFAULT '',
      acc_head TEXT DEFAULT '',
      accounts_id TEXT DEFAULT '',
      accounts_name TEXT NOT NULL,
      accounts_to TEXT DEFAULT '',
      narration TEXT DEFAULT '',
      sales_id TEXT DEFAULT '',
      cheque_no TEXT DEFAULT '',
      due_amount REAL DEFAULT 0,
      dr_amount REAL DEFAULT 0,
      cr_amount REAL DEFAULT 0,
      branch_name TEXT DEFAULT 'HAZI TRADERS',
      user_name TEXT DEFAULT 'JUBAYER'
    );

    CREATE TABLE IF NOT EXISTS balance_transfers (
      transfer_id TEXT PRIMARY KEY,
      ref_no TEXT DEFAULT '',
      transfer_date TEXT NOT NULL,
      transfer_from TEXT DEFAULT 'HAZI TRADERS',
      transfer_to TEXT NOT NULL,
      tr_type TEXT DEFAULT 'CASH',
      account_no TEXT DEFAULT '',
      narration TEXT DEFAULT '',
      amount REAL DEFAULT 0,
      approved TEXT DEFAULT 'Approved',
      user_name TEXT DEFAULT 'JUBAYER'
    );
  `);

  try { db.exec(`ALTER TABLE users ADD COLUMN permissions_json TEXT DEFAULT '';`); } catch {}
  try { db.exec(`ALTER TABLE branches ADD COLUMN manager_name TEXT DEFAULT 'JUBAYER AHMED';`); } catch {}
  try { db.exec(`ALTER TABLE branches ADD COLUMN status TEXT DEFAULT 'ACTIVE';`); } catch {}
  try { db.exec(`ALTER TABLE branches ADD COLUMN logo_url TEXT DEFAULT '/IMAGE/unisoft.svg';`); } catch {}
  try { db.exec(`ALTER TABLE branches ADD COLUMN invoice_footer TEXT DEFAULT 'Warranty void if sticker removed or burn/physical damage.';`); } catch {}
}

export function nextId(table, col, prefix, padLen = 3) {
  const rows = db.prepare(`SELECT ${col} AS id FROM ${table} WHERE ${col} LIKE ?`).all(`${prefix}%`);
  let maxNum = 0;
  for (const r of rows) {
    const numPart = String(r.id || '').slice(prefix.length).replace(/\D/g, '');
    const n = parseInt(numPart, 10);
    if (!isNaN(n) && n > maxNum) maxNum = n;
  }
  return `${prefix}${String(maxNum + 1).padStart(padLen, '0')}`;
}

export function adjustStock(branchName, storeName, productId, stockType, deltaQty) {
  const b = branchName || 'HAZI TRADERS';
  const s = storeName || 'SHOW ROOM';
  const t = stockType || 'COMMERCIAL';
  const existing = db.prepare(
    `SELECT id, qty FROM stock_balances WHERE branch_name = ? AND store_name = ? AND product_id = ? AND stock_type = ?`
  ).get(b, s, productId, t);

  if (existing) {
    db.prepare(`UPDATE stock_balances SET qty = qty + ? WHERE id = ?`).run(Number(deltaQty || 0), existing.id);
  } else {
    db.prepare(
      `INSERT INTO stock_balances (branch_name, store_name, product_id, stock_type, qty) VALUES (?, ?, ?, ?, ?)`
    ).run(b, s, productId, t, Number(deltaQty || 0));
  }
}

export function getStockQty(branchName, storeName, productId, stockType = 'COMMERCIAL') {
  const b = branchName || 'HAZI TRADERS';
  const s = storeName || 'SHOW ROOM';
  const row = db.prepare(
    `SELECT COALESCE(SUM(qty), 0) AS total FROM stock_balances WHERE branch_name = ? AND store_name = ? AND product_id = ? AND stock_type = ?`
  ).get(b, s, productId, stockType);
  return row ? Number(row.total || 0) : 0;
}

export function logModification(logType, transactionId, action, userName, branchName, details, amount = 0) {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  const dateStr = `${dd}/${mm}/${yyyy}`;
  db.prepare(`
    INSERT INTO modification_logs (log_type, transaction_id, action, user_name, branch_name, log_date, details, amount)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(logType, transactionId, action, (userName || 'JUBAYER').toUpperCase(), branchName || 'HAZI TRADERS', dateStr, details || '', Number(amount || 0));
}
