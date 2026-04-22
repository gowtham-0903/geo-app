const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const Production = {
  create: async (data, userId) => {
    const id = uuidv4();
    const {
      date, shift, machine_id, bottle_type_id,
      opening_preform_stock, preforms_received, preforms_used,
      bottles_produced, preform_waste, bottle_damage, working_hours,
    } = data;
    await pool.execute(
      `INSERT INTO production_entries
        (id, date, shift, machine_id, bottle_type_id,
         opening_preform_stock, preforms_received, preforms_used,
         bottles_produced, preform_waste, bottle_damage, working_hours, entered_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, date, shift, machine_id, bottle_type_id,
       opening_preform_stock || 0, preforms_received || 0, preforms_used || 0,
       bottles_produced || 0, preform_waste || 0, bottle_damage || 0,
       working_hours || 0, userId]
    );
    const [rows] = await pool.execute(
      'SELECT * FROM production_entries WHERE id=?', [id]
    );
    return rows[0];
  },

  getAll: async (filters = {}) => {
    let sql = `
      SELECT pe.*,
        bt.name AS bottle_name,
        m.machine_number,
        u.name AS entered_by_name
      FROM production_entries pe
      JOIN bottle_types bt ON pe.bottle_type_id = bt.id
      JOIN machines m      ON pe.machine_id     = m.id
      JOIN users u         ON pe.entered_by     = u.id
      WHERE 1=1
    `;
    const params = [];
    if (filters.date) {
      sql += ' AND pe.date = ?'; params.push(filters.date);
    }
    if (filters.shift) {
      sql += ' AND pe.shift = ?'; params.push(filters.shift);
    }
    if (filters.machine_id) {
      sql += ' AND pe.machine_id = ?'; params.push(filters.machine_id);
    }
    if (filters.bottle_type_id) {
      sql += ' AND pe.bottle_type_id = ?'; params.push(filters.bottle_type_id);
    }
    sql += ' ORDER BY pe.date DESC, pe.shift, m.machine_number';
    const [rows] = await pool.execute(sql, params);
    return rows;
  },

  getById: async (id) => {
    const [rows] = await pool.execute(
      `SELECT pe.*, bt.name AS bottle_name, m.machine_number
       FROM production_entries pe
       JOIN bottle_types bt ON pe.bottle_type_id = bt.id
       JOIN machines m      ON pe.machine_id     = m.id
       WHERE pe.id = ?`, [id]
    );
    return rows[0] || null;
  },

  update: async (id, data) => {
    const {
      date, shift, machine_id, bottle_type_id,
      opening_preform_stock, preforms_received, preforms_used,
      bottles_produced, preform_waste, bottle_damage, working_hours,
    } = data;
    await pool.execute(
      `UPDATE production_entries SET
        date=?, shift=?, machine_id=?, bottle_type_id=?,
        opening_preform_stock=?, preforms_received=?, preforms_used=?,
        bottles_produced=?, preform_waste=?, bottle_damage=?, working_hours=?
       WHERE id=?`,
      [date, shift, machine_id, bottle_type_id,
       opening_preform_stock || 0, preforms_received || 0, preforms_used || 0,
       bottles_produced || 0, preform_waste || 0, bottle_damage || 0,
       working_hours || 0, id]
    );
  },

  delete: async (id) => {
    await pool.execute('DELETE FROM production_entries WHERE id=?', [id]);
  },

  getTodaySummary: async () => {
    const [rows] = await pool.execute(
      `SELECT
        bt.name AS bottle_name,
        SUM(pe.bottles_produced) AS total_produced,
        SUM(pe.bottle_damage)    AS total_damage,
        SUM(pe.preform_waste)    AS total_preform_waste,
        SUM(pe.working_hours)    AS total_hours
       FROM production_entries pe
       JOIN bottle_types bt ON pe.bottle_type_id = bt.id
       WHERE pe.date = CURDATE()
       GROUP BY pe.bottle_type_id, bt.name
       ORDER BY total_produced DESC`
    );
    return rows;
  },
};

module.exports = Production;