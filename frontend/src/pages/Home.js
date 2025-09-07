import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { Helmet } from 'react-helmet-async';

const Home = () => {
  const { isAuthenticated, user } = useAuth0();

  return (
    <>
      <Helmet>
        <title>Home - Secure E-commerce</title>
        <meta name="description" content="Welcome to our secure e-commerce platform with Auth0 authentication" />
      </Helmet>
      
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <div className="row">
          <div className="col text-center">
            <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: 'white' }}>
              Welcome to SecureShop
            </h1>
            <p style={{ fontSize: '1.25rem', color: 'white', opacity: 0.9, marginBottom: '2rem' }}>
              Your trusted e-commerce platform with enterprise-level security
            </p>
            
            {isAuthenticated ? (
              <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <div className="card-body">
                  <h3>Hello, {user?.name || user?.email}! 👋</h3>
                  <p>Welcome back to your secure shopping experience.</p>
                  <div className="d-flex justify-content-center" style={{ gap: '1rem', flexWrap: 'wrap' }}>
                    <Link to="/products" className="btn btn-primary">
                      Browse Products
                    </Link>
                    <Link to="/orders" className="btn btn-secondary">
                      View Orders
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <div className="card-body">
                  <h3>Get Started</h3>
                  <p>Sign in to start shopping with our secure platform</p>
                  <Link to="/login" className="btn btn-primary">
                    Sign In to Shop
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Security Features Section */}
        <div className="row" style={{ marginTop: '4rem' }}>
          <div className="col">
            <h2 className="text-center" style={{ color: 'white', marginBottom: '2rem' }}>
              🛡️ Security Features
            </h2>
            <div className="row">
              <div className="col-md-4">
                <div className="card">
                  <div className="card-body text-center">
                    <h4>🔐 Auth0 Authentication</h4>
                    <p>Industry-standard OIDC/OAuth2 authentication with multi-factor support</p>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card">
                  <div className="card-body text-center">
                    <h4>🛡️ OWASP Protection</h4>
                    <p>Comprehensive protection against OWASP Top 10 vulnerabilities</p>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card">
                  <div className="card-body text-center">
                    <h4>🔒 HTTPS Encryption</h4>
                    <p>End-to-end encryption with TLS 1.3 for all communications</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Features Section */}
        <div className="row" style={{ marginTop: '3rem' }}>
          <div className="col">
            <h2 className="text-center" style={{ color: 'white', marginBottom: '2rem' }}>
              ✨ Platform Features
            </h2>
            <div className="row">
              <div className="col-md-3">
                <div className="card">
                  <div className="card-body text-center">
                    <h5>📱 Product Catalog</h5>
                    <p>Browse our extensive catalog of electronics and gadgets</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card">
                  <div className="card-body text-center">
                    <h5>🛒 Order Management</h5>
                    <p>Easy ordering with delivery scheduling and tracking</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card">
                  <div className="card-body text-center">
                    <h5>📋 User Profile</h5>
                    <p>Manage your profile and view order history securely</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card">
                  <div className="card-body text-center">
                    <h5>🚚 Delivery Options</h5>
                    <p>Flexible delivery times and locations across Sri Lanka</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        {isAuthenticated && (
          <div className="row" style={{ marginTop: '3rem' }}>
            <div className="col">
              <div className="card">
                <div className="card-header">
                  <h3>Quick Actions</h3>
                </div>
                <div className="card-body">
                  <div className="d-flex justify-content-center" style={{ gap: '1rem', flexWrap: 'wrap' }}>
                    <Link to="/orders/new" className="btn btn-success">
                      📦 Place New Order
                    </Link>
                    <Link to="/orders" className="btn btn-primary">
                      📋 View All Orders
                    </Link>
                    <Link to="/profile" className="btn btn-secondary">
                      👤 Update Profile
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Home;
