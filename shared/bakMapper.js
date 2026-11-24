/**
 * Maps decoded MS SQL Server HaziERP .Bak tables into HaziERP SQLite/Supabase schema tables.
 * Works identically in Node.js (CLI/Server) and Browser (Client-Side Upload).
 */

const SUPER_ADMIN_PERMS = JSON.stringify({
  all: true,
  roleLabel: 'Super Admin (Full Power)',
  actions: { create: true, edit: true, delete: true, print: true, manageAdmins: true, manageShops: true },
  routes: ['*']
});

const SALES_USER_PERMS = JSON.stringify({
  all: false,
  roleLabel: 'Sales & Billing User',
  actions: { create: true, edit: true, delete: false, print: true, manageAdmins: false, manageShops: false },
  routes: [
    '/GI/SALES.aspx',
    '/GI/PRICEQUOTATION.aspx',
    '/GI/SERIAL_SEARCH.aspx',
    '/GI/MOBILE_SEARCH.aspx',
    '/GI/DATE_WISE_BILL_SEARCH.aspx',
    '/GI/COLLECTIONS.aspx',
    '/GI/CUSTOMERINFORMATION.aspx',
    '/GI/STOCK_REPORTS.aspx'
  ]
});

function str(v, fallback = '') {
  if (v === null || v === undefined) return fallback;
  return String(v).trim();
}

