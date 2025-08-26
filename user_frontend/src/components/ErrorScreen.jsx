// user_frontend/src/components/ErrorScreen.jsx

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './ui/Button';

const ErrorScreen = ({ error, onRetry }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          Something went wrong
        </h1>
        
        <p className="text-gray-600 mb-4">
          {error || 'Unable to initialize the application. Please try again.'}
        </p>
        
        <div className="space-y-2">
          <Button
            onClick={onRetry}
            variant="primary"
            className="w-full flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="w-full"
          >
            Reload Page
          </Button>
        </div>
        
        <div className="mt-4 text-xs text-gray-500">
          If this problem persists, please contact support.
        </div>
      </div>
    </div>
  );
};

export default ErrorScreen;