import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Search, ShoppingCart, Delete } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import { getProducts, deleteProduct } from '../services/api';

const Products: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { addItem } = useCartStore();
  const { isAdmin } = useAuthStore();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      // Refresh products list after successful deletion
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: any) => {
      alert(`Failed to delete product: ${error.message || 'Unknown error'}`);
    },
  });

  const filteredProducts = products?.filter(
    (product: any) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteProduct = (productId: string, productName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${productName}"? This action cannot be undone.`
    );
    
    if (confirmed) {
      deleteMutation.mutate(productId);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="error">Failed to load products</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 1, md: 0 } }}>
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search products..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ 
          mb: 3,
          '& .MuiOutlinedInput-root': {
            fontSize: { xs: '0.9rem', md: '1rem' }
          }
        }}
        size="medium"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
      />

      <Grid container spacing={{ xs: 1.5, md: 2 }}>
        {filteredProducts?.map((product: any) => (
          <Grid size={{ xs: 6, sm: 4, md: 3 }} key={product.id}>
            <Card sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 4
              }
            }}>
              <CardMedia
                component="img"
                height={isMobile ? 150 : 200}
                image={product.image || 'https://via.placeholder.com/200'}
                alt={product.name}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent sx={{ 
                flexGrow: 1, 
                p: { xs: 1.5, md: 2 },
                pb: { xs: 1, md: 1 }
              }}>
                <Typography 
                  gutterBottom 
                  variant={isMobile ? "subtitle2" : "h6"} 
                  component="div" 
                  noWrap
                  sx={{ fontWeight: 'bold' }}
                >
                  {product.name}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    mb: 1,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    fontSize: { xs: '0.75rem', md: '0.875rem' }
                  }}
                >
                  {product.description}
                </Typography>
                <Typography 
                  variant={isMobile ? "subtitle1" : "h6"} 
                  color="primary"
                  sx={{ fontWeight: 'bold' }}
                >
                  ${product.price}
                </Typography>
              </CardContent>
              <CardActions sx={{ p: { xs: 1, md: 2 }, pt: 0, gap: 1 }}>
                <Button
                  fullWidth={!isAdmin()}
                  variant="contained"
                  startIcon={!isMobile && <ShoppingCart />}
                  size={isMobile ? "small" : "medium"}
                  onClick={() => addItem({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                  })}
                  sx={{ 
                    fontSize: { xs: '0.75rem', md: '0.875rem' },
                    py: { xs: 0.5, md: 1 },
                    flex: isAdmin() ? 1 : undefined
                  }}
                >
                  {isMobile ? 'Add' : 'Add to Cart'}
                </Button>
                
                {isAdmin() && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={!isMobile && <Delete />}
                    size={isMobile ? "small" : "medium"}
                    onClick={() => handleDeleteProduct(product.id, product.name)}
                    disabled={deleteMutation.isPending}
                    sx={{ 
                      fontSize: { xs: '0.75rem', md: '0.875rem' },
                      py: { xs: 0.5, md: 1 },
                      minWidth: { xs: 40, md: 100 }
                    }}
                  >
                    {isMobile ? <Delete /> : 'Delete'}
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredProducts && filteredProducts.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No products found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search terms
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default Products;