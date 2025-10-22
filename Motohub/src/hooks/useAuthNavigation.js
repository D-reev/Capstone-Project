import { useNavigate } from 'react-router-dom';
import { signOut } from '../utils/auth';

export const useAuthNavigation = () => {
  const navigate = useNavigate();

  const logout = async () => {
    try {
      await signOut();
      navigate('/login', { replace: true });
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  return { logout };
};