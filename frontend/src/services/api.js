import axios from 'axios';

const BASE_URL = (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_API_BASE_URL) || 'http://localhost:8000/api';
const MOCK_MODE = (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_MOCK_MODE === 'true');

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach auth token to every request
api.interceptors.request.use(config => {
  try {
    const stored = localStorage.getItem('revora_auth');
    if (stored) {
      const user = JSON.parse(stored);
      if (user?.token) config.headers.Authorization = `Bearer ${user.token}`;
    }
  } catch { /* ignore */ }
  return config;
});

// Global error handling
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('revora_auth');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export { api, MOCK_MODE };
export default api;
