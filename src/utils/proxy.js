/**
 * ──────────────────────────────────────────────────
 * File: src/utils/proxy.js
 * Description: Reusable API proxy handler
 * Author: Muhammad Abubakar Khan
 * Created: 15-07-2025
 * Last Updated: 15-07-2025
 * ──────────────────────────────────────────────────
 */

export async function proxy(req, res, backendUrl) {
  try {
    const { path, ...queryParams } = req.query;
    const apiPath = Array.isArray(path) ? path.join('/') : path || '';

    const queryString = Object.keys(queryParams)
      .map(key => `${key}=${encodeURIComponent(queryParams[key])}`)
      .join('&');

    const url = queryString
      ? `${backendUrl}/${apiPath}?${queryString}`
      : `${backendUrl}/${apiPath}`;

    console.log(`Proxying ${req.method} request to: ${url}`);

    const body =
      req.method !== 'GET' && req.method !== 'HEAD'
        ? JSON.stringify(req.body)
        : undefined;

    const forwardHeaders = { ...req.headers };

    const response = await fetch(url, {
      method: req.method,
      headers: forwardHeaders,
      body: body,
    });

    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { data: responseText };
    }

    if (response.headers.has('set-cookie')) {
      res.setHeader('set-cookie', response.headers.get('set-cookie'));
    }

    res.status(response.status).json(responseData);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({
      error: 'Proxy request failed',
      details: error.message,
    });
  }
}
