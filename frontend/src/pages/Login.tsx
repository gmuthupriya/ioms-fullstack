import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Package, Lock, User as UserIcon, Eye, EyeOff, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';

export const Login: React.FC = () => {
  const { demoAccounts, switchAccount } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [username, setUsername] = useState('alpha_user');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'tenantAlphaUser' | 'tenantAlphaAdmin' | 'tenantBetaAdmin'>('tenantAlphaUser');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      showToast('Please enter both username and password', 'warning');
      return;
    }

    try {
      setLoading(true);
      // Switch to selected account context
      switchAccount(selectedRole);
      showToast(`Welcome back, ${username}! Successfully logged in.`, 'success');
      navigate('/');
    } catch (err: any) {
      showToast(err.message || 'Login failed. Please check credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = (key: 'tenantAlphaUser' | 'tenantAlphaAdmin' | 'tenantBetaAdmin') => {
    setSelectedRole(key);
    if (key === 'tenantAlphaUser') setUsername('alpha_user');
    if (key === 'tenantAlphaAdmin') setUsername('alpha_admin');
    if (key === 'tenantBetaAdmin') setUsername('beta_admin');
  };

  return (
    <div style={{ maxWidth: '440px', margin: '3rem auto 0', width: '100%' }}>
      <div className="card" style={{ padding: '2.25rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', padding: '0.75rem', borderRadius: '1rem', background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa', marginBottom: '1rem' }}>
            <Package size={36} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Welcome Back</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Sign in to access your Enterprise Order & Inventory Dashboard
          </p>
        </div>

        <form onSubmit={handleLoginSubmit}>
          <div className="form-group">
            <label className="form-label">Username or Email</label>
            <div style={{ position: 'relative' }}>
              <UserIcon size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.6rem' }}
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                style={{ paddingLeft: '2.6rem', paddingRight: '2.6rem' }}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', color: '#94a3b8' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember me
            </label>
            <a href="#forgot" onClick={(e) => { e.preventDefault(); showToast('Demo password reset instruction sent to email.', 'info'); }} style={{ color: '#60a5fa', textDecoration: 'none' }}>
              Forgot password?
            </a>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Demo Accounts Quick Selection */}
        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #1e293b' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <ShieldCheck size={14} style={{ color: '#f59e0b' }} />
            <span>Select Demo Role to Sign In</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button
              type="button"
              className={`btn btn-secondary btn-sm ${selectedRole === 'tenantAlphaUser' ? 'btn-primary' : ''}`}
              style={{ justifyContent: 'space-between' }}
              onClick={() => handleQuickSelect('tenantAlphaUser')}
            >
              <span>User (Customer) — Tenant Alpha</span>
              {selectedRole === 'tenantAlphaUser' && <CheckCircle2 size={14} />}
            </button>

            <button
              type="button"
              className={`btn btn-secondary btn-sm ${selectedRole === 'tenantAlphaAdmin' ? 'btn-primary' : ''}`}
              style={{ justifyContent: 'space-between' }}
              onClick={() => handleQuickSelect('tenantAlphaAdmin')}
            >
              <span>Alpha Admin — Management</span>
              {selectedRole === 'tenantAlphaAdmin' && <CheckCircle2 size={14} />}
            </button>

            <button
              type="button"
              className={`btn btn-secondary btn-sm ${selectedRole === 'tenantBetaAdmin' ? 'btn-primary' : ''}`}
              style={{ justifyContent: 'space-between' }}
              onClick={() => handleQuickSelect('tenantBetaAdmin')}
            >
              <span>Beta Admin — Tenant Beta</span>
              {selectedRole === 'tenantBetaAdmin' && <CheckCircle2 size={14} />}
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#60a5fa', fontWeight: 600, textDecoration: 'none' }}>
            Register now
          </Link>
        </div>
      </div>
    </div>
  );
};
