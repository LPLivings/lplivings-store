import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Layout from './components/Layout';
import Home from './pages/Home';
import Products from './pages/Products';
import Cart from './pages/Cart';
import Profile from './pages/Profile';
import AddProduct from './pages/AddProduct';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
});

const queryClient = new QueryClient();

function App() {
  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || ''}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Router>
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/add-product" element={<AddProduct />} />
              </Routes>
            </Layout>
          </Router>
        </ThemeProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
