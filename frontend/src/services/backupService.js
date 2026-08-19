import api from './api';

export const backupService = {
  getStatus: async () => {
    return api.get('/backups/status.php');
  },

  getList: async () => {
    return api.get('/backups/list.php');
  },

  createBackup: async () => {
    return api.post('/backups/create.php');
  },

  deleteBackup: async (id) => {
    return api.post(`/backups/delete.php?id=${id}`);
  },

  getSettings: async () => {
    return api.get('/backups/settings.php');
  },

  updateSettings: async (settingsData) => {
    return api.post('/backups/settings.php', settingsData);
  },

  restoreBackup: async (formDataOrObject) => {
    if (formDataOrObject instanceof FormData) {
      return api.post('/backups/restore.php', formDataOrObject, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.post('/backups/restore.php', formDataOrObject);
  },

  testBackup: async () => {
    return api.post('/backups/test.php');
  },

  getDownloadUrl: (id) => {
    const baseUrl = api.defaults.baseURL;
    const token = localStorage.getItem('nursery_token');
    return `${baseUrl}/backups/download.php?id=${id}${token ? `&token=${token}` : ''}`;
  },

  getExportUrl: (type) => {
    const baseUrl = api.defaults.baseURL;
    const token = localStorage.getItem('nursery_token');
    return `${baseUrl}/backups/export.php?type=${type}${token ? `&token=${token}` : ''}`;
  },

  downloadBackupFile: async (id, filename) => {
    const token = localStorage.getItem('nursery_token');
    const baseUrl = api.defaults.baseURL;
    
    // Trigger browser file download using blob/token request
    const response = await fetch(`${baseUrl}/backups/download.php?id=${id}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.message || 'Download failed');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `nursery_backup_${id}.sql`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  downloadExportFile: async (type) => {
    const token = localStorage.getItem('nursery_token');
    const baseUrl = api.defaults.baseURL;

    const response = await fetch(`${baseUrl}/backups/export.php?type=${type}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.message || 'Export failed');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = type === 'everything' 
      ? `nursery_business_export_${new Date().toISOString().slice(0,10)}.zip`
      : `nursery_${type}_export_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
};
