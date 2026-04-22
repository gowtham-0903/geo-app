const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const ctrl = require('../controllers/production.controller');

router.use(verifyToken);

router.get   ('/',           ctrl.getAll);
router.post  ('/',           ctrl.create);
router.get   ('/today',      ctrl.todaySummary);
router.get   ('/:id',        ctrl.getById);
router.put   ('/:id',        ctrl.update);
router.delete('/:id',        ctrl.remove);

module.exports = router;