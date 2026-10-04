/**
 * OpenBill → Supabase seed (TEST ONLY)
 * Connects to the Supabase Postgres DB, creates app tables, inserts dummy data.
 *
 * Usage:  SUPABASE_URL=postgresql://user:pass@host:5432/postgres node scripts/supabase-seed.js
 *   or   set it in .env  (SUPABASE_URL=...)  and run  node scripts/supabase-seed.js
 *
 * Idempotent: only inserts seed rows when a table is still empty.
 */
try { require('dotenv').config(); } catch (_) { /* dotenv optional */ }
const { Client } = require('pg');

const url = process.env.SUPABASE_URL || process.env.DATABASE_URL;
if (!url) {
  console.error('Missing SUPABASE_URL. Set it in env or .env.');
  process.exit(1);
}

// ---------------- DDL ----------------
const DDL = `
CREATE SCHEMA IF NOT EXISTS openbill;

CREATE TABLE IF NOT EXISTS openbill.products (
  id TEXT PRIMARY KEY,
  sku TEXT,
  barcode TEXT,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  unit TEXT DEFAULT 'pcs',
  hsn TEXT,
  purchase_price NUMERIC(12,2) DEFAULT 0,
  selling_price NUMERIC(12,2) NOT NULL,
  stock NUMERIC(12,2) DEFAULT 0,
  low_stock_threshold NUMERIC(12,2) DEFAULT 10,
  tax_rate NUMERIC(6,2) DEFAULT 18,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS openbill.customers (
  id TEXT PRIMARY KEY,
  type TEXT DEFAULT 'customer',
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  gstin TEXT,
  billing_address JSONB,
  shipping_address JSONB,
  balance NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS openbill.invoices (
  id TEXT PRIMARY KEY,
  type TEXT DEFAULT 'invoice',
  number TEXT,
  status TEXT DEFAULT 'draft',
  date TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  customer_id TEXT REFERENCES openbill.customers(id),
  items JSONB,
  subtotal NUMERIC(12,2) DEFAULT 0,
  discount JSONB,
  tax_type TEXT DEFAULT 'exclusive',
  taxes JSONB,
  shipping NUMERIC(12,2) DEFAULT 0,
  adjustment NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) DEFAULT 0,
  amount_paid NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  terms TEXT,
  template_id TEXT,
  currency TEXT DEFAULT 'INR',
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS openbill.payments (
  id TEXT PRIMARY KEY,
  invoice_id TEXT REFERENCES openbill.invoices(id),
  customer_id TEXT REFERENCES openbill.customers(id),
  amount NUMERIC(12,2) NOT NULL,
  method TEXT DEFAULT 'cash',
  reference TEXT,
  date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS openbill.stock_movements (
  id TEXT PRIMARY KEY,
  product_id TEXT REFERENCES openbill.products(id),
  type TEXT,
  quantity NUMERIC(12,2),
  reason TEXT,
  reference_id TEXT,
  date TIMESTAMPTZ,
  created_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS openbill.templates (
  id TEXT PRIMARY KEY,
  name TEXT,
  type TEXT DEFAULT 'invoice',
  config JSONB,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS openbill.settings (
  id INT PRIMARY KEY DEFAULT 1,
  business_name TEXT,
  business_type TEXT,
  business_logo TEXT,
  signature_image TEXT,
  stamp_image TEXT,
  business_address JSONB,
  gstin TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  upi_id TEXT,
  currency TEXT DEFAULT 'INR',
  tax_system TEXT DEFAULT 'GST',
  invoice_prefix TEXT DEFAULT 'INV',
  enable_pin BOOLEAN DEFAULT false,
  config JSONB,
  updated_at TIMESTAMPTZ
);
`;

