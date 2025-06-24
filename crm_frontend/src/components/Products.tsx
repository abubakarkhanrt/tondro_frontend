/**
 * ──────────────────────────────────────────────────
 * File: client/src/components/Products.tsx
 * Description: Products management page for TondroAI CRM
 * Author: Muhammad Abubakar Khan
 * Created: 18-06-2025
 * Last Updated: 20-06-2025
 * ──────────────────────────────────────────────────
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  TablePagination,
  Snackbar,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { apiHelpers } from '../services/api';
import {
  type Product,
  type CreateProductRequest,
  type UpdateProductRequest,
} from '../types';
import axios from 'axios';
import { TestIds } from '../testIds';
import { getButtonProps } from '../utils/buttonStyles';

// ────────────────────────────────────────
// Type Definitions
// ────────────────────────────────────────

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

// ────────────────────────────────────────
// Main Component
// ────────────────────────────────────────

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 0,
    pageSize: 50,
    total: 0,
  });
  const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    // Add a small delay to ensure token is available after login
    const timer = setTimeout(() => {
      const token = localStorage.getItem('jwt_token');
      if (token) {
        fetchProducts();
      } else {
        setError('No authentication token found. Please login again.');
        setLoading(false);
      }
    }, 100); // Small delay to ensure token is set

    return () => {
      clearTimeout(timer);
      // Cancel any ongoing requests when component unmounts
      if (abortController) {
        abortController.abort();
      }
    };
  }, []);

  const fetchProducts = async (): Promise<void> => {
    // Cancel any existing request
    if (abortController) {
      abortController.abort();
    }

    // Create new abort controller
    const controller = apiHelpers.createAbortController();
    setAbortController(controller);

    setLoading(true);
    setError('');

    try {
      // Double-check token before making request
      const token = localStorage.getItem('jwt_token');
      if (!token) {
        setError('Authentication token not found. Please login again.');
        setLoading(false);
        return;
      }

      const response = await apiHelpers.getProducts(controller.signal);
      setProducts(response.data || []);
      setPagination((prev) => ({
        ...prev,
        total: response.data.length || 0,
      }));
    } catch (error: any) {
      // Don't show error for cancelled requests
      if (axios.isCancel(error)) {
        return;
      }

      console.error('Error fetching products:', error);
      if (error.response && error.response.status === 401) {
        setError('Authentication failed. Please login again.');
      } else {
        setError('Failed to load products. Please try again.');
      }
    } finally {
      setLoading(false);
      setAbortController(null);
    }
  };

  const handleCreateProduct = async (
    formData: CreateProductRequest
  ): Promise<void> => {
    try {
      await apiHelpers.createProduct(formData);
      setSnackbar({
        open: true,
        message: 'Product created successfully',
        severity: 'success',
      });
      setCreateDialogOpen(false);
      fetchProducts();
    } catch (error) {
      console.error('Error creating product:', error);
      setSnackbar({
        open: true,
        message: 'Failed to create product',
        severity: 'error',
      });
    }
  };

  const handleDeleteProduct = async (_id: string): Promise<void> => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      // Note: The API doesn't have a delete endpoint for products, so we'll just show a message
      setSnackbar({
        open: true,
        message: 'Product deletion not implemented in API',
        severity: 'warning',
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete product',
        severity: 'error',
      });
    }
  };

  const handlePageChange = (_event: unknown, newPage: number): void => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setPagination((prev) => ({
      ...prev,
      pageSize: parseInt(event.target.value, 10),
      page: 0,
    }));
  };

  const handleUpdateProduct = async (
    formData: UpdateProductRequest
  ): Promise<void> => {
    if (!selectedProduct) return;

    try {
      await apiHelpers.updateProduct(selectedProduct.id, formData);
      setSnackbar({
        open: true,
        message: 'Product updated successfully',
        severity: 'success',
      });
      setSelectedProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update product',
        severity: 'error',
      });
    }
  };

  // ────────────────────────────────────────
  // Products Table Component
  // ────────────────────────────────────────

  const ProductsTable: React.FC = () => (
    <Card data-testid={TestIds.products.table}>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant="h6">Products ({pagination.total})</Typography>
          <Button
            {...getButtonProps('create')}
            onClick={() => setCreateDialogOpen(true)}
            data-testid={TestIds.products.createButton}
          >
            Create Product
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress data-testid={TestIds.common.loadingSpinner} />
          </Box>
        ) : error ? (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            data-testid={TestIds.common.errorAlert}
          >
            {error}
          </Alert>
        ) : (
          <>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {product.name}
                        </Typography>
                      </TableCell>
                      <TableCell>{product.description}</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: product.currency || 'USD',
                        }).format(product.price)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={product.status}
                          color={
                            product.status === 'Active' ? 'success' : 'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(product.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedProduct(product);
                            }}
                            data-testid={TestIds.products.viewDetails(
                              product.id
                            )}
                          >
                            <VisibilityIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedProduct(product);
                            }}
                            data-testid={TestIds.products.edit(product.id)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteProduct(product.id)}
                            data-testid={TestIds.products.delete(product.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={pagination.total}
              page={pagination.page}
              onPageChange={handlePageChange}
              rowsPerPage={pagination.pageSize}
              onRowsPerPageChange={handlePageSizeChange}
              rowsPerPageOptions={[10, 25, 50, 100]}
              data-testid={TestIds.entityTable.pagination}
            />
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box data-testid={TestIds.products.page}>
      <Typography variant="h4" component="h1" gutterBottom>
        Products
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

      <ProductsTable />

      <CreateProductDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateProduct}
      />

      {selectedProduct && (
        <>
          <ViewProductDialog
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onUpdate={fetchProducts}
          />
          <EditProductDialog
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onSubmit={handleUpdateProduct}
          />
        </>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
          data-testid={
            snackbar.severity === 'success'
              ? TestIds.common.successAlert
              : TestIds.common.errorAlert
          }
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// ────────────────────────────────────────
// Create Product Dialog Component
// ────────────────────────────────────────

interface CreateProductDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProductRequest) => Promise<void>;
}

const CreateProductDialog: React.FC<CreateProductDialogProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<CreateProductRequest>({
    name: '',
    description: '',
  });
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (): Promise<void> => {
    if (!formData.name.trim()) {
      alert('Please enter a product name');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      setFormData({ name: '', description: '' });
    } catch (error) {
      console.error('Error in create dialog:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Product</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <TextField
            fullWidth
            label="Product Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            required
            placeholder="Enter product name"
          />
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            margin="normal"
            multiline
            rows={3}
            placeholder="Enter product description"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? 'Creating...' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ────────────────────────────────────────
// View Product Dialog Component
// ────────────────────────────────────────

interface ViewProductDialogProps {
  product: Product;
  onClose: () => void;
  onUpdate: () => void;
}

const ViewProductDialog: React.FC<ViewProductDialogProps> = ({
  product,
  onClose,
  onUpdate,
}) => {
  return (
    <Dialog open={!!product} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Product Details: {product?.name}</DialogTitle>
      <DialogContent>
        {product && (
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  ID
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {product.id}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Name
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {product.name}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Description
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {product.description || 'No description provided'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Created
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {new Date(product.created_at).toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Updated
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {new Date(product.updated_at).toLocaleString()}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onUpdate}>Edit</Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

// ────────────────────────────────────────
// Edit Product Dialog Component
// ────────────────────────────────────────

interface EditProductDialogProps {
  product: Product;
  onClose: () => void;
  onSubmit: (data: UpdateProductRequest) => Promise<void>;
}

const EditProductDialog: React.FC<EditProductDialogProps> = ({
  product,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<UpdateProductRequest>({
    name: product.name,
    description: product.description,
  });
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (): Promise<void> => {
    if (!formData.name?.trim()) {
      alert('Please enter a product name');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error in edit dialog:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!product} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Product</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <TextField
            fullWidth
            label="Product Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            margin="normal"
            multiline
            rows={3}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? 'Updating...' : 'Update'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Products;

// ──────────────────────────────────────────────────
// End of File: client/src/components/Products.tsx
// ──────────────────────────────────────────────────
