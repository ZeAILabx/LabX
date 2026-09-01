import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Map,
  Users,
  Share2,
  Calendar,
  Trophy,
  Award,
  Bell,
  User,
  LogOut,
  ShieldCheck,
  CheckSquare,
  BarChart2,
  Settings,
  Megaphone,
} from 'lucide-react';

export const Sidebar = () => {
  const { user, isFounder, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      style={{
        width: 'var(--sidebar-width)',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        backgroundColor: 'var(--bg-card)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 16px',
        zIndex: 100,
      }}
    >
      {/* Brand Header */}
      <div style={{ marginBottom: '32px', padding: '0 8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '1.2rem',
          }}
        >
          LX
        </div>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.02em', color: '#fff' }}>
            LAB<span style={{ color: 'var(--accent-cyan)' }}>X</span>
          </h2>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {isAdmin ? 'Admin Console' : 'Founder Platform'}
          </span>
        </div>
      </div>

      {/* Nav Links */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
        {isFounder && (
          <>
            <SidebarItem to="/dashboard" icon={<LayoutDashboard size={18} />} label="Dashboard" />
            <SidebarItem to="/roadmap" icon={<Map size={18} />} label="Roadmap" />
            <SidebarItem to="/leaderboard" icon={<Trophy size={18} />} label="Leaderboard" />
            <SidebarItem to="/guild" icon={<Users size={18} />} label="Guild" />
            <SidebarItem to="/social" icon={<Share2 size={18} />} label="Social" />
            <SidebarItem to="/events" icon={<Calendar size={18} />} label="Events & Announcements" />
            <SidebarItem to="/achievements" icon={<Award size={18} />} label="Achievements" />
            <SidebarItem to="/notifications" icon={<Bell size={18} />} label="Notifications" />
            <SidebarItem to="/profile" icon={<User size={18} />} label="Profile" />
          </>
        )}

        {isAdmin && (
          <>
            <div style={{ margin: '12px 0 6px 8px', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              Admin Controls
            </div>
            <SidebarItem to="/admin" icon={<LayoutDashboard size={18} />} label="Admin Dashboard" />
            <SidebarItem to="/admin/verification" icon={<ShieldCheck size={18} />} label="Quest Verification" />
            <SidebarItem to="/admin/quests" icon={<CheckSquare size={18} />} label="Quest Management" />
            <SidebarItem to="/admin/roadmap" icon={<Map size={18} />} label="Roadmap Config" />
            <SidebarItem to="/admin/founders" icon={<Users size={18} />} label="Founders Directory" />
            <SidebarItem to="/admin/events" icon={<Megaphone size={18} />} label="Events & Announcements" />
          </>
        )}
      </nav>

      {/* User Footer */}
      <div
        style={{
          marginTop: 'auto',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '600',
            }}
          >
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '600', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {user?.full_name || 'User'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {isAdmin ? 'Admin' : 'Founder'}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          title="Logout"
          style={{ color: 'var(--text-muted)', padding: '6px', borderRadius: '6px', transition: 'color 0.2s' }}
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
};

const SidebarItem = ({ to, icon, label }) => {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 14px',
        borderRadius: 'var(--radius-md)',
        fontSize: '0.9rem',
        fontWeight: isActive ? '600' : '500',
        color: isActive ? '#fff' : 'var(--text-muted)',
        backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
        borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
        transition: 'all 0.2s ease',
      })}
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
};
