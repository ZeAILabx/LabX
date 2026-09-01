import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Sidebar } from './components/common/Sidebar';

// Auth Pages
import { Login } from './components/auth/Login';
import { Register } from './components/auth/Register';

// Assessment Flow
import { AssessmentWizard } from './components/assessment/AssessmentWizard';
import { AssessmentResult } from './components/assessment/AssessmentResult';

// Founder Pages
import { DashboardPage } from './pages/DashboardPage';
import { RoadmapPage } from './pages/RoadmapPage';
import { MilestoneQuestPage } from './pages/MilestoneQuestPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { GuildPage } from './pages/GuildPage';
import { SocialPage } from './pages/SocialPage';
import { EventsPage } from './pages/EventsPage';
import { AchievementsPage } from './pages/AchievementsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfilePage } from './pages/ProfilePage';

// Admin Pages
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminVerificationPage } from './pages/AdminVerificationPage';
import { AdminQuestsPage } from './pages/AdminQuestsPage';
import { AdminRoadmapPage } from './pages/AdminRoadmapPage';
import { AdminFoundersPage } from './pages/AdminFoundersPage';
import { AdminEventsPage } from './pages/AdminEventsPage';

// Protected Route Wrapper
const ProtectedRoute = ({ children, roleRequired }) => {
  const { user, loading, isAuthenticated, assessmentCompleted } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-dark)' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Founder assessment check
  if (user?.role === 'founder' && !assessmentCompleted && location.pathname !== '/assessment') {
    return <Navigate to="/assessment" replace />;
  }

  // Admin access check
  if (roleRequired && user?.role !== roleRequired) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  return children;
};

// Layout Shell with Sidebar
const AppShell = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return children;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
};

export function App() {
  const [assessmentResult, setAssessmentResult] = React.useState(null);

  return (
    <AuthProvider>
      <Router>
        <AppShell>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Founder Assessment */}
            <Route
              path="/assessment"
              element={
                <ProtectedRoute roleRequired="founder">
                  {assessmentResult ? (
                    <AssessmentResult result={assessmentResult} />
                  ) : (
                    <AssessmentWizard onComplete={(res) => setAssessmentResult(res)} />
                  ) }
                </ProtectedRoute>
              }
            />

            {/* Founder Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute roleRequired="founder">
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/roadmap"
              element={
                <ProtectedRoute roleRequired="founder">
                  <RoadmapPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leaderboard"
              element={
                <ProtectedRoute roleRequired="founder">
                  <LeaderboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/roadmap/milestones/:milestoneId"
              element={
                <ProtectedRoute roleRequired="founder">
                  <MilestoneQuestPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/guild"
              element={
                <ProtectedRoute roleRequired="founder">
                  <GuildPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/social"
              element={
                <ProtectedRoute roleRequired="founder">
                  <SocialPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/events"
              element={
                <ProtectedRoute roleRequired="founder">
                  <EventsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/achievements"
              element={
                <ProtectedRoute roleRequired="founder">
                  <AchievementsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute roleRequired="founder">
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute roleRequired="founder">
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/:userId"
              element={
                <ProtectedRoute roleRequired="founder">
                  <ProfilePage />
                </ProtectedRoute>
              }
            />


            {/* Admin Protected Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute roleRequired="admin">
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/verification"
              element={
                <ProtectedRoute roleRequired="admin">
                  <AdminVerificationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/quests"
              element={
                <ProtectedRoute roleRequired="admin">
                  <AdminQuestsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/roadmap"
              element={
                <ProtectedRoute roleRequired="admin">
                  <AdminRoadmapPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/founders"
              element={
                <ProtectedRoute roleRequired="admin">
                  <AdminFoundersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/events"
              element={
                <ProtectedRoute roleRequired="admin">
                  <AdminEventsPage />
                </ProtectedRoute>
              }
            />

            {/* Default Catch-all Redirect */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AppShell>
      </Router>
    </AuthProvider>
  );
}

export default App;
