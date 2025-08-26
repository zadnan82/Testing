import React, { useState } from 'react';
import { Code, Zap, Database, Plus, Wand2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import CreateProjectPage from '../projects/CreateProjectPage';
import HybridBuilderPage from '../projects/HybridBuilderPage';

const OverviewTab = () => {
  const [activeView, setActiveView] = useState('dashboard');

  // Show Create Project Page
  if (activeView === 'create-project') {
    return <CreateProjectPage onBack={() => setActiveView('dashboard')} />;
  }

  // Show Hybrid Builder Page
  if (activeView === 'hybrid-builder') {
    return <HybridBuilderPage onBack={() => setActiveView('dashboard')} />;
  }

  // Main Dashboard View
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center sm:text-left">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Overview</h2>
        <p className="text-gray-600">Welcome to your Sevdo dashboard</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="!p-4 sm:!p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Code className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Active Projects</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">3</p>
            </div>
          </div>
        </Card>

        <Card className="!p-4 sm:!p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Tokens Generated</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">127</p>
            </div>
          </div>
        </Card>

        <Card className="!p-4 sm:!p-6 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Database className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">API Calls</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">1.2k</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="!p-4 sm:!p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* AI Website Builder - Featured */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Button 
              className="w-full h-20 sm:h-24 flex flex-col items-center justify-center space-y-2"
              onClick={() => setActiveView('hybrid-builder')}
            >
              <Wand2 className="h-5 w-5 sm:h-6 sm:w-6" />
              <div className="text-center">
                <div className="font-medium text-sm sm:text-base">AI Website Builder</div>
                <div className="text-xs opacity-90">Smart Builder with Chat</div>
              </div>
            </Button>
          </div>
          
          {/* Advanced Project */}
          <Button 
            variant="outline"
            className="h-20 sm:h-24 flex flex-col items-center justify-center space-y-2"
            onClick={() => setActiveView('create-project')}
          >
            <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
            <div className="text-center">
              <div className="font-medium text-sm sm:text-base">Advanced Project</div>
              <div className="text-xs opacity-70">Token-based Builder</div>
            </div>
          </Button>
          
          {/* Generate Tokens */}
          <Button 
            variant="outline" 
            className="h-20 sm:h-24 flex flex-col items-center justify-center space-y-2"
          >
            <Code className="h-5 w-5 sm:h-6 sm:w-6" />
            <div className="text-center">
              <div className="font-medium text-sm sm:text-base">Generate Tokens</div>
              <div className="text-xs opacity-70">Direct Code Gen</div>
            </div>
          </Button>
        </div>
      </Card>

      {/* Recent Activity */}
      <Card className="!p-4 sm:!p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-start sm:items-center justify-between py-2 border-b border-gray-100 gap-3">
            <div className="flex items-start sm:items-center flex-1 min-w-0">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3 mt-2 sm:mt-0 flex-shrink-0"></div>
              <span className="text-sm text-gray-700 break-words">Generated auth tokens for Project Alpha</span>
            </div>
            <span className="text-xs text-gray-500 flex-shrink-0">2 hours ago</span>
          </div>
          <div className="flex items-start sm:items-center justify-between py-2 border-b border-gray-100 gap-3">
            <div className="flex items-start sm:items-center flex-1 min-w-0">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2 sm:mt-0 flex-shrink-0"></div>
              <span className="text-sm text-gray-700 break-words">Created new product request</span>
            </div>
            <span className="text-xs text-gray-500 flex-shrink-0">5 hours ago</span>
          </div>
          <div className="flex items-start sm:items-center justify-between py-2 gap-3">
            <div className="flex items-start sm:items-center flex-1 min-w-0">
              <div className="w-2 h-2 bg-purple-500 rounded-full mr-3 mt-2 sm:mt-0 flex-shrink-0"></div>
              <span className="text-sm text-gray-700 break-words">Updated profile settings</span>
            </div>
            <span className="text-xs text-gray-500 flex-shrink-0">1 day ago</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default OverviewTab;