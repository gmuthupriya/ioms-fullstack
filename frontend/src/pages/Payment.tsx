import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CreditCard,
  QrCode,
  Building,
  Wallet,
  Lock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  ArrowLeft,
  RotateCcw,
  ShoppingBag
} from 'lucide-react';
import { orderService, paymentService } from '../services/api.js';
import { Order, Payment as PaymentType } from '../types.js';
import { useToast } from '../context/ToastContext.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { SkeletonLoader } from '../components/SkeletonLoader.js';

export const Payment: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<PaymentType | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Tab & Form states
  const [activeTab, setActiveTab] = useState<'card' | 'upi' | 'netbanking' | 'wallet'>('card');
  const [cardInfo, setCardInfo] = useState({
    number: '4532 •••• •••• 8892',
    name: 'John Doe',
    expiry: '08/28',
    cvv: '•••',
  });
  const [upiId, setUpiId] = useState('user@okaxis');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [selectedWallet, setSelectedWallet] = useState('Amazon Pay');

  // Outcome screen state: null | 'FAILED' | 'CANCELLED'
  const [paymentOutcome, setPaymentOutcome] = useState<'FAILED' | 'CANCELLED' | null>(null);

  const loadData = async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      const orderData = await orderService.getById(orderId);
      setOrder(orderData);

      let payData = await paymentService.getByOrderId(orderId);
      if (!payData) {
        payData = await paymentService.create(orderId, activeTab.toUpperCase());
      }
      setPayment(payData);

      if (payData.status === 'PAID') {
        navigate(`/orders/confirmation/${orderId}`);
      } else if (payData.status === 'FAILED') {
        setPaymentOutcome('FAILED');
      } else if (payData.status === 'CANCELLED') {
        setPaymentOutcome('CANCELLED');
      } else {
        setPaymentOutcome(null);
      }
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to load order details for payment', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [orderId]);

  const handleProcessPayment = async (result: 'SUCCESS' | 'FAILED' | 'CANCELLED') => {
    if (!payment) return;
    try {
      setProcessing(true);
      const res = await paymentService.process(payment.id, result);
      setPayment(res.payment);

      if (result === 'SUCCESS') {
        showToast('Payment successful!', 'success');
        navigate(`/orders/confirmation/${orderId}`);
      } else if (result === 'FAILED') {
        setPaymentOutcome('FAILED');
        showToast('Payment failed. You can try paying again.', 'error');
      } else {
        setPaymentOutcome('CANCELLED');
        showToast('Payment cancelled.', 'info');
      }
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Payment processing error', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleRetryPayment = async () => {
    if (!orderId) return;
    try {
      setProcessing(true);
      const newPay = await paymentService.create(orderId, activeTab.toUpperCase());
      setPayment(newPay);
      setPaymentOutcome(null);
      showToast('Payment gateway reopened for order', 'info');
    } catch (err: any) {
      setPaymentOutcome(null);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '680px', margin: '3rem auto' }}>
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

  const amountDisplay = `₹${Number(order.totalAmount).toFixed(2)}`;

  // Payment Failed Screen
  if (paymentOutcome === 'FAILED') {
    return (
      <div style={{ maxWidth: '580px', margin: '3rem auto' }}>
        <div className="card" style={{ padding: '2.5rem', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              boxShadow: '0 0 24px rgba(239, 68, 68, 0.3)',
            }}
          >
            <XCircle size={42} />
          </div>

          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fca5a5', marginBottom: '0.5rem' }}>Payment Failed</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            We couldn't complete your payment. Don't worry, your order is safely saved in your account.
          </p>

          <div
            style={{
              background: '#0b1120',
              padding: '1.25rem',
              borderRadius: '0.75rem',
              textAlign: 'left',
              marginBottom: '1.75rem',
              border: '1px solid #1e293b',
              fontSize: '0.875rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Order Number:</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#60a5fa' }}>{order.id}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Amount Payable:</span>
              <span style={{ fontWeight: 800, color: '#f8fafc' }}>{amountDisplay}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8' }}>Payment Status:</span>
              <StatusBadge status="FAILED" size="sm" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8' }}>Order Status:</span>
              <StatusBadge status="PENDING" size="sm" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="btn btn-primary btn-lg" onClick={handleRetryPayment} disabled={processing}>
              <RotateCcw size={18} />
              <span>Try Again</span>
            </button>
            <Link to="/orders" className="btn btn-secondary btn-lg">
              <ShoppingBag size={18} />
              <span>View My Orders</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Payment Cancelled Screen
  if (paymentOutcome === 'CANCELLED') {
    return (
      <div style={{ maxWidth: '580px', margin: '3rem auto' }}>
        <div className="card" style={{ padding: '2.5rem', textAlign: 'center', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              boxShadow: '0 0 24px rgba(245, 158, 11, 0.3)',
            }}
          >
            <AlertCircle size={42} />
          </div>

          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fcd34d', marginBottom: '0.5rem' }}>Payment Cancelled</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Your order has been created, but payment is still pending. You can complete payment at any time.
          </p>

          <div
            style={{
              background: '#0b1120',
              padding: '1.25rem',
              borderRadius: '0.75rem',
              textAlign: 'left',
              marginBottom: '1.75rem',
              border: '1px solid #1e293b',
              fontSize: '0.875rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Order Reference:</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#60a5fa' }}>{order.id}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Total Amount:</span>
              <span style={{ fontWeight: 800, color: '#f8fafc' }}>{amountDisplay}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8' }}>Payment Status:</span>
              <StatusBadge status="CANCELLED" size="sm" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8' }}>Order Status:</span>
              <StatusBadge status="PENDING" size="sm" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="btn btn-primary btn-lg" onClick={handleRetryPayment} disabled={processing}>
              <CreditCard size={18} />
              <span>Pay Now</span>
            </button>
            <Link to="/orders" className="btn btn-secondary btn-lg">
              <ShoppingBag size={18} />
              <span>View My Orders</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '680px', margin: '2rem auto' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#60a5fa', fontSize: '0.85rem', fontWeight: 700 }}>
            <Lock size={16} />
            <span>256-bit SSL Encrypted Payment</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.2rem' }}>Secure Payment</h1>
        </div>
        <Link to="/orders" className="btn btn-secondary btn-sm">
          <ArrowLeft size={16} />
          <span>Back to Orders</span>
        </Link>
      </div>

      {/* Demo Warning Banner */}
      <div
        style={{
          background: 'rgba(59, 130, 246, 0.12)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '0.75rem',
          padding: '0.875rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.85rem',
          color: '#93c5fd',
        }}
      >
        <ShieldCheck size={20} style={{ color: '#60a5fa', flexShrink: 0 }} />
        <div>
          <strong>Demo Payment Gateway</strong> – No real money will be charged. All payment credentials below are pre-filled for testing.
        </div>
      </div>

      {/* Order Summary Summary Card */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', background: '#0b1120' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Order Reference
            </div>
            <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.1rem', color: '#60a5fa' }}>{order.id}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Amount Payable
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10b981' }}>{amountDisplay}</div>
          </div>
        </div>
      </div>

      {/* Payment Gateway Card */}
      <div className="card" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #1e293b' }}>
          Select Payment Method
        </h3>

        {/* Method Selector Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <button
            type="button"
            className={`btn ${activeTab === 'card' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flexDirection: 'column', padding: '0.75rem 0.5rem', gap: '0.35rem', fontSize: '0.75rem' }}
            onClick={() => setActiveTab('card')}
          >
            <CreditCard size={18} />
            <span>Card</span>
          </button>

          <button
            type="button"
            className={`btn ${activeTab === 'upi' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flexDirection: 'column', padding: '0.75rem 0.5rem', gap: '0.35rem', fontSize: '0.75rem' }}
            onClick={() => setActiveTab('upi')}
          >
            <QrCode size={18} />
            <span>UPI</span>
          </button>

          <button
            type="button"
            className={`btn ${activeTab === 'netbanking' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flexDirection: 'column', padding: '0.75rem 0.5rem', gap: '0.35rem', fontSize: '0.75rem' }}
            onClick={() => setActiveTab('netbanking')}
          >
            <Building size={18} />
            <span>Net Banking</span>
          </button>

          <button
            type="button"
            className={`btn ${activeTab === 'wallet' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flexDirection: 'column', padding: '0.75rem 0.5rem', gap: '0.35rem', fontSize: '0.75rem' }}
            onClick={() => setActiveTab('wallet')}
          >
            <Wallet size={18} />
            <span>Wallet</span>
          </button>
        </div>

        {/* Tab Content 1: Credit / Debit Card */}
        {activeTab === 'card' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Card Number</label>
              <input
                type="text"
                className="form-input"
                value={cardInfo.number}
                onChange={(e) => setCardInfo({ ...cardInfo, number: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Cardholder Name</label>
              <input
                type="text"
                className="form-input"
                value={cardInfo.name}
                onChange={(e) => setCardInfo({ ...cardInfo, name: e.target.value })}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Expiry (MM/YY)</label>
                <input
                  type="text"
                  className="form-input"
                  value={cardInfo.expiry}
                  onChange={(e) => setCardInfo({ ...cardInfo, expiry: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">CVV</label>
                <input
                  type="password"
                  className="form-input"
                  value={cardInfo.cvv}
                  onChange={(e) => setCardInfo({ ...cardInfo, cvv: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 2: UPI */}
        {activeTab === 'upi' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">UPI ID / Virtual Payment Address (VPA)</label>
              <input
                type="text"
                className="form-input"
                placeholder="username@bank"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
              />
            </div>
            <div style={{ background: '#0b1120', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.8rem', color: '#94a3b8' }}>
              Accepts Google Pay, PhonePe, Paytm, BHIM UPI IDs.
            </div>
          </div>
        )}

        {/* Tab Content 3: Net Banking */}
        {activeTab === 'netbanking' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Select Bank</label>
              <select
                className="form-select"
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
              >
                <option value="HDFC Bank">HDFC Bank</option>
                <option value="ICICI Bank">ICICI Bank</option>
                <option value="State Bank of India">State Bank of India (SBI)</option>
                <option value="Axis Bank">Axis Bank</option>
                <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
              </select>
            </div>
          </div>
        )}

        {/* Tab Content 4: Wallet */}
        {activeTab === 'wallet' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Select Wallet</label>
              <select
                className="form-select"
                value={selectedWallet}
                onChange={(e) => setSelectedWallet(e.target.value)}
              >
                <option value="Amazon Pay">Amazon Pay</option>
                <option value="Paytm Wallet">Paytm Wallet</option>
                <option value="PhonePe Wallet">PhonePe Wallet</option>
                <option value="Mobikwik">Mobikwik</option>
              </select>
            </div>
          </div>
        )}

        {/* Action Controls for Demo Simulation */}
        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <button
            type="button"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', background: 'linear-gradient(135deg, #10b981, #059669)', fontSize: '1rem', fontWeight: 800 }}
            disabled={processing}
            onClick={() => handleProcessPayment('SUCCESS')}
          >
            <CheckCircle2 size={20} />
            <span>Pay {amountDisplay} (Simulate Payment Success)</span>
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              style={{ justifyContent: 'center' }}
              disabled={processing}
              onClick={() => handleProcessPayment('FAILED')}
            >
              <XCircle size={16} />
              <span>Simulate Payment Failed</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'center' }}
              disabled={processing}
              onClick={() => handleProcessPayment('CANCELLED')}
            >
              <AlertCircle size={16} />
              <span>Cancel Payment</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
