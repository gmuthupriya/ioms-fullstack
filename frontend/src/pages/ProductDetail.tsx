import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, CreditCard, ShieldCheck, Check, Package, Layers } from 'lucide-react';
import { productService } from '../services/api.js';
import { Product } from '../types.js';
import { useCart } from '../context/CartContext.js';
import { useToast } from '../context/ToastContext.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { SkeletonLoader } from '../components/SkeletonLoader.js';

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadProduct() {
      if (!id) return;
      try {
        setLoading(true);
        setErrorMsg(null);
        const data = await productService.getById(id);
        setProduct(data);
      } catch (err: any) {
        setErrorMsg(err.response?.data?.error?.message || 'Failed to load product details');
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, quantity);
    showToast(`Added ${quantity} &times; '${product.name}' to shopping cart!`, 'success');
  };

  const handleBuyNow = () => {
    if (!product) return;
    addToCart(product, quantity);
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '900px', margin: '2rem auto' }}>
        <SkeletonLoader type="card" count={1} />
      </div>
    );
  }

  if (errorMsg || !product) {
    return (
      <div style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center' }}>
        <div className="card" style={{ padding: '2.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#ef4444' }}>Product Not Found</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1.5rem' }}>{errorMsg || 'The requested product could not be loaded.'}</p>
          <Link to="/products" className="btn btn-primary">Back to Catalog</Link>
        </div>
      </div>
    );
  }

  const isOutOfStock = (product.availableQuantity ?? 0) <= 0;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/products" className="btn btn-secondary btn-sm">
          <ArrowLeft size={16} />
          <span>Back to Products</span>
        </Link>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', alignItems: 'center' }}>
          
          {/* Left Product Image Area */}
          <div
            style={{
              height: '320px',
              background: 'radial-gradient(circle at 50% 50%, #1e293b 0%, #090d16 100%)',
              borderRadius: '0.875rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #1e293b',
              position: 'relative',
            }}
          >
            <div style={{ padding: '1rem', borderRadius: '1rem', background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa', marginBottom: '1rem' }}>
              <Package size={56} />
            </div>
            <div style={{ fontFamily: 'monospace', fontWeight: 800, color: '#60a5fa', fontSize: '1.1rem' }}>
              SKU: {product.sku}
            </div>
            <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
              <StatusBadge status={product.active ? 'ACTIVE' : 'INACTIVE'} />
            </div>
          </div>

          {/* Right Product Details */}
          <div>
            <div style={{ fontSize: '0.8rem', color: '#60a5fa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
              Enterprise Catalog Item
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.5rem', lineHeight: 1.2 }}>
              {product.name}
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.925rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              {product.description || 'No detailed description available for this SKU item.'}
            </p>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: '1px solid #1e293b' }}>
              <div style={{ fontSize: '2.25rem', fontWeight: 900, color: '#f8fafc' }}>
                ${Number(product.price).toFixed(2)}
              </div>
              <div style={{ fontSize: '0.875rem' }}>
                <span className={`badge ${(product.availableQuantity ?? 0) > 5 ? 'badge-success' : (product.availableQuantity ?? 0) > 0 ? 'badge-warning' : 'badge-danger'}`}>
                  {product.availableQuantity ?? 0} In Stock
                </span>
              </div>
            </div>

            {/* Quantity Selector */}
            <div style={{ marginBottom: '1.75rem' }}>
              <label className="form-label">Quantity</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1 || isOutOfStock}
                >
                  -
                </button>
                <span style={{ width: '48px', textAlign: 'center', fontWeight: 800, fontSize: '1.1rem' }}>{quantity}</span>
                <button
                  className="btn btn-secondary"
                  onClick={() => setQuantity(Math.min(product.availableQuantity ?? 99, quantity + 1))}
                  disabled={quantity >= (product.availableQuantity ?? 99) || isOutOfStock}
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary btn-lg"
                style={{ flex: 1 }}
                onClick={handleAddToCart}
                disabled={isOutOfStock}
              >
                <ShoppingCart size={18} />
                <span>Add to Cart</span>
              </button>

              <button
                className="btn btn-secondary btn-lg"
                style={{ flex: 1, background: '#10b981', color: '#fff', border: 'none' }}
                onClick={handleBuyNow}
                disabled={isOutOfStock}
              >
                <CreditCard size={18} />
                <span>Buy Now</span>
              </button>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', fontSize: '0.85rem', color: '#94a3b8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldCheck size={16} style={{ color: '#10b981' }} />
                <span>Tenant Isolated</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Layers size={16} style={{ color: '#60a5fa' }} />
                <span>Atomic Reservation</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
