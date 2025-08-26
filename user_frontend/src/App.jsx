// user_frontend/src/App.jsx

import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

// Core components
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/ui/Toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoadingScreen from './components/LoadingScreen';
//import ErrorScreen from './components/ErrorScreen';

// Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import DashboardPage from './pages/dashboard/DashboardPage';

// Services
import { apiClient } from './services/api';

// Route constants
export const ROUTES = {
  LOGIN: 'login',
  REGISTER: 'register',
  FORGOT_PASSWORD: 'forgot',
  DASHBOARD: 'dashboard'
};

// Simple routing hook
const useSimpleRouter = () => {
  const [currentRoute, setCurrentRoute] = useState(() => {
    const hash = window.location.hash.slice(1);
    const searchParams = new URLSearchParams(window.location.search);
    const redirectAfterLogin = searchParams.get('redirect');
    
    if (redirectAfterLogin) {
      sessionStorage.setItem('redirectAfterLogin', redirectAfterLogin);
    }
    
    return hash || ROUTES.LOGIN;
  });

  const navigate = (route, replace = false) => {
    setCurrentRoute(route);
    
    if (replace) {
      window.history.replaceState(null, '', `#${route}`);
    } else {
      window.history.pushState(null, '', `#${route}`);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash.slice(1);
      setCurrentRoute(hash || ROUTES.LOGIN);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return { currentRoute, navigate };
};

// Offline detection component
const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-orange-500 text-white text-center py-2 z-50">
      <div className="flex items-center justify-center gap-2">
        <WifiOff className="h-4 w-4" />
        <span className="text-sm font-medium">
          You're currently offline. Some features may not work.
        </span>
      </div>
    </div>
  );
};

