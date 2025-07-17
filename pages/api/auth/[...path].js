/**
 * ──────────────────────────────────────────────────
 * File: pages/api/auth/[...path].js
 * Description: Auth API proxy endpoint for TondroAI CRM
 * Author: Muhammad Abubakar Khan
 * Created: 14-07-2025
 * Last Updated: 14-07-2025
 * ──────────────────────────────────────────────────
 */

const AUTH_BACKEND_BASE_URL = process.env.NEXT_PUBLIC_AUTH_API_BASE_URL;
const FRONTEND_ORIGIN = process.env.NEXT_PUBLIC_ORIGIN;

// This config object is the key. It disables the default Next.js body parser.
export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, Cookie'
  );
  res.setHeader('Access-Control-Allow-Credentials', 'true');

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
      ? `${AUTH_BACKEND_BASE_URL}/${apiPath}?${queryString}`
      : `${AUTH_BACKEND_BASE_URL}/${apiPath}`;

    console.log(`Auth Proxy: ${req.method} ${backendUrl}`);

    // Prepare request body
    const body =
      req.method !== 'GET' && req.method !== 'HEAD' && req.body
        ? JSON.stringify(req.body)
        : undefined;

    // Create a mutable copy of the headers for forwarding.
    const forwardHeaders = { ...req.headers };

    // Do not forward the original 'host' header. 'fetch' will automatically
    // set the correct Host header based on the backendUrl.
    delete forwardHeaders.host;

    // It is also good practice to remove other hop-by-hop headers.
    delete forwardHeaders.connection;

    // Forward the request to the auth backend
    const response = await fetch(backendUrl, {
      method: req.method,
      headers: {
        ...forwardHeaders,
        Origin: FRONTEND_ORIGIN,
      },
      body: body,
    });

    // Get response data
    const responseText = await response.text();

    // Try to parse as JSON, fallback to text
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { data: responseText };
    }

    // Forward set-cookie headers if present
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      res.setHeader('Set-Cookie', setCookie);
    }

    // Return the response
    res.status(response.status).json(responseData);
  } catch (error) {
    console.error('Auth Proxy error:', error);
    res.status(500).json({
      error: 'Auth proxy request failed',
      details: error.message,
    });
  }
}
