const { BottleType, Machine, Supplier, Customer, ExpenseCategory } = require('../models/masters.model');

function makeController(Model) {
  return {
    getAll: async (req, res, next) => {
      try {
        const data = await Model.getAll();
        res.json({ success: true, data });
      } catch (err) { next(err); }
    },
    create: async (req, res, next) => {
      try {
        const item = await Model.create(req.body);
        res.status(201).json({ success: true, data: item });
      } catch (err) { next(err); }
    },
    update: async (req, res, next) => {
      try {
        await Model.update(req.params.id, req.body);
        res.json({ success: true });
      } catch (err) { next(err); }
    },
    toggle: async (req, res, next) => {
      try {
        await Model.toggle(req.params.id, req.body.is_active);
        res.json({ success: true });
      } catch (err) { next(err); }
    },
  };
}

const bottleTypes      = makeController(BottleType);
const machines         = makeController(Machine);
const suppliers        = makeController(Supplier);
const customers        = makeController(Customer);
const expenseCategories = makeController(ExpenseCategory);

module.exports = { bottleTypes, machines, suppliers, customers, expenseCategories };