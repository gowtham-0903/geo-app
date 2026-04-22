import api from './axios';

export const productionApi = {
  getAll:       (params) => api.get('/production', { params }),
  create:       (data)   => api.post('/production', data),
  update:       (id, data) => api.put(`/production/${id}`, data),
  remove:       (id)     => api.delete(`/production/${id}`),
  todaySummary: ()       => api.get('/production/today'),
};