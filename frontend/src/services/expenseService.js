import api from './api';

export const expenseService = {
  getAll: (params = {}) => api.get('/expenses/list.php', { params }),
  create: (data) => api.post('/expenses/create.php', data),
  update: (data) => api.post('/expenses/update.php', data),
  delete: (id) => api.post('/expenses/delete.php', { id }),
};

export default expenseService;
