const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'test-jwt-secret-32-chars-minimum!!';

function makeToken(overrides = {}) {
  const payload = {
    id:    'user-uuid-admin',
    name:  'Admin User',
    email: 'admin@geopacks.com',
    role:  'admin',
    ...overrides,
  };
  return jwt.sign(payload, SECRET, { expiresIn: '1h' });
}

function adminCookie(overrides = {}) {
  return [`token=${makeToken(overrides)}`];
}

function supervisorCookie() {
  return adminCookie({ id: 'user-uuid-supervisor', role: 'supervisor', email: 'supervisor@geopacks.com' });
}

module.exports = { makeToken, adminCookie, supervisorCookie };
