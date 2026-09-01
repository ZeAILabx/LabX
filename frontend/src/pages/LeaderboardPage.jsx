import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Navbar } from '../components/common/Navbar';
import {
  Trophy,
  Medal,
  Award,
  Search,
  Filter,
  Users,
  Compass,
  ChevronRight,
  TrendingUp,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export const LeaderboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    leaderboard: [],
    user_standing: null,
    total_founders: 0,
    current_domain: {},
    domains: [],
  });
  const [scope, setScope] = useState('domain'); // 'domain' | 'all' | domain_id
  const [search, setSearch] = useState('');
  const [selectedDomainId, setSelectedDomainId] = useState('');

  useEffect(() => {
    fetchLeaderboard();
  }, [scope, selectedDomainId]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedDomainId && selectedDomainId !== 'all') {
        params.domain_id = selectedDomainId;
      } else if (scope === 'domain') {
        params.scope = 'domain';
      } else {
        params.scope = 'all';
      }

      if (search.trim()) {
        params.search = search.trim();
      }

      const res = await api.getLeaderboard(params);
      setData(res.data || {});
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLeaderboard();
  };

  const leaderboardList = data.leaderboard || [];
  const top3 = leaderboardList.slice(0, 3);
  const restList = leaderboardList.slice(3);
  const userStanding = data.user_standing;
  const currentDomainName = data.current_domain?.name || 'My Domain';

  return (
    <div>
      <Navbar title="Leaderboard" />

      {/* Hero Header Banner */}
      <div
        className="glass-card"
        style={{
          padding: '28px',
          marginBottom: '24px',
          background: 'linear-gradient(135deg, rgba(6,182,212,0.12) 0%, rgba(99,102,241,0.15) 50%, rgba(245,158,11,0.1) 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(245,158,11,0.4)',
              }}
            >
              <Trophy size={22} color="#fff" />
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#fff' }}>LABX Founder Leaderboard</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '650px' }}>
            Track top-performing startup founders across tech domains. Earn LABX Points by executing milestone quests,
            unlocking levels, and achieving platform milestones.
          </p>
        </div>

        {/* Total Founders in scope */}
        <div style={{ display: 'flex', gap: '16px' }}>
          <div
            style={{
              padding: '12px 20px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--border-color)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--accent-cyan)' }}>
              {data.total_founders || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Active Founders
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div
        className="glass-card"
        style={{
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        {/* Scope Tabs */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className={`btn ${scope === 'domain' && !selectedDomainId ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '0.88rem' }}
            onClick={() => {
              setScope('domain');
              setSelectedDomainId('');
            }}
          >
            <Compass size={16} /> {currentDomainName}
          </button>

          <button
            className={`btn ${scope === 'all' && !selectedDomainId ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '0.88rem' }}
            onClick={() => {
              setScope('all');
              setSelectedDomainId('');
            }}
          >
            <Users size={16} /> Global (All Domains)
          </button>

          {/* Domain Dropdown Selector */}
          <div style={{ position: 'relative' }}>
            <select
              className="form-input"
              style={{
                padding: '8px 14px',
                fontSize: '0.88rem',
                backgroundColor: selectedDomainId ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.05)',
                borderColor: selectedDomainId ? 'var(--accent-purple)' : 'var(--border-color)',
                color: '#fff',
                cursor: 'pointer',
                borderRadius: 'var(--radius-md)',
              }}
              value={selectedDomainId}
              onChange={(e) => {
                setSelectedDomainId(e.target.value);
                if (e.target.value) setScope('');
              }}
            >
              <option value="" style={{ backgroundColor: '#0d0f17', color: '#fff' }}>
                Filter by Domain...
              </option>
              {data.domains?.map((d) => (
                <option key={d.id} value={d.id} style={{ backgroundColor: '#0d0f17', color: '#fff' }}>
                  {d.icon || '💡'} {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Box */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', minWidth: '260px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search founder..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '34px', fontSize: '0.88rem' }}
            />
            <Search
              size={16}
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}
            />
          </div>
          <button type="submit" className="btn btn-secondary" style={{ padding: '8px 14px' }}>
            Search
          </button>
        </form>
      </div>

      {/* Logged In User Standing Card (Sticky Showcase) */}
      {userStanding && (
        <div
          className="glass-card"
          style={{
            padding: '18px 24px',
            marginBottom: '28px',
            border: '1.5px solid var(--accent-cyan)',
            background: 'linear-gradient(90deg, rgba(6,182,212,0.12) 0%, rgba(99,102,241,0.08) 100%)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                fontWeight: '800',
                color: '#fff',
                border: '2px solid rgba(255,255,255,0.2)',
              }}
            >
              #{userStanding.rank}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: '800', color: '#fff', fontSize: '1.1rem' }}>{userStanding.full_name}</span>
                <span className="badge badge-cyan" style={{ fontSize: '0.72rem' }}>You</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>@{userStanding.username}</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                {userStanding.domain} • {userStanding.badges_count || 0} Badges Earned
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--accent-amber)' }}>
                {userStanding.total_points || 0} PTS
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Your Balance</div>
            </div>

            <button
              className="btn btn-secondary"
              style={{ padding: '8px 14px', fontSize: '0.82rem' }}
              onClick={() => navigate('/profile')}
            >
              View Profile <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', minHeight: '35vh', alignItems: 'center' }}>
          <div className="spinner" />
        </div>
      ) : leaderboardList.length === 0 ? (
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Trophy size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <h3>No founders found</h3>
          <p style={{ fontSize: '0.9rem', marginTop: '6px' }}>Try switching filters or clearing your search query.</p>
        </div>
      ) : (
        <>
          {/* TOP 3 PODIUM SECTION */}
          {top3.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '20px',
                marginBottom: '28px',
              }}
            >
              {top3.map((f, idx) => {
                const rank = idx + 1;
                const isFirst = rank === 1;
                const isSecond = rank === 2;
                const isThird = rank === 3;

                const borderColor = isFirst
                  ? 'rgba(245,158,11,0.6)'
                  : isSecond
                  ? 'rgba(148,163,184,0.4)'
                  : 'rgba(217,119,6,0.4)';

                const glowColor = isFirst
                  ? 'rgba(245,158,11,0.12)'
                  : isSecond
                  ? 'rgba(148,163,184,0.08)'
                  : 'rgba(217,119,6,0.08)';

                const badgeBg = isFirst
                  ? 'linear-gradient(135deg, #f59e0b, #b45309)'
                  : isSecond
                  ? 'linear-gradient(135deg, #94a3b8, #475569)'
                  : 'linear-gradient(135deg, #d97706, #78350f)';

                const medalIcon = isFirst ? '🥇' : isSecond ? '🥈' : '🥉';

                return (
                  <div
                    key={f.id}
                    className="glass-card"
                    style={{
                      padding: '24px',
                      border: `1.5px solid ${borderColor}`,
                      background: `linear-gradient(180deg, ${glowColor} 0%, rgba(255,255,255,0.01) 100%)`,
                      textAlign: 'center',
                      position: 'relative',
                      transform: isFirst ? 'scale(1.02)' : 'none',
                      transition: 'transform 0.2s',
                      cursor: 'pointer',
                    }}
                    onClick={() => navigate(`/profile/${f.id}`)}
                  >
                    {/* Rank Ribbon Badge */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '-12px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: badgeBg,
                        color: '#fff',
                        padding: '4px 14px',
                        borderRadius: '9999px',
                        fontSize: '0.8rem',
                        fontWeight: '800',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      }}
                    >
                      <span>{medalIcon}</span>
                      <span>Rank #{rank}</span>
                    </div>

                    {/* Avatar */}
                    <div style={{ marginTop: '10px', marginBottom: '14px', position: 'relative', display: 'inline-block' }}>
                      {f.avatar_url ? (
                        <img
                          src={f.avatar_url}
                          alt={f.full_name}
                          style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${borderColor}` }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '72px',
                            height: '72px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.03))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.6rem',
                            fontWeight: '800',
                            color: '#fff',
                            border: `2px solid ${borderColor}`,
                            margin: '0 auto',
                          }}
                        >
                          {f.full_name.charAt(0)}
                        </div>
                      )}
                    </div>

                    <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#fff', marginBottom: '2px' }}>
                      {f.full_name}
                    </h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                      @{f.username}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
                      <span className="badge badge-purple" style={{ fontSize: '0.72rem' }}>
                        {f.domain_icon} {f.domain}
                      </span>
                      <span className="badge badge-cyan" style={{ fontSize: '0.72rem' }}>
                        {f.stage} • {f.level}
                      </span>
                    </div>

                    <div
                      style={{
                        padding: '10px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'rgba(245,158,11,0.08)',
                        border: '1px solid rgba(245,158,11,0.2)',
                        display: 'flex',
                        justifyContent: 'space-around',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--accent-amber)' }}>
                          {f.total_points}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>LABX Points</div>
                      </div>

                      <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255,255,255,0.1)' }} />

                      <div>
                        <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--accent-cyan)' }}>
                          {f.badges_count}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Badges</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* COMPLETE RANKINGS LIST */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#fff', marginBottom: '16px' }}>
              Full Standings
            </h3>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-dim)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    <th style={{ padding: '12px 14px', width: '60px' }}>Rank</th>
                    <th style={{ padding: '12px 14px' }}>Founder</th>
                    <th style={{ padding: '12px 14px' }}>Domain</th>
                    <th style={{ padding: '12px 14px' }}>Roadmap Stage</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Badges</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>LABX Points</th>
                    <th style={{ padding: '12px 14px', width: '50px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboardList.map((f) => {
                    const isUser = f.is_current_user;
                    return (
                      <tr
                        key={f.id}
                        style={{
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          backgroundColor: isUser ? 'rgba(6,182,212,0.06)' : 'transparent',
                          transition: 'background-color 0.15s',
                          cursor: 'pointer',
                        }}
                        onClick={() => navigate(`/profile/${f.id}`)}
                      >
                        {/* Rank */}
                        <td style={{ padding: '14px', fontWeight: '800', fontSize: '1rem', color: f.rank <= 3 ? 'var(--accent-amber)' : 'var(--text-muted)' }}>
                          {f.rank === 1 ? '🥇 1' : f.rank === 2 ? '🥈 2' : f.rank === 3 ? '🥉 3' : `#${f.rank}`}
                        </td>

                        {/* Founder info */}
                        <td style={{ padding: '14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {f.avatar_url ? (
                              <img
                                src={f.avatar_url}
                                alt={f.full_name}
                                style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: '38px',
                                  height: '38px',
                                  borderRadius: '50%',
                                  background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.03))',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: '800',
                                  color: '#fff',
                                }}
                              >
                                {f.full_name.charAt(0)}
                              </div>
                            )}

                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontWeight: '700', color: '#fff', fontSize: '0.95rem' }}>{f.full_name}</span>
                                {isUser && <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>You</span>}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>@{f.username}</div>
                            </div>
                          </div>
                        </td>

                        {/* Domain */}
                        <td style={{ padding: '14px' }}>
                          <span className="badge badge-purple" style={{ fontSize: '0.78rem' }}>
                            {f.domain_icon} {f.domain}
                          </span>
                        </td>

                        {/* Stage & Level */}
                        <td style={{ padding: '14px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          <span style={{ color: '#fff', fontWeight: '600' }}>{f.stage}</span> • {f.level}
                        </td>

                        {/* Badges count */}
                        <td style={{ padding: '14px', textAlign: 'center' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--accent-amber)', fontWeight: '700', fontSize: '0.9rem' }}>
                            <Award size={14} /> {f.badges_count}
                          </span>
                        </td>

                        {/* Points */}
                        <td style={{ padding: '14px', textAlign: 'right', fontWeight: '800', color: 'var(--accent-amber)', fontSize: '1.05rem' }}>
                          {f.total_points} PTS
                        </td>

                        {/* Arrow */}
                        <td style={{ padding: '14px', textAlign: 'right', color: 'var(--text-dim)' }}>
                          <ChevronRight size={16} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
