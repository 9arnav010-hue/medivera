import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with validateStatus to prevent throwing on 4xx errors
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // ✅ KEY FIX: Don't throw errors on 4xx status codes
  validateStatus: function (status) {
    return status >= 200 && status < 500; // Accept both 2xx and 4xx
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('healthsphere_token') || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs with error handling
export const authAPI = {
  register: async (data) => {
    try {
      const response = await api.post('/auth/register', data);
      return response;
    } catch (error) {
      return {
        data: {
          success: false,
          error: error.response?.data?.error || error.message || 'Registration failed',
        },
        status: error.response?.status || 500
      };
    }
  },
  
  login: async (data) => {
    try {
      const response = await api.post('/auth/login', data);
      
      console.log('Login API response:', response); // Debug log
      
      // If status is 4xx, treat as error
      if (response.status >= 400) {
        console.log('Login failed with status:', response.status);
        return {
          data: {
            success: false,
            error: response.data.error || response.data.message || 'Invalid credentials',
            ...response.data
          },
          status: response.status
        };
      }
      
      // Success - return response as-is
      console.log('Login successful');
      return response;
    } catch (error) {
      console.error('Login error:', error);
      return {
        data: {
          success: false,
          error: error.response?.data?.error || error.message || 'Login failed',
        },
        status: error.response?.status || 500
      };
    }
  },
  
  getProfile: () => api.get('/auth/profile'),
};

// Report APIs
export const reportAPI = {
  analyzeText: (data) => api.post('/report/analyze', data),
  analyzePDF: (formData) => api.post('/report/analyze-pdf', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getReports: () => api.get('/report'),
  getReport: (id) => api.get(`/report/${id}`),
  deleteReport: (id) => api.delete(`/report/${id}`),
};

// Chat APIs
export const chatAPI = {
  sendMessage: (data) => api.post('/chat/message', data),
  getChatHistory: (sessionId) => api.get(`/chat/history/${sessionId}`),
  getAllChats: () => api.get('/chat/all'),
  deleteChat: (sessionId) => api.delete(`/chat/${sessionId}`),
};

// Vision APIs
export const visionAPI = {
  analyzeImage: (data) => api.post('/vision/analyze', data),
};

// Achievement APIs
export const achievementAPI = {
  getAchievements: () => api.get('/achievements'),
  getUserStats: () => api.get('/achievements/stats'),
};

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // ✅ MODIFIED: Don't redirect on 401 for login endpoint
    // Handle 401 but don't auto-redirect from login page
    if (response.status === 401 && !response.config.url.includes('/auth/login')) {
      // Only redirect if not on login page
      if (!window.location.pathname.includes('login')) {
        localStorage.removeItem('healthsphere_token');
        localStorage.removeItem('token');
        localStorage.removeItem('healthsphere_user');
        localStorage.removeItem('user');
        // Don't use window.location.href as it causes refresh
        // Let the app handle navigation
        console.log('Unauthorized - please login again');
      }
    }
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    
    // ✅ MODIFIED: Don't redirect on login errors
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      // Only clear auth on non-login 401 errors
      if (!window.location.pathname.includes('login')) {
        localStorage.removeItem('healthsphere_token');
        localStorage.removeItem('token');
        localStorage.removeItem('healthsphere_user');
        localStorage.removeItem('user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;