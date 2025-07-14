import React, { useEffect, useState } from 'react';
import {
  PaymentRequestButtonElement,
  useStripe
} from '@stripe/react-stripe-js';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Divider
} from '@mui/material';

interface ExpressCheckoutProps {
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }>;
  totalAmount: number;
  onSuccess: (paymentData: any) => void;
  onError: (error: string) => void;
}

const ExpressCheckout: React.FC<ExpressCheckoutProps> = ({
  items,
  totalAmount,
  onSuccess,
  onError
}) => {
  const stripe = useStripe();
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const [canMakePayment, setCanMakePayment] = useState(false);

  useEffect(() => {
    if (!stripe || !items.length) return;

    const totalAmountCents = Math.round(totalAmount * 100);

    // Create line items for the payment request
    const displayItems = items.map(item => ({
      label: `${item.name} × ${item.quantity}`,
      amount: Math.round(item.price * item.quantity * 100),
    }));

    const pr = stripe.paymentRequest({
      country: 'US',
      currency: 'usd',
      total: {
        label: 'Total',
        amount: totalAmountCents,
      },
      displayItems,
      requestPayerName: true,
      requestPayerEmail: true,
      requestPayerPhone: false, // Make phone optional for express checkout
      requestShipping: true,
      shippingOptions: [
        {
          id: 'free-shipping',
          label: 'Free Shipping',
          detail: 'Delivery within 5-7 business days',
          amount: 0,
        },
        {
          id: 'express-shipping',
          label: 'Express Shipping',
          detail: 'Delivery within 2-3 business days',
          amount: 500, // $5.00
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
        // Prepare order data
        const orderData = {
          items: items.map(item => ({
            productId: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            total: item.price * item.quantity
          })),
          totalAmount: totalAmount,
          customerInfo: {
            name: event.payerName || '',
            email: event.payerEmail || '',
            phone: event.payerPhone || '',
            address: event.shippingAddress ? 
              `${(event.shippingAddress as any).line1 || ''}${(event.shippingAddress as any).line2 ? ' ' + (event.shippingAddress as any).line2 : ''}` : '',
            city: (event.shippingAddress as any)?.city || '',
            state: (event.shippingAddress as any)?.state || '',
            zipCode: (event.shippingAddress as any)?.postal_code || '',
            country: event.shippingAddress?.country || 'US',
          },
          shippingOption: event.shippingOption,
          paymentMethod: event.paymentMethod
        };

        // Create payment intent
        const authData = localStorage.getItem('auth-storage');
        const authToken = authData ? JSON.parse(authData).state?.user?.token : '';

        const response = await fetch(`${process.env.REACT_APP_API_URL}/create-payment-intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            amount: totalAmountCents + (event.shippingOption?.amount || 0),
            currency: 'usd',
            customerEmail: event.payerEmail,
            orderDetails: orderData
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create payment intent');
        }

        const { client_secret: clientSecret } = await response.json();

        // Confirm the payment
        const { error, paymentIntent } = await stripe.confirmCardPayment(
          clientSecret,
          {
            payment_method: event.paymentMethod.id
          },
          {
            handleActions: false
          }
        );

        if (error) {
          event.complete('fail');
          onError(error.message || 'Payment failed');
        } else if (paymentIntent.status === 'succeeded') {
          event.complete('success');
          onSuccess({
            paymentIntentId: paymentIntent.id,
            orderData
          });
        } else if (paymentIntent.status === 'requires_action') {
          // Handle 3D Secure
          const { error: confirmError, paymentIntent: confirmedPaymentIntent } = 
            await stripe.confirmCardPayment(clientSecret);
          
          if (confirmError) {
            event.complete('fail');
            onError(confirmError.message || 'Payment failed');
          } else if (confirmedPaymentIntent?.status === 'succeeded') {
            event.complete('success');
            onSuccess({
              paymentIntentId: confirmedPaymentIntent.id,
              orderData
            });
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
        console.error('Express checkout error:', error);
      }
    });

    pr.on('shippingaddresschange', (event) => {
      // You can update shipping options based on address
      event.updateWith({
        status: 'success',
        shippingOptions: [
          {
            id: 'free-shipping',
            label: 'Free Shipping',
            detail: 'Delivery within 5-7 business days',
            amount: 0,
          },
          {
            id: 'express-shipping',
            label: 'Express Shipping',
            detail: 'Delivery within 2-3 business days',
            amount: 500,
          },
        ],
      });
    });

    pr.on('shippingoptionchange', (event) => {
      event.updateWith({
        status: 'success',
        total: {
          label: 'Total',
          amount: totalAmountCents + (event.shippingOption.amount || 0),
        },
      });
    });

  }, [stripe, items, totalAmount, onSuccess, onError]);

  if (!canMakePayment || !paymentRequest || !items.length) {
    return null;
  }

  return (
    <Card sx={{ mb: 3, backgroundColor: 'primary.50', borderColor: 'primary.200' }} variant="outlined">
      <CardContent sx={{ textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom color="primary" fontWeight="bold">
          🚀 Express Checkout
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Skip the forms! Pay with Apple Pay, Google Pay, or your saved cards
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
        
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
          <Divider sx={{ flex: 1 }} />
          <Typography variant="caption" color="text.secondary" sx={{ mx: 2 }}>
            OR USE REGULAR CHECKOUT
          </Typography>
          <Divider sx={{ flex: 1 }} />
        </Box>
      </CardContent>
    </Card>
  );
};

export default ExpressCheckout;