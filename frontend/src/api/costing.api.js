import api from './axios';

export const costingApi = {
  getLatest:  ()              => api.get('/costing'),
  create:     (data)          => api.post('/costing', data),
  getHistory: (bottleTypeId)  => api.get(`/costing/history/${bottleTypeId}`),
};