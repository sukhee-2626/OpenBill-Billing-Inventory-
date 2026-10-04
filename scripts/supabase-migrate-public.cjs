/**
 * Move OpenBill app tables into the `public` schema so Supabase's REST API
 * (PostgREST, used by @supabase/supabase-js in the browser) can see them.
 * Also enables RLS with permissive policies for anon/authenticated (TESTING).
 * Idempotent: CREATE IF NOT EXISTS; only drops `openbill` when it is empty.
 *
 * Usage: node scripts/supabase-migrate-public.cjs   (reads SUPABASE_URL from .env)
 */
try { require('dotenv').config(); } catch (_) {}
const { Client } = require('pg');
const url = process.env.SUPABASE_URL || process.env.DATABASE_URL;
if (!url) { console.error('Missing SUPABASE_URL'); process.exit(1); }

const DDL = `
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY, sku TEXT, barcode TEXT, name TEXT NOT NULL, description TEXT,
  category TEXT, unit TEXT DEFAULT 'pcs', hsn TEXT, purchase_price NUMERIC(12,2) DEFAULT 0,
  selling_price NUMERIC(12,2) NOT NULL, stock NUMERIC(12,2) DEFAULT 0,
  low_stock_threshold NUMERIC(12,2) DEFAULT 10, tax_rate NUMERIC(6,2) DEFAULT 18,
  created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS public.customers (
  id TEXT PRIMARY KEY, type TEXT DEFAULT 'customer', name TEXT NOT NULL, email TEXT, phone TEXT,
  gstin TEXT, billing_address JSONB, shipping_address JSONB, balance NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS public.invoices (
  id TEXT PRIMARY KEY, type TEXT DEFAULT 'invoice', number TEXT, status TEXT DEFAULT 'draft',
  date TIMESTAMPTZ, due_date TIMESTAMPTZ, customer_id TEXT, items JSONB, subtotal NUMERIC(12,2) DEFAULT 0,
  discount JSONB, tax_type TEXT DEFAULT 'exclusive', taxes JSONB, shipping NUMERIC(12,2) DEFAULT 0,
  adjustment NUMERIC(12,2) DEFAULT 0, total NUMERIC(12,2) DEFAULT 0, amount_paid NUMERIC(12,2) DEFAULT 0,
  notes TEXT, terms TEXT, template_id TEXT, currency TEXT DEFAULT 'INR', created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY, invoice_id TEXT, customer_id TEXT, amount NUMERIC(12,2) NOT NULL,
  method TEXT DEFAULT 'cash', reference TEXT, date TIMESTAMPTZ, notes TEXT, created_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id TEXT PRIMARY KEY, product_id TEXT, type TEXT, quantity NUMERIC(12,2), reason TEXT,
  reference_id TEXT, date TIMESTAMPTZ, created_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS public.templates (
  id TEXT PRIMARY KEY, name TEXT, type TEXT DEFAULT 'invoice', config JSONB, is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS public.settings (
  id INT PRIMARY KEY DEFAULT 1, business_name TEXT, business_type TEXT, business_logo TEXT,
  signature_image TEXT, stamp_image TEXT, business_address JSONB, gstin TEXT, phone TEXT, email TEXT,
  website TEXT, upi_id TEXT, currency TEXT DEFAULT 'INR', tax_system TEXT DEFAULT 'GST',
  invoice_prefix TEXT DEFAULT 'INV', enable_pin BOOLEAN DEFAULT false, config JSONB, updated_at TIMESTAMPTZ
);
`;

async function main() {
  const c = new Client({ connectionString: url });
  await c.connect();
  console.log('Connected. Creating public schema tables...');
  await c.query(DDL);
  console.log('public tables created (if not present)');

  // Copy data from openbill -> public if source has rows
  const tables = ['products', 'customers', 'invoices', 'payments', 'stock_movements', 'templates', 'settings'];
  for (const t of tables) {
    const n = (await c.query('SELECT COUNT(*)::int c FROM openbill."'+t+'"')).rows[0].c;
    if (n > 0) {
      await c.query('INSERT INTO public."'+t+'" SELECT * FROM openbill."'+t+'" ON CONFLICT DO NOTHING');
      console.log('  copied '+n+' rows from openbill.'+t);
    }
  }

  // RLS: enable + permissive policies for anon & authenticated (TESTING ONLY)
  for (const t of tables) {
    await c.query('ALTER TABLE public."'+t+'" ENABLE ROW LEVEL SECURITY');
    await c.query(`DROP POLICY IF EXISTS "test_all" ON public."${t}"`);
    await c.query(`CREATE POLICY "test_all" ON public."${t}" FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)`);
  }
  console.log('RLS enabled + permissive test policies set on all tables');

  // Drop the now-redundant openbill schema (only if every table is empty)
  const openbillRows = (await c.query(`
    SELECT (SELECT COUNT(*) FROM openbill.products)+
           (SELECT COUNT(*) FROM openbill.customers)+
           (SELECT COUNT(*) FROM openbill.invoices)+
           (SELECT COUNT(*) FROM openbill.payments)+
           (SELECT COUNT(*) FROM openbill.stock_movements)+
           (SELECT COUNT(*) FROM openbill.templates)+
           (SELECT COUNT(*) FROM openbill.settings) AS total`)).rows[0].total;
  if (openbillRows === 0) {
    await c.query('DROP SCHEMA openbill CASCADE');
    console.log('Dropped empty openbill schema (data now lives in public)');
  } else {
    console.log('KEPT openbill schema (had ' + openbillRows + ' rows). Public is the live schema now.');
  }

  // Verify
  const pub = (await c.query("SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('products','customers','invoices','payments','stock_movements','templates','settings') ORDER BY 1")).rows.map(r=>r.tablename);
  console.log('public app tables:', pub.join(', '));
  await c.end();
  console.log('Done.');
}
main().catch(e => { console.error('MIGRATE FAILED:', e.message); process.exit(1); });
