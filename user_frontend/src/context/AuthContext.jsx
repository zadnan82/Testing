// user_frontend/src/context/AuthContext.jsx

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/auth.service';
import { useToast, useErrorToast } from '../components/ui/Toast';
import { useErrorHandler } from '../components/ErrorBoundary';

const AuthContext = createContext(null);

// Auth states
const AUTH_STATES = {
  LOADING: 'loading',
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
  ERROR: 'error'
};

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState(AUTH_STATES.LOADING);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const toast = useToast();
  const errorToast = useErrorToast();
  const handleError = useErrorHandler();

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initialize authentication state
  const initializeAuth = useCallback(async () => {
    try {
      console.log('🔐 Initializing authentication...');
      setAuthState(AUTH_STATES.LOADING);
      clearError();

      // Check for stored token and user data
      const token = authService.getStoredToken();
      const storedUser = authService.getStoredUser();

      if (!token) {
        console.log('📝 No stored token found');
        setAuthState(AUTH_STATES.UNAUTHENTICATED);
        setUser(null);
        return;
      }

      if (!authService.isValidToken(token)) {
        console.log('⚠️ Invalid token found, clearing session');
        authService.clearLocalSession();
        setAuthState(AUTH_STATES.UNAUTHENTICATED);
        setUser(null);
        return;
      }

      // Use stored user data temporarily
      if (storedUser) {
        console.log('👤 Using stored user data');
        setUser(storedUser);
        setAuthState(AUTH_STATES.AUTHENTICATED);
      }

      // Try to verify with server (with timeout)
      try {
        console.log('🔍 Verifying with server...');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const freshUserData = await authService.getCurrentUser({
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        console.log('✅ Server verification successful');
        setUser(freshUserData);
        setAuthState(AUTH_STATES.AUTHENTICATED);
        
      } catch (verifyError) {
        console.warn('⚠️ Server verification failed:', verifyError.message);
        
        if (verifyError.status === 401) {
          // Token is invalid on server
          console.log('🔑 Token invalid on server, logging out');
          authService.clearLocalSession();
          setUser(null);
          setAuthState(AUTH_STATES.UNAUTHENTICATED);
        } else if (storedUser) {
          // Network error but we have cached data
          console.log('📱 Using cached data, server unreachable');
          setAuthState(AUTH_STATES.AUTHENTICATED);
        } else {
          // No cached data and server unreachable
          console.log('❌ No cached data, server unreachable');
          setAuthState(AUTH_STATES.UNAUTHENTICATED);
          setUser(null);
        }
      }

    } catch (err) {
      console.error('💥 Auth initialization failed:', err);
      setError(err.message);
      setAuthState(AUTH_STATES.ERROR);
      authService.clearLocalSession();
      setUser(null);
    } finally {
      setIsInitializing(false);
    }
  }, [clearError]);

  // Initialize on mount
  useEffect(() => {
    if (isInitializing) {
      initializeAuth();
    }
  }, [initializeAuth, isInitializing]);

  // Login function
  const login = useCallback(async (email, password) => {
    try {
      setAuthState(AUTH_STATES.LOADING);
      clearError();

      console.log('🔐 Logging in...');
      
      // Perform login
      await authService.login(email, password);
      
      // Get user data
      const userData = await authService.getCurrentUser();
      
      setUser(userData);
      setAuthState(AUTH_STATES.AUTHENTICATED);
      
      toast.success(`Welcome back, ${userData.first_name}!`);
      console.log('✅ Login successful');
      
      return userData;

    } catch (err) {
      console.error('❌ Login failed:', err);
      setError(err.message);
      setAuthState(AUTH_STATES.UNAUTHENTICATED);
      errorToast(err, 'Login failed');
      throw err;
    }
  }, [clearError, toast, errorToast]);

  // Register function
  const register = useCallback(async (userData) => {
    try {
      setAuthState(AUTH_STATES.LOADING);
      clearError();

      console.log('📝 Registering...');
      
      const response = await authService.register(userData);
      
      setAuthState(AUTH_STATES.UNAUTHENTICATED);
      toast.success('Registration successful! Please log in.');
      console.log('✅ Registration successful');
      
      return response;

    } catch (err) {
      console.error('❌ Registration failed:', err);
      setError(err.message);
      setAuthState(AUTH_STATES.UNAUTHENTICATED);
      errorToast(err, 'Registration failed');
      throw err;
    }
  }, [clearError, toast, errorToast]);

  // Logout function
  const logout = useCallback(async (options = {}) => {
    try {
      if (!options.skipLoading) {
        setAuthState(AUTH_STATES.LOADING);
      }
      clearError();

      console.log('🚪 Logging out...');
      
      // Call server logout (don't fail if it errors)
      try {
        await authService.logout();
      } catch (err) {
        console.warn('Server logout failed, continuing with local logout:', err.message);
      }
      
      // Always clear local session
      authService.clearLocalSession();
      setUser(null);
      setAuthState(AUTH_STATES.UNAUTHENTICATED);
      
      if (!options.silent) {
        toast.info('You have been logged out');
      }
      
      console.log('✅ Logout completed');

    } catch (err) {
      console.error('Logout error:', err);
      // Force logout even if there's an error
      authService.clearLocalSession();
      setUser(null);
      setAuthState(AUTH_STATES.UNAUTHENTICATED);
    }
  }, [clearError, toast]);

  // Update profile function
  const updateProfile = useCallback(async (profileData) => {
    try {
      setAuthState(AUTH_STATES.LOADING);
      clearError();

      const updatedUser = await authService.updateProfile(profileData);
      setUser(updatedUser);
      setAuthState(AUTH_STATES.AUTHENTICATED);
      
      toast.success('Profile updated successfully');
      return updatedUser;

    } catch (err) {
      console.error('Profile update failed:', err);
      setError(err.message);
      setAuthState(AUTH_STATES.AUTHENTICATED); // Keep user logged in
      errorToast(err, 'Profile update failed');
      throw err;
    }
  }, [clearError, toast, errorToast]);

  // Change password function
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      setAuthState(AUTH_STATES.LOADING);
      clearError();

      await authService.changePassword(currentPassword, newPassword);
      setAuthState(AUTH_STATES.AUTHENTICATED);
      
      toast.success('Password changed successfully');
      return true;

    } catch (err) {
      console.error('Password change failed:', err);
      setError(err.message);
      setAuthState(AUTH_STATES.AUTHENTICATED); // Keep user logged in
      errorToast(err, 'Password change failed');
      throw err;
    }
  }, [clearError, toast, errorToast]);

  // Computed values
  const isAuthenticated = authState === AUTH_STATES.AUTHENTICATED && !!user;
  const isLoading = authState === AUTH_STATES.LOADING || isInitializing;
  const isError = authState === AUTH_STATES.ERROR;
  const userName = user ? `${user.first_name} ${user.last_name}` : null;
  const userEmail = user?.email || null;
  const userRole = user?.user_type_id || null;

  // Context value
  const value = {
    // State
    user,
    authState,
    error,
    isAuthenticated,
    isLoading,
    isError,
    isInitializing,

    // User info
    userName,
    userEmail,
    userRole,

    // Actions
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    clearError,

    // Utility methods
    hasRole: (roleId) => user?.user_type_id === roleId,
    isAdmin: () => user?.user_type_id === 2,
    getStoredToken: () => authService.getStoredToken(),

    // Retry initialization
    retry: initializeAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export auth states for external use
export { AUTH_STATES };

export default AuthContext;