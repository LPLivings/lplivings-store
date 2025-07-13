import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Badge } from '@mui/material';
import { ShoppingCart, AccountCircle } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser, clearUser } = useAuthStore();
  const { items } = useCartStore();

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const userData = await userInfo.json();
        setUser({
          id: userData.sub,
          email: userData.email,
          name: userData.name,
          picture: userData.picture,
          token: tokenResponse.access_token,
        });
      } catch (error) {
        console.error('Login failed:', error);
      }
    },
  });

  const handleLogout = () => {
    clearUser();
    navigate('/');
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <AppBar position="sticky" sx={{ display: { xs: 'block', sm: 'block' } }}>
      <Toolbar>
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          E-Shop
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            color="inherit"
            onClick={() => navigate('/cart')}
            sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
          >
            <Badge badgeContent={totalItems} color="secondary">
              <ShoppingCart />
            </Badge>
          </IconButton>
          
          {user ? (
            <>
              <IconButton
                color="inherit"
                onClick={() => navigate('/profile')}
                sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
              >
                <AccountCircle />
              </IconButton>
              <Button color="inherit" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <Button color="inherit" onClick={() => login()}>
              Login with Google
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;