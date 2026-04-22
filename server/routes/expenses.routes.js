const router = require('express').Router();
const { verifyToken, adminOnly } = require('../middleware/auth');
const ctrl = require('../controllers/expenses.controllers');

router.use(verifyToken, adminOnly);
router.post  ('/',         ctrl.create);
router.get   ('/monthly',  ctrl.getMonthly);
router.get   ('/summary',  ctrl.getMonthlySummary);
router.delete('/:id',      ctrl.remove);

module.exports = router;
