import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Helmet } from 'react-helmet-async';
import { authAPI } from '../services/api';
import { validators, validateForm, sanitizeInput } from '../utils/security';
import toast from 'react-hot-toast';
import Loading from '../components/Loading';

const Profile = () => {
  const { user, getAccessTokenSilently } = useAuth0();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    contactNumber: '',
    country: '',
    preferences: {
      notifications: true,
      newsletter: false
    }
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    const setupToken = async () => {
      try {
        const token = await getAccessTokenSilently();
        localStorage.setItem('auth0_token', token);
      } catch (error) {
        console.error('Error getting token:', error);
      }
    };

    setupToken();
    fetchProfile();
  }, [getAccessTokenSilently]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      // Try to get existing profile
      try {
        const response = await authAPI.getMe();
        setUserProfile(response.data.user);
        setFormData({
          name: response.data.user.name || '',
          contactNumber: response.data.user.contactNumber || '',
          country: response.data.user.country || '',
          preferences: response.data.user.preferences || {
            notifications: true,
            newsletter: false
          }
        });
      } catch (error) {
        // If profile doesn't exist, sync with Auth0
        if (error.response?.status === 404) {
          await syncWithAuth0();
        } else {
          throw error;
        }
      }
      
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const syncWithAuth0 = async () => {
    try {
      const response = await authAPI.syncProfile();
      setUserProfile(response.data.user);
      setFormData({
        name: response.data.user.name || '',
        contactNumber: response.data.user.contactNumber || '',
        country: response.data.user.country || '',
        preferences: response.data.user.preferences || {
          notifications: true,
          newsletter: false
        }
      });
      toast.success('Profile synced with Auth0');
    } catch (error) {
      console.error('Error syncing profile:', error);
      toast.error('Failed to sync profile');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('preferences.')) {
      const prefKey = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [prefKey]: checked
        }
      }));
    } else {
      const sanitizedValue = type === 'checkbox' ? checked : sanitizeInput(value);
      setFormData(prev => ({
        ...prev,
        [name]: sanitizedValue
      }));
    }

    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateFormData = () => {
    const validationRules = {
      name: validators.name,
      contactNumber: validators.phone,
      country: validators.country
    };

    return validateForm(formData, validationRules);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validation = validateFormData();
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      setTouched({
        name: true,
        contactNumber: true,
        country: true
      });
      return;
    }

    try {
      setSaving(true);
      
      const response = await authAPI.updateProfile(formData);
      
      setUserProfile(response.data.user);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
      
    } catch (error) {
      console.error('Error updating profile:', error);
      
      if (error.response?.data?.details) {
        const serverErrors = {};
        error.response.data.details.forEach(detail => {
          const field = detail.toLowerCase().includes('name') ? 'name' :
                       detail.toLowerCase().includes('contact') || detail.toLowerCase().includes('phone') ? 'contactNumber' :
                       detail.toLowerCase().includes('country') ? 'country' : 'general';
          serverErrors[field] = detail;
        });
        setErrors(serverErrors);
      }
      
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: userProfile?.name || '',
      contactNumber: userProfile?.contactNumber || '',
      country: userProfile?.country || '',
      preferences: userProfile?.preferences || {
        notifications: true,
        newsletter: false
      }
    });
    setIsEditing(false);
    setErrors({});
    setTouched({});
  };

  const getFieldError = (fieldName) => {
    return touched[fieldName] && errors[fieldName] ? errors[fieldName] : null;
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <>
      <Helmet>
        <title>My Profile - Secure E-commerce</title>
        <meta name="description" content="Manage your secure user profile and preferences" />
      </Helmet>
      
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        {/* Header */}
        <div className="row">
          <div className="col">
            <h1 style={{ color: 'white', marginBottom: '0.5rem' }}>My Profile</h1>
            <p style={{ color: 'white', opacity: 0.9, marginBottom: '2rem' }}>
              Manage your profile information and preferences
            </p>
          </div>
        </div>

        <div className="row">
          {/* Profile Information */}
          <div className="col-md-8">
            <div className="card">
              <div className="card-header">
                <div className="d-flex justify-content-between align-items-center">
                  <h3>Profile Information</h3>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="btn btn-primary"
                    >
                      ✏️ Edit Profile
                    </button>
                  ) : (
                    <div className="d-flex" style={{ gap: '0.5rem' }}>
                      <button
                        onClick={handleCancel}
                        className="btn btn-secondary"
                        disabled={saving}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmit}
                        className="btn btn-success"
                        disabled={saving}
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  {/* Name */}
                  <div className="form-group">
                    <label htmlFor="name" className="form-label">
                      Full Name *
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        id="name"
                        name="name"
                        className={`form-control ${getFieldError('name') ? 'is-invalid' : ''}`}
                        value={formData.name}
                        onChange={handleInputChange}
                        maxLength="100"
                        required
                      />
                    ) : (
                      <p className="form-control-plaintext">{userProfile?.name || 'Not provided'}</p>
                    )}
                    {getFieldError('name') && (
                      <div className="invalid-feedback d-block">
                        {getFieldError('name')}
                      </div>
                    )}
                  </div>

                  {/* Email (Read-only) */}
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <p className="form-control-plaintext">
                      {userProfile?.email || user?.email}
                      <span className="badge badge-success ml-2">Verified</span>
                    </p>
                    <small className="form-text text-muted">
                      Email is managed through your Auth0 account
                    </small>
                  </div>

                  {/* Username (Read-only) */}
                  <div className="form-group">
                    <label className="form-label">Username</label>
                    <p className="form-control-plaintext">{userProfile?.username}</p>
                  </div>

                  {/* Contact Number */}
                  <div className="form-group">
                    <label htmlFor="contactNumber" className="form-label">
                      Contact Number
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        id="contactNumber"
                        name="contactNumber"
                        className={`form-control ${getFieldError('contactNumber') ? 'is-invalid' : ''}`}
                        value={formData.contactNumber}
                        onChange={handleInputChange}
                        placeholder="+1 (555) 123-4567"
                      />
                    ) : (
                      <p className="form-control-plaintext">
                        {userProfile?.contactNumber || 'Not provided'}
                      </p>
                    )}
                    {getFieldError('contactNumber') && (
                      <div className="invalid-feedback d-block">
                        {getFieldError('contactNumber')}
                      </div>
                    )}
                  </div>

                  {/* Country */}
                  <div className="form-group">
                    <label htmlFor="country" className="form-label">
                      Country
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        id="country"
                        name="country"
                        className={`form-control ${getFieldError('country') ? 'is-invalid' : ''}`}
                        value={formData.country}
                        onChange={handleInputChange}
                        maxLength="50"
                        placeholder="United States"
                      />
                    ) : (
                      <p className="form-control-plaintext">
                        {userProfile?.country || 'Not provided'}
                      </p>
                    )}
                    {getFieldError('country') && (
                      <div className="invalid-feedback d-block">
                        {getFieldError('country')}
                      </div>
                    )}
                  </div>

                  {/* Preferences */}
                  <div className="form-group">
                    <label className="form-label">Preferences</label>
                    <div className="mt-2">
                      <div className="form-check">
                        <input
                          type="checkbox"
                          id="notifications"
                          name="preferences.notifications"
                          className="form-check-input"
                          checked={formData.preferences.notifications}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                        <label htmlFor="notifications" className="form-check-label">
                          Email notifications for order updates
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          type="checkbox"
                          id="newsletter"
                          name="preferences.newsletter"
                          className="form-check-input"
                          checked={formData.preferences.newsletter}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                        <label htmlFor="newsletter" className="form-check-label">
                          Subscribe to newsletter
                        </label>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Profile Summary & Auth0 Info */}
          <div className="col-md-4">
            <div className="card">
              <div className="card-header">
                <h4>Account Summary</h4>
              </div>
              <div className="card-body text-center">
                {user?.picture && (
                  <img
                    src={user.picture}
                    alt="Profile"
                    style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      marginBottom: '1rem'
                    }}
                  />
                )}
                <h5>{userProfile?.name || user?.name}</h5>
                <p>{userProfile?.email || user?.email}</p>
                
                <div className="mt-3">
                  <div className="badge badge-success mb-2">✅ Auth0 Verified</div>
                  <br />
                  <div className="badge badge-info">🛡️ Secure Account</div>
                </div>
              </div>
            </div>

            <div className="card" style={{ marginTop: '1rem' }}>
              <div className="card-header">
                <h5>Account Security</h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <strong>Authentication:</strong>
                  <br />
                  <small>Managed by Auth0</small>
                </div>
                <div className="mb-3">
                  <strong>Last Login:</strong>
                  <br />
                  <small>{userProfile?.lastLogin ? new Date(userProfile.lastLogin).toLocaleDateString() : 'N/A'}</small>
                </div>
                <div className="mb-3">
                  <strong>Account Status:</strong>
                  <br />
                  <span className="badge badge-success">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
