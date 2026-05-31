const request = require('supertest');
const bcrypt  = require('bcrypt');

// Mock models BEFORE requiring app so db.js is never loaded
jest.mock('../models/user.model');
const User = require('../models/user.model');

const app = require('../app');
const { adminCookie, supervisorCookie } = require('./helpers');

// ── Shared fixtures ────────────────────────────────────────────
const ADMIN_USER = {
  id: 'uuid-admin-001', name: 'Admin User',
  email: 'admin@geopacks.com', role: 'admin', is_active: true,
};

beforeEach(() => jest.clearAllMocks());

// ── POST /api/auth/login ───────────────────────────────────────
describe('POST /api/auth/login', () => {
  it('returns 200 and sets token cookie on valid credentials', async () => {
    const hash = await bcrypt.hash('password123', 10);
    User.findByEmail.mockResolvedValue({ ...ADMIN_USER, password_hash: hash });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@geopacks.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe('admin@geopacks.com');
    expect(res.body.user.role).toBe('admin');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('returns 401 for wrong password', async () => {
    const hash = await bcrypt.hash('correct', 10);
    User.findByEmail.mockResolvedValue({ ...ADMIN_USER, password_hash: hash });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@geopacks.com', password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 for unknown email', async () => {
    User.findByEmail.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@geopacks.com', password: 'pass' });

    expect(res.status).toBe(401);
  });

  it('returns 400 when email or password missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@geopacks.com' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ── POST /api/auth/logout ──────────────────────────────────────
describe('POST /api/auth/logout', () => {
  it('returns 200 and clears cookie when authenticated', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', adminCookie());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 401 when not authenticated', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(401);
  });
});

// ── GET /api/auth/me ───────────────────────────────────────────
describe('GET /api/auth/me', () => {
  it('returns current user when authenticated', async () => {
    User.findById.mockResolvedValue(ADMIN_USER);

    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', adminCookie());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe('admin@geopacks.com');
  });

  it('returns 404 when user no longer exists in DB', async () => {
    User.findById.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', adminCookie());

    expect(res.status).toBe(404);
  });

  it('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

// ── GET /api/auth/users (admin only) ──────────────────────────
describe('GET /api/auth/users', () => {
  it('returns user list for admin', async () => {
    User.getAll.mockResolvedValue([ADMIN_USER]);

    const res = await request(app)
      .get('/api/auth/users')
      .set('Cookie', adminCookie());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.users)).toBe(true);
  });

  it('returns 403 for supervisor', async () => {
    const res = await request(app)
      .get('/api/auth/users')
      .set('Cookie', supervisorCookie());

    expect(res.status).toBe(403);
  });

  it('returns 401 when unauthenticated', async () => {
    const res = await request(app).get('/api/auth/users');
    expect(res.status).toBe(401);
  });
});

// ── POST /api/auth/users ───────────────────────────────────────
describe('POST /api/auth/users', () => {
  it('creates a new user as admin', async () => {
    User.findByEmail.mockResolvedValue(null);
    User.create.mockResolvedValue({
      id: 'new-uuid', name: 'New Sup', email: 'sup@geopacks.com', role: 'supervisor',
    });

    const res = await request(app)
      .post('/api/auth/users')
      .set('Cookie', adminCookie())
      .send({ name: 'New Sup', email: 'sup@geopacks.com', password: 'pass123', role: 'supervisor' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('returns 409 when email already exists', async () => {
    User.findByEmail.mockResolvedValue(ADMIN_USER);

    const res = await request(app)
      .post('/api/auth/users')
      .set('Cookie', adminCookie())
      .send({ name: 'Dup', email: 'admin@geopacks.com', password: 'pass123' });

    expect(res.status).toBe(409);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/users')
      .set('Cookie', adminCookie())
      .send({ email: 'x@y.com' }); // no name or password

    expect(res.status).toBe(400);
  });

  it('returns 403 for supervisor', async () => {
    const res = await request(app)
      .post('/api/auth/users')
      .set('Cookie', supervisorCookie())
      .send({ name: 'x', email: 'x@y.com', password: '123' });

    expect(res.status).toBe(403);
  });
});

// ── PATCH /api/auth/users/:id ─────────────────────────────────
describe('PATCH /api/auth/users/:id', () => {
  it('toggles user active status as admin', async () => {
    User.updateActive.mockResolvedValue();

    const res = await request(app)
      .patch('/api/auth/users/uuid-001')
      .set('Cookie', adminCookie())
      .send({ is_active: false });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 403 for supervisor', async () => {
    const res = await request(app)
      .patch('/api/auth/users/uuid-001')
      .set('Cookie', supervisorCookie())
      .send({ is_active: false });

    expect(res.status).toBe(403);
  });
});
