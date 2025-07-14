/**
 * ──────────────────────────────────────────────────
 * File: src/components/Transcripts.tsx
 * Description: Transcripts management page for TondroAI CRM with asynchronous job-based processing
 * Author: Muhammad Abubakar Khan
 * Created: 25-06-2025
 * Last Updated: 14-07-2025
 * ──────────────────────────────────────────────────
 *
 * This component handles transcript file uploads and analysis using an asynchronous job-based API.
 * Features:
 * - File upload with validation (PDF, max 10MB)
 * - Job submission and status polling
 * - Real-time progress tracking
 * - Detailed analysis results display
 * - Error handling with retry logic
 * - Support for both first-pass and final-pass analysis results
 *
 * API Flow:
 * 1. Submit file → Receive job_id
 * 2. Poll job status until completed/failed
 * 3. Fetch detailed results (optional)
 * 4. Display analysis with confidence scores
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Chip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Divider,
} from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import { TestIds } from '../testIds';
import { apiHelpers } from '../services/api';

// ────────────────────────────────────────
// Type Definitions
// ────────────────────────────────────────

interface TranscriptAnalysisData {
  [key: string]: any; // Allow any dynamic structure
  // Keep the original structure as optional for backward compatibility
  documentInfo?: {
    documentInfo_issuing_university_name: string | null;
    documentInfo_transcript_issue_date: {
      documentInfo_transcript_issue_date_extracted: string | null;
      documentInfo_transcript_issue_date_normalized_iso: string | null;
    };
    documentInfo_document_type: string | null;
    documentInfo_total_pages: number | null;
    _confidence: number | null;
  };
  studentInfo?: {
    studentInfo_student_name: string | null;
    studentInfo_student_id: string | null;
    studentInfo_student_level: string | null;
    studentInfo_term_admitted: string | null;
    studentInfo_ssn_partial: {
      studentInfo_ssn_partial_value: string | null;
    };
    studentInfo_other_student_identifiers: Array<{
      studentInfo_other_student_identifiers_type: string;
      studentInfo_other_student_identifiers_value: string;
      _confidence: number | null;
    }>;
    _confidence: number | null;
  };
  degrees?: Array<{
    degrees_degree_awarded: string | null;
    degrees_conferral_date: {
      degrees_conferral_date_extracted: string | null;
      degrees_conferral_date_normalized_iso: string | null;
    };
    degrees_majors: string[];
    degrees_minors: string[];
    degrees_honors: string[];
    degrees_program_accreditation_notes: string[];
    _confidence: number | null;
  }>;
  overallSummary?: {
    overallSummary_cumulative_gpa: number | null;
    overallSummary_cumulative_gpa_hours: number | null;
    overallSummary_cumulative_quality_points: number | null;
    overallSummary_cumulative_earned_hours: number | null;
    _confidence: number | null;
  };
  transferCreditBlocks?: Array<{
    transferCreditBlocks_transfer_term_description: string | null;
    transferCreditBlocks_transfer_courses: Array<{
      transferCreditBlocks_transfer_courses_course_code: string | null;
      transferCreditBlocks_transfer_courses_course_title: string | null;
      transferCreditBlocks_transfer_courses_course_credits: number | null;
      transferCreditBlocks_transfer_courses_course_grade: string | null;
      transferCreditBlocks_transfer_courses_repeat_indicator: string | null;
      transferCreditBlocks_transfer_courses_course_notes: string[];
      transferCreditBlocks_transfer_courses_transfer_equivalency_notes: string[];
      _confidence: number | null;
    }>;
    _confidence: number | null;
  }>;
  academicTerms?: Array<{
    academicTerms_term_identifier: string | null;
    academicTerms_term_gpa: number | null;
    academicTerms_term_gpa_hours: number | null;
    academicTerms_term_quality_points: number | null;
    academicTerms_term_earned_hours: number | null;
    academicTerms_term_courses: Array<{
      academicTerms_term_courses_course_code: string | null;
      academicTerms_term_courses_course_title: string | null;
      academicTerms_term_courses_course_credits: number | null;
      academicTerms_term_courses_course_grade: string | null;
      academicTerms_term_courses_repeat_indicator: string | null;
      academicTerms_term_courses_course_notes: string[];
    }>;
    _confidence: number | null;
  }>;
  extractionMetadata?: {
    extractionMetadata_schema_version: string;
    extractionMetadata_processing_warnings: string[];
    extractionMetadata_input_file_name: string | null;
  };
}

interface TranscriptAnalysisResponse {
  success: boolean;
  data?: {
    job_id: number; // Changed from string to number
    file_info: {
      filename: string;
      file_size: number;
      file_type: string;
      uploaded_at: string;
      processing_started_at: string;
      processing_completed_at: string;
      total_processing_time_seconds: number;
    };
    analysis_results: {
      first_pass: TranscriptAnalysisData;
      final_pass: TranscriptAnalysisData;
    };
    processing_metadata: {
      first_pass_confidence: number;
      final_pass_confidence: number;
      improvement_score: number;
      processing_warnings: string[];
      extraction_quality_score: number;
    };
  };
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

// Update the interface to match the actual API response
/*
interface JobDiagnosticsResponse {
  id: number;
  tenant_id: string;
  created_timestamp: string;
  processing_duration_seconds: number;
  overall_status: string;
  documents: {
    id: string;
    document_type: string;
    status: 'processing' | 'completed' | 'failed';
    completed_at?: string;
    result?: {
      pass_1_extraction: TranscriptAnalysisData;
      pass_2_correction: TranscriptAnalysisData;
    };
    error?: {
      code: string;
      message: string;
    };
  }[];
}
*/
// ────────────────────────────────────────
// Main Component
// ────────────────────────────────────────

