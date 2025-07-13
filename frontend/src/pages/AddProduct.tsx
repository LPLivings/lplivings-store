import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { addProduct, getUploadUrl, uploadFile } from '../services/api';

const AddProduct: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
  });
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  const mutation = useMutation({
    mutationFn: async () => {
      let imageUrl = '';
      
      // Upload image first if present
      if (image) {
        const fileExtension = image.name.split('.').pop() || 'jpg';
        const { uploadUrl, imageUrl: finalImageUrl } = await getUploadUrl(fileExtension);
        
        const uploadSuccess = await uploadFile(uploadUrl, image);
        if (!uploadSuccess) {
          throw new Error('Failed to upload image');
        }
        
        imageUrl = finalImageUrl;
      }
      
      // Create product with JSON data
      const productData = {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        category: formData.category,
        userId: user?.id || '',
        imageUrl: imageUrl
      };
      
      console.log('Submitting product:', productData);
      
      return addProduct(productData);
    },
    onSuccess: (data) => {
      console.log('Product added successfully:', data);
      navigate('/products');
    },
    onError: (error) => {
      console.error('Failed to add product:', error);
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please login to add products');
      return;
    }
    mutation.mutate();
  };

  if (!user) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h5" gutterBottom>
          Please login to add products
        </Typography>
        <Button variant="contained" onClick={() => navigate('/')} sx={{ mt: 2 }}>
          Go to Home
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Add New Product
      </Typography>

      <Paper sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Product Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            multiline
            rows={3}
            required
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Price"
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            required
            inputProps={{ min: 0, step: 0.01 }}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            sx={{ mb: 2 }}
          />

          <Box sx={{ mb: 2 }}>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="raised-button-file"
              type="file"
              onChange={handleImageChange}
            />
            <label htmlFor="raised-button-file">
              <Button
                variant="outlined"
                component="span"
                startIcon={<PhotoCamera />}
                fullWidth
              >
                Upload Product Image
              </Button>
            </label>
          </Box>

          {imagePreview && (
            <Box sx={{ mb: 2, textAlign: 'center' }}>
              <img
                src={imagePreview}
                alt="Preview"
                style={{ maxWidth: '100%', maxHeight: 300, objectFit: 'contain' }}
              />
            </Box>
          )}

          {mutation.error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Failed to add product. Please try again.
            </Alert>
          )}

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={mutation.isPending}
          >
            {mutation.isPending ? <CircularProgress size={24} /> : 'Add Product'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default AddProduct;