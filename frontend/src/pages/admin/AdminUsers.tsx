import React, { useState } from 'react';
import { Users as UsersIcon, Search, Shield, Filter, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { StatusBadge } from '../../components/StatusBadge.js';

interface UserRecord {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'USER';
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export const AdminUsers: React.FC = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'USER'>('ALL');

  // Pre-populated realistic user list for the tenant
  const users: UserRecord[] = [
    {
      id: 'usr_alpha_admin',
      username: 'alpha_admin',
      email: 'admin@alpha-corp.com',
      role: 'ADMIN',
      status: 'ACTIVE',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: 'usr_alpha_user',
      username: 'alpha_user',
      email: 'user1@alpha-corp.com',
      role: 'USER',
      status: 'ACTIVE',
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    },
    {
      id: 'usr_alpha_user2',
      username: 'alpha_user2',
      email: 'procurement@alpha-corp.com',
      role: 'USER',
      status: 'ACTIVE',
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
  ];

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.username.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>User Management</h1>
        <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Manage tenant user accounts & RBAC authorizations for Tenant: {user?.tenantId}</p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Search by username or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={16} style={{ color: '#94a3b8' }} />
            <select
              className="form-select"
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">ADMIN Role</option>
              <option value="USER">USER Role</option>
            </select>
          </div>
        </div>
      </div>

      <div className="table-container card" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                  No users found matching search criteria.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600, color: '#60a5fa' }}>{u.id}</td>
                  <td style={{ fontWeight: 700 }}>{u.username}</td>
                  <td style={{ color: '#94a3b8' }}>{u.email}</td>
                  <td>
                    <StatusBadge status={u.role} />
                  </td>
                  <td>
                    <StatusBadge status={u.status} />
                  </td>
                  <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
