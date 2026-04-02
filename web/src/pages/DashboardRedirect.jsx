import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

const DashboardRedirect = () => {
  const { isOrganizer } = useAuth();
  return <Navigate to={isOrganizer ? '/dashboard/organizer' : '/dashboard/volunteer'} replace />;
};

export default DashboardRedirect;
