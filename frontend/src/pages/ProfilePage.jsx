import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Navbar } from '../components/common/Navbar';
import { User, Compass, Shield, Award, Users, Edit, Save, UserPlus, UserCheck, Heart, MessageCircle, Send, X, FileText } from 'lucide-react';

export const ProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const targetUserId = userId || user?.id;
  const isSelf = !userId || userId === user?.id;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userPosts, setUserPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);

  // Edit State
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [followLoading, setFollowLoading] = useState(false);

  // Modals & Lists
  const [activeModal, setActiveModal] = useState(null); // 'followers' | 'following' | null
  const [modalUsers, setModalUsers] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [actionLoadingMap, setActionLoadingMap] = useState({});

  // Comments Modal
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    fetchProfileData();
  }, [userId, user?.id]);

  const fetchProfileData = async () => {
    setLoading(true);
    setPostsLoading(true);
    try {
      // Fetch profile
      const res = isSelf ? await api.getProfile() : await api.getUserProfile(targetUserId);
      const p = res.data;
      setProfile(p);
      setFullName(p.full_name || '');
      setBio(p.bio || '');
      setAvatarUrl(p.avatar_url || '');

      // Fetch user's posts
      const postsRes = await api.getUserPosts(targetUserId);
      setUserPosts(postsRes.data || []);
    } catch (err) {
      console.error('Error fetching profile data:', err);
    } finally {
      setLoading(false);
      setPostsLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!profile || isSelf || followLoading) return;
    setFollowLoading(true);
    try {
      if (profile.is_following) {
        await api.unfollowUser(targetUserId);
      } else {
        await api.followUser(targetUserId);
      }
      // Refresh profile state
      const res = await api.getUserProfile(targetUserId);
      setProfile(res.data);
    } catch (err) {
      alert(err.message || 'Follow action failed');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.updateProfile({
        full_name: fullName,
        bio: bio,
        avatar_url: avatarUrl,
      });
      setMessage('Profile updated successfully');
      setEditing(false);
      await refreshUser();
      fetchProfileData();
    } catch (err) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const openFollowersModal = async () => {
    setActiveModal('followers');
    setModalLoading(true);
    try {
      const res = await api.getUserFollowers(targetUserId);
      setModalUsers(res.data || []);
    } catch (err) {
      console.error('Error fetching followers:', err);
    } finally {
      setModalLoading(false);
    }
  };

  const openFollowingModal = async () => {
    setActiveModal('following');
    setModalLoading(true);
    try {
      const res = await api.getUserFollowing(targetUserId);
      setModalUsers(res.data || []);
    } catch (err) {
      console.error('Error fetching following users:', err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleModalUserFollowToggle = async (modalUserTargetId, currentlyFollowing) => {
    if (actionLoadingMap[modalUserTargetId]) return;

    setActionLoadingMap((prev) => ({ ...prev, [modalUserTargetId]: true }));
    try {
      if (currentlyFollowing) {
        await api.unfollowUser(modalUserTargetId);
      } else {
        await api.followUser(modalUserTargetId);
      }

      setModalUsers((prev) =>
        prev.map((u) => (u.id === modalUserTargetId ? { ...u, is_following: !currentlyFollowing } : u))
      );
      // Refresh stats
      const res = isSelf ? await api.getProfile() : await api.getUserProfile(targetUserId);
      setProfile(res.data);
    } catch (err) {
      alert(err.message || 'Follow action failed');
    } finally {
      setActionLoadingMap((prev) => ({ ...prev, [modalUserTargetId]: false }));
    }
  };

  const handleLikeToggle = async (postId) => {
    try {
      const res = await api.toggleLike(postId);
      setUserPosts((prev) =>
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
      setUserPosts((prev) =>
        prev.map((p) => (p.id === activeCommentPost.id ? { ...p, comments_count: p.comments_count + 1 } : p))
      );
    } catch (err) {
      alert(err.message || 'Failed to post comment');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      <Navbar title={isSelf ? 'My Founder Profile' : `${profile?.full_name}'s Profile`} />

      {message && (
        <div style={{ padding: '12px', backgroundColor: 'rgba(16,185,129,0.15)', color: 'var(--accent-green)', borderRadius: '8px', marginBottom: '20px' }}>
          {message}
        </div>
      )}

      {/* Main Profile Header Banner Card */}
      <div className="glass-card" style={{ padding: '32px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div
              style={{
                width: '84px',
                height: '84px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                fontSize: '2.2rem',
                flexShrink: 0,
              }}
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                profile?.full_name?.charAt(0) || 'F'
              )}
            </div>

            <div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#fff', marginBottom: '4px' }}>{profile?.full_name}</h2>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>@{profile?.username || 'founder'}</div>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-main)', maxWidth: '600px', lineHeight: '1.5' }}>
                {profile?.bio || 'No founder bio provided yet.'}
              </p>
            </div>
          </div>

          <div>
            {!isSelf ? (
              <button
                className={`btn ${profile?.is_following ? 'btn-secondary' : 'btn-primary'}`}
                onClick={handleFollowToggle}
                disabled={followLoading}
                style={{ padding: '10px 20px', fontSize: '0.95rem' }}
              >
                {profile?.is_following ? <UserCheck size={18} /> : <UserPlus size={18} />}
                <span>{followLoading ? (profile?.is_following ? 'Unfollowing...' : 'Following...') : profile?.is_following ? 'Following' : 'Follow'}</span>
              </button>
            ) : (
              <button className="btn btn-secondary" onClick={() => setEditing(!editing)}>
                <Edit size={16} /> {editing ? 'Cancel Edit' : 'Edit Profile'}
              </button>
            )}
          </div>
        </div>

        {/* Stats Row Tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginTop: '28px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
          <div className="glass-card" style={{ padding: '16px', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.02)' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--accent-cyan)' }}>{profile?.stats?.posts || 0}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', marginTop: '4px' }}>Posts</div>
          </div>

          <div
            className="glass-card"
            style={{ padding: '16px', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'transform 0.2s' }}
            onClick={openFollowersModal}
          >
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--accent-purple)' }}>{profile?.stats?.followers || 0}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', marginTop: '4px' }}>Followers</div>
          </div>

          <div
            className="glass-card"
            style={{ padding: '16px', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'transform 0.2s' }}
            onClick={openFollowingModal}
          >
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--accent-amber)' }}>{profile?.stats?.following || 0}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', marginTop: '4px' }}>Following</div>
          </div>
        </div>
      </div>

      {/* Edit Form (if editing self) */}
      {isSelf && editing && (
        <div className="glass-card" style={{ padding: '28px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fff', marginBottom: '20px' }}>Edit Profile Information</h3>
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Founder Bio</label>
              <textarea
                className="form-textarea"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell fellow founders about your background, skills, and vision..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Avatar Image URL</label>
              <input
                type="url"
                className="form-input"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }} disabled={saving}>
              <Save size={16} /> {saving ? 'Saving Profile...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>
      )}

      {/* Two Column Section: System Attributes & User Posts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Left Column: System Attributes & Earned Badges */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Progression Tile */}
          <div className="glass-card" style={{ padding: '28px', height: 'fit-content' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#fff', marginBottom: '20px' }}>Founder Progression</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <SystemAttrTile icon={<Compass color="var(--accent-cyan)" />} label="Domain" value={profile?.domains?.name || 'Unassigned'} />
              <SystemAttrTile icon={<Shield color="var(--accent-purple)" />} label="Stage" value={profile?.progress?.stages?.name || 'Discover'} />
              <SystemAttrTile icon={<Award color="var(--accent-amber)" />} label="Level" value={profile?.progress?.levels?.name || 'Level 1'} />
              <SystemAttrTile icon={<Users color="var(--accent-green)" />} label="Guild" value={profile?.guilds?.name || 'Guild'} />
              <SystemAttrTile icon={<Award color="var(--accent-amber)" />} label="LABX Points" value={`${profile?.total_points || 0} Points`} />
            </div>
          </div>

          {/* Earned Badges Showcase */}
          <div className="glass-card" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award color="var(--accent-amber)" size={20} /> Earned Badges ({profile?.badges?.length || 0})
              </h3>
              {isSelf && (
                <button
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                  onClick={() => navigate('/achievements')}
                >
                  View All
                </button>
              )}
            </div>

            {profile?.badges && profile.badges.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
                {profile.badges.map((badge) => (
                  <div
                    key={badge.id}
                    style={{
                      padding: '12px 10px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'rgba(245,158,11,0.08)',
                      border: '1px solid rgba(245,158,11,0.25)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '1.8rem', marginBottom: '4px' }}>{badge.icon || '🏆'}</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {badge.name}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: '1.2' }}>
                      {badge.description}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No badges earned yet. Complete your first quest to unlock your first badge!
              </div>
            )}
          </div>
        </div>

        {/* User Authored Posts Stream */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <FileText size={20} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fff' }}>
              {isSelf ? 'My Published Posts' : `Posts by ${profile?.full_name}`}
            </h3>
          </div>

          {postsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <div className="spinner" />
            </div>
          ) : userPosts.length === 0 ? (
            <div className="glass-card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No posts published by this founder yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {userPosts.map((post) => (
                <div key={post.id} className="glass-card" style={{ padding: '20px' }}>
                  <p style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '14px', lineHeight: '1.5' }}>
                    {post.content}
                  </p>

                  {post.image_url && (
                    <img
                      src={post.image_url}
                      alt="Post content"
                      style={{ width: '100%', borderRadius: 'var(--radius-md)', marginBottom: '14px', maxHeight: '360px', objectFit: 'cover' }}
                    />
                  )}

                  <div style={{ display: 'flex', gap: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
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
                      <Heart size={16} fill={post.is_liked ? 'var(--accent-red)' : 'none'} />
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
                      <MessageCircle size={16} />
                      <span>{post.comments_count || 0} Comments</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FOLLOWERS / FOLLOWING LIST MODAL */}
      {activeModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '520px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', padding: '24px', position: 'relative' }}>
            <button onClick={() => setActiveModal(null)} style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>
              <X size={18} />
            </button>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '20px', color: '#fff', textTransform: 'capitalize' }}>
              {activeModal === 'followers' ? 'Followers' : 'Following'}
            </h3>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {modalLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '30px' }}>
                  <div className="spinner" />
                </div>
              ) : modalUsers.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '30px' }}>
                  No {activeModal} found.
                </div>
              ) : (
                modalUsers.map((mUser) => {
                  const isModalUserSelf = mUser.id === user?.id;
                  const isActionLoading = actionLoadingMap[mUser.id];

                  return (
                    <div
                      key={mUser.id}
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.03)',
                        padding: '14px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                        onClick={() => {
                          setActiveModal(null);
                          navigate(`/profile/${mUser.id}`);
                        }}
                      >
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--primary-light)',
                            color: 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '700',
                            flexShrink: 0,
                          }}
                        >
                          {mUser.avatar_url ? (
                            <img src={mUser.avatar_url} alt={mUser.full_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            mUser.full_name?.charAt(0) || 'F'
                          )}
                        </div>

                        <div>
                          <div style={{ fontWeight: '700', color: '#fff', fontSize: '0.95rem' }}>{mUser.full_name}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>@{mUser.username || 'founder'}</div>
                        </div>
                      </div>

                      {!isModalUserSelf && (
                        <button
                          className={`btn ${mUser.is_following ? 'btn-secondary' : 'btn-primary'}`}
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          onClick={() => handleModalUserFollowToggle(mUser.id, mUser.is_following)}
                          disabled={isActionLoading}
                        >
                          {mUser.is_following ? <UserCheck size={14} /> : <UserPlus size={14} />}
                          <span>{isActionLoading ? '...' : mUser.is_following ? 'Following' : 'Follow'}</span>
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* COMMENTS MODAL */}
      {activeCommentPost && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '560px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', padding: '24px', position: 'relative' }}>
            <button onClick={() => setActiveCommentPost(null)} style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>
              <X size={18} />
            </button>
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

const SystemAttrTile = ({ icon, label, value }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {icon}
      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{label}</span>
    </div>
    <span style={{ fontSize: '0.95rem', fontWeight: '700', color: '#fff' }}>{value}</span>
  </div>
);
