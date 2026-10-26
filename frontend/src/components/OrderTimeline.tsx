import React from 'react';
import { Clock, CheckCircle2, RefreshCw, Truck, CheckCheck, XCircle, CreditCard, AlertCircle } from 'lucide-react';

interface OrderTimelineProps {
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED' | string;
  paymentStatus?: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | string;
  createdAt: string;
  updatedAt?: string;
}

export const OrderTimeline: React.FC<OrderTimelineProps> = ({ status, paymentStatus, createdAt, updatedAt }) => {
  const normStatus = (status || '').toUpperCase();
  const normPayStatus = (paymentStatus || 'PENDING').toUpperCase();

  if (normStatus === 'CANCELLED') {
    return (
      <div style={{ padding: '1.25rem', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '0.75rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fca5a5', marginBottom: '1rem' }}>Order Status Timeline</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={18} />
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, marginTop: '0.4rem', color: '#f8fafc' }}>Order Placed</div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{new Date(createdAt).toLocaleDateString()}</div>
          </div>

          <div style={{ height: '2px', flex: 1, background: '#ef4444' }} />

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#ef4444', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <XCircle size={18} />
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, marginTop: '0.4rem', color: '#fca5a5' }}>Cancelled</div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{updatedAt ? new Date(updatedAt).toLocaleDateString() : 'Updated'}</div>
          </div>
        </div>
      </div>
    );
  }

  const isPaid = normPayStatus === 'PAID';
  const isConfirmed = isPaid && ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'COMPLETED'].includes(normStatus);
  const isProcessing = isPaid && ['PROCESSING', 'SHIPPED', 'COMPLETED'].includes(normStatus);
  const isShipped = isPaid && ['SHIPPED', 'COMPLETED'].includes(normStatus);
  const isCompleted = isPaid && normStatus === 'COMPLETED';

  return (
    <div style={{ padding: '1.25rem', background: '#0f172a', borderRadius: '0.75rem', border: '1px solid #334155' }}>
      <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc', marginBottom: '1.25rem' }}>Order & Delivery Progress</h4>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        
        {/* Step 1: Placed */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: '75px', zIndex: 2 }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#10b981',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle2 size={18} />
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, marginTop: '0.4rem', color: '#f8fafc', textAlign: 'center' }}>Order Placed</div>
          <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>DONE</div>
        </div>

        {/* Connector 1 */}
        <div style={{ height: '3px', flex: 1, minWidth: '20px', background: isPaid ? '#10b981' : '#f59e0b' }} />

        {/* Step 2: Payment */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: '75px', zIndex: 2 }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: isPaid ? '#10b981' : normPayStatus === 'FAILED' ? '#ef4444' : '#f59e0b',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isPaid ? 'none' : '0 0 10px rgba(245, 158, 11, 0.4)',
            }}
          >
            {isPaid ? <CreditCard size={18} /> : normPayStatus === 'FAILED' ? <XCircle size={18} /> : <AlertCircle size={18} />}
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, marginTop: '0.4rem', color: isPaid ? '#f8fafc' : '#fcd34d', textAlign: 'center' }}>
            {isPaid ? 'Payment Success' : normPayStatus === 'FAILED' ? 'Payment Failed' : 'Payment Pending'}
          </div>
          <div style={{ fontSize: '0.65rem', color: isPaid ? '#34d399' : '#f59e0b' }}>
            {normPayStatus}
          </div>
        </div>

        {/* Connector 2 */}
        <div style={{ height: '3px', flex: 1, minWidth: '20px', background: isConfirmed ? '#3b82f6' : '#334155' }} />

        {/* Step 3: Confirmed */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: '75px', zIndex: 2 }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: isConfirmed ? '#3b82f6' : '#1e293b',
              color: isConfirmed ? '#fff' : '#64748b',
              border: isConfirmed ? 'none' : '2px solid #334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle2 size={18} />
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, marginTop: '0.4rem', color: isConfirmed ? '#f8fafc' : '#64748b', textAlign: 'center' }}>Confirmed</div>
          <div style={{ fontSize: '0.65rem', color: isConfirmed ? '#60a5fa' : '#64748b' }}>
            {isConfirmed ? 'APPROVED' : 'PENDING'}
          </div>
        </div>

        {/* Connector 3 */}
        <div style={{ height: '3px', flex: 1, minWidth: '20px', background: isProcessing ? '#8b5cf6' : '#334155' }} />

        {/* Step 4: Processing */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: '75px', zIndex: 2 }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: isProcessing ? '#8b5cf6' : '#1e293b',
              color: isProcessing ? '#fff' : '#64748b',
              border: isProcessing ? 'none' : '2px solid #334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RefreshCw size={18} />
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, marginTop: '0.4rem', color: isProcessing ? '#f8fafc' : '#64748b', textAlign: 'center' }}>Processing</div>
          <div style={{ fontSize: '0.65rem', color: isProcessing ? '#a78bfa' : '#64748b' }}>
            {isProcessing ? 'IN PROGRESS' : 'WAITING'}
          </div>
        </div>

        {/* Connector 4 */}
        <div style={{ height: '3px', flex: 1, minWidth: '20px', background: isShipped ? '#06b6d4' : '#334155' }} />

        {/* Step 5: Shipped */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: '75px', zIndex: 2 }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: isShipped ? '#06b6d4' : '#1e293b',
              color: isShipped ? '#fff' : '#64748b',
              border: isShipped ? 'none' : '2px solid #334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Truck size={18} />
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, marginTop: '0.4rem', color: isShipped ? '#f8fafc' : '#64748b', textAlign: 'center' }}>Shipped</div>
          <div style={{ fontSize: '0.65rem', color: isShipped ? '#22d3ee' : '#64748b' }}>
            {isShipped ? 'IN TRANSIT' : 'WAITING'}
          </div>
        </div>

        {/* Connector 5 */}
        <div style={{ height: '3px', flex: 1, minWidth: '20px', background: isCompleted ? '#10b981' : '#334155' }} />

        {/* Step 6: Completed */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: '75px', zIndex: 2 }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: isCompleted ? '#10b981' : '#1e293b',
              color: isCompleted ? '#fff' : '#64748b',
              border: isCompleted ? 'none' : '2px solid #334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCheck size={18} />
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, marginTop: '0.4rem', color: isCompleted ? '#f8fafc' : '#64748b', textAlign: 'center' }}>Completed</div>
          <div style={{ fontSize: '0.65rem', color: isCompleted ? '#34d399' : '#64748b' }}>
            {isCompleted ? 'DELIVERED' : 'FINAL'}
          </div>
        </div>

      </div>
    </div>
  );
};
