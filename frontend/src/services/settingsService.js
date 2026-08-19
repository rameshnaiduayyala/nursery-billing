import api from './api';

export const settingsService = {
  // Expense Categories
  getExpenseCategories: async () => {
    return api.get('/settings/expense_categories/list.php');
  },
  createExpenseCategory: async (data) => {
    return api.post('/settings/expense_categories/create.php', data);
  },
  updateExpenseCategory: async (data) => {
    return api.post('/settings/expense_categories/update.php', data);
  },
  deleteExpenseCategory: async (id) => {
    return api.post(`/settings/expense_categories/delete.php?id=${id}`);
  },

  // Payment Modes
  getPaymentModes: async () => {
    return api.get('/settings/payment_modes/list.php');
  },
  createPaymentMode: async (data) => {
    return api.post('/settings/payment_modes/create.php', data);
  },
  updatePaymentMode: async (data) => {
    return api.post('/settings/payment_modes/update.php', data);
  },
  deletePaymentMode: async (id) => {
    return api.post(`/settings/payment_modes/delete.php?id=${id}`);
  },
};
