const CompanySettings = require('../models/company.model');

async function get(req, res, next) {
  try {
    const data = await CompanySettings.get();
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const data = await CompanySettings.update(req.body);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

module.exports = { get, update };
