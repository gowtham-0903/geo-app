const router = require('express').Router();
const { verifyToken, adminOnly } = require('../middleware/auth');
const ctrl = require('../controllers/masters.controller');

router.use(verifyToken, adminOnly);

// Bottle types
router.get   ('/bottle-types',         ctrl.bottleTypes.getAll);
router.post  ('/bottle-types',         ctrl.bottleTypes.create);
router.put   ('/bottle-types/:id',     ctrl.bottleTypes.update);
router.patch ('/bottle-types/:id',     ctrl.bottleTypes.toggle);

// Machines
router.get   ('/machines',             ctrl.machines.getAll);
router.put   ('/machines/:id',         ctrl.machines.update);
router.patch ('/machines/:id',         ctrl.machines.toggle);

// Suppliers
router.get   ('/suppliers',            ctrl.suppliers.getAll);
router.post  ('/suppliers',            ctrl.suppliers.create);
router.put   ('/suppliers/:id',        ctrl.suppliers.update);
router.patch ('/suppliers/:id',        ctrl.suppliers.toggle);

// Customers
router.get   ('/customers',            ctrl.customers.getAll);
router.post  ('/customers',            ctrl.customers.create);
router.put   ('/customers/:id',        ctrl.customers.update);
router.patch ('/customers/:id',        ctrl.customers.toggle);

// Expense categories
router.get   ('/expense-categories',   ctrl.expenseCategories.getAll);
router.post  ('/expense-categories',   ctrl.expenseCategories.create);
router.put   ('/expense-categories/:id', ctrl.expenseCategories.update);
router.patch ('/expense-categories/:id', ctrl.expenseCategories.toggle);

module.exports = router;