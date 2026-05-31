import { salesApi }      from '../api/sales.api';
import { mastersApi }    from '../api/masters.api';
import { productionApi } from '../api/production.api';
import { expensesApi }   from '../api/expenses.api';
import { usersApi }      from '../api/users.api';

vi.mock('../api/axios', () => ({
  default: {
    get:    vi.fn(),
    post:   vi.fn(),
    put:    vi.fn(),
    delete: vi.fn(),
    patch:  vi.fn(),
  },
}));
import api from '../api/axios';

beforeEach(() => vi.clearAllMocks());

// ── salesApi ───────────────────────────────────────────────────
describe('salesApi', () => {
  it('getAll calls GET /sales with params', () => {
    api.get.mockResolvedValue({ data: { data: [] } });
    salesApi.getAll({ from: '2026-01-01' });
    expect(api.get).toHaveBeenCalledWith('/sales', { params: { from: '2026-01-01' } });
  });

  it('create calls POST /sales', () => {
    api.post.mockResolvedValue({ data: {} });
    const payload = { customer_id: 'c1', items: [] };
    salesApi.create(payload);
    expect(api.post).toHaveBeenCalledWith('/sales', payload);
  });

  it('getMonthly calls GET /sales/monthly with year and month', () => {
    api.get.mockResolvedValue({ data: { data: [] } });
    salesApi.getMonthly('2026', '5');
    expect(api.get).toHaveBeenCalledWith('/sales/monthly', { params: { year: '2026', month: '5' } });
  });

  it('getSummary calls GET /sales/summary', () => {
    api.get.mockResolvedValue({ data: {} });
    salesApi.getSummary('2026', '5');
    expect(api.get).toHaveBeenCalledWith('/sales/summary', { params: { year: '2026', month: '5' } });
  });

  it('getItems calls GET /sales/:id/items', () => {
    api.get.mockResolvedValue({ data: {} });
    salesApi.getItems('sale-1');
    expect(api.get).toHaveBeenCalledWith('/sales/sale-1/items');
  });

  it('remove calls DELETE /sales/:id', () => {
    api.delete.mockResolvedValue({ data: {} });
    salesApi.remove('sale-1');
    expect(api.delete).toHaveBeenCalledWith('/sales/sale-1');
  });
});

// ── mastersApi ─────────────────────────────────────────────────
describe('mastersApi', () => {
  it('getBottleTypes calls GET /masters/bottle-types', () => {
    api.get.mockResolvedValue({ data: {} });
    mastersApi.getBottleTypes();
    expect(api.get).toHaveBeenCalledWith('/masters/bottle-types');
  });

  it('createBottleType calls POST /masters/bottle-types', () => {
    api.post.mockResolvedValue({ data: {} });
    mastersApi.createBottleType({ name: '500ML' });
    expect(api.post).toHaveBeenCalledWith('/masters/bottle-types', { name: '500ML' });
  });

  it('getCustomers calls GET /masters/customers', () => {
    api.get.mockResolvedValue({ data: {} });
    mastersApi.getCustomers();
    expect(api.get).toHaveBeenCalledWith('/masters/customers');
  });

  it('getSuppliers calls GET /masters/suppliers', () => {
    api.get.mockResolvedValue({ data: {} });
    mastersApi.getSuppliers();
    expect(api.get).toHaveBeenCalledWith('/masters/suppliers');
  });

  it('toggleBottleType calls PATCH with is_active', () => {
    api.patch.mockResolvedValue({ data: {} });
    mastersApi.toggleBottleType('bt-1', false);
    expect(api.patch).toHaveBeenCalledWith('/masters/bottle-types/bt-1', { is_active: false });
  });
});

// ── productionApi ──────────────────────────────────────────────
describe('productionApi', () => {
  it('getAll calls GET /production with params', () => {
    api.get.mockResolvedValue({ data: {} });
    productionApi.getAll({ date: '2026-05-31' });
    expect(api.get).toHaveBeenCalledWith('/production', { params: { date: '2026-05-31' } });
  });

  it('create calls POST /production', () => {
    api.post.mockResolvedValue({ data: {} });
    productionApi.create({ shift: 'morning' });
    expect(api.post).toHaveBeenCalledWith('/production', { shift: 'morning' });
  });

  it('update calls PUT /production/:id', () => {
    api.put.mockResolvedValue({ data: {} });
    productionApi.update('e1', { bottles_produced: 5000 });
    expect(api.put).toHaveBeenCalledWith('/production/e1', { bottles_produced: 5000 });
  });

  it('remove calls DELETE /production/:id', () => {
    api.delete.mockResolvedValue({ data: {} });
    productionApi.remove('e1');
    expect(api.delete).toHaveBeenCalledWith('/production/e1');
  });
});

// ── expensesApi ────────────────────────────────────────────────
describe('expensesApi', () => {
  it('getMonthly calls GET /expenses/monthly', () => {
    api.get.mockResolvedValue({ data: {} });
    expensesApi.getMonthly('2026', '5');
    expect(api.get).toHaveBeenCalledWith('/expenses/monthly', { params: { year: '2026', month: '5' } });
  });

  it('create calls POST /expenses', () => {
    api.post.mockResolvedValue({ data: {} });
    expensesApi.create({ category_id: 'c1', amount: 500 });
    expect(api.post).toHaveBeenCalledWith('/expenses', { category_id: 'c1', amount: 500 });
  });
});

// ── usersApi ───────────────────────────────────────────────────
describe('usersApi', () => {
  it('getAll calls GET /auth/users', () => {
    api.get.mockResolvedValue({ data: {} });
    usersApi.getAll();
    expect(api.get).toHaveBeenCalledWith('/auth/users');
  });

  it('create calls POST /auth/register', () => {
    api.post.mockResolvedValue({ data: {} });
    usersApi.create({ name: 'A', email: 'a@b.com', password: 'p' });
    expect(api.post).toHaveBeenCalledWith('/auth/register', expect.any(Object));
  });

  it('toggleActive calls PATCH /auth/users/:id/active', () => {
    api.patch.mockResolvedValue({ data: {} });
    usersApi.toggleActive('u1', false);
    expect(api.patch).toHaveBeenCalledWith('/auth/users/u1/active', { is_active: false });
  });
});
