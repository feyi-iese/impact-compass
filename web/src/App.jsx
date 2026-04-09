import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LandingPage from './pages/LandingPage';
import OnboardingQuiz from './pages/OnboardingQuiz';
import ActionFeed from './pages/ActionFeed';
import OpportunityDetail from './pages/OpportunityDetail';
import AuthPage from './pages/AuthPage';
import MagicLinkConfirmPage from './pages/MagicLinkConfirmPage';
import VolunteerDashboard from './pages/VolunteerDashboard';
import CreateEvent from './pages/CreateEvent';
import ProfilePage from './pages/ProfilePage';
import OrganizerDashboard from './pages/OrganizerDashboard';
import OrganizerProfileEdit from './pages/OrganizerProfileEdit';
import DashboardRedirect from './pages/DashboardRedirect';
import ProtectedRoute from './components/ProtectedRoute';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/auth/confirm" element={<MagicLinkConfirmPage />} />
      <Route path="/waitlist" element={<LandingPage />} />
      <Route path="/onboarding" element={<OnboardingQuiz />} />
      <Route path="/feed" element={<ActionFeed />} />
      <Route path="/opportunity/:id" element={<OpportunityDetail />} />
      <Route
        path="/dashboard"
        element={(
          <ProtectedRoute>
            <DashboardRedirect />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/profile"
        element={(
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/profile/organizer/edit"
        element={(
          <ProtectedRoute requireOrganizer>
            <OrganizerProfileEdit />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/dashboard/volunteer"
        element={(
          <ProtectedRoute requireVolunteer>
            <VolunteerDashboard />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/dashboard/organizer"
        element={(
          <ProtectedRoute requireOrganizer allowPendingOrganizer>
            <OrganizerDashboard />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/dashboard/organizer/create"
        element={(
          <ProtectedRoute requireOrganizer allowPendingOrganizer>
            <CreateEvent />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/dashboard/organizer/edit/:eventId"
        element={(
          <ProtectedRoute requireOrganizer allowPendingOrganizer>
            <CreateEvent />
          </ProtectedRoute>
        )}
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
