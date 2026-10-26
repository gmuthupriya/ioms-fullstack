import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, ShieldCheck, ShoppingBag, ArrowLeft, Lock } from 'lucide-react';
import { useCart } from '../context/CartContext.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { orderService, paymentService } from '../services/api.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { Order } from '../types.js';

export const Checkout: React.FC = () => {
  const { cart, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  // Form State
  const [customerInfo, setCustomerInfo] = useState({
    fullName: user?.username || 'Valued Customer',
    email: `${user?.username || 'user'}@tenant.com`,
    address: '100 Technology Plaza Suite 400',
    city: 'San Francisco',
    zip: '94105',
  });

  const tax = subtotal * 0.05;
  const finalTotal = subtotal + tax;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      showToast('Your cart is empty', 'warning');
      return;
    }

    try {
      setLoading(true);
      const itemsPayload = cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      const order = await orderService.create(itemsPayload);
      clearCart();
      
      try {
        await paymentService.create(order.id, 'CARD');
      } catch (pErr) {
        console.warn('Payment record auto-creation notice:', pErr);
      }

      showToast(`Order ${order.id} created! Proceeding to Payment Page...`, 'success');
      navigate(`/payment/${order.id}`);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error?.message || 'Failed to place order. Stock may have changed.';
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // If order created successfully -> render success screen
  if (createdOrder) {
    return (
      <div style={{ maxWidth: '640px', margin: '3rem auto', textAlign: 'center' }}>
        <div className="card" style={{ padding: '3rem 2rem' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 0 24px rgba(16, 185, 129, 0.3)',
            }}
          >
            <CheckCircle2 size={42} />
          </div>

          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>Order Placed Successfully!</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '2rem' }}>
            Your order has been registered in the system with initial status <strong>PENDING</strong>.
          </p>

          <div
            style={{
              background: '#0b1120',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              marginBottom: '2rem',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.875rem',
              fontSize: '0.9rem',
              border: '1px solid #1e293b',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8' }}>Order Reference:</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#60a5fa', fontSize: '1.05rem' }}>
                {createdOrder.id}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8' }}>Initial Status:</span>
              <StatusBadge status={createdOrder.status} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8' }}>Total Amount:</span>
              <span style={{ fontWeight: 800, color: '#10b981', fontSize: '1.15rem' }}>
                ${Number(createdOrder.totalAmount).toFixed(2)}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8' }}>Customer User:</span>
              <span style={{ fontWeight: 600, color: '#f8fafc' }}>{createdOrder.userId}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8' }}>Placed At:</span>
              <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                {new Date(createdOrder.createdAt).toLocaleString()}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/orders" className="btn btn-primary btn-lg">
              <ShoppingBag size={18} />
              <span>View My Orders</span>
            </Link>

            <Link to="/products" className="btn btn-secondary btn-lg">
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div style={{ maxWidth: '500px', margin: '4rem auto', textAlign: 'center' }}>
        <div className="card" style={{ padding: '2.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>No items in checkout</h2>
          <Link to="/products" className="btn btn-primary">Return to Catalog</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Checkout</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Complete your order with server-side inventory verification</p>
        </div>
        <Link to="/cart" className="btn btn-secondary">
          <ArrowLeft size={16} />
          <span>Back to Cart</span>
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.75rem' }}>
        {/* Customer Information Form */}
        <div style={{ flex: 1.5 }}>
          <div className="card">
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #1e293b' }}>
              Customer Information
            </h2>

            <form onSubmit={handlePlaceOrder}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={customerInfo.fullName}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, fullName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  required
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Shipping Address</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={customerInfo.address}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={customerInfo.city}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, city: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">ZIP / Postal Code</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={customerInfo.zip}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, zip: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
                  {loading ? (
                    'Processing Atomic Order...'
                  ) : (
                    <>
                      <Lock size={18} />
                      <span>Place Order (${finalTotal.toFixed(2)})</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Order Summary Side Card */}
        <div style={{ flex: 1 }}>
          <div className="card">
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #1e293b' }}>
              Order Items ({cart.length})
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '1.5rem' }}>
              {cart.map(({ product, quantity }) => (
                <div key={product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{product.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      Qty: {quantity} &times; ${Number(product.price).toFixed(2)}
                    </div>
                  </div>
                  <div style={{ fontWeight: 700 }}>${(Number(product.price) * quantity).toFixed(2)}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem', paddingTop: '1rem', borderTop: '1px solid #1e293b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                <span>Subtotal</span>
                <span style={{ fontWeight: 600, color: '#f8fafc' }}>${subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                <span>Tax (5%)</span>
                <span style={{ fontWeight: 600, color: '#f8fafc' }}>${tax.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 800, color: '#10b981', paddingTop: '0.75rem', borderTop: '1px solid #1e293b' }}>
                <span>Total Amount</span>
                <span>${finalTotal.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', background: '#0b1120', padding: '0.875rem', borderRadius: '0.5rem', fontSize: '0.75rem', color: '#94a3b8', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <ShieldCheck size={16} style={{ color: '#60a5fa', flexShrink: 0 }} />
              <span>Initial order status will be set to PENDING upon submission.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
