import api from './api';

export const farmerService = {
  getAll: (params = {}) => api.get('/farmers/list.php', { params }),
  getById: (id) => api.get('/farmers/details.php', { params: { id } }),
  create: (data) => api.post('/farmers/create.php', data),
  update: (data) => api.post('/farmers/update.php', data),
  delete: (id) => api.post('/farmers/delete.php', { id }),
  getStatement: (params) => api.get('/farmers/statement.php', { params }),
};

export default farmerService;
