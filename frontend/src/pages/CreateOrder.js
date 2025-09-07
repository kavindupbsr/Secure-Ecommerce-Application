import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ordersAPI, productsAPI } from '../services/api';
import { validators, validateForm, sanitizeInput } from '../utils/security';
import { format, addDays } from 'date-fns';
import toast from 'react-hot-toast';
import Loading from '../components/Loading';

const CreateOrder = () => {
  const { getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [loading, setLoading] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [products, setProducts] = useState([]);
  const [deliveryConfig, setDeliveryConfig] = useState({
    locations: [],
    times: []
  });

  const [formData, setFormData] = useState({
    productName: location.state?.selectedProduct || '',
    quantity: 1,
    deliveryDate: '',
    deliveryTime: '',
    deliveryLocation: '',
    message: ''
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
    fetchConfiguration();
  }, [getAccessTokenSilently]);

  const fetchConfiguration = async () => {
    try {
      setLoadingConfig(true);
      
      const [productsResponse, deliveryResponse] = await Promise.all([
        ordersAPI.getProductList(),
        productsAPI.getDeliveryConfig()
      ]);
      
      setProducts(productsResponse.data.products);
      setDeliveryConfig({
        locations: deliveryResponse.data.locations,
        times: deliveryResponse.data.times
      });
      
      // Set default delivery date (tomorrow, but not Sunday)
      const tomorrow = addDays(new Date(), 1);
      let defaultDate = tomorrow;
      
      // If tomorrow is Sunday, set to Monday
      if (defaultDate.getDay() === 0) {
        defaultDate = addDays(defaultDate, 1);
      }
      
      setFormData(prev => ({
        ...prev,
        deliveryDate: format(defaultDate, 'yyyy-MM-dd'),
        deliveryTime: deliveryResponse.data.times[0] || '',
        deliveryLocation: deliveryResponse.data.locations[0] || ''
      }));
      
    } catch (error) {
      console.error('Error fetching configuration:', error);
      toast.error('Failed to load form configuration');
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const sanitizedValue = sanitizeInput(value);
    
    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue
    }));

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
      productName: (value) => {
        if (!value) return { isValid: false, message: 'Please select a product' };
        if (!products.find(p => p.name === value)) {
          return { isValid: false, message: 'Please select a valid product' };
        }
        return { isValid: true };
      },
      quantity: validators.quantity,
      deliveryDate: (value) => validators.date(value, { futureOnly: true, excludeSundays: true }),
      deliveryTime: (value) => {
        if (!value) return { isValid: false, message: 'Please select a delivery time' };
        if (!deliveryConfig.times.includes(value)) {
          return { isValid: false, message: 'Please select a valid delivery time' };
        }
        return { isValid: true };
      },
      deliveryLocation: (value) => {
        if (!value) return { isValid: false, message: 'Please select a delivery location' };
        if (!deliveryConfig.locations.includes(value)) {
          return { isValid: false, message: 'Please select a valid delivery location' };
        }
        return { isValid: true };
      },
      message: validators.message
    };

    return validateForm(formData, validationRules);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validation = validateFormData();
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      setTouched({
        productName: true,
        quantity: true,
        deliveryDate: true,
        deliveryTime: true,
        deliveryLocation: true,
        message: true
      });
      
      // Focus first error field
      const firstErrorField = Object.keys(validation.errors)[0];
      document.querySelector(`[name="${firstErrorField}"]`)?.focus();
      
      return;
    }

    try {
      setLoading(true);
      
      const orderData = {
        ...formData,
        quantity: parseInt(formData.quantity, 10),
        deliveryDate: formData.deliveryDate
      };

      const response = await ordersAPI.createOrder(orderData);
      
      toast.success('Order placed successfully!');
      navigate('/orders', { 
        state: { newOrderId: response.data.order._id } 
      });
      
    } catch (error) {
      console.error('Error creating order:', error);
      
      if (error.response?.data?.details) {
        // Handle validation errors from server
        const serverErrors = {};
        error.response.data.details.forEach(detail => {
          const field = detail.toLowerCase().includes('product') ? 'productName' :
                       detail.toLowerCase().includes('quantity') ? 'quantity' :
                       detail.toLowerCase().includes('date') ? 'deliveryDate' :
                       detail.toLowerCase().includes('time') ? 'deliveryTime' :
                       detail.toLowerCase().includes('location') ? 'deliveryLocation' :
                       detail.toLowerCase().includes('message') ? 'message' : 'general';
          serverErrors[field] = detail;
        });
        setErrors(serverErrors);
      }
      
      toast.error('Failed to place order. Please check the form and try again.');
    } finally {
      setLoading(false);
    }
  };

  const getFieldError = (fieldName) => {
    return touched[fieldName] && errors[fieldName] ? errors[fieldName] : null;
  };

  const getSelectedProductPrice = () => {
    const selectedProduct = products.find(p => p.name === formData.productName);
    return selectedProduct ? selectedProduct.price : 0;
  };

  const calculateTotal = () => {
    const unitPrice = getSelectedProductPrice();
    const quantity = parseInt(formData.quantity, 10) || 0;
    return unitPrice * quantity;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  if (loadingConfig) {
    return <Loading />;
  }

  return (
    <>
      <Helmet>
        <title>Place New Order - Secure E-commerce</title>
        <meta name="description" content="Place a new secure order with delivery scheduling" />
      </Helmet>
      
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        {/* Header */}
        <div className="row">
          <div className="col">
            <h1 style={{ color: 'white', marginBottom: '0.5rem' }}>Place New Order</h1>
            <p style={{ color: 'white', opacity: 0.9, marginBottom: '2rem' }}>
              Fill out the form below to place your secure order
            </p>
          </div>
        </div>

        <div className="row">
          <div className="col-md-8">
            <div className="card">
              <div className="card-header">
                <h3>Order Details</h3>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  {/* Product Selection */}
                  <div className="form-group">
                    <label htmlFor="productName" className="form-label">
                      Product *
                    </label>
                    <select
                      id="productName"
                      name="productName"
                      className={`form-control ${getFieldError('productName') ? 'is-invalid' : ''}`}
                      value={formData.productName}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select a product</option>
                      {products.map(product => (
                        <option key={product.name} value={product.name}>
                          {product.name} - {formatPrice(product.price)}
                        </option>
                      ))}
                    </select>
                    {getFieldError('productName') && (
                      <div className="invalid-feedback d-block">
                        {getFieldError('productName')}
                      </div>
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="form-group">
                    <label htmlFor="quantity" className="form-label">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      id="quantity"
                      name="quantity"
                      className={`form-control ${getFieldError('quantity') ? 'is-invalid' : ''}`}
                      value={formData.quantity}
                      onChange={handleInputChange}
                      min="1"
                      max="10"
                      required
                    />
                    {getFieldError('quantity') && (
                      <div className="invalid-feedback d-block">
                        {getFieldError('quantity')}
                      </div>
                    )}
                    <small className="form-text text-muted">
                      Maximum 10 items per order
                    </small>
                  </div>

                  {/* Delivery Date */}
                  <div className="form-group">
                    <label htmlFor="deliveryDate" className="form-label">
                      Delivery Date *
                    </label>
                    <input
                      type="date"
                      id="deliveryDate"
                      name="deliveryDate"
                      className={`form-control ${getFieldError('deliveryDate') ? 'is-invalid' : ''}`}
                      value={formData.deliveryDate}
                      onChange={handleInputChange}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      required
                    />
                    {getFieldError('deliveryDate') && (
                      <div className="invalid-feedback d-block">
                        {getFieldError('deliveryDate')}
                      </div>
                    )}
                    <small className="form-text text-muted">
                      Select a date from today onwards. Sundays are not available.
                    </small>
                  </div>

                  {/* Delivery Time */}
                  <div className="form-group">
                    <label htmlFor="deliveryTime" className="form-label">
                      Delivery Time *
                    </label>
                    <select
                      id="deliveryTime"
                      name="deliveryTime"
                      className={`form-control ${getFieldError('deliveryTime') ? 'is-invalid' : ''}`}
                      value={formData.deliveryTime}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select delivery time</option>
                      {deliveryConfig.times.map(time => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                    {getFieldError('deliveryTime') && (
                      <div className="invalid-feedback d-block">
                        {getFieldError('deliveryTime')}
                      </div>
                    )}
                  </div>

                  {/* Delivery Location */}
                  <div className="form-group">
                    <label htmlFor="deliveryLocation" className="form-label">
                      Delivery Location *
                    </label>
                    <select
                      id="deliveryLocation"
                      name="deliveryLocation"
                      className={`form-control ${getFieldError('deliveryLocation') ? 'is-invalid' : ''}`}
                      value={formData.deliveryLocation}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select delivery location</option>
                      {deliveryConfig.locations.map(location => (
                        <option key={location} value={location}>
                          {location}
                        </option>
                      ))}
                    </select>
                    {getFieldError('deliveryLocation') && (
                      <div className="invalid-feedback d-block">
                        {getFieldError('deliveryLocation')}
                      </div>
                    )}
                  </div>

                  {/* Message */}
                  <div className="form-group">
                    <label htmlFor="message" className="form-label">
                      Special Instructions (Optional)
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      className={`form-control ${getFieldError('message') ? 'is-invalid' : ''}`}
                      value={formData.message}
                      onChange={handleInputChange}
                      rows="3"
                      maxLength="500"
                      placeholder="Any special delivery instructions..."
                    />
                    {getFieldError('message') && (
                      <div className="invalid-feedback d-block">
                        {getFieldError('message')}
                      </div>
                    )}
                    <small className="form-text text-muted">
                      {formData.message.length}/500 characters
                    </small>
                  </div>

                  {/* Submit Button */}
                  <div className="d-flex justify-content-between align-items-center">
                    <button
                      type="button"
                      onClick={() => navigate(-1)}
                      className="btn btn-secondary"
                      disabled={loading}
                    >
                      ← Back
                    </button>
                    <button
                      type="submit"
                      className="btn btn-success"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="loading-spinner mr-2"></span>
                          Placing Order...
                        </>
                      ) : (
                        '🛒 Place Order'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="col-md-4">
            <div className="card">
              <div className="card-header">
                <h4>Order Summary</h4>
              </div>
              <div className="card-body">
                {formData.productName ? (
                  <>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Product:</span>
                      <span>{formData.productName.split(' - ')[1] || formData.productName}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Unit Price:</span>
                      <span>{formatPrice(getSelectedProductPrice())}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Quantity:</span>
                      <span>{formData.quantity}</span>
                    </div>
                    <hr />
                    <div className="d-flex justify-content-between mb-3">
                      <strong>Total:</strong>
                      <strong style={{ color: '#059669' }}>
                        {formatPrice(calculateTotal())}
                      </strong>
                    </div>
                    
                    {formData.deliveryDate && (
                      <>
                        <h5>Delivery Details</h5>
                        <div className="mb-2">
                          <strong>Date:</strong> {format(new Date(formData.deliveryDate), 'MMMM dd, yyyy')}
                        </div>
                        {formData.deliveryTime && (
                          <div className="mb-2">
                            <strong>Time:</strong> {formData.deliveryTime}
                          </div>
                        )}
                        {formData.deliveryLocation && (
                          <div className="mb-2">
                            <strong>Location:</strong> {formData.deliveryLocation}
                          </div>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <p className="text-muted">Select a product to see order summary</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateOrder;
