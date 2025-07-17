/**
 * ──────────────────────────────────────────────────
 * File: pages/api/transcripts/[...path].js
 * Description: Transcripts API proxy endpoint for TondroAI CRM
 * Author: Muhammad Abubakar Khan
 * Created: 08-07-2025
 * Last Updated: 15-07-2025
 * ──────────────────────────────────────────────────
 */

import formidable from 'formidable';
import fs from 'fs';
import FormData from 'form-data';

// Disable Next.js body parsing for this route
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

  if (req.method === 'POST') {
    const form = formidable();

    // Use a Promise to handle the async form parsing
    await new Promise((resolve, reject) => {
      form.parse(req, async (err, fields, files) => {
        if (err) {
          res
            .status(500)
            .json({ error: 'Form parse error', details: err.message });
          return reject(err);
        }

        try {
          // Create a new FormData instance for the outgoing request
          const formData = new FormData();

          // Append fields
          Object.entries(fields).forEach(([key, value]) => {
            const processedValue = Array.isArray(value) ? value[0] : value;
            formData.append(key, processedValue);
          });

          // Append files
          Object.entries(files).forEach(([key, fileArr]) => {
            const file = Array.isArray(fileArr) ? fileArr[0] : fileArr;
            formData.append(key, fs.createReadStream(file.filepath), {
              filename: file.originalFilename,
              contentType: file.mimetype,
            });
          });

          // --- FIXED: Use correct HTTP/HTTPS module based on protocol ---
          const backendUrl = new URL(BACKEND_BASE_URL);
          const isHttps = backendUrl.protocol === 'https:';

          const requestOptions = {
            method: 'POST',
            host: backendUrl.hostname,
            path: '/jobs',
            port: backendUrl.port || (isHttps ? 443 : 80),
            // Merge form-data headers with the Authorization header
            headers: {
              ...formData.getHeaders(),
              ...(req.headers.authorization && {
                Authorization: req.headers.authorization,
              }),
            },
          };

          // Use the appropriate HTTP/HTTPS module based on the protocol
          const httpModule = isHttps ? require('https') : require('http');
          const backendReq = httpModule.request(requestOptions, backendRes => {
            let body = '';
            backendRes.on('data', chunk => {
              body += chunk;
            });
            backendRes.on('end', () => {
              try {
                res.status(backendRes.statusCode).json(JSON.parse(body));
              } catch (e) {
                res
                  .status(500)
                  .json({ error: 'Failed to parse backend response' });
              }
              resolve();
            });
          });

          backendReq.on('error', e => {
            console.error('Backend request error:', e);
            res
              .status(500)
              .json({ error: 'Backend request failed', details: e.message });
            reject(e);
          });

          // Pipe the form data to the request
          formData.pipe(backendReq);
        } catch (e) {
          console.error('Error during backend forwarding:', e);
          res
            .status(500)
            .json({ error: 'Internal server error', details: e.message });
          reject(e);
        }
      });
    }).catch(() => {
      // This catch block prevents an unhandled rejection error if the promise is rejected.
      // The response is already sent inside the promise.
    });
    return; // End the function here for POST requests
  }

  // ... rest of your handler for GET requests ...

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

    // For transcripts API, we need to handle multipart form data differently
    const headers = {
      Accept: 'application/json',
      // Forward authorization header if present
      ...(req.headers.authorization && {
        Authorization: req.headers.authorization,
      }),
    };

    // Prepare request body
    let body;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
    }

    // Forward the request to your transcripts backend
    const response = await fetch(backendUrl, {
      method: req.method,
      headers: headers,
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
