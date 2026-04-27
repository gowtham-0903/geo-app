// server/controllers/sales.controller.js — UPDATED v2
// Adds: PDF download endpoint

const Sales = require('../models/sales.model');
const { generateInvoicePDF } = require('../services/invoice.pdf');

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

// ── PDF Download ───────────────────────────────────────────────
async function downloadPDF(req, res, next) {
  try {
    const sale = await Sales.getFullSaleForPDF(req.params.id);
    if (!sale) return res.status(404).json({ success: false, message: 'Invoice not found' });

    const pdfBuffer = await generateInvoicePDF(sale);
    const filename  = `Invoice_${sale.invoice_display || sale.id}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer);
  } catch (err) { next(err); }
}

// ── Preview PDF in browser ─────────────────────────────────────
async function previewPDF(req, res, next) {
  try {
    const sale = await Sales.getFullSaleForPDF(req.params.id);
    if (!sale) return res.status(404).json({ success: false, message: 'Invoice not found' });

    const pdfBuffer = await generateInvoicePDF(sale);
    const filename  = `Invoice_${sale.invoice_display || sale.id}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer);
  } catch (err) { next(err); }
}

module.exports = {
  create, getAll, getMonthly, getItems,
  remove, monthSummary, downloadPDF, previewPDF,
};