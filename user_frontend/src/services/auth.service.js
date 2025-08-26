// Authentication service - handles all auth-related API calls
import { apiClient } from './api';
import { CONFIG, getEndpoint } from '../config/api.config';
import { storage } from '../utils/storage';

export class AuthService {
  // Register new user
  async register(userData) {
  const response = await apiClient.post(getEndpoint('REGISTER'), {
    first_name: userData.firstName,
    last_name: userData.lastName,
    email: userData.email,
    password: userData.password,
    user_type_id: userData.userTypeId || 1
  });
  return response.data; // Return the data
}

  // Login user (FastAPI uses OAuth2PasswordRequestForm)
 async login(email, password) {
  // Create FormData for OAuth2PasswordRequestForm
  const formData = new FormData();
  formData.append('username', email);
  formData.append('password', password);
  
  // Use postForm instead of axios-specific postForm
  const response = await apiClient.postForm(getEndpoint('LOGIN'), formData);
  
  // Store session token - access data directly (not response.data)
  if (response.access_token) {
    storage.set(CONFIG.STORAGE_KEYS.SESSION_TOKEN, response.access_token);
  }
  
  return response; // Return the response directly (not response.data)
}

  // Get current user profile
  async getCurrentUser() {
  const response = await apiClient.get(getEndpoint('ME'));
  
  // Store user data - access response directly (not response.data)
  if (response) {
    storage.set(CONFIG.STORAGE_KEYS.USER_DATA, response);
  }
  
  return response; // Return the response directly
}

  // Update user profile (when you implement this endpoint)
  async updateProfile(userData) {
    const payload = {};
    if (userData.firstName) payload.first_name = userData.firstName;
    if (userData.lastName) payload.last_name = userData.lastName;
    if (userData.email) payload.email = userData.email;
    
    const response = await apiClient.patch(getEndpoint('UPDATE_PROFILE'), payload);
  
  if (response.data) {
    storage.set(CONFIG.STORAGE_KEYS.USER_DATA, response.data);
  }
  
  return response.data; // Return data
}

async changePassword(currentPassword, newPassword) {
  const response = await apiClient.post(getEndpoint('CHANGE_PASSWORD'), {
    current_password: currentPassword,
    new_password: newPassword
  });
  return response.data; // Return data
}

  // Change password (when you implement this endpoint)
  async changePassword(currentPassword, newPassword) {
    const response = await apiClient.post(getEndpoint('CHANGE_PASSWORD'), {
      current_password: currentPassword,
      new_password: newPassword
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

  // Get all user sessions (when you implement this endpoint)
  async getSessions() {
    const response = await apiClient.get(getEndpoint('SESSIONS'));
    return response;
  }

  // Revoke specific session (when you implement this endpoint)
  async revokeSession(sessionId) {
    const response = await apiClient.delete(`${getEndpoint('REVOKE_SESSION')}/${sessionId}`);
    return response;
  }

  // Forgot password (when you implement this endpoint)
  async forgotPassword(email) {
    const response = await apiClient.post(getEndpoint('FORGOT_PASSWORD'), {
      email: email
    });
    return response;
  }

  // Reset password (when you implement this endpoint)
  async resetPassword(token, newPassword) {
    const response = await apiClient.post(getEndpoint('RESET_PASSWORD'), {
      token: token,
      new_password: newPassword
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