// =============================================================================
// 1. user_frontend/src/services/sevdo.service.js
// =============================================================================

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

  // Generate complete project with backend and frontend
  async generateProject(projectName, backendTokens, frontendDsl = null, includeImports = true) {
    try {
      const response = await apiClient.post(getEndpoint('SEVDO_GENERATE_PROJECT'), {
        project_name: projectName,
        backend_tokens: backendTokens,
        frontend_dsl: frontendDsl,
        include_imports: includeImports
      });
      return response;
    } catch (error) {
      console.error('Project generation failed:', error);
      throw error;
    }
  }

  // Generate code from natural language description (AI-powered)
  async generateFromDescription(description, projectType = 'WEB_APP') {
    try {
      // First, get AI suggestions for tokens
      const aiResponse = await apiClient.post('/api/v1/ai/project-from-description', {
        description,
        project_type: projectType
      });

      // Then generate the actual project
      if (aiResponse.suggested_tokens && aiResponse.suggested_tokens.length > 0) {
        return await this.generateProject(
          aiResponse.suggested_name,
          aiResponse.suggested_tokens,
          null,
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