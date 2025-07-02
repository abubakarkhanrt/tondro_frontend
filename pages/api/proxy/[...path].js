const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Get the path segments
    const { path } = req.query;
    const apiPath = Array.isArray(path) ? path.join('/') : path || '';
    
    // Build the backend URL
    const backendUrl = `${BACKEND_BASE_URL}/${apiPath}`;
    
    console.log(`Proxying ${req.method} request to: ${backendUrl}`);
    
    // Prepare request body
    const body = req.method !== 'GET' && req.method !== 'HEAD' 
      ? JSON.stringify(req.body) 
      : undefined;
    
    // Forward the request to your Python backend
    const response = await fetch(backendUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        // Forward authorization header if present
        ...(req.headers.authorization && {
          'Authorization': req.headers.authorization
        }),
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

    // Return the response
    res.status(response.status).json(responseData);

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Proxy request failed', 
      details: error.message 
    });
  }
}
