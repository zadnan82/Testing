// user_frontend/src/services/sevdo.service.js - ENHANCED VERSION

import { apiClient } from './api';
import { getEndpoint } from '../config/api.config';

export class SevdoService {
  // Generate backend code from tokens
  async generateBackend(tokens, includeImports = true) {
    try {
      const response = await apiClient.post(getEndpoint('SEVDO_GENERATE_BACKEND'), {
        tokens,
        include_imports: includeImports
      });
      return response;
    } catch (error) {
      console.error('Backend generation failed:', error);
      throw error;
    }
  }

  // Generate frontend code from DSL
  async generateFrontend(dslContent, componentName = 'GeneratedComponent', includeImports = true) {
    try {
      const response = await apiClient.post(getEndpoint('SEVDO_GENERATE_FRONTEND'), {
        dsl_content: dslContent,
        component_name: componentName,
        include_imports: includeImports
      });
      return response;
    } catch (error) {
      console.error('Frontend generation failed:', error);
      throw error;
    }
  }

  // NEW: Generate frontend DSL from selected features
  generateFrontendDSL(features) {
    let dsl = [];
    
    // Map user-friendly features to frontend components
    if (features.includes('user_login')) {
      dsl.push('lf(h(Member Login)b(Sign In))');
    }
    
    if (features.includes('user_registration')) {
      dsl.push('rf(h(Create Account)b(Register))');
    }
    
    if (features.includes('contact_form')) {
      dsl.push('em(h(Contact Us)s(Get in Touch)b(Send Message))');
    }
    
    if (features.includes('admin_panel')) {
      dsl.push('mn(h(Admin Panel)m(Dashboard,Users,Settings,Analytics))');
    }
    
    if (features.includes('blog_system')) {
      dsl.push('cd(h(Latest Posts)t(Read our latest articles)b(Read More))');
    }
    
    if (features.includes('shopping_cart')) {
      dsl.push('cd(h(Shop Now)t(Browse our products)b(Add to Cart))');
    }
    
    if (features.includes('testimonials')) {
      dsl.push('tt(h(Customer Reviews))');
    }
    
    if (features.includes('gallery')) {
      dsl.push('cd(h(Photo Gallery)t(View our work)b(View Gallery))');
    }
    
    // Always add a main page wrapper
    dsl.unshift('pg(h(Welcome)n(MyWebsite)c(Your awesome website))');
    
    // Add footer
    dsl.push('ft(h(My Website)t(Built with SEVDO)y(2024))');
    
    return dsl.join('\n');
  }

  // ENHANCED: Generate complete project with BOTH backend and frontend
  async generateProject(projectName, backendTokens, features = [], includeImports = true) {
    try {
      console.log('🚀 Generating complete project:', {
        projectName,
        backendTokens,
        features
      });

      const results = {
        projectName,
        backend: null,
        frontend: null,
        success: false,
        errors: []
      };

      // 1. Generate Backend Code
      try {
        console.log('🔧 Generating backend with tokens:', backendTokens);
        const backendResult = await this.generateBackend(backendTokens, includeImports);
        results.backend = backendResult;
        console.log('✅ Backend generated successfully');
      } catch (error) {
        console.error('❌ Backend generation failed:', error);
        results.errors.push(`Backend: ${error.message}`);
      }

      // 2. Generate Frontend Code (if features provided)
      if (features && features.length > 0) {
        try {
          console.log('🎨 Generating frontend for features:', features);
          
          // Convert features to frontend DSL
          const frontendDSL = this.generateFrontendDSL(features);
          console.log('📝 Generated DSL:', frontendDSL);
          
          // Generate React components
          const frontendResult = await this.generateFrontend(
            frontendDSL,
            `${projectName.replace(/\s+/g, '')}Components`,
            includeImports
          );
          
          results.frontend = frontendResult;
          console.log('✅ Frontend generated successfully');
        } catch (error) {
          console.error('❌ Frontend generation failed:', error);
          results.errors.push(`Frontend: ${error.message}`);
        }
      } else {
        console.log('⚠️ No features provided, skipping frontend generation');
      }

      // 3. Determine overall success
      results.success = results.backend?.success || results.frontend?.success;
      
      if (results.success) {
        console.log('🎉 Project generation completed successfully!');
      } else {
        console.log('⚠️ Project generation completed with some errors');
      }

      return results;
      
    } catch (error) {
      console.error('💥 Complete project generation failed:', error);
      throw error;
    }
  }

  // Generate code from natural language description (AI-powered)
  async generateFromDescription(description, projectType = 'WEB_APP') {
    try {
      console.log('🤖 AI: Generating from description:', description);
      
      // First, get AI suggestions for tokens and features
      const aiResponse = await apiClient.post('/api/v1/ai/project-from-description', {
        description,
        project_type: projectType
      });

      console.log('🧠 AI Response:', aiResponse);

      // Extract suggested features from the AI response
      const features = this.extractFeaturesFromAI(aiResponse);
      
      // Then generate the actual project with both backend and frontend
      if (aiResponse.suggested_tokens && aiResponse.suggested_tokens.length > 0) {
        return await this.generateProject(
          aiResponse.suggested_name,
          aiResponse.suggested_tokens,
          features, // Pass features for frontend generation
          true
        );
      } else {
        throw new Error('No suitable tokens found for the description');
      }
    } catch (error) {
      console.error('AI-powered generation failed:', error);
      throw error;
    }
  }

  // Helper: Extract features from AI response
  extractFeaturesFromAI(aiResponse) {
    const features = [];
    const tokens = aiResponse.suggested_tokens || [];
    
    // Map backend tokens to frontend features
    if (tokens.includes('l')) features.push('user_login');
    if (tokens.includes('r')) features.push('user_registration');
    if (tokens.includes('m')) features.push('user_profile');
    if (tokens.includes('c')) features.push('contact_form');
    if (tokens.includes('a')) features.push('admin_panel');
    if (tokens.includes('b')) features.push('blog_system');
    if (tokens.includes('e')) features.push('shopping_cart');
    
    return features;
  }

  // Get available tokens for selection
  async getAvailableTokens() {
    try {
      const response = await apiClient.get('/api/v1/tokens');
      return response;
    } catch (error) {
      console.error('Failed to get available tokens:', error);
      throw error;
    }
  }

  // Validate token combination
  async validateTokens(tokens) {
    try {
      const response = await apiClient.post('/api/v1/tokens/validate', {
        tokens
      });
      return response;
    } catch (error) {
      console.error('Token validation failed:', error);
      throw error;
    }
  }

  // Get token suggestions based on description
  async suggestTokens(description, existingTokens = [], projectType = null) {
    try {
      const params = { description };
      if (existingTokens.length > 0) params.existing_tokens = existingTokens;
      if (projectType) params.project_type = projectType;

      const response = await apiClient.get('/api/v1/tokens/suggest', params);
      return response;
    } catch (error) {
      console.error('Token suggestion failed:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
export const sevdoService = new SevdoService();
export default sevdoService;