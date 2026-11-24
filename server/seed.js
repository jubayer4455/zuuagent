import { db } from './db.js';

/**
 * Minimal bootstrap only — ZERO demo products/traders/invoices.
 * Real data is loaded from HAZI_23112026_1741.Bak (bundled in server/data/hazierp_seed.db.gz)
 * and/or live Supabase snapshots, or uploaded directly by the Main Admin via .Bak Restore.
 */
export function seedDatabase() {
  const fullAdminPerms = JSON.stringify({
    all: true,
    roleLabel: 'Super Admin (Full Power)',
    actions: { create: true, edit: true, delete: true, print: true, manageAdmins: true, manageShops: true },
    routes: ['*']
  });

  if (db.prepare('SELECT COUNT(*) AS c FROM companies').get().c === 0) {
    db.prepare(`INSERT OR IGNORE INTO companies (company_id, company_name) VALUES ('CMPS01', 'HAZI TRADERS')`).run();
  }

  if (db.prepare('SELECT COUNT(*) AS c FROM branches').get().c === 0) {
    db.prepare(`
      INSERT OR IGNORE INTO branches (branch_id, company_id, branch_name, address, phone, email, manager_name, status, logo_url, invoice_footer)
      VALUES
        ('CMP001', 'CMPS01', 'HAZI TRADERS', 'Toyenbee circular road, motijheel, dhaka-1000', '01955541444', 'info@hazierp.top', 'JUBAYER AHMED', 'ACTIVE', '/IMAGE/hazi-logo.jpg', 'Warranty void if sticker removed or burn/physical damage.'),
        ('CMP002', 'CMPS01', 'HAZI TRADERS-2', 'Rahmania Internation Complex, Toyenbee circular road, motijheel, dhaka-1000', '01955541444', 'info@hazierp.top', 'JUBAYER AHMED', 'ACTIVE', '/IMAGE/hazi-logo.jpg', 'Warranty void if sticker removed or burn/physical damage.')
    `).run();
  }

  if (db.prepare('SELECT COUNT(*) AS c FROM stores').get().c === 0) {
    db.prepare(`INSERT OR IGNORE INTO stores (store_id, store_name, branch_name) VALUES ('STO001', 'SHOW ROOM', 'HAZI TRADERS')`).run();
    db.prepare(`INSERT OR IGNORE INTO stores (store_id, store_name, branch_name) VALUES ('STO002', 'SHOW ROOM2', 'HAZI TRADERS-2')`).run();
  }

  // Always guarantee Main Super Admin jubayer / 555444 exists with Full Power
  const existingJubayer = db.prepare(`SELECT user_id FROM users WHERE LOWER(user_id) = 'jubayer'`).get();
  if (!existingJubayer) {
    db.prepare(`
      INSERT INTO users (user_id, user_name, password, father_name, mother_name, address, email, mobile, opt_mobile, permission_type, operate_company, active, permissions_json)
      VALUES ('jubayer', 'JUBAYER', '555444', 'HAZI MD. ABDUL KARIM', 'MST. JAHANARA BEGUM', 'MOTIJHEEL, DHAKA-1000', 'jubayer@hazierp.top', '01955541444', '01818524712', 'A', 'HAZI TRADERS', 'Y', ?)
    `).run(fullAdminPerms);
  }
}
