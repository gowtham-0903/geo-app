const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const Expenses = {
  create: async (data, userId) => {
    const id = uuidv4();
    const { date, category_id, amount, description } = data;
    await pool.execute(
      `INSERT INTO expenses (id, date, category_id, amount, description, entered_by)
       VALUES (?,?,?,?,?,?)`,
      [id, date, category_id, amount, description || null, userId]
    );
    const [rows] = await pool.execute(
      `SELECT e.*, ec.name AS category_name
       FROM expenses e JOIN expense_categories ec ON e.category_id = ec.id
       WHERE e.id=?`, [id]
    );
    return rows[0];
  },

  getAll: async (filters = {}) => {
    let sql = `
      SELECT e.*, ec.name AS category_name, u.name AS entered_by_name
      FROM expenses e
      JOIN expense_categories ec ON e.category_id = ec.id
      JOIN users u               ON e.entered_by  = u.id
      WHERE 1=1
    `;
    const params = [];
    if (filters.from)        { sql += ' AND e.date>=?';         params.push(filters.from); }
    if (filters.to)          { sql += ' AND e.date<=?';         params.push(filters.to); }
    if (filters.category_id) { sql += ' AND e.category_id=?';   params.push(filters.category_id); }
    sql += ' ORDER BY e.date DESC';
    const [rows] = await pool.execute(sql, params);
    return rows;
  },

  getMonthly: async (year, month) => {
    const [rows] = await pool.execute(
      `SELECT e.*, ec.name AS category_name
       FROM expenses e JOIN expense_categories ec ON e.category_id = ec.id
       WHERE YEAR(e.date)=? AND MONTH(e.date)=?
       ORDER BY e.date DESC`, [year, month]
    );
    return rows;
  },

  getMonthlySummary: async (year, month) => {
    const [rows] = await pool.execute(
      `SELECT ec.name AS category_name, SUM(e.amount) AS total
       FROM expenses e JOIN expense_categories ec ON e.category_id = ec.id
       WHERE YEAR(e.date)=? AND MONTH(e.date)=?
       GROUP BY e.category_id, ec.name
       ORDER BY total DESC`, [year, month]
    );
    return rows;
  },

  delete: async (id) => {
    await pool.execute('DELETE FROM expenses WHERE id=?', [id]);
  },
};

module.exports = Expenses;