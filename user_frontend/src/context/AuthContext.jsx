import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth.service';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state on app load
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user has stored token and data
      const token = authService.getStoredToken();
      const storedUser = authService.getStoredUser();

      if (token && authService.isValidToken(token) && storedUser) {
        setUser(storedUser);
        
        // Verify token is still valid by fetching fresh user data
        try {
          const freshUserData = await authService.getCurrentUser();
          setUser(freshUserData);
        } catch (err) {
          // Token might be expired, clear local data
          console.warn('Token validation failed:', err);
          authService.clearLocalSession();
          setUser(null);
        }
      } else {
        // Clear any invalid stored data
        authService.clearLocalSession();
        setUser(null);
      }
    } catch (err) {
      console.error('Auth initialization error:', err);
      setError(err.message);
      authService.clearLocalSession();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      // Login and get session token
      await authService.login(email, password);
      
      // Fetch user data
      const userData = await authService.getCurrentUser();
      setUser(userData);
      
      return userData;
    } catch (err) {
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authService.register(userData);
      
      // Don't auto-login after registration
      // User needs to manually login
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Registration failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      setError(null);

      await authService.logout();
      setUser(null);
    } catch (err) {
      // Even if logout API fails, clear local session
      console.error('Logout error:', err);
      authService.clearLocalSession();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logoutAll = async () => {
    try {
      setLoading(true);
      setError(null);

      await authService.logoutAll();
      setUser(null);
    } catch (err) {
      console.error('Logout all error:', err);
      authService.clearLocalSession();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      const updatedUser = await authService.updateProfile(userData);
      setUser(updatedUser);
      
      return updatedUser;
    } catch (err) {
      const errorMessage = err.message || 'Profile update failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      setLoading(true);
      setError(null);

      await authService.changePassword(currentPassword, newPassword);
      
      // Password change doesn't affect user data
      return true;
    } catch (err) {
      const errorMessage = err.message || 'Password change failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async () => {
    try {
      await authService.refreshToken();
      const userData = await authService.getCurrentUser();
      setUser(userData);
      return userData;
    } catch (err) {
      console.error('Session refresh error:', err);
      authService.clearLocalSession();
      setUser(null);
      throw err;
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    // State
    user,
    loading,
    error,
    isAuthenticated: !!user,
    
    // User info helpers
    userRole: user?.user_type_id || null,
    userName: user ? `${user.first_name} ${user.last_name}` : null,
    userEmail: user?.email || null,
    
    // Actions
    login,
    register,
    logout,
    logoutAll,
    updateProfile,
    changePassword,
    refreshSession,
    clearError,
    
    // Utility methods
    getStoredToken: () => authService.getStoredToken(),
    isStorageAuthenticated: () => authService.isAuthenticated(),
    hasRole: (roleId) => authService.hasRole(roleId),
    
    // Manual refresh for components
    refreshUserData: async () => {
      try {
        const userData = await authService.getCurrentUser();
        setUser(userData);
        return userData;
      } catch (err) {
        console.error('Manual user data refresh failed:', err);
        throw err;
      }
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;