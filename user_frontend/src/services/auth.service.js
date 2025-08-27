// user_frontend/src/services/auth.service.js

import { apiClient } from './api';
import { CONFIG, getEndpoint } from '../config/api.config';
import { storage } from '../utils/storage';

export class AuthService {
  // Register new user - FIXED to match backend schema
  async register(userData) {
    const response = await apiClient.post(getEndpoint('REGISTER'), {
      first_name: userData.firstName,
      last_name: userData.lastName,
      email: userData.email,
      password: userData.password,
      confirm_password: userData.password, // Add confirm_password field
      user_type_id: userData.userTypeId || 1
    });
    return response; // Return response directly (no .data)
  }

  // Login user - FIXED to use Form Data for OAuth2PasswordRequestForm
  async login(email, password) {
    // Create FormData for OAuth2PasswordRequestForm
    const formData = new FormData();
    formData.append('username', email); // Backend expects 'username' field
    formData.append('password', password);
    
    // Use postForm method
    const response = await apiClient.postForm(getEndpoint('LOGIN'), formData);
    
    // Store session token
    if (response.access_token) {
      storage.set(CONFIG.STORAGE_KEYS.SESSION_TOKEN, response.access_token);
    }
    
    return response;
  }

  // Get current user profile - FIXED endpoint
  async getCurrentUser(options = {}) {
    const response = await apiClient.get(getEndpoint('ME'), {}, options);
    
    // Store user data 
    if (response) {
      storage.set(CONFIG.STORAGE_KEYS.USER_DATA, response);
    }
    
    return response;
  }

  // Update user profile - FIXED to match backend schema
  async updateProfile(userData) {
    const payload = {};
    if (userData.firstName) payload.first_name = userData.firstName;
    if (userData.lastName) payload.last_name = userData.lastName;
    if (userData.email) payload.email = userData.email;
    
    const response = await apiClient.put(getEndpoint('UPDATE_PROFILE'), payload);
    
    if (response) {
      storage.set(CONFIG.STORAGE_KEYS.USER_DATA, response);
    }
    
    return response;
  }

  // Change password - FIXED to match backend schema
  async changePassword(currentPassword, newPassword) {
    const response = await apiClient.post(getEndpoint('CHANGE_PASSWORD'), {
      current_password: currentPassword,
      new_password: newPassword,
      confirm_new_password: newPassword
    });
    return response;
  }

  // Refresh session token (when you implement this endpoint)
  async refreshToken() {
    const response = await apiClient.post(getEndpoint('REFRESH'));
    
    if (response.access_token) {
      storage.set(CONFIG.STORAGE_KEYS.SESSION_TOKEN, response.access_token);
    }
    
    return response;
  }

  // Logout current session
  async logout() {
    try {
      await apiClient.delete(getEndpoint('LOGOUT'));
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local logout even if API fails
    }
    
    this.clearLocalSession();
  }

  // Logout all sessions
  async logoutAll() {
    try {
      await apiClient.delete(getEndpoint('LOGOUT_ALL'));
    } catch (error) {
      console.error('Logout all API call failed:', error);
    }
    
    this.clearLocalSession();
  }

  // Get all user sessions
  async getSessions() {
    const response = await apiClient.get(getEndpoint('SESSIONS'));
    return response;
  }

  // Revoke specific session
  async revokeSession(sessionId) {
    const response = await apiClient.delete(`${getEndpoint('SESSIONS')}/${sessionId}`);
    return response;
  }

  // Forgot password
  async forgotPassword(email) {
    const response = await apiClient.post(getEndpoint('FORGOT_PASSWORD'), {
      email: email
    });
    return response;
  }

  // Reset password
  async resetPassword(token, newPassword) {
    const response = await apiClient.post(getEndpoint('RESET_PASSWORD'), {
      token: token,
      new_password: newPassword,
      confirm_password: newPassword
    });
    return response;
  }

  // Clear local session data
  clearLocalSession() {
    storage.remove(CONFIG.STORAGE_KEYS.SESSION_TOKEN);
    storage.remove(CONFIG.STORAGE_KEYS.USER_DATA);
  }

  // Check if user is logged in
  isAuthenticated() {
    return !!storage.get(CONFIG.STORAGE_KEYS.SESSION_TOKEN);
  }

  // Get stored user data
  getStoredUser() {
    return storage.get(CONFIG.STORAGE_KEYS.USER_DATA);
  }

  // Get stored token
  getStoredToken() {
    return storage.get(CONFIG.STORAGE_KEYS.SESSION_TOKEN);
  }

  // Validate token format (basic check)
  isValidToken(token) {
    if (!token || typeof token !== 'string') return false;
    // Add more validation if needed (JWT format check, etc.)
    return token.length > 10; // Basic length check
  }

  // Get user role/type
  getUserRole() {
    const user = this.getStoredUser();
    return user?.user_type_id || null;
  }

  // Check if user has specific role
  hasRole(roleId) {
    const userRole = this.getUserRole();
    return userRole === roleId;
  }
}

// Create and export singleton instance
export const authService = new AuthService();
export default authService;