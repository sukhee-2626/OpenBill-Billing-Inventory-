/**
 * OpenBill Supabase keep-alive (prevents free-project pause after 7d idle).
 * Connects and runs `SELECT 1` so the project registers activity.
 *
 * Usage: SUPABASE_URL=postgresql://... node scripts/supabase-keepalive.cjs
 */
try { require('dotenv').config(); } catch (_) {}
const { Client } = require('pg');

const url = process.env.SUPABASE_URL || process.env.DATABASE_URL;
if (!url) { console.error('Missing SUPABASE_URL'); process.exit(1); }

(async () => {
  const client = new Client({ connectionString: url });
  await client.connect();
  const r = await client.query('SELECT 1 AS ok, NOW() AS now');
  await client.end();
  console.log('keep-alive ok:', r.rows[0]);
  process.exit(0);
})().catch(e => { console.error('keep-alive failed:', e.message); process.exit(1); });
