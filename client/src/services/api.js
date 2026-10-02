import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const TOKEN_KEY = 'cv_token';
const USER_KEY = 'cv_user';

// --- Token helpers ---------------------------------------------------------
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const removeToken = () => localStorage.removeItem(TOKEN_KEY);

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
export const setStoredUser = (user) => localStorage.setItem(USER_KEY, JSON.stringify(user));
export const removeStoredUser = () => localStorage.removeItem(USER_KEY);

export const clearAuth = () => {
  removeToken();
  removeStoredUser();
};

// --- Axios instance --------------------------------------------------------
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // AI scans can take a while
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, clear stale credentials and bounce to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuth();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/** Extracts a friendly message from an API error response. */
export const getErrorMessage = (error) => {
  if (error.code === 'ECONNABORTED') {
    return 'The request timed out. Please try again.';
  }
  if (!error.response) {
    return 'Cannot reach the server. Check your connection and try again.';
  }
  return error.response.data?.message || 'An unexpected error occurred. Please try again.';
};

export default api;
