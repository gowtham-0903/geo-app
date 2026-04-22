const Expenses = require('../models/expenses.models');

async function create(req, res, next) {
  try {
    const data = await Expenses.create(req.body, req.user.id);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
}
async function getMonthly(req, res, next) {
  try {
    const { year, month } = req.query;
    const data = await Expenses.getMonthly(year, month);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}
async function getMonthlySummary(req, res, next) {
  try {
    const { year, month } = req.query;
    const data = await Expenses.getMonthlySummary(year, month);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}
async function remove(req, res, next) {
  try {
    await Expenses.delete(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
}

module.exports = { create, getMonthly, getMonthlySummary, remove };
