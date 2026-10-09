import axios from 'axios';

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
const cleanBaseUrl = rawBaseUrl.trim().replace(/\/+$/, '');
const API_BASE_URL = cleanBaseUrl.endsWith('/api/v1') ? cleanBaseUrl : `${cleanBaseUrl}/api/v1`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
  timeout: 30000,
});

// Attach JWT Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('walletledger_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with standard error parsing and 401 handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        localStorage.removeItem('walletledger_token');
        localStorage.removeItem('walletledger_user');
        window.dispatchEvent(new Event('walletledger_auth_expired'));
      }
    }

    // Extract standardized message from backend error envelope:
    // Backend returns: { success: false, error: { code: "...", message: "...", details?: [...] } }
    let message = 'An unexpected network error occurred';
    let errorCode = null;
    let errorDetails = null;

    if (error.response?.data) {
      const data = error.response.data;
      // Primary: backend error envelope  { success: false, error: { code, message } }
      if (data.error?.message) {
        message = data.error.message;
        errorCode = data.error.code || null;
        errorDetails = data.error.details || null;
      }
      // Fallback: FastAPI default validation / HTTPException { detail: "..." }
      else if (data.detail) {
        message = typeof data.detail === 'string'
          ? data.detail
          : JSON.stringify(data.detail);
      }
    } else if (error.request && !error.response) {
      // Network error – request was sent but no response received
      message = 'Network error – please check your connection and ensure the backend is running';
    } else if (error.message) {
      message = error.message;
    }

    error.friendlyMessage = message;
    error.errorCode = errorCode;
    error.errorDetails = errorDetails;
    return Promise.reject(error);
  }
);

// ─── API Service functions ──────────────────────────────────────────────────

export const authService = {
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data.data;
  },
  register: async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    return res.data.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data.data;
  },
};

export const walletService = {
  getMyWallet: async () => {
    const res = await api.get('/wallets/me');
    return res.data.data;
  },
  deposit: async (amount, description = 'Account Deposit') => {
    const res = await api.post('/wallets/deposit', { amount: Number(amount), description });
    return res.data.data;
  },
  getWalletById: async (id) => {
    const res = await api.get(`/wallets/${id}`);
    return res.data.data;
  },
};

export const transferService = {
  transfer: async (recipient, amount, description = '', idempotencyKey = null) => {
    const headers = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    const res = await api.post(
      '/transfers',
      { recipient, amount: Number(amount), description },
      { headers }
    );
    return res.data.data;
  },
};

export const holdService = {
  createHold: async (amount, reason) => {
    const res = await api.post('/holds', { amount: Number(amount), reason });
    return res.data.data;
  },
  listHolds: async (status = null) => {
    const params = status ? { status } : {};
    const res = await api.get('/holds', { params });
    return res.data.data;
  },
  captureHold: async (holdId) => {
    const res = await api.post(`/holds/${holdId}/capture`);
    return res.data.data;
  },
  releaseHold: async (holdId) => {
    const res = await api.post(`/holds/${holdId}/release`);
    return res.data.data;
  },
};

export const transactionService = {
  listTransactions: async (params = {}) => {
    const res = await api.get('/transactions', { params });
    return res.data.data;
  },
  getTransactionById: async (id) => {
    const res = await api.get(`/transactions/${id}`);
    return res.data.data;
  },
};

export const adminService = {
  getDashboard: async () => {
    const res = await api.get('/admin/dashboard');
    return res.data.data;
  },
  listUsers: async () => {
    const res = await api.get('/admin/users');
    return res.data.data;
  },
  updateUserStatus: async (userId, status) => {
    const res = await api.patch(`/admin/users/${userId}/status`, { status });
    return res.data.data;
  },
  listWallets: async () => {
    const res = await api.get('/admin/wallets');
    return res.data.data;
  },
  updateWalletStatus: async (walletId, status) => {
    const res = await api.patch(`/admin/wallets/${walletId}/status`, { status });
    return res.data.data;
  },
  listAllTransactions: async (params = {}) => {
    const res = await api.get('/admin/transactions', { params });
    return res.data.data;
  },
  listAuditLogs: async (limit = 50) => {
    const res = await api.get('/admin/audit-logs', { params: { limit } });
    return res.data.data;
  },
  runReconciliation: async () => {
    const res = await api.get('/admin/reconciliation');
    return res.data.data;
  },
};

export default api;
