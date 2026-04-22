import api from './axios';

export const purchaseApi = {
  getAll:    (params) => api.get('/purchases', { params }),
  create:    (data)   => api.post('/purchases', data),
  getMonthly:(year, month) => api.get('/purchases/monthly', { params: { year, month } }),
  remove:    (id)     => api.delete(`/purchases/${id}`),
};