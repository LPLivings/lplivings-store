import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.example.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
});

api.interceptors.request.use((config) => {
  const authData = localStorage.getItem('auth-storage');
  if (authData) {
    const { state } = JSON.parse(authData);
    if (state.user?.token) {
      config.headers.Authorization = `Bearer ${state.user.token}`;
    }
  }
  return config;
});

export const getProducts = async () => {
  const response = await api.get('/products');
  return response.data;
};

// Utility function to clean S3 URLs from presigned parameters
const cleanS3Url = (url: string): string => {
  try {
    const urlObj = new URL(url);
    // Remove AWS query parameters to get direct S3 URL
    urlObj.search = '';
    return urlObj.toString();
  } catch {
    return url; // Return original if URL parsing fails
  }
};

export const getUploadUrl = async (fileExtension: string) => {
  const response = await api.get(`/upload-url?ext=${fileExtension}`);
  const data = response.data;
  
  // Ensure we always return clean direct S3 URLs for display
  return {
    ...data,
    imageUrl: cleanS3Url(data.imageUrl)
  };
};

export const uploadFile = async (uploadUrl: string, file: File, contentType?: string) => {
  try {
    console.log('Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);
    console.log('Upload URL:', uploadUrl);
    console.log('Expected Content-Type:', contentType || file.type);
    
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': contentType || file.type,
      },
    });
    
    console.log('Upload response status:', response.status);
    console.log('Upload response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload failed with status:', response.status, 'Error:', errorText);
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }
    
    return true;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

export const analyzeImage = async (imageUrl: string) => {
  const response = await api.post('/analyze-image', { imageUrl });
  return response.data;
};

export const addProduct = async (productData: any) => {
  const response = await api.post('/products', productData, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.data;
};

export const createPaymentIntent = async (paymentData: {
  amount: number;
  currency?: string;
  customerEmail: string;
  orderDetails: any;
}) => {
  const response = await api.post('/create-payment-intent', paymentData);
  return response.data;
};

export const confirmPayment = async (paymentData: {
  paymentIntentId: string;
  orderDetails: any;
}) => {
  const response = await api.post('/confirm-payment', paymentData);
  return response.data;
};

export const getOrders = async (userId?: string) => {
  const params = userId ? { userId } : {};
  const response = await api.get('/orders', { params });
  return response.data;
};

export const createOrder = async (orderData: {
  userId: string;
  items: any[];
  total: number;
  status?: string;
  customerInfo?: any;
}) => {
  const response = await api.post('/orders', orderData);
  return response.data;
};

export const deleteProduct = async (productId: string) => {
  // Check if admin mode is enabled via URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const isAdminMode = urlParams.get('admin') === 'true';
  
  // Add admin parameter to the request if enabled
  const params = isAdminMode ? { admin: 'true' } : {};
  const response = await api.delete(`/products/${productId}`, { params });
  return response.data;
};

export const updateOrderStatus = async (orderId: string, updateData: { status: string; trackingNumber?: string }) => {
  // Check if admin mode is enabled via URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const isAdminMode = urlParams.get('admin') === 'true';
  
  // Add admin parameter to the request if enabled
  const params = isAdminMode ? { admin: 'true' } : {};
  const response = await api.put(`/orders/${orderId}`, updateData, { params });
  return response.data;
};