import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getUserRole } from '../utils/auth';

export default function ProtectedRoute({ children, allowedRoles }) {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const role = await getUserRole(user.uid);
        setHasAccess(allowedRoles.includes(role));
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, allowedRoles]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return hasAccess ? children : <Navigate to="/login" replace />;
}