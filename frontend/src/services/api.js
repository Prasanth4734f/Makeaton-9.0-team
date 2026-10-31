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
      const token = user?.token || user?.access_token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch { /* ignore */ }
  return config;
});

// Global error handling:
// Prevent bad global redirect behavior:
// Normal API/service errors (like Action Center or data fetches) must NOT blindly log out a valid user.
// Only explicit session check endpoints (e.g. /auth/me) indicating a dead session should redirect.
api.interceptors.response.use(
  response => response,
  error => {
    const isExplicitAuthCheck = error.config?.url?.includes('/auth/me');
    if (error.response?.status === 401 && isExplicitAuthCheck) {
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        localStorage.removeItem('revora_auth');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export { api, MOCK_MODE };
export default api;
