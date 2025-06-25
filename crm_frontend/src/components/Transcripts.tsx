/**
 * ──────────────────────────────────────────────────
 * File: src/components/Transcripts.tsx
 * Description: Transcripts management page for TondroAI CRM
 * Author: Muhammad Abubakar Khan
 * Created: 25-06-2025
 * Last Updated: 25-06-2025
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import { TestIds } from '../testIds';

// ────────────────────────────────────────
// Type Definitions
// ────────────────────────────────────────

interface TranscriptResponse {
  success: boolean;
  data?: any;
  error?: string;
  format: 'json' | 'xml';
}

// ────────────────────────────────────────
// Main Component
// ────────────────────────────────────────

const Transcripts: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [response, setResponse] = useState<TranscriptResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [responseFormat, setResponseFormat] = useState<'json' | 'xml'>('json');

  // ────────────────────────────────────────
  // File Upload Handlers
  // ────────────────────────────────────────

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please select a valid file type (PDF, JPG, JPEG)');
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
      formData.append('format', responseFormat);

      // TODO: Replace with actual API endpoint
      // const response = await apiHelpers.uploadTranscript(formData);
      
      // Mock response for now
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay
      
      const mockResponse: TranscriptResponse = {
        success: true,
        data: {
          extracted_text: "Sample extracted text from the document...",
          confidence: 0.95,
          pages: 1,
          language: "en",
          metadata: {
            filename: selectedFile.name,
            size: selectedFile.size,
            type: selectedFile.type,
            uploaded_at: new Date().toISOString()
          }
        },
        format: responseFormat
      };

      setResponse(mockResponse);
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
          <Chip 
            label={selectedFile.name} 
            color="primary" 
            variant="outlined"
          />
          <Typography variant="body2" color="text.secondary">
            ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
          </Typography>
        </Box>
      </Box>
    );
  };

  const renderResponse = () => {
    if (!response) return null;

    return (
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Extracted Data ({response.format.toUpperCase()})
          </Typography>
          <Paper 
            sx={{ 
              p: 2, 
              bgcolor: 'grey.50', 
              maxHeight: 400, 
              overflow: 'auto',
              fontFamily: 'monospace',
              fontSize: '0.875rem'
            }}
          >
            <pre>
              {response.format === 'json' 
                ? JSON.stringify(response.data, null, 2)
                : response.data // For XML, we'd format it properly
              }
            </pre>
          </Paper>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box data-testid={TestIds.transcripts.page}>
      <Typography variant="h4" component="h1" gutterBottom>
        Transcripts
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Upload PDF, JPG, or JPEG files to extract and view transcript data in JSON or XML format.
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
                accept=".pdf,.jpg,.jpeg"
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
              <Typography variant="caption" display="block" color="text.secondary">
                Supported formats: PDF, JPG, JPEG (Max size: 10MB)
              </Typography>
            </Box>

            {/* Response Format Selection */}
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Response Format</InputLabel>
              <Select
                value={responseFormat}
                label="Response Format"
                onChange={(e) => setResponseFormat(e.target.value as 'json' | 'xml')}
                data-testid={TestIds.transcripts.formatSelect}
              >
                <MenuItem value="json">JSON</MenuItem>
                <MenuItem value="xml">XML</MenuItem>
              </Select>
            </FormControl>

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
                    Processing...
                  </>
                ) : (
                  'Submit'
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

      {/* Response Display */}
      {renderResponse()}
    </Box>
  );
};

export { Transcripts }; 