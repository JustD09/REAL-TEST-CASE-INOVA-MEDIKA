import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8443';
const NODE_API_BASE_URL = import.meta.env.VITE_NODE_API_BASE_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  withCredentials: true,
});

export const nodeApi = axios.create({
  baseURL: NODE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Interceptor untuk menambahkan token ke request
const addAuthInterceptor = (instance) => {
  instance.interceptors.request.use(
    (config) => {
      const token = useAuthStore.getState().accessToken;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
};

addAuthInterceptor(api);
addAuthInterceptor(nodeApi);

// Response interceptor untuk nodeApi only (handles Node.js token refresh)
const addNodeResponseInterceptor = (instance) => {
  let isRefreshing = false;
  let failedQueue = [];

  const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });
    failedQueue = [];
  };

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return instance(originalRequest);
          }).catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = useAuthStore.getState().refreshToken;
          if (!refreshToken) throw new Error('No refresh token');

          const { data } = await nodeApi.post('/api/auth/refresh', { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = data.data;

          useAuthStore.getState().setTokens(accessToken, newRefreshToken);

          processQueue(null, accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return instance(originalRequest);
        } catch (err) {
          processQueue(err, null);
          useAuthStore.getState().logout();
          window.location.href = '/login';
          return Promise.reject(err);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );
};

addNodeResponseInterceptor(nodeApi);

// Helper functions untuk error handling
export const handleApiError = (error) => {
  if (error.response?.data?.error) {
    return error.response.data.error.message || 'Terjadi kesalahan';
  }
  if (error.message === 'Network Error') {
    return 'Tidak dapat terhubung ke server';
  }
  return error.message || 'Terjadi kesalahan tidak diketahui';
};

export default { api, nodeApi, handleApiError };