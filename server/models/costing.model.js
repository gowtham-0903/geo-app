const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const Costing = {
  getLatest: async () => {
    const [rows] = await pool.execute(`
      SELECT bc.*, bt.name AS bottle_name, bt.weight_grams, bt.category
      FROM bottle_costing bc
      JOIN bottle_types bt ON bc.bottle_type_id = bt.id
      WHERE NOT EXISTS (
        SELECT 1
        FROM bottle_costing newer
        WHERE newer.bottle_type_id = bc.bottle_type_id
          AND (
            newer.effective_from > bc.effective_from
            OR (
              newer.effective_from = bc.effective_from
              AND COALESCE(newer.created_at, '1970-01-01') > COALESCE(bc.created_at, '1970-01-01')
            )
            OR (
              newer.effective_from = bc.effective_from
              AND COALESCE(newer.created_at, '1970-01-01') = COALESCE(bc.created_at, '1970-01-01')
              AND newer.id > bc.id
            )
          )
      )
      ORDER BY bt.category, bt.size_ml
    `);
    return rows;
  },

  getHistory: async (bottleTypeId) => {
    const [rows] = await pool.execute(
      `SELECT bc.*, bt.name AS bottle_name
       FROM bottle_costing bc
       JOIN bottle_types bt ON bc.bottle_type_id = bt.id
       WHERE bc.bottle_type_id=?
       ORDER BY bc.effective_from DESC, bc.created_at DESC, bc.id DESC`, [bottleTypeId]
    );
    return rows;
  },

  create: async (data, userId) => {
    const id = uuidv4();
    const {
      bottle_type_id, raw_material_rate, wastage_pct,
      blowing_cost, cap_cost, gst_pct, effective_from
    } = data;

    const parsedWPct = parseFloat(wastage_pct);
    const parsedGPct = parseFloat(gst_pct);
    const parsedCapC = parseFloat(cap_cost);

    const wPct   = Number.isNaN(parsedWPct) ? 2 : parsedWPct;
    const gPct   = Number.isNaN(parsedGPct) ? 18 : parsedGPct;
    const capC   = Number.isNaN(parsedCapC) ? 0 : parsedCapC;
    const rawR   = parseFloat(raw_material_rate);
    const blowC  = parseFloat(blowing_cost);

    // Get weight from bottle_types
    const [btRows] = await pool.execute(
      'SELECT weight_grams FROM bottle_types WHERE id=?', [bottle_type_id]
    );
    const weightGrams = parseFloat(btRows[0]?.weight_grams || 0);

    const finalMaterialRate      = rawR * (1 + wPct / 100);
    const materialCostPerBottle  = finalMaterialRate * (weightGrams / 1000);
    const basicCost              = materialCostPerBottle + blowC;
    const gstAmount              = basicCost * (gPct / 100);
    const totalCostWithGst       = basicCost + gstAmount;
    const totalCostWithCap       = totalCostWithGst + capC;

    await pool.execute(
      `INSERT INTO bottle_costing
        (id, bottle_type_id, raw_material_rate, wastage_pct, final_material_rate,
         material_cost_per_bottle, blowing_cost, cap_cost, basic_cost,
         gst_pct, gst_amount, total_cost_with_gst, total_cost_with_cap,
         effective_from, entered_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, bottle_type_id, rawR, wPct, finalMaterialRate,
       materialCostPerBottle, blowC, capC, basicCost,
       gPct, gstAmount, totalCostWithGst, totalCostWithCap,
       effective_from || new Date().toISOString().split('T')[0], userId]
    );

    const [rows] = await pool.execute(
      'SELECT * FROM bottle_costing WHERE id=?', [id]
    );
    return rows[0];
  },
};

module.exports = Costing;