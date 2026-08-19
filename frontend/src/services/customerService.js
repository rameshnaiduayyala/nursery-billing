import api from './api';

export const customerService = {
  getAll: (params = {}) => api.get('/customers/list.php', { params }),
  getById: (id) => api.get('/customers/details.php', { params: { id } }),
  create: (data) => api.post('/customers/create.php', data),
  update: (data) => api.post('/customers/update.php', data),
  delete: (id) => api.post('/customers/delete.php', { id }),
  getStatement: (params) => api.get('/customers/statement.php', { params }),
};

export default customerService;
