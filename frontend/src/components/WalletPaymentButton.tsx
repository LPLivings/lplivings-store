import React, { useEffect, useState } from 'react';
import {
  PaymentRequestButtonElement,
  useStripe
} from '@stripe/react-stripe-js';
import {
  Box,
  Alert,
  Typography,
  Divider
} from '@mui/material';

interface WalletPaymentButtonProps {
  amount: number;
  currency: string;
  country: string;
  customerInfo: {
    name: string;
    email: string;
    phone?: string;
    address: string;
    city: string;
    state?: string;
    zipCode: string;
    country: string;
  };
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
}

const WalletPaymentButton: React.FC<WalletPaymentButtonProps> = ({
  amount,
  currency,
  country,
  customerInfo,
  onSuccess,
  onError
}) => {
  const stripe = useStripe();
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const [canMakePayment, setCanMakePayment] = useState(false);

  useEffect(() => {
    if (!stripe) return;

    const pr = stripe.paymentRequest({
      country: country.toUpperCase(),
      currency: currency.toLowerCase(),
      total: {
        label: 'Total',
        amount: amount,
      },
      requestPayerName: true,
      requestPayerEmail: true,
      requestPayerPhone: true,
      requestShipping: true,
      shippingOptions: [
        {
          id: 'free-shipping',
          label: 'Free Shipping',
          detail: 'Delivery within 5-7 business days',
          amount: 0,
        },
      ],
    });

    // Check if the browser supports the Payment Request API
    pr.canMakePayment().then(result => {
      if (result) {
        setCanMakePayment(true);
        setPaymentRequest(pr);
      }
    });

    pr.on('paymentmethod', async (event) => {
      try {
        // Create payment intent on the server
        const authData = localStorage.getItem('auth-storage');
        const authToken = authData ? JSON.parse(authData).state?.user?.token : '';

        const response = await fetch(`${process.env.REACT_APP_API_URL}/create-payment-intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            amount: amount,
            currency: currency,
            customerEmail: event.payerEmail || customerInfo.email,
            orderDetails: {
              customerInfo: {
                ...customerInfo,
                name: event.payerName || customerInfo.name,
                email: event.payerEmail || customerInfo.email,
                phone: event.payerPhone || customerInfo.phone,
                // Use shipping address from wallet if provided
                ...(event.shippingAddress ? {
                  address: `${event.shippingAddress.line1}${event.shippingAddress.line2 ? ' ' + event.shippingAddress.line2 : ''}`,
                  city: event.shippingAddress.city,
                  state: event.shippingAddress.state,
                  zipCode: event.shippingAddress.postal_code,
                  country: event.shippingAddress.country,
                } : {}),
              }
            }
          }),
        });

        const { client_secret: clientSecret } = await response.json();

        // Confirm the payment with the payment method from the wallet
        const { error, paymentIntent } = await stripe.confirmCardPayment(
          clientSecret,
          {
            payment_method: event.paymentMethod.id
          },
          {
            handleActions: false // Don't handle actions like 3D Secure in wallet flow
          }
        );

        if (error) {
          event.complete('fail');
          onError(error.message || 'Payment failed');
        } else if (paymentIntent.status === 'succeeded') {
          event.complete('success');
          onSuccess(paymentIntent.id);
        } else if (paymentIntent.status === 'requires_action') {
          // Handle 3D Secure or other actions
          const { error: confirmError, paymentIntent: confirmedPaymentIntent } = await stripe.confirmCardPayment(clientSecret);
          
          if (confirmError) {
            event.complete('fail');
            onError(confirmError.message || 'Payment failed');
          } else if (confirmedPaymentIntent?.status === 'succeeded') {
            event.complete('success');
            onSuccess(confirmedPaymentIntent.id);
          } else {
            event.complete('fail');
            onError('Payment could not be completed');
          }
        } else {
          event.complete('fail');
          onError('Payment failed');
        }
      } catch (error) {
        event.complete('fail');
        onError('Payment failed');
        console.error('Wallet payment error:', error);
      }
    });

    pr.on('shippingaddresschange', (event) => {
      // Update shipping options based on address if needed
      event.updateWith({
        status: 'success',
        shippingOptions: [
          {
            id: 'free-shipping',
            label: 'Free Shipping',
            detail: 'Delivery within 5-7 business days',
            amount: 0,
          },
        ],
      });
    });

  }, [stripe, amount, currency, country, customerInfo, onSuccess, onError]);

  if (!canMakePayment || !paymentRequest) {
    return null;
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
        Pay quickly and securely with your digital wallet
      </Typography>
      
      <PaymentRequestButtonElement 
        options={{ 
          paymentRequest,
          style: {
            paymentRequestButton: {
              type: 'default',
              theme: 'dark',
              height: '48px',
            },
          },
        }} 
      />
      
      <Box sx={{ my: 2, display: 'flex', alignItems: 'center' }}>
        <Divider sx={{ flex: 1 }} />
        <Typography variant="body2" color="text.secondary" sx={{ mx: 2 }}>
          OR
        </Typography>
        <Divider sx={{ flex: 1 }} />
      </Box>
    </Box>
  );
};

export default WalletPaymentButton;