// Connection status component
const ConnectionStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    let interval;
    let mounted = true;

    const checkConnection = async () => {
      if (!mounted) return;
      
      try {
        setIsChecking(true);
        const connected = await apiClient.testConnection();
        if (mounted) {
          setIsConnected(connected);
        }
      } catch (error) {
        if (mounted) {
          setIsConnected(false);
        }
      } finally {
        if (mounted) {
          setIsChecking(false);
        }
      }
    };

    const initialTimer = setTimeout(() => {
      if (mounted) {
        checkConnection();
      }
    }, 3000);

    interval = setInterval(() => {
      if (mounted) {
        checkConnection();
      }
    }, 30000);

    return () => {
      mounted = false;
      if (interval) clearInterval(interval);
      if (initialTimer) clearTimeout(initialTimer);
    };
  }, []);

  if (isConnected && !isChecking) return null;

  return (
    <div className="fixed top-16 right-4 z-40">
      <div className={`
        rounded-lg px-3 py-2 text-sm font-medium shadow-lg
        ${isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
        ${isChecking ? 'animate-pulse' : ''}
      `}>
        <div className="flex items-center gap-2">
          {isChecking ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              <span>Checking...</span>
            </>
          ) : isConnected ? (
            <>
              <Wifi className="h-4 w-4" />
              <span>Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4" />
              <span>Server unavailable</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Router Component (inside AuthProvider)
const MainRouter = () => {
  const { isAuthenticated, isLoading, isError, error, retry } = useAuth();
  const { currentRoute, navigate } = useSimpleRouter();

  // Handle unknown routes
  useEffect(() => {
    const validRoutes = Object.values(ROUTES);
    if (!validRoutes.includes(currentRoute)) {
      const defaultRoute = isAuthenticated ? ROUTES.DASHBOARD : ROUTES.LOGIN;
      navigate(defaultRoute, true);
    }
  }, [currentRoute, isAuthenticated, navigate]);

  // Auto redirect based on auth status
  useEffect(() => {
    if (isLoading) return;

    const publicRoutes = [ROUTES.LOGIN, ROUTES.REGISTER, ROUTES.FORGOT_PASSWORD];
    const protectedRoutes = [ROUTES.DASHBOARD];

    if (!isAuthenticated && protectedRoutes.includes(currentRoute)) {
      console.log('🔒 Not authenticated, redirecting to login');
      navigate(ROUTES.LOGIN, true);
    } else if (isAuthenticated && publicRoutes.includes(currentRoute)) {
      console.log('✅ Already authenticated, redirecting to dashboard');
      
      const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
      if (redirectUrl) {
        sessionStorage.removeItem('redirectAfterLogin');
        navigate(redirectUrl, true);
      } else {
        navigate(ROUTES.DASHBOARD, true);
      }
    }
  }, [isAuthenticated, isLoading, currentRoute, navigate]);

  // Navigation handlers
  const handleSwitchToLogin = () => navigate(ROUTES.LOGIN);
  const handleSwitchToRegister = () => navigate(ROUTES.REGISTER);
  const handleSwitchToForgot = () => navigate(ROUTES.FORGOT_PASSWORD);
  
  const handleLoginSuccess = () => {
    const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
    if (redirectUrl) {
      sessionStorage.removeItem('redirectAfterLogin');
      navigate(redirectUrl, true);
    } else {
      navigate(ROUTES.DASHBOARD, true);
    }
  };

  const handleRegisterSuccess = () => navigate(ROUTES.LOGIN);
  const handleLogout = () => navigate(ROUTES.LOGIN, true);

  // Loading state
  if (isLoading) {
    return <LoadingScreen message="Initializing..." />;
  }

  // Error state
  if (isError) {
    return <ErrorScreen error={error} onRetry={retry} />;
  }

  // Render current route
  switch (currentRoute) {
    case ROUTES.LOGIN:
      return (
        <LoginPage
          onSwitchToRegister={handleSwitchToRegister}
          onSwitchToForgot={handleSwitchToForgot}
          onLoginSuccess={handleLoginSuccess}
        />
      );

    case ROUTES.REGISTER:
      return (
        <RegisterPage
          onSwitchToLogin={handleSwitchToLogin}
          onRegisterSuccess={handleRegisterSuccess}
        />
      );

    case ROUTES.FORGOT_PASSWORD:
      return (
        <ForgotPasswordPage
          onSwitchToLogin={handleSwitchToLogin}
        />
      );

    case ROUTES.DASHBOARD:
      return (
        <DashboardPage onLogout={handleLogout} />
      );

    default:
      return <LoadingScreen message="Redirecting..." />;
  }
};

// Root App component
const App = () => {
  // Global error handler for unhandled promise rejections
  useEffect(() => {
    const handleUnhandledRejection = (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      event.preventDefault();
    };

    const handleError = (event) => {
      console.error('Global error:', event.error);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  // Performance monitoring
  useEffect(() => {
    if (typeof window === 'undefined' || !('performance' in window)) return;

    const performanceTimer = setTimeout(() => {
      try {
        const navigation = performance.getEntriesByType('navigation')[0];
        
        if (navigation && navigation.domContentLoadedEventEnd && navigation.navigationStart) {
          const domContentLoaded = Math.round(navigation.domContentLoadedEventEnd - navigation.navigationStart);
          const pageLoadComplete = Math.round(navigation.loadEventEnd - navigation.navigationStart);

          if (domContentLoaded > 0 && pageLoadComplete > 0) {
            if (process.env.NODE_ENV === 'development') {
              console.group('⚡ Performance Metrics');
              console.log('DOM Content Loaded:', domContentLoaded, 'ms');
              console.log('Page Load Complete:', pageLoadComplete, 'ms');
              console.groupEnd();
            }
          }
        }
      } catch (error) {
        console.warn('Performance metrics collection failed:', error);
      }
    }, 1000);

    return () => clearTimeout(performanceTimer);
  }, []);

  return (
    <ErrorBoundary errorMetadata={{ component: 'App', version: '2.0.0' }}>
      <ToastProvider maxToasts={5}>
        <AuthProvider>
          <div className="App">
            <OfflineIndicator />
            <MainRouter />
            <ConnectionStatus />
          </div>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;