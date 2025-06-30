/**
 * ──────────────────────────────────────────────────
 * File: src/components/Transcripts.tsx
 * Description: Transcripts management page for TondroAI CRM
 * Author: Muhammad Abubakar Khan
 * Created: 25-06-2025
 * Last Updated: 26-06-2025
 * ──────────────────────────────────────────────────
 */

import React, { useState } from 'react';
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
    job_id: string;
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

// ────────────────────────────────────────
// Main Component
// ────────────────────────────────────────

const Transcripts: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [response, setResponse] = useState<TranscriptAnalysisResponse | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // ────────────────────────────────────────
  // File Upload Handlers
  // ────────────────────────────────────────

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
        setError('Please select a valid file type (PDF, JPG, JPEG, PNG)');
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

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError('');
    setResponse(null);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Call the actual API endpoint
      const apiResponse = await apiHelpers.analyzeTranscript(formData);
      setResponse(apiResponse.data);
    } catch (err: any) {
      console.error('Error uploading transcript:', err);
      setError(err?.message || 'Failed to process transcript');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setResponse(null);
    setError('');
    // Reset file input
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
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
                Supported formats: PDF, JPG, JPEG, PNG (Max size: 10MB)
              </Typography>
            </Box>

            {/* File Info */}
            {renderFileInfo()}

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={!selectedFile || loading}
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

      {/* Processing Information */}
      {renderProcessingInfo()}

      {/* Analysis Results */}
      {renderAnalysisResults()}
    </Box>
  );
};

export { Transcripts };
