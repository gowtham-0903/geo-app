import api from './axios';

export const salesApi = {
  getAll:       (params)       => api.get('/sales', { params }),
  create:       (data)         => api.post('/sales', data),
  getMonthly:   (year, month)  => api.get('/sales/monthly', { params: { year, month } }),
  getSummary:   (year, month)  => api.get('/sales/summary', { params: { year, month } }),
  getItems:     (id)           => api.get(`/sales/${id}/items`),
  remove:       (id)           => api.delete(`/sales/${id}`),
};