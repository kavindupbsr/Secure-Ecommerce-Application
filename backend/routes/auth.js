const express = require('express');
const { body } = require('express-validator');
const User = require('../models/User');
const { verifyToken, authRateLimit, sanitizeInput, securityLogger } = require('../middleware/auth');

const router = express.Router();

// Apply security middleware to all auth routes
router.use(authRateLimit);
router.use(sanitizeInput);
router.use(securityLogger);

/**
 * POST /api/auth/profile
 * Create or update user profile from Auth0 token
 * This endpoint is called after successful Auth0 authentication
 */
router.post('/profile', 
  verifyToken,
  [
    body('contactNumber')
      .optional()
      .matches(/^[\+]?[0-9\-\(\)\s]+$/)
      .withMessage('Invalid contact number format'),
    body('country')
      .optional()
      .isLength({ max: 50 })
      .matches(/^[a-zA-Z\s]*$/)
      .withMessage('Country can only contain letters and spaces')
  ],
  async (req, res) => {
    try {
      const { contactNumber, country } = req.body;
      
      // Extract user info from verified Auth0 token
      const auth0Profile = req.user;
      
      // Create or update user in database
      const user = await User.createOrUpdateFromAuth0(auth0Profile);
      
      // Update additional profile information if provided
      if (contactNumber !== undefined || country !== undefined) {
        const updates = {};
        if (contactNumber !== undefined) updates.contactNumber = contactNumber;
        if (country !== undefined) updates.country = country;
        
        await User.findByIdAndUpdate(user._id, updates, { 
          new: true, 
          runValidators: true 
        });
        
        // Fetch updated user
        const updatedUser = await User.findById(user._id);
        return res.status(200).json({
          message: 'Profile updated successfully',
          user: updatedUser
        });
      }
      
      res.status(200).json({
        message: 'Profile synced successfully',
        user
      });
      
    } catch (error) {
      console.error('Profile sync error:', error);
      
      // Handle validation errors
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          error: 'Validation failed',
          details: validationErrors
        });
      }
      
      res.status(500).json({
        error: 'Failed to sync profile'
      });
    }
  }
);

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findByAuth0Id(req.user.sub);
    
    if (!user) {
      return res.status(404).json({
        error: 'User profile not found'
      });
    }
    
    res.status(200).json({
      user
    });
    
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Failed to fetch profile'
    });
  }
});

/**
 * PUT /api/auth/profile
 * Update user profile information
 */
router.put('/profile',
  verifyToken,
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('Name can only contain letters and spaces'),
    body('contactNumber')
      .optional()
      .matches(/^[\+]?[0-9\-\(\)\s]*$/)
      .withMessage('Invalid contact number format'),
    body('country')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .matches(/^[a-zA-Z\s]*$/)
      .withMessage('Country can only contain letters and spaces'),
    body('preferences.notifications')
      .optional()
      .isBoolean()
      .withMessage('Notifications preference must be boolean'),
    body('preferences.newsletter')
      .optional()
      .isBoolean()
      .withMessage('Newsletter preference must be boolean')
  ],
  async (req, res) => {
    try {
      const { name, contactNumber, country, preferences } = req.body;
      
      const user = await User.findByAuth0Id(req.user.sub);
      
      if (!user) {
        return res.status(404).json({
          error: 'User profile not found'
        });
      }
      
      // Prepare updates
      const updates = {};
      if (name !== undefined) updates.name = name;
      if (contactNumber !== undefined) updates.contactNumber = contactNumber;
      if (country !== undefined) updates.country = country;
      if (preferences !== undefined) {
        updates.preferences = { ...user.preferences, ...preferences };
      }
      
      // Update user
      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        updates,
        { 
          new: true, 
          runValidators: true 
        }
      );
      
      res.status(200).json({
        message: 'Profile updated successfully',
        user: updatedUser
      });
      
    } catch (error) {
      console.error('Update profile error:', error);
      
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          error: 'Validation failed',
          details: validationErrors
        });
      }
      
      res.status(500).json({
        error: 'Failed to update profile'
      });
    }
  }
);

/**
 * POST /api/auth/logout
 * Logout endpoint (mainly for logging purposes)
 */
router.post('/logout', verifyToken, async (req, res) => {
  try {
    // Update user's last activity
    await User.findByAuth0Id(req.user.sub)
      .updateOne({ updatedAt: Date.now() });
    
    // Log the logout event
    console.log(`User ${req.user.sub} logged out at ${new Date().toISOString()}`);
    
    res.status(200).json({
      message: 'Logout successful'
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed'
    });
  }
});

/**
 * GET /api/auth/status
 * Check authentication status
 */
router.get('/status', verifyToken, (req, res) => {
  res.status(200).json({
    authenticated: true,
    user: {
      sub: req.user.sub,
      email: req.user.email,
      name: req.user.name
    }
  });
});

module.exports = router;
