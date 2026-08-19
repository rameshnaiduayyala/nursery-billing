import api from './api';

export const transactionService = {
  getAll: (params = {}) => api.get('/transactions/list.php', { params }),
  getById: (id) => api.get('/transactions/details.php', { params: { id } }),
  create: (data) => api.post('/transactions/create.php', data),
  update: (data) => api.post('/transactions/update.php', data),
  delete: (id) => api.post('/transactions/delete.php', { id }),
};

export default transactionService;
