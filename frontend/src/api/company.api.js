import api from './axios';

export const companyApi = {
  get:    ()     => api.get('/company'),
  update: (data) => api.put('/company', data),
};