function num(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function mapBakTablesToErp(rawTables = {}) {
  const T = (name) => rawTables[name] || rawTables[name.toUpperCase()] || [];

  // 1. Companies & Branches
  const rawCompMaster = T('COMPANY_MASTER');
  const companies = rawCompMaster.length > 0
    ? rawCompMaster.map(c => ({
        company_id: str(c.COMPANY_ID, 'CMPS01'),
        company_name: str(c.COMPANY_NAME, 'HAZI TRADERS')
      }))
    : [{ company_id: 'CMPS01', company_name: 'HAZI TRADERS' }];

  const rawCompanies = T('COMPANY');
  const branchById = new Map();
  const branches = rawCompanies.length > 0
    ? rawCompanies.map((c, idx) => {
        const bid = str(c.COMPANY_ID, `CMP00${idx + 1}`);
        const bname = str(c.COMPANY_NAME, idx === 0 ? 'HAZI TRADERS' : `HAZI TRADERS-${idx + 1}`);
        branchById.set(bid, bname);
        return {
          branch_id: bid,
          company_id: str(c.COMPANY_ID_MASTER, companies[0].company_id),
          branch_name: bname,
          address: str(c.ADDRESS, 'Toyenbee circular road, motijheel, dhaka-1000'),
          phone: str(c.MOBILE || c.PHONE, '01818524712, 01402338209'),
          email: str(c.EMAIL, 'info@hazierp.top'),
          manager_name: 'JUBAYER AHMED',
          status: str(c.STATUS, 'Y') === 'N' ? 'INACTIVE' : 'ACTIVE',
          logo_url: '/IMAGE/unisoft.svg',
          invoice_footer: 'Warranty void if sticker removed or burn/physical damage.'
        };
      })
    : [
        {
          branch_id: 'CMP001',
          company_id: 'CMPS01',
          branch_name: 'HAZI TRADERS',
          address: 'Toyenbee circular road, motijheel, dhaka-1000',
          phone: '01818524712, 01402338209',
          email: 'info@hazierp.top',
          manager_name: 'JUBAYER AHMED',
          status: 'ACTIVE',
          logo_url: '/IMAGE/unisoft.svg',
          invoice_footer: 'Warranty void if sticker removed or burn/physical damage.'
        }
      ];

  const getBranch = (cid) => branchById.get(str(cid)) || branches[0]?.branch_name || 'HAZI TRADERS';

  // 2. Stores
  const rawStores = T('STORE');
  const storeById = new Map();
  const seenStoreNames = new Set();
  const stores = [];
  for (const s of rawStores) {
    const sid = str(s.STORE_ID);
    const sname = str(s.STORE_NAME, 'SHOW ROOM');
    if (!sid || !sname) continue;
    storeById.set(sid, sname);
    if (!seenStoreNames.has(sname)) {
      seenStoreNames.add(sname);
      stores.push({
        store_id: sid,
        store_name: sname,
        branch_name: getBranch(s.COMPANY_ID)
      });
    }
  }
  if (stores.length === 0) {
    stores.push({ store_id: 'STO001', store_name: 'SHOW ROOM', branch_name: getBranch('CMP001') });
    storeById.set('STO001', 'SHOW ROOM');
  }
  const getStore = (sid) => storeById.get(str(sid)) || 'SHOW ROOM';

  // 3. Users (ALWAYS preserve jubayer / 555444 as Super Admin Full Power)
  const rawUsers = T('SYS_USER');
  const usersMap = new Map();
  usersMap.set('jubayer', {
    user_id: 'jubayer',
    user_name: 'JUBAYER',
    password: '555444',
    father_name: 'HAZI MD. ABDUL KARIM',
    mother_name: 'MST. JAHANARA BEGUM',
    address: 'MOTIJHEEL, DHAKA-1000',
    email: 'jubayer@hazierp.top',
    mobile: '01955541444',
    opt_mobile: '01818524712',
    permission_type: 'A',
    operate_company: getBranch('CMP001'),
    active: 'Y',
    permissions_json: SUPER_ADMIN_PERMS
  });
  for (const u of rawUsers) {
    const uidRaw = str(u.USER_ID);
    if (!uidRaw) continue;
    const key = uidRaw.toLowerCase();
    if (key === 'jubayer') {
      const cur = usersMap.get('jubayer');
      cur.mobile = str(u.MOBILE, cur.mobile);
      cur.address = str(u.ADDRESS, cur.address);
      cur.email = str(u.EMAIL, cur.email);
      continue;
    }
    const isAdmin = str(u.USER_TYPE, 'U').toUpperCase() === 'A';
    usersMap.set(key, {
      user_id: uidRaw,
      user_name: str(u.USER_NAME, uidRaw).toUpperCase(),
      password: str(u.USER_ID) === '123' ? '123456' : '123456',
      father_name: str(u.FATHER_NAME),
      mother_name: str(u.MOTHER_NAME),
      address: str(u.ADDRESS),
      email: str(u.EMAIL),
      mobile: str(u.MOBILE),
      opt_mobile: str(u.OP_MOBILE),
      permission_type: isAdmin ? 'A' : 'U',
      operate_company: getBranch(u.COMPANY_ID),
      active: str(u.ACTIVE, 'Y') || 'Y',
      permissions_json: isAdmin ? SUPER_ADMIN_PERMS : SALES_USER_PERMS
    });
  }
  const users = [...usersMap.values()];

  // 4. Trader Groups & Traders
  const rawCsGroups = T('CS_GROUP');
  const csGroupById = new Map();
  const trader_groups = [];
  for (const g of rawCsGroups) {
    const gid = str(g.CS_GROUP_ID);
    const gname = str(g.GROUP_NAME, 'DHAKA');
    if (!gid) continue;
    csGroupById.set(gid, gname);
    trader_groups.push({ group_id: gid, group_name: gname, active: str(g.STATUS, 'Y') || 'Y' });
  }
  if (trader_groups.length === 0) {
    trader_groups.push({ group_id: 'CSG001', group_name: 'DHAKA', active: 'Y' });
    csGroupById.set('CSG001', 'DHAKA');
  }

  const rawCs = T('CS');
  const traderById = new Map();
  const traders = [];
  for (const c of rawCs) {
    const cid = str(c.CS_ID);
    const cname = str(c.CS_NAME);
    if (!cid || !cname) continue;
    const gid = str(c.CS_GROUP_ID);
    const gname = csGroupById.get(gid) || 'DHAKA';
    const rec = {
      cs_id: cid,
      cs_name: cname,
      group_id: gid,
      group_name: gname,
      mpo_id: str(c.MPO_ID),
      mpo_name: '',
      address: str(c.ADDRESS),
      mobile: str(c.MOBILE),
      phone: str(c.PHONE),
      email: str(c.EMAIL),
      contact_person: str(c.CONTACT_PERSON),
      credit_limit: num(c.CREDIT_LIMIT, 0),
      bin: str(c.BIN),
      opening_balance: num(c.BALANCE, 0),
      trader_type: str(c.STATUS, 'C').toUpperCase() === 'S' ? 'S' : 'C',
      customer_type: str(c.CUSTOMER_TYPE, 'RETAILER') || 'RETAILER',
      active: str(c.ACTIVE, 'Y') || 'Y',
      branch_name: getBranch(c.COMPANY_ID)
    };
    traderById.set(cid, rec);
    traders.push(rec);
  }
  const getTraderName = (cid, cashFallback = '') => {
    const id = str(cid);
    if (traderById.has(id)) return traderById.get(id).cs_name;
    if (str(cashFallback)) return str(cashFallback);
    if (id.toUpperCase().startsWith('CASH')) return 'CASH CUSTOMER';
    return id || 'CASH CUSTOMER';
  };
  const getTraderGroup = (cid) => traderById.get(str(cid))?.group_name || 'DHAKA';

  // 5. Categories, Product Groups, Brands, Colors
  const catById = new Map();
  const categories = [];
  for (const c of T('CATEGORY')) {
    const id = str(c.CATEGORY_ID);
    const name = str(c.CATEGORY_NAME);
    if (!id || !name) continue;
    catById.set(id, name);
    categories.push({ category_id: id, category_name: name, active: str(c.ACTIVE, 'Y') || 'Y' });
  }

  const pgById = new Map();
  const product_groups = [];
  for (const g of T('PRODUCT_GROUP')) {
    const id = str(g.PRODUCT_GROUP_ID);
    const name = str(g.PRODUCT_GROUP_NAME);
    if (!id || !name) continue;
    pgById.set(id, name);
    product_groups.push({ group_id: id, group_name: name, active: str(g.ACTIVE, 'Y') || 'Y' });
  }

  const brandById = new Map();
  const brands = [];
  for (const b of T('BRAND')) {
    const id = str(b.BRAND_ID);
    const name = str(b.BRAND_NAME);
    if (!id || !name) continue;
    brandById.set(id, name);
    brands.push({ brand_id: id, brand_name: name, active: str(b.ACTIVE, 'Y') || 'Y' });
  }

  const colors = [];
  for (const c of T('COLOR')) {
    const id = str(c.COLOR_ID);
    const name = str(c.COLOR_NAME);
    if (id && name) colors.push({ color_id: id, color_name: name, active: str(c.ACTIVE, 'Y') || 'Y' });
  }

  // Price Setup lookup to enrich product prices
  const rawPriceSetup = T('PRICE_SETUP');
  const priceByProd = new Map();
  for (const ps of rawPriceSetup) {
    const pid = str(ps.PRODUCT_ID);
    if (!pid) continue;
    if (!priceByProd.has(pid) || num(ps.RETAIL_PRICE) > 0 || num(ps.SALES_PRICE_WITHTAX) > 0) {
      priceByProd.set(pid, ps);
    }
  }

  // 6. Products (ALL real products from PRODUCT)
  const prodById = new Map();
  const products = [];
  for (const p of T('PRODUCT')) {
    const pid = str(p.PRODUCT_ID);
    const pname = str(p.PRODUCT_NAME);
    if (!pid || !pname) continue;
    const ps = priceByProd.get(pid);
    const catId = str(p.CATEGORY_ID);
    const grpId = str(p.PRODUCT_GROUP_ID);
    const brId = str(p.BRAND_ID);
    const purchasePrice = num(p.PURCHASE_PRICE) || num(ps?.PURCHASE_PRICE) || 0;
    const salesPrice = num(p.SALES_PRICE) || num(ps?.RETAIL_PRICE) || num(ps?.SALES_PRICE_WITHTAX) || 0;
    const wholesalePrice = num(p.WHOLE_SALES_PRICE) || num(ps?.WHOLE_SALES_PRICE) || 0;
    const dealerPrice = num(p.DELAR_PRICE) || num(ps?.CORPORATE_PRICE) || 0;
    const rec = {
      product_id: pid,
      product_name: pname,
      category_id: catId,
      category_name: catById.get(catId) || '',
      group_id: grpId,
      group_name: pgById.get(grpId) || '',
      brand_id: brId,
      brand_name: brandById.get(brId) || '',
      barcode_id: str(p.BARCODE_ID) || pid,
      description: str(p.DESCRIPTION) || pname,
      location: str(p.LOCATION),
      color: str(p.COLOR),
      size: str(p.PSIZE),
      serial_item: str(p.SERIAL, 'N') === 'Y' ? 'Y' : 'N',
      inventory_item: str(p.INVENTORY, 'Y') === 'N' ? 'N' : 'Y',
      purchase_price: purchasePrice,
      sales_price: salesPrice,
      unit: str(p.UNIT, 'PCS') || 'PCS',
      discount: num(p.DISCOUNT_AMT, 0),
      wholesale_price: wholesalePrice,
      dealer_price: dealerPrice,
      wholesale_comm: num(p.WHOLE_SALES_COMM, 0),
      dealer_comm: num(p.DELAR_COMM, 0),
      sales_comm: num(p.RETAILER_COMM, 0),
      warranty: str(p.WARRANTY),
      reorder_level: num(p.REORDER_LEVEL, 0),
      red_level: num(p.RED_LEVEL, 0),
      vat: num(p.VAT_PCT, 0),
      level_qty: 0,
      active: str(p.ACTIVE, 'Y') || 'Y',
      image_url: ''
    };
    prodById.set(pid, rec);
    products.push(rec);
  }

  // 7. Branch Prices (PRICE_SETUP)
  const seenBp = new Set();
  const branch_prices = [];
  for (const ps of rawPriceSetup) {
    const pid = str(ps.PRODUCT_ID);
    const pr = prodById.get(pid);
    if (!pr) continue;
    const bname = getBranch(ps.COMPANY_ID);
    const key = `${bname}::${pid}`;
    if (seenBp.has(key)) continue;
    seenBp.add(key);
    branch_prices.push({
      branch_name: bname,
      product_id: pid,
      product_name: pr.product_name,
      group_name: pr.group_name,
      brand_name: pr.brand_name,
      purchase_price: num(ps.PURCHASE_PRICE, pr.purchase_price),
      sales_price_with_tax: num(ps.SALES_PRICE_WITHTAX, pr.sales_price),
      sales_price_without_tax: num(ps.RETAIL_PRICE, pr.sales_price),
      wholesale_price: num(ps.WHOLE_SALES_PRICE, pr.wholesale_price),
      dealer_price: num(ps.CORPORATE_PRICE, pr.dealer_price),
      red_level: num(ps.RED_LEVEL, pr.red_level)
    });
  }

  // 8. Stock Balances & Product Serials (from STOCK_SERIAL + STOCK_NON_SERIAL)
  const stockAgg = new Map();
  const addStock = (branchName, storeName, productId, qty) => {
    if (!productId || !qty) return;
    const k = `${branchName}::${storeName}::${productId}::COMMERCIAL`;
    stockAgg.set(k, (stockAgg.get(k) || 0) + qty);
  };

  const product_serials = [];
  for (const ss of T('STOCK_SERIAL')) {
    const pid = str(ss.PRODUCT_ID);
    const sno = str(ss.SERIAL);
    const qty = num(ss.STOCK_QTY, 0);
    const bname = getBranch(ss.COMPANY_ID);
    const sname = getStore(ss.STORE_ID);
    const pr = prodById.get(pid);
    if (qty > 0) {
      addStock(bname, sname, pid, qty);
    }
    if (sno && pid) {
      product_serials.push({
        serial_no: sno,
        product_id: pid,
        product_name: pr?.product_name || pid,
        product_group: pr?.group_name || '',
        branch_name: bname,
        store_name: sname,
        stock_type: 'COMMERCIAL',
        status: qty > 0 ? 'IN_STOCK' : 'SOLD',
        purchase_id: str(ss.PURCHASE_ID),
        purchase_date: str(ss.PURCHASE_DATE),
        supplier_name: '',
        sales_id: '',
        sales_date: '',
        customer_name: '',
        warranty: pr?.warranty || '',
        unit_price: num(ss.AVG_COST) || num(ss.ORG_COST) || pr?.purchase_price || 0
      });
    }
  }

  for (const sns of T('STOCK_NON_SERIAL')) {
    const pid = str(sns.PRODUCT_ID);
    const qty = num(sns.STOCK_QTY, 0);
    if (qty > 0 && pid) {
      addStock(getBranch(sns.COMPANY_ID), getStore(sns.STORE_ID), pid, qty);
    }
  }

  const stock_balances = [];
  for (const [k, qty] of stockAgg.entries()) {
    const [branch_name, store_name, product_id, stock_type] = k.split('::');
    stock_balances.push({ branch_name, store_name, product_id, stock_type, qty });
  }

  // 9. Accounts Setup (Groups, Sub-Groups, Ledgers, Banks, Bank Accounts, Cheque Books)
  const accGroupById = new Map();
  for (const ag of T('ACC_GROUP')) {
    accGroupById.set(str(ag.ACC_GROUP_ID), str(ag.ACC_GROUP_NAME));
  }
  const account_sub_groups = [
    { sub_group_id: 'ASG001', sub_group_name: 'OPERATING EXPENSES', group_id: 'AG004', group_name: accGroupById.get('AG004') || 'INDIRECT EXPENSES' },
    { sub_group_id: 'ASG002', sub_group_name: 'DIRECT INCOME', group_id: 'AG001', group_name: accGroupById.get('AG001') || 'DIRECT INCOME' },
    { sub_group_id: 'ASG003', sub_group_name: 'CURRENT ASSETS', group_id: 'AG009', group_name: accGroupById.get('AG009') || 'CURRENT ASSET' },
    { sub_group_id: 'EMPG01', sub_group_name: 'EMPLOYEE SALARY', group_id: 'AG004', group_name: accGroupById.get('AG004') || 'INDIRECT EXPENSES' }
  ];
  const subGroupById = new Map(account_sub_groups.map(sg => [sg.sub_group_id, sg]));

  const ledgerById = new Map();
  const account_ledgers = [];
  for (const al of T('ACC_LEDGER')) {
    const aid = str(al.ACCOUNTS_ID);
    const aname = str(al.ACC_NAME);
    if (!aid || !aname) continue;
    const sgId = str(al.ACC_SUB_GROUP_ID, 'ASG001');
    const sg = subGroupById.get(sgId);
    const rec = {
      accounts_id: aid,
      accounts_name: aname,
      sub_group_id: sgId,
      sub_group_name: sg?.sub_group_name || 'OPERATING EXPENSES',
      group_name: sg?.group_name || 'INDIRECT EXPENSES',
      balance: num(al.BALANCE, 0),
      active: str(al.ACTIVE, 'Y') || 'Y'
    };
    ledgerById.set(aid, rec);
    account_ledgers.push(rec);
  }

  const bankById = new Map();
  const banks = [];
  for (const b of T('BANK')) {
    const bid = str(b.BANK_ID);
    const bname = str(b.BANK_NAME);
    if (!bid || !bname) continue;
    bankById.set(bid, bname);
    banks.push({ bank_id: bid, bank_name: bname, active: str(b.STATUS, 'Y') || 'Y' });
  }

  const bankAccountByNo = new Map();
  const bank_accounts = [];
  for (const bb of T('BANK_BRANCH')) {
    const id = str(bb.BRANCH_ID);
    const accNo = str(bb.ACCOUNT_NO);
    if (!id || !accNo) continue;
    const bname = bankById.get(str(bb.BANK_ID)) || str(bb.BANK_ID);
    const rec = {
      bk_br_id: id,
      bank_id: str(bb.BANK_ID),
      bank_name: bname,
      branch_name: str(bb.BRANCH_NAME),
      address: str(bb.ADDRESS),
      routing_no: str(bb.ROUTING_NO),
      contact_person: str(bb.CONTACT_PERSON),
      contact_no: str(bb.CONTACT_NUMBER),
      email: str(bb.EMAIL),
      account_no: accNo,
      balance: num(bb.BALANCE, 0),
      active: str(bb.ACTIVE, 'Y') || 'Y',
      account_type: str(bb.ACC_TYPE, 'GENARAL') || 'GENARAL'
    };
    bankAccountByNo.set(accNo, rec);
    bank_accounts.push(rec);
  }

  const cheque_books = [];
  for (const ch of T('CHEQUE_BOOK')) {
    const chNo = str(ch.CHEQUE_NO);
    if (!chNo) continue;
    const acc = bankAccountByNo.get(str(ch.ACCOUNT_NO));
    cheque_books.push({
      bank_id: str(ch.BANK_ID),
      bank_name: bankById.get(str(ch.BANK_ID)) || acc?.bank_name || '',
      bk_br_id: str(ch.BRANCH_ID),
      branch_name: acc?.branch_name || '',
      account_no: str(ch.ACCOUNT_NO),
      cheque_no: chNo,
      status: str(ch.STATUS, 'P') === 'P' ? 'UNUSED' : 'USED',
      transaction_type: '',
      transaction_id: '',
      trader_name: '',
      transaction_date: str(ch.TIMESTAMP),
      cheque_date: '',
      amount: 0
    });
  }

  // 10. Employees & Designations
  const desigById = new Map();
  for (const d of T('DESIGNATION')) {
    desigById.set(str(d.DESIGNATION_ID), str(d.DESIGNATION));
  }
  const empById = new Map();
  const employees = [];
  for (const e of T('EMPLOYEE')) {
    const eid = str(e.EMPLOYEE_ID);
    const ename = str(e.EMPLOYEE_NAME);
    if (!eid || !ename) continue;
    const rec = {
      employee_id: eid,
      employee_name: ename,
      father_name: str(e.FATHER_NAME),
      mother_name: str(e.MOTHER_NAME),
      address: str(e.ADDRESS),
      email: str(e.EMAIL),
      mobile: str(e.MOBILE),
      family_mobile: str(e.FAMILY_MOBILE),
      education: str(e.EDUCATION),
      joining_date: str(e.JOINING_DATE),
      basic_salary: num(e.BASIC_SALARY, 0),
      gross_salary: num(e.GROSS_SALARY, 0),
      designation: desigById.get(str(e.DESIGNATION_ID)) || '',
      opening_balance: num(e.BALANCE, 0),
      active: str(e.ACTIVE, 'Y') || 'Y',
      employee_type: str(e.EMP_TYPE, 'Y') || 'Y',
      salary_type: str(e.SALARY_TYPE, 'Y') || 'Y'
    };
    empById.set(eid, rec);
    employees.push(rec);
  }

  // 11. Servicing Setup (Problem Groups, Problems, Service Groups, Services)
  const pgServById = new Map();
  const problem_groups = [];
  for (const pg of T('PROBLEM_GROUP')) {
    const id = str(pg.PROBLEM_GROUP_ID);
    const name = str(pg.PROBLEM_GROUP_NAME);
    if (!id || !name) continue;
    pgServById.set(id, name);
    problem_groups.push({ problem_group_id: id, problem_group_name: name, active: str(pg.ACTIVE, 'Y') || 'Y' });
  }
  const problems = [];
  for (const pr of T('PROBLEM')) {
    const id = str(pr.PROBLEM_ID);
    const name = str(pr.PROBLEM_NAME);
    if (!id || !name) continue;
    problems.push({
      problem_id: id,
      problem_name: name,
      problem_group_id: str(pr.PROBLEM_GROUP_ID),
      problem_group_name: pgServById.get(str(pr.PROBLEM_GROUP_ID)) || '',
      description: str(pr.DESCRIPTION),
      active: str(pr.ACTIVE, 'Y') || 'Y'
    });
  }
  const sgById = new Map();
  const service_groups = [];
  for (const sg of T('SERVICE_GROUP')) {
    const id = str(sg.SERVICE_GROUP_ID);
    const name = str(sg.SERVICE_GROUP_NAME);
    if (!id || !name) continue;
    sgById.set(id, name);
    service_groups.push({ service_group_id: id, service_group_name: name, active: str(sg.ACTIVE, 'Y') || 'Y' });
  }
  const services = [];
  for (const sv of T('SERVICE_NAME')) {
    const id = str(sv.SERVICE_ID);
    const name = str(sv.SERVICE_NAME);
    if (!id || !name) continue;
    services.push({
      service_id: id,
      service_name: name,
      service_group_id: str(sv.SERVICE_GROUP_ID),
      service_group_name: sgById.get(str(sv.SERVICE_GROUP_ID)) || '',
      description: str(sv.DESCRIPTION),
      active: str(sv.ACTIVE, 'Y') || 'Y'
    });
  }

  // 12. Purchases & Purchase Items
  const purchases = [];
  const seenPur = new Set();
  for (const p of T('PURCHASE')) {
    const pid = str(p.PURCHASE_ID);
    if (!pid || seenPur.has(pid)) continue;
    seenPur.add(pid);
    purchases.push({
      purchase_id: pid,
      ref_no: str(p.REFNO),
      purchase_date: str(p.PURCHASE_DATE),
      cs_group: getTraderGroup(p.CS_ID),
      cs_id: str(p.CS_ID),
      cs_name: getTraderName(p.CS_ID, p.CASHSUPPLIER),
      store_name: 'SHOW ROOM',
      narration: str(p.REMARKS),
      commenc_date: '',
      total_amount: num(p.TOTAL_PRICE, 0),
      vat_amount: num(p.VAT_AMOUNT, 0),
      discount_amount: num(p.DISCOUNT, 0),
      net_payable: num(p.NET_PURCHASE_AMT, num(p.TOTAL_PRICE, 0)),
      payment_amount: 0,
      branch_name: getBranch(p.COMPANY_ID),
      user_name: str(p.USER_ID, 'JUBAYER').toUpperCase()
    });
  }

  const purchase_items = [];
  for (const d of T('PURCHASE_DETAILS')) {
    const purId = str(d.PURCHASE_ID);
    const prodId = str(d.PRODUCT_ID);
    if (!purId || !prodId) continue;
    const pr = prodById.get(prodId);
    const qty = num(d.QTY, 1);
    const up = num(d.UNIT_PRICE, 0);
    purchase_items.push({
      purchase_id: purId,
      product_id: prodId,
      product_group: pgById.get(str(d.PRODUCT_GROUP_ID)) || pr?.group_name || '',
      product_name: pr?.product_name || prodId,
      product_description: pr?.description || pr?.product_name || prodId,
      warranty: str(d.WARRANTY, pr?.warranty || ''),
      expiry_date: str(d.EXPIRY_DATE),
      serial_no: str(d.SERIAL),
      qty,
      unit_price: up,
      total_price: qty * up
    });
  }

  // 13. Purchase Returns & Items
  const purchase_returns = [];
  const seenPr = new Set();
  for (const r of T('PURCHASE_RETURN')) {
    const rid = str(r.PURCHASE_RETURN_ID);
    if (!rid || seenPr.has(rid)) continue;
    seenPr.add(rid);
    purchase_returns.push({
      return_id: rid,
      ref_no: str(r.REFNO),
      return_date: str(r.RETURN_DATE),
      purchase_id: '',
      purchase_amount: 0,
      cs_group: getTraderGroup(r.CS_ID),
      cs_id: str(r.CS_ID),
      cs_name: getTraderName(r.CS_ID),
      store_name: 'SHOW ROOM',
      narration: str(r.REMARKS),
      total_amount: num(r.TOTAL_PRICE, 0),
      vat_amount: num(r.VAT, 0),
      net_amount: num(r.TOTAL_PRICE, 0) + num(r.VAT, 0),
      branch_name: getBranch(r.COMPANY_ID),
      user_name: str(r.USER_ID, 'JUBAYER').toUpperCase()
    });
  }
  const purchase_return_items = [];
  for (const d of T('PURCHASE_RETURN_DETAILS')) {
    const rid = str(d.PURCHASE_RETURN_ID);
    const prodId = str(d.PRODUCT_ID);
    if (!rid || !prodId) continue;
    const pr = prodById.get(prodId);
    const qty = num(d.QTY, 1);
    const up = num(d.UNIT_PRICE, 0);
    purchase_return_items.push({
      return_id: rid,
      product_id: prodId,
      product_group: pgById.get(str(d.PRODUCT_GROUP_ID)) || pr?.group_name || '',
      product_name: pr?.product_name || prodId,
      product_description: pr?.description || pr?.product_name || prodId,
      warranty: pr?.warranty || '',
      serial_no: str(d.SERIAL_NO),
      qty,
      unit_price: up,
      total_price: num(d.TOTAL_PRICE) || qty * up
    });
  }

  // 14. Price Quotations & Items
  const price_quotations = [];
  const seenQt = new Set();
  for (const q of T('PRICE_QUOTATION_SUM')) {
    const qid = str(q.QUOTATION_ID);
    if (!qid || seenQt.has(qid)) continue;
    seenQt.add(qid);
    price_quotations.push({
      quotation_id: qid,
      ref_no: str(q.REFNO),
      quotation_date: str(q.QUOTATION_DATE),
      mobile_no: str(q.MOBILE_NO),
      subject: str(q.SUBJECT),
      cash_customer: str(q.CASH_CUSTOMER),
      narration: str(q.REMARKS),
      conditions: [q.CONDITION1, q.CONDITION2, q.CONDITION3, q.CONDITION4].filter(Boolean).join(' ') || 'Validity 15 days.',
      cs_group: getTraderGroup(q.CS_ID),
      cs_id: str(q.CS_ID),
      customer_name: getTraderName(q.CS_ID, q.CASH_CUSTOMER),
      store_name: 'SHOW ROOM',
      total_amount: num(q.TOTAL_PRICE, 0),
      service_charge: num(q.SERVICE_CHARGE, 0),
      others_charge: num(q.OTHER_CHARGE, 0),
      tax_amount: num(q.TAX, 0),
      vat_amount: num(q.VAT, 0),
      discount_amount: num(q.DISCOUNT, 0),
      net_payable: num(q.NET_AMT, num(q.TOTAL_PRICE, 0)),
      branch_name: getBranch(q.COMPANY_ID),
      user_name: str(q.USER_ID, 'JUBAYER').toUpperCase()
    });
  }
  const price_quotation_items = [];
  for (const d of T('PRICE_QUOTATION')) {
    const qid = str(d.QUOTATION_ID);
    const prodId = str(d.PRODUCT_ID);
    if (!qid || !prodId) continue;
    const pr = prodById.get(prodId);
    const qty = num(d.QTY, 1);
    const up = num(d.UNIT_PRICE, 0);
    price_quotation_items.push({
      quotation_id: qid,
      product_id: prodId,
      product_group: pgById.get(str(d.PRODUCT_GROUP_ID)) || pr?.group_name || '',
      product_name: pr?.product_name || prodId,
      product_description: pr?.description || pr?.product_name || prodId,
      item_remarks: str(d.EXTRA_DESCRIPTION),
      warranty: str(d.WARRANTY),
      qty,
      unit_price: up,
      vat_percent: num(d.VAT_PERCENT, 0),
      total_price: qty * up
    });
  }

  // 15. Sales & Sales Items
  const sales = [];
  const seenSales = new Set();
  for (const s of T('SALES')) {
    const sid = str(s.SALES_ID);
    if (!sid || seenSales.has(sid)) continue;
    seenSales.add(sid);
    const csId = str(s.CS_ID);
    const isCash = csId.toUpperCase().startsWith('CASH');
    const net = num(s.NET_SALES, num(s.TOTAL_PRICE, 0));
    sales.push({
      sales_id: sid,
      ref_no: str(s.REFNO),
      sales_date: str(s.SALES_DATE),
      mobile_no: str(s.MOBILE) || traderById.get(csId)?.mobile || '',
      cs_group: getTraderGroup(csId),
      cs_id: csId,
      cs_name: getTraderName(csId, s.CASH_CS_NAME),
      cash_customer_name: str(s.CASH_CS_NAME),
      store_name: 'SHOW ROOM',
      price_tier: 'SALES_PRICE',
      sales_type: str(s.SALES_TYPE) || (isCash ? 'CASH' : 'CREDIT'),
      collection_type: 'CASH',
      account_no: '',
      advance_sales: 0,
      narration: str(s.REMARKS),
      total_amount: num(s.TOTAL_PRICE, 0),
      service_charge: num(s.SERVICE_CHARGE, 0),
      extra_charge: num(s.OTHER_CHARGE, 0),
      tax_amount: num(s.TAX, 0),
      vat_amount: num(s.VAT, 0),
      discount_amount: num(s.DISCOUNT, 0),
      net_payable: net,
      collection_amount: isCash ? net : 0,
      approved: str(s.APPROVAL, 'A') === 'A' ? 'Approved' : 'Pending',
      branch_name: getBranch(s.COMPANY_ID),
      user_name: str(s.USER_ID, 'JUBAYER').toUpperCase()
    });
  }

  const sales_items = [];
  for (const d of T('SALES_DETAILS')) {
    const sid = str(d.SALES_ID);
    const prodId = str(d.PRODUCT_ID);
    if (!sid || !prodId) continue;
    const pr = prodById.get(prodId);
    const qty = num(d.QTY, 1);
    const up = num(d.UNIT_PRICE, 0);
    const disc = num(d.DISCOUNT, 0);
    sales_items.push({
      sales_id: sid,
      product_id: prodId,
      product_group: pgById.get(str(d.PRODUCT_GROUP_ID)) || pr?.group_name || '',
      product_name: pr?.product_name || prodId,
      product_description: pr?.description || pr?.product_name || prodId,
      item_remarks: '',
      warranty: str(d.WARRANTY, pr?.warranty || ''),
      serial_no: str(d.SERIAL),
      qty,
      unit_price: up,
      cost_price: num(d.AVG_COST) || num(d.ORG_COST) || pr?.purchase_price || 0,
      discount: disc,
      vat_percent: num(d.VAT_PERCENT, 0),
      total_price: Math.max(0, qty * up - disc)
    });
  }

  // 16. Sales Returns & Items
  const sales_returns = [];
  const seenSr = new Set();
  for (const r of T('SALES_RETURN')) {
    const rid = str(r.SALES_RETURN_ID);
    if (!rid || seenSr.has(rid)) continue;
    seenSr.add(rid);
    sales_returns.push({
      return_id: rid,
      ref_no: str(r.REFNO),
      return_date: str(r.RETURN_DATE),
      sales_id: '',
      invoice_amount: 0,
      cs_group: getTraderGroup(r.CS_ID),
      cs_id: str(r.CS_ID),
      cs_name: getTraderName(r.CS_ID),
      store_name: 'SHOW ROOM',
      narration: str(r.REMARKS),
      total_amount: num(r.TOTAL_PRICE, 0),
      vat_amount: num(r.VAT, 0),
      net_amount: num(r.TOTAL_PRICE, 0) + num(r.VAT, 0),
      branch_name: getBranch(r.COMPANY_ID),
      user_name: str(r.USER_ID, 'JUBAYER').toUpperCase()
    });
  }
  const sales_return_items = [];
  for (const d of T('SALES_RETURN_DETAILS')) {
    const rid = str(d.SALES_RETURN_ID);
    const prodId = str(d.PRODUCT_ID);
    if (!rid || !prodId) continue;
    const pr = prodById.get(prodId);
    const qty = num(d.QTY, 1);
    const up = num(d.UNIT_PRICE, 0);
    sales_return_items.push({
      return_id: rid,
      product_id: prodId,
      product_group: pgById.get(str(d.PRODUCT_GROUP_ID)) || pr?.group_name || '',
      product_name: pr?.product_name || prodId,
      product_description: pr?.description || pr?.product_name || prodId,
      warranty: pr?.warranty || '',
      serial_no: str(d.SERIAL),
      qty,
      unit_price: up,
      cost_price: num(d.AVG_COST) || num(d.ORG_COST) || pr?.purchase_price || 0,
      total_price: num(d.TOTAL_PRICE) || qty * up
    });
  }

  // 17. Stock Transfers (Branch to Branch)
  const transferHeadersMap = new Map();
  const stock_transfer_items = [];
  for (const tr of T('STOCK_TRANSFER_BR_TO_BR')) {
    const tid = str(tr.TRANSFER_ID);
    const pid = str(tr.PRODUCT_ID);
    if (!tid) continue;
    if (!transferHeadersMap.has(tid)) {
      transferHeadersMap.set(tid, {
        transfer_id: tid,
        transfer_mode: 'BR_TO_BR',
        ref_no: str(tr.REFNO),
        transfer_date: str(tr.TRANSFER_DATE),
        from_branch: getBranch(tr.COMPANY_ID),
        to_branch: getBranch(tr.COMPANY_ID_TO),
        from_store: getStore(tr.STORE_ID_FROM),
        to_store: getStore(tr.STORE_ID_TO),
        narration: str(tr.REMARKS),
        approved: str(tr.APPROVED, 'A') === 'A' ? 'Approved' : 'Pending',
        received: str(tr.STATUS, 'RECEIVED') === 'RECEIVED' ? 'Received' : 'Pending',
        user_name: str(tr.USER_ID, 'JUBAYER').toUpperCase()
      });
    }
    if (pid) {
      const pr = prodById.get(pid);
      stock_transfer_items.push({
        transfer_id: tid,
        product_id: pid,
        product_group: pgById.get(str(tr.PRODUCT_GROUP_ID)) || pr?.group_name || '',
        product_name: pr?.product_name || pid,
        product_description: pr?.description || pr?.product_name || pid,
        serial_no: str(tr.SERIAL),
        qty: num(tr.QTY, 1)
      });
    }
  }
  const stock_transfers = [...transferHeadersMap.values()];

  // 18. Collections & Payments
  const collections = [];
  const seenCol = new Set();
  for (const c of T('COLLECTION')) {
    const cid = str(c.COLLECTION_ID);
    if (!cid || seenCol.has(cid)) continue;
    seenCol.add(cid);
    collections.push({
      collection_id: cid,
      ref_no: str(c.REF_NO),
      collection_date: str(c.COLLECTION_DATE),
      on_condition: 0,
      cs_group: getTraderGroup(c.CS_ID),
      cs_id: str(c.CS_ID),
      cs_name: getTraderName(c.CS_ID),
      narration: str(c.REMARKS),
      sales_id: str(c.SALES_ID),
      collection_type: str(c.COLLECTION_TYPE, 'CASH') || 'CASH',
      bank_name: str(c.BANK_NAME),
      branch_name_bank: str(c.BRANCH_NAME),
      cheque_no: str(c.CHEQUE_NO),
      cheque_date: str(c.CHEQUE_DATE),
      account_no: str(c.ACC_NO),
      dishonor_type: '--Select--',
      dishonor_cheque_no: str(c.DISHONOR_CHQNO),
      invoice_amount: 0,
      due_amount: 0,
      total_due_amount: 0,
      amount: num(c.AMOUNT, 0),
      approved: 'Approved',
      branch_name: getBranch(c.COMPANY_ID),
      user_name: str(c.USER_ID, 'JUBAYER').toUpperCase()
    });
  }

  const payments = [];
  const seenPay = new Set();
  for (const p of T('PAYMENT')) {
    const pid = str(p.PAYMENT_ID);
    if (!pid || seenPay.has(pid)) continue;
    seenPay.add(pid);
    const csId = str(p.CS_ID);
    const emp = empById.get(csId);
    const csName = emp ? emp.employee_name : getTraderName(csId);
    payments.push({
      payment_id: pid,
      ref_no: str(p.REF_NO),
      payment_date: str(p.PAYMENT_DATE),
      cs_group: emp ? 'EMPLOYEE' : getTraderGroup(csId),
      cs_id: csId,
      cs_name: csName,
      narration: str(p.REMARKS),
      purchase_id: str(p.PURCHASE_ID),
      payment_type: str(p.PAYMENT_TYPE, 'CASH') || 'CASH',
      bank_name: '',
      branch_name_bank: '',
      cheque_no: str(p.CHEQUE_NO),
      cheque_date: str(p.CHEQUE_DATE),
      account_no: str(p.ACC_NO),
      dishonor_type: '--Select--',
      dishonor_cheque_no: str(p.DISHONOR_CHQNO),
      invoice_amount: 0,
      due_amount: 0,
      total_due_amount: 0,
      amount: num(p.AMOUNT, 0),
      approved: 'Approved',
      branch_name: getBranch(p.COMPANY_ID),
      user_name: str(p.USER_ID, 'JUBAYER').toUpperCase()
    });
  }

  // 19. Bank Transactions, Journal Vouchers, Balance Transfers
  const bank_transactions = [];
  const seenBtr = new Set();
  for (const bt of T('BANK_TRANSCATION')) {
    const id = str(bt.BANK_TR_ID);
    if (!id || seenBtr.has(id)) continue;
    seenBtr.add(id);
    const acc = bankAccountByNo.get(str(bt.ACC_NO));
    bank_transactions.push({
      bank_tr_id: id,
      ref_no: str(bt.REF_NO),
      tr_date: str(bt.BANK_TR_DATE),
      type_id: str(bt.BANK_TR_TILTEL_ID, 'BTT01'),
      tr_type: str(bt.TR_TYPE, 'DEPOSIT'),
      cheque_no: str(bt.CHEQUE_NO),
      account_no: str(bt.ACC_NO),
      bank_name: acc?.bank_name || '',
      branch_name_bank: acc?.branch_name || '',
      cheque_date: str(bt.CHEQUE_DATE),
      narration: str(bt.REMARKS),
      amount: num(bt.AMOUNT, 0),
      branch_name: getBranch(bt.COMPANY_ID),
      user_name: str(bt.USER_ID, 'JUBAYER').toUpperCase()
    });
  }

  const journal_vouchers = [];
  const seenJr = new Map();
  for (const j of T('JOURNAL_VOUCHAR')) {
    const baseId = str(j.JR_VOUCHAR_ID);
    if (!baseId) continue;
    const cnt = (seenJr.get(baseId) || 0) + 1;
    seenJr.set(baseId, cnt);
    const vid = cnt === 1 ? baseId : `${baseId}-${cnt}`;
    const lid = str(j.ACC_LEDGER_ID);
    const ledger = ledgerById.get(lid);
    const emp = empById.get(lid);
    const trType = str(j.JR_VOUCHAR_TYPE, 'DR').toUpperCase();
    const amt = num(j.AMOUNT, 0);
    journal_vouchers.push({
      voucher_id: vid,
      ref_no: str(j.REF_NO),
      voucher_date: str(j.JR_VOUCHAR_DATE),
      tr_type: trType,
      acc_sub_group_id: str(j.ACC_SUB_GR_ID),
      acc_head: subGroupById.get(str(j.ACC_SUB_GR_ID))?.sub_group_name || str(j.ACC_SUB_GR_ID),
      accounts_id: lid,
      accounts_name: ledger?.accounts_name || emp?.employee_name || lid || 'GENERAL',
      accounts_to: '',
      narration: str(j.REMARKS),
      sales_id: str(j.REF_ID),
      cheque_no: str(j.CHEQUE_NO),
      due_amount: 0,
      dr_amount: trType === 'DR' ? amt : 0,
      cr_amount: trType === 'CR' ? amt : 0,
      branch_name: getBranch(j.COMPANY_ID),
      user_name: str(j.USER_ID, 'JUBAYER').toUpperCase()
    });
  }

  const balance_transfers = [];
  const seenBt = new Set();
  for (const bt of T('BALANCE_TRANSFER')) {
    const id = str(bt.TRANSFER_ID);
    if (!id || seenBt.has(id)) continue;
    seenBt.add(id);
    balance_transfers.push({
      transfer_id: id,
      ref_no: str(bt.REF_NO),
      transfer_date: str(bt.TRANSFER_DATE),
      transfer_from: getBranch(bt.COMPANY_ID),
      transfer_to: getBranch(bt.COMPANY_ID_TO),
      tr_type: str(bt.TRANSFER_TYPE, 'CASH') || 'CASH',
      account_no: str(bt.ACCOUNT_NO),
      narration: str(bt.REMARKS),
      amount: num(bt.AMOUNT, 0),
      approved: str(bt.APPROVED) === 'A' ? 'Approved' : 'Pending',
      user_name: str(bt.USER_ID, 'JUBAYER').toUpperCase()
    });
  }

  return {
    companies,
    branches,
    stores,
    users,
    trader_groups,
    traders,
    categories,
    product_groups,
    brands,
    colors,
    products,
    branch_prices,
    account_sub_groups,
    account_ledgers,
    banks,
    bank_accounts,
    cheque_books,
    employees,
    salary_processes: [],
    stock_balances,
    product_serials,
    serial_history: [],
    purchases,
    purchase_items,
    purchase_returns,
    purchase_return_items,
    price_quotations,
    price_quotation_items,
    sales,
    sales_items,
    sales_returns,
    sales_return_items,
    stock_transfers,
    stock_transfer_items,
    rma_complains: [],
    rma_complain_items: [],
    rma_replace_outs: [],
    rma_replace_out_items: [],
    rma_replace_ins: [],
    rma_replace_in_items: [],
    rma_deliveries: [],
    rma_delivery_items: [],
    service_groups,
    problem_groups,
    services,
    problems,
    service_bills: [],
    service_bill_items: [],
    payments,
    collections,
    bank_transactions,
    journal_vouchers,
    balance_transfers,
    modification_logs: [
      {
        log_type: 'DATABASE_RESTORE',
        transaction_id: 'BAK_IMPORT',
        action: 'RESTORE_BAK',
        user_name: 'JUBAYER',
        branch_name: branches[0]?.branch_name || 'HAZI TRADERS',
        log_date: new Date().toLocaleDateString('en-GB'),
        details: `Restored ${products.length} products, ${traders.length} traders, ${sales.length} sales, ${purchases.length} purchases from SQL Server .Bak`,
        amount: 0
      }
    ]
  };
}
