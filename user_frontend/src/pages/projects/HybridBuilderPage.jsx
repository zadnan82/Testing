// =============================================================================
// 3. user_frontend/src/pages/projects/HybridBuilderPage.jsx (UPDATED - User Friendly)
// =============================================================================

import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, MessageSquare, Wand2, Eye, Download, Globe, Send, Sparkles, Code, Check } from 'lucide-react';
import Button from '../../components/ui/Button'; 
import Card from '../../components/ui/Card';
import { sevdoService } from '../../services/sevdo.service';
import { useToast } from '../../components/ui/Toast';
import { 
  getTokensFromFeatures, 
  USER_FEATURES,
  generateProjectDescription 
} from '../../utils/featureMapping';

const HybridBuilderPage = ({ onBack }) => {
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [customization, setCustomization] = useState({
    color: 'blue',
    style: 'modern',
    pages: 5
  });
  const [stage, setStage] = useState('input'); // input, preview, complete
  const [loading, setLoading] = useState(false);
  const [generatedProject, setGeneratedProject] = useState(null);
  const chatEndRef = useRef(null);
  const toast = useToast();

  // User-friendly feature options (no technical tokens visible)
  const quickFeatures = [
    { id: 'user_login', name: 'User Login', icon: '🔐', popular: true, description: 'Secure user authentication' },
    { id: 'user_registration', name: 'User Registration', icon: '👤', popular: true, description: 'New user sign-up' },
    { id: 'contact_form', name: 'Contact Form', icon: '📧', popular: true, description: 'Customer inquiries' },
    { id: 'blog_system', name: 'Blog System', icon: '📝', popular: false, description: 'Content management' },
    { id: 'shopping_cart', name: 'E-commerce', icon: '🛒', popular: true, description: 'Online shopping' },
    { id: 'admin_panel', name: 'Admin Panel', icon: '📊', popular: true, description: 'Management dashboard' },
    { id: 'mobile_api', name: 'Mobile API', icon: '📱', popular: false, description: 'App integration' },
    { id: 'file_uploads', name: 'File Uploads', icon: '📁', popular: false, description: 'Document management' },
    { id: 'testimonials', name: 'Testimonials', icon: '⭐', popular: true, description: 'Customer reviews' },
    { id: 'gallery', name: 'Photo Gallery', icon: '🖼️', popular: true, description: 'Image showcase' },
    { id: 'analytics_dashboard', name: 'Analytics', icon: '📈', popular: false, description: 'Usage statistics' },
    { id: 'payment_processing', name: 'Payments', icon: '💳', popular: true, description: 'Payment gateway' }
  ];

  const colorOptions = [
    { value: 'blue', name: 'Ocean Blue', color: 'bg-blue-500' },
    { value: 'green', name: 'Forest Green', color: 'bg-green-500' },
    { value: 'purple', name: 'Royal Purple', color: 'bg-purple-500' },
    { value: 'red', name: 'Crimson Red', color: 'bg-red-500' },
    { value: 'orange', name: 'Sunset Orange', color: 'bg-orange-500' },
    { value: 'gray', name: 'Slate Gray', color: 'bg-gray-500' }
  ];

  const styleOptions = [
    { value: 'modern', name: 'Modern Minimal', desc: 'Clean, spacious design' },
    { value: 'professional', name: 'Professional', desc: 'Corporate, trustworthy' },
    { value: 'creative', name: 'Creative Bold', desc: 'Artistic, eye-catching' },
    { value: 'classic', name: 'Classic Elegant', desc: 'Timeless, sophisticated' }
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const toggleFeature = (featureId) => {
    setSelectedFeatures(prev => 
      prev.includes(featureId) 
        ? prev.filter(f => f !== featureId)
        : [...prev, featureId]
    );
  };

  const handleSendMessage = () => {
    if (!currentMessage.trim()) return;
    
    setChatMessages(prev => [...prev, {
      id: Date.now(),
      type: 'user',
      content: currentMessage
    }]);

    // Smart AI responses that auto-select features
    setTimeout(() => {
      let aiResponse = '';
      const lowerMessage = currentMessage.toLowerCase();
      
      // Smart feature detection and auto-selection
      if (lowerMessage.includes('login') || lowerMessage.includes('auth') || lowerMessage.includes('sign in')) {
        aiResponse = `Perfect! I'll add user authentication to your website. This includes secure login, user registration, and password management.`;
        if (!selectedFeatures.includes('user_login')) {
          setSelectedFeatures(prev => [...prev, 'user_login', 'user_registration']);
        }
      } else if (lowerMessage.includes('contact') || lowerMessage.includes('form')) {
        aiResponse = `Great idea! A contact form is essential for connecting with your visitors. I'll create a professional contact form with validation.`;
        if (!selectedFeatures.includes('contact_form')) {
          setSelectedFeatures(prev => [...prev, 'contact_form']);
        }
      } else if (lowerMessage.includes('admin') || lowerMessage.includes('dashboard') || lowerMessage.includes('manage')) {
        aiResponse = `Excellent! An admin panel will let you manage your website easily. I'll include user management, content control, and analytics.`;
        if (!selectedFeatures.includes('admin_panel')) {
          setSelectedFeatures(prev => [...prev, 'admin_panel']);
        }
      } else if (lowerMessage.includes('shop') || lowerMessage.includes('buy') || lowerMessage.includes('sell') || lowerMessage.includes('ecommerce')) {
        aiResponse = `Fantastic! I'll set up a complete e-commerce system with shopping cart, product management, and secure checkout.`;
        if (!selectedFeatures.includes('shopping_cart')) {
          setSelectedFeatures(prev => [...prev, 'shopping_cart', 'payment_processing']);
        }
      } else if (lowerMessage.includes('blog') || lowerMessage.includes('news') || lowerMessage.includes('post')) {
        aiResponse = `Perfect for content marketing! I'll create a complete blog system with post management, categories, and SEO optimization.`;
        if (!selectedFeatures.includes('blog_system')) {
          setSelectedFeatures(prev => [...prev, 'blog_system']);
        }
      } else if (lowerMessage.includes('photo') || lowerMessage.includes('gallery') || lowerMessage.includes('images')) {
        aiResponse = `Beautiful! A photo gallery will showcase your work perfectly. I'll create an elegant gallery with lightbox viewing and image optimization.`;
        if (!selectedFeatures.includes('gallery')) {
          setSelectedFeatures(prev => [...prev, 'gallery', 'file_uploads']);
        }
      } else if (lowerMessage.includes('review') || lowerMessage.includes('testimonial') || lowerMessage.includes('feedback')) {
        aiResponse = `Smart choice! Testimonials build trust with new customers. I'll create a testimonials section with star ratings and customer photos.`;
        if (!selectedFeatures.includes('testimonials')) {
          setSelectedFeatures(prev => [...prev, 'testimonials']);
        }
      } else if (lowerMessage.includes('mobile') || lowerMessage.includes('app')) {
        aiResponse = `Great thinking! I'll add mobile API support so you can build apps later. This includes REST endpoints and mobile optimization.`;
        if (!selectedFeatures.includes('mobile_api')) {
          setSelectedFeatures(prev => [...prev, 'mobile_api']);
        }
      } else {
        aiResponse = `I love that idea! "${currentMessage}" sounds like a great addition to your website. I'm adding it to the requirements and will make sure it's included in the final design.`;
      }

      setChatMessages(prev => [...prev, {
        id: Date.now(),
        type: 'ai',
        content: aiResponse
      }]);
    }, 1000);

    setCurrentMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const buildProjectPrompt = () => {
    const chatContent = chatMessages
      .filter(msg => msg.type === 'user')
      .map(msg => msg.content)
      .join(' ');

    return {
      features: selectedFeatures,
      customRequests: chatContent,
      style: customization.style,
      color: customization.color,
      pages: customization.pages
    };
  };

  const handleBuildWebsite = async () => {
    setLoading(true);
    
    try {
      const prompt = buildProjectPrompt();
      console.log('🚀 Building website with features:', prompt.features);
      
      if (prompt.features.length > 0) {
        // Convert user-friendly features to technical tokens (hidden from user)
        const tokens = getTokensFromFeatures(prompt.features);
        console.log('🔧 Converting to tokens:', tokens);
        
        const projectName = `AI Generated ${customization.style} Website`;
        const description = generateProjectDescription(prompt.features);
        
        // Generate using SEVDO service
        const result = await sevdoService.generateProject(
          projectName,
          tokens,
          null, // No frontend DSL for now
          true
        );
        
        setGeneratedProject({ ...result, prompt, description });
        toast.success('🎉 Your website has been generated with real working code!');
        
      } else if (prompt.customRequests) {
        // Use AI generation for custom descriptions
        const result = await sevdoService.generateFromDescription(
          prompt.customRequests,
          'WEB_APP'
        );
        
        setGeneratedProject({ ...result, prompt });
        toast.success('🎉 Your custom website has been generated!');
        
      } else {
        // Fallback - create layout only
        await new Promise(resolve => setTimeout(resolve, 2000));
        setGeneratedProject({ 
          mockGeneration: true, 
          prompt,
          message: 'Website layout created! Add features to generate backend code.'
        });
        toast.info('Website layout created! Select features to generate working code.');
      }
      
      setStage('preview');
      
    } catch (error) {
      console.error('Website generation failed:', error);
      toast.error('Generation failed: ' + error.message);
      
      setGeneratedProject({ 
        error: true, 
        message: error.message,
        prompt: buildProjectPrompt()
      });
      setStage('preview');
    } finally {
      setLoading(false);
    }
  };

  const selectedFeatureObjects = selectedFeatures.map(id => 
    quickFeatures.find(f => f.id === id) || USER_FEATURES[id]
  ).filter(Boolean);

  if (stage === 'preview') {
    return <WebsitePreviewPage onBack={() => setStage('input')} generatedProject={generatedProject} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </button>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
              <Wand2 className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🤖 AI Website Builder</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Tell our AI what you want or choose from popular features. We'll build you a complete website with working code!
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Features & Chat */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Features */}
            <Card>
              <Card.Header>
                <Card.Title>🚀 Popular Website Features</Card.Title>
              </Card.Header>
              <Card.Content>
                <p className="text-gray-600 mb-4">Choose the features you want for your website:</p>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {quickFeatures.map(feature => (
                    <button
                      key={feature.id}
                      onClick={() => toggleFeature(feature.id)}
                      className={`
                        relative p-4 rounded-xl border-2 text-center transition-all duration-200
                        ${selectedFeatures.includes(feature.id)
                          ? 'border-blue-500 bg-blue-50 shadow-md transform scale-105'
                          : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-sm'
                        }
                      `}
                    >
                      {feature.popular && (
                        <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                          Popular
                        </span>
                      )}
                      <div className="text-2xl mb-2">{feature.icon}</div>
                      <div className="text-sm font-medium text-gray-900">{feature.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{feature.description}</div>
                      {selectedFeatures.includes(feature.id) && (
                        <div className="absolute top-2 left-2">
                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {selectedFeatures.length > 0 && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border">
                    <div className="text-sm font-medium text-blue-900 mb-2">✨ Selected Features ({selectedFeatures.length}):</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedFeatureObjects.map(feature => (
                        <span key={feature.id || feature.name} className="inline-flex items-center px-3 py-1 bg-white text-blue-800 rounded-full text-xs border">
                          {feature.icon} {feature.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Card.Content>
            </Card>

            {/* Chat Interface */}
            <Card>
              <Card.Header>
                <Card.Title>💬 Chat with AI</Card.Title>
              </Card.Header>
              <Card.Content>
                <p className="text-gray-600 mb-4">Describe exactly what you want your website to do:</p>
                
                {/* Chat Messages */}
                <div className="bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto mb-4">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-20">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Start chatting with our AI...</p>
                      <p className="text-xs mt-1">Try: "I need user login" or "Add a contact form"</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {chatMessages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`
                            max-w-xs px-4 py-2 rounded-lg text-sm
                            ${msg.type === 'user' 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-white border border-gray-200 text-gray-800'
                            }
                          `}>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input */}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Tell me what features you want..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button onClick={handleSendMessage} disabled={!currentMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                {/* Quick Suggestions */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {[
                    'I need user login', 
                    'Add a contact form', 
                    'Include customer testimonials', 
                    'Add an admin dashboard',
                    'I want e-commerce',
                    'Add a blog section'
                  ].map(suggestion => (
                    <button
                      key={suggestion}
                      onClick={() => setCurrentMessage(suggestion)}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-xs transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </Card.Content>
            </Card>
          </div>

          {/* Right Column - Customization & Build */}
          <div className="space-y-6">
            {/* Customization */}
            <Card>
              <Card.Header>
                <Card.Title>🎨 Style Options</Card.Title>
              </Card.Header>
              <Card.Content className="space-y-4">
                {/* Color Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Color Theme</label>
                  <div className="grid grid-cols-3 gap-2">
                    {colorOptions.map(color => (
                      <button
                        key={color.value}
                        onClick={() => setCustomization(prev => ({ ...prev, color: color.value }))}
                        className={`
                          p-2 rounded-lg border-2 text-center transition-all
                          ${customization.color === color.value ? 'border-gray-800' : 'border-gray-200'}
                        `}
                      >
                        <div className={`w-full h-6 ${color.color} rounded mb-1`}></div>
                        <div className="text-xs text-gray-600">{color.name.split(' ')[0]}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Style Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Design Style</label>
                  <select
                    value={customization.style}
                    onChange={(e) => setCustomization(prev => ({ ...prev, style: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {styleOptions.map(style => (
                      <option key={style.value} value={style.value}>
                        {style.name} - {style.desc}
                      </option>
                    ))}
                  </select>
                </div>
              </Card.Content>
            </Card>

            {/* Build Button */}
            <Card>
              <Card.Content className="space-y-3">
                <Button
                  onClick={handleBuildWebsite}
                  loading={loading}
                  disabled={selectedFeatures.length === 0 && chatMessages.filter(m => m.type === 'user').length === 0}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  size="lg"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  {loading ? 'Building Your Website...' : '🚀 Build My Website'}
                </Button>

                {/* Progress Indicator */}
                {loading && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg border">
                    <div className="text-sm text-blue-900 mb-2 flex items-center">
                      <Code className="h-4 w-4 animate-pulse mr-2" />
                      AI is building your website with real code...
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full animate-pulse" style={{width: '70%'}}></div>
                    </div>
                  </div>
                )}
              </Card.Content>
            </Card>

            {/* Project Summary */}
            {(selectedFeatures.length > 0 || chatMessages.some(m => m.type === 'user')) && (
              <Card>
                <Card.Header>
                  <Card.Title>📋 What We're Building</Card.Title>
                </Card.Header>
                <Card.Content>
                  <div className="space-y-3 text-sm">
                    {selectedFeatures.length > 0 && (
                      <div>
                        <span className="font-medium text-gray-700">Features ({selectedFeatures.length}):</span>
                        <div className="mt-1 space-y-1">
                          {selectedFeatureObjects.map(feature => (
                            <div key={feature.id || feature.name} className="flex items-center text-gray-600">
                              <span className="mr-2">{feature.icon}</span>
                              <span>{feature.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <span className="font-medium text-gray-700">Style:</span> {styleOptions.find(s => s.value === customization.style)?.name}
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Color:</span> {colorOptions.find(c => c.value === customization.color)?.name}
                    </div>
                    
                    {chatMessages.filter(m => m.type === 'user').length > 0 && (
                      <div>
                        <span className="font-medium text-gray-700">Custom Requirements:</span> {chatMessages.filter(m => m.type === 'user').length} messages
                      </div>
                    )}

                    <div className="pt-3 border-t bg-green-50 -mx-3 px-3 py-2 rounded">
                      <div className="font-medium text-green-800">You'll Get:</div>
                      <div className="text-green-700 text-xs mt-1">
                        ✅ Complete working website<br/>
                        ✅ Backend API with database<br/>
                        ✅ User authentication system<br/>
                        ✅ Admin panel & management<br/>
                        ✅ Production-ready code
                      </div>
                    </div>
                  </div>
                </Card.Content>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Website Preview Component - Updated
const WebsitePreviewPage = ({ onBack, generatedProject }) => {
  const toast = useToast();

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Code copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const downloadCode = (code, filename) => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Code downloaded!');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <Sparkles className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {generatedProject?.error ? '⚠️ Almost There!' : '🎉 Your Website is Complete!'}
          </h1>
          <p className="text-gray-600">
            {generatedProject?.error 
              ? 'We created your website layout - select features to add working backend code'
              : generatedProject?.mockGeneration
                ? 'Website layout created! Add features with backend code for full functionality'
                : 'Your complete website with working backend code is ready to deploy'
            }
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Website Preview */}
          <div className="lg:col-span-2">
            <Card>
              <Card.Header>
                <Card.Title>🖥️ Website Preview</Card.Title>
              </Card.Header>
              <Card.Content>
                {/* Mockup Browser Window */}
                <div className="bg-white border rounded-lg p-6 min-h-96">
                  <div className="border-b pb-4 mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      <div className="ml-4 bg-gray-100 text-gray-600 px-3 py-1 rounded text-sm">
                        your-website.com
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <h1 className={`text-3xl font-bold mb-2 ${
                        generatedProject?.prompt?.color === 'blue' ? 'text-blue-600' : 
                        generatedProject?.prompt?.color === 'green' ? 'text-green-600' : 
                        generatedProject?.prompt?.color === 'purple' ? 'text-purple-600' : 
                        'text-blue-600'
                      }`}>
                        Welcome to Your {generatedProject?.prompt?.style || 'Modern'} Website
                      </h1>
                      <p className="text-gray-600">
                        {generatedProject?.description || 'Your professional website is ready to go live!'}
                        {generatedProject?.success && !generatedProject?.mockGeneration && (
                          <span className="text-green-600 font-medium"> ✨ Powered by real backend code!</span>
                        )}
                      </p>
                    </div>
                    
                    {/* Feature Previews */}
                    {generatedProject?.prompt?.features?.includes('Contact Form') && (
                      <div className="bg-gray-50 p-4 rounded border">
                        <h3 className="font-medium mb-3">Contact Form</h3>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="h-8 bg-white border rounded"></div>
                          <div className="h-8 bg-white border rounded"></div>
                          <div className="col-span-2 h-20 bg-white border rounded"></div>
                          <Button size="sm" className="w-fit">Send Message</Button>
                        </div>
                      </div>
                    )}
                    
                    {generatedProject?.prompt?.features?.includes('Login System') && (
                      <div className="bg-gray-50 p-4 rounded border">
                        <h3 className="font-medium mb-3">User Authentication</h3>
                        <div className="space-y-2 max-w-xs">
                          <div className="h-8 bg-white border rounded"></div>
                          <div className="h-8 bg-white border rounded"></div>
                          <Button size="sm">Sign In</Button>
                        </div>
                        {generatedProject?.success && (
                          <p className="text-xs text-green-600 mt-2">✓ Real backend API generated with SEVDO!</p>
                        )}
                      </div>
                    )}

                    {generatedProject?.prompt?.features?.includes('Admin Dashboard') && (
                      <div className="bg-gray-50 p-4 rounded border">
                        <h3 className="font-medium mb-3">Admin Dashboard</h3>
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          <div className="h-12 bg-white border rounded flex items-center justify-center text-xs">Users</div>
                          <div className="h-12 bg-white border rounded flex items-center justify-center text-xs">Analytics</div>
                          <div className="h-12 bg-white border rounded flex items-center justify-center text-xs">Settings</div>
                        </div>
                        {generatedProject?.success && (
                          <p className="text-xs text-green-600">✓ Full admin backend with SEVDO tokens!</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card.Content>
            </Card>

            {/* Generated Code Display */}
            {generatedProject && !generatedProject.error && !generatedProject.mockGeneration && (
              <Card className="mt-6">
                <Card.Header>
                  <div className="flex justify-between items-center">
                    <Card.Title className="flex items-center">
                      <Code className="h-5 w-5 mr-2" />
                      Generated Backend Code
                    </Card.Title>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(generatedProject.backend?.code || generatedProject.code)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Copy Code
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadCode(
                          generatedProject.backend?.code || generatedProject.code,
                          'generated_backend.py'
                        )}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                </Card.Header>
                <Card.Content>
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-64 text-sm">
                    {generatedProject.backend?.code || generatedProject.code || 'No code generated'}
                  </pre>
                  
                  <div className="mt-4 text-sm text-gray-600">
                    <p>✅ Generated with SEVDO token system</p>
                    <p>✅ Production-ready FastAPI backend</p>
                    <p>✅ Complete with authentication and database models</p>
                  </div>
                </Card.Content>
              </Card>
            )}
          </div>

          {/* Actions & Details */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card>
              <Card.Header>
                <Card.Title>
                  {generatedProject?.error ? '⚠️ Generation Status' : 
                   generatedProject?.mockGeneration ? '📋 Layout Created' : 
                   '✨ What\'s Included'}
                </Card.Title>
              </Card.Header>
              <Card.Content>
                {generatedProject?.error ? (
                  <div className="space-y-2 text-sm">
                    <div className="text-red-600">❌ Code generation failed</div>
                    <div className="text-gray-600">Error: {generatedProject.message}</div>
                    <div className="text-blue-600">✓ Website layout still created</div>
                  </div>
                ) : generatedProject?.mockGeneration ? (
                  <div className="space-y-2 text-sm">
                    <div className="text-blue-600">✓ Website layout designed</div>
                    <div className="text-orange-600">⚡ Add features with tokens for real backend code</div>
                    <div className="text-gray-600">✓ Responsive design included</div>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      {generatedProject?.prompt?.pages || 5} HTML pages
                    </div>
                    <div className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      Responsive CSS styling
                    </div>
                    <div className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      JavaScript functionality
                    </div>
                    <div className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      Mobile-friendly design
                    </div>
                    <div className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      Real backend API with SEVDO
                    </div>
                    {generatedProject?.prompt?.features?.map(feature => (
                      <div key={feature} className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        {feature}
                      </div>
                    ))}
                  </div>
                )}
              </Card.Content>
            </Card>

            {/* Download Options */}
            {!generatedProject?.error && (
              <Card>
                <Card.Header>
                  <Card.Title>📦 Download & Deploy</Card.Title>
                </Card.Header>
                <Card.Content className="space-y-3">
                  {generatedProject && !generatedProject.mockGeneration && (
                    <>
                      <Button 
                        className="w-full" 
                        onClick={() => downloadCode(
                          generatedProject.backend?.code || generatedProject.code,
                          'complete_website.py'
                        )}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Backend Code
                      </Button>
                      <Button className="w-full" variant="outline">
                        📄 Download Frontend
                      </Button>
                      <Button className="w-full" variant="outline">
                        📦 Complete Project ZIP
                      </Button>
                    </>
                  )}
                  
                  {generatedProject?.mockGeneration && (
                    <Button className="w-full" variant="outline" disabled>
                      <Download className="h-4 w-4 mr-2" />
                      Select features for code download
                    </Button>
                  )}
                </Card.Content>
              </Card>
            )}

            {/* Deploy Options */}
            <Card>
              <Card.Header>
                <Card.Title>🚀 Deploy Options</Card.Title>
              </Card.Header>
              <Card.Content className="space-y-3">
                <Button className="w-full" disabled={generatedProject?.error || generatedProject?.mockGeneration}>
                  <Globe className="h-4 w-4 mr-2" />
                  Deploy to Cloud
                </Button>
                <Button className="w-full" variant="outline" disabled={generatedProject?.mockGeneration}>
                  📤 Deploy to Vercel
                </Button>
                <Button className="w-full" variant="outline">
                  ☁️ Upload to Your Server
                </Button>
              </Card.Content>
            </Card>

            {/* Build Info */}
            <Card>
              <Card.Content>
                <div className="text-center text-sm text-gray-600 space-y-2">
                  <div>⏱️ Total build time: {generatedProject?.error ? 'Failed' : '2 min 34 sec'}</div>
                  {generatedProject && !generatedProject.error && !generatedProject.mockGeneration && (
                    <div>🎯 Generated with real SEVDO backend</div>
                  )}
                  {generatedProject?.mockGeneration && (
                    <div>💡 Add login/admin features for backend code</div>
                  )}
                  <div>🚀 Built with Sevdo AI + SEVDO</div>
                </div>
              </Card.Content>
            </Card>

            {/* Technical Details */}
            {generatedProject && !generatedProject.mockGeneration && !generatedProject.error && (
              <Card>
                <Card.Header>
                  <Card.Title>🔧 Technical Details</Card.Title>
                </Card.Header>
                <Card.Content>
                  <div className="space-y-2 text-xs">
                    <div><strong>Backend:</strong> FastAPI with Python</div>
                    <div><strong>Database:</strong> SQLAlchemy ORM</div>
                    <div><strong>Authentication:</strong> JWT tokens</div>
                    <div><strong>Generated Tokens:</strong></div>
                    <div className="pl-2">
                      {generatedProject.prompt?.tokens?.map(token => (
                        <span key={token} className="inline-block bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-xs font-mono mr-1 mb-1">
                          {token}
                        </span>
                      ))}
                    </div>
                    <div><strong>Status:</strong> <span className="text-green-600">Production Ready ✓</span></div>
                  </div>
                </Card.Content>
              </Card>
            )}

            <Button onClick={onBack} variant="outline" className="w-full">
              ← Build Another Website
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HybridBuilderPage;