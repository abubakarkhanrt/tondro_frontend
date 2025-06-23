/**
 * ──────────────────────────────────────────────────
 * File: server.js
 * Description: Express proxy server for TondroAI CRM
 * Author: Muhammad Abubakar Khan
 * Created: 18-06-2025
 * Last Updated: 23-06-2025
 * ──────────────────────────────────────────────────
 */

// Load environment variables
require('dotenv').config();

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT;
const API_BASE_URL = process.env.API_BASE_URL;

// Parse CORS origins from environment variable
const corsOrigins = process.env.CORS_ORIGIN?.trim()
  ? process.env.CORS_ORIGIN.trim().split(',').map(origin => origin.trim())
  : [];

console.log('[CORS] Allowed origins:', corsOrigins);

// Validate that CORS_ORIGIN is set
if (!process.env.CORS_ORIGIN) {
  console.error('[ERROR] CORS_ORIGIN environment variable is not set!');
  console.error('[ERROR] Please set CORS_ORIGIN in your .env file');
  process.exit(1);
}

// Enable CORS for frontend
app.use(cors({
  origin: corsOrigins,
  credentials: true,
}));

// Parse JSON bodies
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Proxy health endpoints directly to mock API
app.use(['/health', '/api/health'], async (req, res) => {
  const url = `${API_BASE_URL}${req.originalUrl}`;
  const method = req.method.toLowerCase();
  const headers = { ...req.headers };
  // Only forward Authorization header
  const proxyHeaders = {};
  if (headers['authorization']) proxyHeaders['Authorization'] = headers['authorization'];

  // Log the outgoing request
  console.log('Proxying health request:', { url, method, proxyHeaders });

  try {
    const response = await axios({
      url,
      method,
      headers: proxyHeaders,
      // Only send body for non-GET requests
      ...(method !== 'get' ? { data: req.body } : {}),
      params: req.query,
      validateStatus: () => true, // Forward all status codes
    });
    res.status(response.status).set(response.headers).send(response.data);
  } catch (error) {
    console.error('Proxy error:', error.message);
    if (error.response) {
      res.status(error.response.status).send(error.response.data);
    } else {
      res.status(500).send({ error: 'Proxy server error' });
    }
  }
});

// Proxy /api/* to mock API
app.use('/api', async (req, res) => {
  const url = `${API_BASE_URL}${req.originalUrl}`;
  const method = req.method.toLowerCase();
  const headers = { ...req.headers };
  // Only forward Authorization header
  const proxyHeaders = {};
  if (headers['authorization']) proxyHeaders['Authorization'] = headers['authorization'];

  // Log the outgoing request
  console.log('Proxying request:', { url, method, proxyHeaders });
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request body:', req.body);
  }

  try {
    const response = await axios({
      url,
      method,
      headers: proxyHeaders,
      // Only send body for non-GET requests
      ...(method !== 'get' ? { data: req.body } : {}),
      params: req.query,
      validateStatus: () => true, // Forward all status codes
    });
    
    console.log('Proxy response status:', response.status);
    console.log('Proxy response data:', response.data);
    
    res.status(response.status).set(response.headers).send(response.data);
  } catch (error) {
    console.error('Proxy error:', error.message);
    console.error('Error response:', error.response);
    console.error('Error response data:', error.response?.data);
    console.error('Error response status:', error.response?.status);
    
    if (error.response) {
      res.status(error.response.status).send(error.response.data);
    } else {
      res.status(500).send({ error: 'Proxy server error', details: error.message });
    }
  }
});

// Health check for proxy itself
app.get('/proxy-health', (req, res) => {
  res.json({ success: true, message: 'Proxy server running' });
});

// Proxy root endpoint to mock API
app.get('/', async (req, res) => {
  const url = `${API_BASE_URL}/`;
  console.log('Proxying root request:', { url, method: 'get' });

  try {
    const response = await axios({
      url,
      method: 'get',
      validateStatus: () => true, // Forward all status codes
    });
    res.status(response.status).set(response.headers).send(response.data);
  } catch (error) {
    console.error('Proxy error:', error.message);
    if (error.response) {
      res.status(error.response.status).send(error.response.data);
    } else {
      res.status(500).send({ error: 'Proxy server error' });
    }
  }
});

// Serve static files from the built React app
app.use(express.static(path.join(__dirname, 'dist')));

// Handle client-side routing - serve index.html for all non-API routes
app.get('*', (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`API proxy forwarding to ${API_BASE_URL}`);
}); 