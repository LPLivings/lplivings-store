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
  Divider,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, clearUser } = useAuthStore();

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
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar
            src={user.picture}
            sx={{ width: 100, height: 100, mr: 3 }}
          />
          <Box>
            <Typography variant="h5">{user.name}</Typography>
            <Typography color="text.secondary">{user.email}</Typography>
          </Box>
        </Box>
        
        <Button variant="outlined" color="error" onClick={handleLogout}>
          Logout
        </Button>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Account Actions
        </Typography>
        <List>
          <ListItem component="button" onClick={() => navigate('/add-product')} sx={{ cursor: 'pointer' }}>
            <ListItemText
              primary="Add New Product"
              secondary="Contribute to our crowdsourced inventory"
            />
          </ListItem>
          <Divider />
          <ListItem component="button" sx={{ cursor: 'pointer' }}>
            <ListItemText
              primary="Order History"
              secondary="View your past orders (Coming soon)"
            />
          </ListItem>
          <Divider />
          <ListItem component="button" sx={{ cursor: 'pointer' }}>
            <ListItemText
              primary="My Products"
              secondary="Manage products you've added (Coming soon)"
            />
          </ListItem>
        </List>
      </Paper>
    </Box>
  );
};

export default Profile;