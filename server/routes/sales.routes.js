const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const ctrl = require('../controllers/sales.controller');

router.use(verifyToken);
router.get   ('/',           ctrl.getAll);
router.post  ('/',           ctrl.create);
router.get   ('/monthly',    ctrl.getMonthly);
router.get   ('/summary',    ctrl.monthSummary);
router.get   ('/:id/items',  ctrl.getItems);
router.delete('/:id',        ctrl.remove);

module.exports = router;