const router = require('express').Router();
const { verifyToken, adminOnly } = require('../middleware/auth');
const ctrl = require('../controllers/costing.controller');

router.use(verifyToken, adminOnly);
router.get ('/',                    ctrl.getLatest);
router.post('/',                    ctrl.create);
router.get ('/history/:bottleTypeId', ctrl.getHistory);

module.exports = router;