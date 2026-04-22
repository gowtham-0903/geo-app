const Payments = require('../models/payments.model');

// Customer payments
async function createReceived(req, res, next) {
  try {
    const data = await Payments.createReceived(req.body, req.user.id);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
}
async function getAllReceived(req, res, next) {
  try {
    const data = await Payments.getAllReceived(req.query);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}
async function deleteReceived(req, res, next) {
  try {
    await Payments.deleteReceived(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
}

// Supplier payments
async function createSupplier(req, res, next) {
  try {
    const data = await Payments.createSupplier(req.body, req.user.id);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
}
async function getAllSupplier(req, res, next) {
  try {
    const data = await Payments.getAllSupplier(req.query);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}
async function deleteSupplier(req, res, next) {
  try {
    await Payments.deleteSupplier(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
}

// Outstanding
async function customerOutstanding(req, res, next) {
  try {
    const data = await Payments.getCustomerOutstanding();
    res.json({ success: true, data });
  } catch (err) { next(err); }
}
async function supplierOutstanding(req, res, next) {
  try {
    const data = await Payments.getSupplierOutstanding();
    res.json({ success: true, data });
  } catch (err) { next(err); }
}
async function customerLedger(req, res, next) {
  try {
    const data = await Payments.getCustomerLedger(req.params.id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}
async function supplierLedger(req, res, next) {
  try {
    const data = await Payments.getSupplierLedger(req.params.id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

module.exports = {
  createReceived, getAllReceived, deleteReceived,
  createSupplier, getAllSupplier, deleteSupplier,
  customerOutstanding, supplierOutstanding,
  customerLedger, supplierLedger,
};