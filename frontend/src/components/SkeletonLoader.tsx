import React from 'react';

interface SkeletonProps {
  type?: 'card' | 'table-row' | 'product-card' | 'stat-card';
  count?: number;
}

export const SkeletonLoader: React.FC<SkeletonProps> = ({ type = 'card', count = 1 }) => {
  const renderItem = (index: number) => {
    switch (type) {
      case 'product-card':
        return (
          <div key={index} className="card skeleton-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '320px' }}>
            <div className="skeleton-pulse" style={{ height: '140px', borderRadius: '0.5rem' }} />
            <div className="skeleton-pulse" style={{ height: '20px', width: '70%', borderRadius: '0.25rem' }} />
            <div className="skeleton-pulse" style={{ height: '14px', width: '40%', borderRadius: '0.25rem' }} />
            <div className="skeleton-pulse" style={{ height: '36px', marginTop: 'auto', borderRadius: '0.5rem' }} />
          </div>
        );
      case 'stat-card':
        return (
          <div key={index} className="card skeleton-container" style={{ display: 'flex', alignItems: 'center', gap: '1rem', height: '90px' }}>
            <div className="skeleton-pulse" style={{ width: '48px', height: '48px', borderRadius: '0.75rem' }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div className="skeleton-pulse" style={{ height: '24px', width: '50%', borderRadius: '0.25rem' }} />
              <div className="skeleton-pulse" style={{ height: '14px', width: '80%', borderRadius: '0.25rem' }} />
            </div>
          </div>
        );
      case 'table-row':
        return (
          <tr key={index} className="skeleton-container">
            <td colSpan={6} style={{ padding: '0.875rem' }}>
              <div className="skeleton-pulse" style={{ height: '20px', borderRadius: '0.25rem', width: '100%' }} />
            </td>
          </tr>
        );
      default:
        return (
          <div key={index} className="card skeleton-container" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="skeleton-pulse" style={{ height: '24px', width: '40%', borderRadius: '0.25rem' }} />
            <div className="skeleton-pulse" style={{ height: '16px', width: '90%', borderRadius: '0.25rem' }} />
            <div className="skeleton-pulse" style={{ height: '16px', width: '70%', borderRadius: '0.25rem' }} />
          </div>
        );
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, idx) => renderItem(idx))}
    </>
  );
};
