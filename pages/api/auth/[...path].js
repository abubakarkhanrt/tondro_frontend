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
      req.method !== 'GET' && req.method !== 'HEAD'
        ? JSON.stringify(req.body)
        : undefined;

    // Forward the request to the auth backend
    const response = await fetch(backendUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(req.headers.authorization && {
          Authorization: req.headers.authorization,
        }),
        ...(req.headers.cookie && {
          Cookie: req.headers.cookie,
        }),
      },
      body: body,
      credentials: 'include',
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
