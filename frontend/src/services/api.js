import axios from 'axios';

// API base URL configured for cPanel remote API or local dev override
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://nursery.vanyxglobal.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 30000, // 30s global timeout
});

// ── Module-level token cache ──
let _cachedToken = localStorage.getItem('nursery_token') || null;

export function setApiToken(token) {
  _cachedToken = token || null;
}

// ── Global Loading Listener System ──
let _activeRequests = 0;
const _listeners = new Set();

function notifyListeners() {
  const isLoading = _activeRequests > 0;
  _listeners.forEach((fn) => fn(isLoading, _activeRequests));
}

export function subscribeLoading(fn) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

// Request Interceptor: Attach token + track active requests
api.interceptors.request.use(
  (config) => {
    if (_cachedToken) {
      config.headers.Authorization = `Bearer ${_cachedToken}`;
    }
    _activeRequests++;
    notifyListeners();
    return config;
  },
  (error) => {
    _activeRequests = Math.max(0, _activeRequests - 1);
    notifyListeners();
    return Promise.reject(error);
  }
);

// Response Interceptor: Extract data + track completed requests
api.interceptors.response.use(
  (response) => {
    _activeRequests = Math.max(0, _activeRequests - 1);
    notifyListeners();
    return response.data;
  },
  (error) => {
    _activeRequests = Math.max(0, _activeRequests - 1);
    notifyListeners();

    // Auto-logout on 401 Unauthorized
    if (error.response?.status === 401) {
      _cachedToken = null;
      localStorage.removeItem('nursery_token');
      localStorage.removeItem('nursery_user');
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
