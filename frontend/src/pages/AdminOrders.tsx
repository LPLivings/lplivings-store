import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Grid2 as Grid,
  Collapse,
  IconButton
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Edit,
  Visibility,
  LocalShipping
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrders, updateOrderStatus } from '../services/api';
import useAuthStore from '../store/authStore';

interface Order {
  id: string;
  userId: string;
  items: any[];
  total: number;
  status: string;
  createdAt: string;
  customerInfo: any;
  trackingNumber?: string;
  statusHistory?: Array<{
    status: string;
    timestamp: string;
    updatedBy: string;
    trackingNumber?: string;
  }>;
}

const AdminOrders: React.FC = () => {
  const { isAdmin } = useAuthStore();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [newTrackingNumber, setNewTrackingNumber] = useState('');
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  const statusColors: { [key: string]: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' } = {
    pending: 'warning',
    processing: 'info',
    shipped: 'primary',
    delivered: 'success',
    cancelled: 'error',
    refunded: 'secondary'
  };

  const { data: ordersData, isLoading, error } = useQuery({
    queryKey: ['orders', 'admin'],
    queryFn: () => getOrders(), // Will get all orders if admin
    enabled: isAdmin(),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status, trackingNumber }: { orderId: string; status: string; trackingNumber?: string }) => {
      return updateOrderStatus(orderId, { status, trackingNumber });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setEditDialogOpen(false);
      setSelectedOrder(null);
      setNewStatus('');
      setNewTrackingNumber('');
    },
    onError: (error: any) => {
      console.error('Failed to update order status:', error);
    }
  });

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setNewTrackingNumber(order.trackingNumber || '');
    setEditDialogOpen(true);
  };

  const handleUpdateStatus = () => {
    if (selectedOrder && newStatus) {
      updateStatusMutation.mutate({
        orderId: selectedOrder.id,
        status: newStatus,
        trackingNumber: newTrackingNumber
      });
    }
  };

  const toggleOrderExpansion = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  if (!isAdmin()) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <Alert severity="error">
          Access denied. Admin privileges required.
        </Alert>
        <Typography variant="body2" sx={{ mt: 2 }}>
          Add ?admin=true to the URL or configure admin emails.
        </Typography>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Loading orders...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Failed to load orders. Please try again.
        </Alert>
      </Container>
    );
  }

  const orders = ordersData?.orders || [];
  const totalOrders = ordersData?.totalOrders || 0;

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant={isMobile ? "h5" : "h4"} fontWeight="bold">
          Order Management
        </Typography>
        <Chip 
          label={`${totalOrders} Total Orders`} 
          color="primary" 
          variant="outlined" 
        />
      </Box>

      {orders.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No orders found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Orders will appear here once customers start making purchases.
          </Typography>
        </Paper>
      ) : (
        <>
          {/* Mobile view */}
          {isMobile ? (
            <Grid container spacing={2}>
              {orders.map((order: Order) => (
                <Grid size={{ xs: 12 }} key={order.id}>
                  <Card elevation={2}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {order.id}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(order.createdAt)}
                          </Typography>
                        </Box>
                        <Chip 
                          label={order.status.toUpperCase()} 
                          color={statusColors[order.status] || 'default'} 
                          size="small"
                        />
                      </Box>

                      <Typography variant="body2" gutterBottom>
                        Customer: {order.customerInfo?.name || 'N/A'}
                      </Typography>
                      
                      <Typography variant="body2" gutterBottom>
                        Email: {order.customerInfo?.email || 'N/A'}
                      </Typography>

                      <Typography variant="h6" color="primary" gutterBottom>
                        {formatCurrency(order.total)}
                      </Typography>

                      {order.trackingNumber && (
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          Tracking: {order.trackingNumber}
                        </Typography>
                      )}

                      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Edit />}
                          onClick={() => handleEditOrder(order)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          variant="text"
                          startIcon={expandedOrders.has(order.id) ? <ExpandLess /> : <ExpandMore />}
                          onClick={() => toggleOrderExpansion(order.id)}
                        >
                          Details
                        </Button>
                      </Box>

                      <Collapse in={expandedOrders.has(order.id)}>
                        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Items:
                          </Typography>
                          {order.items.map((item, index) => (
                            <Typography key={index} variant="body2" color="text.secondary">
                              {item.name} × {item.quantity} = {formatCurrency(item.price * item.quantity)}
                            </Typography>
                          ))}
                          
                          {order.customerInfo?.address && (
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="subtitle2" gutterBottom>
                                Shipping Address:
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {order.customerInfo.address}, {order.customerInfo.city} {order.customerInfo.zipCode}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Collapse>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            /* Desktop view */
            <TableContainer component={Paper} elevation={2}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'grey.50' }}>
                    <TableCell><strong>Order ID</strong></TableCell>
                    <TableCell><strong>Customer</strong></TableCell>
                    <TableCell><strong>Items</strong></TableCell>
                    <TableCell><strong>Total</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Date</strong></TableCell>
                    <TableCell><strong>Tracking</strong></TableCell>
                    <TableCell><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.map((order: Order) => (
                    <TableRow key={order.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {order.id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {order.customerInfo?.name || 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {order.customerInfo?.email || 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold" color="primary">
                          {formatCurrency(order.total)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={order.status.toUpperCase()} 
                          color={statusColors[order.status] || 'default'} 
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(order.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {order.trackingNumber || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleEditOrder(order)}
                            sx={{ color: 'primary.main' }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* Edit Order Status Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Update Order Status
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Order ID: {selectedOrder.id}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Customer: {selectedOrder.customerInfo?.name}
              </Typography>
              
              <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={newStatus}
                  label="Status"
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="processing">Processing</MenuItem>
                  <MenuItem value="shipped">Shipped</MenuItem>
                  <MenuItem value="delivered">Delivered</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                  <MenuItem value="refunded">Refunded</MenuItem>
                </Select>
              </FormControl>

              {(newStatus === 'shipped' || newStatus === 'delivered' || selectedOrder.trackingNumber) && (
                <TextField
                  fullWidth
                  label="Tracking Number"
                  value={newTrackingNumber}
                  onChange={(e) => setNewTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number"
                  InputProps={{
                    startAdornment: <LocalShipping sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleUpdateStatus}
            disabled={updateStatusMutation.isPending || !newStatus}
          >
            {updateStatusMutation.isPending ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                Updating...
              </>
            ) : (
              'Update Status'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {updateStatusMutation.error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Failed to update order status. Please try again.
        </Alert>
      )}
    </Container>
  );
};

export default AdminOrders;