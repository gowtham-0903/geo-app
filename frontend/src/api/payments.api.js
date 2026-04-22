import api from './axios';

export const paymentsApi = {
  // Customer payments
  getReceived:    (params) => api.get('/payments/received', { params }),
  createReceived: (data)   => api.post('/payments/received', data),
  deleteReceived: (id)     => api.delete(`/payments/received/${id}`),

  // Supplier payments
  getSupplier:    (params) => api.get('/payments/supplier', { params }),
  createSupplier: (data)   => api.post('/payments/supplier', data),
  deleteSupplier: (id)     => api.delete(`/payments/supplier/${id}`),

  // Outstanding
  customerOutstanding: () => api.get('/payments/outstanding/customers'),
  supplierOutstanding: () => api.get('/payments/outstanding/suppliers'),
  customerLedger: (id)    => api.get(`/payments/ledger/customer/${id}`),
  supplierLedger: (id)    => api.get(`/payments/ledger/supplier/${id}`),
};