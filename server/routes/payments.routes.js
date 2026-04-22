const router = require('express').Router();
const { verifyToken, adminOnly } = require('../middleware/auth');
const ctrl = require('../controllers/payments.controller');

router.use(verifyToken);

// Customer payments — supervisors can add
router.get   ('/received',              ctrl.getAllReceived);
router.post  ('/received',              ctrl.createReceived);
router.delete('/received/:id',          ctrl.deleteReceived);

// Supplier payments — admin only
router.get   ('/supplier',              adminOnly, ctrl.getAllSupplier);
router.post  ('/supplier',              adminOnly, ctrl.createSupplier);
router.delete('/supplier/:id',          adminOnly, ctrl.deleteSupplier);

// Outstanding — admin only
router.get   ('/outstanding/customers', adminOnly, ctrl.customerOutstanding);
router.get   ('/outstanding/suppliers', adminOnly, ctrl.supplierOutstanding);
router.get   ('/ledger/customer/:id',   adminOnly, ctrl.customerLedger);
router.get   ('/ledger/supplier/:id',   adminOnly, ctrl.supplierLedger);

module.exports = router;