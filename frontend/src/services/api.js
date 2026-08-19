import axios from 'axios';

// API base URL configured for cPanel remote API or local dev override
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://nursery.vanyxglobal.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 30000, // 30s global timeout
});

// ── Module-level token cache: read from localStorage once per session ──
// Updated by setApiToken() which is called on login/logout.
let _cachedToken = localStorage.getItem('nursery_token') || null;

export function setApiToken(token) {
  _cachedToken = token || null;
}

// Request Interceptor: Attach cached auth token
api.interceptors.request.use(
  (config) => {
    if (_cachedToken) {
      config.headers.Authorization = `Bearer ${_cachedToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Extract data and handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Auto-logout on 401 Unauthorized (token expired / invalid)
    if (error.response?.status === 401) {
      _cachedToken = null;
      localStorage.removeItem('nursery_token');
      localStorage.removeItem('nursery_user');
      // Redirect to login without React Router (works outside component tree)
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    const message =
      error.response?.data?.message ||
      (error.code === 'ECONNABORTED' ? 'Request timed out. Please try again.' : null) ||
      error.message ||
      'Unable to connect to server. Please try again.';

    return Promise.reject(new Error(message));
  }
);

export default api;
