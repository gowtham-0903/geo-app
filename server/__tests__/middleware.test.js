const jwt              = require('jsonwebtoken');
const { verifyToken, adminOnly } = require('../middleware/auth');

const SECRET = process.env.JWT_SECRET;

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
}

// ── verifyToken ────────────────────────────────────────────────
describe('verifyToken middleware', () => {
  it('calls next() and sets req.user when token is valid', () => {
    const payload = { id: 'abc', role: 'admin' };
    const token   = jwt.sign(payload, SECRET, { expiresIn: '1h' });
    const req     = { cookies: { token } };
    const res     = mockRes();
    const next    = jest.fn();

    verifyToken(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user.id).toBe('abc');
    expect(req.user.role).toBe('admin');
  });

  it('returns 401 when no token cookie present', () => {
    const req  = { cookies: {} };
    const res  = mockRes();
    const next = jest.fn();

    verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token is expired', () => {
    const token = jwt.sign({ id: 'abc' }, SECRET, { expiresIn: '-1s' });
    const req   = { cookies: { token } };
    const res   = mockRes();
    const next  = jest.fn();

    verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token is signed with wrong secret', () => {
    const token = jwt.sign({ id: 'abc' }, 'wrong-secret');
    const req   = { cookies: { token } };
    const res   = mockRes();
    const next  = jest.fn();

    verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

// ── adminOnly ──────────────────────────────────────────────────
describe('adminOnly middleware', () => {
  it('calls next() when user role is admin', () => {
    const req  = { user: { role: 'admin' } };
    const res  = mockRes();
    const next = jest.fn();

    adminOnly(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('returns 403 when user role is supervisor', () => {
    const req  = { user: { role: 'supervisor' } };
    const res  = mockRes();
    const next = jest.fn();

    adminOnly(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: 'Admin access required' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when req.user is undefined', () => {
    const req  = {};
    const res  = mockRes();
    const next = jest.fn();

    adminOnly(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
