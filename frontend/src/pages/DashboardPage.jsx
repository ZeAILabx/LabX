import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Navbar } from '../components/common/Navbar';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  Shield,
  Award,
  Users,
  Coins,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

export const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.getProgress();
      setData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card" style={{ padding: '32px', textAlign: 'center', color: 'var(--accent-red)' }}>
        {error}
      </div>
    );
  }

  const {
    profile,
    current_stage,
    current_level,
    current_milestone,
    milestone_progress_percentage,
    core_quests_completed,
    core_quests_total,
    overall_progress_percentage,
    total_points,
    next_quest,
  } = data || {};

  return (
    <div>
      <Navbar title={`Welcome back, ${profile?.full_name || 'Founder'}`} />

      {/* Hero Progression Banner */}
      <div
        className="glass-card"
        style={{
          padding: '32px',
          marginBottom: '28px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(6,182,212,0.1) 100%)',
          border: '1px solid rgba(99,102,241,0.3)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px' }}>
              <span className="badge badge-cyan">
                <Compass size={12} /> {profile?.domains?.name || 'Domain'}
              </span>
              <span className="badge badge-primary">
                <Shield size={12} /> {current_stage?.name || 'Stage'} Stage
              </span>
              <span className="badge badge-amber">
                <Award size={12} /> {current_level?.name || 'Level 1'}
              </span>
            </div>

            <h2 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '8px', color: '#fff' }}>
              Current Milestone: {current_milestone?.name || 'Milestone 1'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '600px' }}>
              {current_milestone?.description || 'Complete all mandatory Core Quests to unlock the next milestone in your roadmap.'}
            </p>
          </div>

          {/* Primary CTA */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <button
              className="btn btn-primary"
              style={{ padding: '14px 28px', fontSize: '1.05rem', boxShadow: '0 0 25px rgba(99,102,241,0.5)' }}
              onClick={() => {
                if (current_milestone) {
                  navigate(`/roadmap/milestones/${current_milestone.id}`);
                } else {
                  navigate('/roadmap');
                }
              }}
            >
              <Sparkles size={20} /> Continue Current Quest <ArrowRight size={20} />
            </button>
            {next_quest && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                Up Next: {next_quest.title}
              </span>
            )}
          </div>
        </div>

        {/* Milestone Progress Bar */}
        <div style={{ marginTop: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px', fontWeight: '600' }}>
            <span>Milestone Progress ({core_quests_completed} / {core_quests_total} Core Quests)</span>
            <span style={{ color: 'var(--accent-cyan)' }}>{milestone_progress_percentage}%</span>
          </div>
          <div className="progress-bar-bg" style={{ height: '10px' }}>
            <div className="progress-bar-fill" style={{ width: `${milestone_progress_percentage}%` }} />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        <StatCard
          icon={<Coins color="var(--accent-amber)" size={24} />}
          label="LABX Points"
          value={total_points || 0}
          unit="Points"
        />
        <StatCard
          icon={<CheckCircle2 color="var(--accent-green)" size={24} />}
          label="Overall Progress"
          value={`${overall_progress_percentage}%`}
          unit="Roadmap"
        />
        <StatCard
          icon={<Users color="var(--accent-cyan)" size={24} />}
          label="Domain Guild"
          value={profile?.guilds?.name || 'My Guild'}
          unit="Community"
          onClick={() => navigate('/guild')}
        />
      </div>

      {/* Quick Access Tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {/* Current Quest Card Preview */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="var(--primary)" /> Next Action Item
          </h3>

          {next_quest ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span className={`badge ${next_quest.quest_type === 'core' ? 'badge-primary' : 'badge-cyan'}`}>
                  {next_quest.quest_type.toUpperCase()} QUEST
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--accent-amber)', fontWeight: '700' }}>
                  +{next_quest.points} Points
                </span>
              </div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '6px', color: '#fff' }}>
                {next_quest.title}
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '18px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {next_quest.description}
              </p>
              <button
                className="btn btn-secondary"
                style={{ width: '100%' }}
                onClick={() => navigate(`/roadmap/milestones/${current_milestone?.id}`)}
              >
                Open Quest Details <ChevronRight size={16} />
              </button>
            </div>
          ) : (
            <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              All quests for the current milestone are completed or under review!
            </div>
          )}
        </div>

        {/* Guild Community Preview */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} color="var(--accent-cyan)" /> Guild Community
          </h3>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Connect with fellow founders in the <strong>{profile?.guilds?.name}</strong>. Share updates, get feedback, and collaborate.
          </p>

          <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => navigate('/guild')}>
            Enter Guild Chat <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, unit, onClick }) => (
  <div
    className="glass-card"
    onClick={onClick}
    style={{
      padding: '20px',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'transform 0.2s ease',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
      <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.04)' }}>{icon}</div>
      <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
        {label}
      </span>
    </div>
    <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fff' }}>{value}</div>
    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>{unit}</div>
  </div>
);
