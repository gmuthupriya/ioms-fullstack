import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, ShoppingBag, ArrowRight, Package, Calendar, ShieldCheck, Truck } from 'lucide-react';
import { orderService, paymentService } from '../services/api.js';
import { Order, Payment } from '../types.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { SkeletonLoader } from '../components/SkeletonLoader.js';

export const OrderConfirmation: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!orderId) return;
      try {
        setLoading(true);
        const orderData = await orderService.getById(orderId);
        setOrder(orderData);
        try {
          const payData = await paymentService.getByOrderId(orderId);
          setPayment(payData);
        } catch {
          // ignore payment fetch error if fallback
        }
      } catch (err) {
        console.error('Failed to load order confirmation details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [orderId]);

  if (loading) {
    return (
      <div style={{ maxWidth: '640px', margin: '3rem auto' }}>
        <SkeletonLoader type="card" count={2} />
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ maxWidth: '500px', margin: '4rem auto', textAlign: 'center' }}>
        <div className="card" style={{ padding: '2.5rem' }}>
          <h2>Order Not Found</h2>
          <Link to="/orders" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Go to Orders
          </Link>
        </div>
      </div>
    );
  }

  const estimatedDeliveryDate = new Date(Date.now() + 3 * 86400000).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div style={{ maxWidth: '640px', margin: '2.5rem auto' }}>
      <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
        
        {/* Success Icon */}
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
            margin: '0 auto 1.25rem',
            boxShadow: '0 0 24px rgba(16, 185, 129, 0.3)',
          }}
        >
          <CheckCircle2 size={44} />
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.4rem' }}>Payment Successful!</h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Thank you for your purchase. Your order has been placed and confirmed.
        </p>

        {/* Receipt & Details Card */}
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
            fontSize: '0.875rem',
            border: '1px solid #1e293b',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#94a3b8' }}>Order Number:</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#60a5fa', fontSize: '1rem' }}>
              {order.id}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#94a3b8' }}>Amount Paid:</span>
            <span style={{ fontWeight: 900, color: '#10b981', fontSize: '1.25rem' }}>
              ₹{Number(order.totalAmount).toFixed(2)}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#94a3b8' }}>Payment Status:</span>
            <StatusBadge status={payment?.status || order.paymentStatus || 'PAID'} size="sm" />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#94a3b8' }}>Order Status:</span>
            <StatusBadge status={order.status} size="sm" />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#94a3b8' }}>Transaction ID:</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#f8fafc', fontSize: '0.8rem' }}>
              {payment?.transactionId || 'MOCK-TXN-SUCCESS'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid #1e293b' }}>
            <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Truck size={16} style={{ color: '#60a5fa' }} />
              Estimated Delivery:
            </span>
            <span style={{ fontWeight: 700, color: '#60a5fa' }}>{estimatedDeliveryDate}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to="/orders" className="btn btn-primary btn-lg">
            <ShoppingBag size={18} />
            <span>Track Order</span>
          </Link>

          <Link to="/products" className="btn btn-secondary btn-lg">
            <Package size={18} />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
