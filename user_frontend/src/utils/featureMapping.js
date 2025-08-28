// =============================================================================
// 1. user_frontend/src/utils/featureMapping.js (NEW)
// =============================================================================

// Map user-friendly features to technical tokens (hidden from users)
export const FEATURE_TO_TOKENS = {
  // Authentication Features
  'user_registration': ['r'],
  'user_login': ['l'],
  'user_logout': ['o'],
  'user_profile': ['m'],
  'password_reset': ['r', 'l'], // Uses registration validation + login
  'profile_management': ['m', 'u'],
  'account_settings': ['m', 'u'],
  
  // Session Management
  'remember_me': ['t'],
  'multiple_devices': ['s', 't'],
  'session_security': ['a', 's'],
  'auto_logout': ['s', 'k'],
  
  // Content Management
  'contact_form': ['c'],
  'blog_system': ['b'],
  'news_section': ['b'],
  'testimonials': ['t'],
  'gallery': ['g'],
  
  // E-commerce
  'shopping_cart': ['e'],
  'product_catalog': ['e'],
  'payment_processing': ['e'],
  
  // Admin Features
  'admin_panel': ['a', 's'],
  'user_management': ['a', 'm', 'u'],
  'analytics_dashboard': ['a', 's'],
  
  // API Features
  'mobile_api': ['t'],
  'third_party_integration': ['t'],
  'webhooks': ['t'],
  
  // File Management
  'file_uploads': ['f'],
  'image_gallery': ['f', 'g'],
  'document_management': ['f']
};

// User-friendly feature definitions
export const USER_FEATURES = {
  // Authentication & User Management
  user_registration: {
    name: 'User Registration',
    description: 'Allow visitors to create accounts on your website',
    category: 'User Management',
    icon: '👤',
    popular: true,
    includes: ['Sign-up forms', 'Email verification', 'Password validation']
  },
  
  user_login: {
    name: 'User Login',
    description: 'Secure login system for registered users',
    category: 'User Management', 
    icon: '🔐',
    popular: true,
    includes: ['Login forms', 'Password security', 'Session management']
  },
  
  user_logout: {
    name: 'User Logout',
    description: 'Safe logout functionality with session cleanup',
    category: 'User Management',
    icon: '🚪',
    popular: true,
    includes: ['Logout button', 'Session termination', 'Security cleanup']
  },
  
  profile_management: {
    name: 'Profile Management',
    description: 'Let users view and update their profile information',
    category: 'User Management',
    icon: '⚙️',
    popular: true,
    includes: ['Profile pages', 'Edit forms', 'Avatar uploads']
  },
  
  password_reset: {
    name: 'Password Reset',
    description: 'Forgot password functionality via email',
    category: 'User Management',
    icon: '🔄',
    popular: true,
    includes: ['Reset forms', 'Email notifications', 'Secure tokens']
  },
  
  // Session & Security
  remember_me: {
    name: 'Remember Me',
    description: 'Keep users logged in across browser sessions',
    category: 'Security',
    icon: '💾',
    popular: false,
    includes: ['Persistent login', 'Auto-login', 'Token refresh']
  },
  
  multiple_devices: {
    name: 'Multiple Devices',
    description: 'Allow users to login from multiple devices',
    category: 'Security',
    icon: '📱',
    popular: false,
    includes: ['Device management', 'Active sessions', 'Remote logout']
  },
  
  session_security: {
    name: 'Session Security',
    description: 'Advanced security features for user sessions',
    category: 'Security',
    icon: '🛡️',
    popular: false,
    includes: ['Session monitoring', 'Suspicious activity detection', 'Auto-logout']
  },
  
  // Content Features
  contact_form: {
    name: 'Contact Form',
    description: 'Professional contact form for visitor inquiries',
    category: 'Content',
    icon: '📧',
    popular: true,
    includes: ['Contact forms', 'Email notifications', 'Form validation']
  },
  
  blog_system: {
    name: 'Blog System',
    description: 'Complete blogging platform with posts and comments',
    category: 'Content',
    icon: '📝',
    popular: true,
    includes: ['Blog posts', 'Categories', 'Comments', 'SEO optimization']
  },
  
  testimonials: {
    name: 'Testimonials',
    description: 'Showcase customer reviews and testimonials',
    category: 'Content',
    icon: '⭐',
    popular: true,
    includes: ['Review display', 'Star ratings', 'Customer photos']
  },
  
  gallery: {
    name: 'Image Gallery',
    description: 'Beautiful photo galleries and portfolios',
    category: 'Content',
    icon: '🖼️',
    popular: true,
    includes: ['Photo galleries', 'Lightbox viewer', 'Image optimization']
  },
  
  // E-commerce
  shopping_cart: {
    name: 'Shopping Cart',
    description: 'Complete e-commerce shopping cart system',
    category: 'E-commerce',
    icon: '🛒',
    popular: true,
    includes: ['Product catalog', 'Shopping cart', 'Checkout process']
  },
  
  payment_processing: {
    name: 'Payment Processing',
    description: 'Secure payment gateway integration',
    category: 'E-commerce',
    icon: '💳',
    popular: false,
    includes: ['Payment forms', 'Stripe integration', 'Order management']
  },
  
  // Admin Features
  admin_panel: {
    name: 'Admin Panel',
    description: 'Complete administrative dashboard',
    category: 'Administration',
    icon: '📊',
    popular: true,
    includes: ['Admin dashboard', 'User management', 'Content control']
  },
  
  analytics_dashboard: {
    name: 'Analytics Dashboard',
    description: 'Built-in analytics and reporting system',
    category: 'Administration',
    icon: '📈',
    popular: false,
    includes: ['Usage statistics', 'User analytics', 'Performance metrics']
  },
  
  // Advanced Features
  mobile_api: {
    name: 'Mobile API',
    description: 'REST API for mobile app integration',
    category: 'API',
    icon: '📱',
    popular: false,
    includes: ['REST endpoints', 'Mobile optimization', 'API documentation']
  },
  
  file_uploads: {
    name: 'File Uploads',
    description: 'Allow users to upload files and documents',
    category: 'Files',
    icon: '📁',
    popular: false,
    includes: ['File upload forms', 'Storage management', 'Download links']
  },
  
  third_party_integration: {
    name: 'Third-party Integration',
    description: 'Connect with external services and APIs',
    category: 'API',
    icon: '🔌',
    popular: false,
    includes: ['API connections', 'Webhooks', 'Data sync']
  }
};

