const router  = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const ctrl    = require('../controllers/purchase.controller');

router.use(verifyToken);
router.get   ('/',         ctrl.getAll);
router.post  ('/',         ctrl.create);
router.get   ('/monthly',  ctrl.getMonthly);
router.delete('/:id',      ctrl.remove);

module.exports = router;