// ---------------- Dummy data ----------------
const now = new Date().toISOString();
const products = [
  ['p1', 'SKU-001', '8901234567890', 'Premium Green Tea', '250g box of premium green tea', 'Beverages', 'box', '090200', 180, 320, 45, 10, 18],
  ['p2', 'SKU-002', '8901234567891', 'Almond Granola', 'Roasted almond granola 500g', 'Snacks', 'pack', '200712', 420, 650, 30, 8, 12],
  ['p3', 'SKU-003', '8901234567892', 'Castro Oil 1L', 'Refined sunflower oil 1 litre', 'Grocery', 'bottle', '151490', 130, 190, 120, 20, 5],
  ['p4', 'SKU-004', '8901234567893', 'Cotton T-Shirt', 'Unisex round-neck cotton tee', 'Apparel', 'pcs', '610910', 200, 450, 60, 10, 18],
  ['p5', 'SKU-005', '8901234567894', 'USB-C Cable', '2m braided fast-charge cable', 'Electronics', 'pcs', '854442', 90, 250, 8, 15, 18],
  ['p6', 'SKU-006', '8901234567895', 'Handmade Soap', 'Neem & tulsi cold-process soap', 'Personal Care', 'bar', '330499', 60, 150, 200, 25, 5],
  ['p7', 'SKU-007', '8901234567896', 'Notebook A5', 'Grid 200-page hardbound notebook', 'Stationery', 'pcs', '482010', 40, 95, 150, 30, 18],
  ['p8', 'SKU-008', '8901234567897', 'Smart Bulb 9W', 'Wi-Fi RGB smart bulb', 'Electronics', 'pcs', '853952', 150, 399, 3, 10, 18],
];
const customers = [
  ['c1', 'customer', 'Rajesh Kumar', 'rajesh@example.com', '+91 98765 12345', '29AABCU9603R1ZV', { line1: '456 MG Road', city: 'Bangalore', state: 'Karnataka', pincode: '560001', country: 'India' }, 0],
  ['c2', 'customer', 'Priya Sharma', 'priya@example.com', '+91 98765 67890', '27AABCU9603R1ZX', { line1: '12 Park Street', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', country: 'India' }, 1500],
  ['c3', 'customer', 'Aarav Traders', 'aarav@example.com', '+91 90000 11122', '07AABCU9603R1ZP', { line1: 'MG Compound', city: 'Delhi', state: 'Delhi', pincode: '110001', country: 'India' }, 0],
  ['c4', 'supplier', 'Unity Wholesalers', 'sales@unity.in', '+91 80000 33344', null, null, 0],
  ['c5', 'customer', 'Meera Iyer', 'meera@example.com', '+91 74140 55566', null, { line1: '8 Anna Salai', city: 'Chennai', state: 'Tamil Nadu', pincode: '600002', country: 'India' }, 0],
];
const invoices = [
  ['inv1', 'INV-0001', 'paid', 'c1', [
      { id: 'i1', productId: 'p1', name: 'Premium Green Tea', quantity: 2, unit: 'box', rate: 320, taxRate: 18, amount: 640 },
      { id: 'i2', productId: 'p5', name: 'USB-C Cable', quantity: 3, unit: 'pcs', rate: 250, taxRate: 18, amount: 750 },
    ], 1390, [{ name: 'GST', rate: 18, amount: 250.2 }], 0, 0, 1640.2, 1640.2, 'Thank you for your business!'],
  ['inv2', 'INV-0002', 'sent', 'c2', [
      { id: 'i3', productId: 'p4', name: 'Cotton T-Shirt', quantity: 2, unit: 'pcs', rate: 450, taxRate: 18, amount: 900 },
      { id: 'i4', productId: 'p6', name: 'Handmade Soap', quantity: 5, unit: 'bar', rate: 150, taxRate: 5, amount: 750 },
    ], 1650, [{ name: 'GST', rate: 18, amount: 162 }, { name: 'GST', rate: 5, amount: 37.5 }], 50, 0, 1899.5, 0, 'Payment due within 30 days.'],
  ['inv3', 'INV-0003', 'draft', 'c3', [
      { id: 'i5', productId: 'p3', name: 'Castro Oil 1L', quantity: 10, unit: 'bottle', rate: 190, taxRate: 5, amount: 1900 },
    ], 1900, [{ name: 'GST', rate: 5, amount: 95 }], 0, 0, 1995, 0, null],
];
const payments = [
  ['pay1', 'inv1', 'c1', 1640.2, 'upi', 'UPI/4521XXXX78', now],
  ['pay2', 'inv2', 'c2', 1000, 'bank', 'NEFT/88120', now],
];
const stockMovements = [
  ['sm1', 'p3', 'in', 100, 'Initial stock', 'c4', now],
  ['sm2', 'p1', 'in', 50, 'Initial stock', 'c4', now],
  ['sm3', 'p1', 'out', 2, 'Sold in INV-0001', 'inv1', now],
  ['sm4', 'p3', 'out', 10, 'Sold in INV-0003', 'inv3', now],
];
const templates = [
  ['t1', 'Classic', 'invoice', { paperSize: 'A4', orientation: 'portrait', colors: { primary: '#4f46e5' }, logo: { show: true, position: 'left' }, footer: { show: true, text: 'Thank you for your business!' } }, true, now, now],
  ['t2', 'Thermal 80mm', 'thermal', { paperSize: 'Thermal80' }, false, now, now],
];

async function main() {
  const client = new Client({ connectionString: url });
  await client.connect();
  console.log('✓ Connected to Supabase Postgres');

  await client.query(DDL);
  console.log('✓ Schema `openbill` + tables created (if not present)');

  const counts = {};
  for (const t of ['products', 'customers', 'invoices', 'payments', 'stock_movements', 'templates', 'settings']) {
    counts[t] = (await client.query(`SELECT COUNT(*)::int c FROM openbill."${t}"`)).rows[0].c;
  }
  console.log('Row counts before seed:', counts);

  // settings
  if (counts.settings === 0) {
    await client.query(`INSERT INTO openbill.settings (id, business_name, business_type, business_address, gstin, phone, email, upi_id, currency, tax_system, invoice_prefix, updated_at)
      VALUES (1, 'OpenBill Demo Shop', 'Retail Store',
        '{"line1":"123 Main Street","city":"Mumbai","state":"Maharashtra","pincode":"400001","country":"India"}'::jsonb,
        '27AABCU9603R1ZX', '+91 98765 43210', 'demo@openbill.app', 'openbill@okhdfc', 'INR', 'GST', 'INV', $1)`, [now]);
    console.log('✓ seeded settings');
  }
  // products
  if (counts.products === 0) {
    for (const p of products) {
      await client.query(`INSERT INTO openbill.products (id, sku, barcode, name, description, category, unit, hsn, purchase_price, selling_price, stock, low_stock_threshold, tax_rate, created_at, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$14)`, [...p, now]);
    }
    console.log(`✓ seeded ${products.length} products`);
  }
  // customers
  if (counts.customers === 0) {
    for (const c of customers) {
      await client.query(`INSERT INTO openbill.customers (id, type, name, email, phone, gstin, billing_address, balance, created_at, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9)`, [c[0], c[1], c[2], c[3], c[4], c[5], c[6] ? JSON.stringify(c[6]) : null, c[7], now]);
    }
    console.log(`✓ seeded ${customers.length} customers`);
  }
  // invoices
  if (counts.invoices === 0) {
    for (const [id, num, status, cust, items, sub, taxes, ship, adj, total, paid, notes] of invoices) {
      await client.query(`INSERT INTO openbill.invoices (id, type, number, status, date, customer_id, items, subtotal, taxes, shipping, adjustment, total, amount_paid, notes, template_id, currency, created_at, updated_at)
        VALUES ($1,'invoice',$2,$3,$4,$5,$6::jsonb,$7,$8::jsonb,$9,0,$10,$11,$12,'t1','INR',$4,$4)`,
        [id, num, status, now, cust, JSON.stringify(items), sub, JSON.stringify(taxes), ship, total, paid, notes]);
    }
    console.log(`✓ seeded ${invoices.length} invoices`);
  }
  // payments
  if (counts.payments === 0) {
    for (const p of payments) {
      await client.query(`INSERT INTO openbill.payments (id, invoice_id, customer_id, amount, method, reference, date, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$7)`, p);
    }
    console.log(`✓ seeded ${payments.length} payments`);
  }
  // stock movements
  if (counts.stock_movements === 0) {
    for (const s of stockMovements) {
      await client.query(`INSERT INTO openbill.stock_movements (id, product_id, type, quantity, reason, reference_id, date, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$7)`, s);
    }
    console.log(`✓ seeded ${stockMovements.length} stock movements`);
  }
  // templates
  if (counts.templates === 0) {
    for (const [id, name, type, cfg, isDef] of templates) {
      await client.query(`INSERT INTO openbill.templates (id, name, type, config, is_default, created_at, updated_at)
        VALUES ($1,$2,$3,$4::jsonb,$5,$6,$6)`, [id, name, type, JSON.stringify(cfg), isDef, now]);
    }
    console.log(`✓ seeded ${templates.length} templates`);
  }

  const after = {};
  for (const t of ['products', 'customers', 'invoices', 'payments', 'stock_movements', 'templates', 'settings']) {
    after[t] = (await client.query(`SELECT COUNT(*)::int c FROM openbill."${t}"`)).rows[0].c;
  }
  console.log('Row counts after seed:', after);

  // quick sanity: sample a product
  const sample = await client.query(`SELECT name, category, selling_price FROM openbill.products LIMIT 3`);
  console.log('Sample products:', sample.rows);

  await client.end();
  console.log('Done. Tables live in schema `openbill`.');
}

main().catch(e => { console.error('SEED FAILED:', e.message); process.exit(1); });
