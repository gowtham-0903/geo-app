import api from './axios';

export const mastersApi = {
  // Bottle types
  getBottleTypes:    ()       => api.get('/masters/bottle-types'),
  createBottleType:  (data)   => api.post('/masters/bottle-types', data),
  updateBottleType:  (id, data) => api.put(`/masters/bottle-types/${id}`, data),
  toggleBottleType:  (id, is_active) => api.patch(`/masters/bottle-types/${id}`, { is_active }),

  // Machines
  getMachines:       ()       => api.get('/masters/machines'),
  updateMachine:     (id, data) => api.put(`/masters/machines/${id}`, data),
  toggleMachine:     (id, is_active) => api.patch(`/masters/machines/${id}`, { is_active }),

  // Suppliers
  getSuppliers:      ()       => api.get('/masters/suppliers'),
  createSupplier:    (data)   => api.post('/masters/suppliers', data),
  updateSupplier:    (id, data) => api.put(`/masters/suppliers/${id}`, data),
  toggleSupplier:    (id, is_active) => api.patch(`/masters/suppliers/${id}`, { is_active }),

  // Customers
  getCustomers:      ()       => api.get('/masters/customers'),
  createCustomer:    (data)   => api.post('/masters/customers', data),
  updateCustomer:    (id, data) => api.put(`/masters/customers/${id}`, data),
  toggleCustomer:    (id, is_active) => api.patch(`/masters/customers/${id}`, { is_active }),

  // Expense categories
  getExpenseCategories:  ()     => api.get('/masters/expense-categories'),
  createExpenseCategory: (data) => api.post('/masters/expense-categories', data),
  updateExpenseCategory: (id, data) => api.put(`/masters/expense-categories/${id}`, data),
  toggleExpenseCategory: (id, is_active) => api.patch(`/masters/expense-categories/${id}`, { is_active }),
};