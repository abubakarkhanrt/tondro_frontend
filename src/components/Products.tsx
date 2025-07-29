/**
 * ──────────────────────────────────────────────────
 * File: client/src/components/Products.tsx
 * Description: Products management page for TondroAI CRM
 * Author: Muhammad Abubakar Khan
 * Created: 18-06-2025
 * Last Updated: 03-07-2025
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
  IconButton,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { apiHelpers } from '../services/api';
import {
  type Product,
  type CreateProductRequest,
  type UpdateProductRequest,
} from '../types';
import { TestIds } from '../testIds';
import { getButtonProps } from '../utils/buttonStyles';
import { useEntityState, usePagination, useEntityData } from '../hooks';
import { useAuth } from '../contexts/AuthContext';
import { PERMISSIONS } from '../config/roles';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { useAlert } from '@/contexts/AlertContext';

// ────────────────────────────────────────
// Main Component
// ────────────────────────────────────────

const Products: React.FC = () => {
  const { hasPermission } = useAuth();
  const { showAlert } = useAlert();
  // Use shared state management hook
  const {
    entityState,
    setEntityState,
    pagination,
    setPagination,
    createDialogOpen,
    setCreateDialogOpen,
    selectedEntity: selectedProduct,
    setSelectedEntity: setSelectedProduct,
    editMode,
    setEditMode,
  } = useEntityState<Product>({}, 50);

  // Use shared pagination hook
  const paginationHandlers = usePagination(pagination, setPagination);

  // Use shared data fetching hook
  const { fetchData, refetch } = useEntityData(
    entityState,
    setEntityState,
    setPagination,
    {
      fetchFunction: async options => {
        const response = await apiHelpers.getProducts(options?.signal);
        const responseData = response.data;

        // Handle different response formats
        if (
          responseData &&
          typeof responseData === 'object' &&
          'products' in responseData
        ) {
          // New format: ProductsResponse
          return {
            data: {
              items: responseData.products || [],
              total: responseData.total || 0,
            },
          };
        } else {
          // Legacy format: direct array
          return {
            data: responseData as Product[],
          };
        }
      },
      filters: {},
      pagination,
      enabled: false, // We'll manually trigger the fetch
    }
  );

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateProduct = async (
    formData: CreateProductRequest
  ): Promise<void> => {
    try {
      await apiHelpers.createProduct(formData);
      showAlert('Product created successfully', 'success');
      setCreateDialogOpen(false);
      refetch();
    } catch (error) {
      showAlert(getApiErrorMessage(error), 'error');
    }
  };

  const handleUpdateProduct = async (
    formData: UpdateProductRequest
  ): Promise<void> => {
    if (!selectedProduct) return;
    try {
      await apiHelpers.updateProduct(selectedProduct.id as number, formData);
      showAlert('Product updated successfully', 'success');
      setSelectedProduct(null);
      refetch();
    } catch (error) {
      showAlert(getApiErrorMessage(error), 'error');
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
          {hasPermission(PERMISSIONS.PRODUCT_CREATE) && (
            <Button
              {...getButtonProps('create')}
              onClick={() => setCreateDialogOpen(true)}
              data-testid={TestIds.products.createButton}
            >
              Create Product
            </Button>
          )}
        </Box>

        {entityState.loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress data-testid={TestIds.common.loadingSpinner} />
          </Box>
        ) : entityState.error ? (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            data-testid={TestIds.common.errorAlert}
          >
            {entityState.error}
          </Alert>
        ) : (
          <>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {entityState.data.map(product => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {product.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {product.description || 'No description provided'}
                      </TableCell>
                      <TableCell>
                        {new Date(product.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {hasPermission(PERMISSIONS.PRODUCT_READ) && (
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedProduct(product);
                                setEditMode(false);
                              }}
                              data-testid={TestIds.products.viewDetails(
                                product.id as number
                              )}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          )}
                          {hasPermission(PERMISSIONS.PRODUCT_UPDATE) && (
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedProduct(product);
                                setEditMode(true);
                              }}
                              data-testid={TestIds.products.edit(
                                product.id as number
                              )}
                            >
                              <EditIcon />
                            </IconButton>
                          )}
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
              onPageChange={paginationHandlers.handlePageChange}
              rowsPerPage={pagination.page_size}
              onRowsPerPageChange={paginationHandlers.handlePageSizeChange}
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

      {entityState.error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          data-testid={TestIds.common.errorAlert}
        >
          {entityState.error}
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
          {!editMode && (
            <ViewProductDialog
              product={selectedProduct}
              onClose={() => {
                setSelectedProduct(null);
                setEditMode(false);
              }}
              onEdit={() => {
                setSelectedProduct(selectedProduct);
                setEditMode(true);
              }}
            />
          )}
          {editMode && (
            <EditProductDialog
              product={selectedProduct}
              onClose={() => {
                setSelectedProduct(null);
                setEditMode(false);
              }}
              onSubmit={handleUpdateProduct}
            />
          )}
        </>
      )}
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
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      data-testid={TestIds.products.createDialog.container}
    >
      <DialogTitle data-testid={TestIds.products.createDialog.title}>
        Create New Product
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <TextField
            fullWidth
            label="Product Name"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            required
            placeholder="Enter product name"
            data-testid={TestIds.products.createDialog.name}
            inputProps={{
              'data-testid': TestIds.products.createDialog.name,
              'aria-label': 'Product name input',
            }}
          />
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={e =>
              setFormData({ ...formData, description: e.target.value })
            }
            margin="normal"
            multiline
            rows={3}
            placeholder="Enter product description"
            data-testid={TestIds.products.createDialog.description}
            inputProps={{
              'data-testid': TestIds.products.createDialog.description,
              'aria-label': 'Product description input',
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          data-testid={TestIds.products.createDialog.cancel}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          data-testid={TestIds.products.createDialog.submit}
        >
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
  onEdit: () => void;
}

const ViewProductDialog: React.FC<ViewProductDialogProps> = ({
  product,
  onClose,
  onEdit,
}) => {
  return (
    <Dialog
      open={!!product}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      data-testid={TestIds.products.viewDialog.container}
    >
      <DialogTitle data-testid={TestIds.products.viewDialog.title}>
        Product Details: {product?.display_name || product?.name}
      </DialogTitle>
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
              {/* {product.price !== undefined && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Price
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {product.price} {product.currency || 'USD'}
                  </Typography>
                </Grid>
              )} */}
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
        <Button
          onClick={onEdit}
          data-testid={TestIds.products.viewDialog.editButton}
        >
          Edit
        </Button>
        <Button
          onClick={onClose}
          data-testid={TestIds.products.viewDialog.closeButton}
        >
          Close
        </Button>
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
    description: product.description || '',
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
    <Dialog
      open={!!product}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      data-testid={TestIds.products.editDialog.container}
    >
      <DialogTitle data-testid={TestIds.products.editDialog.title}>
        Edit Product
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <TextField
            fullWidth
            label="Product Name"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            required
            data-testid={TestIds.products.editDialog.name}
            inputProps={{
              'data-testid': TestIds.products.editDialog.name,
              'aria-label': 'Product name input',
            }}
          />
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={e =>
              setFormData({ ...formData, description: e.target.value })
            }
            margin="normal"
            multiline
            rows={3}
            data-testid={TestIds.products.editDialog.description}
            inputProps={{
              'data-testid': TestIds.products.editDialog.description,
              'aria-label': 'Product description input',
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          data-testid={TestIds.products.editDialog.cancel}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          data-testid={TestIds.products.editDialog.submit}
        >
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
