import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth0();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    });
    toast.success('Logged out successfully');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'nav-link active' : 'nav-link';
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="row" style={{ width: '100%', alignItems: 'center' }}>
          <div className="col">
            <Link to="/" className="navbar-brand">
              🛡️ SecureShop
            </Link>
          </div>
          
          <div className="col-auto">
            <div className="navbar-nav">
              <Link to="/" className={isActive('/')}>
                Home
              </Link>
              
              <Link to="/products" className={isActive('/products')}>
                Products
              </Link>
              
              {isAuthenticated ? (
                <>
                  <Link to="/orders" className={isActive('/orders')}>
                    My Orders
                  </Link>
                  
                  <Link to="/profile" className={isActive('/profile')}>
                    Profile
                  </Link>
                  
                  <div className="nav-user-info">
                    <span className="nav-link no-select">
                      Welcome, {user?.name || user?.email}
                    </span>
                  </div>
                  
                  <button 
                    onClick={handleLogout}
                    className="btn btn-secondary"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button 
                  onClick={handleLogin}
                  className="btn btn-primary"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
