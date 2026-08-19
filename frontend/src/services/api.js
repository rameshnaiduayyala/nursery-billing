import axios from 'axios';

// API base URL configured for cPanel remote API or local dev override
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://nursery.vanyxglobal.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request Interceptor: Attach Auth Token if present in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('nursery_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Extract data and handle errors cleanly
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Unable to connect to server. Please try again.';
    return Promise.reject(new Error(message));
  }
);

export default api;
