/**
 * ──────────────────────────────────────────────────
 * File: pages/api/auth/[...path].js
 * Description: Auth API proxy endpoint for TondroAI CRM
 * Author: Muhammad Abubakar Khan
 * Created: 14-07-2025
 * Last Updated: 15-07-2025
 * ──────────────────────────────────────────────────
 */

import { proxy } from '../../../src/utils/proxy';

const AUTH_BACKEND_BASE_URL = 'http://localhost:8001';
const FRONTEND_ORIGIN =
  process.env.NEXT_PUBLIC_ORIGIN || 'http://localhost:3000';

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

  req.headers = {
    ...req.headers,
    Origin: FRONTEND_ORIGIN,
  };

  await proxy(req, res, AUTH_BACKEND_BASE_URL);
}
