/**
 * ──────────────────────────────────────────────────
 * File: pages/api/transcripts/[...path].js
 * Description: Simple transcripts API proxy endpoint for TondroAI CRM
 * Author: Muhammad Abubakar Khan
 * Created: 18-07-2025
 * Last Updated: 21-07-2025
 * ──────────────────────────────────────────────────
 */

import { proxy } from '../../../src/utils/proxy';

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

  await proxy(req, res, BACKEND_BASE_URL);
}