// Get tokens for selected features (hidden from user)
export const getTokensFromFeatures = (selectedFeatures) => {
  const allTokens = selectedFeatures.reduce((tokens, featureId) => {
    const featureTokens = FEATURE_TO_TOKENS[featureId] || [];
    return [...tokens, ...featureTokens];
  }, []);
  
  // Remove duplicates
  return [...new Set(allTokens)];
};

// Get feature categories for UI organization
export const getFeaturesByCategory = () => {
  const categories = {};
  
  Object.entries(USER_FEATURES).forEach(([featureId, feature]) => {
    const category = feature.category;
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push({ id: featureId, ...feature });
  });
  
  return categories;
};

// Generate project description from selected features
export const generateProjectDescription = (selectedFeatures, projectType = 'website') => {
  if (selectedFeatures.length === 0) {
    return `A modern ${projectType} built with SEVDO.`;
  }
  
  const featureNames = selectedFeatures.map(id => USER_FEATURES[id]?.name).filter(Boolean);
  
  if (featureNames.length === 1) {
    return `A ${projectType} with ${featureNames[0].toLowerCase()}.`;
  } else if (featureNames.length === 2) {
    return `A ${projectType} with ${featureNames[0].toLowerCase()} and ${featureNames[1].toLowerCase()}.`;
  } else {
    const lastFeature = featureNames.pop();
    return `A ${projectType} with ${featureNames.join(', ').toLowerCase()}, and ${lastFeature.toLowerCase()}.`;
  }
};

export default {
  FEATURE_TO_TOKENS,
  USER_FEATURES,
  getTokensFromFeatures,
  getFeaturesByCategory,
  generateProjectDescription
};
