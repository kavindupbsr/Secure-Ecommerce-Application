const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  // Auth0 user ID - primary identifier
  auth0Id: {
    type: String,
    required: true,
    unique: true,
    index: true,
    validate: {
      validator: function(v) {
        return /^auth0\|[a-zA-Z0-9]+$/.test(v) || /^[a-zA-Z0-9]+$/.test(v);
      },
      message: 'Invalid Auth0 user ID format'
    }
  },
  
  // User profile information from Auth0
  email: {
    type: String,
    required: true,
    lowercase: true,
    validate: {
      validator: validator.isEmail,
      message: 'Invalid email format'
    }
  },
  
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters'],
    validate: {
      validator: function(v) {
        return /^[a-zA-Z\s]+$/.test(v);
      },
      message: 'Name can only contain letters and spaces'
    }
  },
  
  username: {
    type: String,
    required: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot be more than 30 characters'],
    validate: {
      validator: function(v) {
        return /^[a-zA-Z0-9_]+$/.test(v);
      },
      message: 'Username can only contain letters, numbers, and underscores'
    }
  },
  
  picture: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || validator.isURL(v);
      },
      message: 'Picture must be a valid URL'
    }
  },
  
  // Additional profile information
  contactNumber: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^[\+]?[0-9\-\(\)\s]+$/.test(v);
      },
      message: 'Invalid contact number format'
    }
  },
  
  country: {
    type: String,
    trim: true,
    maxlength: [50, 'Country name cannot be more than 50 characters'],
    validate: {
      validator: function(v) {
        return !v || /^[a-zA-Z\s]+$/.test(v);
      },
      message: 'Country can only contain letters and spaces'
    }
  },
  
  // User preferences and settings
  preferences: {
    notifications: {
      type: Boolean,
      default: true
    },
    newsletter: {
      type: Boolean,
      default: false
    }
  },
  
  // Security and audit fields
  isActive: {
    type: Boolean,
    default: true
  },
  
  lastLogin: {
    type: Date,
    default: Date.now
  },
  
  loginAttempts: {
    type: Number,
    default: 0
  },
  
  lockUntil: Date,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      // Remove sensitive fields from JSON output
      delete ret.loginAttempts;
      delete ret.lockUntil;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ createdAt: -1 });

// Virtual for account locked status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to update the updatedAt field
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: {
        loginAttempts: 1
      },
      $unset: {
        lockUntil: 1
      }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: {
      loginAttempts: 1,
      lockUntil: 1
    },
    $set: {
      lastLogin: Date.now()
    }
  });
};

// Static method to find user by Auth0 ID
userSchema.statics.findByAuth0Id = function(auth0Id) {
  return this.findOne({ auth0Id, isActive: true });
};

// Static method to create or update user from Auth0 profile
userSchema.statics.createOrUpdateFromAuth0 = async function(auth0Profile) {
  const {
    sub: auth0Id,
    email,
    name,
    nickname: username,
    picture
  } = auth0Profile;
  
  try {
    const user = await this.findOneAndUpdate(
      { auth0Id },
      {
        auth0Id,
        email: email?.toLowerCase(),
        name,
        username: username || email?.split('@')[0],
        picture,
        lastLogin: Date.now()
      },
      {
        upsert: true,
        new: true,
        runValidators: true
      }
    );
    
    return user;
  } catch (error) {
    throw new Error(`Failed to create/update user: ${error.message}`);
  }
};

module.exports = mongoose.model('User', userSchema);
