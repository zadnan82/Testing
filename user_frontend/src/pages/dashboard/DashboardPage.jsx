import React, { useState } from 'react';
import { Code, LogOut, Settings, Zap, Database } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
 

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const navigation = [
    { id: 'overview', name: 'Overview', icon: Zap },
    { id: 'products', name: 'Products', icon: Database },
    { id: 'settings', name: 'Settings', icon: Settings }
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span>Coming soon</span>
        </div>
      </header>
 
    </div>
  );
};

export default DashboardPage;