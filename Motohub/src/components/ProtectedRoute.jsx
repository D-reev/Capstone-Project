import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from './Loading';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading text="Checking authentication" />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role access
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to their appropriate dashboard based on their actual role
    switch (user.role) {
      case 'admin':
        return <Navigate to="/admindashboard" replace />;
      case 'mechanic':
        return <Navigate to="/mechanicdashboard" replace />;
      case 'user':
        return <Navigate to="/userdashboard" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return children;
}