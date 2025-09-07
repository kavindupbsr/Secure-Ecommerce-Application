# 🛡️ Secure E-commerce Web Application

A comprehensive e-commerce web application built with the MERN stack, featuring Auth0 authentication and robust security measures against OWASP Top 10 vulnerabilities.

## 📋 Table of Contents

- [Features](#features)
- [Security Implementation](#security-implementation)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [SSL Certificate Setup](#ssl-certificate-setup)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Security Testing](#security-testing)
- [Deployment](#deployment)
- [Contributing](#contributing)

## ✨ Features

### Core Functionality
- **User Authentication**: Secure login/logout with Auth0 OIDC
- **User Profile Management**: View and update profile information
- **Product Catalog**: Browse electronics with categories and search
- **Order Management**: Create, view, update, and cancel orders
- **Delivery Scheduling**: Select delivery date, time, and location

### Security Features
- **Auth0 Integration**: Enterprise-grade authentication with JWT tokens
- **OWASP Top 10 Protection**: Comprehensive security measures
- **HTTPS Enforcement**: End-to-end encryption
- **Input Validation**: Client and server-side validation
- **Rate Limiting**: Protection against brute force attacks
- **CSRF Protection**: Cross-site request forgery prevention
- **XSS Prevention**: Content sanitization and CSP headers
- **SQL Injection Prevention**: Parameterized queries and input sanitization

## 🔒 Security Implementation

### OWASP Top 10 2021 Protection

1. **A01 - Broken Access Control**
   - JWT token validation on all protected routes
   - User-specific data access controls
   - Role-based authorization middleware

2. **A02 - Cryptographic Failures**
   - HTTPS enforcement in production
   - Secure JWT token handling
   - Password hashing with bcrypt (if applicable)

3. **A03 - Injection**
   - MongoDB parameterized queries
   - Input sanitization with DOMPurify
   - Express-validator for input validation

4. **A04 - Insecure Design**
   - Secure authentication flow with Auth0
   - Proper session management
   - Security-focused architecture

5. **A05 - Security Misconfiguration**
   - Helmet.js for security headers
   - Environment-based configuration
   - Disabled error details in production

6. **A06 - Vulnerable Components**
   - Regular dependency updates
   - npm audit integration
   - Secure dependency management

7. **A07 - Identification and Authentication Failures**
   - Auth0 enterprise authentication
   - JWT token expiration
   - Secure session handling

8. **A08 - Software and Data Integrity Failures**
   - Input validation and sanitization
   - Content Security Policy
   - Secure API communication

9. **A09 - Security Logging Failures**
   - Comprehensive logging middleware
   - Security event monitoring
   - Error tracking and reporting

10. **A10 - Server-Side Request Forgery**
    - URL validation
    - Restricted external requests
    - Input sanitization

## 🛠️ Technology Stack

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **MongoDB**: Database with Mongoose ODM
- **Auth0**: Authentication and authorization
- **Security Middleware**: Helmet, CORS, Rate Limiting

### Frontend
- **React 18**: UI framework
- **Auth0 React SDK**: Authentication integration
- **Axios**: HTTP client
- **React Router**: Navigation
- **React Hot Toast**: Notifications

### Security & DevOps
- **HTTPS**: SSL/TLS encryption
- **JWT**: Secure token-based authentication
- **Input Validation**: Client and server-side
- **Rate Limiting**: API protection
- **CSRF Protection**: Cross-site request forgery prevention

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (v6 or higher)
- **Auth0 Account** (free tier available)
- **SSL Certificate** (for HTTPS - can use self-signed for development)

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/secure-ecommerce-app.git
   cd secure-ecommerce-app
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

## ⚙️ Configuration

### 1. Auth0 Setup

1. **Create Auth0 Application**:
   - Go to [Auth0 Dashboard](https://manage.auth0.com/)
   - Create a new Single Page Application
   - Note down: Domain, Client ID, Client Secret

2. **Create Auth0 API**:
   - Create a new API in Auth0 Dashboard
   - Note down: API Identifier (Audience)

3. **Configure Auth0 Application**:
   - **Allowed Callback URLs**: `https://localhost:3000`
   - **Allowed Logout URLs**: `https://localhost:3000`
   - **Allowed Web Origins**: `https://localhost:3000`
   - **Allowed Origins (CORS)**: `https://localhost:3000`

### 2. Backend Environment Configuration

Create `backend/.env` file:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/secure-ecommerce

# Auth0 Configuration
AUTH0_DOMAIN=your-auth0-domain.auth0.com
AUTH0_AUDIENCE=your-api-identifier
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret

# Security Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-here-min-32-chars
SESSION_SECRET=your-session-secret-key-here-min-32-chars

# HTTPS Configuration (Development)
HTTPS_KEY_PATH=./ssl/private-key.pem
HTTPS_CERT_PATH=./ssl/certificate.pem

# CORS Configuration
ALLOWED_ORIGINS=https://localhost:3000,https://127.0.0.1:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Frontend Environment Configuration

Create `frontend/.env` file:

```env
# Auth0 Configuration
REACT_APP_AUTH0_DOMAIN=your-auth0-domain.auth0.com
REACT_APP_AUTH0_CLIENT_ID=your-client-id
REACT_APP_AUTH0_AUDIENCE=your-api-identifier

# API Configuration
REACT_APP_API_URL=https://localhost:5000/api

# App Configuration
REACT_APP_NAME=Secure E-commerce
REACT_APP_VERSION=1.0.0

# Security Configuration
GENERATE_SOURCEMAP=false

# SSL Configuration (for HTTPS development)
HTTPS=true
SSL_CRT_FILE=./ssl/certificate.pem
SSL_KEY_FILE=./ssl/private-key.pem
```

## 🔐 SSL Certificate Setup

### For Development (Self-Signed Certificate)

1. **Create SSL directory**:
   ```bash
   mkdir -p backend/ssl frontend/ssl
   ```

2. **Generate self-signed certificate**:
   ```bash
   # Generate private key
   openssl genrsa -out backend/ssl/private-key.pem 2048
   
   # Generate certificate
   openssl req -new -x509 -key backend/ssl/private-key.pem -out backend/ssl/certificate.pem -days 365
   
   # Copy to frontend
   cp backend/ssl/* frontend/ssl/
   ```

3. **Trust certificate** (for development):
   - **Chrome**: Navigate to `https://localhost:3000`, click "Advanced" → "Proceed to localhost"
   - **Firefox**: Add security exception

### For Production

Use certificates from a trusted Certificate Authority (CA) like Let's Encrypt, Cloudflare, or commercial CA.

## 🏃‍♂️ Running the Application

### Development Mode

1. **Start Backend**:
   ```bash
   cd backend
   npm run dev
   ```
   Backend will run on `https://localhost:5000`

2. **Start Frontend** (new terminal):
   ```bash
   cd frontend
   npm start
   ```
   Frontend will run on `https://localhost:3000`

3. **Access Application**:
   - Open `https://localhost:3000`
   - Accept SSL warnings (for self-signed certificates)

### Production Mode

1. **Build Frontend**:
   ```bash
   cd frontend
   npm run build
   ```

2. **Start Backend**:
   ```bash
   cd backend
   NODE_ENV=production npm start
   ```

## 🔌 API Endpoints

### Authentication Routes
```
POST   /api/auth/profile     - Sync user profile with Auth0
GET    /api/auth/me          - Get current user profile  
PUT    /api/auth/profile     - Update user profile
POST   /api/auth/logout      - Logout user
GET    /api/auth/status      - Check auth status
```

### Products Routes
```
GET    /api/products         - Get all products (with filtering)
GET    /api/products/:id     - Get single product
GET    /api/products/categories/list - Get product categories
GET    /api/products/search/:term   - Search products
GET    /api/products/config/delivery - Get delivery configuration
```

### Orders Routes (Protected)
```
GET    /api/orders           - Get user orders
POST   /api/orders           - Create new order
GET    /api/orders/:id       - Get single order
PUT    /api/orders/:id       - Update order
DELETE /api/orders/:id       - Cancel order
GET    /api/orders/stats     - Get order statistics
```

## 🧪 Security Testing

### Automated Security Checks

1. **Dependency Audit**:
   ```bash
   # Backend
   cd backend && npm audit
   
   # Frontend  
   cd frontend && npm audit
   ```

2. **Security Linting**:
   ```bash
   # Backend
   cd backend && npm run lint
   
   # Frontend
   cd frontend && npm run lint
   ```

### Manual Security Testing

1. **Authentication Testing**:
   - Test login/logout flow
   - Verify JWT token validation
   - Test protected route access

2. **Input Validation Testing**:
   - Test XSS payloads in forms
   - Test SQL injection attempts
   - Verify input sanitization

3. **Access Control Testing**:
   - Test unauthorized API access
   - Verify user-specific data isolation
   - Test role-based permissions

## 🚀 Deployment

### Prerequisites for Production

1. **Domain and SSL Certificate**: Obtain from trusted CA
2. **Environment Configuration**: Set production environment variables
3. **Database**: Use MongoDB Atlas or self-hosted production instance
4. **Auth0 Configuration**: Update URLs for production domain

### Deployment Steps

1. **Update Auth0 Configuration**:
   - Add production URLs to allowed origins
   - Update callback and logout URLs

2. **Environment Variables**:
   ```env
   NODE_ENV=production
   MONGODB_URI=mongodb://your-production-db-url
   ALLOWED_ORIGINS=https://yourdomain.com
   ```

3. **Build and Deploy**:
   ```bash
   # Build frontend
   cd frontend && npm run build
   
   # Deploy to your preferred hosting service
   # (Heroku, AWS, Digital Ocean, etc.)
   ```
