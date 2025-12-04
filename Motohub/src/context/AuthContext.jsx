import { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { signOut, getUserProfile } from '../utils/auth';
import '../components/Loading.css';
import Loading from '../components/Loading';
import './Context.css';

// Create the context
const AuthContext = createContext(null);

// Export the hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export the provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          let userProfile = await getUserProfile(firebaseUser.uid);
          
          // Retry fetching profile if displayName is missing (race condition during registration)
          if (!userProfile?.displayName && firebaseUser.metadata.creationTime === firebaseUser.metadata.lastSignInTime) {
            console.log('Retrying profile fetch for new user...');
            await new Promise(resolve => setTimeout(resolve, 500));
            userProfile = await getUserProfile(firebaseUser.uid);
          }
          
          // Prioritize Firestore photoURL, then Firebase Auth photoURL, trim and validate
          const finalPhotoURL = (userProfile?.photoURL?.trim?.() || firebaseUser.photoURL?.trim?.() || '').trim();
          
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            photoURL: finalPhotoURL,
            displayName: userProfile?.displayName || firebaseUser.displayName || '',
            role: userProfile?.role || 'user',
            profileCompleted: userProfile?.profileCompleted !== false, // Default to true for existing users
            isNewUser: userProfile?.isNewUser || false,
            ...userProfile
          });
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Auth state change error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  const clearError = () => setError(null);

  const value = {
    user,
    loading,
    error,
    clearError,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isMechanic: user?.role === 'mechanic'
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
