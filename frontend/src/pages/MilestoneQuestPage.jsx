import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Navbar } from '../components/common/Navbar';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Coins,
  FileText,
  Link as LinkIcon,
  Sparkles,
  XCircle,
  Upload,
  AlertCircle,
} from 'lucide-react';

export const MilestoneQuestPage = () => {
  const { milestoneId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedQuest, setSelectedQuest] = useState(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  useEffect(() => {
    fetchQuests();
  }, [milestoneId]);

  const fetchQuests = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getMilestoneQuests(milestoneId);
      setData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load quests for this milestone');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenQuestModal = (quest) => {
    setSelectedQuest(quest);
    setSubmissionText(quest.submission?.submission_text || '');
    setSubmissionUrl(quest.submission?.submission_url || '');
    setSubmitError('');
    setSubmitSuccess('');
  };

  const handleSubmitWork = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');

    try {
      const res = await api.submitQuest(selectedQuest.id, {
        submission_text: submissionText,
        submission_url: submissionUrl,
      });

      setSubmitSuccess(res.message || 'Quest submitted successfully!');
      setTimeout(() => {
        setSelectedQuest(null);
        fetchQuests();
      }, 1500);
    } catch (err) {
      setSubmitError(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
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
        <p>{error}</p>
        <button className="btn btn-secondary" style={{ marginTop: '16px' }} onClick={() => navigate('/roadmap')}>
          Back to Roadmap
        </button>
      </div>
    );
  }

  const { milestone, core_quests, side_quests } = data || {};

  return (
    <div>
      <button
        onClick={() => navigate('/roadmap')}
        className="btn btn-secondary"
        style={{ marginBottom: '20px', padding: '8px 16px' }}
      >
        <ArrowLeft size={16} /> Back to Roadmap
      </button>

      <Navbar title={milestone?.name || 'Milestone Quests'} />

      {/* Milestone Scope Banner */}
      <div
        className="glass-card"
        style={{
          padding: '24px',
          marginBottom: '28px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(6,182,212,0.1) 100%)',
        }}
      >
        <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
          <span className="badge badge-primary">{milestone?.stages?.name}</span>
          <span className="badge badge-amber">{milestone?.levels?.name}</span>
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fff', marginBottom: '6px' }}>
          {milestone?.name}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{milestone?.description}</p>
      </div>

      {/* CORE QUESTS SECTION */}
      <div style={{ marginBottom: '36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fff' }}>MANDATORY CORE QUESTS</h3>
          <span className="badge badge-primary">Required for Progression</span>
        </div>

        {core_quests?.length === 0 ? (
          <div className="glass-card" style={{ padding: '24px', color: 'var(--text-muted)', textAlign: 'center' }}>
            No core quests available for this milestone yet.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {core_quests?.map((quest) => (
              <QuestCard key={quest.id} quest={quest} onClick={() => handleOpenQuestModal(quest)} />
            ))}
          </div>
        )}
      </div>

      {/* SIDE QUESTS SECTION */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fff' }}>OPTIONAL SIDE QUESTS</h3>
          <span className="badge badge-cyan">Bonus Points</span>
        </div>

        {side_quests?.length === 0 ? (
          <div className="glass-card" style={{ padding: '24px', color: 'var(--text-muted)', textAlign: 'center' }}>
            No side quests available for this milestone.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {side_quests?.map((quest) => (
              <QuestCard key={quest.id} quest={quest} onClick={() => handleOpenQuestModal(quest)} />
            ))}
          </div>
        )}
      </div>

      {/* QUEST DETAIL & SUBMISSION MODAL */}
      {selectedQuest && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '32px',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setSelectedQuest(null)}
              style={{ position: 'absolute', top: '20px', right: '20px', color: 'var(--text-muted)', fontSize: '1.2rem' }}
            >
              ✕
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span className={`badge ${selectedQuest.quest_type === 'core' ? 'badge-primary' : 'badge-cyan'}`}>
                {selectedQuest.quest_type.toUpperCase()} QUEST
              </span>
              <span className="badge badge-amber">+{selectedQuest.points} LABX Points</span>
              <StatusBadge status={selectedQuest.user_status} />
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#fff', marginBottom: '12px' }}>
              {selectedQuest.title}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Objective
                </h4>
                <p style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>{selectedQuest.objective || selectedQuest.description}</p>
              </div>

              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Instructions
                </h4>
                <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', whiteSpace: 'pre-line' }}>{selectedQuest.instructions || 'Follow objective guidelines.'}</p>
              </div>

              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Expected Output
                </h4>
                <p style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>{selectedQuest.expected_output}</p>
              </div>
            </div>

            {/* Admin Feedback Display if rejected */}
            {selectedQuest.submission?.admin_feedback && (
              <div style={{ padding: '14px', backgroundColor: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', marginBottom: '20px' }}>
                <div style={{ fontWeight: '700', color: 'var(--accent-red)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={16} /> Admin Rejection Feedback
                </div>
                <div style={{ fontSize: '0.9rem', color: '#fff' }}>{selectedQuest.submission.admin_feedback}</div>
              </div>
            )}

            {/* Submission Form */}
            {['approved', 'completed'].includes(selectedQuest.user_status) ? (
              <div style={{ padding: '16px', backgroundColor: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', textAlign: 'center', color: 'var(--accent-green)', fontWeight: '600' }}>
                ✅ Quest Completed & Verified! Points Awarded.
              </div>
            ) : selectedQuest.user_status === 'under_review' ? (
              <div style={{ padding: '16px', backgroundColor: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '8px', textAlign: 'center', color: 'var(--accent-amber)', fontWeight: '600' }}>
                ⏳ Work Submitted — Under Admin Review.
              </div>
            ) : (
              <form onSubmit={handleSubmitWork} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '14px', color: '#fff' }}>
                  Submit Your Deliverables
                </h3>

                {submitError && (
                  <div style={{ padding: '10px', backgroundColor: 'rgba(239,68,68,0.15)', color: 'var(--accent-red)', borderRadius: '6px', marginBottom: '12px', fontSize: '0.85rem' }}>
                    {submitError}
                  </div>
                )}

                {submitSuccess && (
                  <div style={{ padding: '10px', backgroundColor: 'rgba(16,185,129,0.15)', color: 'var(--accent-green)', borderRadius: '6px', marginBottom: '12px', fontSize: '0.85rem' }}>
                    {submitSuccess}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Submission Text / Notes</label>
                  <textarea
                    className="form-textarea"
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    placeholder="Describe your work, methodologies, or findings..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Deliverable URL (Notion, Figma, GitHub, Docs)</label>
                  <input
                    type="url"
                    className="form-input"
                    value={submissionUrl}
                    onChange={(e) => setSubmissionUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px', marginTop: '12px' }}
                  disabled={submitting}
                >
                  {submitting ? 'Submitting Work...' : selectedQuest.user_status === 'rejected' ? 'Resubmit Fixed Work' : 'Submit Quest Work'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const QuestCard = ({ quest, onClick }) => (
  <div
    className="glass-card"
    onClick={onClick}
    style={{
      padding: '20px',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}
  >
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span className={`badge ${quest.quest_type === 'core' ? 'badge-primary' : 'badge-cyan'}`}>
          {quest.quest_type.toUpperCase()}
        </span>
        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--accent-amber)' }}>
          +{quest.points} Points
        </span>
      </div>

      <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', marginBottom: '6px' }}>{quest.title}</h4>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {quest.objective || quest.description}
      </p>
    </div>

    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
      <StatusBadge status={quest.user_status} />
      <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '600' }}>View Quest →</span>
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  if (['approved', 'completed'].includes(status)) {
    return <span className="badge badge-green"><CheckCircle2 size={12} /> Approved</span>;
  }
  if (status === 'under_review') {
    return <span className="badge badge-amber"><Clock size={12} /> Under Review</span>;
  }
  if (status === 'rejected') {
    return <span className="badge badge-red"><XCircle size={12} /> Rejected</span>;
  }
  return <span className="badge badge-cyan"><Sparkles size={12} /> Available</span>;
};
