import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getUserRole } from '../utils/auth';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const auth = getAuth();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (allowedRoles.length === 0) {
          setHasAccess(true);
        } else {
          const role = await getUserRole(user.uid);
          setUserRole(role);
          setHasAccess(allowedRoles.includes(role));
        }
      } else {
        setHasAccess(false);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, allowedRoles]);

  if (loading || authLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Handle role-based redirections
  if (!hasAccess && userRole) {
    switch (userRole) {
      case 'admin':
        return <Navigate to="/admindashboard" replace />;
      case 'mechanic':
        return <Navigate to="/mechanicdashboard" replace />;
      default:
        return <Navigate to="/userdashboard" replace />;
    }
  }

  return children;
}