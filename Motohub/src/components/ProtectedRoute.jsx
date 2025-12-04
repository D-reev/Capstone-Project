import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from './Loading';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth();

  // Show loading while checking authentication
  if (loading) {
    return <Loading text="Checking authentication" />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    console.log('ProtectedRoute: No user found, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Check role access
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    console.log(`ProtectedRoute: User role "${user.role}" not in allowed roles:`, allowedRoles);
    switch (user.role) {
      case 'superadmin':
        return <Navigate to="/admindashboard" replace />;
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

  console.log(`ProtectedRoute: Access granted for user role "${user.role}"`);
  return children;
}