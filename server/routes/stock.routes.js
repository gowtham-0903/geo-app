const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const pool = require('../config/db');

router.use(verifyToken);

// Returns preform stock + finished bottle stock per bottle type
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.execute(`
      SELECT
        bt.id,
        bt.name,
        bt.size_ml,
        bt.category,
        -- Preform stock: total purchased − (used + wasted in production)
        COALESCE(
          (SELECT SUM(quantity_nos) FROM preform_purchases WHERE bottle_type_id = bt.id), 0
        ) -
        COALESCE(
          (SELECT SUM(preforms_used + preform_waste) FROM production_entries WHERE bottle_type_id = bt.id), 0
        ) AS preform_stock,
        -- Bottle stock: total produced − damaged − sold
        COALESCE(
          (SELECT SUM(bottles_produced - bottle_damage) FROM production_entries WHERE bottle_type_id = bt.id), 0
        ) -
        COALESCE(
          (SELECT SUM(quantity) FROM sale_items WHERE bottle_type_id = bt.id), 0
        ) AS bottle_stock,
        -- Supporting detail
        COALESCE(
          (SELECT SUM(quantity_nos) FROM preform_purchases WHERE bottle_type_id = bt.id), 0
        ) AS total_preforms_purchased,
        COALESCE(
          (SELECT SUM(bottles_produced) FROM production_entries WHERE bottle_type_id = bt.id), 0
        ) AS total_bottles_produced,
        COALESCE(
          (SELECT SUM(quantity) FROM sale_items WHERE bottle_type_id = bt.id), 0
        ) AS total_bottles_sold
      FROM bottle_types bt
      WHERE bt.is_active = TRUE
      ORDER BY bt.size_ml ASC, bt.name ASC
    `);

    const data = rows.map(r => ({
      id:                     r.id,
      name:                   r.name,
      size_ml:                r.size_ml,
      category:               r.category,
      preform_stock:          Number(r.preform_stock),
      bottle_stock:           Number(r.bottle_stock),
      total_preforms_purchased: Number(r.total_preforms_purchased),
      total_bottles_produced: Number(r.total_bottles_produced),
      total_bottles_sold:     Number(r.total_bottles_sold),
    }));

    res.json({ success: true, data, as_of: new Date().toISOString() });
  } catch (err) { next(err); }
});

module.exports = router;
