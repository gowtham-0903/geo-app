const request    = require('supertest');
jest.mock('../models/production.model');
const Production = require('../models/production.model');

const app = require('../app');
const { adminCookie, supervisorCookie } = require('./helpers');

const ENTRY = {
  id: 'prod-uuid-001', date: '2026-05-31', shift: 'morning',
  machine_id: 'm-001', bottle_type_id: 'bt-001',
  bottles_produced: 5000, preforms_used: 5050,
  preform_waste: 30, bottle_damage: 20, working_hours: 8,
};

beforeEach(() => jest.clearAllMocks());

// ── GET /api/production ────────────────────────────────────────
describe('GET /api/production', () => {
  it('returns list of production entries', async () => {
    Production.getAll.mockResolvedValue([ENTRY]);

    const res = await request(app)
      .get('/api/production')
      .set('Cookie', supervisorCookie());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(1);
  });

  it('returns 401 when unauthenticated', async () => {
    const res = await request(app).get('/api/production');
    expect(res.status).toBe(401);
  });

  it('passes date query param to model', async () => {
    Production.getAll.mockResolvedValue([]);

    await request(app)
      .get('/api/production?date=2026-05-31')
      .set('Cookie', supervisorCookie());

    expect(Production.getAll).toHaveBeenCalledWith(
      expect.objectContaining({ date: '2026-05-31' })
    );
  });
});

// ── POST /api/production ───────────────────────────────────────
describe('POST /api/production', () => {
  it('creates an entry and returns 201', async () => {
    Production.create.mockResolvedValue(ENTRY);

    const res = await request(app)
      .post('/api/production')
      .set('Cookie', supervisorCookie())
      .send(ENTRY);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.bottles_produced).toBe(5000);
  });

  it('returns 401 when unauthenticated', async () => {
    const res = await request(app).post('/api/production').send(ENTRY);
    expect(res.status).toBe(401);
  });
});

// ── PUT /api/production/:id ────────────────────────────────────
describe('PUT /api/production/:id', () => {
  it('updates an entry and returns 200', async () => {
    Production.update.mockResolvedValue();

    const res = await request(app)
      .put('/api/production/prod-uuid-001')
      .set('Cookie', supervisorCookie())
      .send({ bottles_produced: 5500 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ── DELETE /api/production/:id ─────────────────────────────────
describe('DELETE /api/production/:id', () => {
  it('deletes an entry and returns 200', async () => {
    Production.delete.mockResolvedValue();

    const res = await request(app)
      .delete('/api/production/prod-uuid-001')
      .set('Cookie', supervisorCookie());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ── GET /api/production/today ──────────────────────────────────
describe('GET /api/production/today', () => {
  it('returns today summary', async () => {
    Production.getTodaySummary.mockResolvedValue({
      bottles_today: 10000, entries_today: 4, waste_today: 50, damage_today: 20,
    });

    const res = await request(app)
      .get('/api/production/today')
      .set('Cookie', supervisorCookie());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.bottles_today).toBe(10000);
  });
});
