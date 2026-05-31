const request = require('supertest');

jest.mock('../models/masters.model');
const { BottleType, Machine, Supplier, Customer, ExpenseCategory } =
  require('../models/masters.model');

const app = require('../app');
const { adminCookie, supervisorCookie } = require('./helpers');

const BOTTLE = { id: 'bt-001', name: '500ML WATER', size_ml: 500, weight_grams: 13, is_active: true };
const MACHINE  = { id: 'mc-001', machine_number: 1, name: 'Blow-1', is_active: true };
const SUPPLIER = { id: 'sup-001', name: 'ABC Preforms', type: 'preform', is_active: true };
const CUSTOMER = { id: 'cust-001', name: 'XYZ Beverages', type: 'local', is_active: true };
const CATEGORY = { id: 'cat-001', name: 'Electricity', is_active: true };

beforeEach(() => jest.clearAllMocks());

// ── Auth guard — all masters routes require admin ──────────────
describe('Masters routes — auth guard', () => {
  it('returns 403 for supervisor on bottle-types', async () => {
    const res = await request(app)
      .get('/api/masters/bottle-types')
      .set('Cookie', supervisorCookie());
    expect(res.status).toBe(403);
  });

  it('returns 401 when unauthenticated', async () => {
    const res = await request(app).get('/api/masters/bottle-types');
    expect(res.status).toBe(401);
  });
});

// ── Bottle Types ───────────────────────────────────────────────
describe('Bottle Types', () => {
  it('GET /api/masters/bottle-types returns list', async () => {
    BottleType.getAll.mockResolvedValue([BOTTLE]);
    const res = await request(app)
      .get('/api/masters/bottle-types')
      .set('Cookie', adminCookie());
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe('500ML WATER');
  });

  it('POST /api/masters/bottle-types creates a bottle type', async () => {
    BottleType.create.mockResolvedValue(BOTTLE);
    const res = await request(app)
      .post('/api/masters/bottle-types')
      .set('Cookie', adminCookie())
      .send({ name: '500ML WATER', size_ml: 500, weight_grams: 13 });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('PUT /api/masters/bottle-types/:id updates a bottle type', async () => {
    BottleType.update.mockResolvedValue();
    const res = await request(app)
      .put('/api/masters/bottle-types/bt-001')
      .set('Cookie', adminCookie())
      .send({ name: '500ML WATER UPDATED' });
    expect(res.status).toBe(200);
    expect(BottleType.update).toHaveBeenCalledWith('bt-001', expect.any(Object));
  });

  it('PATCH /api/masters/bottle-types/:id toggles active status', async () => {
    BottleType.toggle.mockResolvedValue();
    const res = await request(app)
      .patch('/api/masters/bottle-types/bt-001')
      .set('Cookie', adminCookie())
      .send({ is_active: false });
    expect(res.status).toBe(200);
    expect(BottleType.toggle).toHaveBeenCalledWith('bt-001', false);
  });
});

// ── Machines ───────────────────────────────────────────────────
describe('Machines', () => {
  it('GET /api/masters/machines returns list', async () => {
    Machine.getAll.mockResolvedValue([MACHINE]);
    const res = await request(app)
      .get('/api/masters/machines')
      .set('Cookie', adminCookie());
    expect(res.status).toBe(200);
    expect(res.body.data[0].machine_number).toBe(1);
  });

  it('PUT /api/masters/machines/:id updates a machine', async () => {
    Machine.update.mockResolvedValue();
    const res = await request(app)
      .put('/api/masters/machines/mc-001')
      .set('Cookie', adminCookie())
      .send({ name: 'Blow-1 Updated' });
    expect(res.status).toBe(200);
  });

  it('PATCH /api/masters/machines/:id toggles active', async () => {
    Machine.toggle.mockResolvedValue();
    const res = await request(app)
      .patch('/api/masters/machines/mc-001')
      .set('Cookie', adminCookie())
      .send({ is_active: false });
    expect(res.status).toBe(200);
  });
});

// ── Suppliers ──────────────────────────────────────────────────
describe('Suppliers', () => {
  it('GET /api/masters/suppliers returns list', async () => {
    Supplier.getAll.mockResolvedValue([SUPPLIER]);
    const res = await request(app)
      .get('/api/masters/suppliers')
      .set('Cookie', adminCookie());
    expect(res.status).toBe(200);
    expect(res.body.data[0].name).toBe('ABC Preforms');
  });

  it('POST /api/masters/suppliers creates supplier', async () => {
    Supplier.create.mockResolvedValue(SUPPLIER);
    const res = await request(app)
      .post('/api/masters/suppliers')
      .set('Cookie', adminCookie())
      .send({ name: 'ABC Preforms', type: 'preform' });
    expect(res.status).toBe(201);
  });

  it('PATCH /api/masters/suppliers/:id toggles active', async () => {
    Supplier.toggle.mockResolvedValue();
    const res = await request(app)
      .patch('/api/masters/suppliers/sup-001')
      .set('Cookie', adminCookie())
      .send({ is_active: false });
    expect(res.status).toBe(200);
  });
});

// ── Customers ──────────────────────────────────────────────────
describe('Customers', () => {
  it('GET /api/masters/customers returns list', async () => {
    Customer.getAll.mockResolvedValue([CUSTOMER]);
    const res = await request(app)
      .get('/api/masters/customers')
      .set('Cookie', adminCookie());
    expect(res.status).toBe(200);
    expect(res.body.data[0].name).toBe('XYZ Beverages');
  });

  it('POST /api/masters/customers creates customer', async () => {
    Customer.create.mockResolvedValue(CUSTOMER);
    const res = await request(app)
      .post('/api/masters/customers')
      .set('Cookie', adminCookie())
      .send({ name: 'XYZ Beverages', type: 'local' });
    expect(res.status).toBe(201);
  });

  it('PUT /api/masters/customers/:id updates customer', async () => {
    Customer.update.mockResolvedValue();
    const res = await request(app)
      .put('/api/masters/customers/cust-001')
      .set('Cookie', adminCookie())
      .send({ name: 'XYZ Updated' });
    expect(res.status).toBe(200);
  });
});

// ── Expense Categories ─────────────────────────────────────────
describe('Expense Categories', () => {
  it('GET /api/masters/expense-categories returns list', async () => {
    ExpenseCategory.getAll.mockResolvedValue([CATEGORY]);
    const res = await request(app)
      .get('/api/masters/expense-categories')
      .set('Cookie', adminCookie());
    expect(res.status).toBe(200);
    expect(res.body.data[0].name).toBe('Electricity');
  });

  it('POST /api/masters/expense-categories creates category', async () => {
    ExpenseCategory.create.mockResolvedValue(CATEGORY);
    const res = await request(app)
      .post('/api/masters/expense-categories')
      .set('Cookie', adminCookie())
      .send({ name: 'Electricity' });
    expect(res.status).toBe(201);
  });

  it('PATCH /api/masters/expense-categories/:id toggles', async () => {
    ExpenseCategory.toggle.mockResolvedValue();
    const res = await request(app)
      .patch('/api/masters/expense-categories/cat-001')
      .set('Cookie', adminCookie())
      .send({ is_active: false });
    expect(res.status).toBe(200);
  });
});
