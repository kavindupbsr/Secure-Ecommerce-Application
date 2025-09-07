const { jwtVerify, createRemoteJWKSet } = require('jose');
const rateLimit = require('express-rate-limit');

// Auth0 JWKS endpoint
const JWKS = createRemoteJWKSet(new URL(`https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`));

/**
 * Middleware to verify Auth0 JWT tokens
 * Implements OWASP security best practices for token validation
 */
const verifyToken = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Access denied. No token provided or invalid format.' 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied. Token is empty.' 
      });
    }

    // Verify the JWT token with Auth0
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://${process.env.AUTH0_DOMAIN}/`,
      audience: process.env.AUTH0_AUDIENCE,
    });

    // Add user information to request object
    req.user = {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      nickname: payload.nickname,
      picture: payload.picture,
      permissions: payload.permissions || [],
      scope: payload.scope
    };

    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    
    // Provide specific error messages for debugging in development
    if (process.env.NODE_ENV === 'development') {
      return res.status(401).json({ 
        error: 'Invalid token', 
        details: error.message 
      });
    }
    
    return res.status(401).json({ 
      error: 'Invalid token' 
    });
  }
};

/**
 * Middleware to check if user has required permissions
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required' 
      });
    }

    if (!req.user.permissions || !req.user.permissions.includes(permission)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions' 
      });
    }

    next();
  };
};

/**
 * Middleware to ensure user can only access their own data
 */
const enforceOwnership = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required' 
    });
  }

  // Extract user ID from different possible locations
  const requestedUserId = req.params.userId || req.body.userId || req.query.userId;
  const authenticatedUserId = req.user.sub;

  if (requestedUserId && requestedUserId !== authenticatedUserId) {
    return res.status(403).json({ 
      error: 'Access denied. You can only access your own data.' 
    });
  }

  next();
};

/**
 * Enhanced rate limiting for authentication endpoints
 */
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs for auth endpoints
  message: {
    error: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests
  skipSuccessfulRequests: true
});

/**
 * Middleware for input validation and sanitization
 */
const sanitizeInput = (req, res, next) => {
  // Recursively sanitize all string inputs
  const sanitize = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        // Basic XSS prevention - remove script tags and javascript: protocols
        obj[key] = obj[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);

  next();
};

/**
 * Middleware to log security events
 */
const securityLogger = (req, res, next) => {
  // Log suspicious activities
  const suspiciousPatterns = [
    /script/i,
    /javascript:/i,
    /on\w+=/i,
    /<.*>/,
    /union.*select/i,
    /drop.*table/i
  ];

  const checkSuspicious = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        for (let pattern of suspiciousPatterns) {
          if (pattern.test(obj[key])) {
            console.warn(`Suspicious input detected from IP ${req.ip}: ${obj[key]}`);
            return true;
          }
        }
      }
    }
    return false;
  };

  if (req.body) checkSuspicious(req.body);
  if (req.query) checkSuspicious(req.query);

  next();
};

module.exports = {
  verifyToken,
  requirePermission,
  enforceOwnership,
  authRateLimit,
  sanitizeInput,
  securityLogger
};
