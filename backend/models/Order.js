const mongoose = require('mongoose');
const validator = require('validator');

const orderSchema = new mongoose.Schema({
  // User reference - for access control
  userId: {
    type: String,
    required: true,
    index: true,
    validate: {
      validator: function(v) {
        return /^auth0\|[a-zA-Z0-9]+$/.test(v) || /^[a-zA-Z0-9]+$/.test(v);
      },
      message: 'Invalid user ID format'
    }
  },
  
  // Order identification
  orderNumber: {
    type: String,
    required: true
  },
  
  // Product information
  productName: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, 'Product name cannot be more than 200 characters'],
    enum: {
      values: [
        'Laptop - Dell XPS 13',
        'Laptop - MacBook Pro',
        'Laptop - HP Spectre',
        'Smartphone - iPhone 15',
        'Smartphone - Samsung Galaxy S24',
        'Smartphone - Google Pixel 8',
        'Tablet - iPad Pro',
        'Tablet - Surface Pro',
        'Headphones - Sony WH-1000XM5',
        'Headphones - Bose QuietComfort',
        'Smart Watch - Apple Watch',
        'Smart Watch - Samsung Galaxy Watch',
        'Camera - Canon EOS R5',
        'Camera - Sony A7 IV',
        'Gaming Console - PlayStation 5',
        'Gaming Console - Xbox Series X'
      ],
      message: 'Product name must be from the predefined list'
    }
  },
  
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
    max: [10, 'Quantity cannot exceed 10 per order'],
    validate: {
      validator: Number.isInteger,
      message: 'Quantity must be an integer'
    }
  },
  
  // Delivery information
  deliveryDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(v) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const deliveryDate = new Date(v);
        deliveryDate.setHours(0, 0, 0, 0);
        
        // Must be today or future date
        if (deliveryDate < today) {
          return false;
        }
        
        // Cannot be Sunday (day 0)
        if (deliveryDate.getDay() === 0) {
          return false;
        }
        
        return true;
      },
      message: 'Delivery date must be on or after today and cannot be Sunday'
    }
  },
  
  deliveryTime: {
    type: String,
    required: true,
    enum: {
      values: ['10:00 AM', '11:00 AM', '12:00 PM'],
      message: 'Delivery time must be 10:00 AM, 11:00 AM, or 12:00 PM'
    }
  },
  
  deliveryLocation: {
    type: String,
    required: true,
    trim: true,
    enum: {
      values: [
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
      ],
      message: 'Delivery location must be a valid Sri Lankan district'
    }
  },
  
  // Customer message
  message: {
    type: String,
    trim: true,
    maxlength: [500, 'Message cannot be more than 500 characters'],
    validate: {
      validator: function(v) {
        // Basic XSS prevention - no script tags or HTML
        return !v || !/(<script|<\/script|javascript:|on\w+\s*=)/i.test(v);
      },
      message: 'Message contains invalid characters'
    }
  },
  
  // Order status and tracking
  status: {
    type: String,
    default: 'pending',
    enum: {
      values: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      message: 'Invalid order status'
    }
  },
  
  // Pricing information (could be calculated based on product and quantity)
  unitPrice: {
    type: Number,
    required: true,
    min: [0, 'Unit price cannot be negative'],
    validate: {
      validator: function(v) {
        // Validate price format (up to 2 decimal places)
        return /^\d+(\.\d{1,2})?$/.test(v.toString());
      },
      message: 'Invalid price format'
    }
  },
  
  totalPrice: {
    type: Number,
    required: true,
    min: [0, 'Total price cannot be negative']
  },
  
  // Timestamps for tracking
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Delivery tracking
  shippedAt: Date,
  deliveredAt: Date,
  
  // Additional metadata
  metadata: {
    ipAddress: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || validator.isIP(v);
        },
        message: 'Invalid IP address format'
      }
    },
    userAgent: String,
    sessionId: String
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      // Remove sensitive metadata from JSON output
      if (ret.metadata) {
        delete ret.metadata.ipAddress;
        delete ret.metadata.userAgent;
        delete ret.metadata.sessionId;
      }
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for efficient querying
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ deliveryDate: 1, deliveryTime: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

// Pre-save middleware
orderSchema.pre('save', function(next) {
  // Update the updatedAt field
  this.updatedAt = Date.now();
  
  // Calculate total price
  this.totalPrice = this.unitPrice * this.quantity;
  
  // Generate order number if not provided
  if (!this.orderNumber) {
    this.orderNumber = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
  }
  
  next();
});

// Virtual for checking if order is upcoming
orderSchema.virtual('isUpcoming').get(function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const deliveryDate = new Date(this.deliveryDate);
  deliveryDate.setHours(0, 0, 0, 0);
  
  return deliveryDate >= today && ['pending', 'confirmed', 'processing', 'shipped'].includes(this.status);
});

// Virtual for checking if order is past
orderSchema.virtual('isPast').get(function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const deliveryDate = new Date(this.deliveryDate);
  deliveryDate.setHours(0, 0, 0, 0);
  
  return deliveryDate < today || this.status === 'delivered' || this.status === 'cancelled';
});

// Static method to find orders by user with pagination
orderSchema.statics.findByUser = function(userId, options = {}) {
  const {
    page = 1,
    limit = 10,
    status = null,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;
  
  const query = { userId };
  if (status) {
    query.status = status;
  }
  
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
  return this.find(query)
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit);
};

// Static method to get user's order statistics
orderSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalValue: { $sum: '$totalPrice' }
      }
    }
  ]);
  
  return stats;
};

// Method to check if user can modify this order
orderSchema.methods.canBeModifiedBy = function(userId) {
  return this.userId === userId && ['pending', 'confirmed'].includes(this.status);
};

// Method to check if user can cancel this order
orderSchema.methods.canBeCancelledBy = function(userId) {
  return this.userId === userId && ['pending', 'confirmed', 'processing'].includes(this.status);
};

module.exports = mongoose.model('Order', orderSchema);
