import React, { useEffect, useState } from 'react';
import {
  PaymentRequestButtonElement,
  useStripe
} from '@stripe/react-stripe-js';
import {
  Box,
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
  const [walletType, setWalletType] = useState<'applePay' | 'googlePay' | 'link' | null>(null);

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
      console.log('Payment Request canMakePayment result:', result);
      console.log('User agent:', navigator.userAgent);
      console.log('Is Safari:', /Safari/.test(navigator.userAgent) && !/Chrome|CriOS/.test(navigator.userAgent));
      
      if (result) {
        console.log('Available payment methods:', {
          applePay: result.applePay,
          googlePay: result.googlePay,
          link: result.link
        });
        
        // Detect which wallet type is available
        if (result.applePay) {
          console.log('Apple Pay is available');
          setWalletType('applePay');
        } else if (result.googlePay) {
          console.log('Google Pay is available');
          setWalletType('googlePay');
        } else if (result.link) {
          console.log('Link Pay is available');
          setWalletType('link');
        }
        
        setCanMakePayment(true);
        setPaymentRequest(pr);
      } else {
        console.log('No payment methods available');
        console.log('Device info:', {
          platform: navigator.platform,
          userAgent: navigator.userAgent,
          language: navigator.language
        });
      }
    }).catch(error => {
      console.error('Payment Request error:', error);
    });

    pr.on('paymentmethod', async (event) => {
      try {
        console.log('Wallet payment method triggered:', event);
        
        // Create payment intent on the server
        const authData = localStorage.getItem('auth-storage');
        const authToken = authData ? JSON.parse(authData).state?.user?.token : '';

        console.log('Creating payment intent for wallet payment...');
        
        // Add timeout to the fetch request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        const response = await fetch(`${process.env.REACT_APP_API_URL}/create-payment-intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          signal: controller.signal,
          body: JSON.stringify({
            amount: amount,
            currency: currency,
            customerEmail: event.payerEmail || customerInfo.email,
            orderDetails: {
              orderId: `wallet_${Date.now()}`,
              customerId: authToken ? 'authenticated_user' : 'guest',
              customerInfo: {
                ...customerInfo,
                name: event.payerName || customerInfo.name,
                email: event.payerEmail || customerInfo.email,
                phone: event.payerPhone || customerInfo.phone,
                // Use shipping address from wallet if provided
                ...(event.shippingAddress ? {
                  address: `${(event.shippingAddress as any).line1 || ''}${(event.shippingAddress as any).line2 ? ' ' + (event.shippingAddress as any).line2 : ''}`,
                  city: (event.shippingAddress as any).city || '',
                  state: (event.shippingAddress as any).state || '',
                  zipCode: (event.shippingAddress as any).postal_code || '',
                  country: event.shippingAddress.country || 'US',
                } : {}),
              }
            }
          }),
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Payment intent creation failed:', response.status, errorText);
          throw new Error(`Payment intent creation failed: ${response.status}`);
        }

        const responseData = await response.json();
        console.log('Payment intent response:', responseData);
        
        if (responseData.error) {
          throw new Error(responseData.error);
        }

        const clientSecret = responseData.clientSecret;

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
        console.error('Wallet payment error:', error);
        event.complete('fail');
        
        // Provide more specific error messages
        if (error instanceof Error) {
          if (error.message.includes('fetch')) {
            onError('Network error. Please check your connection and try again.');
          } else if (error.message.includes('timeout')) {
            onError('Request timed out. Please try again.');
          } else {
            onError(error.message || 'Payment failed');
          }
        } else {
          onError('Payment failed. Please try again.');
        }
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
    console.log('Wallet payment not available:', { canMakePayment, paymentRequest: !!paymentRequest });
    
    // Show helpful message for iOS users not using Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome|CriOS/.test(navigator.userAgent);
    
    if (isIOS && !isSafari) {
      return (
        <Box sx={{ mb: 3, p: 2, bgcolor: 'info.light', borderRadius: 2 }}>
          <Typography variant="body2" color="info.contrastText">
            💡 <strong>Tip:</strong> To use Apple Pay, please open this page in Safari instead of Chrome
          </Typography>
        </Box>
      );
    }
    
    return null;
  }
  
  console.log('Rendering wallet button with type:', walletType);

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
        {walletType === 'applePay' 
          ? 'Pay with Apple Pay' 
          : walletType === 'googlePay' 
          ? 'Pay with Google Pay'
          : 'Pay quickly and securely with your digital wallet'}
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