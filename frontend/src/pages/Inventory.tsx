import React, { useEffect, useState } from 'react';
import { Layers, RefreshCw, History, AlertCircle, CheckCircle } from 'lucide-react';
import { productService, inventoryService } from '../services/api.js';
import { Product, InventoryTransaction } from '../types.js';
import { useAuth } from '../context/AuthContext.js';

export const Inventory: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Adjustment Modal State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantityChange, setQuantityChange] = useState<number>(0);
  const [reason, setReason] = useState<string>('RESTOCK');

  // Transactions Audit Modal State
  const [auditProduct, setAuditProduct] = useState<Product | null>(null);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await productService.list({ limit: 100, activeOnly: true });
      setProducts(res.data || []);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [user?.tenantId]);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      setErrorMsg(null);
      await inventoryService.adjust(selectedProduct.id, quantityChange, reason);
      setSuccessMsg(`Inventory for '${selectedProduct.name}' adjusted by ${quantityChange} units!`);
      setSelectedProduct(null);
      setQuantityChange(0);
      fetchProducts();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to adjust inventory');
    }
  };

  const handleViewAudit = async (product: Product) => {
    setAuditProduct(product);
    try {
      setLoadingTx(true);
      const items = await inventoryService.getTransactions(product.id);
      setTransactions(items || []);
    } catch (err: any) {
      console.error('Failed to load transaction history:', err);
    } finally {
      setLoadingTx(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Inventory Management</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Track real-time quantities & stock transaction audits for Tenant: {user?.tenantId}</p>
        </div>
      </div>

      {errorMsg && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="alert alert-success">
          <CheckCircle size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="table-container card" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Product</th>
              <th>Available Stock</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                  Loading inventory status...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                  No active products found.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id}>
                  <td style={{ fontWeight: 600, fontFamily: 'monospace', color: '#60a5fa' }}>{product.sku}</td>
                  <td style={{ fontWeight: 600 }}>{product.name}</td>
                  <td>
                    <span className={`badge ${(product.availableQuantity ?? 0) > 5 ? 'badge-success' : 'badge-warning'}`}>
                      {product.availableQuantity ?? 0} Available
                    </span>
                  </td>
                  <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                    {new Date(product.updatedAt || Date.now()).toLocaleString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {user?.role === 'ADMIN' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => setSelectedProduct(product)}
                        >
                          <RefreshCw size={14} />
                          <span>Adjust Stock</span>
                        </button>
                      )}
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleViewAudit(product)}
                      >
                        <History size={14} />
                        <span>Audit Log</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Adjust Inventory Modal */}
      {selectedProduct && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Adjust Inventory ({selectedProduct.sku})</h3>
              <button className="modal-close" onClick={() => setSelectedProduct(null)}>&times;</button>
            </div>
            <form onSubmit={handleAdjustSubmit}>
              <div style={{ marginBottom: '1rem', background: '#0f172a', padding: '0.75rem', borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Current Stock Level:</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#60a5fa' }}>
                  {selectedProduct.availableQuantity ?? 0} units
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Quantity Change (+ Add, - Reduce)</label>
                <input
                  type="number"
                  className="form-input"
                  required
                  placeholder="e.g. +25 or -5"
                  value={quantityChange}
                  onChange={(e) => setQuantityChange(parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Reason Code</label>
                <select
                  className="form-select"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                >
                  <option value="RESTOCK">RESTOCK (Warehouse shipment)</option>
                  <option value="CYCLE_COUNT">CYCLE_COUNT (Inventory audit correction)</option>
                  <option value="DAMAGED">DAMAGED (Stock write-off)</option>
                  <option value="RETURN">RETURN (Customer item return)</option>
                </select>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedProduct(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Confirm Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit Log Modal */}
      {auditProduct && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Audit History: {auditProduct.name} ({auditProduct.sku})</h3>
              <button className="modal-close" onClick={() => setAuditProduct(null)}>&times;</button>
            </div>

            <div className="table-container" style={{ maxHeight: '350px' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Change</th>
                    <th>Reason</th>
                    <th>User</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingTx ? (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: '1rem' }}>Loading audit log...</td></tr>
                  ) : transactions.length === 0 ? (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8' }}>No recorded transactions.</td></tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(tx.createdAt).toLocaleString()}</td>
                        <td style={{ fontWeight: 700, color: tx.quantityChange >= 0 ? '#10b981' : '#ef4444' }}>
                          {tx.quantityChange >= 0 ? `+${tx.quantityChange}` : tx.quantityChange}
                        </td>
                        <td style={{ fontSize: '0.8rem' }}>{tx.reason}</td>
                        <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{tx.createdBy}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setAuditProduct(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
