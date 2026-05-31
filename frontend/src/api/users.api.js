import api from './axios';

export const usersApi = {
  getAll:         ()           => api.get('/auth/users'),
  create:         (data)       => api.post('/auth/register', data),
  update:         (id, data)   => api.put(`/auth/users/${id}`, data),
  toggleActive:   (id, active) => api.patch(`/auth/users/${id}/active`, { is_active: active }),
  resetPassword:  (id, data)   => api.patch(`/auth/users/${id}/password`, data),
};
