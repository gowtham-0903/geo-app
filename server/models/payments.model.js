const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const Payments = {
  // ── Customer payments received ──
  createReceived: async (data, userId) => {
    const id = uuidv4();
    const { date, customer_id, amount, mode, reference } = data;
    await pool.execute(
      `INSERT INTO payments_received (id, date, customer_id, amount, mode, reference, entered_by)
       VALUES (?,?,?,?,?,?,?)`,
      [id, date, customer_id, amount, mode || 'cash', reference || null, userId]
    );
    const [rows] = await pool.execute(
      `SELECT pr.*, c.name AS customer_name
       FROM payments_received pr JOIN customers c ON pr.customer_id = c.id
       WHERE pr.id=?`, [id]
    );
    return rows[0];
  },

  getAllReceived: async (filters = {}) => {
    let sql = `
      SELECT pr.*, c.name AS customer_name, u.name AS entered_by_name
      FROM payments_received pr
      JOIN customers c ON pr.customer_id = c.id
      JOIN users u     ON pr.entered_by  = u.id
      WHERE 1=1
    `;
    const params = [];
    if (filters.customer_id) { sql += ' AND pr.customer_id=?'; params.push(filters.customer_id); }
    if (filters.from)        { sql += ' AND pr.date>=?';        params.push(filters.from); }
    if (filters.to)          { sql += ' AND pr.date<=?';        params.push(filters.to); }
    sql += ' ORDER BY pr.date DESC';
    const [rows] = await pool.execute(sql, params);
    return rows;
  },

  deleteReceived: async (id) => {
    await pool.execute('DELETE FROM payments_received WHERE id=?', [id]);
  },

  // ── Supplier payments made ──
  createSupplier: async (data, userId) => {
    const id = uuidv4();
    const { date, supplier_id, amount, mode, reference } = data;
    await pool.execute(
      `INSERT INTO supplier_payments (id, date, supplier_id, amount, mode, reference, entered_by)
       VALUES (?,?,?,?,?,?,?)`,
      [id, date, supplier_id, amount, mode || 'cash', reference || null, userId]
    );
    const [rows] = await pool.execute(
      `SELECT sp.*, s.name AS supplier_name
       FROM supplier_payments sp JOIN suppliers s ON sp.supplier_id = s.id
       WHERE sp.id=?`, [id]
    );
    return rows[0];
  },

  getAllSupplier: async (filters = {}) => {
    let sql = `
      SELECT sp.*, s.name AS supplier_name, u.name AS entered_by_name
      FROM supplier_payments sp
      JOIN suppliers s ON sp.supplier_id = s.id
      JOIN users u     ON sp.entered_by  = u.id
      WHERE 1=1
    `;
    const params = [];
    if (filters.supplier_id) { sql += ' AND sp.supplier_id=?'; params.push(filters.supplier_id); }
    if (filters.from)        { sql += ' AND sp.date>=?';        params.push(filters.from); }
    if (filters.to)          { sql += ' AND sp.date<=?';        params.push(filters.to); }
    sql += ' ORDER BY sp.date DESC';
    const [rows] = await pool.execute(sql, params);
    return rows;
  },

  deleteSupplier: async (id) => {
    await pool.execute('DELETE FROM supplier_payments WHERE id=?', [id]);
  },

  // ── Outstanding calculations ──
  getCustomerOutstanding: async () => {
    const [rows] = await pool.execute(`
      SELECT
        c.id, c.name, c.type,
        c.opening_balance,
        COALESCE(SUM(s.bill_amount), 0)  AS total_sales,
        COALESCE(SUM(pr.amount),     0)  AS total_received,
        (c.opening_balance + COALESCE(SUM(s.bill_amount),0) - COALESCE(SUM(pr.amount),0)) AS outstanding
      FROM customers c
      LEFT JOIN sales             s  ON s.customer_id  = c.id
      LEFT JOIN payments_received pr ON pr.customer_id = c.id
      WHERE c.is_active = TRUE
      GROUP BY c.id, c.name, c.type, c.opening_balance
      ORDER BY outstanding DESC
    `);
    return rows;
  },

  getSupplierOutstanding: async () => {
    const [rows] = await pool.execute(`
      SELECT
        s.id, s.name, s.type,
        s.opening_balance,
        COALESCE(SUM(pp.bill_amount), 0) AS total_purchases,
        COALESCE(SUM(sp.amount),      0) AS total_paid,
        (s.opening_balance + COALESCE(SUM(pp.bill_amount),0) - COALESCE(SUM(sp.amount),0)) AS outstanding
      FROM suppliers s
      LEFT JOIN preform_purchases pp ON pp.supplier_id  = s.id
      LEFT JOIN supplier_payments sp ON sp.supplier_id  = s.id
      WHERE s.is_active = TRUE
      GROUP BY s.id, s.name, s.type, s.opening_balance
      ORDER BY outstanding DESC
    `);
    return rows;
  },

  getCustomerLedger: async (customerId) => {
    const [rows] = await pool.execute(`
      SELECT date, invoice_no AS ref, 'sale' AS type, bill_amount AS debit, 0 AS credit
      FROM sales WHERE customer_id=?
      UNION ALL
      SELECT date, COALESCE(reference,'Payment') AS ref, 'payment' AS type, 0 AS debit, amount AS credit
      FROM payments_received WHERE customer_id=?
      ORDER BY date ASC, type DESC
    `, [customerId, customerId]);
    return rows;
  },

  getSupplierLedger: async (supplierId) => {
    const [rows] = await pool.execute(`
      SELECT date, COALESCE(invoice_no,'Purchase') AS ref, 'purchase' AS type, bill_amount AS debit, 0 AS credit
      FROM preform_purchases WHERE supplier_id=?
      UNION ALL
      SELECT date, COALESCE(reference,'Payment') AS ref, 'payment' AS type, 0 AS debit, amount AS credit
      FROM supplier_payments WHERE supplier_id=?
      ORDER BY date ASC, type DESC
    `, [supplierId, supplierId]);
    return rows;
  },
};

module.exports = Payments;