// server/models/masters.model.js — UPDATED v2
// Adds customer extra fields: state, state_code, email, billing_address, credit_days
// Adds bottle_types extra fields: default_blowing_cost, default_cap_cost, hsn_code

const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// ─── BOTTLE TYPES ─────────────────────────────────────────────
const BottleType = {
  getAll: async () => {
    const [rows] = await pool.execute(
      'SELECT * FROM bottle_types ORDER BY category, size_ml'
    );
    return rows;
  },
  create: async ({ name, size_ml, weight_grams, category, default_blowing_cost, default_cap_cost, hsn_code }) => {
    const id = uuidv4();
    await pool.execute(
      `INSERT INTO bottle_types
        (id, name, size_ml, weight_grams, category, default_blowing_cost, default_cap_cost, hsn_code)
       VALUES (?,?,?,?,?,?,?,?)`,
      [id, name, size_ml, weight_grams, category,
       default_blowing_cost || 0.75, default_cap_cost || 0, hsn_code || '39233090']
    );
    const [rows] = await pool.execute('SELECT * FROM bottle_types WHERE id=?', [id]);
    return rows[0];
  },
  update: async (id, { name, size_ml, weight_grams, category, default_blowing_cost, default_cap_cost, hsn_code }) => {
    await pool.execute(
      `UPDATE bottle_types
       SET name=?, size_ml=?, weight_grams=?, category=?,
           default_blowing_cost=?, default_cap_cost=?, hsn_code=?
       WHERE id=?`,
      [name, size_ml, weight_grams, category,
       default_blowing_cost || 0.75, default_cap_cost || 0,
       hsn_code || '39233090', id]
    );
  },
  toggle: async (id, is_active) => {
    await pool.execute('UPDATE bottle_types SET is_active=? WHERE id=?', [is_active, id]);
  },
};

// ─── MACHINES ─────────────────────────────────────────────────
const Machine = {
  getAll: async () => {
    const [rows] = await pool.execute('SELECT * FROM machines ORDER BY machine_number');
    return rows;
  },
  update: async (id, { name }) => {
    await pool.execute('UPDATE machines SET name=? WHERE id=?', [name, id]);
  },
  toggle: async (id, is_active) => {
    await pool.execute('UPDATE machines SET is_active=? WHERE id=?', [is_active, id]);
  },
};

// ─── SUPPLIERS ────────────────────────────────────────────────
const Supplier = {
  getAll: async () => {
    const [rows] = await pool.execute('SELECT * FROM suppliers ORDER BY name');
    return rows;
  },
  create: async ({ name, type, contact, gstin, opening_balance }) => {
    const id = uuidv4();
    await pool.execute(
      'INSERT INTO suppliers (id, name, type, contact, gstin, opening_balance) VALUES (?,?,?,?,?,?)',
      [id, name, type || 'preform', contact || null, gstin || null, opening_balance || 0]
    );
    const [rows] = await pool.execute('SELECT * FROM suppliers WHERE id=?', [id]);
    return rows[0];
  },
  update: async (id, { name, type, contact, gstin }) => {
    await pool.execute(
      'UPDATE suppliers SET name=?, type=?, contact=?, gstin=? WHERE id=?',
      [name, type, contact || null, gstin || null, id]
    );
  },
  toggle: async (id, is_active) => {
    await pool.execute('UPDATE suppliers SET is_active=? WHERE id=?', [is_active, id]);
  },
};

// ─── CUSTOMERS (UPDATED with extra fields) ────────────────────
const Customer = {
  getAll: async () => {
    const [rows] = await pool.execute('SELECT * FROM customers ORDER BY name');
    return rows;
  },
  create: async ({ name, type, contact, address, gstin, opening_balance,
                   state, state_code, email, billing_address, credit_days }) => {
    const id = uuidv4();
    await pool.execute(
      `INSERT INTO customers
        (id, name, type, contact, address, gstin, opening_balance,
         state, state_code, email, billing_address, credit_days)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, name, type || 'local', contact || null, address || null,
       gstin || null, opening_balance || 0,
       state || 'Tamil Nadu', state_code || '33',
       email || null, billing_address || null, credit_days || 0]
    );
    const [rows] = await pool.execute('SELECT * FROM customers WHERE id=?', [id]);
    return rows[0];
  },
  update: async (id, { name, type, contact, address, gstin,
                        state, state_code, email, billing_address, credit_days }) => {
    await pool.execute(
      `UPDATE customers
       SET name=?, type=?, contact=?, address=?, gstin=?,
           state=?, state_code=?, email=?, billing_address=?, credit_days=?
       WHERE id=?`,
      [name, type, contact || null, address || null, gstin || null,
       state || 'Tamil Nadu', state_code || '33',
       email || null, billing_address || null, credit_days || 0, id]
    );
  },
  toggle: async (id, is_active) => {
    await pool.execute('UPDATE customers SET is_active=? WHERE id=?', [is_active, id]);
  },
};

// ─── EXPENSE CATEGORIES ───────────────────────────────────────
const ExpenseCategory = {
  getAll: async () => {
    const [rows] = await pool.execute('SELECT * FROM expense_categories ORDER BY name');
    return rows;
  },
  create: async ({ name }) => {
    const id = uuidv4();
    await pool.execute('INSERT INTO expense_categories (id, name) VALUES (?,?)', [id, name]);
    const [rows] = await pool.execute('SELECT * FROM expense_categories WHERE id=?', [id]);
    return rows[0];
  },
  update: async (id, { name }) => {
    await pool.execute('UPDATE expense_categories SET name=? WHERE id=?', [name, id]);
  },
  toggle: async (id, is_active) => {
    await pool.execute('UPDATE expense_categories SET is_active=? WHERE id=?', [is_active, id]);
  },
};

module.exports = { BottleType, Machine, Supplier, Customer, ExpenseCategory };