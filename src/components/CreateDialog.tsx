/**
 * ──────────────────────────────────────────────────
 * File: client/src/components/CreateDialog.tsx
 * Description: Reusable dialog component for creating entities in TondroAI CRM
 * Author: Muhammad Abubakar Khan
 * Created: 18-06-2025
 * Last Updated: 20-06-2025
 * ──────────────────────────────────────────────────
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Alert,
  CircularProgress,
  Box,
  type SelectChangeEvent,
} from '@mui/material';
import { TestIds } from '../testIds';

// ────────────────────────────────────────
// Type Definitions
// ────────────────────────────────────────

interface FieldOption {
  value: string;
  label: string;
}

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'url' | 'number' | 'select' | 'textarea';
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
  options?: FieldOption[];
}

interface CreateDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, any>) => void;
  title: string;
  fields: FormField[];
  loading?: boolean;
  error?: string | null;
  initialData?: Record<string, any>;
}

// ────────────────────────────────────────
// Main Component
// ────────────────────────────────────────

const CreateDialog: React.FC<CreateDialogProps> = ({
  open,
  onClose,
  onSubmit,
  title,
  fields,
  loading = false,
  error = null,
  initialData = {},
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Initialize form data when dialog opens
  useEffect(() => {
    if (open) {
      const initialFormData: Record<string, any> = {};
      fields.forEach((field) => {
        initialFormData[field.name] =
          initialData[field.name] || field.defaultValue || '';
      });
      setFormData(initialFormData);
      setValidationErrors({});
    }
  }, [open, fields, initialData]);

  const handleInputChange = (fieldName: string, value: any): void => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));

    // Clear validation error when user starts typing
    if (validationErrors[fieldName]) {
      setValidationErrors((prev) => ({ ...prev, [fieldName]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    fields.forEach((field) => {
      const value = formData[field.name];

      // Required field validation
      if (field.required && (!value || value.toString().trim() === '')) {
        errors[field.name] = `${field.label} is required`;
      }

      // Email validation
      if (
        field.type === 'email' &&
        value &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      ) {
        errors[field.name] = 'Please enter a valid email address';
      }

      // URL validation
      if (field.type === 'url' && value && !/^https?:\/\/.+/.test(value)) {
        errors[field.name] = 'Please enter a valid URL';
      }

      // Min length validation
      if (field.minLength && value && value.length < field.minLength) {
        errors[field.name] =
          `${field.label} must be at least ${field.minLength} characters`;
      }

      // Max length validation
      if (field.maxLength && value && value.length > field.maxLength) {
        errors[field.name] =
          `${field.label} must be no more than ${field.maxLength} characters`;
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (): void => {
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleClose = (): void => {
    setFormData({});
    setValidationErrors({});
    onClose();
  };

  const renderField = (field: FormField): React.ReactElement => {
    const value = formData[field.name] || '';
    const error = validationErrors[field.name];
    const hasError = !!error;

    switch (field.type) {
      case 'select':
        return (
          <FormControl fullWidth error={hasError}>
            <InputLabel>{field.label}</InputLabel>
            <Select
              value={value}
              onChange={(e: SelectChangeEvent) =>
                handleInputChange(field.name, e.target.value)
              }
              label={field.label}
              data-testid={TestIds.createDialog.field(field.name)}
            >
              {field.options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'textarea':
        return (
          <TextField
            fullWidth
            label={field.label}
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            multiline
            rows={field.rows || 3}
            error={hasError}
            helperText={error}
            required={!!field.required}
            placeholder={field.placeholder ?? ""}
            data-testid={TestIds.createDialog.field(field.name)}
          />
        );

      case 'number':
        return (
          <TextField
            fullWidth
            label={field.label}
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            type="number"
            error={hasError}
            helperText={error}
            required={!!field.required}
            placeholder={field.placeholder ?? ""}
            inputProps={{
              min: field.min,
              max: field.max,
              step: field.step,
            }}
            data-testid={TestIds.createDialog.field(field.name)}
          />
        );

      default: // text, email, url, etc.
        return (
          <TextField
            fullWidth
            label={field.label}
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            type={field.type || 'text'}
            error={hasError}
            helperText={error}
            required={!!field.required}
            placeholder={field.placeholder ?? ""}
            disabled={!!field.disabled}
            data-testid={TestIds.createDialog.field(field.name)}
          />
        );
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      data-testid={TestIds.createDialog.container}
    >
      <DialogTitle data-testid={TestIds.createDialog.title}>
        {title}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {error && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
              data-testid={TestIds.createDialog.error}
            >
              {error}
            </Alert>
          )}

          <Grid container spacing={2}>
            {fields.map((field) => (
              <Grid item xs={12} sm={field.fullWidth ? 12 : 6} key={field.name}>
                {renderField(field)}
              </Grid>
            ))}
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleClose}
          disabled={loading}
          data-testid={TestIds.createDialog.cancel}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : null}
          data-testid={TestIds.createDialog.submit}
        >
          {loading ? 'Creating...' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateDialog;

// ──────────────────────────────────────────────────
// End of File: client/src/components/CreateDialog.tsx
// ──────────────────────────────────────────────────
