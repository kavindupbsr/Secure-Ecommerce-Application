import DOMPurify from 'dompurify';
import validator from 'validator';

/**
 * Security utilities for input validation and sanitization
 * Implements OWASP security best practices
 */

// XSS Prevention
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') {
    return input;
  }
  
  // Use DOMPurify to sanitize HTML content
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  });
};

// Input validation functions
export const validators = {
  // Email validation
  email: (email) => {
    if (!email) return { isValid: false, message: 'Email is required' };
    if (!validator.isEmail(email)) {
      return { isValid: false, message: 'Please enter a valid email address' };
    }
    return { isValid: true };
  },

  // Name validation
  name: (name) => {
    if (!name) return { isValid: false, message: 'Name is required' };
    if (name.length < 2) {
      return { isValid: false, message: 'Name must be at least 2 characters long' };
    }
    if (name.length > 100) {
      return { isValid: false, message: 'Name cannot exceed 100 characters' };
    }
    if (!/^[a-zA-Z\s]+$/.test(name)) {
      return { isValid: false, message: 'Name can only contain letters and spaces' };
    }
    return { isValid: true };
  },

  // Username validation
  username: (username) => {
    if (!username) return { isValid: false, message: 'Username is required' };
    if (username.length < 3) {
      return { isValid: false, message: 'Username must be at least 3 characters long' };
    }
    if (username.length > 30) {
      return { isValid: false, message: 'Username cannot exceed 30 characters' };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return { isValid: false, message: 'Username can only contain letters, numbers, and underscores' };
    }
    return { isValid: true };
  },

  // Phone number validation
  phone: (phone) => {
    if (!phone) return { isValid: true }; // Optional field
    if (!/^[\+]?[0-9\-\(\)\s]+$/.test(phone)) {
      return { isValid: false, message: 'Please enter a valid phone number' };
    }
    return { isValid: true };
  },

  // Country validation
  country: (country) => {
    if (!country) return { isValid: true }; // Optional field
    if (country.length > 50) {
      return { isValid: false, message: 'Country name cannot exceed 50 characters' };
    }
    if (!/^[a-zA-Z\s]*$/.test(country)) {
      return { isValid: false, message: 'Country can only contain letters and spaces' };
    }
    return { isValid: true };
  },

  // Quantity validation
  quantity: (quantity) => {
    const num = parseInt(quantity, 10);
    if (isNaN(num)) {
      return { isValid: false, message: 'Quantity must be a number' };
    }
    if (num < 1) {
      return { isValid: false, message: 'Quantity must be at least 1' };
    }
    if (num > 10) {
      return { isValid: false, message: 'Quantity cannot exceed 10' };
    }
    return { isValid: true };
  },

  // Date validation
  date: (date, options = {}) => {
    if (!date) return { isValid: false, message: 'Date is required' };
    
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (isNaN(selectedDate.getTime())) {
      return { isValid: false, message: 'Please select a valid date' };
    }
    
    if (options.futureOnly && selectedDate < today) {
      return { isValid: false, message: 'Date must be today or in the future' };
    }
    
    if (options.excludeSundays && selectedDate.getDay() === 0) {
      return { isValid: false, message: 'Sundays are not available for delivery' };
    }
    
    return { isValid: true };
  },

  // Message validation
  message: (message) => {
    if (!message) return { isValid: true }; // Optional field
    
    if (message.length > 500) {
      return { isValid: false, message: 'Message cannot exceed 500 characters' };
    }
    
    // Check for potential XSS attempts
    const dangerousPatterns = [
      /<script/i,
      /<\/script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i
    ];
    
    for (let pattern of dangerousPatterns) {
      if (pattern.test(message)) {
        return { isValid: false, message: 'Message contains invalid characters' };
      }
    }
    
    return { isValid: true };
  }
};

// Form validation helper
export const validateForm = (formData, rules) => {
  const errors = {};
  let isValid = true;

  for (const [field, value] of Object.entries(formData)) {
    if (rules[field]) {
      const validation = rules[field](value);
      if (!validation.isValid) {
        errors[field] = validation.message;
        isValid = false;
      }
    }
  }

  return { isValid, errors };
};

// Secure local storage helpers
export const secureStorage = {
  setItem: (key, value) => {
    try {
      // Encrypt sensitive data before storing (in a real app, use proper encryption)
      const encryptedValue = btoa(JSON.stringify(value));
      localStorage.setItem(key, encryptedValue);
    } catch (error) {
      console.error('Error storing data:', error);
    }
  },

  getItem: (key) => {
    try {
      const encryptedValue = localStorage.getItem(key);
      if (!encryptedValue) return null;
      
      return JSON.parse(atob(encryptedValue));
    } catch (error) {
      console.error('Error retrieving data:', error);
      return null;
    }
  },

  removeItem: (key) => {
    localStorage.removeItem(key);
  },

  clear: () => {
    localStorage.clear();
  }
};

// CSRF token helper
export const getCSRFToken = () => {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
};

// URL validation
export const isValidURL = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

// Sanitize URL to prevent open redirect attacks
export const sanitizeURL = (url, allowedDomains = []) => {
  try {
    const parsedURL = new URL(url);
    
    // Check if domain is in allowed list
    if (allowedDomains.length > 0) {
      const isAllowed = allowedDomains.some(domain => 
        parsedURL.hostname === domain || parsedURL.hostname.endsWith(`.${domain}`)
      );
      
      if (!isAllowed) {
        throw new Error('Domain not allowed');
      }
    }
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsedURL.protocol)) {
      throw new Error('Invalid protocol');
    }
    
    return parsedURL.toString();
  } catch (error) {
    console.warn('Invalid URL:', url, error.message);
    return null;
  }
};

// Rate limiting helper (client-side)
export class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.requests = [];
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  canMakeRequest() {
    const now = Date.now();
    
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    // Check if we can make another request
    if (this.requests.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    this.requests.push(now);
    return true;
  }

  getTimeUntilReset() {
    if (this.requests.length === 0) return 0;
    
    const oldestRequest = Math.min(...this.requests);
    const timeUntilReset = this.windowMs - (Date.now() - oldestRequest);
    
    return Math.max(0, timeUntilReset);
  }
}

// Create a default rate limiter for API calls
export const apiRateLimiter = new RateLimiter(50, 60000); // 50 requests per minute

// Security headers helper
export const addSecurityHeaders = (headers = {}) => {
  return {
    ...headers,
    'X-Requested-With': 'XMLHttpRequest',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };
};

export default {
  sanitizeInput,
  validators,
  validateForm,
  secureStorage,
  getCSRFToken,
  isValidURL,
  sanitizeURL,
  RateLimiter,
  apiRateLimiter,
  addSecurityHeaders
};
