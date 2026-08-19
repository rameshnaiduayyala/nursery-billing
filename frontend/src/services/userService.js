import api from './api';

export const userService = {
  getAll: () => api.get('/users/list.php'),
  create: (data) => api.post('/users/create.php', data),
  update: (data) => api.post('/users/update.php', data),
  delete: (id) => api.post('/users/delete.php', { id }),
};

export default userService;
