const pool = require('../config/db');

async function findByEmail(email) {
  const [rows] = await pool.execute(
    'SELECT * FROM users WHERE email = ? AND is_active = TRUE',
    [email]
  );
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.execute(
    'SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

async function getAll() {
  const [rows] = await pool.execute(
    'SELECT id, name, email, role, is_active, created_at FROM users ORDER BY created_at ASC'
  );
  return rows;
}

async function create({ id, name, email, password_hash, role }) {
  await pool.execute(
    'INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
    [id, name, email, password_hash, role]
  );
  return findById(id);
}

async function updateActive(id, is_active) {
  await pool.execute('UPDATE users SET is_active = ? WHERE id = ?', [is_active, id]);
}

module.exports = { findByEmail, findById, getAll, create, updateActive };