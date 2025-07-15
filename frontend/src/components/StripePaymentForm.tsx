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
import WalletPaymentButton from './WalletPaymentButton';

interface StripePaymentFormProps {
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  amount: number;
  customerInfo?: {
    name: string;
    email: string;
    phone?: string;
    address: string;
    city: string;
    state?: string;
    zipCode: string;
    country: string;
  };
}

const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
  onSuccess,
  onError,
  amount,
  customerInfo
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showRetry, setShowRetry] = useState(false);

  const handleSubmit = async (event: React.FormEvent, isRetry = false) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    if (!isRetry) {
      setRetryCount(0);
      setShowRetry(false);
    }

    setIsProcessing(true);
    setMessage('');

    // Clear any existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Set a timeout for the payment (60 seconds)
    const timeout = setTimeout(() => {
      setIsProcessing(false);
      setMessage('Payment is taking longer than expected. Please try again.');
      setShowRetry(true);
      onError('Payment timeout - please try again');
    }, 60000);
    setTimeoutId(timeout);

    try {
      console.log('Starting payment confirmation...');
      
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/checkout',
        },
        redirect: 'if_required'
      });

      // Clear timeout on completion
      clearTimeout(timeout);
      setTimeoutId(null);

      if (error) {
        console.error('Payment error:', error);
        setMessage(error.message || 'An unexpected error occurred.');
        
        // Show retry option for network errors
        if (error.type === 'api_connection_error' || error.code === 'payment_intent_unexpected_state') {
          setShowRetry(true);
        }
        
        onError(error.message || 'Payment failed');
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('Payment succeeded:', paymentIntent.id);
        onSuccess(paymentIntent.id);
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'processing') {
        setMessage('Payment is processing. This may take a few moments...');
        
        // Poll for status with timeout
        let pollCount = 0;
        const pollInterval = setInterval(async () => {
          pollCount++;
          
          if (pollCount > 20) { // Stop after 20 attempts (1 minute)
            clearInterval(pollInterval);
            setMessage('Payment is still processing. You will receive a confirmation email.');
            onSuccess(paymentIntent.id); // Treat as success, webhook will handle final status
            setIsProcessing(false);
            return;
          }

          try {
            const { paymentIntent: updatedIntent } = await stripe.retrievePaymentIntent(paymentIntent.client_secret);
            
            if (updatedIntent?.status === 'succeeded') {
              clearInterval(pollInterval);
              onSuccess(updatedIntent.id);
              setIsProcessing(false);
            } else if (updatedIntent?.status === 'requires_action') {
              clearInterval(pollInterval);
              setMessage('Additional authentication required.');
              setIsProcessing(false);
            }
          } catch (pollError) {
            console.error('Error polling payment status:', pollError);
          }
        }, 3000);
        
      } else if (paymentIntent && paymentIntent.status === 'requires_action') {
        setMessage('Additional authentication required. Please complete the verification.');
        setIsProcessing(false);
      } else {
        setMessage('Payment status: ' + (paymentIntent?.status || 'unknown'));
        setShowRetry(true);
        setIsProcessing(false);
      }
    } catch (error) {
      clearTimeout(timeout);
      setTimeoutId(null);
      console.error('Payment confirmation error:', error);
      setMessage('Network error occurred. Please check your connection and try again.');
      setShowRetry(true);
      setIsProcessing(false);
      onError('Network error - please try again');
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setShowRetry(false);
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
    handleSubmit(fakeEvent, true);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="body1" gutterBottom sx={{ mb: 2 }}>
          Total Amount: <strong>${(amount / 100).toFixed(2)}</strong>
        </Typography>

        {/* Digital Wallet Payment Options */}
        {customerInfo && (
          <WalletPaymentButton
            amount={amount}
            currency="usd"
            country={customerInfo.country || 'US'}
            customerInfo={customerInfo}
            onSuccess={onSuccess}
            onError={onError}
          />
        )}
        
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
        <Alert 
          severity={
            message.includes('processing') || message.includes('confirmation email') ? 'info' : 
            message.includes('timeout') || message.includes('network') ? 'warning' : 'error'
          } 
          sx={{ mb: 2 }}
        >
          {message}
          {retryCount > 0 && (
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Attempt {retryCount + 1}
            </Typography>
          )}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <Button
          type="submit"
          variant="contained"
          fullWidth
          size="large"
          disabled={isProcessing || !stripe || !elements}
        >
          {isProcessing ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              {message.includes('processing') ? 'Processing...' : 'Confirming Payment...'}
            </>
          ) : (
            `Pay $${(amount / 100).toFixed(2)}`
          )}
        </Button>
        
        {showRetry && !isProcessing && (
          <Button
            variant="outlined"
            onClick={handleRetry}
            size="large"
            disabled={retryCount >= 3}
            sx={{ minWidth: 120 }}
          >
            {retryCount >= 3 ? 'Max Retries' : 'Retry'}
          </Button>
        )}
      </Box>
      
      {retryCount >= 3 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            Having trouble? You can:
          </Typography>
          <Typography variant="body2" component="ul" sx={{ mt: 1, pl: 2 }}>
            <li>Try using a different payment method</li>
            <li>Check your internet connection</li>
            <li>Contact support if the issue persists</li>
          </Typography>
        </Alert>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
        Your payment information is securely processed by Stripe
      </Typography>
    </form>
  );
};

export default StripePaymentForm;