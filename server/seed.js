import { db, adjustStock, logModification } from './db.js';

export function seedDatabase() {
  const userCount = db.prepare(`SELECT COUNT(*) AS cnt FROM users`).get().cnt;
  if (userCount > 0) return;

  // 1. Companies, Branches, Stores
  db.prepare(`INSERT INTO companies (company_id, company_name) VALUES ('CMP001', 'HAZI TRADERS')`).run();
  db.prepare(`INSERT INTO branches (branch_id, company_id, branch_name, address, phone) VALUES ('BR001', 'CMP001', 'HAZI TRADERS', 'Motijheel Commercial Area, Dhaka', '01818524712, 01402338209')`).run();
  db.prepare(`INSERT INTO branches (branch_id, company_id, branch_name, address, phone) VALUES ('BR002', 'CMP001', 'HAZI TRADERS-2', 'Uttara Sector-7, Dhaka', '01818524712, 01402338209')`).run();

  db.prepare(`INSERT INTO stores (store_id, store_name, branch_name) VALUES ('ST001', 'SHOW ROOM', 'HAZI TRADERS')`).run();
  db.prepare(`INSERT INTO stores (store_id, store_name, branch_name) VALUES ('ST002', 'MAIN GODOWN', 'HAZI TRADERS')`).run();

  // 2. Users (matching hazierp.top users list)
  const insertUser = db.prepare(`
    INSERT INTO users (user_id, user_name, password, father_name, mother_name, address, email, mobile, opt_mobile, permission_type, operate_company, active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Y')
  `);
  insertUser.run('jubayer', 'JUBAYER', '555444', 'Md. Abdul Karim', 'Fatema Begum', 'Dhaka, Bangladesh', 'jubayer@hazierp.top', '01818524712', '01402338209', 'A', 'HAZI TRADERS');
  insertUser.run('admin', 'ADMINISTRATOR', '555444', 'Hazi M. Rahman', 'Amena Khatun', 'Dhaka', 'admin@hazierp.top', '01818524712', '', 'A', 'HAZI TRADERS');
  const staffUsers = ['BABU', 'BASHIR UDDIN', 'JABER', 'JAHANGIR', 'JAHID', 'RASHED', 'ROBIN', 'SHAWON', 'SHEHAB'];
  for (const u of staffUsers) {
    insertUser.run(u.toLowerCase().replace(/\s+/g, ''), u, '123456', '', '', 'Dhaka', '', '01700000000', '', 'U', 'HAZI TRADERS');
  }

  // 3. Employees (HRM)
  const insertEmp = db.prepare(`
    INSERT INTO employees (employee_id, employee_name, father_name, mother_name, address, email, mobile, family_mobile, education, joining_date, basic_salary, gross_salary, designation, opening_balance, active, employee_type, salary_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Y', 'Y', 'Y')
  `);
  insertEmp.run('EMP001', 'JUBAYER AHMED', 'Md. Abdul Karim', 'Fatema Begum', 'Mirpur-10, Dhaka', 'jubayer@hazierp.top', '01818524712', '01402338209', 'MBA', '01/01/2024', 18000, 28000, 'Branch Manager', 0);
  insertEmp.run('EMP002', 'BASHIR UDDIN', 'Md. Rafiqul Islam', 'Salma Begum', 'Jatrabari, Dhaka', 'bashir@hazierp.top', '01711223344', '01711223300', 'B.Com', '15/03/2024', 14000, 22000, 'Senior MPO / SR', 0);
  insertEmp.run('EMP003', 'ENG. RASHED KHAN', 'Md. Habibur Rahman', 'Rokeya Begum', 'Uttara, Dhaka', 'rashed@hazierp.top', '01911223344', '01911223300', 'Diploma in EEE', '10/06/2024', 15000, 24000, 'Service Engineer', 0);
  insertEmp.run('EMP004', 'SHAWON HOSSAIN', 'Md. Shafiqul Islam', 'Nasrin Akter', 'Dhanmondi, Dhaka', 'shawon@hazierp.top', '01611223344', '01611223300', 'BBA', '01/08/2024', 12000, 18500, 'Sales Executive (MPO)', 0);

  // 4. Primary Setup: Trader Groups & Traders
  const insertTG = db.prepare(`INSERT INTO trader_groups (group_id, group_name, active) VALUES (?, ?, 'Y')`);
  insertTG.run('CSG001', 'DHAKA WHOLESALE ZONE');
  insertTG.run('CSG002', 'CORPORATE DEALERS');
  insertTG.run('CSG003', 'IMPORT & SUPPLIERS');
  insertTG.run('CSG004', 'RETAIL CUSTOMERS');

  const insertTrader = db.prepare(`
    INSERT INTO traders (cs_id, cs_name, group_id, group_name, mpo_id, mpo_name, address, mobile, phone, email, contact_person, credit_limit, bin, opening_balance, trader_type, customer_type, active, branch_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Y', 'HAZI TRADERS')
  `);
  insertTrader.run('CS00001', 'WALTON DIGI-TECH INDUSTRIES', 'CSG003', 'IMPORT & SUPPLIERS', 'EMP002', 'BASHIR UDDIN', 'Chandra, Gazipur', '01711001122', '02-5501234', 'supply@waltonbd.com', 'Kamrul Hasan', 1500000, 'BIN-001425-01', 45000, 'S', 'DEALER');
  insertTrader.run('CS00002', 'GLOBAL BRAND PVT LTD', 'CSG003', 'IMPORT & SUPPLIERS', 'EMP002', 'BASHIR UDDIN', 'IDB Bhaban, Agargaon, Dhaka', '01819002233', '02-9112233', 'sales@globalbrand.com.bd', 'Tariqul Islam', 1200000, 'BIN-002981-02', 20000, 'S', 'DEALER');
  insertTrader.run('CS00003', 'HAMKO BATTERY CORPORATION', 'CSG003', 'IMPORT & SUPPLIERS', 'EMP002', 'BASHIR UDDIN', 'Tejgaon I/A, Dhaka', '01713004455', '02-8877665', 'info@hamko.com.bd', 'Ashraful Alam', 1000000, 'BIN-009811-04', 0, 'S', 'DEALER');
  insertTrader.run('CS00004', 'STAR TECH & ENGINEERING', 'CSG002', 'CORPORATE DEALERS', 'EMP002', 'BASHIR UDDIN', 'Multiplan Center, Elephant Road, Dhaka', '01755112233', '09678002003', 'accounts@startech.com.bd', 'Sajjad Hossain', 500000, 'BIN-102938-01', 15000, 'C', 'DEALER');
  insertTrader.run('CS00005', 'RYANS COMPUTERS LTD', 'CSG002', 'CORPORATE DEALERS', 'EMP004', 'SHAWON HOSSAIN', 'Banani Road-11, Dhaka', '01844556677', '09638442121', 'purchase@ryans.com', 'Mahbubur Rahman', 600000, 'BIN-223344-02', 8500, 'C', 'DEALER');
  insertTrader.run('CS00006', 'NEW METRO ELECTRONICS', 'CSG001', 'DHAKA WHOLESALE ZONE', 'EMP002', 'BASHIR UDDIN', 'Nawabpur Road, Dhaka', '01922334455', '', 'metro@gmail.com', 'Hazi Fazlul Haque', 350000, 'BIN-554433-01', 12000, 'C', 'DEALER');
  insertTrader.run('CS00007', 'BISMILLAH TRADERS & ENTERPRISE', 'CSG001', 'DHAKA WHOLESALE ZONE', 'EMP004', 'SHAWON HOSSAIN', 'Stadium Market, Dhaka', '01677889900', '', 'bismillah@gmail.com', 'Monirul Islam', 250000, '', 5000, 'C', 'RETAILER');
  insertTrader.run('CS00008', 'CASH CUSTOMER', 'CSG004', 'RETAIL CUSTOMERS', 'EMP001', 'JUBAYER AHMED', 'Dhaka', '01800000000', '', '', 'Walk-in Customer', 100000, '', 0, 'C', 'RETAILER');

  // 5. Categories, Product Groups, Brands, Colors, Products
  const insertCat = db.prepare(`INSERT INTO categories (category_id, category_name, active) VALUES (?, ?, 'Y')`);
  insertCat.run('CAT001', 'ELECTRONICS & IT');
  insertCat.run('CAT002', 'POWER & BATTERY');
  insertCat.run('CAT003', 'NETWORKING & ACCESSORIES');

  const insertPG = db.prepare(`INSERT INTO product_groups (group_id, group_name, active) VALUES (?, ?, 'Y')`);
  insertPG.run('PG001', 'IPS & UPS BATTERY');
  insertPG.run('PG002', 'SOLAR & INVERTER');
  insertPG.run('PG003', 'LED MONITOR & DISPLAY');
  insertPG.run('PG004', 'ROUTER & SWITCH');
  insertPG.run('PG005', 'CABLE & ACCESSORIES');

  const insertBrand = db.prepare(`INSERT INTO brands (brand_id, brand_name, active) VALUES (?, ?, 'Y')`);
  insertBrand.run('BR001', 'HAMKO');
  insertBrand.run('BR002', 'WALTON');
  insertBrand.run('BR003', 'LUMINOUS');
  insertBrand.run('BR004', 'TP-LINK');
  insertBrand.run('BR005', 'SAMSUNG');

  const insertColor = db.prepare(`INSERT INTO colors (color_id, color_name, active) VALUES (?, ?, 'Y')`);
  insertColor.run('CLR001', 'BLACK');
  insertColor.run('CLR002', 'WHITE');
  insertColor.run('CLR003', 'SILVER');
  insertColor.run('CLR004', 'BLUE');

  const insertProd = db.prepare(`
    INSERT INTO products (
      product_id, product_name, category_id, category_name, group_id, group_name, brand_id, brand_name,
      barcode_id, description, location, color, size, serial_item, inventory_item,
      purchase_price, sales_price, unit, discount, wholesale_price, dealer_price,
      wholesale_comm, dealer_comm, sales_comm, warranty, reorder_level, red_level, vat, level_qty, active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Y', ?, ?, 'PCS', ?, ?, ?, 0, 0, 0, ?, ?, ?, ?, ?, 'Y')
  `);
  insertProd.run('PRD00001', 'HAMKO 150AH TUBULAR IPS BATTERY', 'CAT002', 'POWER & BATTERY', 'PG001', 'IPS & UPS BATTERY', 'BR001', 'HAMKO', '89010001', 'Hamko HPD-150T Heavy Duty Tubular IPS Battery 12V 150Ah', 'RACK-A1', 'WHITE', '150AH', 'Y', 17500, 19800, 0, 19000, 18700, '18 Months', 10, 5, 5, 25);
  insertProd.run('PRD00002', 'LUMINOUS ECO VOLT NEO 1050 IPS', 'CAT002', 'POWER & BATTERY', 'PG002', 'SOLAR & INVERTER', 'BR003', 'LUMINOUS', '89010002', 'Luminous Eco Volt Neo 1050 Pure Sine Wave Home UPS Inverter', 'RACK-A2', 'BLACK', '900VA', 'Y', 9200, 10800, 0, 10300, 10100, '24 Months', 8, 4, 5, 20);
  insertProd.run('PRD00003', 'WALTON 22 INCH FHD IPS MONITOR', 'CAT001', 'ELECTRONICS & IT', 'PG003', 'LED MONITOR & DISPLAY', 'BR002', 'WALTON', '89010003', 'Walton WD215V06 21.5 Inch 75Hz Full HD Frameless IPS LED Monitor', 'RACK-B1', 'BLACK', '22 INCH', 'Y', 9500, 11200, 0, 10700, 10500, '36 Months', 6, 3, 5, 15);
  insertProd.run('PRD00004', 'TP-LINK ARCHER C6 GIGABIT ROUTER', 'CAT003', 'NETWORKING & ACCESSORIES', 'PG004', 'ROUTER & SWITCH', 'BR004', 'TP-LINK', '89010004', 'TP-Link Archer C6 AC1200 Wireless MU-MIMO Gigabit Router', 'RACK-C1', 'BLACK', 'AC1200', 'Y', 2850, 3450, 0, 3250, 3150, '12 Months', 15, 5, 0, 40);
  insertProd.run('PRD00005', 'HEAVY DUTY COPPER BATTERY CABLE SET', 'CAT003', 'NETWORKING & ACCESSORIES', 'PG005', 'CABLE & ACCESSORIES', 'BR001', 'HAMKO', '89010005', 'Pure Copper Battery Connector Cable Pair with Brass Terminal Lugs', 'RACK-D1', 'BLACK', '1.5M', 'N', 240, 350, 0, 310, 290, '6 Months', 30, 10, 0, 100);

  // Branch prices for both branches
  const prods = db.prepare(`SELECT * FROM products`).all();
  const insertBP = db.prepare(`
    INSERT INTO branch_prices (branch_name, product_id, product_name, group_name, brand_name, purchase_price, sales_price_with_tax, sales_price_without_tax, wholesale_price, dealer_price, red_level)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const p of prods) {
    for (const br of ['HAZI TRADERS', 'HAZI TRADERS-2']) {
      insertBP.run(br, p.product_id, p.product_name, p.group_name, p.brand_name, p.purchase_price, p.sales_price, p.sales_price, p.wholesale_price, p.dealer_price, p.red_level);
    }
  }

  // 6. Accounts Setup: Sub Groups, Ledgers, Banks, Bank Accounts, Cheques
  const insertASG = db.prepare(`INSERT INTO account_sub_groups (sub_group_id, sub_group_name, group_id, group_name) VALUES (?, ?, ?, ?)`);
  insertASG.run('ASG001', 'OFFICE EXPENSES', 'AG07', 'INDIRECT EXPENSES');
  insertASG.run('ASG002', 'SALARY & ALLOWANCES', 'AG07', 'INDIRECT EXPENSES');
  insertASG.run('ASG003', 'CASH & BANK BALANCES', 'AG02', 'CURRENT ASSET');
  insertASG.run('ASG004', 'SALES & SERVICE REVENUE', 'AG05', 'DIRECT INCOME');
  insertASG.run('ASG005', 'OWNER CAPITAL', 'AG01', 'CAPITAL ACCOUNT');

  const insertLedger = db.prepare(`INSERT INTO account_ledgers (accounts_id, accounts_name, sub_group_id, sub_group_name, group_name, balance, active) VALUES (?, ?, ?, ?, ?, ?, 'Y')`);
  insertLedger.run('ACC0001', 'SALARY EXPENSES', 'ASG002', 'SALARY & ALLOWANCES', 'INDIRECT EXPENSES', 0);
  insertLedger.run('ACC0002', 'SHOWROOM RENT EXPENSE', 'ASG001', 'OFFICE EXPENSES', 'INDIRECT EXPENSES', 25000);
  insertLedger.run('ACC0003', 'ELECTRICITY & INTERNET BILL', 'ASG001', 'OFFICE EXPENSES', 'INDIRECT EXPENSES', 6500);
  insertLedger.run('ACC0004', 'TRANSPORT & CONVEYANCE', 'ASG001', 'OFFICE EXPENSES', 'INDIRECT EXPENSES', 4200);
  insertLedger.run('ACC0005', 'CASH IN HAND', 'ASG003', 'CASH & BANK BALANCES', 'CURRENT ASSET', 385000);
  insertLedger.run('ACC0006', 'PROPRIETOR CAPITAL A/C', 'ASG005', 'OWNER CAPITAL', 'CAPITAL ACCOUNT', 1500000);

  const insertBank = db.prepare(`INSERT INTO banks (bank_id, bank_name, active) VALUES (?, ?, 'Y')`);
  insertBank.run('BK001', 'ISLAMI BANK BANGLADESH PLC');
  insertBank.run('BK002', 'DUTCH-BANGLA BANK PLC');
  insertBank.run('BK003', 'BRAC BANK PLC');

  const insertBA = db.prepare(`
    INSERT INTO bank_accounts (bk_br_id, bank_id, bank_name, branch_name, address, routing_no, contact_person, contact_no, email, account_no, balance, active, account_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Y', ?)
  `);
  insertBA.run('BKB001', 'BK001', 'ISLAMI BANK BANGLADESH PLC', 'MOTIJHEEL LOCAL OFFICE', 'Motijheel, Dhaka', '125274249', 'Md. Faruk', '01711009988', 'motijheel@islamibankbd.com', '20501010200345618', 640000, 'GENARAL');
  insertBA.run('BKB002', 'BK002', 'DUTCH-BANGLA BANK PLC', 'ELEPHANT ROAD BRANCH', 'Elephant Road, Dhaka', '090261364', 'Rezaul Karim', '01811223399', 'eroad@dutchbanglabank.com', '1261100045892', 415000, 'GENARAL');
  insertBA.run('BKB003', 'BK003', 'BRAC BANK PLC', 'BKASH MERCHANT SETTLEMENT', 'Tejgaon, Dhaka', '060270431', 'Merchant Desk', '01700778899', 'merchant@bracbank.com', '01818524712-BKASH', 95000, 'MOBILE');

  const insertChq = db.prepare(`
    INSERT INTO cheque_books (bank_id, bank_name, bk_br_id, branch_name, account_no, cheque_no, status, transaction_type, transaction_id, trader_name, transaction_date, cheque_date, amount)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (let i = 900101; i <= 900110; i++) {
    const chqNo = `CHQ-${i}`;
    if (i === 900101) {
      insertChq.run('BK001', 'ISLAMI BANK BANGLADESH PLC', 'BKB001', 'MOTIJHEEL LOCAL OFFICE', '20501010200345618', chqNo, 'HONORED', 'PAYMENT', 'PAY001260000002', 'WALTON DIGI-TECH INDUSTRIES', '10/11/2026', '12/11/2026', 85000);
    } else if (i === 900102) {
      insertChq.run('BK001', 'ISLAMI BANK BANGLADESH PLC', 'BKB001', 'MOTIJHEEL LOCAL OFFICE', '20501010200345618', chqNo, 'WAITING_FOR_HONOR', 'PAYMENT', 'PAY001260000003', 'HAMKO BATTERY CORPORATION', '20/11/2026', '25/11/2026', 65000);
    } else {
      insertChq.run('BK001', 'ISLAMI BANK BANGLADESH PLC', 'BKB001', 'MOTIJHEEL LOCAL OFFICE', '20501010200345618', chqNo, 'UNUSED', '', '', '', '', '', 0);
    }
  }
  insertChq.run('BK002', 'DUTCH-BANGLA BANK PLC', 'BKB002', 'ELEPHANT ROAD BRANCH', '1261100045892', 'RCV-774501', 'WAITING_FOR_DEPOSIT', 'COLLECTION', 'COL001260000003', 'STAR TECH & ENGINEERING', '21/11/2026', '24/11/2026', 38000);

  // 7. Servicing Setup & Sample Service Bill
  db.prepare(`INSERT INTO service_groups (service_group_id, service_group_name, active) VALUES ('SVG001', 'IPS & INVERTER SERVICING', 'Y')`).run();
  db.prepare(`INSERT INTO service_groups (service_group_id, service_group_name, active) VALUES ('SVG002', 'MONITOR & IT REPAIR', 'Y')`).run();

  db.prepare(`INSERT INTO problem_groups (problem_group_id, problem_group_name, active) VALUES ('PRG001', 'POWER & CHARGING ISSUE', 'Y')`).run();
  db.prepare(`INSERT INTO problem_groups (problem_group_id, problem_group_name, active) VALUES ('PRG002', 'DISPLAY & BOARD FAULT', 'Y')`).run();

  db.prepare(`INSERT INTO services (service_id, service_name, service_group_id, service_group_name, description, active) VALUES ('SV00000001', 'IPS MOTHERBOARD & MOSFET REPAIR', 'SVG001', 'IPS & INVERTER SERVICING', 'Full MOSFET & Charging Relay Replacement and Calibration', 'Y')`).run();
  db.prepare(`INSERT INTO services (service_id, service_name, service_group_id, service_group_name, description, active) VALUES ('SV00000002', 'BATTERY ACID GRAVITY & DESULFATION SERVICE', 'SVG001', 'IPS & INVERTER SERVICING', 'Tubular Battery Cell Gravity Restoration & Boost Charging', 'Y')`).run();

  db.prepare(`INSERT INTO problems (problem_id, problem_name, problem_group_id, problem_group_name, description, active) VALUES ('PR00000001', 'NO BACKUP / OVERLOAD BEEP', 'PRG001', 'POWER & CHARGING ISSUE', 'Unit switches to overload immediately on power cut', 'Y')`).run();
  db.prepare(`INSERT INTO problems (problem_id, problem_name, problem_group_id, problem_group_name, description, active) VALUES ('PR00000002', 'NO DISPLAY / POWER DEAD', 'PRG002', 'DISPLAY & BOARD FAULT', 'No LED indicator or display screen output', 'Y')`).run();

  db.prepare(`
    INSERT INTO service_bills (service_bill_id, ref_no, service_date, cash_customer, mobile_no, cs_group_name, customer_name, narration, engineer_name, total_amount, discount_amount, net_payable, branch_name, user_name)
    VALUES ('SVB001260000001', 'SR-101', '18/11/2026', 'Rafiq Electronics', '01712345678', 'DHAKA WHOLESALE ZONE', 'NEW METRO ELECTRONICS', 'IPS Board Repair Done', 'ENG. RASHED KHAN', 1200, 100, 1100, 'HAZI TRADERS', 'JUBAYER')
  `).run();
  db.prepare(`
    INSERT INTO service_bill_items (service_bill_id, problem_group, problem_id, problem_name, problem_description, service_group, service_id, service_name, service_description, qty, unit_price, total_price)
    VALUES ('SVB001260000001', 'POWER & CHARGING ISSUE', 'PR00000001', 'NO BACKUP / OVERLOAD BEEP', 'Overload beep fault', 'IPS & INVERTER SERVICING', 'SV00000001', 'IPS MOTHERBOARD & MOSFET REPAIR', 'Replaced 4 MOSFETs', 1, 1200, 1200)
  `).run();

  // 8. Purchases + Serials + Stock
  const insertPur = db.prepare(`
    INSERT INTO purchases (purchase_id, ref_no, purchase_date, cs_group, cs_id, cs_name, store_name, narration, commenc_date, total_amount, vat_amount, discount_amount, net_payable, payment_amount, branch_name, user_name)
    VALUES (?, ?, ?, ?, ?, ?, 'SHOW ROOM', ?, ?, ?, ?, ?, ?, ?, 'HAZI TRADERS', 'JUBAYER')
  `);
  const insertPurItem = db.prepare(`
    INSERT INTO purchase_items (purchase_id, product_id, product_group, product_name, product_description, warranty, expiry_date, serial_no, qty, unit_price, total_price)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertSerial = db.prepare(`
    INSERT INTO product_serials (serial_no, product_id, product_name, product_group, branch_name, store_name, stock_type, status, purchase_id, purchase_date, supplier_name, warranty, unit_price)
    VALUES (?, ?, ?, ?, 'HAZI TRADERS', 'SHOW ROOM', 'COMMERCIAL', ?, ?, ?, ?, ?, ?)
  `);
  const insertSerialHist = db.prepare(`
    INSERT INTO serial_history (serial_no, old_serial, new_serial, transaction_type, transaction_id, transaction_date, cs_name, product_group, product_id, product_name, warranty, problem, amount, narration, branch_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'HAZI TRADERS')
  `);

  // Purchase 1: Hamko Batteries + Luminous IPS
  insertPur.run('PUR001260000001', 'CH-8801', '05/11/2026', 'IMPORT & SUPPLIERS', 'CS00003', 'HAMKO BATTERY CORPORATION', 'Monthly Battery & IPS Stock In', '05/11/2026', 267000, 0, 2000, 265000, 180000);
  const hmkSerials = ['HMK150-26001', 'HMK150-26002', 'HMK150-26003', 'HMK150-26004', 'HMK150-26005', 'HMK150-26006', 'HMK150-26007', 'HMK150-26008', 'HMK150-26009', 'HMK150-26010'];
  insertPurItem.run('PUR001260000001', 'PRD00001', 'IPS & UPS BATTERY', 'HAMKO 150AH TUBULAR IPS BATTERY', 'Hamko HPD-150T Heavy Duty Tubular IPS Battery 12V 150Ah', '18 Months', '05/05/2028', hmkSerials.join(','), 10, 17500, 175000);
  adjustStock('HAZI TRADERS', 'SHOW ROOM', 'PRD00001', 'COMMERCIAL', 10);
  for (const sn of hmkSerials) {
    insertSerial.run(sn, 'PRD00001', 'HAMKO 150AH TUBULAR IPS BATTERY', 'IPS & UPS BATTERY', 'IN_STOCK', 'PUR001260000001', '05/11/2026', 'HAMKO BATTERY CORPORATION', '18 Months', 17500);
    insertSerialHist.run(sn, sn, sn, 'PURCHASE', 'PUR001260000001', '05/11/2026', 'HAMKO BATTERY CORPORATION', 'IPS & UPS BATTERY', 'PRD00001', 'HAMKO 150AH TUBULAR IPS BATTERY', '18 Months', '', 17500, 'Purchase Stock In');
  }

  const lumSerials = ['LUM1050-5001', 'LUM1050-5002', 'LUM1050-5003', 'LUM1050-5004', 'LUM1050-5005', 'LUM1050-5006', 'LUM1050-5007', 'LUM1050-5008', 'LUM1050-5009', 'LUM1050-5010'];
  insertPurItem.run('PUR001260000001', 'PRD00002', 'SOLAR & INVERTER', 'LUMINOUS ECO VOLT NEO 1050 IPS', 'Luminous Eco Volt Neo 1050 Pure Sine Wave Home UPS Inverter', '24 Months', '05/11/2028', lumSerials.join(','), 10, 9200, 92000);
  adjustStock('HAZI TRADERS', 'SHOW ROOM', 'PRD00002', 'COMMERCIAL', 10);
  for (const sn of lumSerials) {
    insertSerial.run(sn, 'PRD00002', 'LUMINOUS ECO VOLT NEO 1050 IPS', 'SOLAR & INVERTER', 'IN_STOCK', 'PUR001260000001', '05/11/2026', 'HAMKO BATTERY CORPORATION', '24 Months', 9200);
    insertSerialHist.run(sn, sn, sn, 'PURCHASE', 'PUR001260000001', '05/11/2026', 'HAMKO BATTERY CORPORATION', 'SOLAR & INVERTER', 'PRD00002', 'LUMINOUS ECO VOLT NEO 1050 IPS', '24 Months', '', 9200, 'Purchase Stock In');
  }

  // Purchase 2: Monitors, Routers, Cables
  insertPur.run('PUR001260000002', 'WL-9920', '08/11/2026', 'IMPORT & SUPPLIERS', 'CS00001', 'WALTON DIGI-TECH INDUSTRIES', 'Monitors, Routers & Cable Shipment', '08/11/2026', 164000, 0, 0, 164000, 100000);
  const monSerials = ['WLT22-1001', 'WLT22-1002', 'WLT22-1003', 'WLT22-1004', 'WLT22-1005', 'WLT22-1006', 'WLT22-1007', 'WLT22-1008'];
  insertPurItem.run('PUR001260000002', 'PRD00003', 'LED MONITOR & DISPLAY', 'WALTON 22 INCH FHD IPS MONITOR', 'Walton WD215V06 21.5 Inch 75Hz Full HD Frameless IPS LED Monitor', '36 Months', '08/11/2029', monSerials.join(','), 8, 9500, 76000);
  adjustStock('HAZI TRADERS', 'SHOW ROOM', 'PRD00003', 'COMMERCIAL', 8);
  for (const sn of monSerials) {
    insertSerial.run(sn, 'PRD00003', 'WALTON 22 INCH FHD IPS MONITOR', 'LED MONITOR & DISPLAY', 'IN_STOCK', 'PUR001260000002', '08/11/2026', 'WALTON DIGI-TECH INDUSTRIES', '36 Months', 9500);
    insertSerialHist.run(sn, sn, sn, 'PURCHASE', 'PUR001260000002', '08/11/2026', 'WALTON DIGI-TECH INDUSTRIES', 'LED MONITOR & DISPLAY', 'PRD00003', 'WALTON 22 INCH FHD IPS MONITOR', '36 Months', '', 9500, 'Purchase Stock In');
  }

  const rtrSerials = [];
  for (let i = 1; i <= 20; i++) rtrSerials.push(`TPL-C6-${String(i).padStart(4, '0')}`);
  insertPurItem.run('PUR001260000002', 'PRD00004', 'ROUTER & SWITCH', 'TP-LINK ARCHER C6 GIGABIT ROUTER', 'TP-Link Archer C6 AC1200 Wireless MU-MIMO Gigabit Router', '12 Months', '08/11/2027', rtrSerials.join(','), 20, 2850, 57000);
  adjustStock('HAZI TRADERS', 'SHOW ROOM', 'PRD00004', 'COMMERCIAL', 20);
  for (const sn of rtrSerials) {
    insertSerial.run(sn, 'PRD00004', 'TP-LINK ARCHER C6 GIGABIT ROUTER', 'ROUTER & SWITCH', 'IN_STOCK', 'PUR001260000002', '08/11/2026', 'WALTON DIGI-TECH INDUSTRIES', '12 Months', 2850);
    insertSerialHist.run(sn, sn, sn, 'PURCHASE', 'PUR001260000002', '08/11/2026', 'WALTON DIGI-TECH INDUSTRIES', 'ROUTER & SWITCH', 'PRD00004', 'TP-LINK ARCHER C6 GIGABIT ROUTER', '12 Months', '', 2850, 'Purchase Stock In');
  }

  insertPurItem.run('PUR001260000002', 'PRD00005', 'CABLE & ACCESSORIES', 'HEAVY DUTY COPPER BATTERY CABLE SET', 'Pure Copper Battery Connector Cable Pair with Brass Terminal Lugs', '6 Months', '', '', 100, 240, 24000);
  adjustStock('HAZI TRADERS', 'SHOW ROOM', 'PRD00005', 'COMMERCIAL', 100);
  // Seed RMA stock for RMA demos
  adjustStock('HAZI TRADERS', 'SHOW ROOM', 'PRD00001', 'RMA', 2);
  adjustStock('HAZI TRADERS', 'SHOW ROOM', 'PRD00004', 'RMA', 3);

  // 9. Sales Invoices (populating DATE_WISE_BILL_SEARCH & Reports)
  const insertSale = db.prepare(`
    INSERT INTO sales (
      sales_id, ref_no, sales_date, mobile_no, cs_group, cs_id, cs_name, cash_customer_name,
      store_name, price_tier, sales_type, collection_type, account_no, advance_sales, narration,
      total_amount, service_charge, extra_charge, tax_amount, vat_amount, discount_amount, net_payable, collection_amount, approved, branch_name, user_name
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'SHOW ROOM', 'SALES_PRICE', ?, 'CASH', '', 0, ?, ?, 0, 0, 0, 0, ?, ?, ?, 'Approved', 'HAZI TRADERS', ?)
  `);
  const insertSaleItem = db.prepare(`
    INSERT INTO sales_items (sales_id, product_id, product_group, product_name, product_description, item_remarks, warranty, serial_no, qty, unit_price, cost_price, discount, vat_percent, total_price)
    VALUES (?, ?, ?, ?, ?, '', ?, ?, ?, ?, ?, 0, 0, ?)
  `);

  // Sale 1
  insertSale.run('INV001260000001', 'BILL-101', '12/11/2026', '01922334455', 'DHAKA WHOLESALE ZONE', 'CS00006', 'NEW METRO ELECTRONICS', '', 'CREDIT', 'IPS & Battery Package Supply', 61200, 1200, 60000, 40000, 'JUBAYER');
  insertSaleItem.run('INV001260000001', 'PRD00001', 'IPS & UPS BATTERY', 'HAMKO 150AH TUBULAR IPS BATTERY', 'Hamko HPD-150T Heavy Duty Tubular IPS Battery 12V 150Ah', '18 Months', 'HMK150-26001,HMK150-26002', 2, 19800, 17500, 39600);
  insertSaleItem.run('INV001260000001', 'PRD00002', 'SOLAR & INVERTER', 'LUMINOUS ECO VOLT NEO 1050 IPS', 'Luminous Eco Volt Neo 1050 Pure Sine Wave Home UPS Inverter', '24 Months', 'LUM1050-5001,LUM1050-5002', 2, 10800, 9200, 21600);
  adjustStock('HAZI TRADERS', 'SHOW ROOM', 'PRD00001', 'COMMERCIAL', -2);
  adjustStock('HAZI TRADERS', 'SHOW ROOM', 'PRD00002', 'COMMERCIAL', -2);
  for (const sn of ['HMK150-26001', 'HMK150-26002']) {
    db.prepare(`UPDATE product_serials SET status = 'SOLD', sales_id = 'INV001260000001', sales_date = '12/11/2026', customer_name = 'NEW METRO ELECTRONICS' WHERE serial_no = ?`).run(sn);
    insertSerialHist.run(sn, sn, sn, 'SALES', 'INV001260000001', '12/11/2026', 'NEW METRO ELECTRONICS', 'IPS & UPS BATTERY', 'PRD00001', 'HAMKO 150AH TUBULAR IPS BATTERY', '18 Months', '', 19800, 'Sold to Customer');
  }
  for (const sn of ['LUM1050-5001', 'LUM1050-5002']) {
    db.prepare(`UPDATE product_serials SET status = 'SOLD', sales_id = 'INV001260000001', sales_date = '12/11/2026', customer_name = 'NEW METRO ELECTRONICS' WHERE serial_no = ?`).run(sn);
    insertSerialHist.run(sn, sn, sn, 'SALES', 'INV001260000001', '12/11/2026', 'NEW METRO ELECTRONICS', 'SOLAR & INVERTER', 'PRD00002', 'LUMINOUS ECO VOLT NEO 1050 IPS', '24 Months', '', 10800, 'Sold to Customer');
  }

  // Sale 2
  insertSale.run('INV001260000002', 'BILL-102', '16/11/2026', '01755112233', 'CORPORATE DEALERS', 'CS00004', 'STAR TECH & ENGINEERING', '', 'CREDIT', 'Monitors & Gigabit Routers Order', 49150, 150, 49000, 30000, 'JUBAYER');
  insertSaleItem.run('INV001260000002', 'PRD00003', 'LED MONITOR & DISPLAY', 'WALTON 22 INCH FHD IPS MONITOR', 'Walton WD215V06 21.5 Inch 75Hz Full HD Frameless IPS LED Monitor', '36 Months', 'WLT22-1001,WLT22-1002,WLT22-1003', 3, 11200, 9500, 33600);
  insertSaleItem.run('INV001260000002', 'PRD00004', 'ROUTER & SWITCH', 'TP-LINK ARCHER C6 GIGABIT ROUTER', 'TP-Link Archer C6 AC1200 Wireless MU-MIMO Gigabit Router', '12 Months', 'TPL-C6-0001,TPL-C6-0002,TPL-C6-0003,TPL-C6-0004', 4, 3450, 2850, 13800);
  insertSaleItem.run('INV001260000002', 'PRD00005', 'CABLE & ACCESSORIES', 'HEAVY DUTY COPPER BATTERY CABLE SET', 'Pure Copper Battery Connector Cable Pair with Brass Terminal Lugs', '6 Months', '', 5, 350, 240, 1750);
  adjustStock('HAZI TRADERS', 'SHOW ROOM', 'PRD00003', 'COMMERCIAL', -3);
  adjustStock('HAZI TRADERS', 'SHOW ROOM', 'PRD00004', 'COMMERCIAL', -4);
  adjustStock('HAZI TRADERS', 'SHOW ROOM', 'PRD00005', 'COMMERCIAL', -5);
  for (const sn of ['WLT22-1001', 'WLT22-1002', 'WLT22-1003']) {
    db.prepare(`UPDATE product_serials SET status = 'SOLD', sales_id = 'INV001260000002', sales_date = '16/11/2026', customer_name = 'STAR TECH & ENGINEERING' WHERE serial_no = ?`).run(sn);
    insertSerialHist.run(sn, sn, sn, 'SALES', 'INV001260000002', '16/11/2026', 'STAR TECH & ENGINEERING', 'LED MONITOR & DISPLAY', 'PRD00003', 'WALTON 22 INCH FHD IPS MONITOR', '36 Months', '', 11200, 'Sold to Dealer');
  }
  for (const sn of ['TPL-C6-0001', 'TPL-C6-0002', 'TPL-C6-0003', 'TPL-C6-0004']) {
    db.prepare(`UPDATE product_serials SET status = 'SOLD', sales_id = 'INV001260000002', sales_date = '16/11/2026', customer_name = 'STAR TECH & ENGINEERING' WHERE serial_no = ?`).run(sn);
    insertSerialHist.run(sn, sn, sn, 'SALES', 'INV001260000002', '16/11/2026', 'STAR TECH & ENGINEERING', 'ROUTER & SWITCH', 'PRD00004', 'TP-LINK ARCHER C6 GIGABIT ROUTER', '12 Months', '', 3450, 'Sold to Dealer');
  }

  // Sale 3 (Today)
  insertSale.run('INV001260000003', 'BILL-103', '23/11/2026', '01677889900', 'DHAKA WHOLESALE ZONE', 'CS00007', 'BISMILLAH TRADERS & ENTERPRISE', 'Md. Monirul', 'CASH', 'Urgent Showroom Delivery', 32000, 0, 32000, 32000, 'JUBAYER');
  insertSaleItem.run('INV001260000003', 'PRD00001', 'IPS & UPS BATTERY', 'HAMKO 150AH TUBULAR IPS BATTERY', 'Hamko HPD-150T Heavy Duty Tubular IPS Battery 12V 150Ah', '18 Months', 'HMK150-26003', 1, 19800, 17500, 19800);
  insertSaleItem.run('INV001260000003', 'PRD00002', 'SOLAR & INVERTER', 'LUMINOUS ECO VOLT NEO 1050 IPS', 'Luminous Eco Volt Neo 1050 Pure Sine Wave Home UPS Inverter', '24 Months', 'LUM1050-5003', 1, 10800, 9200, 10800);
  insertSaleItem.run('INV001260000003', 'PRD00005', 'CABLE & ACCESSORIES', 'HEAVY DUTY COPPER BATTERY CABLE SET', 'Pure Copper Battery Connector Cable Pair with Brass Terminal Lugs', '6 Months', '', 4, 350, 240, 1400);
  adjustStock('HAZI TRADERS', 'SHOW ROOM', 'PRD00001', 'COMMERCIAL', -1);
  adjustStock('HAZI TRADERS', 'SHOW ROOM', 'PRD00002', 'COMMERCIAL', -1);
  adjustStock('HAZI TRADERS', 'SHOW ROOM', 'PRD00005', 'COMMERCIAL', -4);
  db.prepare(`UPDATE product_serials SET status = 'SOLD', sales_id = 'INV001260000003', sales_date = '23/11/2026', customer_name = 'BISMILLAH TRADERS & ENTERPRISE' WHERE serial_no = 'HMK150-26003'`).run();
  db.prepare(`UPDATE product_serials SET status = 'SOLD', sales_id = 'INV001260000003', sales_date = '23/11/2026', customer_name = 'BISMILLAH TRADERS & ENTERPRISE' WHERE serial_no = 'LUM1050-5003'`).run();

  // 10. Sample Price Quotation
  db.prepare(`
    INSERT INTO price_quotations (quotation_id, ref_no, quotation_date, mobile_no, subject, cash_customer, narration, cs_group, cs_id, customer_name, store_name, total_amount, service_charge, others_charge, tax_amount, vat_amount, discount_amount, net_payable, branch_name, user_name)
    VALUES ('QTN001260000001', 'Q-2026-01', '20/11/2026', '01844556677', 'Quotation for Corporate IPS & Monitor Supply', 'Ryans Procurement Team', 'Valid for 15 days', 'CORPORATE DEALERS', 'CS00005', 'RYANS COMPUTERS LTD', 'SHOW ROOM', 53000, 500, 0, 0, 0, 1000, 52500, 'HAZI TRADERS', 'JUBAYER')
  `).run();
  db.prepare(`
    INSERT INTO price_quotation_items (quotation_id, product_id, product_group, product_name, product_description, item_remarks, warranty, qty, unit_price, vat_percent, total_price)
    VALUES ('QTN001260000001', 'PRD00001', 'IPS & UPS BATTERY', 'HAMKO 150AH TUBULAR IPS BATTERY', 'Hamko HPD-150T Heavy Duty Tubular IPS Battery 12V 150Ah', 'Heavy Duty', '18 Months', 2, 19800, 0, 39600)
  `).run();
  db.prepare(`
    INSERT INTO price_quotation_items (quotation_id, product_id, product_group, product_name, product_description, item_remarks, warranty, qty, unit_price, vat_percent, total_price)
    VALUES ('QTN001260000001', 'PRD00004', 'ROUTER & SWITCH', 'TP-LINK ARCHER C6 GIGABIT ROUTER', 'TP-Link Archer C6 AC1200 Wireless MU-MIMO Gigabit Router', 'Gigabit Edition', '12 Months', 4, 3350, 0, 13400)
  `).run();

  // 11. Sample RMA Lifecycle Records
  db.prepare(`
    INSERT INTO rma_complains (receive_id, ref_no, receive_date, cash_customer, mobile_no, narration, cs_group, cs_name, store_name, total_amount, branch_name, user_name)
    VALUES ('CMR001260000001', 'RMA-01', '19/11/2026', 'New Metro Warranty Desk', '01922334455', 'Battery voltage drop complaint under warranty', 'DHAKA WHOLESALE ZONE', 'NEW METRO ELECTRONICS', 'SHOW ROOM', 19800, 'HAZI TRADERS', 'JUBAYER')
  `).run();
  db.prepare(`
    INSERT INTO rma_complain_items (receive_id, product_id, product_group, product_name, product_description, item_remarks, sold_serial, received_serial, under_warranty, warranty, sales_id, sales_date, no_of_times, job_ref_no, delivery_date, problem_name, engineer_name, qty, unit_price, total_price, charge_amount, status)
    VALUES ('CMR001260000001', 'PRD00001', 'IPS & UPS BATTERY', 'HAMKO 150AH TUBULAR IPS BATTERY', 'Hamko HPD-150T Heavy Duty Tubular IPS Battery 12V 150Ah', 'Cell weak check', 'HMK150-26001', 'HMK150-26001', 'Y', '18 Months', 'INV001260000001', '12/11/2026', '1', 'JOB-101', '24/11/2026', 'NO BACKUP / OVERLOAD BEEP', 'ENG. RASHED KHAN', 1, 19800, 19800, 0, 'RECEIVED')
  `).run();
  insertSerialHist.run('HMK150-26001', 'HMK150-26001', 'HMK150-26001', 'COMPLAIN_RECEIVE', 'CMR001260000001', '19/11/2026', 'NEW METRO ELECTRONICS', 'IPS & UPS BATTERY', 'PRD00001', 'HAMKO 150AH TUBULAR IPS BATTERY', '18 Months', 'NO BACKUP / OVERLOAD BEEP', 0, 'Complain Received from Customer');

  db.prepare(`
    INSERT INTO rma_replace_outs (out_id, ref_no, out_date, cs_group, cs_name, narration, store_name, total_amount, branch_name, user_name)
    VALUES ('OUT001260000001', 'RO-01', '20/11/2026', 'IMPORT & SUPPLIERS', 'HAMKO BATTERY CORPORATION', 'Sent to Hamko Factory Warranty Center', 'SHOW ROOM', 17500, 'HAZI TRADERS', 'JUBAYER')
  `).run();
  db.prepare(`
    INSERT INTO rma_replace_out_items (out_id, receive_id, product_id, product_group, product_name, product_description, purchase_serial, out_serial, under_warranty, purchase_id, purchase_date, no_of_times, job_ref_no, in_date, problem_name, engineer_name, qty, unit_price, charge_amount, status)
    VALUES ('OUT001260000001', 'CMR001260000001', 'PRD00001', 'IPS & UPS BATTERY', 'HAMKO 150AH TUBULAR IPS BATTERY', 'Hamko HPD-150T Heavy Duty Tubular IPS Battery', 'HMK150-26001', 'HMK150-26001', 'Y', 'PUR001260000001', '05/11/2026', '1', 'JOB-101', '22/11/2026', 'NO BACKUP / OVERLOAD BEEP', 'ENG. RASHED KHAN', 1, 17500, 0, 'SENT_OUT')
  `).run();
  insertSerialHist.run('HMK150-26001', 'HMK150-26001', 'HMK150-26001', 'REPLACE_OUT', 'OUT001260000001', '20/11/2026', 'HAMKO BATTERY CORPORATION', 'IPS & UPS BATTERY', 'PRD00001', 'HAMKO 150AH TUBULAR IPS BATTERY', '18 Months', 'NO BACKUP / OVERLOAD BEEP', 0, 'Sent to Supplier for Replacement');

  db.prepare(`
    INSERT INTO rma_replace_ins (in_id, ref_no, in_date, cs_group, cs_name, narration, store_name, adjustment_type, total_amount, branch_name, user_name)
    VALUES ('RIN001260000001', 'RI-01', '22/11/2026', 'IMPORT & SUPPLIERS', 'HAMKO BATTERY CORPORATION', 'New replacement battery received from Hamko', 'SHOW ROOM', 'Without Adjustment', 17500, 'HAZI TRADERS', 'JUBAYER')
  `).run();
  db.prepare(`
    INSERT INTO rma_replace_in_items (in_id, job_ref_no, product_id, product_group, product_name, product_description, out_serial, in_serial, qty, unit_price, charge_amount)
    VALUES ('RIN001260000001', 'JOB-101', 'PRD00001', 'IPS & UPS BATTERY', 'HAMKO 150AH TUBULAR IPS BATTERY', 'Hamko HPD-150T Heavy Duty Tubular IPS Battery', 'HMK150-26001', 'HMK150-26099-NEW', 1, 17500, 0)
  `).run();
  insertSerialHist.run('HMK150-26001', 'HMK150-26001', 'HMK150-26099-NEW', 'REPLACE_IN', 'RIN001260000001', '22/11/2026', 'HAMKO BATTERY CORPORATION', 'IPS & UPS BATTERY', 'PRD00001', 'HAMKO 150AH TUBULAR IPS BATTERY', '18 Months', 'NO BACKUP / OVERLOAD BEEP', 0, 'Replaced with HMK150-26099-NEW');

  // 12. Sample Branch-to-Branch Transfer (Pending in STOCK_RECEIVED_BR_TO_BR_TR.aspx so user can view & receive!)
  db.prepare(`
    INSERT INTO stock_transfers (transfer_id, transfer_mode, ref_no, transfer_date, from_branch, to_branch, from_store, to_store, narration, approved, received, user_name)
    VALUES ('STB001260000001', 'BR_TO_BR', 'TR-BR-01', '22/11/2026', 'HAZI TRADERS', 'HAZI TRADERS-2', 'SHOW ROOM', 'SHOW ROOM', 'Branch stock allocation for Uttara Branch', 'Approved', 'Pending', 'JUBAYER')
  `).run();
  db.prepare(`
    INSERT INTO stock_transfer_items (transfer_id, product_id, product_group, product_name, product_description, serial_no, qty)
    VALUES ('STB001260000001', 'PRD00004', 'ROUTER & SWITCH', 'TP-LINK ARCHER C6 GIGABIT ROUTER', 'TP-Link Archer C6 AC1200 Wireless MU-MIMO Gigabit Router', 'TPL-C6-0019,TPL-C6-0020', 2)
  `).run();

  // 13. Accounts: Payments, Collections, Bank Transactions, Journal, Balance Transfer
  const insertPay = db.prepare(`
    INSERT INTO payments (payment_id, ref_no, payment_date, cs_group, cs_id, cs_name, narration, purchase_id, payment_type, bank_name, branch_name_bank, cheque_no, cheque_date, account_no, dishonor_type, dishonor_cheque_no, invoice_amount, due_amount, total_due_amount, amount, approved, branch_name, user_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '--Select--', '', ?, ?, ?, ?, 'Approved', 'HAZI TRADERS', 'JUBAYER')
  `);
  insertPay.run('PAY001260000001', 'PV-101', '06/11/2026', 'IMPORT & SUPPLIERS', 'CS00003', 'HAMKO BATTERY CORPORATION', 'Cash payment against PUR001260000001', 'PUR001260000001', 'CASH', '', '', '', '', '', 265000, 85000, 85000, 180000);
  insertPay.run('PAY001260000002', 'PV-102', '10/11/2026', 'IMPORT & SUPPLIERS', 'CS00001', 'WALTON DIGI-TECH INDUSTRIES', 'Cheque payment against PUR001260000002', 'PUR001260000002', 'CHEQUE', 'ISLAMI BANK BANGLADESH PLC', 'MOTIJHEEL LOCAL OFFICE', 'CHQ-900101', '12/11/2026', '20501010200345618', 164000, 64000, 109000, 85000);
  insertPay.run('PAY001260000003', 'PV-103', '23/11/2026', 'IMPORT & SUPPLIERS', 'CS00003', 'HAMKO BATTERY CORPORATION', 'Part payment today by cash', 'PUR001260000001', 'CASH', '', '', '', '', '', 265000, 65000, 65000, 20000);

  const insertCol = db.prepare(`
    INSERT INTO collections (collection_id, ref_no, collection_date, on_condition, cs_group, cs_id, cs_name, narration, sales_id, collection_type, bank_name, branch_name_bank, cheque_no, cheque_date, account_no, dishonor_type, dishonor_cheque_no, invoice_amount, due_amount, total_due_amount, amount, approved, branch_name, user_name)
    VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '--Select--', '', ?, ?, ?, ?, 'Approved', 'HAZI TRADERS', ?)
  `);
  insertCol.run('COL001260000001', 'MR-201', '12/11/2026', 'DHAKA WHOLESALE ZONE', 'CS00006', 'NEW METRO ELECTRONICS', 'Invoice cash collection', 'INV001260000001', 'CASH', '', '', '', '', '', 60000, 20000, 32000, 40000, 'JUBAYER');
  insertCol.run('COL001260000002', 'MR-202', '16/11/2026', 'CORPORATE DEALERS', 'CS00004', 'STAR TECH & ENGINEERING', 'BEFTN Bank Transfer received', 'INV001260000002', 'BEFTN', 'ISLAMI BANK BANGLADESH PLC', 'MOTIJHEEL LOCAL OFFICE', '', '', '20501010200345618', 49000, 19000, 34000, 30000, 'JUBAYER');
  insertCol.run('COL001260000003', 'MR-203', '21/11/2026', 'CORPORATE DEALERS', 'CS00004', 'STAR TECH & ENGINEERING', 'Collection by cheque', 'INV001260000002', 'CHEQUE', 'DUTCH-BANGLA BANK PLC', 'ELEPHANT ROAD BRANCH', 'RCV-774501', '24/11/2026', '1261100045892', 49000, 0, 15000, 19000, 'BASHIR UDDIN');
  insertCol.run('COL001260000004', 'MR-204', '23/11/2026', 'DHAKA WHOLESALE ZONE', 'CS00007', 'BISMILLAH TRADERS & ENTERPRISE', 'Cash invoice full collection', 'INV001260000003', 'CASH', '', '', '', '', '', 32000, 0, 5000, 32000, 'JUBAYER');
  insertCol.run('COL001260000005', 'MR-205', '23/11/2026', 'DHAKA WHOLESALE ZONE', 'CS00006', 'NEW METRO ELECTRONICS', 'Due recovery cash collection', 'INV001260000001', 'CASH', '', '', '', '', '', 60000, 10000, 22000, 10000, 'JUBAYER');

  db.prepare(`
    INSERT INTO bank_transactions (bank_tr_id, ref_no, tr_date, type_id, tr_type, cheque_no, account_no, bank_name, branch_name_bank, cheque_date, narration, amount, branch_name, user_name)
    VALUES ('BTR001260000001', 'BT-01', '15/11/2026', 'BTT01', 'CASH DEPOSIT', '', '20501010200345618', 'ISLAMI BANK BANGLADESH PLC', 'MOTIJHEEL LOCAL OFFICE', '15/11/2026', 'Cash Sales Deposit to IBBL', 120000, 'HAZI TRADERS', 'JUBAYER')
  `).run();
  db.prepare(`
    INSERT INTO bank_transactions (bank_tr_id, ref_no, tr_date, type_id, tr_type, cheque_no, account_no, bank_name, branch_name_bank, cheque_date, narration, amount, branch_name, user_name)
    VALUES ('BTR001260000002', 'BT-02', '23/11/2026', 'BTT02', 'CHEQUE HONOR', 'CHQ-900101', '20501010200345618', 'ISLAMI BANK BANGLADESH PLC', 'MOTIJHEEL LOCAL OFFICE', '12/11/2026', 'Walton supplier cheque honored', 85000, 'HAZI TRADERS', 'JUBAYER')
  `).run();

  db.prepare(`
    INSERT INTO journal_vouchers (voucher_id, ref_no, voucher_date, tr_type, acc_sub_group_id, acc_head, accounts_id, accounts_name, accounts_to, narration, sales_id, cheque_no, due_amount, dr_amount, cr_amount, branch_name, user_name)
    VALUES ('JRN001260000001', 'JV-01', '15/11/2026', 'DR', 'ASG001', 'OFFICE EXPENSES', 'ACC0002', 'SHOWROOM RENT EXPENSE', 'CASH IN HAND', 'Monthly Showroom Rent for November 2026', '', '', 0, 25000, 0, 'HAZI TRADERS', 'JUBAYER')
  `).run();
  db.prepare(`
    INSERT INTO journal_vouchers (voucher_id, ref_no, voucher_date, tr_type, acc_sub_group_id, acc_head, accounts_id, accounts_name, accounts_to, narration, sales_id, cheque_no, due_amount, dr_amount, cr_amount, branch_name, user_name)
    VALUES ('JRN001260000002', 'JV-02', '23/11/2026', 'DR', 'ASG001', 'OFFICE EXPENSES', 'ACC0003', 'ELECTRICITY & INTERNET BILL', 'CASH IN HAND', 'DESCO Electricity & Fiber Internet Bill', '', '', 0, 6500, 0, 'HAZI TRADERS', 'JUBAYER')
  `).run();

  db.prepare(`
    INSERT INTO balance_transfers (transfer_id, ref_no, transfer_date, transfer_from, transfer_to, tr_type, account_no, narration, amount, approved, user_name)
    VALUES ('BLT001260000001', 'BL-01', '20/11/2026', 'HAZI TRADERS', 'HAZI TRADERS-2', 'CASH', '', 'Petty cash fund transfer to Uttara Branch', 25000, 'Approved', 'JUBAYER')
  `).run();

  // Sample Modification Logs
  logModification('PURCHASE', 'PUR001260000001', 'CREATED', 'JUBAYER', 'HAZI TRADERS', 'Purchase entry created for HAMKO BATTERY CORPORATION', 265000);
  logModification('SALES', 'INV001260000001', 'CREATED', 'JUBAYER', 'HAZI TRADERS', 'Sales invoice created for NEW METRO ELECTRONICS', 60000);
  logModification('SALES', 'INV001260000003', 'CREATED', 'JUBAYER', 'HAZI TRADERS', 'Sales invoice created for BISMILLAH TRADERS & ENTERPRISE', 32000);
  logModification('PAYMENT', 'PAY001260000001', 'CREATED', 'JUBAYER', 'HAZI TRADERS', 'Cash Payment voucher created', 180000);
  logModification('COLLECTION', 'COL001260000004', 'CREATED', 'JUBAYER', 'HAZI TRADERS', 'Cash Collection voucher created', 32000);
  logModification('BANK_TR', 'BTR001260000001', 'CREATED', 'JUBAYER', 'HAZI TRADERS', 'Bank Deposit recorded', 120000);
  logModification('JOURNAL', 'JRN001260000001', 'CREATED', 'JUBAYER', 'HAZI TRADERS', 'Journal Voucher for Showroom Rent', 25000);
}
