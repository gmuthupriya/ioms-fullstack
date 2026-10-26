import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Power,
  ShoppingCart,
  CreditCard,
  Eye,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';
import { productService, inventoryService } from '../services/api.js';
import { Product } from '../types.js';
import { useAuth } from '../context/AuthContext.js';
import { useCart } from '../context/CartContext.js';
import { useToast } from '../context/ToastContext.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { SkeletonLoader } from '../components/SkeletonLoader.js';

export const Products: React.FC = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeOnly, setActiveOnly] = useState(true);
  const [sortBy, setSortBy] = useState<'name' | 'price-asc' | 'price-desc'>('name');

  // Modals (Admin)
  const [showAddModal, setShowAddModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<Product | null>(null);
  const [stockAdjustProduct, setStockAdjustProduct] = useState<Product | null>(null);
  const [stockChangeQty, setStockChangeQty] = useState(0);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    price: 0,
    initialQuantity: 10,
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await productService.list({ search, activeOnly });
      setProducts(res.data || []);
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, activeOnly, user?.tenantId]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await productService.create(formData);
      showToast(`Product '${formData.name}' created successfully!`, 'success');
      setShowAddModal(false);
      setFormData({ name: '', sku: '', description: '', price: 0, initialQuantity: 10 });
      fetchProducts();
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to create product', 'error');
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProduct) return;
    try {
      await productService.update(editProduct.id, {
        name: editProduct.name,
        description: editProduct.description,
        price: editProduct.price,
      });
      showToast(`Product '${editProduct.name}' updated!`, 'success');
      setEditProduct(null);
      fetchProducts();
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to update product', 'error');
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivateTarget) return;
    try {
      await productService.deactivate(deactivateTarget.id);
      showToast(`Product '${deactivateTarget.name}' has been deactivated.`, 'info');
      setDeactivateTarget(null);
      fetchProducts();
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to deactivate product', 'error');
    }
  };

  const handleAdjustStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockAdjustProduct) return;
    try {
      await inventoryService.adjust(stockAdjustProduct.id, stockChangeQty, 'RESTOCK');
      showToast(`Adjusted inventory by ${stockChangeQty} units for '${stockAdjustProduct.name}'`, 'success');
      setStockAdjustProduct(null);
      setStockChangeQty(0);
      fetchProducts();
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to adjust stock', 'error');
    }
  };

  // Sorting
  const sortedProducts = [...products].sort((a, b) => {
    if (sortBy === 'price-asc') return Number(a.price) - Number(b.price);
    if (sortBy === 'price-desc') return Number(b.price) - Number(a.price);
    return a.name.localeCompare(b.name);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>Product Catalog</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
            Explore e-commerce items & manage SKU catalog for Tenant: {user?.tenantId}
          </p>
        </div>

        {user?.role === 'ADMIN' && (
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={18} />
            <span>Add New Product</span>
          </button>
        )}
      </div>

      {/* Filter, Search & Sort Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          
          {/* Search Box */}
          <div style={{ flex: 2, minWidth: '240px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.6rem' }}
              placeholder="Search by product name or SKU code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Active Only Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', color: '#94a3b8' }}>
              <input
                type="checkbox"
                checked={activeOnly}
                onChange={(e) => setActiveOnly(e.target.checked)}
              />
              Active Products Only
            </label>
          </div>

          {/* Sort By Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '180px' }}>
            <SlidersHorizontal size={16} style={{ color: '#94a3b8' }} />
            <select
              className="form-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{ fontSize: '0.85rem' }}
            >
              <option value="name">Sort by Name (A-Z)</option>
              <option value="price-asc">Sort by Price: Low to High</option>
              <option value="price-desc">Sort by Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="product-grid">
          <SkeletonLoader type="product-card" count={6} />
        </div>
      ) : sortedProducts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <Package size={48} style={{ color: '#94a3b8', margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Products Found</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Try clearing filters or search query.</p>
        </div>
      ) : (
        <div className="product-grid">
          {sortedProducts.map((product) => {
            const isOutOfStock = (product.availableQuantity ?? 0) <= 0;

            return (
              <div key={product.id} className="card product-card">
                {/* Visual Header */}
                <div className="product-image-container">
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Package size={28} />
                  </div>
                  <div className="product-image-badge">
                    <StatusBadge status={product.active ? 'ACTIVE' : 'INACTIVE'} size="sm" />
                  </div>
                </div>

                {/* Info Content */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#60a5fa', fontWeight: 700, marginBottom: '0.2rem' }}>
                    SKU: {product.sku}
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.4rem', lineHeight: 1.3 }}>
                    {product.name}
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {product.description || 'No detailed description available.'}
                  </p>

                  <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#f8fafc' }}>
                      ${Number(product.price).toFixed(2)}
                    </div>
                    <span className={`badge ${(product.availableQuantity ?? 0) > 5 ? 'badge-success' : (product.availableQuantity ?? 0) > 0 ? 'badge-warning' : 'badge-danger'}`}>
                      {product.availableQuantity ?? 0} in stock
                    </span>
                  </div>

                  {/* Customer Action Buttons */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => {
                        addToCart(product, 1);
                        showToast(`Added '${product.name}' to cart!`, 'success');
                      }}
                      disabled={isOutOfStock || !product.active}
                    >
                      <ShoppingCart size={14} />
                      <span>Add</span>
                    </button>

                    <button
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => {
                        addToCart(product, 1);
                        navigate('/checkout');
                      }}
                      disabled={isOutOfStock || !product.active}
                    >
                      <CreditCard size={14} />
                      <span>Buy Now</span>
                    </button>

                    <Link to={`/products/${product.id}`} className="btn btn-secondary btn-sm" title="View details">
                      <Eye size={14} />
                    </Link>
                  </div>

                  {/* Admin Actions Bar */}
                  {user?.role === 'ADMIN' && (
                    <div style={{ display: 'flex', gap: '0.4rem', paddingTop: '0.75rem', borderTop: '1px solid #1e293b' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1, padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                        onClick={() => setEditProduct(product)}
                      >
                        <Edit2 size={12} />
                        <span>Edit</span>
                      </button>

                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1, padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                        onClick={() => setStockAdjustProduct(product)}
                      >
                        <RefreshCw size={12} />
                        <span>Stock</span>
                      </button>

                      {product.active && (
                        <button
                          className="btn btn-danger btn-sm"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                          onClick={() => setDeactivateTarget(product)}
                        >
                          <Power size={12} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Admin: Create Product Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Create New Product</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className="form-group">
                <label className="form-label">Product Name</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g. Mechanical Gaming Keyboard"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">SKU (Unique SKU per Tenant)</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g. KB-MECH-PRO"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Initial Stock Quantity</label>
                  <input
                    type="number"
                    className="form-input"
                    required
                    value={formData.initialQuantity}
                    onChange={(e) => setFormData({ ...formData, initialQuantity: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin: Edit Product Modal */}
      {editProduct && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Edit Product ({editProduct.sku})</h3>
              <button className="modal-close" onClick={() => setEditProduct(null)}>&times;</button>
            </div>
            <form onSubmit={handleUpdateSubmit}>
              <div className="form-group">
                <label className="form-label">Product Name</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={editProduct.name}
                  onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  required
                  value={editProduct.price}
                  onChange={(e) => setEditProduct({ ...editProduct, price: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={editProduct.description || ''}
                  onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditProduct(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Update Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin: Deactivate Confirmation Dialog */}
      {deactivateTarget && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: '#ef4444' }}>Deactivate Product</h3>
              <button className="modal-close" onClick={() => setDeactivateTarget(null)}>&times;</button>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Are you sure you want to deactivate <strong>'{deactivateTarget.name}'</strong> ({deactivateTarget.sku})? Deactivated products cannot be added to new orders.
            </p>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeactivateTarget(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleConfirmDeactivate}>Yes, Deactivate Product</button>
            </div>
          </div>
        </div>
      )}

      {/* Admin: Stock Adjustment Modal */}
      {stockAdjustProduct && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Adjust Inventory ({stockAdjustProduct.sku})</h3>
              <button className="modal-close" onClick={() => setStockAdjustProduct(null)}>&times;</button>
            </div>
            <form onSubmit={handleAdjustStockSubmit}>
              <div style={{ background: '#0b1120', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Current Stock Level:</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#60a5fa' }}>
                  {stockAdjustProduct.availableQuantity ?? 0} units
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Quantity Change (+ Restock, - Reduce)</label>
                <input
                  type="number"
                  className="form-input"
                  required
                  placeholder="e.g. 15 or -5"
                  value={stockChangeQty}
                  onChange={(e) => setStockChangeQty(parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setStockAdjustProduct(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Confirm Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
