import React from 'react';
import { Box, Typography, Button, Grid, Card, CardContent, useTheme, useMediaQuery } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, PhotoCamera, Group } from '@mui/icons-material';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box>
      <Box sx={{ textAlign: 'center', py: { xs: 3, md: 4 }, px: { xs: 2, md: 0 } }}>
        <Typography 
          variant={isMobile ? "h4" : "h3"} 
          component="h1" 
          gutterBottom
          sx={{ fontWeight: 'bold' }}
        >
          Welcome to LPLivings Store
        </Typography>
        <Typography 
          variant={isMobile ? "body1" : "h6"} 
          color="text.secondary" 
          paragraph
          sx={{ maxWidth: 600, mx: 'auto' }}
        >
          Crowdsourced marketplace for unique items with AI-powered product discovery
        </Typography>
        <Button
          variant="contained"
          size="medium"
          onClick={() => navigate('/products')}
          sx={{ 
            mt: 2,
            minWidth: { xs: 200, md: 'auto' },
            fontSize: { xs: '0.9rem', md: '1rem' }
          }}
        >
          Start Shopping
        </Button>
      </Box>

      <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mt: { xs: 2, md: 4 }, px: { xs: 1, md: 0 } }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ 
            height: '100%',
            transition: 'transform 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: 4
            }
          }}>
            <CardContent sx={{ textAlign: 'center', p: { xs: 2, md: 3 } }}>
              <ShoppingBag sx={{ 
                fontSize: { xs: 40, md: 48 }, 
                color: 'primary.main', 
                mb: 2 
              }} />
              <Typography variant={isMobile ? "subtitle1" : "h6"} gutterBottom fontWeight="bold">
                Shop Products
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Browse through our crowdsourced inventory with smart search
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ 
            height: '100%',
            transition: 'transform 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: 4
            }
          }}>
            <CardContent sx={{ textAlign: 'center', p: { xs: 2, md: 3 } }}>
              <PhotoCamera sx={{ 
                fontSize: { xs: 40, md: 48 }, 
                color: 'primary.main', 
                mb: 2 
              }} />
              <Typography variant={isMobile ? "subtitle1" : "h6"} gutterBottom fontWeight="bold">
                AI-Powered
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upload photos and get instant AI-generated descriptions and categories
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ 
            height: '100%',
            transition: 'transform 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: 4
            }
          }}>
            <CardContent sx={{ textAlign: 'center', p: { xs: 2, md: 3 } }}>
              <Group sx={{ 
                fontSize: { xs: 40, md: 48 }, 
                color: 'primary.main', 
                mb: 2 
              }} />
              <Typography variant={isMobile ? "subtitle1" : "h6"} gutterBottom fontWeight="bold">
                Mobile-First
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Seamless shopping experience optimized for mobile devices
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Home;