const Transcripts: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<number | null>(null);
  const [jobStatus, setJobStatus] = useState<
    'idle' | 'processing' | 'completed' | 'failed'
  >('idle');
  // Remove polling-related refs and state
  const [response, setResponse] = useState<TranscriptAnalysisResponse | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // ────────────────────────────────────────
  // File Upload Handlers
  // ────────────────────────────────────────

  /**
   * Handles file selection and validation
   * @param event - File input change event
   */
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
      ];
      if (!allowedTypes.includes(file.type)) {
        setError('Please select a valid file type (PDF)');
        setSelectedFile(null);
        return;
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        setError('File size must be less than 10MB');
        setSelectedFile(null);
        return;
      }

      setSelectedFile(file);
      setError('');
      setResponse(null);
    }
  };

  /**
   * Submits the selected file for transcript analysis
   * Creates a job and fetches results in a single flow
   */
  const handleSubmit = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError('');
    setResponse(null);
    setJobStatus('processing');

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('document_type', 'transcript');

      // Step 1: Submit the job
      const submitResponse = await apiHelpers.submitTranscriptJob(formData);
      const newJobId = submitResponse.data.job_id;
      setJobId(newJobId);

      // Step 2: Wait a moment for processing to start, then fetch results
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 3: Fetch the job results
      const statusResponse = await apiHelpers.getJobStatus(newJobId);
      // Fix: The API returns a single job object, not an array
      const job = statusResponse.data; // Remove the [0] indexing
      const document = job?.documents?.[0];

      if (!document) {
        throw new Error('Invalid job structure received from API.');
      }

      const { status, result, error: docError } = document;

      if (status === 'completed' && result) {
        setJobStatus('completed');

        const transformedResponse: TranscriptAnalysisResponse = {
          success: true,
          data: {
            job_id: newJobId,
            file_info: {
              filename: selectedFile?.name || 'Unknown',
              file_size: selectedFile?.size || 0,
              file_type: selectedFile?.type || 'application/pdf',
              uploaded_at: job.created_timestamp,
              processing_started_at: job.created_timestamp,
              processing_completed_at: document.completed_at,
              total_processing_time_seconds:
                job.processing_duration_seconds || 0, // Use the actual processing duration from API
            },
            analysis_results: {
              first_pass: result.pass_1_extraction || {},
              final_pass: result.pass_2_correction || {},
            },
            processing_metadata: {
              first_pass_confidence: 0.8, // Placeholder
              final_pass_confidence: 0.9, // Placeholder
              improvement_score: 0.1, // Placeholder
              processing_warnings: [],
              extraction_quality_score: 0.85, // Placeholder
            },
          },
        };
        setResponse(transformedResponse);
      } else if (status === 'failed') {
        setJobStatus('failed');
        const errorMessage = getErrorMessage(docError?.code, docError?.message);
        setError(errorMessage);
      } else {
        // If still processing, show a message that it may take time
        setJobStatus('processing');
        setError(
          'Processing is taking longer than expected. Please check back later or try again.'
        );
      }
    } catch (err: any) {
      console.error('Error processing transcript:', err);

      // Handle specific API errors
      if (err?.response?.data?.error?.code) {
        const errorMessage = getErrorMessage(
          err.response.data.error.code,
          err.response.data.error.message
        );
        setError(errorMessage);
      } else if (err?.response?.status === 413) {
        setError('File too large. Please use a smaller file (max 10MB).');
      } else if (err?.response?.status === 415) {
        setError(
          'Unsupported file type. Please use PDF, JPG, JPEG, or PNG files.'
        );
      } else if (err?.response?.status >= 500) {
        setError('Server error. Please try again later or contact support.');
      } else if (err?.code === 'NETWORK_ERROR') {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(
          err?.message || 'Failed to process transcript. Please try again.'
        );
      }
      setJobStatus('failed');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clears all state
   */
  const handleClear = () => {
    setSelectedFile(null);
    setJobId(null);
    setJobStatus('idle');
    setResponse(null);
    setError('');
    setLoading(false);
    // Reset file input
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // ────────────────────────────────────────
  // Error Handling Functions
  // ────────────────────────────────────────

  /**
   * Maps error codes to user-friendly error messages
   * @param errorCode - The error code from the API
   * @param defaultMessage - Default message if code is not recognized
   * @returns User-friendly error message
   */
  const getErrorMessage = (
    errorCode?: string,
    defaultMessage?: string
  ): string => {
    if (!errorCode) {
      return defaultMessage || 'Job processing failed';
    }

    switch (errorCode) {
      case 'FILE_TOO_LARGE':
        return 'The uploaded file is too large. Please use a smaller file (max 10MB).';
      case 'INVALID_FILE_TYPE':
        return 'The uploaded file type is not supported. Please use PDF, JPG, JPEG, or PNG files.';
      case 'PROCESSING_TIMEOUT':
        return 'Processing timed out. Please try again with a smaller file or contact support.';
      case 'SERVER_ERROR':
        return 'Server error occurred. Please try again later or contact support.';
      case 'INSUFFICIENT_QUOTA':
        return 'Processing quota exceeded. Please try again later or upgrade your plan.';
      case 'FILE_CORRUPTED':
        return 'The uploaded file appears to be corrupted. Please try a different file.';
      case 'UNSUPPORTED_LANGUAGE':
        return 'The document language is not supported. Please use English documents.';
      default:
        return (
          defaultMessage || 'An unexpected error occurred. Please try again.'
        );
    }
  };

  // ────────────────────────────────────────
  // Detailed Results Handler
  // ────────────────────────────────────────

  // ────────────────────────────────────────
  // Cleanup Effect
  // ────────────────────────────────────────

  useEffect(() => {
    // Cleanup function to stop polling when component unmounts
    return () => {
      // No polling to stop, but keep the effect for now
    };
  }, []);

  // ────────────────────────────────────────
  // Progress Indicators
  // ────────────────────────────────────────

  /**
   * Renders the progress indicator with status message
   * @returns Progress indicator component
   */
  const renderProgressIndicator = () => {
    if (jobStatus === 'idle') return null;

    const getStatusMessage = () => {
      switch (jobStatus) {
        case 'processing':
          return 'Processing transcript... This may take a few minutes.';
        case 'completed':
          return 'Analysis completed successfully!';
        case 'failed':
          return 'Processing failed. Please try again.';
        default:
          return '';
      }
    };

    return (
      <Card sx={{ mt: 2, mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Processing Status
            </Typography>
            {jobStatus === 'processing' && (
              <CircularProgress size={20} sx={{ ml: 1 }} />
            )}
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {getStatusMessage()}
          </Typography>

          {jobId && (
            <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Job ID: {jobId}
              </Typography>
            </Box>
          )}

          {/* Retry button for failed jobs */}
          {jobStatus === 'failed' && (
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setError('');
                  setJobStatus('processing');
                  if (selectedFile) {
                    handleSubmit();
                  }
                }}
                data-testid={TestIds.transcripts.retryButton}
              >
                Retry Processing
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  // ────────────────────────────────────────
  // Dynamic Data Rendering Functions
  // ────────────────────────────────────────

  const renderDynamicTable = (data: any, title: string, testId: string) => {
    if (!data || typeof data !== 'object') return null;

    const entries = Object.entries(data).filter(([key, value]) => {
      // Skip internal fields like _confidence
      if (key.startsWith('_')) return false;
      // Skip null/undefined values
      if (value === null || value === undefined) return false;
      return true;
    });

    if (entries.length === 0) return null;

    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          {title}
        </Typography>
        <TableContainer
          component={Paper}
          variant="outlined"
          data-testid={testId}
        >
          <Table size="small">
            <TableBody>
              {entries.map(([key, value]) => (
                <TableRow key={key}>
                  <TableCell>
                    <strong>{formatFieldName(key)}</strong>
                  </TableCell>
                  <TableCell>{renderValue(value)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  const formatFieldName = (fieldName: string): string => {
    // Convert camelCase or snake_case to readable format
    return fieldName
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/_/g, ' ') // Replace underscores with spaces
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .trim();
  };

  const renderValue = (value: any): React.ReactNode => {
    if (value === null || value === undefined) {
      return 'N/A';
    }

    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'number') {
      return value.toString();
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    if (Array.isArray(value)) {
      if (value.length === 0) return 'None';

      // If array contains objects, render as a list
      if (typeof value[0] === 'object' && value[0] !== null) {
        return (
          <Box>
            {value.map((item, index) => (
              <Box
                key={index}
                sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}
              >
                {renderObjectValue(item)}
              </Box>
            ))}
          </Box>
        );
      }

      // Simple array
      return value.join(', ');
    }

    if (typeof value === 'object') {
      return renderObjectValue(value);
    }

    return String(value);
  };

  const renderObjectValue = (obj: any): React.ReactNode => {
    const entries = Object.entries(obj).filter(([key, value]) => {
      if (key.startsWith('_')) return false;
      if (value === null || value === undefined) return false;
      return true;
    });

    if (entries.length === 0) return 'N/A';

    return (
      <Box>
        {entries.map(([key, value]) => (
          <Box key={key} sx={{ mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              {formatFieldName(key)}:
            </Typography>
            <Typography variant="body2">{renderValue(value)}</Typography>
          </Box>
        ))}
      </Box>
    );
  };

  const renderDynamicAnalysis = (
    analysisData: any,
    passType: 'first' | 'final'
  ) => {
    if (!analysisData || typeof analysisData !== 'object') return null;

    const sections = Object.entries(analysisData).filter(([key, value]) => {
      if (key.startsWith('_')) return false;
      if (value === null || value === undefined) return false;
      if (typeof value === 'object' && Object.keys(value).length === 0)
        return false;
      return true;
    });

    if (sections.length === 0) return null;

    return (
      <Card
        data-testid={
          TestIds.transcripts.analysisResults[`${passType}PassContainer`]
        }
      >
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
            color={passType === 'first' ? 'primary' : 'success.main'}
          >
            {passType === 'first' ? 'First' : 'Final'} Pass Analysis
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {sections.map(([sectionKey, sectionData]) => (
            <Box key={sectionKey}>
              {renderDynamicTable(
                sectionData,
                formatFieldName(sectionKey),
                TestIds.transcripts.analysisResults.dynamicTable(
                  passType,
                  sectionKey
                )
              )}
            </Box>
          ))}
        </CardContent>
      </Card>
    );
  };

  const renderAnalysisResults = () => {
    if (!response?.data) return null;

    const { first_pass, final_pass } = response.data.analysis_results;

    return (
      <Box
        sx={{ mt: 3 }}
        data-testid={TestIds.transcripts.analysisResults.container}
      >
        <Typography variant="h5" gutterBottom>
          Analysis Results
        </Typography>

        <Grid container spacing={3}>
          {/* First Pass */}
          <Grid item xs={12} md={6}>
            {renderDynamicAnalysis(first_pass, 'first')}
          </Grid>

          {/* Final Pass */}
          <Grid item xs={12} md={6}>
            {renderDynamicAnalysis(final_pass, 'final')}
          </Grid>
        </Grid>
      </Box>
    );
  };

  // ────────────────────────────────────────
  // Render Functions
  // ────────────────────────────────────────

  const renderFileInfo = () => {
    if (!selectedFile) return null;

    return (
      <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          Selected File:
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip label={selectedFile.name} color="primary" variant="outlined" />
          <Typography variant="body2" color="text.secondary">
            ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
          </Typography>
        </Box>
      </Box>
    );
  };

  const renderProcessingInfo = () => {
    if (!response?.data) return null;

    const { file_info, processing_metadata } = response.data;

    return (
      <Card
        sx={{ mt: 3, mb: 3 }}
        data-testid={TestIds.transcripts.processingInfo.container}
      >
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Processing Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Job ID
              </Typography>
              <Typography
                variant="body2"
                gutterBottom
                data-testid={TestIds.transcripts.processingInfo.jobId}
              >
                {response.data.job_id}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary">
                Processing Time
              </Typography>
              <Typography
                variant="body2"
                gutterBottom
                data-testid={TestIds.transcripts.processingInfo.processingTime}
              >
                {file_info.total_processing_time_seconds} seconds
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">
                First Pass Confidence
              </Typography>
              <Typography
                variant="body2"
                gutterBottom
                data-testid={
                  TestIds.transcripts.processingInfo.firstPassConfidence
                }
              >
                {(processing_metadata.first_pass_confidence * 100).toFixed(1)}%
              </Typography>

              <Typography variant="subtitle2" color="text.secondary">
                Final Pass Confidence
              </Typography>
              <Typography
                variant="body2"
                gutterBottom
                data-testid={
                  TestIds.transcripts.processingInfo.finalPassConfidence
                }
              >
                {(processing_metadata.final_pass_confidence * 100).toFixed(1)}%
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box data-testid={TestIds.transcripts.page}>
      <Typography variant="h4" component="h1" gutterBottom>
        Transcript Analysis
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Upload PDF, JPG, JPEG, or PNG files to analyze transcripts with
        AI-powered two-pass processing.
      </Typography>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          data-testid={TestIds.common.errorAlert}
        >
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Upload Document
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* File Upload */}
            <Box>
              <input
                id="file-input"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                data-testid={TestIds.transcripts.fileInput}
              />
              <label htmlFor="file-input">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUploadIcon />}
                  sx={{ mb: 1 }}
                  data-testid={TestIds.transcripts.browseButton}
                >
                  Browse Files
                </Button>
              </label>
              <Typography
                variant="caption"
                display="block"
                color="text.secondary"
              >
                Supported formats: PDF, (Max size: 10MB)
              </Typography>
            </Box>

            {/* File Info */}
            {renderFileInfo()}

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={
                  !selectedFile || loading || jobStatus === 'processing'
                }
                data-testid={TestIds.transcripts.submitButton}
              >
                {loading ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Analyzing...
                  </>
                ) : (
                  'Analyze Transcript'
                )}
              </Button>

              <Button
                variant="outlined"
                onClick={handleClear}
                disabled={!selectedFile && !response}
                data-testid={TestIds.transcripts.clearButton}
              >
                Clear
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Progress Indicator */}
      {renderProgressIndicator()}

      {/* Processing Information */}
      {renderProcessingInfo()}

      {/* Analysis Results */}
      {renderAnalysisResults()}
    </Box>
  );
};

export { Transcripts };
