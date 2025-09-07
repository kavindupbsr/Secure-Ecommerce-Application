import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance with security configurations
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  // Security: Validate SSL certificates
  httpsAgent: process.env.NODE_ENV === 'production' ? undefined : undefined
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Get token from Auth0 (will be set by the component)
    const token = localStorage.getItem('auth0_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add CSRF protection header if available
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle different types of errors
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - redirect to login
          toast.error('Authentication required. Please log in.');
          // Clear invalid token
          localStorage.removeItem('auth0_token');
          window.location.href = '/login';
          break;
          
        case 403:
          toast.error('Access denied. You do not have permission to perform this action.');
          break;
          
        case 404:
          toast.error('Resource not found.');
          break;
          
        case 429:
          toast.error('Too many requests. Please wait a moment before trying again.');
          break;
          
        case 500:
          toast.error('Server error. Please try again later.');
          break;
          
        default:
          // Show specific error message from API if available
          const errorMessage = data?.error || data?.message || 'An unexpected error occurred';
          toast.error(errorMessage);
      }
    } else if (error.request) {
      // Network error
      toast.error('Network error. Please check your connection and try again.');
    } else {
      // Other error
      toast.error('An unexpected error occurred');
    }
    
    return Promise.reject(error);
  }
);

// Helper function to set auth token
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('auth0_token', token);
  } else {
    localStorage.removeItem('auth0_token');
  }
};

// Auth API calls
export const authAPI = {
  // Sync profile with Auth0
  syncProfile: (profileData) => apiClient.post('/auth/profile', profileData),
  
  // Get current user profile
  getMe: () => apiClient.get('/auth/me'),
  
  // Update profile
  updateProfile: (profileData) => apiClient.put('/auth/profile', profileData),
  
  // Logout
  logout: () => apiClient.post('/auth/logout'),
  
  // Check auth status
  checkStatus: () => apiClient.get('/auth/status')
};

// Products API calls
export const productsAPI = {
  // Get all products with filtering
  getProducts: (params = {}) => apiClient.get('/products', { params }),
  
  // Get single product
  getProduct: (id) => apiClient.get(`/products/${id}`),
  
  // Get categories
  getCategories: () => apiClient.get('/products/categories/list'),
  
  // Search products
  searchProducts: (term, limit = 10) => apiClient.get(`/products/search/${encodeURIComponent(term)}`, {
    params: { limit }
  }),
  
  // Get delivery configuration
  getDeliveryConfig: () => apiClient.get('/products/config/delivery')
};

// Orders API calls
export const ordersAPI = {
  // Get user orders
  getOrders: (params = {}) => apiClient.get('/orders', { params }),
  
  // Get single order
  getOrder: (id) => apiClient.get(`/orders/${id}`),
  
  // Create new order
  createOrder: (orderData) => apiClient.post('/orders', orderData),
  
  // Update order
  updateOrder: (id, orderData) => apiClient.put(`/orders/${id}`, orderData),
  
  // Cancel order
  cancelOrder: (id) => apiClient.delete(`/orders/${id}`),
  
  // Get order statistics
  getOrderStats: () => apiClient.get('/orders/stats'),
  
  // Get product list for orders
  getProductList: () => apiClient.get('/orders/products/list')
};

// Users API calls
export const usersAPI = {
  // Get user profile
  getProfile: () => apiClient.get('/users/profile')
};

export default apiClient;
