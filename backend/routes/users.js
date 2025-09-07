const express = require('express');
const User = require('../models/User');
const { verifyToken, enforceOwnership, sanitizeInput } = require('../middleware/auth');

const router = express.Router();

// Apply security middleware
router.use(sanitizeInput);
router.use(verifyToken);

/**
 * GET /api/users/profile
 * Get current user's profile
 */
router.get('/profile', async (req, res) => {
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
    console.error('Get user profile error:', error);
    res.status(500).json({
      error: 'Failed to fetch user profile'
    });
  }
});

module.exports = router;
