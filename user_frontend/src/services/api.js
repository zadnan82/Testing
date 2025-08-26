// user_frontend/src/services/api.js

import { CONFIG, getApiUrl } from '../config/api.config';
import { storage } from '../utils/storage';

class ApiError extends Error {
  constructor(message, status, code, details = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

class NetworkError extends Error {
  constructor(message = 'Network error occurred') {
    super(message);
    this.name = 'NetworkError';
  }
}

class TimeoutError extends Error {
  constructor(message = 'Request timed out') {
    super(message);
    this.name = 'TimeoutError';
  }
}

class ApiClient {
  constructor() {
    this.baseURL = CONFIG.API.BASE_URL;
    this.timeout = CONFIG.API.TIMEOUT;
    this.retryAttempts = CONFIG.API.RETRY_ATTEMPTS || 3;
    this.retryDelay = 1000; // 1 second
    this.requestInterceptors = [];
    this.responseInterceptors = [];
    
    // Add default interceptors
    this.setupDefaultInterceptors();
  }

  setupDefaultInterceptors() {
    // Request interceptor for auth token
    this.addRequestInterceptor((config) => {
      const token = storage.get(CONFIG.STORAGE_KEYS.SESSION_TOKEN);
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`
        };
      }
      return config;
    });

    // Response interceptor for global error handling
    this.addResponseInterceptor(
      (response) => response,
      (error) => {
        this.handleGlobalError(error);
        return Promise.reject(error);
      }
    );
  }

  addRequestInterceptor(interceptor) {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(onFulfilled, onRejected) {
    this.responseInterceptors.push({ onFulfilled, onRejected });
  }

  async applyRequestInterceptors(config) {
    let finalConfig = { ...config };
    
    for (const interceptor of this.requestInterceptors) {
      try {
        finalConfig = await interceptor(finalConfig);
      } catch (error) {
        console.error('Request interceptor error:', error);
      }
    }
    
    return finalConfig;
  }

  async applyResponseInterceptors(response) {
    let finalResponse = response;
    
    for (const { onFulfilled } of this.responseInterceptors) {
      if (onFulfilled) {
        try {
          finalResponse = await onFulfilled(finalResponse);
        } catch (error) {
          console.error('Response interceptor error:', error);
        }
      }
    }
    
    return finalResponse;
  }

  async applyErrorInterceptors(error) {
    for (const { onRejected } of this.responseInterceptors) {
      if (onRejected) {
        try {
          await onRejected(error);
        } catch (interceptorError) {
          // Don't log error interceptor errors in production to avoid noise
          if (process.env.NODE_ENV === 'development') {
            console.error('Error interceptor error:', interceptorError);
          }
        }
      }
    }
  }

  handleGlobalError(error) {
    // Handle different types of errors globally
    if (error.status === 401) {
      this.handleUnauthorized();
    } else if (error.status === 403) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Access forbidden:', error.message);
      }
    } else if (error.status >= 500) {
      console.error('Server error:', error.message);
    } else if (error.status === 404 && error.message === 'Not Found') {
      // Don't log 404s for health checks and other expected endpoints
      if (process.env.NODE_ENV === 'development') {
        console.log('404 error (possibly expected):', error.message);
      }
    }
  }

  handleUnauthorized() {
    // Clear stored auth data
    storage.remove(CONFIG.STORAGE_KEYS.SESSION_TOKEN);
    storage.remove(CONFIG.STORAGE_KEYS.USER_DATA);
    
    // Redirect to login (but avoid infinite redirects)
    const currentPath = window.location.pathname;
    if (currentPath !== '/login' && currentPath !== '/register') {
      window.location.href = '/login?redirect=' + encodeURIComponent(currentPath);
    }
  }

  createAbortController(timeoutMs = this.timeout) {
    const controller = new AbortController();
    
    // Set timeout
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    // Clear timeout when request completes
    const originalAbort = controller.abort.bind(controller);
    controller.abort = () => {
      clearTimeout(timeoutId);
      originalAbort();
    };

    return controller;
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async retryRequest(requestFn, attempt = 1) {
    try {
      return await requestFn();
    } catch (error) {
      // Don't retry for certain error types
      if (
        error.status === 401 || 
        error.status === 403 || 
        error.status === 404 ||
        error.status === 422 ||
        error.name === 'TimeoutError' ||
        error.message === 'Auth verification timeout' ||
        attempt >= this.retryAttempts
      ) {
        throw error;
      }

      // Don't retry auth-related requests to avoid infinite loops
      if (error.message?.includes('Authentication') || error.message?.includes('Token')) {
        throw error;
      }

      // Exponential backoff
      const delayTime = this.retryDelay * Math.pow(2, attempt - 1);
      await this.delay(delayTime);

      console.log(`Retrying request (attempt ${attempt + 1}/${this.retryAttempts})`);
      return this.retryRequest(requestFn, attempt + 1);
    }
  }

  async request(endpoint, options = {}) {
    const url = getApiUrl(endpoint);
    
    // Apply request interceptors
    const config = await this.applyRequestInterceptors({
      method: 'GET',
      headers: {
        ...CONFIG.HEADERS,
        ...options.headers
      },
      ...options
    });

    const requestFn = async () => {
      const controller = this.createAbortController(options.timeout || this.timeout);
      
      try {
        const response = await fetch(url, {
          ...config,
          signal: controller.signal
        });

        // Handle different status codes
        if (!response.ok) {
          await this.handleErrorResponse(response);
        }

        // Handle empty responses (204 No Content)
        if (response.status === 204) {
          return null;
        }

        const data = await response.json();
        
        // Apply response interceptors
        return await this.applyResponseInterceptors(data);

      } catch (error) {
        // Handle different error types
        if (error.name === 'AbortError') {
          throw new TimeoutError('Request timed out');
        }
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          throw new NetworkError('Unable to connect to server');
        }

        throw error;
      } finally {
        controller.abort(); // Clear timeout
      }
    };

    try {
      return await this.retryRequest(requestFn);
    } catch (error) {
      await this.applyErrorInterceptors(error);
      throw error;
    }
  }

  async handleErrorResponse(response) {
    let errorData;
    
    try {
      errorData = await response.json();
    } catch {
      // If we can't parse JSON, create a generic error
      throw new ApiError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        'HTTP_ERROR'
      );
    }

    // Handle structured error responses
    if (errorData.error) {
      throw new ApiError(
        errorData.error.message || 'An error occurred',
        response.status,
        errorData.error.code || 'API_ERROR',
        errorData.error.details || {}
      );
    }

    // Handle FastAPI validation errors
    if (errorData.detail) {
      if (Array.isArray(errorData.detail)) {
        // Validation errors
        const fieldErrors = {};
        errorData.detail.forEach(error => {
          const field = error.loc?.join('.') || 'unknown';
          fieldErrors[field] = error.msg;
        });

        throw new ApiError(
          'Validation failed',
          response.status,
          'VALIDATION_ERROR',
          { fieldErrors }
        );
      }

      // String detail
      throw new ApiError(
        errorData.detail,
        response.status,
        'API_ERROR'
      );
    }

    // Generic error
    throw new ApiError(
      'An unexpected error occurred',
      response.status,
      'UNKNOWN_ERROR'
    );
  }

  // HTTP Methods
  async get(endpoint, params = {}, options = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    return this.request(url, {
      method: 'GET',
      ...options
    });
  }

  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
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
    return this.request(endpoint, {
      method: 'DELETE',
      ...options
    });
  }

  // Form data methods
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

  // File upload with progress
  async uploadFile(endpoint, file, options = {}) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', file);

      // Add auth header
      const token = storage.get(CONFIG.STORAGE_KEYS.SESSION_TOKEN);
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      // Progress callback
      if (options.onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            options.onProgress(Math.round(progress));
          }
        });
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            resolve(xhr.responseText);
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            reject(new ApiError(
              errorData.error?.message || 'Upload failed',
              xhr.status,
              errorData.error?.code || 'UPLOAD_ERROR'
            ));
          } catch {
            reject(new ApiError(
              `Upload failed: ${xhr.statusText}`,
              xhr.status,
              'UPLOAD_ERROR'
            ));
          }
        }
      };

      xhr.onerror = () => {
        reject(new NetworkError('Upload failed due to network error'));
      };

      xhr.ontimeout = () => {
        reject(new TimeoutError('Upload timed out'));
      };

      xhr.timeout = options.timeout || this.timeout;
      xhr.open('POST', getApiUrl(endpoint));
      xhr.send(formData);
    });
  }

  // Health check
  async healthCheck() {
    try {
      const response = await this.get('/health', {}, { timeout: 5000 });
      return { healthy: true, ...response };
    } catch (error) {
      return { 
        healthy: false, 
        error: error.message,
        status: error.status 
      };
    }
  }

  // Connection test
  async testConnection() {
    try {
      await this.healthCheck();
      return true;
    } catch {
      return false;
    }
  }
}

// Create and export singleton instance
export const apiClient = new ApiClient();

// Export error classes for external use
export { ApiError, NetworkError, TimeoutError };

export default apiClient;