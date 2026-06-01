const Production = require('../models/production.model');

const SHIFT_HOURS = 12; // fixed shift duration — not entered by user

async function create(req, res, next) {
  try {
    const { bottle_type_id, preforms_used, preform_waste } = req.body;
    const preformsNeeded = (parseInt(preforms_used) || 0) + (parseInt(preform_waste) || 0);

    if (bottle_type_id && preformsNeeded > 0) {
      const available = await Production.checkPreformStock(bottle_type_id, preformsNeeded);
      if (available < preformsNeeded) {
        return res.status(400).json({
          success: false,
          message: `Insufficient preform stock. Available: ${available.toLocaleString('en-IN')}, Required: ${preformsNeeded.toLocaleString('en-IN')}`,
        });
      }
    }

    req.body.working_hours = SHIFT_HOURS;
    const entry = await Production.create(req.body, req.user.id);
    res.status(201).json({ success: true, data: entry });
  } catch (err) { next(err); }
}

async function getAll(req, res, next) {
  try {
    const entries = await Production.getAll(req.query);
    res.json({ success: true, data: entries });
  } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    const entry = await Production.getById(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: entry });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    const { bottle_type_id, preforms_used, preform_waste } = req.body;
    const preformsNeeded = (parseInt(preforms_used) || 0) + (parseInt(preform_waste) || 0);

    if (bottle_type_id && preformsNeeded > 0) {
      const available = await Production.checkPreformStock(bottle_type_id, preformsNeeded, id);
      if (available < preformsNeeded) {
        return res.status(400).json({
          success: false,
          message: `Insufficient preform stock. Available: ${available.toLocaleString('en-IN')}, Required: ${preformsNeeded.toLocaleString('en-IN')}`,
        });
      }
    }

    req.body.working_hours = SHIFT_HOURS;
    await Production.update(id, req.body);
    res.json({ success: true });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    await Production.delete(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
}

async function todaySummary(req, res, next) {
  try {
    const data = await Production.getTodaySummary();
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

async function preformBalance(req, res, next) {
  try {
    const { bottle_type_id } = req.query;
    if (!bottle_type_id) {
      return res.status(400).json({ success: false, message: 'bottle_type_id required' });
    }
    const balance = await Production.checkPreformStock(bottle_type_id, 0);
    res.json({ success: true, balance });
  } catch (err) { next(err); }
}

module.exports = { create, getAll, getById, update, remove, todaySummary, preformBalance };
