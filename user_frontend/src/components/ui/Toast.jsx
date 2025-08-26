// user_frontend/src/components/ui/Toast.jsx

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

// Toast Types
const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// Toast Context
const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

// Toast Provider
export const ToastProvider = ({ children, maxToasts = 5 }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      type: TOAST_TYPES.INFO,
      duration: 5000,
      dismissible: true,
      ...toast,
    };

    setToasts(prev => {
      // Limit number of toasts
      const updated = [...prev, newToast];
      return updated.slice(-maxToasts);
    });

    // Auto-dismiss if duration is set
    if (newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  }, [maxToasts]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const removeAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const toast = {
    success: (message, options = {}) => addToast({
      type: TOAST_TYPES.SUCCESS,
      message,
      ...options
    }),
    
    error: (message, options = {}) => addToast({
      type: TOAST_TYPES.ERROR,
      message,
      duration: 7000, // Longer duration for errors
      ...options
    }),
    
    warning: (message, options = {}) => addToast({
      type: TOAST_TYPES.WARNING,
      message,
      duration: 6000,
      ...options
    }),
    
    info: (message, options = {}) => addToast({
      type: TOAST_TYPES.INFO,
      message,
      ...options
    }),
    
    // Custom toast
    custom: addToast,
    
    // Remove specific toast
    dismiss: removeToast,
    
    // Remove all toasts
    clear: removeAllToasts
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

// Toast Container Component
const ToastContainer = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

// Individual Toast Component
const Toast = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleRemove = useCallback(() => {
    setIsRemoving(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 300); // Match exit animation duration
  }, [toast.id, onRemove]);

  const getToastIcon = (type) => {
    switch (type) {
      case TOAST_TYPES.SUCCESS:
        return <CheckCircle className="h-5 w-5" />;
      case TOAST_TYPES.ERROR:
        return <XCircle className="h-5 w-5" />;
      case TOAST_TYPES.WARNING:
        return <AlertCircle className="h-5 w-5" />;
      case TOAST_TYPES.INFO:
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getToastStyles = (type) => {
    const baseStyles = "rounded-lg shadow-lg border-l-4 p-4 transition-all duration-300 ease-in-out transform";
    
    switch (type) {
      case TOAST_TYPES.SUCCESS:
        return `${baseStyles} bg-green-50 border-green-500 text-green-800`;
      case TOAST_TYPES.ERROR:
        return `${baseStyles} bg-red-50 border-red-500 text-red-800`;
      case TOAST_TYPES.WARNING:
        return `${baseStyles} bg-yellow-50 border-yellow-500 text-yellow-800`;
      case TOAST_TYPES.INFO:
      default:
        return `${baseStyles} bg-blue-50 border-blue-500 text-blue-800`;
    }
  };

  const getIconColor = (type) => {
    switch (type) {
      case TOAST_TYPES.SUCCESS:
        return "text-green-500";
      case TOAST_TYPES.ERROR:
        return "text-red-500";
      case TOAST_TYPES.WARNING:
        return "text-yellow-500";
      case TOAST_TYPES.INFO:
      default:
        return "text-blue-500";
    }
  };

  const animationClasses = isRemoving
    ? 'translate-x-full opacity-0 scale-95'
    : isVisible
    ? 'translate-x-0 opacity-100 scale-100'
    : 'translate-x-full opacity-0 scale-95';

  return (
    <div className={`${getToastStyles(toast.type)} ${animationClasses}`}>
      <div className="flex items-start">
        <div className={`flex-shrink-0 ${getIconColor(toast.type)}`}>
          {getToastIcon(toast.type)}
        </div>
        
        <div className="ml-3 flex-1">
          {toast.title && (
            <h4 className="text-sm font-semibold mb-1">{toast.title}</h4>
          )}
          <p className="text-sm">{toast.message}</p>
          
          {toast.actions && (
            <div className="mt-2 flex space-x-2">
              {toast.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className="text-xs font-medium underline hover:no-underline focus:outline-none"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {toast.dismissible && (
          <div className="ml-4">
            <button
              onClick={handleRemove}
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
      
      {/* Progress bar for auto-dismiss */}
      {toast.duration > 0 && (
        <div className="mt-2 h-1 bg-black bg-opacity-10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-current transition-all ease-linear"
            style={{
              animation: `shrink ${toast.duration}ms linear forwards`
            }}
          />
        </div>
      )}
    </div>
  );
};

// Error Toast Hook - specifically for handling API errors
export const useErrorToast = () => {
  const toast = useToast();

  return useCallback((error, fallbackMessage = 'An unexpected error occurred') => {
    let message = fallbackMessage;
    let title = 'Error';

    // Handle different error types
    if (error?.response?.data?.error?.message) {
      // API error with structured response
      message = error.response.data.error.message;
      title = error.response.data.error.code || 'API Error';
    } else if (error?.response?.data?.detail) {
      // FastAPI validation error
      if (typeof error.response.data.detail === 'string') {
        message = error.response.data.detail;
      } else if (error.response.data.detail?.message) {
        message = error.response.data.detail.message;
      }
    } else if (error?.message) {
      // Standard error object
      message = error.message;
    } else if (typeof error === 'string') {
      // String error
      message = error;
    }

    toast.error(message, {
      title,
      duration: 7000,
      actions: process.env.NODE_ENV === 'development' ? [
        {
          label: 'View Details',
          onClick: () => console.error('Error details:', error)
        }
      ] : undefined
    });
  }, [toast]);
};

// Loading Toast Hook - for async operations
export const useLoadingToast = () => {
  const toast = useToast();

  return useCallback((promise, messages = {}) => {
    const {
      loading = 'Loading...',
      success = 'Operation completed successfully',
      error = 'Operation failed'
    } = messages;

    // Show loading toast
    const loadingToastId = toast.info(loading, {
      duration: 0, // Don't auto-dismiss
      dismissible: false
    });

    return promise
      .then((result) => {
        toast.dismiss(loadingToastId);
        toast.success(success);
        return result;
      })
      .catch((err) => {
        toast.dismiss(loadingToastId);
        
        // Use error toast hook for consistent error handling
        const errorMessage = err?.response?.data?.error?.message || 
                           err?.response?.data?.detail || 
                           err?.message || 
                           error;
        
        toast.error(errorMessage);
        throw err;
      });
  }, [toast]);
};

// CSS Animation (add to your global CSS or index.css)
const toastAnimationCSS = `
@keyframes shrink {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}
`;

// Inject CSS if needed
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = toastAnimationCSS;
  document.head.appendChild(styleElement);
}

export { TOAST_TYPES };
export default Toast;