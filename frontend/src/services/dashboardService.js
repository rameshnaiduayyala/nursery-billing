import api from './api';

export const dashboardService = {
  getSummary: (params = {}) => api.get('/dashboard/summary.php', { params }),
  getCharts: (params = {}) => api.get('/dashboard/charts.php', { params }),
  getRecent: () => api.get('/dashboard/recent.php'),
};

export default dashboardService;
