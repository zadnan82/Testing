// Single configuration file - All settings in one place
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const CONFIG = {
  // API Configuration
  API: {
    BASE_URL: API_BASE_URL,
    TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
  },
  
  // All API Endpoints
  ENDPOINTS: {
    // Auth endpoints (matching your FastAPI backend)
    LOGIN: '/v1/auth/token',
    REGISTER: '/v1/auth/user/create',
    LOGOUT: '/v1/auth/logout',
    LOGOUT_ALL: '/v1/auth/logout/all', 
    ME: '/v1/auth/me',
    
    // Future endpoints (when you add them)
    REFRESH: '/v1/auth/refresh',
    UPDATE_PROFILE: '/v1/auth/user/update',
    CHANGE_PASSWORD: '/v1/auth/user/change-password',
    FORGOT_PASSWORD: '/v1/auth/forgot-password',
    RESET_PASSWORD: '/v1/auth/reset-password',
  },
  
  // Request Headers
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  
  // App Settings
  APP: {
    NAME: import.meta.env.VITE_APP_NAME || 'Sevdo',
    VERSION: '1.0.0',
  },
  
  // Storage Keys
  STORAGE_KEYS: {
    SESSION_TOKEN: 'auth_token',
    USER_DATA: 'user_data',
  },
  
  // Feature Flags
  FEATURES: {
    REGISTRATION: true,
    PASSWORD_RESET: true,
    REMEMBER_ME: true,
  },
  
  // Error Messages
  ERRORS: {
    NETWORK_ERROR: 'Network error. Please check your connection.',
    UNAUTHORIZED: 'Session expired. Please login again.',
    FORBIDDEN: 'You do not have permission to perform this action.',
    NOT_FOUND: 'The requested resource was not found.',
    CONFLICT: 'A conflict occurred. Please try again.',
    SERVER_ERROR: 'Server error. Please try again later.',
    TIMEOUT: 'Request timed out. Please try again.',
    VALIDATION_ERROR: 'Please check your input and try again.'
  }
};

// Helper functions
export const getApiUrl = (endpoint) => `${CONFIG.API.BASE_URL}${endpoint}`;
export const getEndpoint = (key) => CONFIG.ENDPOINTS[key] || '';

export default CONFIG;