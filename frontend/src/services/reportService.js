import api from './api';

export const reportService = {
  getSalesReport: (params = {}) => api.get('/reports/sales.php', { params }),
  getPurchasesReport: (params = {}) => api.get('/reports/purchases.php', { params }),
  getExpensesReport: (params = {}) => api.get('/reports/expenses.php', { params }),
  getFarmersReport: (params = {}) => api.get('/reports/farmers.php', { params }),
  getCustomersReport: (params = {}) => api.get('/reports/customers.php', { params }),
  getProfitLossReport: (params = {}) => api.get('/reports/profit-loss.php', { params }),
};

export default reportService;
