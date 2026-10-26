import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, Trash2, Plus, Minus, CreditCard, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext.js';
import { useToast } from '../context/ToastContext.js';

export const Cart: React.FC = () => {
  const { cart, updateQuantity, removeFromCart, subtotal, totalItems } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const tax = subtotal * 0.05; // 5% tax estimate
  const finalTotal = subtotal + tax;

  const handleProceedToCheckout = () => {
    if (cart.length === 0) {
      showToast('Your cart is empty', 'warning');
      return;
    }
    navigate('/checkout');
  };

  if (cart.length === 0) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
        <div className="card" style={{ padding: '3rem 2rem' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <ShoppingBag size={32} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Your Cart is Empty</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '2rem' }}>
            Looks like you haven't added any products to your shopping cart yet.
          </p>
          <Link to="/products" className="btn btn-primary btn-lg">
            Browse Product Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Shopping Cart ({totalItems} items)</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Review your selected items before proceeding to checkout</p>
        </div>
        <Link to="/products" className="btn btn-secondary">
          <ArrowLeft size={16} />
          <span>Continue Shopping</span>
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.75rem' }}>
        {/* Cart Line Items List */}
        <div style={{ flex: 2 }}>
          <div className="card" style={{ padding: 0 }}>
            {cart.map(({ product, quantity }) => (
              <div
                key={product.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.25rem',
                  padding: '1.25rem',
                  borderBottom: '1px solid #1e293b',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ width: '64px', height: '64px', background: '#0b1120', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#60a5fa', fontSize: '1rem', flexShrink: 0 }}>
                  {product.sku.substring(0, 3)}
                </div>

                <div style={{ flex: 1, minWidth: '180px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.2rem' }}>{product.name}</h3>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    SKU: <span style={{ fontFamily: 'monospace', color: '#60a5fa' }}>{product.sku}</span> | Unit: ${Number(product.price).toFixed(2)}
                  </div>
                </div>

                {/* Quantity Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.35rem' }}
                    onClick={() => updateQuantity(product.id, quantity - 1)}
                  >
                    <Minus size={14} />
                  </button>

                  <span style={{ width: '36px', textAlign: 'center', fontWeight: 700, fontSize: '0.9rem' }}>{quantity}</span>

                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.35rem' }}
                    onClick={() => updateQuantity(product.id, quantity + 1)}
                    disabled={quantity >= (product.availableQuantity ?? 999)}
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Subtotal */}
                <div style={{ fontWeight: 800, fontSize: '1.05rem', minWidth: '90px', textAlign: 'right' }}>
                  ${(Number(product.price) * quantity).toFixed(2)}
                </div>

                {/* Remove */}
                <button
                  className="btn btn-danger btn-sm"
                  style={{ padding: '0.4rem' }}
                  onClick={() => {
                    removeFromCart(product.id);
                    showToast(`Removed '${product.name}' from cart`, 'info');
                  }}
                  title="Remove product"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary Box */}
        <div style={{ flex: 1 }}>
          <div className="card" style={{ padding: '1.75rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #1e293b' }}>
              Order Summary
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                <span>Subtotal ({totalItems} items)</span>
                <span style={{ fontWeight: 700, color: '#f8fafc' }}>${subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                <span>Estimated Tax (5%)</span>
                <span style={{ fontWeight: 700, color: '#f8fafc' }}>${tax.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                <span>Shipping</span>
                <span style={{ fontWeight: 700, color: '#10b981' }}>FREE</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', paddingTop: '0.875rem', borderTop: '1px solid #1e293b' }}>
                <span>Total Amount</span>
                <span style={{ color: '#10b981' }}>${finalTotal.toFixed(2)}</span>
              </div>
            </div>

            <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={handleProceedToCheckout}>
              <CreditCard size={18} />
              <span>Proceed to Checkout</span>
            </button>

            <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#94a3b8', justifyContent: 'center' }}>
              <ShieldCheck size={14} style={{ color: '#10b981' }} />
              <span>Atomic Server Stock Verification Guarantee</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
