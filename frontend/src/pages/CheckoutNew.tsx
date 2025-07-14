import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  useTheme,
  useMediaQuery,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import {
  ShoppingCart,
  Payment,
  CheckCircle,
  LocalShipping
} from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '../App';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';
import { createPaymentIntent, confirmPayment, createOrder } from '../services/api';
import StripePaymentForm from '../components/StripePaymentForm';

const CheckoutNew: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [activeStep, setActiveStep] = useState(0);
  const [customerInfo, setCustomerInfo] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US'
  });
  const [paymentIntentClientSecret, setPaymentIntentClientSecret] = useState('');
  const [orderId, setOrderId] = useState('');

  const steps = ['Review Order', 'Shipping Info', 'Payment', 'Confirmation'];

  const totalAmount = getTotalPrice();
  const totalAmountCents = Math.round(totalAmount * 100);

  // Create payment intent when reaching payment step
  const createPaymentMutation = useMutation({
    mutationFn: async () => {
      const orderDetails = {
        orderId: `order_${Date.now()}`,
        customerId: user?.id || '',
        customerEmail: customerInfo.email,
        customerName: customerInfo.name,
        items: items.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          total: item.price * item.quantity
        })),
        totalAmount: totalAmount,
        shippingInfo: customerInfo
      };

      const response = await createPaymentIntent({
        amount: totalAmountCents,
        currency: 'usd',
        customerEmail: customerInfo.email,
        orderDetails
      });

      return response;
    },
    onSuccess: (data) => {
      setPaymentIntentClientSecret(data.clientSecret);
      setOrderId(data.orderId || `order_${Date.now()}`);
      setActiveStep(2);
    },
    onError: (error) => {
      console.error('Payment intent creation failed:', error);
    }
  });

  // Handle successful payment
  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      // Confirm payment in backend
      await confirmPayment({
        paymentIntentId,
        orderDetails: {
          orderId,
          items: items.map(item => ({
            productId: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            total: item.price * item.quantity
          })),
          totalAmount,
          customerInfo
        }
      });

      // Create order record
      await createOrder({
        userId: user?.id || '',
        items: items.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          total: item.price * item.quantity
        })),
        total: totalAmount,
        status: 'processing',
        customerInfo: customerInfo,
        paymentIntentId
      });

      // Clear cart and go to confirmation
      clearCart();
      setActiveStep(3);
    } catch (error) {
      console.error('Order creation failed:', error);
    }
  };

  const handleNext = () => {
    if (activeStep === 1) {
      // Validate shipping info
      if (!customerInfo.name || !customerInfo.email || !customerInfo.address || !customerInfo.city || !customerInfo.zipCode) {
        return;
      }
      createPaymentMutation.mutate();
    } else {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  if (items.length === 0 && activeStep !== 3) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Your cart is empty
        </Typography>
        <Button variant="contained" onClick={() => navigate('/products')}>
          Continue Shopping
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <Typography 
        variant={isMobile ? "h5" : "h4"} 
        gutterBottom 
        sx={{ fontWeight: 'bold', textAlign: 'center', mb: 3 }}
      >
        Checkout
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{isMobile ? '' : label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 3 }}>
        {/* Main Content */}
        <Box sx={{ flex: 1 }}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
            {activeStep === 0 && (
              <Box>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ShoppingCart color="primary" />
                  Review Your Order
                </Typography>
                
                <List>
                  {items.map((item) => (
                    <ListItem key={item.id} sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar src={item.image} variant="rounded" sx={{ width: 60, height: 60 }}>
                          {item.name[0]}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={item.name}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Quantity: {item.quantity}
                            </Typography>
                            <Typography variant="body2" color="primary" fontWeight="bold">
                              ${(item.price * item.quantity).toFixed(2)}
                            </Typography>
                          </Box>
                        }
                        sx={{ ml: 2 }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {activeStep === 1 && (
              <Box>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocalShipping color="primary" />
                  Shipping Information
                </Typography>
                
                <Stack spacing={2} sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                    <TextField
                      fullWidth
                      label="Phone"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </Box>
                  
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                  
                  <TextField
                    fullWidth
                    label="Address"
                    value={customerInfo.address}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                    required
                  />
                  
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      fullWidth
                      label="City"
                      value={customerInfo.city}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, city: e.target.value }))}
                      required
                    />
                    <TextField
                      fullWidth
                      label="State"
                      value={customerInfo.state}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, state: e.target.value }))}
                    />
                    <TextField
                      label="ZIP Code"
                      value={customerInfo.zipCode}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, zipCode: e.target.value }))}
                      sx={{ minWidth: 120 }}
                      required
                    />
                  </Box>
                </Stack>
              </Box>
            )}

            {activeStep === 2 && (
              <Box>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <Payment color="primary" />
                  Payment Information
                </Typography>
                
                {paymentIntentClientSecret && (
                  <Elements stripe={stripePromise} options={{ clientSecret: paymentIntentClientSecret }}>
                    <StripePaymentForm
                      amount={totalAmountCents}
                      customerInfo={customerInfo}
                      onSuccess={handlePaymentSuccess}
                      onError={(error) => {
                        console.error('Payment error:', error);
                      }}
                    />
                  </Elements>
                )}
                
                {!paymentIntentClientSecret && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress />
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      Setting up payment...
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {activeStep === 3 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CheckCircle color="success" sx={{ fontSize: 80, mb: 2 }} />
                <Typography variant="h5" gutterBottom color="success.main" fontWeight="bold">
                  Order Successful!
                </Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  Order ID: {orderId}
                </Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  Thank you for your purchase. You will receive a confirmation email shortly.
                </Typography>
                <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center', flexDirection: isMobile ? 'column' : 'row' }}>
                  <Button variant="contained" onClick={() => navigate('/products')}>
                    Continue Shopping
                  </Button>
                  <Button variant="outlined" onClick={() => navigate('/orders')}>
                    View Orders
                  </Button>
                </Box>
              </Box>
            )}

            {/* Navigation Buttons */}
            {activeStep < 2 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button
                  onClick={activeStep === 0 ? () => navigate('/cart') : handleBack}
                  disabled={createPaymentMutation.isPending}
                >
                  {activeStep === 0 ? 'Back to Cart' : 'Back'}
                </Button>
                
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={createPaymentMutation.isPending}
                  sx={{ minWidth: 120 }}
                >
                  {createPaymentMutation.isPending ? (
                    <CircularProgress size={20} />
                  ) : (
                    'Next'
                  )}
                </Button>
              </Box>
            )}

            {createPaymentMutation.error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                Error creating payment. Please try again.
              </Alert>
            )}
          </Paper>
        </Box>

        {/* Order Summary Sidebar */}
        {activeStep < 3 && (
          <Box sx={{ width: isMobile ? '100%' : 350 }}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Order Summary
                </Typography>
                
                <Box sx={{ py: 2 }}>
                  {items.slice(0, 3).map((item) => (
                    <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ flex: 1 }}>
                        {item.name} × {item.quantity}
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        ${(item.price * item.quantity).toFixed(2)}
                      </Typography>
                    </Box>
                  ))}
                  {items.length > 3 && (
                    <Typography variant="body2" color="text.secondary">
                      +{items.length - 3} more items
                    </Typography>
                  )}
                </Box>

                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Subtotal:</Typography>
                  <Typography variant="body2">${totalAmount.toFixed(2)}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Shipping:</Typography>
                  <Typography variant="body2" color="success.main">Free</Typography>
                </Box>
                
                <Divider sx={{ my: 1 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6" fontWeight="bold">Total:</Typography>
                  <Typography variant="h6" fontWeight="bold" color="primary">
                    ${totalAmount.toFixed(2)}
                  </Typography>
                </Box>

                {process.env.REACT_APP_ENVIRONMENT === 'dev' && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="caption" component="div">
                      <strong>Test mode:</strong>
                      <br />• Use card 4242 4242 4242 4242
                      <br />• Try Apple Pay/Google Pay if available on your device
                    </Typography>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default CheckoutNew;