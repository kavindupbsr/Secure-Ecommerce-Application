const express = require('express');
const { sanitizeInput } = require('../middleware/auth');

const router = express.Router();

// Apply security middleware
router.use(sanitizeInput);

// Product data with categories
const PRODUCTS = [
  {
    id: 1,
    name: 'Laptop - Dell XPS 13',
    category: 'Laptops',
    price: 1299.99,
    description: 'Ultra-portable laptop with Intel Core i7 processor',
    image: 'https://via.placeholder.com/300x200?text=Dell+XPS+13',
    inStock: true
  },
  {
    id: 2,
    name: 'Laptop - MacBook Pro',
    category: 'Laptops',
    price: 1999.99,
    description: 'Apple MacBook Pro with M2 chip',
    image: 'https://via.placeholder.com/300x200?text=MacBook+Pro',
    inStock: true
  },
  {
    id: 3,
    name: 'Laptop - HP Spectre',
    category: 'Laptops',
    price: 1149.99,
    description: 'HP Spectre x360 convertible laptop',
    image: 'https://via.placeholder.com/300x200?text=HP+Spectre',
    inStock: true
  },
  {
    id: 4,
    name: 'Smartphone - iPhone 15',
    category: 'Smartphones',
    price: 799.99,
    description: 'Latest iPhone with advanced camera system',
    image: 'https://via.placeholder.com/300x200?text=iPhone+15',
    inStock: true
  },
  {
    id: 5,
    name: 'Smartphone - Samsung Galaxy S24',
    category: 'Smartphones',
    price: 699.99,
    description: 'Samsung Galaxy S24 with AI features',
    image: 'https://via.placeholder.com/300x200?text=Galaxy+S24',
    inStock: true
  },
  {
    id: 6,
    name: 'Smartphone - Google Pixel 8',
    category: 'Smartphones',
    price: 599.99,
    description: 'Google Pixel 8 with pure Android experience',
    image: 'https://via.placeholder.com/300x200?text=Pixel+8',
    inStock: true
  },
  {
    id: 7,
    name: 'Tablet - iPad Pro',
    category: 'Tablets',
    price: 799.99,
    description: 'iPad Pro with M2 chip and Apple Pencil support',
    image: 'https://via.placeholder.com/300x200?text=iPad+Pro',
    inStock: true
  },
  {
    id: 8,
    name: 'Tablet - Surface Pro',
    category: 'Tablets',
    price: 899.99,
    description: 'Microsoft Surface Pro with detachable keyboard',
    image: 'https://via.placeholder.com/300x200?text=Surface+Pro',
    inStock: true
  },
  {
    id: 9,
    name: 'Headphones - Sony WH-1000XM5',
    category: 'Audio',
    price: 299.99,
    description: 'Premium noise-canceling headphones',
    image: 'https://via.placeholder.com/300x200?text=Sony+WH-1000XM5',
    inStock: true
  },
  {
    id: 10,
    name: 'Headphones - Bose QuietComfort',
    category: 'Audio',
    price: 249.99,
    description: 'Comfortable noise-canceling headphones',
    image: 'https://via.placeholder.com/300x200?text=Bose+QC',
    inStock: true
  },
  {
    id: 11,
    name: 'Smart Watch - Apple Watch',
    category: 'Wearables',
    price: 399.99,
    description: 'Apple Watch with health monitoring features',
    image: 'https://via.placeholder.com/300x200?text=Apple+Watch',
    inStock: true
  },
  {
    id: 12,
    name: 'Smart Watch - Samsung Galaxy Watch',
    category: 'Wearables',
    price: 249.99,
    description: 'Samsung Galaxy Watch with fitness tracking',
    image: 'https://via.placeholder.com/300x200?text=Galaxy+Watch',
    inStock: true
  },
  {
    id: 13,
    name: 'Camera - Canon EOS R5',
    category: 'Cameras',
    price: 3899.99,
    description: 'Professional mirrorless camera with 8K video',
    image: 'https://via.placeholder.com/300x200?text=Canon+EOS+R5',
    inStock: true
  },
  {
    id: 14,
    name: 'Camera - Sony A7 IV',
    category: 'Cameras',
    price: 2499.99,
    description: 'Full-frame mirrorless camera with 4K video',
    image: 'https://via.placeholder.com/300x200?text=Sony+A7+IV',
    inStock: true
  },
  {
    id: 15,
    name: 'Gaming Console - PlayStation 5',
    category: 'Gaming',
    price: 499.99,
    description: 'Next-generation gaming console from Sony',
    image: 'https://via.placeholder.com/300x200?text=PlayStation+5',
    inStock: true
  },
  {
    id: 16,
    name: 'Gaming Console - Xbox Series X',
    category: 'Gaming',
    price: 499.99,
    description: 'Microsoft Xbox Series X with 4K gaming',
    image: 'https://via.placeholder.com/300x200?text=Xbox+Series+X',
    inStock: true
  }
];

