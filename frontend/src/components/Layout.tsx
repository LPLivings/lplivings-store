import React, { ReactNode } from 'react';
import { Box, Container } from '@mui/material';
import MobileNav from './MobileNav';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <Box sx={{ flex: 1, mb: { xs: 7, sm: 0 } }}>
        <Container maxWidth="lg" sx={{ py: 2 }}>
          {children}
        </Container>
      </Box>
      <MobileNav />
    </Box>
  );
};

export default Layout;