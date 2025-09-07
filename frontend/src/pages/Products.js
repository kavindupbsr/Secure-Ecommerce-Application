import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { productsAPI } from '../services/api';
import { sanitizeInput } from '../utils/security';
import toast from 'react-hot-toast';
import Loading from '../components/Loading';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    limit: 12
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [selectedCategory, pagination.currentPage]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getProducts({
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        page: pagination.currentPage,
        limit: pagination.limit,
        search: searchTerm || undefined
      });
      
      setProducts(response.data.products);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await productsAPI.getCategories();
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const sanitizedSearchTerm = sanitizeInput(searchTerm);
    setSearchTerm(sanitizedSearchTerm);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    fetchProducts();
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  if (loading && products.length === 0) {
    return <Loading />;
  }

  return (
    <>
      <Helmet>
        <title>Products - Secure E-commerce</title>
        <meta name="description" content="Browse our secure catalog of electronics and gadgets" />
      </Helmet>
      
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        {/* Header */}
        <div className="row">
          <div className="col text-center">
            <h1 style={{ color: 'white', marginBottom: '0.5rem' }}>Product Catalog</h1>
            <p style={{ color: 'white', opacity: 0.9, marginBottom: '2rem' }}>
              Browse our secure collection of electronics and gadgets
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <form onSubmit={handleSearch}>
                  <div className="d-flex" style={{ gap: '0.5rem' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(sanitizeInput(e.target.value))}
                      maxLength="100"
                    />
                    <button type="submit" className="btn btn-primary">
                      🔍 Search
                    </button>
                  </div>
                </form>
              </div>
              <div className="col-md-6">
                <div className="form-group">
                  <label htmlFor="category-select" className="form-label">Category:</label>
                  <select
                    id="category-select"
                    className="form-control"
                    value={selectedCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center">
            <div className="loading-spinner"></div>
            <p>Loading products...</p>
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="product-grid">
              {products.map(product => (
                <div key={product.id} className="product-card">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="product-image"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/300x200?text=Product+Image';
                    }}
                  />
                  <div className="product-info">
                    <h3 className="product-title">{product.name}</h3>
                    <p className="product-description">{product.description}</p>
                    <div className="product-price">{formatPrice(product.price)}</div>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className={`badge ${product.inStock ? 'badge-success' : 'badge-danger'}`}>
                        {product.inStock ? 'In Stock' : 'Out of Stock'}
                      </span>
                      <Link 
                        to="/orders/new" 
                        state={{ selectedProduct: product.name }}
                        className="btn btn-primary"
                        disabled={!product.inStock}
                      >
                        🛒 Order Now
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="card" style={{ marginTop: '2rem' }}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p>
                        Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
                        {Math.min(pagination.currentPage * pagination.limit, pagination.totalProducts)} of{' '}
                        {pagination.totalProducts} products
                      </p>
                    </div>
                    <div className="d-flex" style={{ gap: '0.5rem' }}>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={pagination.currentPage <= 1}
                      >
                        Previous
                      </button>
                      
                      {[...Array(Math.min(5, pagination.totalPages))].map((_, index) => {
                        const pageNum = Math.max(1, pagination.currentPage - 2) + index;
                        if (pageNum > pagination.totalPages) return null;
                        
                        return (
                          <button
                            key={pageNum}
                            className={`btn ${pageNum === pagination.currentPage ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      <button
                        className="btn btn-secondary"
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
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
            <h3>No products found</h3>
            <p>
              {searchTerm || selectedCategory !== 'all' 
                ? 'Try adjusting your search criteria or filters'
                : 'Products will be displayed here'
              }
            </p>
            {(searchTerm || selectedCategory !== 'all') && (
              <button
                className="btn btn-primary"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setPagination(prev => ({ ...prev, currentPage: 1 }));
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default Products;
