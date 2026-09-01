import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Navbar } from '../components/common/Navbar';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Lock, PlayCircle, ChevronDown, ChevronRight, Compass } from 'lucide-react';

export const RoadmapPage = () => {
  const [roadmapData, setRoadmapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedStages, setExpandedStages] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchRoadmap();
  }, []);

  const fetchRoadmap = async () => {
    setLoading(true);
    try {
      const res = await api.getRoadmap();
      setRoadmapData(res.data);

      // Auto-expand unlocked stages
      const initialExpand = {};
      (res.data.stages || []).forEach((stg) => {
        if (stg.is_unlocked || stg.is_completed) {
          initialExpand[stg.id] = true;
        }
      });
      setExpandedStages(initialExpand);
    } catch (err) {
      setError(err.message || 'Failed to load roadmap');
    } finally {
      setLoading(false);
    }
  };

  const toggleStageExpand = (stageId) => {
    setExpandedStages((prev) => ({ ...prev, [stageId]: !prev[stageId] }));
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

  const { domain, stages } = roadmapData || {};

  return (
    <div>
      <Navbar title="Founder Progression Roadmap" />

      {/* Domain Header */}
      <div
        className="glass-card"
        style={{
          padding: '24px',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          background: 'linear-gradient(135deg, rgba(6,182,212,0.1) 0%, rgba(99,102,241,0.1) 100%)',
        }}
      >
        <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
          <Compass size={28} />
        </div>
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Domain Roadmap
          </span>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fff' }}>{domain?.name}</h2>
        </div>
      </div>

      {/* Stages Tree */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {(stages || []).map((stage) => {
          const isExpanded = expandedStages[stage.id];

          return (
            <div key={stage.id} className="glass-card" style={{ overflow: 'hidden' }}>
              {/* Stage Header Accordion */}
              <div
                onClick={() => toggleStageExpand(stage.id)}
                style={{
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  backgroundColor: stage.is_unlocked ? 'rgba(99,102,241,0.06)' : 'transparent',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <StatusBadge isCompleted={stage.is_completed} isUnlocked={stage.is_unlocked} />
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: stage.is_unlocked ? '#fff' : 'var(--text-muted)' }}>
                      {stage.name.toUpperCase()} STAGE
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>{stage.description}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {!stage.is_unlocked && <span className="badge badge-amber"><Lock size={12} /> Locked</span>}
                  {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
              </div>

              {/* Levels & Milestones (Collapsible) */}
              {isExpanded && (
                <div style={{ padding: '0 24px 24px 24px', borderTop: '1px solid var(--border-color)' }}>
                  {(stage.levels || []).map((level) => (
                    <div key={level.id} style={{ marginTop: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        <StatusBadge isCompleted={level.is_completed} isUnlocked={level.is_unlocked} small />
                        <h4 style={{ fontSize: '1rem', fontWeight: '700', color: level.is_unlocked ? '#fff' : 'var(--text-muted)' }}>
                          {level.name}
                        </h4>
                      </div>

                      {/* Milestones Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginLeft: '24px' }}>
                        {(level.milestones || []).map((milestone) => {
                          const isAccessible = milestone.is_unlocked || milestone.is_completed;

                          return (
                            <div
                              key={milestone.id}
                              onClick={() => {
                                if (isAccessible) {
                                  navigate(`/roadmap/milestones/${milestone.id}`);
                                }
                              }}
                              style={{
                                padding: '16px',
                                borderRadius: 'var(--radius-md)',
                                backgroundColor: milestone.is_unlocked
                                  ? 'rgba(6, 182, 212, 0.08)'
                                  : milestone.is_completed
                                  ? 'rgba(16, 185, 129, 0.08)'
                                  : 'rgba(255, 255, 255, 0.02)',
                                border: milestone.is_unlocked
                                  ? '1.5px solid var(--accent-cyan)'
                                  : milestone.is_completed
                                  ? '1px solid var(--accent-green)'
                                  : '1px solid var(--border-color)',
                                cursor: isAccessible ? 'pointer' : 'not-allowed',
                                opacity: isAccessible ? 1 : 0.6,
                                transition: 'all 0.2s ease',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-dim)' }}>
                                  M{milestone.milestone_order}
                                </span>
                                <MilestoneStatusIcon isCompleted={milestone.is_completed} isUnlocked={milestone.is_unlocked} />
                              </div>

                              <div style={{ fontSize: '0.95rem', fontWeight: '700', color: isAccessible ? '#fff' : 'var(--text-muted)', marginBottom: '4px' }}>
                                {milestone.name}
                              </div>

                              {isAccessible && (
                                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
                                  <span>{milestone.is_completed ? 'Completed' : 'Open Quests'}</span>
                                  <ChevronRight size={14} />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const StatusBadge = ({ isCompleted, isUnlocked, small }) => {
  const size = small ? 18 : 24;

  if (isCompleted) {
    return <CheckCircle2 size={size} color="var(--accent-green)" />;
  }
  if (isUnlocked) {
    return <PlayCircle size={size} color="var(--accent-cyan)" />;
  }
  return <Lock size={size} color="var(--text-dim)" />;
};

const MilestoneStatusIcon = ({ isCompleted, isUnlocked }) => {
  if (isCompleted) return <span style={{ color: 'var(--accent-green)' }}>✅</span>;
  if (isUnlocked) return <span style={{ color: 'var(--accent-cyan)' }}>🔵</span>;
  return <span style={{ color: 'var(--text-dim)' }}>🔒</span>;
};
