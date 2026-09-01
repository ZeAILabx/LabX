import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Bell, Coins, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Navbar = ({ title }) => {
  const { user, isFounder, isAdmin } = useAuth();
  const navigate = useNavigate();

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '28px',
        paddingBottom: '16px',
        borderBottom: '1px solid var(--border-color)',
      }}
    >
      <div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#fff', letterSpacing: '-0.02em' }}>{title}</h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {isFounder && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              color: 'var(--accent-amber)',
              fontWeight: '700',
              fontSize: '0.9rem',
            }}
          >
            <Coins size={16} />
            <span>{user?.total_points || 0} LABX</span>
          </div>
        )}

        {isAdmin && (
          <span className="badge badge-amber" style={{ padding: '6px 12px' }}>
            <Shield size={14} /> Admin Privileges
          </span>
        )}

        {isFounder && (
          <button
            onClick={() => navigate('/notifications')}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
          >
            <Bell size={18} />
          </button>
        )}
      </div>
    </header>
  );
};
