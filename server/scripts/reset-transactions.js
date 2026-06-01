/**
 * Run from /server directory:
 *   node scripts/reset-transactions.js
 *
 * Clears all transactional data and keeps master data.
 */
require('dotenv').config();
const pool = require('../config/db');

async function run() {
  const conn = await pool.getConnection();
  try {
    await conn.execute('SET FOREIGN_KEY_CHECKS = 0');
    await conn.execute('TRUNCATE TABLE sale_items');
    await conn.execute('TRUNCATE TABLE sales');
    await conn.execute('TRUNCATE TABLE preform_purchases');
    await conn.execute('TRUNCATE TABLE production_entries');
    await conn.execute('TRUNCATE TABLE expenses');
    await conn.execute('TRUNCATE TABLE payments_received');
    await conn.execute('TRUNCATE TABLE supplier_payments');
    await conn.execute('TRUNCATE TABLE bottle_costing');
    await conn.execute("UPDATE company_settings SET next_invoice_no = 1 WHERE id = 'singleton'");
    await conn.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Transaction data cleared. Master data preserved.');
  } catch (err) {
    console.error('❌ Reset failed:', err.message);
  } finally {
    conn.release();
    process.exit(0);
  }
}

run();
