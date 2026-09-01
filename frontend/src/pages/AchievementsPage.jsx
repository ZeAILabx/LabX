import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Navbar } from '../components/common/Navbar';
import { Award, CheckCircle2, Lock } from 'lucide-react';

export const AchievementsPage = () => {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    setLoading(true);
    try {
      const res = await api.getAchievements();
      setAchievements(res.data || []);
    } catch (err) {
      console.error('Error fetching achievements:', err);
    } finally {
      setLoading(false);
    }
  };

  const earnedCount = achievements.filter((a) => a.is_earned).length;

  return (
    <div>
      <Navbar title="Founder Achievements" />

      {/* Progress Card */}
      <div
        className="glass-card"
        style={{
          padding: '24px',
          marginBottom: '28px',
          background: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(99,102,241,0.1) 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fff', marginBottom: '4px' }}>
            Achievement Gallery
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Unlock badges as you complete roadmap milestones, publish social posts, and engage in your guild.
          </p>
        </div>

        <div style={{ padding: '12px 20px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255,255,255,0.05)', textAlign: 'right' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--accent-amber)' }}>
            {earnedCount} / {achievements.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Badges Unlocked</div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', minHeight: '40vh' }}>
          <div className="spinner" />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className="glass-card"
              style={{
                padding: '24px',
                opacity: ach.is_earned ? 1 : 0.6,
                border: ach.is_earned ? '1.5px solid var(--accent-amber)' : '1px solid var(--border-color)',
                backgroundColor: ach.is_earned ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.02)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div style={{ fontSize: '2.2rem' }}>{ach.icon || '🏆'}</div>
                {ach.is_earned ? (
                  <span className="badge badge-amber"><CheckCircle2 size={12} /> Earned</span>
                ) : (
                  <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'var(--text-dim)' }}>
                    <Lock size={12} /> Locked
                  </span>
                )}
              </div>

              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: ach.is_earned ? '#fff' : 'var(--text-muted)', marginBottom: '6px' }}>
                {ach.name}
              </h3>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>{ach.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
