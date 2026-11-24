import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';
import { DatabaseSync } from 'node:sqlite';
import { parseSqlServerBak } from '../shared/bakParser.js';
import { mapBakTablesToErp } from '../shared/bakMapper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const bakPath = process.argv[2] || 'c:\\Users\\User\\Downloads\\HAZI_23112026_1741.Bak';
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'hazierp.db');
const gzPath = path.join(dataDir, 'hazierp_seed.db.gz');

// Remove existing db + wal/shm so we build a completely clean real-data DB
for (const ext of ['', '-wal', '-shm']) {
  if (fs.existsSync(dbPath + ext)) fs.unlinkSync(dbPath + ext);
}

console.log('Reading .Bak file:', bakPath);
const t0 = Date.now();
const buf = fs.readFileSync(bakPath);
const parsed = parseSqlServerBak(buf);
console.log(`Parsed .Bak in ${Date.now() - t0} ms`);

const t1 = Date.now();
const mapped = mapBakTablesToErp(parsed.tables);
console.log(`Mapped tables in ${Date.now() - t1} ms`);

// Initialize schema via server/db.js by importing it AFTER deleting old DB
// Wait: better to import db.js dynamically so it opens the fresh DB_PATH
const { db, initDatabase } = await import('./db.js');
initDatabase();

const t2 = Date.now();
db.exec('PRAGMA synchronous = OFF; PRAGMA journal_mode = MEMORY;');
db.exec('BEGIN TRANSACTION;');

const summary = {};
for (const [tableName, rows] of Object.entries(mapped)) {
  db.exec(`DELETE FROM ${tableName};`);
  summary[tableName] = rows.length;
  if (!rows.length) continue;
  const cols = Object.keys(rows[0]);
  const placeholders = cols.map(() => '?').join(', ');
  const stmt = db.prepare(`INSERT OR REPLACE INTO ${tableName} (${cols.join(', ')}) VALUES (${placeholders})`);
  for (const r of rows) {
    stmt.run(...cols.map(c => r[c] ?? null));
  }
}

// Create performance indexes
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_stock_bal_lookup ON stock_balances(branch_name, store_name, product_id, stock_type);
  CREATE INDEX IF NOT EXISTS idx_stock_bal_prod ON stock_balances(product_id);
  CREATE INDEX IF NOT EXISTS idx_serials_no ON product_serials(serial_no);
  CREATE INDEX IF NOT EXISTS idx_serials_prod ON product_serials(product_id);
  CREATE INDEX IF NOT EXISTS idx_sales_cs ON sales(cs_name);
  CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sales_date);
  CREATE INDEX IF NOT EXISTS idx_sales_items_sid ON sales_items(sales_id);
  CREATE INDEX IF NOT EXISTS idx_purchases_cs ON purchases(cs_name);
  CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(purchase_date);
  CREATE INDEX IF NOT EXISTS idx_purchase_items_pid ON purchase_items(purchase_id);
  CREATE INDEX IF NOT EXISTS idx_collections_cs ON collections(cs_name);
  CREATE INDEX IF NOT EXISTS idx_payments_cs ON payments(cs_name);
  CREATE INDEX IF NOT EXISTS idx_branch_prices_prod ON branch_prices(branch_name, product_id);
  CREATE INDEX IF NOT EXISTS idx_transfer_items_tid ON stock_transfer_items(transfer_id);
`);

db.exec('COMMIT;');
db.exec('PRAGMA journal_mode = DELETE; VACUUM;');
console.log(`Inserted all real records into SQLite in ${Date.now() - t2} ms`);

// Close and gzip
if (typeof db.close === 'function') db.close();
const rawDbBytes = fs.readFileSync(dbPath);
const gzBytes = zlib.gzipSync(rawDbBytes, { level: 9 });
fs.writeFileSync(gzPath, gzBytes);

console.log('\n=== IMPORT SUMMARY ===');
for (const [k, cnt] of Object.entries(summary)) {
  if (cnt > 0) console.log(`  ${k.padEnd(26)}: ${cnt}`);
}
console.log(`\nSQLite DB size : ${(rawDbBytes.length / 1024 / 1024).toFixed(2)} MB`);
console.log(`Gzipped seed   : ${(gzBytes.length / 1024 / 1024).toFixed(2)} MB (${gzPath})`);
