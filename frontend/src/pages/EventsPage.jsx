import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Navbar } from '../components/common/Navbar';
import { Calendar, MapPin, ExternalLink, Clock, User, Megaphone } from 'lucide-react';

export const EventsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'event' | 'announcement'
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, [filterType]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = filterType !== 'all' ? { type: filterType } : {};
      const res = await api.getAnnouncements(params);
      setAnnouncements(res.data || []);
    } catch (err) {
      console.error('Error loading events:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar title="Events & Announcements" />

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button
          className={`btn ${filterType === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilterType('all')}
        >
          All Updates
        </button>
        <button
          className={`btn ${filterType === 'event' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilterType('event')}
        >
          <Calendar size={16} /> Showcase Events
        </button>
        <button
          className={`btn ${filterType === 'announcement' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilterType('announcement')}
        >
          <Megaphone size={16} /> Announcements
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', minHeight: '40vh' }}>
          <div className="spinner" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No events or announcements posted yet.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {announcements.map((item) => (
            <div key={item.id} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span className={`badge ${item.type === 'event' ? 'badge-cyan' : 'badge-primary'}`}>
                    {item.type.toUpperCase()}
                  </span>
                  {item.event_date && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> {new Date(item.event_date).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>
                  {item.title}
                </h3>

                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {item.description}
                </p>

                {item.type === 'event' && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                    {item.speaker && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={14} color="var(--primary)" /> <strong>Speaker:</strong> {item.speaker}
                      </div>
                    )}
                    {item.location && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={14} color="var(--accent-cyan)" /> <strong>Location:</strong> {item.location}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1, fontSize: '0.85rem' }}
                  onClick={() => setSelectedItem(item)}
                >
                  View Details
                </button>
                {item.external_url && (
                  <a
                    href={item.external_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary"
                    style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                  >
                    Visit Link <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '600px', padding: '32px', position: 'relative' }}>
            <button onClick={() => setSelectedItem(null)} style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--text-muted)' }}>✕</button>

            <span className={`badge ${selectedItem.type === 'event' ? 'badge-cyan' : 'badge-primary'}`} style={{ marginBottom: '12px' }}>
              {selectedItem.type.toUpperCase()}
            </span>

            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#fff', marginBottom: '12px' }}>
              {selectedItem.title}
            </h2>

            <p style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '20px', whiteSpace: 'pre-line', lineHeight: '1.5' }}>
              {selectedItem.description}
            </p>

            {selectedItem.type === 'event' && (
              <div style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
                {selectedItem.speaker && <div><strong>Speaker:</strong> {selectedItem.speaker}</div>}
                {selectedItem.event_date && <div><strong>Date:</strong> {new Date(selectedItem.event_date).toLocaleString()}</div>}
                {selectedItem.location && <div><strong>Location:</strong> {selectedItem.location}</div>}
                {selectedItem.meeting_url && <div><strong>Meeting URL:</strong> <a href={selectedItem.meeting_url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-cyan)' }}>{selectedItem.meeting_url}</a></div>}
              </div>
            )}

            {selectedItem.external_url && (
              <a
                href={selectedItem.external_url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px' }}
              >
                Visit External Link <ExternalLink size={16} />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
