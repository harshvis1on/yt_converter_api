// Simple Node.js proxy server for Megaphone API
// Run with: node proxy-server.js

const express = require('express');
const cors = require('cors');
const app = express();

// Use built-in fetch (Node.js 18+) or polyfill
const fetch = globalThis.fetch;

// Enable CORS for your frontend
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'https://your-domain.com'], // Add your domains
  credentials: true
}));

app.use(express.json());

const MEGAPHONE_API_BASE = 'https://cms.megaphone.fm/api';
const NETWORK_ID = 'efc0956a-0adc-11ee-a037-5b2c5cb9fec6';
const API_TOKEN = process.env.MEGAPHONE_API_TOKEN; // Set this in environment

// n8n configuration
const N8N_BASE_URL = 'https://n8n-6s78.onrender.com';
const USE_TEST_WEBHOOKS = process.env.N8N_USE_TEST_WEBHOOKS !== 'false'; // Default to true

// Proxy for creating podcasts
app.post('/api/megaphone/podcasts', async (req, res) => {
  try {
    console.log('Creating podcast via proxy:', req.body);
    
    const response = await fetch(
      `${MEGAPHONE_API_BASE}/networks/${NETWORK_ID}/podcasts`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token token="${API_TOKEN}"`
        },
        body: JSON.stringify(req.body)
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Megaphone API error:', data);
      return res.status(response.status).json(data);
    }
    
    console.log('Podcast created successfully:', data.id);
    res.json(data);
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy server error' });
  }
});

// Proxy for creating episodes
app.post('/api/megaphone/podcasts/:podcastId/episodes', async (req, res) => {
  try {
    const { podcastId } = req.params;
    console.log('Creating episode via proxy:', podcastId, req.body);
    
    const response = await fetch(
      `${MEGAPHONE_API_BASE}/networks/${NETWORK_ID}/podcasts/${podcastId}/episodes`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token token="${API_TOKEN}"`
        },
        body: JSON.stringify(req.body)
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Megaphone episode API error:', data);
      return res.status(response.status).json(data);
    }
    
    console.log('Episode created successfully:', data.id);
    res.json(data);
    
  } catch (error) {
    console.error('Episode proxy error:', error);
    res.status(500).json({ error: 'Episode proxy server error' });
  }
});

// Proxy for n8n webhook calls
app.post('/api/n8n/:endpoint', async (req, res) => {
  try {
    const { endpoint } = req.params;
    const webhookPath = 'webhook'; // Always use production webhook
    const targetUrl = `${N8N_BASE_URL}/${webhookPath}/${endpoint}`;
    
    console.log(`\n🔄 Proxying n8n request:`);
    console.log(`   Endpoint: ${endpoint}`);
    console.log(`   Using: PRODUCTION webhooks`);
    console.log(`   Target URL: ${targetUrl}`);
    console.log(`   Payload:`, JSON.stringify(req.body, null, 2));
    
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    
    console.log(`📥 n8n response (${response.status}):`, data);
    
    if (!response.ok) {
      console.error(`❌ n8n API error (${response.status}):`, data);
      
      // Handle specific n8n error cases
      if (response.status === 404 && data.message?.includes('not registered')) {
        return res.status(404).json({
          error: 'n8n workflow not active',
          message: 'The n8n workflow needs to be activated. Please check your n8n dashboard.',
          originalError: data
        });
      }
      
      return res.status(response.status).json({
        error: 'n8n webhook error',
        originalError: data
      });
    }
    
    console.log(`✅ n8n ${endpoint} successful`);
    res.json(data);
    
  } catch (error) {
    console.error(`💥 n8n proxy error for ${req.params.endpoint}:`, error.message);
    console.error(`   Stack:`, error.stack);
    
    res.status(500).json({ 
      error: 'n8n proxy server error',
      message: error.message,
      endpoint: req.params.endpoint
    });
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Megaphone proxy server running on port ${PORT}`);
  console.log(`CORS enabled for frontend calls`);
  console.log(`API Token configured: ${!!API_TOKEN}`);
  console.log(`n8n webhook mode: ${USE_TEST_WEBHOOKS ? 'TEST' : 'PRODUCTION'}`);
});

// Package.json dependencies needed:
// npm install express cors node-fetch