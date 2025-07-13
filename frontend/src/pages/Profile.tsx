import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Add, History, Inventory } from '@mui/icons-material';
import useAuthStore from '../store/authStore';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, clearUser } = useAuthStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (!user) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h5" gutterBottom>
          Please login to view your profile
        </Typography>
        <Button variant="contained" onClick={() => navigate('/')} sx={{ mt: 2 }}>
          Go to Home
        </Button>
      </Box>
    );
  }

  const handleLogout = () => {
    clearUser();
    navigate('/');
  };

  return (
    <Box sx={{ px: { xs: 1, md: 0 } }}>
      <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3, borderRadius: 2 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 3,
          flexDirection: isMobile ? 'column' : 'row',
          textAlign: isMobile ? 'center' : 'left'
        }}>
          <Avatar
            src={user.picture}
            sx={{ 
              width: { xs: 80, md: 100 }, 
              height: { xs: 80, md: 100 }, 
              mr: { xs: 0, md: 3 },
              mb: { xs: 2, md: 0 }
            }}
          />
          <Box>
            <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">
              {user.name}
            </Typography>
            <Typography color="text.secondary" variant={isMobile ? "body2" : "body1"}>
              {user.email}
            </Typography>
          </Box>
        </Box>
        
        <Button 
          variant="outlined" 
          color="error" 
          onClick={handleLogout}
          fullWidth={isMobile}
          size="medium"
        >
          Logout
        </Button>
      </Paper>

      <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
          Account Actions
        </Typography>
        <List sx={{ pt: 0 }}>
          <ListItem 
            component="button" 
            onClick={() => navigate('/add-product')} 
            sx={{ 
              cursor: 'pointer',
              borderRadius: 1,
              '&:hover': { bgcolor: 'action.hover' },
              py: { xs: 1.5, md: 2 }
            }}
          >
            <ListItemIcon>
              <Add color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Add New Product"
              secondary="Contribute to our crowdsourced inventory"
              primaryTypographyProps={{ 
                variant: isMobile ? "body1" : "subtitle1",
                fontWeight: 'medium'
              }}
              secondaryTypographyProps={{ 
                variant: "body2" 
              }}
            />
          </ListItem>
          <Divider />
          <ListItem 
            component="button" 
            onClick={() => navigate('/orders')}
            sx={{ 
              cursor: 'pointer',
              borderRadius: 1,
              '&:hover': { bgcolor: 'action.hover' },
              py: { xs: 1.5, md: 2 }
            }}
          >
            <ListItemIcon>
              <History color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Order History"
              secondary="View your past orders and track shipments"
              primaryTypographyProps={{ 
                variant: isMobile ? "body1" : "subtitle1",
                fontWeight: 'medium'
              }}
              secondaryTypographyProps={{ 
                variant: "body2" 
              }}
            />
          </ListItem>
          <Divider />
          <ListItem 
            component="button" 
            sx={{ 
              cursor: 'pointer',
              borderRadius: 1,
              '&:hover': { bgcolor: 'action.hover' },
              py: { xs: 1.5, md: 2 }
            }}
          >
            <ListItemIcon>
              <Inventory color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="My Products"
              secondary="Manage products you've added (Coming soon)"
              primaryTypographyProps={{ 
                variant: isMobile ? "body1" : "subtitle1",
                fontWeight: 'medium'
              }}
              secondaryTypographyProps={{ 
                variant: "body2",
                color: 'text.disabled'
              }}
            />
          </ListItem>
        </List>
      </Paper>
    </Box>
  );
};

export default Profile;