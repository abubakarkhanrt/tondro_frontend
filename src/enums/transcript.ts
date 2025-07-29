/**
 * ──────────────────────────────────────────────────
 * File: src/enums/transcript.ts
 * Description: Enums related to Transcript processing.
 * Author: Muhammad Abubakar Khan
 * Created: 20-07-2024
 * Last Updated: 20-07-2024
 * ──────────────────────────────────────────────────
 */

export enum JobStatus {
  Idle = 'idle',
  Processing = 'processing',
  Completed = 'completed',
  Failed = 'failed',
}

export enum TranscriptApiErrorCode {
  FileTooLarge = 'FILE_TOO_LARGE',
  InvalidFileType = 'INVALID_FILE_TYPE',
  ProcessingTimeout = 'PROCESSING_TIMEOUT',
  ServerError = 'SERVER_ERROR',
  InsufficientQuota = 'INSUFFICIENT_QUOTA',
  FileCorrupted = 'FILE_CORRUPTED',
  UnsupportedLanguage = 'UNSUPPORTED_LANGUAGE',
}
