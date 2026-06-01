const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const pool = require('../config/db');

router.use(verifyToken);

// ── Main dashboard data ───────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const now   = new Date();
    const year  = now.getFullYear();
    const month = now.getMonth() + 1;

    // Today's production with efficiency
    const [[todayProd]] = await pool.execute(`
      SELECT
        COALESCE(SUM(bottles_produced), 0)  AS bottles_today,
        COALESCE(SUM(preform_waste),    0)  AS waste_today,
        COALESCE(SUM(bottle_damage),    0)  AS damage_today,
        COALESCE(SUM(preforms_used),    0)  AS preforms_used_today,
        COUNT(*)                            AS entries_today,
        CASE WHEN COALESCE(SUM(preforms_used), 0) > 0
          THEN ROUND(SUM(bottles_produced) / SUM(preforms_used) * 100, 1)
          ELSE 0
        END AS efficiency_pct
      FROM production_entries WHERE date = CURDATE()
    `);

    // Current month sales
    const [[monthSales]] = await pool.execute(`
      SELECT
        COALESCE(SUM(bill_amount), 0) AS sales_month,
        COUNT(*)                      AS invoices_month
      FROM sales WHERE YEAR(date)=? AND MONTH(date)=?
    `, [year, month]);

    // Last month sales for growth %
    const [[lastMonthSales]] = await pool.execute(`
      SELECT COALESCE(SUM(bill_amount), 0) AS prev_month
      FROM sales
      WHERE YEAR(date) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
        AND MONTH(date) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
    `);

    const growthPct = lastMonthSales.prev_month > 0
      ? +((monthSales.sales_month - lastMonthSales.prev_month) / lastMonthSales.prev_month * 100).toFixed(1)
      : null;

    // Current month purchase
    const [[monthPurchase]] = await pool.execute(`
      SELECT COALESCE(SUM(bill_amount), 0) AS purchase_month
      FROM preform_purchases WHERE YEAR(date)=? AND MONTH(date)=?
    `, [year, month]);

    // Current month expenses
    const [[monthExpenses]] = await pool.execute(`
      SELECT COALESCE(SUM(amount), 0) AS expenses_month
      FROM expenses WHERE YEAR(date)=? AND MONTH(date)=?
    `, [year, month]);

    // Customer outstanding
    const [custOut] = await pool.execute(`
      SELECT SUM(c.opening_balance + COALESCE(s.total,0) - COALESCE(p.total,0)) AS total_outstanding
      FROM customers c
      LEFT JOIN (SELECT customer_id, SUM(bill_amount) AS total FROM sales GROUP BY customer_id) s ON s.customer_id = c.id
      LEFT JOIN (SELECT customer_id, SUM(amount)     AS total FROM payments_received GROUP BY customer_id) p ON p.customer_id = c.id
      WHERE c.is_active = TRUE
    `);

    // 12-month production (monthly bar chart)
    const [twelveMonthProd] = await pool.execute(`
      SELECT
        DATE_FORMAT(m.month_start, '%b ''%y')  AS label,
        DATE_FORMAT(m.month_start, '%Y-%m')    AS month_key,
        COALESCE(SUM(pe.bottles_produced), 0)  AS total,
        DATE_FORMAT(m.month_start, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m') AS is_current
      FROM (
        SELECT DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL n MONTH), '%Y-%m-01') AS month_start
        FROM (
          SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3
          UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7
          UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11
        ) nums
      ) m
      LEFT JOIN production_entries pe
        ON DATE_FORMAT(pe.date, '%Y-%m') = DATE_FORMAT(m.month_start, '%Y-%m')
      GROUP BY m.month_start
      ORDER BY m.month_start ASC
    `);

    // 6-month sales vs purchase trend
    const [rawSales] = await pool.execute(`
      SELECT DATE_FORMAT(date,'%Y-%m') AS mk, COALESCE(SUM(bill_amount),0) AS total
      FROM sales WHERE date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY mk
    `);
    const [rawPurchase] = await pool.execute(`
      SELECT DATE_FORMAT(date,'%Y-%m') AS mk, COALESCE(SUM(bill_amount),0) AS total
      FROM preform_purchases WHERE date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY mk
    `);
    const salesMap    = Object.fromEntries(rawSales.map(r => [r.mk, Number(r.total)]));
    const purchaseMap = Object.fromEntries(rawPurchase.map(r => [r.mk, Number(r.total)]));
    const sixMonthTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now); d.setDate(1); d.setMonth(d.getMonth() - i);
      const key   = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      const label = d.toLocaleString('en-IN', { month: 'short' });
      sixMonthTrend.push({ month: label, sales: salesMap[key]||0, purchase: purchaseMap[key]||0 });
    }

    // Today's sales by bottle type
    const [todaySalesByType] = await pool.execute(`
      SELECT bt.name, SUM(si.quantity) AS qty, SUM(si.amount) AS amount
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN bottle_types bt ON si.bottle_type_id = bt.id
      WHERE s.date = CURDATE()
      GROUP BY si.bottle_type_id, bt.name
      ORDER BY amount DESC
    `);

    // Margin by product (latest costing vs 30-day avg sale rate)
    const [marginByProduct] = await pool.execute(`
      SELECT
        bt.name,
        latest.total_cost_with_gst         AS cost,
        COALESCE(avg_r.avg_rate, 0)        AS avg_rate,
        CASE WHEN COALESCE(avg_r.avg_rate,0) > 0
          THEN ROUND((avg_r.avg_rate - latest.total_cost_with_gst) / avg_r.avg_rate * 100, 1)
          ELSE NULL
        END AS margin_pct
      FROM bottle_types bt
      JOIN (
        SELECT bc.bottle_type_id, bc.total_cost_with_gst
        FROM bottle_costing bc
        INNER JOIN (
          SELECT bottle_type_id, MAX(effective_from) AS mx FROM bottle_costing GROUP BY bottle_type_id
        ) mx ON bc.bottle_type_id = mx.bottle_type_id AND bc.effective_from = mx.mx
      ) latest ON latest.bottle_type_id = bt.id
      LEFT JOIN (
        SELECT si.bottle_type_id, AVG(si.rate) AS avg_rate
        FROM sale_items si JOIN sales s ON si.sale_id = s.id
        WHERE s.date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY si.bottle_type_id
      ) avg_r ON avg_r.bottle_type_id = bt.id
      WHERE bt.is_active = TRUE AND avg_r.avg_rate IS NOT NULL
      ORDER BY margin_pct DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        todayProd,
        monthSales:  { ...monthSales, growth_pct: growthPct },
        monthPurchase,
        monthExpenses,
        customerOutstanding: Number(custOut[0]?.total_outstanding || 0),
        twelveMonthProd:  twelveMonthProd.map(r => ({ ...r, total: Number(r.total), is_current: !!r.is_current })),
        sixMonthTrend,
        todaySalesByType: todaySalesByType.map(r => ({ ...r, qty: Number(r.qty), amount: Number(r.amount) })),
        marginByProduct:  marginByProduct.map(r => ({ ...r, cost: Number(r.cost), avg_rate: Number(r.avg_rate) })),
      },
    });
  } catch (err) { next(err); }
});

// ── Production mix for a specific date (for date-picker chart) ───
router.get('/production-mix', async (req, res, next) => {
  try {
    const { date } = req.query;
    const targetDate = date || (() => {
      const d = new Date(); d.setDate(d.getDate() - 1);
      return d.toISOString().split('T')[0];
    })();

    const [rows] = await pool.execute(`
      SELECT bt.name, SUM(pe.bottles_produced) AS total
      FROM production_entries pe
      JOIN bottle_types bt ON pe.bottle_type_id = bt.id
      WHERE pe.date = ?
      GROUP BY pe.bottle_type_id, bt.name
      ORDER BY total DESC
    `, [targetDate]);

    const grandTotal = rows.reduce((s, r) => s + Number(r.total), 0);
    const byType = rows.map(r => ({
      name:  r.name,
      total: Number(r.total),
      pct:   grandTotal > 0 ? +((Number(r.total) / grandTotal) * 100).toFixed(1) : 0,
    }));

    res.json({ success: true, date: targetDate, total: grandTotal, byType });
  } catch (err) { next(err); }
});

module.exports = router;
