import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Navbar } from '../components/common/Navbar';
import { Users, Send, MessageSquare, Shield, Award } from 'lucide-react';

export const GuildPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'members'
  const [guildInfo, setGuildInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const chatBottomRef = useRef(null);

  useEffect(() => {
    fetchGuildData();
  }, []);

  useEffect(() => {
    if (!guildInfo?.guild?.id) return;

    // Supabase Realtime Subscription for Guild Chat
    const channel = supabase
      .channel(`guild_${guildInfo.guild.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'guild_messages',
          filter: `guild_id=eq.${guildInfo.guild.id}`,
        },
        (payload) => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [guildInfo]);

  useEffect(() => {
    if (activeTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  const fetchGuildData = async () => {
    setLoading(true);
    try {
      const gRes = await api.getMyGuild();
      setGuildInfo(gRes.data);

      await fetchMessages();
      await fetchMembers();
    } catch (err) {
      setError(err.message || 'Failed to load guild');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const mRes = await api.getGuildMessages({ limit: 50 });
      setMessages(mRes.data || []);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const fetchMembers = async () => {
    try {
      const memRes = await api.getGuildMembers();
      setMembers(memRes.data || []);
    } catch (err) {
      console.error('Error loading members:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await api.sendGuildMessage({ content: newMessage });
      setNewMessage('');
      await fetchMessages();
    } catch (err) {
      alert(err.message || 'Failed to send message');
    } finally {
      setSending(false);
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

  const { guild, member_count } = guildInfo || {};

  return (
    <div>
      <Navbar title={guild?.name || 'Domain Guild'} />

      {/* Guild Banner */}
      <div
        className="glass-card"
        style={{
          padding: '24px',
          marginBottom: '24px',
          background: 'linear-gradient(135deg, rgba(6,182,212,0.15) 0%, rgba(168,85,247,0.1) 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <span className="badge badge-cyan" style={{ marginBottom: '8px' }}>
            <Shield size={12} /> {guild?.domains?.name} Domain Guild
          </span>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#fff', marginBottom: '4px' }}>
            {guild?.name}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{guild?.description}</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(255,255,255,0.05)', padding: '10px 18px', borderRadius: 'var(--radius-md)' }}>
          <Users size={20} color="var(--accent-cyan)" />
          <span style={{ fontSize: '1rem', fontWeight: '700', color: '#fff' }}>{member_count} Founders</span>
        </div>
      </div>

      {/* Tab Controls */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <button
          className={`btn ${activeTab === 'chat' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('chat')}
        >
          <MessageSquare size={18} /> Guild Chat
        </button>
        <button
          className={`btn ${activeTab === 'members' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('members')}
        >
          <Users size={18} /> Member Directory ({member_count})
        </button>
      </div>

      {/* CHAT TAB */}
      {activeTab === 'chat' && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '550px' }}>
          {/* Chat Message Scroll Box */}
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.length === 0 ? (
              <div style={{ margin: 'auto', color: 'var(--text-muted)' }}>
                No messages yet. Be the first founder to say hello!
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.user_id === user?.id;
                const authorName = msg.profiles?.full_name || 'Founder';

                return (
                  <div
                    key={msg.id}
                    style={{
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      maxWidth: '70%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isMe ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                      {authorName} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>

                    <div
                      style={{
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: isMe ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                        color: '#fff',
                        fontSize: '0.95rem',
                        lineHeight: '1.4',
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={handleSendMessage}
            style={{
              padding: '16px',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              gap: '12px',
            }}
          >
            <input
              type="text"
              className="form-input"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message to your domain guild..."
              style={{ borderRadius: 'var(--radius-full)' }}
            />
            <button type="submit" className="btn btn-primary" style={{ borderRadius: 'var(--radius-full)', padding: '12px 20px' }} disabled={sending}>
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      {/* MEMBERS TAB */}
      {activeTab === 'members' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          {members.map((m) => {
            const p = m.profiles || {};
            return (
              <div key={m.joined_at + p.id} className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary-light)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                  }}
                >
                  {p.full_name?.charAt(0) || 'F'}
                </div>
                <div>
                  <div style={{ fontWeight: '700', color: '#fff', fontSize: '1rem' }}>{p.full_name || 'Founder'}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Award size={12} color="var(--accent-amber)" /> {p.total_points || 0} LABX Points
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
