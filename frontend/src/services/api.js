import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 
  'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 10000
});


// REQUEST INTERCEPTOR

api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');

    // If token exists add it to Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


// RESPONSE INTERCEPTOR

api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);


// AUTH ENDPOINTS

export const login = (email, password) =>
  api.post('/auth/login', { email, password });

export const register = (userData) =>
  api.post('/auth/register', userData);

export const createUser = (userData) =>
  api.post('/users', userData);

export const getCurrentUser = () =>
  api.get('/auth/me');

export const updatePassword = (currentPassword, newPassword) =>
  api.put('/auth/updatepassword', {
    currentPassword,
    newPassword
  });


// USER ENDPOINTS

export const getUsers = () =>
  api.get('/users');

export const getUser = (id) =>
  api.get(`/users/${id}`);

export const updateUser = (id, data) =>
  api.put(`/users/${id}`, data);

export const deleteUser = (id) =>
  api.delete(`/users/${id}`);


// DEPARTMENT ENDPOINTS

// Get all departments
export const getDepartments = () =>
  api.get('/departments');

// Create new department (admin only)
export const createDepartment = (data) =>
  api.post('/departments', data);

// Update department (admin only)
export const updateDepartment = (id, data) =>
  api.put(`/departments/${id}`, data);

// Delete department (admin only)
export const deleteDepartment = (id) =>
  api.delete(`/departments/${id}`);


// TRANSACTION ENDPOINTS

export const getTransactions = (params = {}) =>
  api.get('/transactions', { params });

export const getPendingTransactions = () =>
  api.get('/transactions/pending');

export const getAnalytics = (params = {}) =>
  api.get('/transactions/analytics', { params });

export const getCategories = () =>
  api.get('/transactions/categories/list');

export const allocatePettyCash = (data) =>
  api.post('/transactions/allocate', data);

export const createExpense = (data) =>
  api.post('/transactions/expense', data);

export const updateTransaction = (id, data) =>
  api.put(`/transactions/${id}`, data);

export const approveTransaction = (id, approvalComment = '') =>
  api.put(`/transactions/${id}/approve`, { approvalComment });

export const rejectTransaction = (id, reason) =>
  api.put(`/transactions/${id}/reject`, { reason });

export const deleteTransaction = (id) =>
  api.delete(`/transactions/${id}`);

export default api;