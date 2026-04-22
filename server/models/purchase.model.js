const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const Purchase = {
  create: async (data, userId) => {
    const id = uuidv4();
    const { date, supplier_id, invoice_no, bottle_type_id, quantity_nos, rate_per_kg, bill_amount } = data;
    await pool.execute(
      `INSERT INTO preform_purchases
        (id, date, supplier_id, invoice_no, bottle_type_id, quantity_nos, rate_per_kg, bill_amount, entered_by)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [id, date, supplier_id, invoice_no || null, bottle_type_id, quantity_nos, rate_per_kg, bill_amount, userId]
    );
    const [rows] = await pool.execute(
      `SELECT pp.*, s.name AS supplier_name, bt.name AS bottle_name
       FROM preform_purchases pp
       JOIN suppliers s    ON pp.supplier_id    = s.id
       JOIN bottle_types bt ON pp.bottle_type_id = bt.id
       WHERE pp.id=?`, [id]
    );
    return rows[0];
  },

  getAll: async (filters = {}) => {
    let sql = `
      SELECT pp.*,
        s.name  AS supplier_name,
        bt.name AS bottle_name,
        u.name  AS entered_by_name
      FROM preform_purchases pp
      JOIN suppliers s     ON pp.supplier_id    = s.id
      JOIN bottle_types bt ON pp.bottle_type_id = bt.id
      JOIN users u         ON pp.entered_by     = u.id
      WHERE 1=1
    `;
    const params = [];
    if (filters.supplier_id) { sql += ' AND pp.supplier_id = ?'; params.push(filters.supplier_id); }
    if (filters.from)        { sql += ' AND pp.date >= ?';        params.push(filters.from); }
    if (filters.to)          { sql += ' AND pp.date <= ?';        params.push(filters.to); }
    sql += ' ORDER BY pp.date DESC, pp.created_at DESC';
    const [rows] = await pool.execute(sql, params);
    return rows;
  },

  getMonthly: async (year, month) => {
    const [rows] = await pool.execute(
      `SELECT pp.*, s.name AS supplier_name, bt.name AS bottle_name
       FROM preform_purchases pp
       JOIN suppliers s     ON pp.supplier_id    = s.id
       JOIN bottle_types bt ON pp.bottle_type_id = bt.id
       WHERE YEAR(pp.date)=? AND MONTH(pp.date)=?
       ORDER BY pp.date DESC`, [year, month]
    );
    return rows;
  },

  delete: async (id) => {
    await pool.execute('DELETE FROM preform_purchases WHERE id=?', [id]);
  },
};

module.exports = Purchase;