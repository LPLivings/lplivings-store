import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Card,
  CardMedia,
  Chip,
  Fab,
  useTheme,
  useMediaQuery,
  Stack,
  Divider
} from '@mui/material';
import { 
  PhotoCamera, 
 
  Check, 
  Close, 
  CameraAlt,
  Upload,
  SmartToy
} from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { addProduct, getUploadUrl, uploadFile, analyzeImage } from '../services/api';

const AddProduct: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
  });
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>(''); // Store the uploaded image URL
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState({
    name: '',
    description: '',
    category: '',
    applied: false
  });

  const categories = [
    'Electronics', 'Clothing', 'Home & Garden', 'Kitchen', 
    'Books', 'Sports', 'Beauty', 'Toys', 'Automotive', 
    'Health', 'General'
  ];

  const analyzeImageMutation = useMutation({
    mutationFn: async (imageUrl: string) => {
      setIsAnalyzing(true);
      setError('');
      return await analyzeImage(imageUrl);
    },
    onSuccess: (data) => {
      setAiAnalysis(data);
      setAiSuggestions({
        name: data.name || '',
        description: data.description || '',
        category: data.category || '',
        applied: false
      });
      setIsAnalyzing(false);
    },
    onError: (error: any) => {
      setIsAnalyzing(false);
      setError('Failed to analyze image. You can still add the product manually.');
      console.error('Image analysis error:', error);
    },
    retry: 2, // Retry failed requests 2 times
    retryDelay: 1000 // Wait 1 second between retries
  });

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions (max 800px)
        const maxWidth = 800;
        const maxHeight = 800;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', 0.7); // 70% quality
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload a valid image file (JPEG, PNG, or WebP)');
        return;
      }

      setError('');
      setIsUploading(true);
      
      // Compress image for better performance
      const compressedFile = await compressImage(file);
      const previewUrl = URL.createObjectURL(compressedFile);
      setImagePreview(previewUrl);
      
      console.log(`Image compressed: ${file.size} → ${compressedFile.size} bytes`);

      // Upload image and analyze
      try {
        setIsUploading(true);
        // Get file extension from MIME type, not filename
        const mimeToExt: { [key: string]: string } = {
          'image/jpeg': 'jpg',
          'image/jpg': 'jpg', 
          'image/png': 'png',
          'image/webp': 'webp',
          'image/gif': 'gif'
        };
        const fileExtension = mimeToExt[compressedFile.type] || 'jpg';
        console.log('File type:', compressedFile.type, 'Extension:', fileExtension);
        
        const { uploadUrl, imageUrl, contentType } = await getUploadUrl(fileExtension);
        console.log('Got upload URL:', uploadUrl);
        console.log('Image URL will be:', imageUrl);
        console.log('Expected content type:', contentType);
        
        const uploadSuccess = await uploadFile(uploadUrl, compressedFile, contentType);
        console.log('Upload success:', uploadSuccess);
        setIsUploading(false);
        
        if (uploadSuccess) {
          setUploadedImageUrl(imageUrl); // Store the uploaded image URL
          console.log('Starting AI analysis for:', imageUrl);
          analyzeImageMutation.mutate(imageUrl);
        } else {
          setError('Failed to upload image. Please try again.');
        }
      } catch (error) {
        setIsUploading(false);
        console.error('Error uploading for analysis:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error details:', errorMessage);
        setError(`Failed to upload image: ${errorMessage}. You can still add the product without AI analysis.`);
      }
    }
  };

  const applySuggestions = () => {
    setFormData(prev => ({
      ...prev,
      name: aiSuggestions.name,
      description: aiSuggestions.description,
      category: aiSuggestions.category
    }));
    setAiSuggestions(prev => ({ ...prev, applied: true }));
  };

  const mutation = useMutation({
    mutationFn: async () => {
      setError('');
      
      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error('Product name is required');
      }
      if (!formData.price || parseFloat(formData.price) <= 0) {
        throw new Error('Please enter a valid price');
      }
      if (!formData.category) {
        throw new Error('Please select a category');
      }
      
      // Use the already uploaded image URL (from the first upload for AI analysis)
      const imageUrl = uploadedImageUrl;
      
      console.log('Creating product with data:', {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        category: formData.category,
        userId: user?.id || '',
        imageUrl: imageUrl,
        uploadedImageUrlState: uploadedImageUrl
      });
      
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        category: formData.category,
        userId: user?.id || '',
        imageUrl: imageUrl
      };
      
      const result = await addProduct(productData);
      console.log('Product creation result:', result);
      return result;
    },
    onSuccess: () => {
      setSuccess('Product added successfully!');
      setTimeout(() => {
        navigate('/products');
      }, 1500);
    },
    onError: (error: any) => {
      console.error('Product creation failed:', error);
      setError(error.message || 'Failed to add product. Please try again.');
    },
    retry: 1, // Retry failed requests once
    retryDelay: 2000 // Wait 2 seconds before retry
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    mutation.mutate();
  };

  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      <Typography 
        variant={isMobile ? "h5" : "h4"} 
        gutterBottom 
        sx={{ fontWeight: 'bold', textAlign: 'center', mb: 3 }}
      >
        Add New Product
      </Typography>

      <Paper 
        elevation={isMobile ? 1 : 3} 
        sx={{ 
          p: isMobile ? 2 : 3, 
          borderRadius: 2,
          background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)'
        }}
      >
        {/* Error and Success Messages */}
        {error && (
          <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            {/* Image Upload Section */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CameraAlt color="primary" />
                Product Photo
              </Typography>
              
              <Box sx={{ position: 'relative' }}>
                {imagePreview ? (
                  <Card sx={{ maxWidth: '100%', mb: 2 }}>
                    <CardMedia
                      component="img"
                      height={isMobile ? "200" : "300"}
                      image={imagePreview}
                      alt="Product preview"
                      sx={{ objectFit: 'cover' }}
                    />
                    {(isUploading || isAnalyzing) && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          bgcolor: 'rgba(0,0,0,0.5)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'column',
                          gap: 2
                        }}
                      >
                        <CircularProgress sx={{ color: 'white' }} />
                        <Typography color="white" variant="body2" textAlign="center">
                          {isUploading ? 'Compressing & uploading...' : 'AI analyzing your product...'}
                        </Typography>
                        <Typography color="white" variant="caption" textAlign="center">
                          {isUploading ? 'Optimizing for mobile' : 'This should be quick!'}
                        </Typography>
                      </Box>
                    )}
                  </Card>
                ) : (
                  <Box
                    sx={{
                      border: '2px dashed',
                      borderColor: 'grey.300',
                      borderRadius: 2,
                      p: 4,
                      textAlign: 'center',
                      backgroundColor: 'grey.50',
                      minHeight: isMobile ? 150 : 200,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 2
                    }}
                  >
                    <PhotoCamera sx={{ fontSize: 48, color: 'grey.400' }} />
                    <Typography color="text.secondary">
                      Take a photo or choose from gallery
                    </Typography>
                  </Box>
                )}

                <input
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  style={{ display: 'none' }}
                  id="image-upload"
                  type="file"
                  onChange={handleImageChange}
                />
                <label htmlFor="image-upload">
                  <Fab
                    color="primary"
                    component="span"
                    disabled={isUploading || isAnalyzing}
                    sx={{
                      position: 'absolute',
                      bottom: 16,
                      right: 16,
                    }}
                  >
                    {isUploading || isAnalyzing ? <CircularProgress size={24} /> : <Upload />}
                  </Fab>
                </label>
              </Box>

              {/* Skip AI option while analyzing */}
              {isAnalyzing && (
                <Alert severity="info" action={
                  <Button color="inherit" size="small" onClick={() => {
                    setIsAnalyzing(false);
                    analyzeImageMutation.reset();
                  }}>
                    Skip AI
                  </Button>
                }>
                  AI is analyzing your image. You can skip this and add product details manually.
                </Alert>
              )}

              {/* AI Suggestions */}
              {(aiSuggestions.name || aiSuggestions.description) && !aiSuggestions.applied && (
                <Card sx={{ mt: 2, bgcolor: 'primary.50', border: 1, borderColor: 'primary.200' }}>
                  <Box sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <SmartToy color="primary" />
                      <Typography variant="subtitle1" color="primary" fontWeight="bold">
                        AI Suggestions
                      </Typography>
                      <Chip 
                        label={aiAnalysis?.confidence || 'medium'} 
                        size="small" 
                        color={aiAnalysis?.confidence === 'high' ? 'success' : 'default'}
                      />
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      {aiSuggestions.name && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>Name:</strong> {aiSuggestions.name}
                        </Typography>
                      )}
                      {aiSuggestions.category && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>Category:</strong> {aiSuggestions.category}
                        </Typography>
                      )}
                      {aiSuggestions.description && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>Description:</strong> {aiSuggestions.description}
                        </Typography>
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, flexDirection: isMobile ? 'column' : 'row' }}>
                      <Button
                        variant="contained"
                        size={isMobile ? "medium" : "small"}
                        startIcon={<Check />}
                        onClick={applySuggestions}
                        fullWidth={isMobile}
                        sx={{ fontWeight: 'bold' }}
                      >
                        Use AI Suggestions
                      </Button>
                      <Button
                        variant="outlined"
                        size={isMobile ? "medium" : "small"}
                        startIcon={<Close />}
                        onClick={() => setAiSuggestions(prev => ({ ...prev, name: '', description: '', category: '' }))}
                        fullWidth={isMobile}
                      >
                        Fill Manually
                      </Button>
                    </Box>
                  </Box>
                </Card>
              )}
            </Box>

            <Divider />

            {/* Product Details */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Product Details
              </Typography>
              
              {/* Helpful hint when AI suggestions are available */}
              {(aiSuggestions.name || aiSuggestions.description) && !aiSuggestions.applied && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  💡 <strong>Tip:</strong> Click "Use AI Suggestions" above to auto-fill these fields, or fill them manually.
                </Alert>
              )}
              
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Product Name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  variant="outlined"
                />

                <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={formData.category}
                    label="Category"
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  >
                    {categories.map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        {cat}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                  multiline
                  rows={3}
                  variant="outlined"
                />

                <TextField
                  fullWidth
                  label="Price ($)"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  required
                  variant="outlined"
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Stack>
            </Box>

            {/* Submit Button */}
            <Box sx={{ pt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={mutation.isPending || isUploading || isAnalyzing}
                sx={{ 
                  py: isMobile ? 1.5 : 2,
                  fontSize: isMobile ? '1rem' : '1.1rem',
                  fontWeight: 'bold'
                }}
              >
                {mutation.isPending ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Adding Product...
                  </>
                ) : (
                  'Add Product'
                )}
              </Button>
            </Box>

            {mutation.error && (
              <Alert severity="error">
                Error adding product: {mutation.error.message}
              </Alert>
            )}
          </Stack>
        </form>
      </Paper>
    </Container>
  );
};

export default AddProduct;