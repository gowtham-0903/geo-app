const Costing = require('../models/costing.model');

async function getLatest(req, res, next) {
  try {
    const data = await Costing.getLatest();
    res.json({ success: true, data });
  } catch (err) { next(err); }
}
async function getHistory(req, res, next) {
  try {
    const data = await Costing.getHistory(req.params.bottleTypeId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}
async function create(req, res, next) {
  try {
    const data = await Costing.create(req.body, req.user.id);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
}

module.exports = { getLatest, getHistory, create };