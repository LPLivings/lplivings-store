import React, { useEffect, useState } from 'react';
import { useStripe } from '@stripe/react-stripe-js';
import { Box, Typography, Paper } from '@mui/material';

const WalletDebug: React.FC = () => {
  const stripe = useStripe();
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    if (!stripe) {
      setDebugInfo({ error: 'Stripe not loaded' });
      return;
    }

    const pr = stripe.paymentRequest({
      country: 'US',
      currency: 'usd',
      total: {
        label: 'Test',
        amount: 1000,
      },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    pr.canMakePayment().then(result => {
      setDebugInfo({
        canMakePayment: !!result,
        paymentMethods: result || {},
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        isSafari: /Safari/.test(navigator.userAgent) && !/Chrome|CriOS/.test(navigator.userAgent),
        isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
        isAndroid: /Android/.test(navigator.userAgent),
        timestamp: new Date().toISOString()
      });
    }).catch(error => {
      setDebugInfo({
        error: error.message,
        userAgent: navigator.userAgent,
        platform: navigator.platform
      });
    });
  }, [stripe]);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        🔍 Wallet Debug Info
      </Typography>
      <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
        <pre style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </Paper>
    </Box>
  );
};

export default WalletDebug;