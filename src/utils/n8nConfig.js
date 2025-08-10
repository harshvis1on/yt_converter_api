// n8n Configuration Helper
// This helps manage CORS issues and provides fallback strategies

export const N8N_CONFIG = {
  // Primary n8n server
  PRIMARY_URL: process.env.REACT_APP_N8N_BASE_URL || 'https://n8n-6s78.onrender.com/',
  
  // Check if we're in development
  IS_DEV: process.env.NODE_ENV === 'development',
  
  // Check if we should use mock mode
  USE_MOCKS: process.env.REACT_APP_DEV_MODE === 'true',
  
  // Timeout configurations
  TIMEOUTS: {
    DEFAULT: 30000, // 30 seconds
    LONG_RUNNING: 180000, // 3 minutes for episode creation
    HEALTH_CHECK: 5000 // 5 seconds for health checks
  },
  
  // Endpoints that are considered long-running
  LONG_RUNNING_ENDPOINTS: [
    'create-episodes',
    'create-podcast',
    'sync-megaphone-episodes'
  ],
  
  // Check if endpoint is long-running
  isLongRunning: (endpoint) => {
    return N8N_CONFIG.LONG_RUNNING_ENDPOINTS.includes(endpoint);
  },
  
  // Get appropriate timeout for endpoint
  getTimeout: (endpoint) => {
    return N8N_CONFIG.isLongRunning(endpoint) 
      ? N8N_CONFIG.TIMEOUTS.LONG_RUNNING 
      : N8N_CONFIG.TIMEOUTS.DEFAULT;
  },
  
  // Check if we should fall back to mocks for this error
  shouldFallbackToMock: (error, endpoint, isDev = false) => {
    // Always use mocks if explicitly enabled
    if (N8N_CONFIG.USE_MOCKS) return true;
    
    // For CORS/network errors in development, use mocks
    if (isDev && (
      error.message.includes('Failed to fetch') ||
      error.message.includes('CORS') ||
      error.message.includes('NetworkError')
    )) {
      return true;
    }
    
    // For non-critical endpoints, allow fallback
    const criticalEndpoints = ['create-episodes', 'create-podcast'];
    if (!criticalEndpoints.includes(endpoint) && (
      error.message.includes('Failed to fetch') ||
      error.message.includes('404')
    )) {
      return true;
    }
    
    return false;
  },
  
  // Get user-friendly error message
  getUserFriendlyError: (error, endpoint) => {
    if (error.name === 'AbortError') {
      const timeout = N8N_CONFIG.getTimeout(endpoint);
      const minutes = Math.ceil(timeout / 60000);
      return `Operation timed out after ${minutes} minute${minutes > 1 ? 's' : ''}. The process may still be running in the background.`;
    }
    
    if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
      return 'Unable to connect to the server. Please check your internet connection.';
    }
    
    if (error.message.includes('404')) {
      return 'Workflow not found. Please ensure your n8n workflows are properly configured.';
    }
    
    if (error.message.includes('500')) {
      return 'Server error occurred. Please try again in a moment.';
    }
    
    return error.message || 'An unexpected error occurred.';
  }
};

export default N8N_CONFIG;