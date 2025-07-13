import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.example.com';

const api = axios.create({
  baseURL: API_BASE_URL,
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

export const getUploadUrl = async (fileExtension: string) => {
  const response = await api.get(`/upload-url?ext=${fileExtension}`);
  return response.data;
};

export const uploadFile = async (uploadUrl: string, file: File) => {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });
  return response.ok;
};

export const addProduct = async (productData: any) => {
  const response = await api.post('/products', productData, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.data;
};

export const getOrders = async () => {
  const response = await api.get('/orders');
  return response.data;
};

export const createOrder = async (items: any[]) => {
  const response = await api.post('/orders', { items });
  return response.data;
};