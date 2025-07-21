import { proxy } from '../../../src/utils/proxy';

// const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL + '/crm';
const BACKEND_BASE_URL = 'http://localhost:8080';

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

  await proxy(req, res, BACKEND_BASE_URL);
}
