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
} from '@mui/material';
import { Delete, Add, Remove } from '@mui/icons-material';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import { useNavigate } from 'react-router-dom';

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, getTotalPrice, clearCart } = useCartStore();
  const { user } = useAuthStore();

  const handleCheckout = () => {
    if (!user) {
      alert('Please login to checkout');
      return;
    }
    navigate('/checkout');
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
    <Box>
      <Typography variant="h4" gutterBottom>
        Shopping Cart
      </Typography>
      
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
          >
            Proceed to Checkout
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Cart;