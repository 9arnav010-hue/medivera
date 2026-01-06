import axios from 'axios';

// ✅ STRICT API URL - Must be defined in environment
const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.error('❌ VITE_API_URL is not defined in environment variables');
  // Provide fallback based on environment
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.warn('⚠️ Using localhost fallback for development');
  } else {
    console.error('🚨 Production deployment missing VITE_API_URL');
  }
}

// Create axios instance with proper configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 second timeout
  withCredentials: false, // Render doesn't need credentials for CORS
});

/* =======================
   REQUEST INTERCEPTOR
======================= */
api.interceptors.request.use((config) => {
  // Get token from localStorage
  const token = localStorage.getItem('healthsphere_token') || 
                 localStorage.getItem('token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Log request in development
  if (import.meta.env.DEV) {
    console.log(`📤 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, config.data || '');
  }
  
  return config;
}, (error) => {
  console.error('Request interceptor error:', error);
  return Promise.reject(error);
});

/* =======================
   RESPONSE INTERCEPTOR
======================= */
api.interceptors.response.use(
  (response) => {
    // Log response in development
    if (import.meta.env.DEV) {
      console.log(`📥 Response ${response.status} ${response.config.url}:`, response.data);
    }
    return response;
  },
  (error) => {
    // Enhanced error logging
    console.error('❌ API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      console.warn('🔐 Authentication expired or invalid');
      
      // Only clear auth and redirect if not a login request
      if (!error.config?.url?.includes('/auth/login')) {
        localStorage.removeItem('healthsphere_token');
        localStorage.removeItem('token');
        
        // Redirect to login if we're in browser environment
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
      
      // Return a clean error for login attempts
      return Promise.reject({
        message: error.response?.data?.message || 'Authentication failed',
        status: 401,
        originalError: error
      });
    }

    // Handle network errors
    if (!error.response) {
      console.error('🌐 Network error - backend may be down');
      return Promise.reject({
        message: 'Unable to connect to server. Please check your internet connection.',
        isNetworkError: true,
        originalError: error
      });
    }

    // Handle 500 server errors
    if (error.response?.status >= 500) {
      console.error('💥 Server error:', error.response?.data);
      return Promise.reject({
        message: 'Server error. Please try again later.',
        status: error.response.status,
        originalError: error
      });
    }

    // Pass through other errors
    return Promise.reject(error);
  }
);

/* =======================
   AUTH APIs
======================= */
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  logout: () => {
    localStorage.removeItem('healthsphere_token');
    localStorage.removeItem('token');
    return Promise.resolve();
  }
};

/* =======================
   REPORT APIs
======================= */
export const reportAPI = {
  analyzeText: (data) => api.post('/report/analyze', data),
  analyzePDF: (formData) =>
    api.post('/report/analyze-pdf', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getReports: () => api.get('/report'),
  getReport: (id) => api.get(`/report/${id}`),
  deleteReport: (id) => api.delete(`/report/${id}`),
};

/* =======================
   CHAT APIs
======================= */
export const chatAPI = {
  sendMessage: (data) => api.post('/chat/message', data),
  getChatHistory: (id) => api.get(`/chat/history/${id}`),
  getAllChats: () => api.get('/chat/all'),
  deleteChat: (id) => api.delete(`/chat/${id}`),
};

/* =======================
   VISION APIs
======================= */
export const visionAPI = {
  analyzeImage: (data) => api.post('/vision/analyze', data),
};

/* =======================
   ACHIEVEMENTS APIs
======================= */
export const achievementAPI = {
  getAchievements: () => api.get('/achievements'),
  getUserStats: () => api.get('/achievements/stats'),
};

/* =======================
   HEALTH CHECK
======================= */
export const healthAPI = {
  checkBackend: () => api.get('/health')
};

export default api;
