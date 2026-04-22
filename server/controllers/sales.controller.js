const Sales = require('../models/sales.model');

async function create(req, res, next) {
  try {
    const sale = await Sales.create(req.body, req.user.id);
    res.status(201).json({ success: true, data: sale });
  } catch (err) { next(err); }
}

async function getAll(req, res, next) {
  try {
    const data = await Sales.getAll(req.query);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

async function getMonthly(req, res, next) {
  try {
    const { year, month } = req.query;
    const data = await Sales.getMonthly(year, month);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

async function getItems(req, res, next) {
  try {
    const items = await Sales.getItems(req.params.id);
    res.json({ success: true, data: items });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    await Sales.delete(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
}

async function monthSummary(req, res, next) {
  try {
    const { year, month } = req.query;
    const data = await Sales.getMonthSummary(year, month);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

module.exports = { create, getAll, getMonthly, getItems, remove, monthSummary };