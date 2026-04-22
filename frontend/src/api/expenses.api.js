import api from './axios';

export const expensesApi = {
  create:         (data)         => api.post('/expenses', data),
  getMonthly:     (year, month)  => api.get('/expenses/monthly', { params: { year, month } }),
  getMonthlySummary: (year, month) => api.get('/expenses/summary', { params: { year, month } }),
  remove:         (id)           => api.delete(`/expenses/${id}`),
};