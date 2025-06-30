/**
 * ──────────────────────────────────────────────────
 * File: pages/transcripts.tsx
 * Description: Transcripts page for TondroAI CRM
 * Author: Muhammad Abubakar Khan
 * Created: 25-06-2025
 * Last Updated: 25-06-2025
 * ──────────────────────────────────────────────────
 */

import React from 'react';
import { Transcripts } from '../src/components/Transcripts';
import ProtectedRoute from '../src/components/ProtectedRoute';

const TranscriptsPage: React.FC = () => {
  return (
    <ProtectedRoute>
      <Transcripts />
    </ProtectedRoute>
  );
};

export default TranscriptsPage; 