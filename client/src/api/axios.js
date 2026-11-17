import axios from 'axios';

// Create custom Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Attach JWT Bearer Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('taskforge_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle Token Expiration & Errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // If token expired or unauthorized, clean local auth state
    if (error.response && error.response.status === 401) {
      // Don't auto-logout if the error was just a failed login attempt
      const isLoginRequest = error.config && error.config.url.includes('/auth/login');
      if (!isLoginRequest) {
        localStorage.removeItem('taskforge_token');
        localStorage.removeItem('taskforge_user');
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
