const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// ─── BOTTLE TYPES ─────────────────────────────────────────────
const BottleType = {
  getAll: async () => {
    const [rows] = await pool.execute('SELECT * FROM bottle_types ORDER BY category, size_ml');
    return rows;
  },
  create: async ({ name, size_ml, weight_grams, category }) => {
    const id = uuidv4();
    await pool.execute(
      'INSERT INTO bottle_types (id, name, size_ml, weight_grams, category) VALUES (?,?,?,?,?)',
      [id, name, size_ml, weight_grams, category]
    );
    const [rows] = await pool.execute('SELECT * FROM bottle_types WHERE id=?', [id]);
    return rows[0];
  },
  update: async (id, { name, size_ml, weight_grams, category }) => {
    await pool.execute(
      'UPDATE bottle_types SET name=?, size_ml=?, weight_grams=?, category=? WHERE id=?',
      [name, size_ml, weight_grams, category, id]
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

// ─── CUSTOMERS ────────────────────────────────────────────────
const Customer = {
  getAll: async () => {
    const [rows] = await pool.execute('SELECT * FROM customers ORDER BY name');
    return rows;
  },
  create: async ({ name, type, contact, address, gstin, opening_balance }) => {
    const id = uuidv4();
    await pool.execute(
      'INSERT INTO customers (id, name, type, contact, address, gstin, opening_balance) VALUES (?,?,?,?,?,?,?)',
      [id, name, type || 'local', contact || null, address || null, gstin || null, opening_balance || 0]
    );
    const [rows] = await pool.execute('SELECT * FROM customers WHERE id=?', [id]);
    return rows[0];
  },
  update: async (id, { name, type, contact, address, gstin }) => {
    await pool.execute(
      'UPDATE customers SET name=?, type=?, contact=?, address=?, gstin=? WHERE id=?',
      [name, type, contact || null, address || null, gstin || null, id]
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