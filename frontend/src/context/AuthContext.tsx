import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, DemoAccounts } from '../types.js';
import { authService } from '../services/api.js';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  demoAccounts: DemoAccounts | null;
  switchAccount: (accountKey: keyof DemoAccounts) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('jwt_token'));
  const [demoAccounts, setDemoAccounts] = useState<DemoAccounts | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      try {
        const accounts = await authService.getDemoAccounts();
        setDemoAccounts(accounts);

        const savedUserStr = localStorage.getItem('auth_user');
        if (savedUserStr && token) {
          setUser(JSON.parse(savedUserStr));
        } else {
          // Default to Tenant Alpha Admin
          const defaultAcc = accounts.tenantAlphaAdmin;
          localStorage.setItem('jwt_token', defaultAcc.token);
          localStorage.setItem('tenant_id', defaultAcc.tenantId);
          localStorage.setItem('auth_user', JSON.stringify({
            username: defaultAcc.username,
            role: defaultAcc.role,
            tenantId: defaultAcc.tenantId,
          }));
          setToken(defaultAcc.token);
          setUser({
            username: defaultAcc.username,
            role: defaultAcc.role,
            tenantId: defaultAcc.tenantId,
          });
        }
      } catch (err) {
        console.warn('Backend connection pending or offline, using fallback auth tokens.');
        const fallbackUser: AuthUser = { username: 'alpha_admin', role: 'ADMIN', tenantId: 'tenant-alpha' };
        setUser(fallbackUser);
      } finally {
        setIsLoading(false);
      }
    }
    initAuth();
  }, []);

  const switchAccount = (accountKey: keyof DemoAccounts) => {
    if (!demoAccounts) return;
    const acc = demoAccounts[accountKey];
    localStorage.setItem('jwt_token', acc.token);
    localStorage.setItem('tenant_id', acc.tenantId);
    const newUser: AuthUser = { username: acc.username, role: acc.role, tenantId: acc.tenantId };
    localStorage.setItem('auth_user', JSON.stringify(newUser));
    setToken(acc.token);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('tenant_id');
    localStorage.removeItem('auth_user');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, demoAccounts, switchAccount, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
