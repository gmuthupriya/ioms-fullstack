import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  ShoppingBag,
  Clock,
  CheckCircle2,
  CheckCheck,
  XCircle,
  DollarSign,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Eye,
  Plus,
  Layers
} from 'lucide-react';
import { productService, orderService } from '../services/api.js';
import { Product, Order } from '../types.js';
import { useAuth } from '../context/AuthContext.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { SkeletonLoader } from '../components/SkeletonLoader.js';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const [prodData, orderData] = await Promise.all([
          productService.list({ limit: 100 }),
          orderService.list({ limit: 100 }),
        ]);
        setProducts(prodData.data || []);
        setOrders(orderData.data || []);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [user?.tenantId, user?.role]);

  // Statistics calculation from real backend dataset
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === 'PENDING').length;
  const confirmedOrders = orders.filter((o) => o.status === 'CONFIRMED').length;
  const completedOrders = orders.filter((o) => o.status === 'COMPLETED').length;
  const cancelledOrders = orders.filter((o) => o.status === 'CANCELLED').length;
  const totalRevenue = orders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.active).length;
  const lowStockCount = products.filter((p) => (p.availableQuantity ?? 0) <= 5).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Executive Dashboard</h1>
            <StatusBadge status={user?.role === 'ADMIN' ? 'ADMIN' : 'USER'} size="lg" />
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
            Live metrics & order lifecycle overview for Tenant: <strong style={{ color: '#60a5fa' }}>{user?.tenantId}</strong>
          </p>
        </div>

        {/* Quick Action Navigation Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/products" className="btn btn-secondary">
            <Package size={16} />
            <span>Browse Products</span>
          </Link>
          <Link to="/orders" className="btn btn-primary">
            <ShoppingBag size={16} />
            <span>Manage Orders</span>
          </Link>
        </div>
      </div>

      {/* Real Summary Metric Cards Grid */}
      {loading ? (
        <div className="grid-stats">
          <SkeletonLoader type="stat-card" count={6} />
        </div>
      ) : (
        <div className="grid-stats">
          <div className="card stat-card">
            <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
              <ShoppingBag size={24} />
            </div>
            <div>
              <div className="stat-val">{totalOrders}</div>
              <div className="stat-label">Total Orders</div>
            </div>
          </div>

          <div className="card stat-card">
            <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
              <Clock size={24} />
            </div>
            <div>
              <div className="stat-val" style={{ color: '#f59e0b' }}>{pendingOrders}</div>
              <div className="stat-label">Pending Orders</div>
            </div>
          </div>

          <div className="card stat-card">
            <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div className="stat-val" style={{ color: '#60a5fa' }}>{confirmedOrders}</div>
              <div className="stat-label">Confirmed Orders</div>
            </div>
          </div>

          <div className="card stat-card">
            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              <CheckCheck size={24} />
            </div>
            <div>
              <div className="stat-val" style={{ color: '#10b981' }}>{completedOrders}</div>
              <div className="stat-label">Completed Orders</div>
            </div>
          </div>

          <div className="card stat-card">
            <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
              <XCircle size={24} />
            </div>
            <div>
              <div className="stat-val" style={{ color: '#ef4444' }}>{cancelledOrders}</div>
              <div className="stat-label">Cancelled Orders</div>
            </div>
          </div>

          <div className="card stat-card">
            <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' }}>
              <DollarSign size={24} />
            </div>
            <div>
              <div className="stat-val" style={{ color: '#a78bfa' }}>
                ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="stat-label">Total Purchase Volume</div>
            </div>
          </div>
        </div>
      )}

      {/* Visual Charts & Status Breakdown Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* Order Status Distribution Chart (Pure CSS Bar Visualizer) */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Orders by Status Breakdown</h3>
            <TrendingUp size={18} style={{ color: '#60a5fa' }} />
          </div>

          {totalOrders === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No orders placed yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                  <span style={{ color: '#f59e0b' }}>Pending ({pendingOrders})</span>
                  <span>{Math.round((pendingOrders / totalOrders) * 100)}%</span>
                </div>
                <div style={{ height: '8px', background: '#0b1120', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${(pendingOrders / totalOrders) * 100}%`, height: '100%', background: '#f59e0b', borderRadius: '4px' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                  <span style={{ color: '#60a5fa' }}>Confirmed ({confirmedOrders})</span>
                  <span>{Math.round((confirmedOrders / totalOrders) * 100)}%</span>
                </div>
                <div style={{ height: '8px', background: '#0b1120', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${(confirmedOrders / totalOrders) * 100}%`, height: '100%', background: '#3b82f6', borderRadius: '4px' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                  <span style={{ color: '#10b981' }}>Completed ({completedOrders})</span>
                  <span>{Math.round((completedOrders / totalOrders) * 100)}%</span>
                </div>
                <div style={{ height: '8px', background: '#0b1120', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${(completedOrders / totalOrders) * 100}%`, height: '100%', background: '#10b981', borderRadius: '4px' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                  <span style={{ color: '#ef4444' }}>Cancelled ({cancelledOrders})</span>
                  <span>{Math.round((cancelledOrders / totalOrders) * 100)}%</span>
                </div>
                <div style={{ height: '8px', background: '#0b1120', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${(cancelledOrders / totalOrders) * 100}%`, height: '100%', background: '#ef4444', borderRadius: '4px' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tenant RBAC & Security Audit Widget */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Multi-Tenant Security & RBAC</h3>
            <ShieldCheck size={20} style={{ color: '#10b981' }} />
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem', color: '#94a3b8' }}>
            <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <span style={{ color: '#10b981', fontWeight: 800 }}>✓</span>
              <span>All backend queries automatically filtered by header <strong>X-Tenant-ID</strong> ({user?.tenantId}).</span>
            </li>
            <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <span style={{ color: '#10b981', fontWeight: 800 }}>✓</span>
              <span>Order status modification endpoints restricted strictly to <strong>ADMIN</strong> roles.</span>
            </li>
            <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <span style={{ color: '#10b981', fontWeight: 800 }}>✓</span>
              <span>Atomic transactions prevent stock degradation and partial inventory deductions.</span>
            </li>
            <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <span style={{ color: '#10b981', fontWeight: 800 }}>✓</span>
              <span>Canonical server pricing enforced on all checkout transactions.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Recent Orders</h2>
          <Link to="/orders" style={{ fontSize: '0.85rem', color: '#60a5fa', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span>View All Orders</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="table-container" style={{ border: 'none' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonLoader type="table-row" count={3} />
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                    No recent orders found.
                  </td>
                </tr>
              ) : (
                orders.slice(0, 5).map((order) => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: 700, fontFamily: 'monospace', color: '#60a5fa' }}>{order.id}</td>
                    <td style={{ fontSize: '0.85rem' }}>{order.userId}</td>
                    <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ fontWeight: 800 }}>${Number(order.totalAmount).toFixed(2)}</td>
                    <td>
                      <StatusBadge status={order.status} />
                    </td>
                    <td>
                      <Link to="/orders" className="btn btn-secondary btn-sm">
                        <Eye size={14} />
                        <span>Details</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
