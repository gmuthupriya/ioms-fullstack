import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Plus,
  Eye,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Clock,
  RefreshCw,
  CreditCard,
  Truck,
  CheckCheck
} from 'lucide-react';
import { orderService, productService } from '../services/api.js';
import { Order, Product } from '../types.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { OrderTimeline } from '../components/OrderTimeline.js';
import { SkeletonLoader } from '../components/SkeletonLoader.js';

export const Orders: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('ALL');

  // Modals & Details State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Array<{ productId: string; quantity: number }>>([]);
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderService.list({ limit: 100 });
      setOrders(res.data || []);
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await productService.list({ limit: 100, activeOnly: true });
      setProducts(res.data || []);
    } catch (err) {
      console.error('Failed to load active products:', err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, [user?.tenantId, user?.role]);

  const handleAddItemRow = () => {
    if (products.length === 0) return;
    setSelectedItems([...selectedItems, { productId: products[0].id, quantity: 1 }]);
  };

  const handleItemChange = (index: number, field: 'productId' | 'quantity', value: any) => {
    const updated = [...selectedItems];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedItems(updated);
  };

  const handleRemoveItemRow = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const calculateEstimate = () => {
    return selectedItems.reduce((sum, item) => {
      const p = products.find((prod) => prod.id === item.productId);
      return sum + (p ? Number(p.price) * item.quantity : 0);
    }, 0);
  };

  const handleCreateOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      showToast('Please add at least one item to the order', 'warning');
      return;
    }
    try {
      const order = await orderService.create(selectedItems);
      showToast(`Order ${order.id} created! Redirecting to Payment...`, 'success');
      setShowCreateModal(false);
      setSelectedItems([]);
      navigate(`/payment/${order.id}`);
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to place order', 'error');
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingStatusId(orderId);
      await orderService.updateStatus(orderId, newStatus);
      showToast(`Order ${orderId} status updated to ${newStatus}`, 'success');
      
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as any } : o))
      );
      if (viewOrder && viewOrder.id === orderId) {
        setViewOrder({ ...viewOrder, status: newStatus as any });
      }
      fetchOrders();
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to update order status', 'error');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // Filter Orders
  const filteredOrders = orders.filter((o) => {
    const matchesSearch = o.id.toLowerCase().includes(search.toLowerCase()) || o.userId.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    const matchesPaymentStatus = paymentStatusFilter === 'ALL' || o.paymentStatus === paymentStatusFilter;
    return matchesSearch && matchesStatus && matchesPaymentStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>Order Management</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
            {user?.role === 'USER' ? 'Track your active and past orders' : 'Review and update order lifecycle for Tenant:'} {user?.tenantId}
          </p>
        </div>

        {user?.role === 'USER' && (
          <button
            className="btn btn-primary"
            onClick={() => {
              setShowCreateModal(true);
              if (selectedItems.length === 0) handleAddItemRow();
            }}
          >
            <Plus size={18} />
            <span>New Quick Order</span>
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          
          <div style={{ flex: 2, minWidth: '220px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.6rem' }}
              placeholder="Search by Order ID or User ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '180px' }}>
            <Filter size={16} style={{ color: '#94a3b8' }} />
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ fontSize: '0.85rem' }}
            >
              <option value="ALL">All Order Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="PROCESSING">PROCESSING</option>
              <option value="SHIPPED">SHIPPED</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '180px' }}>
            <CreditCard size={16} style={{ color: '#94a3b8' }} />
            <select
              className="form-select"
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              style={{ fontSize: '0.85rem' }}
            >
              <option value="ALL">All Payment Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="PAID">PAID</option>
              <option value="FAILED">FAILED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

        </div>
      </div>

      {/* Orders Table Container */}
      <div className="table-container card" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Order Date</th>
              <th>Total Amount</th>
              <th>Payment Status</th>
              <th>Order Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonLoader type="table-row" count={4} />
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem 2rem' }}>
                  No orders found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td style={{ fontWeight: 800, fontFamily: 'monospace', color: '#60a5fa', fontSize: '0.95rem' }}>
                    {order.id}
                  </td>
                  <td style={{ fontSize: '0.875rem', fontWeight: 600 }}>{order.userId}</td>
                  <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                    {new Date(order.createdAt).toLocaleString()}
                  </td>
                  <td style={{ fontWeight: 800, fontSize: '1.05rem' }}>
                    ₹{Number(order.totalAmount).toFixed(2)}
                  </td>
                  <td>
                    <StatusBadge status={order.paymentStatus || 'PENDING'} size="sm" />
                  </td>
                  <td>
                    {user?.role === 'ADMIN' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <select
                          className="form-select"
                          style={{
                            padding: '0.3rem 0.6rem',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            width: 'auto',
                          }}
                          value={order.status}
                          disabled={updatingStatusId === order.id}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="PROCESSING">PROCESSING</option>
                          <option value="SHIPPED">SHIPPED</option>
                          <option value="COMPLETED">COMPLETED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </div>
                    ) : (
                      <StatusBadge status={order.status} size="sm" />
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setViewOrder(order)}
                      >
                        <Eye size={14} />
                        <span>Details</span>
                      </button>

                      {order.paymentStatus !== 'PAID' && order.status !== 'CANCELLED' && (
                        <Link
                          to={`/payment/${order.id}`}
                          className="btn btn-primary btn-sm"
                          style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                        >
                          <CreditCard size={14} />
                          <span>Pay Now</span>
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: View Order Breakdown & Status Timeline */}
      {viewOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Order Details</div>
                <h3 className="modal-title" style={{ fontFamily: 'monospace', color: '#60a5fa' }}>{viewOrder.id}</h3>
              </div>
              <button className="modal-close" onClick={() => setViewOrder(null)}>&times;</button>
            </div>

            {/* Dynamic Visual Timeline */}
            <div style={{ marginBottom: '1.5rem' }}>
              <OrderTimeline
                status={viewOrder.status}
                paymentStatus={viewOrder.paymentStatus}
                createdAt={viewOrder.createdAt}
                updatedAt={viewOrder.updatedAt}
              />
            </div>

            {/* Order Metadata Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#0b1120', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              <div><strong style={{ color: '#94a3b8' }}>Placed By:</strong> {viewOrder.userId}</div>
              <div><strong style={{ color: '#94a3b8' }}>Tenant ID:</strong> {viewOrder.tenantId}</div>
              <div><strong style={{ color: '#94a3b8' }}>Order Date:</strong> {new Date(viewOrder.createdAt).toLocaleString()}</div>
              <div><strong style={{ color: '#94a3b8' }}>Payment Status:</strong> <StatusBadge status={viewOrder.paymentStatus || 'PENDING'} size="sm" /></div>
              <div><strong style={{ color: '#94a3b8' }}>Order Status:</strong> <StatusBadge status={viewOrder.status} size="sm" /></div>
              {viewOrder.paymentStatus !== 'PAID' && (
                <div>
                  <Link to={`/payment/${viewOrder.id}`} className="btn btn-primary btn-sm" style={{ background: '#10b981' }}>
                    <CreditCard size={14} />
                    <span>Pay Now for Same Order</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Admin Quick Sequential Transition Controls */}
            {user?.role === 'ADMIN' && (
              <div style={{ marginBottom: '1.25rem', padding: '0.875rem', background: 'rgba(59, 130, 246, 0.08)', borderRadius: '0.5rem', border: '1px solid rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#60a5fa' }}>Admin Workflow Actions:</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {viewOrder.status === 'CONFIRMED' && (
                    <button className="btn btn-primary btn-sm" onClick={() => handleStatusChange(viewOrder.id, 'PROCESSING')}>
                      <RefreshCw size={14} />
                      <span>Start Processing</span>
                    </button>
                  )}
                  {viewOrder.status === 'PROCESSING' && (
                    <button className="btn btn-primary btn-sm" style={{ background: '#06b6d4' }} onClick={() => handleStatusChange(viewOrder.id, 'SHIPPED')}>
                      <Truck size={14} />
                      <span>Ship Order</span>
                    </button>
                  )}
                  {viewOrder.status === 'SHIPPED' && (
                    <button className="btn btn-primary btn-sm" style={{ background: '#10b981' }} onClick={() => handleStatusChange(viewOrder.id, 'COMPLETED')}>
                      <CheckCheck size={14} />
                      <span>Complete Order</span>
                    </button>
                  )}
                  {['PENDING', 'CONFIRMED', 'PROCESSING'].includes(viewOrder.status) && (
                    <button className="btn btn-danger btn-sm" onClick={() => handleStatusChange(viewOrder.id, 'CANCELLED')}>
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Products Breakdown Table */}
            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>Purchased Line Items</h4>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Product ID</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th>Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewOrder.items && viewOrder.items.length > 0 ? (
                      viewOrder.items.map((item) => (
                        <tr key={item.id}>
                          <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{item.productId}</td>
                          <td style={{ fontWeight: 700 }}>{item.quantity}</td>
                          <td>₹{Number(item.unitPrice).toFixed(2)}</td>
                          <td style={{ fontWeight: 800, color: '#f8fafc' }}>₹{Number(item.lineTotal).toFixed(2)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8' }}>Line items details unavailable.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.875rem', borderTop: '1px solid #1e293b' }}>
              <span style={{ fontWeight: 700 }}>Final Order Amount:</span>
              <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#10b981' }}>
                ₹{Number(viewOrder.totalAmount).toFixed(2)}
              </span>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setViewOrder(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Quick Order */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '620px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Create New Order</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleCreateOrderSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Order Items (Atomic Stock Reservation)</label>

                {selectedItems.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', alignItems: 'center' }}>
                    <select
                      className="form-select"
                      style={{ flex: 2 }}
                      value={item.productId}
                      onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (₹{Number(p.price).toFixed(2)}) — Available: {p.availableQuantity ?? 0}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      style={{ flex: 1 }}
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                    />

                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => handleRemoveItemRow(idx)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}

                <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddItemRow}>
                  <Plus size={14} />
                  <span>Add Product Line Item</span>
                </button>
              </div>

              <div style={{ background: '#0b1120', padding: '1rem', borderRadius: '0.5rem', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Calculated Total (Canonical Price):</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#10b981' }}>
                  ₹{calculateEstimate().toFixed(2)}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Order & Pay</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
