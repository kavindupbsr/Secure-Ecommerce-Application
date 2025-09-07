import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ordersAPI } from '../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Loading from '../components/Loading';

const Orders = () => {
  const { getAccessTokenSilently } = useAuth0();
  const [orders, setOrders] = useState([]);
  const [upcomingOrders, setUpcomingOrders] = useState([]);
  const [pastOrders, setPastOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0
  });

  useEffect(() => {
    fetchOrders();
  }, [filter, pagination.currentPage]);

  useEffect(() => {
    const setupToken = async () => {
      try {
        const token = await getAccessTokenSilently();
        // Store token for API calls
        localStorage.setItem('auth0_token', token);
      } catch (error) {
        console.error('Error getting token:', error);
      }
    };

    setupToken();
  }, [getAccessTokenSilently]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.currentPage,
        limit: 10,
        ...(filter !== 'all' && { status: filter })
      };

      const response = await ordersAPI.getOrders(params);
      
      setOrders(response.data.orders);
      setUpcomingOrders(response.data.upcomingOrders);
      setPastOrders(response.data.pastOrders);
      setPagination(response.data.pagination);
      
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      await ordersAPI.cancelOrder(orderId);
      toast.success('Order cancelled successfully');
      fetchOrders(); // Refresh the list
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Failed to cancel order');
    }
  };

  const getStatusBadgeClass = (status) => {
    const statusClasses = {
      'pending': 'badge-warning',
      'confirmed': 'badge-info',
      'processing': 'badge-info',
      'shipped': 'badge-info',
      'delivered': 'badge-success',
      'cancelled': 'badge-danger'
    };
    return `badge ${statusClasses[status] || 'badge-secondary'}`;
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  if (loading && orders.length === 0) {
    return <Loading />;
  }

  return (
    <>
      <Helmet>
        <title>My Orders - Secure E-commerce</title>
        <meta name="description" content="View and manage your secure e-commerce orders" />
      </Helmet>
      
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        {/* Header */}
        <div className="row">
          <div className="col">
            <div className="d-flex justify-content-between align-items-center" style={{ marginBottom: '2rem' }}>
              <div>
                <h1 style={{ color: 'white', marginBottom: '0.5rem' }}>My Orders</h1>
                <p style={{ color: 'white', opacity: 0.9, margin: 0 }}>
                  View and manage your order history
                </p>
              </div>
              <Link to="/orders/new" className="btn btn-success">
                📦 Place New Order
              </Link>
            </div>
          </div>
        </div>

        {/* Filters and Stats */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-body">
            <div className="row">
              <div className="col-md-8">
                <div className="d-flex" style={{ gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFilter('all')}
                  >
                    All Orders
                  </button>
                  <button
                    className={`btn ${filter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFilter('pending')}
                  >
                    Pending
                  </button>
                  <button
                    className={`btn ${filter === 'confirmed' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFilter('confirmed')}
                  >
                    Confirmed
                  </button>
                  <button
                    className={`btn ${filter === 'delivered' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFilter('delivered')}
                  >
                    Delivered
                  </button>
                </div>
              </div>
              <div className="col-md-4 text-right">
                <div className="d-flex justify-content-end" style={{ gap: '1rem' }}>
                  <div className="text-center">
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4f46e5' }}>
                      {upcomingOrders.length}
                    </div>
                    <small>Upcoming</small>
                  </div>
                  <div className="text-center">
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                      {pastOrders.length}
                    </div>
                    <small>Completed</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="text-center">
            <div className="loading-spinner"></div>
            <p>Loading orders...</p>
          </div>
        ) : orders.length > 0 ? (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Total</th>
                    <th>Delivery Date</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order._id}>
                      <td>
                        <strong>{order.orderNumber}</strong>
                        <br />
                        <small>{formatDate(order.createdAt)}</small>
                      </td>
                      <td>
                        <strong>{order.productName}</strong>
                      </td>
                      <td>{order.quantity}</td>
                      <td>{formatPrice(order.totalPrice)}</td>
                      <td>
                        {formatDate(order.deliveryDate)}
                        <br />
                        <small>{order.deliveryTime}</small>
                      </td>
                      <td>{order.deliveryLocation}</td>
                      <td>
                        <span className={getStatusBadgeClass(order.status)}>
                          {order.status}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex" style={{ gap: '0.25rem' }}>
                          {['pending', 'confirmed', 'processing'].includes(order.status) && (
                            <button
                              className="btn btn-danger"
                              style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                              onClick={() => handleCancelOrder(order._id)}
                            >
                              Cancel
                            </button>
                          )}
                          <Link
                            to={`/orders/${order._id}`}
                            className="btn btn-secondary"
                            style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                          >
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="card" style={{ marginTop: '2rem' }}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p>
                        Page {pagination.currentPage} of {pagination.totalPages} 
                        ({pagination.totalOrders} total orders)
                      </p>
                    </div>
                    <div className="d-flex" style={{ gap: '0.5rem' }}>
                      <button
                        className="btn btn-secondary"
                        onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                        disabled={pagination.currentPage <= 1}
                      >
                        Previous
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                        disabled={pagination.currentPage >= pagination.totalPages}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <h3>No orders found</h3>
            <p>
              {filter === 'all' 
                ? "You haven't placed any orders yet"
                : `No orders with status: ${filter}`
              }
            </p>
            <Link to="/orders/new" className="btn btn-primary">
              Place Your First Order
            </Link>
          </div>
        )}
      </div>
    </>
  );
};

export default Orders;
