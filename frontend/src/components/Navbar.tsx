import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Package, ShoppingBag, Layers, LayoutDashboard, Shield, Building2, ShoppingCart, User as UserIcon, LogOut, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useCart } from '../context/CartContext.js';

export const Navbar: React.FC = () => {
  const { user, demoAccounts, switchAccount, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const isLoginPage = location.pathname === '/login' || location.pathname === '/register';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-inner">
        <NavLink to="/" className="nav-brand">
          <Package className="w-6 h-6 text-blue-400" />
          <span>IOMS Enterprise</span>
        </NavLink>

        {!isLoginPage && (
          <ul className="nav-links">
            <li>
              <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/products" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Package size={18} />
                <span>Products</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/orders" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <ShoppingBag size={18} />
                <span>Orders</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/inventory" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Layers size={18} />
                <span>Inventory</span>
              </NavLink>
            </li>
          </ul>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Cart Icon Link */}
          {!isLoginPage && (
            <NavLink
              to="/cart"
              className={({ isActive }) => `btn btn-secondary btn-sm ${isActive ? 'btn-primary' : ''}`}
              style={{ position: 'relative', padding: '0.45rem 0.75rem' }}
            >
              <ShoppingCart size={18} />
              <span>Cart</span>
              {totalItems > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    background: '#ef4444',
                    color: 'white',
                    borderRadius: '9999px',
                    padding: '2px 6px',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    lineHeight: 1,
                    boxShadow: '0 0 8px rgba(239,68,68,0.6)',
                  }}
                >
                  {totalItems}
                </span>
              )}
            </NavLink>
          )}

          {/* Account / Tenant Switcher */}
          {demoAccounts && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Building2 size={16} style={{ color: '#94a3b8' }} />
              <select
                className="form-select"
                style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', width: 'auto', background: '#0f172a' }}
                value={
                  user?.role === 'ADMIN' && user?.tenantId === 'tenant-alpha'
                    ? 'tenantAlphaAdmin'
                    : user?.role === 'USER' && user?.tenantId === 'tenant-alpha'
                    ? 'tenantAlphaUser'
                    : 'tenantBetaAdmin'
                }
                onChange={(e) => switchAccount(e.target.value as any)}
              >
                <option value="tenantAlphaAdmin">Tenant Alpha - Admin</option>
                <option value="tenantAlphaUser">Tenant Alpha - User</option>
                <option value="tenantBetaAdmin">Tenant Beta - Admin</option>
              </select>
            </div>
          )}

          {/* User Badge & Menu */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <NavLink to="/profile" className="btn btn-secondary btn-sm" style={{ padding: '0.35rem 0.6rem' }}>
                <UserIcon size={14} />
                <span style={{ fontSize: '0.8rem' }}>{user.username}</span>
              </NavLink>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleLogout}
                title="Sign out"
                style={{ padding: '0.35rem 0.6rem' }}
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <NavLink to="/login" className="btn btn-primary btn-sm">
              <LogIn size={16} />
              <span>Login</span>
            </NavLink>
          )}
        </div>
      </div>
    </nav>
  );
};
