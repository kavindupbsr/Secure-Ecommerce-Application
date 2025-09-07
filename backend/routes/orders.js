const express = require('express');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const User = require('../models/User');
const { verifyToken, enforceOwnership, sanitizeInput, securityLogger } = require('../middleware/auth');

const router = express.Router();

// Apply security middleware to all order routes
router.use(sanitizeInput);
router.use(securityLogger);
router.use(verifyToken); // All order operations require authentication

// Product pricing mapping (in a real app, this would be in a database)
const PRODUCT_PRICES = {
  'Laptop - Dell XPS 13': 1299.99,
  'Laptop - MacBook Pro': 1999.99,
  'Laptop - HP Spectre': 1149.99,
  'Smartphone - iPhone 15': 799.99,
  'Smartphone - Samsung Galaxy S24': 699.99,
  'Smartphone - Google Pixel 8': 599.99,
  'Tablet - iPad Pro': 799.99,
  'Tablet - Surface Pro': 899.99,
  'Headphones - Sony WH-1000XM5': 299.99,
  'Headphones - Bose QuietComfort': 249.99,
  'Smart Watch - Apple Watch': 399.99,
  'Smart Watch - Samsung Galaxy Watch': 249.99,
  'Camera - Canon EOS R5': 3899.99,
  'Camera - Sony A7 IV': 2499.99,
  'Gaming Console - PlayStation 5': 499.99,
  'Gaming Console - Xbox Series X': 499.99
};

/**
 * GET /api/orders
 * Get all orders for the authenticated user
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, sort = 'createdAt', order = 'desc' } = req.query;
    
    // Build query
    const query = { userId: req.user.sub };
    if (status && ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      query.status = status;
    }
    
    // Build sort
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;
    
    // Execute query with pagination
    const orders = await Order.find(query)
      .sort(sortObj)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();
    
    // Get total count for pagination
    const totalOrders = await Order.countDocuments(query);
    
    // Separate upcoming and past orders
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const upcomingOrders = orders.filter(order => {
      const deliveryDate = new Date(order.deliveryDate);
      deliveryDate.setHours(0, 0, 0, 0);
      return deliveryDate >= now && ['pending', 'confirmed', 'processing', 'shipped'].includes(order.status);
    });
    
    const pastOrders = orders.filter(order => {
      const deliveryDate = new Date(order.deliveryDate);
      deliveryDate.setHours(0, 0, 0, 0);
      return deliveryDate < now || order.status === 'delivered' || order.status === 'cancelled';
    });
    
    res.status(200).json({
      orders,
      upcomingOrders,
      pastOrders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalOrders / parseInt(limit)),
        totalOrders,
        limit: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      error: 'Failed to fetch orders'
    });
  }
});

/**
 * GET /api/orders/stats
 * Get order statistics for the authenticated user
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await Order.getUserStats(req.user.sub);
    
    // Calculate additional statistics
    const totalOrders = await Order.countDocuments({ userId: req.user.sub });
    const upcomingCount = await Order.countDocuments({
      userId: req.user.sub,
      deliveryDate: { $gte: new Date() },
      status: { $in: ['pending', 'confirmed', 'processing', 'shipped'] }
    });
    
    res.status(200).json({
      totalOrders,
      upcomingOrders: upcomingCount,
      statusBreakdown: stats
    });
    
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch order statistics'
    });
  }
});

/**
 * GET /api/orders/:id
 * Get a specific order by ID (user can only access their own orders)
 */
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        error: 'Order not found'
      });
    }
    
    // Check ownership
    if (order.userId !== req.user.sub) {
      return res.status(403).json({
        error: 'Access denied. You can only access your own orders.'
      });
    }
    
    res.status(200).json({ order });
    
  } catch (error) {
    console.error('Get order error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'Invalid order ID format'
      });
    }
    
    res.status(500).json({
      error: 'Failed to fetch order'
    });
  }
});

/**
 * POST /api/orders
 * Create a new order
 */
router.post('/',
  [
    body('productName')
      .isIn(Object.keys(PRODUCT_PRICES))
      .withMessage('Invalid product selection'),
    body('quantity')
      .isInt({ min: 1, max: 10 })
      .withMessage('Quantity must be between 1 and 10'),
    body('deliveryDate')
      .isISO8601()
      .custom((value) => {
        const deliveryDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        deliveryDate.setHours(0, 0, 0, 0);
        
        if (deliveryDate < today) {
          throw new Error('Delivery date must be today or in the future');
        }
        
        if (deliveryDate.getDay() === 0) {
          throw new Error('Delivery date cannot be Sunday');
        }
        
        return true;
      }),
    body('deliveryTime')
      .isIn(['10:00 AM', '11:00 AM', '12:00 PM'])
      .withMessage('Delivery time must be 10:00 AM, 11:00 AM, or 12:00 PM'),
    body('deliveryLocation')
      .isIn([
        'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
        'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
        'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
        'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
        'Moneragala', 'Ratnapura', 'Kegalle'
      ])
      .withMessage('Invalid delivery location'),
    body('message')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Message cannot exceed 500 characters')
      .custom((value) => {
        // Additional XSS protection
        if (value && /<script|<\/script|javascript:|on\w+\s*=/i.test(value)) {
          throw new Error('Message contains invalid characters');
        }
        return true;
      })
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array().map(err => err.msg)
        });
      }
      
      const { productName, quantity, deliveryDate, deliveryTime, deliveryLocation, message } = req.body;
      
      // Get unit price
      const unitPrice = PRODUCT_PRICES[productName];
      
      // Create order
      const orderData = {
        userId: req.user.sub,
        productName,
        quantity,
        deliveryDate: new Date(deliveryDate),
        deliveryTime,
        deliveryLocation,
        message: message || '',
        unitPrice,
        metadata: {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          sessionId: req.session?.id
        }
      };
      
      const order = new Order(orderData);
      await order.save();
      
      // Remove metadata from response
      const orderResponse = order.toJSON();
      
      res.status(201).json({
        message: 'Order created successfully',
        order: orderResponse
      });
      
    } catch (error) {
      console.error('Create order error:', error);
      
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          error: 'Validation failed',
          details: validationErrors
        });
      }
      
      res.status(500).json({
        error: 'Failed to create order'
      });
    }
  }
);

