const pool = require('../config/db');

const CompanySettings = {
  get: async () => {
    const [rows] = await pool.execute(
      'SELECT * FROM company_settings WHERE id = ?', ['singleton']
    );
    return rows[0] || null;
  },

  update: async (data) => {
    const fields = [
      'company_name', 'gstin', 'pan',
      'address_line1', 'address_line2', 'city', 'state', 'state_code', 'pincode',
      'phone1', 'phone2', 'email',
      'bank_name', 'bank_account', 'bank_ifsc', 'bank_branch',
      'jurisdiction', 'invoice_prefix', 'logo_url'
    ];
    const updates = fields
      .filter(f => data[f] !== undefined)
      .map(f => `${f} = ?`).join(', ');
    const values = fields
      .filter(f => data[f] !== undefined)
      .map(f => data[f] || null);

    if (!updates) return;
    await pool.execute(
      `UPDATE company_settings SET ${updates} WHERE id = 'singleton'`,
      values
    );
    return CompanySettings.get();
  },

  getNextInvoiceNo: async () => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [rows] = await conn.execute(
        'SELECT next_invoice_no, invoice_prefix FROM company_settings WHERE id = ? FOR UPDATE',
        ['singleton']
      );
      const { next_invoice_no, invoice_prefix } = rows[0];
      await conn.execute(
        'UPDATE company_settings SET next_invoice_no = next_invoice_no + 1 WHERE id = ?',
        ['singleton']
      );
      await conn.commit();
      return { number: next_invoice_no, prefix: invoice_prefix };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },
};

module.exports = CompanySettings;