// Delivery locations (Sri Lankan districts)
const DELIVERY_LOCATIONS = [
  'Colombo',
  'Gampaha',
  'Kalutara',
  'Kandy',
  'Matale',
  'Nuwara Eliya',
  'Galle',
  'Matara',
  'Hambantota',
  'Jaffna',
  'Kilinochchi',
  'Mannar',
  'Vavuniya',
  'Mullaitivu',
  'Batticaloa',
  'Ampara',
  'Trincomalee',
  'Kurunegala',
  'Puttalam',
  'Anuradhapura',
  'Polonnaruwa',
  'Badulla',
  'Moneragala',
  'Ratnapura',
  'Kegalle'
];

// Delivery times
const DELIVERY_TIMES = [
  '10:00 AM',
  '11:00 AM',
  '12:00 PM'
];

/**
 * GET /api/products
 * Get all products with optional filtering and pagination
 */
router.get('/', (req, res) => {
  try {
    const { category, search, page = 1, limit = 12 } = req.query;
    
    let filteredProducts = [...PRODUCTS];
    
    // Filter by category
    if (category && category !== 'all') {
      filteredProducts = filteredProducts.filter(product => 
        product.category.toLowerCase() === category.toLowerCase()
      );
    }
    
    // Filter by search term
    if (search) {
      const searchLower = search.toLowerCase();
      filteredProducts = filteredProducts.filter(product =>
        product.name.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower) ||
        product.category.toLowerCase().includes(searchLower)
      );
    }
    
    // Pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
    
    // Get unique categories
    const categories = [...new Set(PRODUCTS.map(product => product.category))];
    
    res.status(200).json({
      products: paginatedProducts,
      categories,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(filteredProducts.length / parseInt(limit)),
        totalProducts: filteredProducts.length,
        limit: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      error: 'Failed to fetch products'
    });
  }
});

/**
 * GET /api/products/:id
 * Get a specific product by ID
 */
router.get('/:id', (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const product = PRODUCTS.find(p => p.id === productId);
    
    if (!product) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }
    
    res.status(200).json({
      product
    });
    
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      error: 'Failed to fetch product'
    });
  }
});

/**
 * GET /api/products/categories/list
 * Get list of all product categories
 */
router.get('/categories/list', (req, res) => {
  try {
    const categories = [...new Set(PRODUCTS.map(product => product.category))];
    
    res.status(200).json({
      categories
    });
    
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      error: 'Failed to fetch categories'
    });
  }
});

/**
 * GET /api/products/config/delivery
 * Get delivery configuration (locations and times)
 */
router.get('/config/delivery', (req, res) => {
  try {
    res.status(200).json({
      locations: DELIVERY_LOCATIONS,
      times: DELIVERY_TIMES
    });
    
  } catch (error) {
    console.error('Get delivery config error:', error);
    res.status(500).json({
      error: 'Failed to fetch delivery configuration'
    });
  }
});

/**
 * GET /api/products/search/:term
 * Search products by name, description, or category
 */
router.get('/search/:term', (req, res) => {
  try {
    const searchTerm = req.params.term.toLowerCase();
    const { limit = 10 } = req.query;
    
    const searchResults = PRODUCTS.filter(product =>
      product.name.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm)
    ).slice(0, parseInt(limit));
    
    res.status(200).json({
      products: searchResults,
      searchTerm: req.params.term,
      totalResults: searchResults.length
    });
    
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({
      error: 'Failed to search products'
    });
  }
});

module.exports = router;
