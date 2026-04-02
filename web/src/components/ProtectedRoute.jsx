import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import Layout from './Layout';

const hasPendingOrganizerIntent = () => {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem('pending_role') === 'organizer';
};

const ProtectedRoute = ({
  children,
  requireOrganizer = false,
  requireVolunteer = false,
  allowPendingOrganizer = false,
}) => {
  const location = useLocation();
  const { loading, isAuthenticated, isOrganizer, isVolunteer } = useAuth();

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: 'var(--space-16) 0' }}>
          <div
            className="detail-spinner"
            style={{ margin: '0 auto var(--space-4)', width: 24, height: 24 }}
          />
          <p className="text-muted text-sm">Loading your account...</p>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  if (requireOrganizer && !isOrganizer && !(allowPendingOrganizer && hasPendingOrganizerIntent())) {
    return <Navigate to="/dashboard/volunteer" replace />;
  }

  if (requireVolunteer && !isVolunteer) {
    return <Navigate to="/dashboard/organizer" replace />;
  }

  return children;
};

export default ProtectedRoute;
