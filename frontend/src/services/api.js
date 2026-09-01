const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('labx_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success === false) {
    throw new ApiError(
      data.message || 'An error occurred during request',
      response.status,
      data
    );
  }

  return data;
}

export const api = {
  // Auth
  register: (body) => request('/auth/register', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  getMe: () => request('/auth/me'),
  forgotPassword: (body) => request('/auth/forgot-password', { method: 'POST', body }),

  // Assessment
  getAssessmentStatus: () => request('/assessment/status'),
  submitAssessment: (body) => request('/assessment/submit', { method: 'POST', body }),

  // Profile
  getProfile: () => request('/profile'),
  getUserProfile: (id) => request(`/profile/${id}`),
  getUserPosts: (id) => request(`/profile/${id}/posts`),
  getUserFollowers: (id) => request(`/profile/${id}/followers`),
  getUserFollowing: (id) => request(`/profile/${id}/following`),
  updateProfile: (body) => request('/profile', { method: 'PUT', body }),


  // Roadmap
  getRoadmap: () => request('/roadmap'),

  // Quests
  getMilestoneQuests: (milestoneId) => request(`/quests/milestone/${milestoneId}`),
  getQuestDetail: (questId) => request(`/quests/${questId}`),

  // Submissions
  submitQuest: (questId, body) => request(`/submissions/quest/${questId}`, { method: 'POST', body }),
  getMySubmissions: () => request('/submissions'),

  // Progress & Points
  getProgress: () => request('/progress'),
  getPoints: (params) => request(`/points?${new URLSearchParams(params || {}).toString()}`),

  // Guild
  getMyGuild: () => request('/guilds/me'),
  getGuildMembers: (params) => request(`/guilds/members?${new URLSearchParams(params || {}).toString()}`),
  getGuildMessages: (params) => request(`/guilds/messages?${new URLSearchParams(params || {}).toString()}`),
  sendGuildMessage: (body) => request('/guilds/messages', { method: 'POST', body }),

  // Social
  getFeed: (params) => request(`/social/feed?${new URLSearchParams(params || {}).toString()}`),
  getExplore: (params) => request(`/social/explore?${new URLSearchParams(params || {}).toString()}`),
  getPeople: (params) => request(`/social/people?${new URLSearchParams(params || {}).toString()}`),
  createPost: (body) => request('/social/posts', { method: 'POST', body }),
  toggleLike: (postId) => request(`/social/posts/${postId}/like`, { method: 'POST' }),
  getComments: (postId) => request(`/social/posts/${postId}/comments`),
  addComment: (postId, body) => request(`/social/posts/${postId}/comments`, { method: 'POST', body }),
  followUser: (userId) => request(`/social/follow/${userId}`, { method: 'POST' }),
  unfollowUser: (userId) => request(`/social/follow/${userId}`, { method: 'DELETE' }),


  // Events & Announcements
  getAnnouncements: (params) => request(`/events?${new URLSearchParams(params || {}).toString()}`),
  getAnnouncementDetail: (id) => request(`/events/${id}`),

  // Notifications & Achievements & Leaderboard
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'PUT' }),
  getAchievements: () => request('/achievements'),
  getLeaderboard: (params) => request(`/leaderboard?${new URLSearchParams(params || {}).toString()}`),

  // Admin
  getAdminRoadmapTree: () => request('/admin/roadmap-tree'),
  getAdminAnalytics: () => request('/admin/analytics'),
  getVerificationQueue: (params) => request(`/admin/verification?${new URLSearchParams(params || {}).toString()}`),
  reviewSubmission: (subId, body) => request(`/admin/verification/${subId}/review`, { method: 'POST', body }),
  getAdminQuests: (params) => request(`/admin/quests?${new URLSearchParams(params || {}).toString()}`),
  createQuest: (body) => request('/admin/quests', { method: 'POST', body }),
  updateQuest: (id, body) => request(`/admin/quests/${id}`, { method: 'PUT', body }),
  deleteQuest: (id) => request(`/admin/quests/${id}`, { method: 'DELETE' }),
  getAdminFounders: (params) => request(`/admin/founders?${new URLSearchParams(params || {}).toString()}`),
  resetFounderAssessment: (userId) => request(`/admin/founders/${userId}/reset-assessment`, { method: 'POST' }),
  getAdminAnnouncements: () => request('/admin/announcements'),
  createAnnouncement: (body) => request('/admin/announcements', { method: 'POST', body }),
  deleteAnnouncement: (id) => request(`/admin/announcements/${id}`, { method: 'DELETE' }),
};
