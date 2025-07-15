import React from 'react';
import { Box, Typography, Alert, Button } from '@mui/material';

const ApplePayCheck: React.FC = () => {
  const checkApplePay = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome|CriOS/.test(navigator.userAgent);
    
    if (!isIOS) {
      return {
        status: 'not_ios',
        message: 'Not an iOS device'
      };
    }
    
    if (!isSafari) {
      return {
        status: 'not_safari',
        message: 'Not using Safari browser'
      };
    }
    
    if (!(window as any).ApplePaySession) {
      return {
        status: 'no_applepay_api',
        message: 'Apple Pay API not available'
      };
    }
    
    if (!(window as any).ApplePaySession.canMakePayments()) {
      return {
        status: 'cannot_make_payments',
        message: 'Apple Pay not set up on device'
      };
    }
    
    return {
      status: 'available',
      message: 'Apple Pay should be available'
    };
  };

  const result = checkApplePay();
  
  const openWalletSettings = () => {
    // This will only work on iOS
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      window.location.href = 'prefs:root=PASSBOOK';
    }
  };

  return (
    <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        🔍 Apple Pay Diagnostic
      </Typography>
      
      <Alert 
        severity={result.status === 'available' ? 'success' : 'warning'}
        sx={{ mb: 2 }}
      >
        <Typography variant="body2">
          <strong>Status:</strong> {result.status}
        </Typography>
        <Typography variant="body2">
          <strong>Message:</strong> {result.message}
        </Typography>
      </Alert>
      
      {result.status === 'cannot_make_payments' && (
        <Box>
          <Typography variant="body2" gutterBottom>
            To fix this:
          </Typography>
          <Typography variant="body2" component="div">
            1. Open Settings app<br/>
            2. Go to "Wallet & Apple Pay"<br/>
            3. Add a credit or debit card<br/>
            4. Verify with your bank
          </Typography>
          
          <Button 
            variant="outlined" 
            size="small" 
            onClick={openWalletSettings}
            sx={{ mt: 1 }}
          >
            Open Wallet Settings
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default ApplePayCheck;