const Production = require('../models/production.model');

async function create(req, res, next) {
  try {
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
    await Production.update(req.params.id, req.body);
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

module.exports = { create, getAll, getById, update, remove, todaySummary };