/**
 * ──────────────────────────────────────────────────
 * File: src/utils/getApiErrorMessage.ts
 * Description: Utility to extract a user-friendly error message from an API error object.
 * Author: Muhammad Abubakar Khan
 * Created: 18-07-2025
 * Last Updated: 18-07-2025
 * ──────────────────────────────────────────────────
 */
import { isAxiosError } from 'axios';

const DEFAULT_ERROR_MESSAGE = 'An unexpected error occurred. Please try again.';

/**
 * Extracts a user-friendly error message from a caught error object.
 * It prioritizes messages from the API response body.
 *
 * @param error The error object caught in a try-catch block.
 * @returns A string containing the most specific error message available.
 */
export const getApiErrorMessage = (
  error: unknown,
  defaultMessage: string = DEFAULT_ERROR_MESSAGE
): string => {
  if (isAxiosError(error)) {
    // Prefer the 'detail' field, then 'message', from the response data
    if (error.response?.data?.detail) {
      return error.response.data.detail;
    }
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    // Fallback to the generic Axios error message
    return error.message;
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return error.message;
  }

  // Fallback for unknown error types
  return defaultMessage;
};
