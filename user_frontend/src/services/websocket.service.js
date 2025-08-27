// user_frontend/src/services/websocket.service.js

import { CONFIG, buildEndpoint } from '../config/api.config';
import { storage } from '../utils/storage';

export class WebSocketService {
  constructor() {
    this.connections = new Map();
    this.reconnectAttempts = new Map();
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  // Get WebSocket URL (convert http to ws)
  getWebSocketUrl(endpoint) {
    const baseUrl = CONFIG.API.BASE_URL.replace('http://', 'ws://').replace('https://', 'wss://');
    return `${baseUrl}${endpoint}`;
  }

  // Connect to notifications WebSocket
  connectToNotifications(onMessage, onError = null, onClose = null) {
    const token = storage.get(CONFIG.STORAGE_KEYS.SESSION_TOKEN);
    if (!token) {
      throw new Error('No authentication token found');
    }

    const endpoint = `/api/v1/ws/notifications?token=${token}`;
    const url = this.getWebSocketUrl(endpoint);
    
    return this.createConnection('notifications', url, onMessage, onError, onClose);
  }

  // Connect to project generation WebSocket
  connectToProjectGeneration(projectId, onMessage, onError = null, onClose = null) {
    const token = storage.get(CONFIG.STORAGE_KEYS.SESSION_TOKEN);
    if (!token) {
      throw new Error('No authentication token found');
    }

    const endpoint = buildEndpoint('WS_PROJECT_GENERATION', { id: projectId });
    const url = this.getWebSocketUrl(`${endpoint}?token=${token}`);
    
    return this.createConnection(`project-${projectId}`, url, onMessage, onError, onClose);
  }

  // Generic WebSocket connection creator
  createConnection(connectionId, url, onMessage, onError = null, onClose = null) {
    // Close existing connection if any
    this.closeConnection(connectionId);

    const ws = new WebSocket(url);
    
    ws.onopen = () => {
      console.log(`WebSocket connected: ${connectionId}`);
      this.reconnectAttempts.set(connectionId, 0);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
        if (onError) onError(error);
      }
    };

    ws.onerror = (error) => {
      console.error(`WebSocket error for ${connectionId}:`, error);
      if (onError) onError(error);
    };

    ws.onclose = (event) => {
      console.log(`WebSocket closed for ${connectionId}:`, event.code, event.reason);
      this.connections.delete(connectionId);
      
      // Attempt reconnection for unexpected closures
      if (event.code !== 1000 && event.code !== 1001) { // Not normal closure
        this.attemptReconnection(connectionId, url, onMessage, onError, onClose);
      }
      
      if (onClose) onClose(event);
    };

    this.connections.set(connectionId, ws);
    return ws;
  }

  // Attempt to reconnect WebSocket
  attemptReconnection(connectionId, url, onMessage, onError, onClose) {
    const attempts = this.reconnectAttempts.get(connectionId) || 0;
    
    if (attempts >= this.maxReconnectAttempts) {
      console.error(`Max reconnection attempts reached for ${connectionId}`);
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, attempts); // Exponential backoff
    
    setTimeout(() => {
      console.log(`Attempting to reconnect ${connectionId} (attempt ${attempts + 1})`);
      this.reconnectAttempts.set(connectionId, attempts + 1);
      this.createConnection(connectionId, url, onMessage, onError, onClose);
    }, delay);
  }

  // Send message through WebSocket
  sendMessage(connectionId, message) {
    const ws = this.connections.get(connectionId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  // Close specific WebSocket connection
  closeConnection(connectionId) {
    const ws = this.connections.get(connectionId);
    if (ws) {
      ws.close(1000, 'Closed by client');
      this.connections.delete(connectionId);
      this.reconnectAttempts.delete(connectionId);
    }
  }

  // Close all WebSocket connections
  closeAllConnections() {
    this.connections.forEach((ws, connectionId) => {
      this.closeConnection(connectionId);
    });
  }

  // Check connection status
  isConnected(connectionId) {
    const ws = this.connections.get(connectionId);
    return ws && ws.readyState === WebSocket.OPEN;
  }

  // Get all active connections
  getActiveConnections() {
    return Array.from(this.connections.keys()).filter(id => this.isConnected(id));
  }

  // Mark notification as read via WebSocket
  markNotificationRead(notificationId) {
    return this.sendMessage('notifications', {
      type: 'mark_read',
      notification_id: notificationId
    });
  }

  // Send ping to keep connection alive
  ping(connectionId) {
    return this.sendMessage(connectionId, {
      type: 'ping',
      timestamp: new Date().toISOString()
    });
  }

  // Start periodic ping to keep connections alive
  startKeepAlive(connectionId, interval = 30000) {
    const keepAliveId = setInterval(() => {
      if (this.isConnected(connectionId)) {
        this.ping(connectionId);
      } else {
        clearInterval(keepAliveId);
      }
    }, interval);

    return keepAliveId;
  }
}

// Create and export singleton instance
export const websocketService = new WebSocketService();
export default websocketService;