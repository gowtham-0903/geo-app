const request = require('supertest');

jest.mock('../models/sales.model');
jest.mock('../services/invoice.pdf');
const Sales              = require('../models/sales.model');
const { generateInvoicePDF } = require('../services/invoice.pdf');

const app = require('../app');
const { adminCookie, supervisorCookie } = require('./helpers');

const SALE = {
  id: 'sale-uuid-001', invoice_display: 'GEO-0001',
  customer_id: 'cust-001', customer_name: 'XYZ Beverages',
  date: '2026-05-31', sale_type: 'local',
  net_amount: 10000, gst_amount: 1800, bill_amount: 11800,
};

const SALE_ITEMS = [
  { id: 'item-001', bottle_name: '500ML WATER', quantity: 1000, rate: 10, amount: 10000 },
];

beforeEach(() => jest.clearAllMocks());

// ── GET /api/sales ─────────────────────────────────────────────
describe('GET /api/sales', () => {
  it('returns all sales', async () => {
    Sales.getAll.mockResolvedValue([SALE]);
    const res = await request(app)
      .get('/api/sales')
      .set('Cookie', supervisorCookie());
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].invoice_display).toBe('GEO-0001');
  });

  it('returns 401 when unauthenticated', async () => {
    const res = await request(app).get('/api/sales');
    expect(res.status).toBe(401);
  });

  it('passes query filters to model', async () => {
    Sales.getAll.mockResolvedValue([]);
    await request(app)
      .get('/api/sales?from=2026-01-01&to=2026-05-31&sale_type=local')
      .set('Cookie', supervisorCookie());
    expect(Sales.getAll).toHaveBeenCalledWith(
      expect.objectContaining({ from: '2026-01-01', to: '2026-05-31', sale_type: 'local' })
    );
  });
});

// ── POST /api/sales ────────────────────────────────────────────
describe('POST /api/sales', () => {
  it('creates a sale and returns 201', async () => {
    Sales.create.mockResolvedValue(SALE);
    const res = await request(app)
      .post('/api/sales')
      .set('Cookie', supervisorCookie())
      .send({
        customer_id: 'cust-001', date: '2026-05-31', sale_type: 'local',
        net_amount: 10000, gst_amount: 1800, bill_amount: 11800,
        items: [{ bottle_type_id: 'bt-001', quantity: 1000, rate: 10, amount: 10000 }],
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(Sales.create).toHaveBeenCalled();
  });
});

// ── GET /api/sales/monthly ─────────────────────────────────────
describe('GET /api/sales/monthly', () => {
  it('returns monthly sales for given year/month', async () => {
    Sales.getMonthly.mockResolvedValue([SALE]);
    const res = await request(app)
      .get('/api/sales/monthly?year=2026&month=5')
      .set('Cookie', supervisorCookie());
    expect(res.status).toBe(200);
    expect(Sales.getMonthly).toHaveBeenCalledWith('2026', '5');
  });
});

// ── GET /api/sales/summary ─────────────────────────────────────
describe('GET /api/sales/summary', () => {
  it('returns month summary', async () => {
    Sales.getMonthSummary.mockResolvedValue({
      invoice_count: 5, total_sales: 58900, total_net: 50000, total_gst: 9000,
    });
    const res = await request(app)
      .get('/api/sales/summary?year=2026&month=5')
      .set('Cookie', supervisorCookie());
    expect(res.status).toBe(200);
    expect(res.body.data.invoice_count).toBe(5);
  });
});

// ── GET /api/sales/:id/items ───────────────────────────────────
describe('GET /api/sales/:id/items', () => {
  it('returns line items for a sale', async () => {
    Sales.getItems.mockResolvedValue(SALE_ITEMS);
    const res = await request(app)
      .get('/api/sales/sale-uuid-001/items')
      .set('Cookie', supervisorCookie());
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].bottle_name).toBe('500ML WATER');
  });
});

// ── GET /api/sales/:id/pdf ─────────────────────────────────────
describe('GET /api/sales/:id/pdf', () => {
  it('returns PDF buffer as application/pdf', async () => {
    const fullSale = { ...SALE, items: SALE_ITEMS };
    Sales.getFullSaleForPDF.mockResolvedValue(fullSale);
    generateInvoicePDF.mockResolvedValue(Buffer.from('%PDF-1.4 test content'));

    const res = await request(app)
      .get('/api/sales/sale-uuid-001/pdf')
      .set('Cookie', supervisorCookie());

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/pdf/);
    expect(res.headers['content-disposition']).toMatch(/attachment/);
  });

  it('returns 404 when sale not found', async () => {
    Sales.getFullSaleForPDF.mockResolvedValue(null);
    const res = await request(app)
      .get('/api/sales/nonexistent/pdf')
      .set('Cookie', supervisorCookie());
    expect(res.status).toBe(404);
  });
});

// ── GET /api/sales/:id/preview ─────────────────────────────────
describe('GET /api/sales/:id/preview', () => {
  it('returns PDF as inline disposition', async () => {
    const fullSale = { ...SALE, items: SALE_ITEMS };
    Sales.getFullSaleForPDF.mockResolvedValue(fullSale);
    generateInvoicePDF.mockResolvedValue(Buffer.from('%PDF-1.4 test content'));

    const res = await request(app)
      .get('/api/sales/sale-uuid-001/preview')
      .set('Cookie', supervisorCookie());

    expect(res.status).toBe(200);
    expect(res.headers['content-disposition']).toMatch(/inline/);
  });
});

// ── DELETE /api/sales/:id ──────────────────────────────────────
describe('DELETE /api/sales/:id', () => {
  it('deletes a sale and returns 200', async () => {
    Sales.delete.mockResolvedValue();
    const res = await request(app)
      .delete('/api/sales/sale-uuid-001')
      .set('Cookie', supervisorCookie());
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
