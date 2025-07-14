import React, { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import {
  Box,
  Button,
  CircularProgress,
  Alert,
  Typography
} from '@mui/material';

interface StripePaymentFormProps {
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  amount: number;
}

const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
  onSuccess,
  onError,
  amount
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setMessage('');

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Return URL is required but we handle success in the same page
        return_url: window.location.origin + '/checkout',
      },
      redirect: 'if_required' // Only redirect if additional action is required (3D Secure)
    });

    if (error) {
      // This point is reached if there's an immediate error when confirming the payment
      setMessage(error.message || 'An unexpected error occurred.');
      onError(error.message || 'Payment failed');
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      // Payment succeeded
      onSuccess(paymentIntent.id);
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'processing') {
      // Payment is processing
      setMessage('Payment is processing. Please wait...');
      // In production, you'd want to poll for the status or use webhooks
      setTimeout(() => {
        onSuccess(paymentIntent.id);
        setIsProcessing(false);
      }, 3000);
    } else {
      // Handle other statuses
      setMessage('Payment status: ' + (paymentIntent?.status || 'unknown'));
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="body1" gutterBottom sx={{ mb: 2 }}>
          Total Amount: <strong>${(amount / 100).toFixed(2)}</strong>
        </Typography>
        
        <PaymentElement 
          options={{
            layout: 'tabs',
            fields: {
              billingDetails: {
                address: 'auto'
              }
            }
          }}
        />
      </Box>

      {message && (
        <Alert severity={message.includes('processing') ? 'info' : 'error'} sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      <Button
        type="submit"
        variant="contained"
        fullWidth
        size="large"
        disabled={isProcessing || !stripe || !elements}
        sx={{ mt: 2 }}
      >
        {isProcessing ? (
          <>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            Processing...
          </>
        ) : (
          `Pay $${(amount / 100).toFixed(2)}`
        )}
      </Button>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
        Your payment information is securely processed by Stripe
      </Typography>
    </form>
  );
};

export default StripePaymentForm;