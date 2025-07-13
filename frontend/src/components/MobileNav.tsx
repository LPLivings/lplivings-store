import React from 'react';
import { Paper, BottomNavigation, BottomNavigationAction, Badge } from '@mui/material';
import { Home, ShoppingBag, ShoppingCart, AccountCircle, Add } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';

const MobileNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { items } = useCartStore();
  const { user } = useAuthStore();
  
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const getValue = () => {
    switch (location.pathname) {
      case '/':
        return 0;
      case '/products':
        return 1;
      case '/cart':
        return 2;
      case '/add-product':
        return 3;
      case '/profile':
        return 4;
      default:
        return 0;
    }
  };

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        display: { xs: 'block', sm: 'none' },
        zIndex: 1000,
      }}
      elevation={3}
    >
      <BottomNavigation
        value={getValue()}
        onChange={(event, newValue) => {
          switch (newValue) {
            case 0:
              navigate('/');
              break;
            case 1:
              navigate('/products');
              break;
            case 2:
              navigate('/cart');
              break;
            case 3:
              if (user) {
                navigate('/add-product');
              } else {
                alert('Please login to add products');
              }
              break;
            case 4:
              navigate('/profile');
              break;
          }
        }}
        showLabels
      >
        <BottomNavigationAction label="Home" icon={<Home />} />
        <BottomNavigationAction label="Shop" icon={<ShoppingBag />} />
        <BottomNavigationAction
          label="Cart"
          icon={
            <Badge badgeContent={totalItems} color="secondary">
              <ShoppingCart />
            </Badge>
          }
        />
        <BottomNavigationAction label="Add" icon={<Add />} />
        <BottomNavigationAction label="Profile" icon={<AccountCircle />} />
      </BottomNavigation>
    </Paper>
  );
};

export default MobileNav;