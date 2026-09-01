import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Navbar } from '../components/common/Navbar';
import { Heart, MessageCircle, Plus, UserPlus, UserCheck, Send, Search, AlertCircle, RefreshCw, Compass, Shield } from 'lucide-react';

export const SocialPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'explore' | 'people'
  
  // Feed & Explore State
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [posting, setPosting] = useState(false);
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');

  // People Tab State
  const [people, setPeople] = useState([]);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [peopleError, setPeopleError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingMap, setActionLoadingMap] = useState({});

  useEffect(() => {
    if (activeTab === 'people') {
      fetchPeople();
    } else {
      fetchPosts();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'people') {
      const timer = setTimeout(() => {
        fetchPeople();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = activeTab === 'feed' ? await api.getFeed() : await api.getExplore();
      setPosts(res.data || []);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPeople = async () => {
    setPeopleLoading(true);
    setPeopleError(null);
    try {
      const res = await api.getPeople({ search: searchQuery });
      setPeople(res.data || []);
    } catch (err) {
      console.error('Error fetching people:', err);
      setPeopleError(err.message || 'Unable to load founders');
    } finally {
      setPeopleLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newContent.trim() || posting) return;

    setPosting(true);
    try {
      await api.createPost({ content: newContent, image_url: newImageUrl });
      setNewContent('');
      setNewImageUrl('');
      setShowCreateModal(false);
      fetchPosts();
    } catch (err) {
      alert(err.message || 'Failed to create post');
    } finally {
      setPosting(false);
    }
  };

  const handleLikeToggle = async (postId) => {
    try {
      const res = await api.toggleLike(postId);
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              is_liked: res.data.is_liked,
              likes_count: res.data.likes_count,
            };
          }
          return p;
        })
      );
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const handleOpenComments = async (post) => {
    setActiveCommentPost(post);
    try {
      const res = await api.getComments(post.id);
      setComments(res.data || []);
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !activeCommentPost) return;

    try {
      const res = await api.addComment(activeCommentPost.id, { content: commentText });
      setComments((prev) => [...prev, res.data]);
      setCommentText('');
      setPosts((prev) =>
        prev.map((p) => (p.id === activeCommentPost.id ? { ...p, comments_count: p.comments_count + 1 } : p))
      );
    } catch (err) {
      alert(err.message || 'Failed to post comment');
    }
  };

  const handlePostFollowToggle = async (authorId, currentlyFollowing) => {
    try {
      if (currentlyFollowing) {
        await api.unfollowUser(authorId);
      } else {
        await api.followUser(authorId);
      }
      fetchPosts();
    } catch (err) {
      alert(err.message || 'Follow action failed');
    }
  };

  const handlePersonFollowToggle = async (targetId, currentlyFollowing) => {
    if (actionLoadingMap[targetId]) return;

    setActionLoadingMap((prev) => ({ ...prev, [targetId]: true }));
    try {
      if (currentlyFollowing) {
        await api.unfollowUser(targetId);
      } else {
        await api.followUser(targetId);
      }

      setPeople((prev) =>
        prev.map((p) => (p.id === targetId ? { ...p, is_following: !currentlyFollowing } : p))
      );
    } catch (err) {
      alert(err.message || 'Follow action failed');
    } finally {
      setActionLoadingMap((prev) => ({ ...prev, [targetId]: false }));
    }
  };

  return (
    <div>
      <Navbar title="Founder Social Network" />

      {/* Header Actions & Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className={`btn ${activeTab === 'feed' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('feed')}
          >
            Feed
          </button>
          <button
            className={`btn ${activeTab === 'explore' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('explore')}
          >
            Explore
          </button>
          <button
            className={`btn ${activeTab === 'people' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('people')}
          >
            People
          </button>
        </div>

        {activeTab !== 'people' && (
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={18} /> Create Post
          </button>
        )}
      </div>

      {/* PEOPLE TAB VIEW */}
      {activeTab === 'people' && (
        <div>
          {/* Search Box */}
          <div style={{ marginBottom: '24px', maxWidth: '520px' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={18} style={{ position: 'absolute', left: '14px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Search founders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '42px' }}
              />
            </div>
          </div>

          {/* People Grid / States */}
          {peopleLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '35vh', gap: '12px' }}>
              <div className="spinner" />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading founders...</span>
            </div>
          ) : peopleError ? (
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--accent-red)' }}>
              <AlertCircle size={32} style={{ marginBottom: '12px', margin: '0 auto' }} />
              <div style={{ fontWeight: '700', marginBottom: '12px', color: '#fff' }}>Unable to load founders.</div>
              <button className="btn btn-secondary" onClick={fetchPeople} style={{ margin: '0 auto' }}>
                <RefreshCw size={16} /> Retry
              </button>
            </div>
          ) : people.length === 0 ? (
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              {searchQuery ? `No founders found for "${searchQuery}".` : 'No founders found.'}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {people.map((person) => {
                const isActionLoading = actionLoadingMap[person.id];

                return (
                  <div key={person.id} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      {/* Avatar & Identifiers (Clickable Profile Link) */}
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px', cursor: 'pointer' }}
                        onClick={() => navigate(`/profile/${person.id}`)}
                      >
                        <div
                          style={{
                            width: '52px',
                            height: '52px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--primary-light)',
                            color: 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '800',
                            fontSize: '1.2rem',
                            flexShrink: 0,
                          }}
                        >
                          {person.avatar_url ? (
                            <img src={person.avatar_url} alt={person.full_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            person.full_name?.charAt(0) || 'F'
                          )}
                        </div>

                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontWeight: '700', color: '#fff', fontSize: '1.05rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {person.full_name || 'Founder'}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            @{person.username || 'founder'}
                          </div>
                        </div>
                      </div>

                      {/* Domain & Stage/Level Attributes */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', backgroundColor: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--accent-cyan)' }}>
                          <Compass size={14} />
                          <span style={{ fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {person.domains?.name || 'Tech Domain'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--accent-purple)' }}>
                          <Shield size={14} />
                          <span style={{ fontWeight: '600' }}>
                            {person.stage_name} • {person.level_name}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Follow Action Button */}
                    <button
                      className={`btn ${person.is_following ? 'btn-secondary' : 'btn-primary'}`}
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={() => handlePersonFollowToggle(person.id, person.is_following)}
                      disabled={isActionLoading}
                    >
                      {person.is_following ? <UserCheck size={16} /> : <UserPlus size={16} />}
                      <span>
                        {isActionLoading
                          ? person.is_following
                            ? 'Unfollowing...'
                            : 'Following...'
                          : person.is_following
                          ? 'Following'
                          : 'Follow'}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* FEED & EXPLORE TAB VIEWS */}
      {activeTab !== 'people' && (
        <div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', minHeight: '40vh' }}>
              <div className="spinner" />
            </div>
          ) : posts.length === 0 ? (
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              {activeTab === 'feed' ? 'Your feed is empty. Explore network or check People tab to follow founders!' : 'No posts in network yet.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '680px', margin: '0 auto' }}>
              {posts.map((post) => {
                const author = post.profiles || {};
                const isSelf = author.id === user?.id;

                return (
                  <div key={post.id} className="glass-card" style={{ padding: '24px' }}>
                    {/* Author Info Header (Clickable Profile Link) */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                        onClick={() => navigate(`/profile/${author.id}`)}
                      >
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--primary-light)',
                            color: 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '700',
                          }}
                        >
                          {author.avatar_url ? (
                            <img src={author.avatar_url} alt={author.full_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            author.full_name?.charAt(0) || 'F'
                          )}
                        </div>

                        <div>
                          <div style={{ fontWeight: '700', color: '#fff', fontSize: '1rem' }}>{author.full_name || 'Founder'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
                            {author.domains?.name || 'Founder Domain'}
                          </div>
                        </div>
                      </div>

                      {!isSelf && activeTab === 'explore' && (
                        <button
                          className={`btn ${post.is_following ? 'btn-secondary' : 'btn-primary'}`}
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          onClick={() => handlePostFollowToggle(author.id, post.is_following)}
                        >
                          {post.is_following ? <UserCheck size={14} /> : <UserPlus size={14} />}
                          {post.is_following ? 'Following' : 'Follow'}
                        </button>
                      )}
                    </div>

                    {/* Post Content */}
                    <p style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '16px', lineHeight: '1.5' }}>
                      {post.content}
                    </p>

                    {post.image_url && (
                      <img
                        src={post.image_url}
                        alt="Post media"
                        style={{ width: '100%', borderRadius: 'var(--radius-md)', marginBottom: '16px', maxHeight: '400px', objectFit: 'cover' }}
                      />
                    )}

                    {/* Actions Footer */}
                    <div style={{ display: 'flex', gap: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                      <button
                        onClick={() => handleLikeToggle(post.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: post.is_liked ? 'var(--accent-red)' : 'var(--text-muted)',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <Heart size={18} fill={post.is_liked ? 'var(--accent-red)' : 'none'} />
                        <span>{post.likes_count || 0} Likes</span>
                      </button>

                      <button
                        onClick={() => handleOpenComments(post)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: 'var(--text-muted)',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <MessageCircle size={18} />
                        <span>{post.comments_count || 0} Comments</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CREATE POST MODAL */}
      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '520px', padding: '28px', position: 'relative' }}>
            <button onClick={() => setShowCreateModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '20px', color: '#fff' }}>Share with Founder Network</h3>

            <form onSubmit={handleCreatePost}>
              <div className="form-group">
                <textarea
                  className="form-textarea"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Share a launch update, milestone achievement, or question for the network..."
                  style={{ minHeight: '120px' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Image URL (Optional)</label>
                <input
                  type="url"
                  className="form-input"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={posting}>
                {posting ? 'Publishing Post...' : 'Publish Post'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* COMMENTS MODAL */}
      {activeCommentPost && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '560px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', padding: '24px', position: 'relative' }}>
            <button onClick={() => setActiveCommentPost(null)} style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '16px', color: '#fff' }}>Comments</h3>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
              {comments.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No comments yet.</div>
              ) : (
                comments.map((c) => (
                  <div key={c.id} style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--accent-cyan)', marginBottom: '4px' }}>
                      {c.profiles?.full_name || 'Founder'}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#fff' }}>{c.content}</div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                className="form-input"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
              />
              <button type="submit" className="btn btn-primary">
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
