import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { Helmet } from 'react-helmet-async';

// Components
import Navbar from './components/Navbar';
import Loading from './components/Loading';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import CreateOrder from './pages/CreateOrder';
import Login from './pages/Login';

function App() {
  const { isLoading, error } = useAuth0();

  if (error) {
    return (
      <div className="app-container">
        <Helmet>
          <title>Error - Secure E-commerce</title>
        </Helmet>
        <div className="container">
          <div className="error-message">
            <h2>Authentication Error</h2>
            <p>{error.message}</p>
            <button 
              className="btn btn-primary mt-3"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="app-container">
        <Helmet>
          <title>Loading - Secure E-commerce</title>
        </Helmet>
        <Loading />
      </div>
    );
  }

  return (
    <div className="app-container">
      <Helmet>
        <title>Secure E-commerce</title>
        <meta name="description" content="A secure e-commerce platform with Auth0 authentication" />
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*.auth0.com;" />
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
      </Helmet>
      
      <Navbar />
      
      <main role="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/products" element={<Products />} />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/new"
            element={
              <ProtectedRoute>
                <CreateOrder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
