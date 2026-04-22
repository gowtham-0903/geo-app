const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const pool = require('../config/db');

router.use(verifyToken);

router.get('/', async (req, res, next) => {
  try {
    const now   = new Date();
    const year  = now.getFullYear();
    const month = now.getMonth() + 1;

    const [[todayProd]] = await pool.execute(`
      SELECT
        COALESCE(SUM(bottles_produced),0) AS bottles_today,
        COALESCE(SUM(preform_waste),0)    AS waste_today,
        COALESCE(SUM(bottle_damage),0)    AS damage_today,
        COUNT(*) AS entries_today
      FROM production_entries WHERE date = CURDATE()
    `);

    const [[monthSales]] = await pool.execute(`
      SELECT
        COALESCE(SUM(bill_amount),0) AS sales_month,
        COUNT(*) AS invoices_month
      FROM sales
      WHERE YEAR(date)=? AND MONTH(date)=?
    `, [year, month]);

    const [[monthPurchase]] = await pool.execute(`
      SELECT COALESCE(SUM(bill_amount),0) AS purchase_month
      FROM preform_purchases
      WHERE YEAR(date)=? AND MONTH(date)=?
    `, [year, month]);

    const [[monthExpenses]] = await pool.execute(`
      SELECT COALESCE(SUM(amount),0) AS expenses_month
      FROM expenses
      WHERE YEAR(date)=? AND MONTH(date)=?
    `, [year, month]);

    const [custOutstanding] = await pool.execute(`
      SELECT
        SUM(c.opening_balance + COALESCE(s.total,0) - COALESCE(p.total,0)) AS total_customer_outstanding
      FROM customers c
      LEFT JOIN (SELECT customer_id, SUM(bill_amount) AS total FROM sales GROUP BY customer_id) s
        ON s.customer_id = c.id
      LEFT JOIN (SELECT customer_id, SUM(amount) AS total FROM payments_received GROUP BY customer_id) p
        ON p.customer_id = c.id
      WHERE c.is_active=TRUE
    `);

    const [todayByBottle] = await pool.execute(`
      SELECT bt.name AS bottle_name, SUM(pe.bottles_produced) AS total
      FROM production_entries pe
      JOIN bottle_types bt ON pe.bottle_type_id = bt.id
      WHERE pe.date = CURDATE()
      GROUP BY pe.bottle_type_id, bt.name
      ORDER BY total DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        todayProd,
        monthSales,
        monthPurchase,
        monthExpenses,
        customerOutstanding: custOutstanding[0]?.total_customer_outstanding || 0,
        todayByBottle,
      },
    });
  } catch (err) { next(err); }
});

module.exports = router;