import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, MessageSquare, Wand2, Eye, Download, Globe, Palette, Layers, Send, Sparkles } from 'lucide-react';
import Button from '../../components/ui/Button'; 
import Card from '../../components/ui/Card'; 

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
  const chatEndRef = useRef(null);

  const quickFeatures = [
    { id: 'auth', name: 'Login System', tokens: ['r', 'l', 'm', 'o'], icon: '🔐', popular: true },
    { id: 'contact', name: 'Contact Form', tokens: ['c'], icon: '📧', popular: true },
    { id: 'blog', name: 'Blog/News', tokens: ['b'], icon: '📝', popular: false },
    { id: 'ecommerce', name: 'E-commerce', tokens: ['e'], icon: '🛒', popular: true },
    { id: 'profiles', name: 'User Profiles', tokens: ['u', 'm'], icon: '👤', popular: false },
    { id: 'dashboard', name: 'Admin Dashboard', tokens: ['a', 's'], icon: '📊', popular: true },
    { id: 'api', name: 'REST API', tokens: ['t'], icon: '🔌', popular: false },
    { id: 'files', name: 'File Upload', tokens: ['f'], icon: '📁', popular: false }
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

    // Simulate AI response
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        id: Date.now(),
        type: 'ai',
        content: `Great idea! I'll add "${currentMessage}" to your website requirements. This will integrate perfectly with your selected features.`
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

  const buildCombinedPrompt = () => {
    const featureNames = selectedFeatures.map(id => 
      quickFeatures.find(f => f.id === id)?.name
    ).filter(Boolean);
    
    const chatContent = chatMessages
      .filter(msg => msg.type === 'user')
      .map(msg => msg.content)
      .join(' ');

    return {
      features: featureNames,
      customRequests: chatContent,
      style: customization.style,
      color: customization.color,
      pages: customization.pages
    };
  };

  const handleBuildWebsite = async () => {
    setLoading(true);
    
    const prompt = buildCombinedPrompt();
    console.log('🚀 Building website with prompt:', prompt);
    
    // Simulate AI building process
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setStage('preview');
    setLoading(false);
  };

  const selectedFeatureObjects = selectedFeatures.map(id => 
    quickFeatures.find(f => f.id === id)
  ).filter(Boolean);

  if (stage === 'preview') {
    return <WebsitePreviewPage onBack={() => setStage('input')} prompt={buildCombinedPrompt()} />;
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🌟 AI Website Builder</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Create professional websites instantly! Choose quick features or describe exactly what you want in natural language.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Quick Features */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Start Options */}
            <Card>
              <Card.Header>
                <Card.Title>🚀 Quick Start</Card.Title>
              </Card.Header>
              <Card.Content>
                <p className="text-gray-600 mb-4">Select common features to get started quickly:</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {quickFeatures.map(feature => (
                    <button
                      key={feature.id}
                      onClick={() => toggleFeature(feature.id)}
                      className={`
                        relative p-4 rounded-lg border-2 text-center transition-all duration-200
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
                      {selectedFeatures.includes(feature.id) && (
                        <div className="absolute top-2 left-2">
                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {selectedFeatures.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm font-medium text-blue-900 mb-1">Selected Features:</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedFeatureObjects.map(feature => (
                        <span key={feature.id} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
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
                <Card.Title>💬 Tell AI What You Want</Card.Title>
              </Card.Header>
              <Card.Content>
                <p className="text-gray-600 mb-4">Describe your specific needs in natural language:</p>
                
                {/* Chat Messages */}
                <div className="bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto mb-4">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-20">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Start a conversation with AI...</p>
                      <p className="text-xs mt-1">Try: "Add a photo gallery" or "Make it for a restaurant"</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {chatMessages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`
                            max-w-xs px-3 py-2 rounded-lg text-sm
                            ${msg.type === 'user' 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-white border border-gray-200'
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
                    placeholder="Describe what you want to add..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button onClick={handleSendMessage} disabled={!currentMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                {/* Quick Suggestions */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {['Add photo gallery', 'Make it for a restaurant', 'Include testimonials', 'Add social media links'].map(suggestion => (
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

          {/* Right Column - Customization & Actions */}
          <div className="space-y-6">
            {/* Customization */}
            <Card>
              <Card.Header>
                <Card.Title>🎨 Customization</Card.Title>
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

                {/* Page Count */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Pages: {customization.pages}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={customization.pages}
                    onChange={(e) => setCustomization(prev => ({ ...prev, pages: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1 page</span>
                    <span>10 pages</span>
                  </div>
                </div>
              </Card.Content>
            </Card>

            {/* Build Actions */}
            <Card>
              <Card.Content className="space-y-3">
                <Button
                  onClick={handleBuildWebsite}
                  loading={loading}
                  disabled={selectedFeatures.length === 0 && chatMessages.filter(m => m.type === 'user').length === 0}
                  className="w-full"
                  size="lg"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  {loading ? 'Building Your Website...' : 'Build Website'}
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="text-xs">
                    <Eye className="h-3 w-3 mr-1" />
                    Preview
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Chat with AI
                  </Button>
                </div>

                {/* Progress Indicator */}
                {loading && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-sm text-blue-900 mb-2">AI is working on your website...</div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
                    </div>
                  </div>
                )}
              </Card.Content>
            </Card>

            {/* Summary */}
            {(selectedFeatures.length > 0 || chatMessages.some(m => m.type === 'user')) && (
              <Card>
                <Card.Header>
                  <Card.Title>📋 Your Website Plan</Card.Title>
                </Card.Header>
                <Card.Content>
                  <div className="space-y-2 text-sm">
                    {selectedFeatures.length > 0 && (
                      <div>
                        <span className="font-medium">Features:</span> {selectedFeatureObjects.map(f => f.name).join(', ')}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Style:</span> {styleOptions.find(s => s.value === customization.style)?.name}
                    </div>
                    <div>
                      <span className="font-medium">Color:</span> {colorOptions.find(c => c.value === customization.color)?.name}
                    </div>
                    <div>
                      <span className="font-medium">Pages:</span> {customization.pages}
                    </div>
                    {chatMessages.filter(m => m.type === 'user').length > 0 && (
                      <div>
                        <span className="font-medium">Custom requests:</span> {chatMessages.filter(m => m.type === 'user').length} messages
                      </div>
                    )}
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

// Website Preview Component
const WebsitePreviewPage = ({ onBack, prompt }) => {
  const [deliveryStage, setDeliveryStage] = useState('preview'); // preview, download, deploy

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <Sparkles className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🎉 Your Website is Ready!</h1>
          <p className="text-gray-600">Here's your beautiful, fully-functional website built in minutes</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Preview Area */}
          <div className="lg:col-span-2">
            <Card>
              <Card.Header>
                <div className="flex justify-between items-center">
                  <Card.Title>🖥️ Live Preview</Card.Title>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      💻 Desktop
                    </Button>
                    <Button variant="outline" size="sm">
                      📱 Mobile
                    </Button>
                  </div>
                </div>
              </Card.Header>
              <Card.Content>
                {/* Website Preview Mockup */}
                <div className="bg-white border rounded-lg p-6 min-h-96">
                  <div className="border-b pb-4 mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      <div className="ml-4 bg-gray-100 text-gray-600 px-3 py-1 rounded text-sm">
                        yourwebsite.com
                      </div>
                    </div>
                    <nav className="flex space-x-6 text-sm">
                      <a href="#" className="text-blue-600 font-medium">Home</a>
                      <a href="#" className="text-gray-600">About</a>
                      <a href="#" className="text-gray-600">Services</a>
                      <a href="#" className="text-gray-600">Contact</a>
                      {prompt.features.includes('Login System') && (
                        <a href="#" className="text-gray-600">Login</a>
                      )}
                    </nav>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <h1 className={`text-3xl font-bold mb-2 ${
                        prompt.color === 'blue' ? 'text-blue-600' : 
                        prompt.color === 'green' ? 'text-green-600' : 
                        prompt.color === 'purple' ? 'text-purple-600' : 
                        'text-blue-600'
                      }`}>
                        Welcome to Your Website
                      </h1>
                      <p className="text-gray-600">Professional {prompt.style} design with {prompt.features.join(', ').toLowerCase()}</p>
                    </div>
                    
                    {prompt.features.includes('Contact Form') && (
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
                    
                    {prompt.features.includes('Login System') && (
                      <div className="bg-gray-50 p-4 rounded border">
                        <h3 className="font-medium mb-3">User Login</h3>
                        <div className="space-y-2 max-w-xs">
                          <div className="h-8 bg-white border rounded"></div>
                          <div className="h-8 bg-white border rounded"></div>
                          <Button size="sm">Sign In</Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card.Content>
            </Card>
          </div>

          {/* Actions & Details */}
          <div className="space-y-6">
            {/* What's Included */}
            <Card>
              <Card.Header>
                <Card.Title>✨ What's Included</Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    {prompt.pages} HTML pages
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
                  {prompt.features.map(feature => (
                    <div key={feature} className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      {feature}
                    </div>
                  ))}
                </div>
              </Card.Content>
            </Card>

            {/* Download Options */}
            <Card>
              <Card.Header>
                <Card.Title>📦 Download Options</Card.Title>
              </Card.Header>
              <Card.Content className="space-y-3">
                <Button className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Complete Website.zip
                </Button>
                <Button className="w-full" variant="outline">
                  📄 HTML Files Only
                </Button>
                <Button className="w-full" variant="outline">
                  ⚙️ Source Code
                </Button>
              </Card.Content>
            </Card>

            {/* Deploy Options */}
            <Card>
              <Card.Header>
                <Card.Title>🚀 Deploy Options</Card.Title>
              </Card.Header>
              <Card.Content className="space-y-3">
                <Button className="w-full">
                  <Globe className="h-4 w-4 mr-2" />
                  Host on Our Platform
                </Button>
                <Button className="w-full" variant="outline">
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
                <div className="text-center text-sm text-gray-600">
                  <div className="mb-2">⏱️ Total build time: 2 min 34 sec</div>
                  <div>🎯 Built with Sevdo AI</div>
                </div>
              </Card.Content>
            </Card>

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