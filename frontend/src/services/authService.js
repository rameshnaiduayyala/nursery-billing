import api from './api';

export const authService = {
  login: (credentials) => api.post('/auth/login.php', credentials),
  logout: () => api.post('/auth/logout.php'),
  getMe: () => api.get('/auth/me.php'),
  changePassword: (data) => api.post('/auth/change-password.php', data),
};

export default authService;
