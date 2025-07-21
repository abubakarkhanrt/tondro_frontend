/**
 * ──────────────────────────────────────────────────
 * File: pages/api/transcripts/[...path].js
 * Description: Simple transcripts API proxy endpoint for TondroAI CRM
 * Author: Muhammad Abubakar Khan
 * Created: 18-07-2025
 * Last Updated: 21-07-2025
 * ──────────────────────────────────────────────────
 */

// Disable Next.js body parsing for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_TRANSCRIPTS_API_BASE_URL;

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Get the path segments and query parameters
    const { path, ...queryParams } = req.query;
    const apiPath = Array.isArray(path) ? path.join('/') : path || '';

    // Build query string from query parameters (excluding 'path')
    const queryString = Object.keys(queryParams)
      .map(key => `${key}=${encodeURIComponent(queryParams[key])}`)
      .join('&');

    // Build the backend URL with query parameters
    const backendUrl = queryString
      ? `${BACKEND_BASE_URL}/${apiPath}?${queryString}`
      : `${BACKEND_BASE_URL}/${apiPath}`;

    console.log(
      `Transcripts API: Proxying ${req.method} request to: ${backendUrl}`
    );

    // Prepare headers
    const headers = {
      // Forward authorization header if present
      ...(req.headers.authorization && {
        Authorization: req.headers.authorization,
      }),
    };

    // Prepare request body
    let body;
    const fetchOptions = {
      method: req.method,
      headers: headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      // For POST requests, forward the raw request body as-is
      body = req;

      // Forward content-type header
      if (req.headers['content-type']) {
        headers['Content-Type'] = req.headers['content-type'];
      }

      // Add body and duplex option
      fetchOptions.body = body;
      fetchOptions.duplex = 'half'; // Required for streaming bodies
    }

    // Forward the request to the transcripts backend
    const response = await fetch(backendUrl, fetchOptions);

    // Get response data
    const responseText = await response.text();

    // Try to parse as JSON, fallback to text
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { data: responseText };
    }

    // Return the response
    res.status(response.status).json(responseData);
  } catch (error) {
    console.error('Transcripts API Proxy error:', error);
    res.status(500).json({
      error: 'Transcripts API proxy request failed',
      details: error.message,
    });
  }
}
