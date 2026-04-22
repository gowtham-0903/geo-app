const Purchase = require('../models/purchase.model');

async function create(req, res, next) {
  try {
    const entry = await Purchase.create(req.body, req.user.id);
    res.status(201).json({ success: true, data: entry });
  } catch (err) { next(err); }
}

async function getAll(req, res, next) {
  try {
    const data = await Purchase.getAll(req.query);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

async function getMonthly(req, res, next) {
  try {
    const { year, month } = req.query;
    const data = await Purchase.getMonthly(year, month);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    await Purchase.delete(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
}

module.exports = { create, getAll, getMonthly, remove };