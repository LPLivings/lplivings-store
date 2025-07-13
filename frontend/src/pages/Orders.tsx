import React from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  Button,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ShoppingBag,
  CheckCircle,
  Schedule,
  LocalShipping,
  Cancel
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { getOrders } from '../services/api';

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
}

const Orders: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: () => getOrders(user?.id),
    enabled: !!user,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'success';
      case 'shipped':
        return 'info';
      case 'processing':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle />;
      case 'shipped':
        return <LocalShipping />;
      case 'processing':
        return <Schedule />;
      case 'cancelled':
        return <Cancel />;
      default:
        return <Schedule />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Please login to view your orders
        </Typography>
        <Button variant="contained" onClick={() => navigate('/')}>
          Go to Home
        </Button>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading your orders...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">
          Failed to load orders. Please try again later.
        </Alert>
      </Container>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <ShoppingBag sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          No orders found
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          You haven't placed any orders yet.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/products')} sx={{ mt: 2 }}>
          Start Shopping
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <Typography 
        variant={isMobile ? "h5" : "h4"} 
        gutterBottom 
        sx={{ fontWeight: 'bold', mb: 3 }}
      >
        Your Orders
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {orders.map((order: Order) => (
          <Card key={order.id} elevation={2} sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              {/* Order Header */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                flexDirection: isMobile ? 'column' : 'row',
                gap: 2,
                mb: 3
              }}>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    Order #{order.id.slice(-8).toUpperCase()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Placed on {formatDate(order.createdAt)}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Chip
                    icon={getStatusIcon(order.status)}
                    label={order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    color={getStatusColor(order.status) as any}
                    variant="outlined"
                    size="small"
                  />
                  <Typography variant="h6" fontWeight="bold" color="primary">
                    ${order.total.toFixed(2)}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ mb: 2 }} />

              {/* Order Items */}
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                Items ({order.items.length})
              </Typography>
              
              <List sx={{ py: 0 }}>
                {order.items.map((item, index) => (
                  <ListItem key={index} sx={{ px: 0, py: 1 }}>
                    <ListItemAvatar>
                      <Avatar variant="rounded" sx={{ width: 50, height: 50 }}>
                        {item.name[0]}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={item.name}
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Typography variant="body2" color="text.secondary">
                            Quantity: {item.quantity} × ${item.price.toFixed(2)}
                          </Typography>
                          <Typography variant="body2" color="primary" fontWeight="bold">
                            Subtotal: ${(item.price * item.quantity).toFixed(2)}
                          </Typography>
                        </Box>
                      }
                      sx={{ ml: 2 }}
                    />
                  </ListItem>
                ))}
              </List>

              {/* Order Actions */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                gap: 2, 
                mt: 2,
                flexDirection: isMobile ? 'column' : 'row'
              }}>
                {order.status === 'delivered' && (
                  <Button variant="outlined" size="small">
                    Reorder
                  </Button>
                )}
                <Button variant="outlined" size="small">
                  View Details
                </Button>
                {order.status === 'shipped' && (
                  <Button variant="contained" size="small">
                    Track Package
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Back to Shopping */}
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Button variant="contained" onClick={() => navigate('/products')}>
          Continue Shopping
        </Button>
      </Box>
    </Container>
  );
};

export default Orders;