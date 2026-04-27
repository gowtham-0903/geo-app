// server/models/sales.model.js — UPDATED v2
// Adds: invoice_number auto-generation, place_of_supply, narration
// Adds: getFullSaleForPDF (fetches all data needed for invoice PDF)

const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const CompanySettings = require('./company.model');

const Sales = {
  create: async (data, userId) => {
    const saleId = uuidv4();
    const {
      date, invoice_no, customer_id, sale_type,
      net_amount, gst_amount, bill_amount, items,
      place_of_supply, narration,
    } = data;

    // Auto-generate invoice number
    const { number: invoiceNumber } = await CompanySettings.getNextInvoiceNo();

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      await conn.execute(
        `INSERT INTO sales
          (id, date, invoice_no, invoice_number, customer_id, sale_type,
           net_amount, gst_amount, bill_amount, place_of_supply, narration, entered_by)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          saleId, date, invoice_no || null, invoiceNumber,
          customer_id, sale_type,
          net_amount, gst_amount, bill_amount,
          place_of_supply || 'Tamil Nadu', narration || null,
          userId,
        ]
      );

      for (const item of items) {
        await conn.execute(
          `INSERT INTO sale_items (id, sale_id, bottle_type_id, quantity, rate, amount)
           VALUES (?,?,?,?,?,?)`,
          [uuidv4(), saleId, item.bottle_type_id, item.quantity, item.rate, item.amount]
        );
      }

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    const [rows] = await pool.execute(
      `SELECT s.*, c.name AS customer_name,
              CONCAT(cs.invoice_prefix, '-', LPAD(s.invoice_number, 4, '0')) AS invoice_display
       FROM sales s
       JOIN customers c ON s.customer_id = c.id
       JOIN company_settings cs ON cs.id = 'singleton'
       WHERE s.id=?`, [saleId]
    );
    return rows[0];
  },

  getAll: async (filters = {}) => {
    let sql = `
      SELECT s.*,
        c.name AS customer_name,
        u.name AS entered_by_name,
        CONCAT(cs.invoice_prefix, '-', LPAD(s.invoice_number, 4, '0')) AS invoice_display
      FROM sales s
      JOIN customers c ON s.customer_id = c.id
      JOIN users u      ON s.entered_by  = u.id
      JOIN company_settings cs ON cs.id = 'singleton'
      WHERE 1=1
    `;
    const params = [];
    if (filters.from)        { sql += ' AND s.date >= ?';          params.push(filters.from); }
    if (filters.to)          { sql += ' AND s.date <= ?';          params.push(filters.to); }
    if (filters.customer_id) { sql += ' AND s.customer_id = ?';    params.push(filters.customer_id); }
    if (filters.sale_type)   { sql += ' AND s.sale_type = ?';      params.push(filters.sale_type); }
    sql += ' ORDER BY s.date DESC, s.created_at DESC';
    const [rows] = await pool.execute(sql, params);
    return rows;
  },

  getMonthly: async (year, month) => {
    const [rows] = await pool.execute(
      `SELECT s.*, c.name AS customer_name,
              CONCAT(cs.invoice_prefix, '-', LPAD(s.invoice_number, 4, '0')) AS invoice_display
       FROM sales s
       JOIN customers c ON s.customer_id = c.id
       JOIN company_settings cs ON cs.id = 'singleton'
       WHERE YEAR(s.date)=? AND MONTH(s.date)=?
       ORDER BY s.invoice_number DESC`, [year, month]
    );
    return rows;
  },

  getItems: async (saleId) => {
    const [rows] = await pool.execute(
      `SELECT si.*, bt.name AS bottle_name, bt.hsn_code
       FROM sale_items si
       JOIN bottle_types bt ON si.bottle_type_id = bt.id
       WHERE si.sale_id=?`, [saleId]
    );
    return rows;
  },

  // Fetches EVERYTHING needed to render the invoice PDF
  getFullSaleForPDF: async (saleId) => {
    const [[sale]] = await pool.execute(
      `SELECT s.*,
              CONCAT(cs.invoice_prefix, '-', LPAD(s.invoice_number, 4, '0')) AS invoice_display,
              c.name, c.gstin, c.address, c.billing_address,
              c.state, c.state_code, c.email AS cust_email,
              c.type AS sale_category, c.contact AS cust_contact
       FROM sales s
       JOIN customers c ON s.customer_id = c.id
       JOIN company_settings cs ON cs.id = 'singleton'
       WHERE s.id = ?`, [saleId]
    );
    if (!sale) return null;

    const [items] = await pool.execute(
      `SELECT si.*, bt.name AS bottle_name, bt.hsn_code
       FROM sale_items si
       JOIN bottle_types bt ON si.bottle_type_id = bt.id
       WHERE si.sale_id = ?`, [saleId]
    );

    const [coRows] = await pool.execute('SELECT * FROM company_settings WHERE id = ?', ['singleton']);
    const co = coRows[0];

    return {
      // sale fields
      id:              sale.id,
      date:            sale.date,
      invoice_no:      sale.invoice_no,
      invoice_number:  sale.invoice_number,
      invoice_display: sale.invoice_display,
      sale_type:       sale.sale_type,
      net_amount:      sale.net_amount,
      gst_amount:      sale.gst_amount,
      bill_amount:     sale.bill_amount,
      place_of_supply: sale.place_of_supply,
      narration:       sale.narration,
      // customer
      customer: {
        name:            sale.name,
        gstin:           sale.gstin,
        address:         sale.address,
        billing_address: sale.billing_address,
        state:           sale.state || 'Tamil Nadu',
        state_code:      sale.state_code || '33',
        city:            sale.city || '',
        email:           sale.cust_email,
        contact:         sale.cust_contact,
      },
      // company
      company: co,
      // items
      items,
    };
  },

  delete: async (id) => {
    await pool.execute('DELETE FROM sales WHERE id=?', [id]);
  },

  getMonthSummary: async (year, month) => {
    const [rows] = await pool.execute(
      `SELECT
        SUM(bill_amount) AS total_sales,
        SUM(gst_amount)  AS total_gst,
        SUM(net_amount)  AS total_net,
        COUNT(*)         AS invoice_count
       FROM sales
       WHERE YEAR(date)=? AND MONTH(date)=?`,
      [year, month]
    );
    return rows[0];
  },
};

module.exports = Sales;