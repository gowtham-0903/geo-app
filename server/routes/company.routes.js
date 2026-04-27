const router = require('express').Router();
const { verifyToken, adminOnly } = require('../middleware/auth');
const ctrl = require('../controllers/company.controller');

router.use(verifyToken);
router.get('/', ctrl.get);
router.put('/', adminOnly, ctrl.update);

module.exports = router;
