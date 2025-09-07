import React, { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Loading from '../components/Loading';

const Login = () => {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      // Redirect to intended page or home
      const returnTo = location.state?.returnTo || '/';
      navigate(returnTo);
    }
  }, [isAuthenticated, navigate, location.state]);

  const handleLogin = () => {
    loginWithRedirect({
      authorizationParams: {
        redirect_uri: window.location.origin,
        scope: 'openid profile email'
      },
      appState: {
        returnTo: location.state?.returnTo || '/'
      }
    });
  };

  if (isLoading) {
    return <Loading />;
  }

  if (isAuthenticated) {
    return <Loading />;
  }

  return (
    <>
      <Helmet>
        <title>Login - Secure E-commerce</title>
        <meta name="description" content="Secure login with Auth0 authentication" />
      </Helmet>
      
      <div className="container" style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
        <div className="row">
          <div className="col-md-6" style={{ margin: '0 auto' }}>
            <div className="card">
              <div className="card-header text-center">
                <h2>🔐 Secure Login</h2>
                <p>Sign in to access your account</p>
              </div>
              <div className="card-body text-center">
                <div style={{ marginBottom: '2rem' }}>
                  <h4>Welcome to SecureShop</h4>
                  <p>Your trusted e-commerce platform with enterprise-level security</p>
                </div>
                
                <div style={{ marginBottom: '2rem' }}>
                  <h5>🛡️ Security Features:</h5>
                  <ul style={{ textAlign: 'left', display: 'inline-block' }}>
                    <li>Auth0 Enterprise Authentication</li>
                    <li>Multi-Factor Authentication Support</li>
                    <li>OAuth 2.0 / OpenID Connect</li>
                    <li>End-to-End Encryption</li>
                    <li>OWASP Top 10 Protection</li>
                  </ul>
                </div>
                
                <button
                  onClick={handleLogin}
                  className="btn btn-primary"
                  style={{ padding: '0.75rem 2rem', fontSize: '1.1rem' }}
                >
                  🚀 Sign In with Auth0
                </button>
                
                <div style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#6b7280' }}>
                  <p>
                    By signing in, you agree to our secure authentication process.
                    Your data is protected with industry-standard security measures.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Security Information */}
        <div className="row" style={{ marginTop: '2rem' }}>
          <div className="col">
            <div className="card">
              <div className="card-header">
                <h3>🛡️ Why Our Platform is Secure</h3>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <h5>Authentication Security</h5>
                    <ul>
                      <li><strong>Auth0 Integration:</strong> Industry-leading identity provider</li>
                      <li><strong>JWT Tokens:</strong> Secure, stateless authentication</li>
                      <li><strong>Token Validation:</strong> Server-side verification of all requests</li>
                      <li><strong>Session Management:</strong> Secure session handling</li>
                    </ul>
                  </div>
                  <div className="col-md-6">
                    <h5>Data Protection</h5>
                    <ul>
                      <li><strong>HTTPS Encryption:</strong> All data encrypted in transit</li>
                      <li><strong>Input Sanitization:</strong> XSS and injection prevention</li>
                      <li><strong>Access Control:</strong> Role-based permissions</li>
                      <li><strong>Rate Limiting:</strong> Protection against brute force</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
