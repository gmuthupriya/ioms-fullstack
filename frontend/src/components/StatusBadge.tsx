import React from 'react';
import { Clock, CheckCircle2, CheckCheck, XCircle, ShieldCheck, RefreshCw, Truck, AlertTriangle } from 'lucide-react';

export type StatusType = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED' | 'PAID' | 'FAILED' | 'ACTIVE' | 'INACTIVE';

interface StatusBadgeProps {
  status: StatusType | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', showIcon = true }) => {
  const normStatus = (status || '').toUpperCase();

  const getStyle = () => {
    switch (normStatus) {
      case 'PENDING':
        return {
          bg: 'rgba(245, 158, 11, 0.15)',
          color: '#f59e0b',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          icon: <Clock size={12} style={{ marginRight: '4px' }} />,
          label: 'PENDING',
        };
      case 'CONFIRMED':
        return {
          bg: 'rgba(59, 130, 246, 0.15)',
          color: '#60a5fa',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          icon: <CheckCircle2 size={12} style={{ marginRight: '4px' }} />,
          label: 'CONFIRMED',
        };
      case 'PROCESSING':
        return {
          bg: 'rgba(139, 92, 246, 0.15)',
          color: '#a78bfa',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          icon: <RefreshCw size={12} style={{ marginRight: '4px' }} />,
          label: 'PROCESSING',
        };
      case 'SHIPPED':
        return {
          bg: 'rgba(6, 182, 212, 0.15)',
          color: '#22d3ee',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          icon: <Truck size={12} style={{ marginRight: '4px' }} />,
          label: 'SHIPPED',
        };
      case 'COMPLETED':
      case 'PAID':
        return {
          bg: 'rgba(16, 185, 129, 0.15)',
          color: '#10b981',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          icon: <CheckCheck size={12} style={{ marginRight: '4px' }} />,
          label: normStatus,
        };
      case 'FAILED':
      case 'CANCELLED':
        return {
          bg: 'rgba(239, 68, 68, 0.15)',
          color: '#ef4444',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          icon: <XCircle size={12} style={{ marginRight: '4px' }} />,
          label: normStatus,
        };
      case 'ACTIVE':
      case 'TRUE':
        return {
          bg: 'rgba(16, 185, 129, 0.15)',
          color: '#34d399',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          icon: <ShieldCheck size={12} style={{ marginRight: '4px' }} />,
          label: 'Active',
        };
      case 'INACTIVE':
      case 'FALSE':
        return {
          bg: 'rgba(148, 163, 184, 0.15)',
          color: '#94a3b8',
          border: '1px solid rgba(148, 163, 184, 0.3)',
          icon: <XCircle size={12} style={{ marginRight: '4px' }} />,
          label: 'Inactive',
        };
      default:
        return {
          bg: 'rgba(148, 163, 184, 0.15)',
          color: '#cbd5e1',
          border: '1px solid rgba(148, 163, 184, 0.3)',
          icon: null,
          label: normStatus,
        };
    }
  };

  const style = getStyle();
  const paddingMap = {
    sm: '0.15rem 0.4rem',
    md: '0.25rem 0.65rem',
    lg: '0.4rem 0.85rem',
  };
  const fontSizeMap = {
    sm: '0.7rem',
    md: '0.75rem',
    lg: '0.85rem',
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: style.bg,
        color: style.color,
        border: style.border,
        padding: paddingMap[size],
        fontSize: fontSizeMap[size],
        fontWeight: 700,
        borderRadius: '9999px',
        letterSpacing: '0.03em',
        textTransform: 'uppercase',
        lineHeight: 1.2,
      }}
    >
      {showIcon && style.icon}
      {style.label}
    </span>
  );
};
