// server/routes/sales.routes.js — UPDATED v2
const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const ctrl = require('../controllers/sales.controller');

router.use(verifyToken);
router.get   ('/',              ctrl.getAll);
router.post  ('/',              ctrl.create);
router.get   ('/monthly',       ctrl.getMonthly);
router.get   ('/summary',       ctrl.monthSummary);
router.get   ('/:id/items',     ctrl.getItems);
router.get   ('/:id/pdf',       ctrl.downloadPDF);   // ← NEW: download
router.get   ('/:id/preview',   ctrl.previewPDF);    // ← NEW: inline preview
router.delete('/:id',           ctrl.remove);

module.exports = router;