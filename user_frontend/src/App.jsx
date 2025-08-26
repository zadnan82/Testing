import React, { useState } from 'react';
import { Code } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import DashboardPage from './pages/dashboard/DashboardPage';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [authView, setAuthView] = useState('login');

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Code className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading Sevdo...</p>
        </div>
      </div>
    );
  }

  // Authenticated user - show dashboard
  if (user) {
    return <DashboardPage />;
  }

  // Unauthenticated user - show auth pages
  switch (authView) {
    case 'register':
      return <RegisterPage onSwitchToLogin={() => setAuthView('login')} />;
    case 'forgot':
      return <ForgotPasswordPage onSwitchToLogin={() => setAuthView('login')} />;
    default:
      return (
        <LoginPage
          onSwitchToRegister={() => setAuthView('register')}
          onSwitchToForgot={() => setAuthView('forgot')}
        />
      );
  }
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;