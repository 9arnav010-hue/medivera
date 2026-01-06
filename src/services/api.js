import axios from 'axios';

/**
 * ✅ STRICT API URL
 * Must be defined in .env.production
 */
const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.error('❌ VITE_API_URL is not defined');
}

const api = axios.create({
  baseURL: API_URL, // MUST be https://medivera-backend.onrender.com/api
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // prevent infinite waiting
});

/* =======================
   REQUEST INTERCEPTOR
======================= */
api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('healthsphere_token') ||
    localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/* =======================
   RESPONSE INTERCEPTOR
======================= */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);

    if (
      error.response?.status === 401 &&
      !error.config?.url?.includes('/auth/login')
    ) {
      localStorage.clear();
      console.warn('Unauthorized – cleared auth');
    }

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

export default api;
