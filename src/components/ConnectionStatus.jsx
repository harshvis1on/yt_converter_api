import React, { useState, useEffect } from 'react';
import { n8nApi } from '../services/n8nApi';

const N8N_BASE_URL = process.env.REACT_APP_N8N_BASE_URL || '';
const USE_MOCK_MODE = process.env.NODE_ENV === 'development' && N8N_BASE_URL.includes('localhost');

export default function ConnectionStatus() {
  const [status, setStatus] = useState({ loading: true, healthy: false, error: null });

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const isHealthy = await n8nApi.healthCheck();
        setStatus({ loading: false, healthy: isHealthy, error: null });
      } catch (error) {
        setStatus({ loading: false, healthy: false, error: error.message });
      }
    };

    checkHealth();
    
    // Check every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  if (status.loading) {
    return (
      <div className="inline-flex items-center text-xs text-gray-500">
        <div className="w-2 h-2 bg-gray-400 rounded-full mr-2 animate-pulse"></div>
        Checking connection...
      </div>
    );
  }

  if (status.healthy) {
    return (
      <div className="inline-flex items-center text-xs text-green-600">
        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
        {USE_MOCK_MODE ? 'Mock Mode Active 🧪' : 'Connected to PodPay servers'}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center text-xs text-red-600">
      <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
      Connection issues - {status.error || 'Unable to connect'}
    </div>
  );
}