/**
 * PUT /api/orders/:id
 * Update an existing order (only if it's modifiable)
 */
router.put('/:id',
  [
    body('deliveryDate')
      .optional()
      .isISO8601()
      .custom((value) => {
        const deliveryDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        deliveryDate.setHours(0, 0, 0, 0);
        
        if (deliveryDate < today) {
          throw new Error('Delivery date must be today or in the future');
        }
        
        if (deliveryDate.getDay() === 0) {
          throw new Error('Delivery date cannot be Sunday');
        }
        
        return true;
      }),
    body('deliveryTime')
      .optional()
      .isIn(['10:00 AM', '11:00 AM', '12:00 PM'])
      .withMessage('Delivery time must be 10:00 AM, 11:00 AM, or 12:00 PM'),
    body('deliveryLocation')
      .optional()
      .isIn([
        'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
        'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
        'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
        'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
        'Moneragala', 'Ratnapura', 'Kegalle'
      ])
      .withMessage('Invalid delivery location'),
    body('message')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Message cannot exceed 500 characters')
      .custom((value) => {
        if (value && /<script|<\/script|javascript:|on\w+\s*=/i.test(value)) {
          throw new Error('Message contains invalid characters');
        }
        return true;
      })
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array().map(err => err.msg)
        });
      }
      
      const order = await Order.findById(req.params.id);
      
      if (!order) {
        return res.status(404).json({
          error: 'Order not found'
        });
      }
      
      // Check ownership and modification rights
      if (!order.canBeModifiedBy(req.user.sub)) {
        if (order.userId !== req.user.sub) {
          return res.status(403).json({
            error: 'Access denied. You can only modify your own orders.'
          });
        } else {
          return res.status(400).json({
            error: 'Order cannot be modified in its current status.'
          });
        }
      }
      
      // Update allowed fields
      const { deliveryDate, deliveryTime, deliveryLocation, message } = req.body;
      const updates = {};
      
      if (deliveryDate !== undefined) updates.deliveryDate = new Date(deliveryDate);
      if (deliveryTime !== undefined) updates.deliveryTime = deliveryTime;
      if (deliveryLocation !== undefined) updates.deliveryLocation = deliveryLocation;
      if (message !== undefined) updates.message = message;
      
      const updatedOrder = await Order.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true, runValidators: true }
      );
      
      res.status(200).json({
        message: 'Order updated successfully',
        order: updatedOrder
      });
      
    } catch (error) {
      console.error('Update order error:', error);
      
      if (error.name === 'CastError') {
        return res.status(400).json({
          error: 'Invalid order ID format'
        });
      }
      
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          error: 'Validation failed',
          details: validationErrors
        });
      }
      
      res.status(500).json({
        error: 'Failed to update order'
      });
    }
  }
);

/**
 * DELETE /api/orders/:id
 * Cancel an order (soft delete by changing status)
 */
router.delete('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        error: 'Order not found'
      });
    }
    
    // Check ownership and cancellation rights
    if (!order.canBeCancelledBy(req.user.sub)) {
      if (order.userId !== req.user.sub) {
        return res.status(403).json({
          error: 'Access denied. You can only cancel your own orders.'
        });
      } else {
        return res.status(400).json({
          error: 'Order cannot be cancelled in its current status.'
        });
      }
    }
    
    // Update order status to cancelled
    order.status = 'cancelled';
    await order.save();
    
    res.status(200).json({
      message: 'Order cancelled successfully',
      order
    });
    
  } catch (error) {
    console.error('Cancel order error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'Invalid order ID format'
      });
    }
    
    res.status(500).json({
      error: 'Failed to cancel order'
    });
  }
});

/**
 * GET /api/orders/products/list
 * Get list of available products with prices
 */
router.get('/products/list', (req, res) => {
  const products = Object.keys(PRODUCT_PRICES).map(productName => ({
    name: productName,
    price: PRODUCT_PRICES[productName]
  }));
  
  res.status(200).json({
    products
  });
});

module.exports = router;
