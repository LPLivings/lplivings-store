import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Button,
  Paper,
  Divider,
  TextField,
  Container,
} from '@mui/material';
import { Delete, Add, Remove } from '@mui/icons-material';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '../App';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import ExpressCheckout from '../components/ExpressCheckout';
import { createOrder } from '../services/api';

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, getTotalPrice, clearCart } = useCartStore();
  const { user } = useAuthStore();
  
  console.log('Cart - User state:', user);
  console.log('Cart - Items state:', items);
  console.log('Cart - Items length:', items.length);
  console.log('Cart - Should disable button:', !user || items.length === 0);

  const handleCheckout = () => {
    console.log('HandleCheckout called - User:', user);
    console.log('HandleCheckout called - Items:', items);
    
    if (!user) {
      console.log('No user, showing alert');
      alert('Please login to checkout');
      return;
    }
    
    console.log('Navigating to checkout...');
    navigate('/checkout');
  };

  const handleExpressCheckoutSuccess = async (paymentData: any) => {
    try {
      // Create order in our system
      const order = await createOrder({
        userId: user?.id || '',
        items: paymentData.orderData.items,
        total: paymentData.orderData.totalAmount,
        status: 'processing',
        customerInfo: paymentData.orderData.customerInfo,
        paymentIntentId: paymentData.paymentIntentId
      });

      // Clear cart
      clearCart();

      // Navigate to success page with order info
      navigate('/orders', { 
        state: { 
          successMessage: `Order ${order.id} created successfully!`,
          orderId: order.id 
        } 
      });
    } catch (error) {
      console.error('Order creation failed:', error);
      alert('Payment succeeded but order creation failed. Please contact support.');
    }
  };

  const handleExpressCheckoutError = (error: string) => {
    console.error('Express checkout error:', error);
    alert(`Payment failed: ${error}`);
  };

  if (items.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h5" gutterBottom>
          Your cart is empty
        </Typography>
        <Button variant="contained" onClick={() => navigate('/products')} sx={{ mt: 2 }}>
          Continue Shopping
        </Button>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>
        Shopping Cart
      </Typography>
      
      {/* Debug info */}
      <Box sx={{ mb: 2, p: 1, bgcolor: 'info.light', borderRadius: 1 }}>
        <Typography variant="caption" display="block">
          🔍 Debug: User: {user ? '✅ Logged in' : '❌ Not logged in'} | Items: {items.length} | Button should be: {(!user || items.length === 0) ? 'disabled' : 'enabled'}
        </Typography>
      </Box>

      {/* Express Checkout Section */}
      {user && items.length > 0 && (
        <Elements stripe={stripePromise}>
          <ExpressCheckout
            items={items}
            totalAmount={getTotalPrice()}
            onSuccess={handleExpressCheckoutSuccess}
            onError={handleExpressCheckoutError}
          />
        </Elements>
      )}
      
      <List>
        {items.map((item) => (
          <React.Fragment key={item.id}>
            <ListItem
              sx={{
                py: 2,
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
              }}
            >
              <ListItemAvatar>
                <Avatar
                  src={item.image}
                  variant="rounded"
                  sx={{ width: 80, height: 80, mr: 2 }}
                />
              </ListItemAvatar>
              
              <ListItemText
                primary={item.name}
                secondary={`$${item.price} each`}
                sx={{ flex: 1 }}
              />
              
              <Box sx={{ display: 'flex', alignItems: 'center', mt: { xs: 2, sm: 0 } }}>
                <IconButton
                  size="small"
                  onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                >
                  <Remove />
                </IconButton>
                
                <TextField
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                  inputProps={{ min: 1, style: { textAlign: 'center' } }}
                  sx={{ width: 60, mx: 1 }}
                />
                
                <IconButton
                  size="small"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                >
                  <Add />
                </IconButton>
                
                <Typography sx={{ mx: 2, minWidth: 80, textAlign: 'right' }}>
                  ${(item.price * item.quantity).toFixed(2)}
                </Typography>
                
                <IconButton color="error" onClick={() => removeItem(item.id)}>
                  <Delete />
                </IconButton>
              </Box>
            </ListItem>
            <Divider />
          </React.Fragment>
        ))}
      </List>
      
      <Paper sx={{ p: 3, mt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Total:</Typography>
          <Typography variant="h6">${getTotalPrice().toFixed(2)}</Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
          <Button
            fullWidth
            variant="outlined"
            color="error"
            onClick={clearCart}
          >
            Clear Cart
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={handleCheckout}
            disabled={items.length === 0}
            sx={{ 
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 'bold',
              opacity: (!user || items.length === 0) ? 0.6 : 1
            }}
          >
            {!user ? 'Login to Checkout' : 'Proceed to Checkout'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Cart;