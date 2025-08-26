// Base API client with interceptors and error handling
import { CONFIG, getApiUrl } from '../config/api.config';
import { storage } from '../utils/storage';

class ApiClient {
  constructor() {
    this.baseURL = CONFIG.API.BASE_URL;
    this.timeout = CONFIG.API.TIMEOUT;
  }

  // Get auth headers
  getAuthHeaders() {
    const token = storage.get(CONFIG.STORAGE_KEYS.SESSION_TOKEN);
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Main request method
  async request(endpoint, options = {}) {
    const url = getApiUrl(endpoint);
    
    const config = {
      headers: {
        ...CONFIG.HEADERS,
        ...this.getAuthHeaders(),
        ...options.headers
      },
      signal: AbortSignal.timeout(this.timeout),
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      // Handle different status codes
      switch (response.status) {
        case 401:
          this.handleUnauthorized();
          throw new Error(CONFIG.ERRORS.UNAUTHORIZED);
          
        case 403:
          throw new Error(CONFIG.ERRORS.FORBIDDEN);
          
        case 404:
          throw new Error(CONFIG.ERRORS.NOT_FOUND);
          
        case 409:
          const conflictData = await response.json().catch(() => ({}));
          throw new Error(conflictData.detail || CONFIG.ERRORS.CONFLICT);
          
        case 500:
          throw new Error(CONFIG.ERRORS.SERVER_ERROR);
      }
      
      // Handle other HTTP errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Handle empty responses (like 204 No Content)
      if (response.status === 204) {
        return null;
      }
      
      return await response.json();
    } catch (error) {
      if (error.name === 'TimeoutError') {
        throw new Error(CONFIG.ERRORS.TIMEOUT);
      }
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error(CONFIG.ERRORS.NETWORK_ERROR);
      }
      
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Handle unauthorized responses
  handleUnauthorized() {
    storage.remove(CONFIG.STORAGE_KEYS.SESSION_TOKEN);
    storage.remove(CONFIG.STORAGE_KEYS.USER_DATA);
    
    // Redirect to login if not already there
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  // HTTP Methods
  async get(endpoint, options = {}) {
    return this.request(endpoint, { method: 'GET', ...options });
  }

  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options
    });
  }

  // Special method for form data (like login with OAuth2PasswordRequestForm)
  async postForm(endpoint, formData, options = {}) {
    const headers = { ...options.headers };
    delete headers['Content-Type']; // Let browser set it for FormData
    
    return this.request(endpoint, {
      method: 'POST',
      body: formData,
      headers,
      ...options
    });
  }

  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options
    });
  }

  async patch(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
      ...options
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { method: 'DELETE', ...options });
  }
}

// Create and export singleton instance
export const apiClient = new ApiClient();
export default apiClient;