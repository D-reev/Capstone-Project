import React, { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../config/firebase.js";
import { createUserProfile, getUserRole } from '../utils/auth';
import { message, Alert, App } from 'antd';
import '../css/Login.css';
import { FcGoogle } from 'react-icons/fc';
import RegisterModal from '../components/modals/RegisterModal';
import LoginModal from '../components/modals/LoginModal';
import SuccessModal from '../components/modals/SuccessModal';
import ForgotPasswordModal from '../components/modals/ForgotPasswordModal';
import { useAuth } from '../context/AuthContext';

const Threads = lazy(() => import('../components/Threads'));

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [registrationError, setRegistrationError] = useState(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const { user, loading } = useAuth();
 
  const googleProvider = new GoogleAuthProvider();

  // Redirect if user is already authenticated
  useEffect(() => {
    if (!loading && user) {
      console.log('User already authenticated, redirecting to dashboard...');
      
      // Redirect based on role
      if (user.role === 'admin' || user.role === 'superadmin') {
        navigate('/admindashboard', { replace: true });
      } else if (user.role === 'mechanic') {
        navigate('/mechanicdashboard', { replace: true });
      } else {
        navigate('/userdashboard', { replace: true });
      }
    }
  }, [user, loading, navigate]);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const identifier = (email || "").trim();
      const loginEmail = identifier.includes('@') ? identifier : `${identifier}@motohub.local`;

      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, password);
      const role = await getUserRole(userCredential.user.uid);
     
      messageApi.success('Login successful!');
      
      if (role === 'admin' || role === 'superadmin') {
        navigate('/admindashboard');
      } else if (role === 'mechanic'){
        navigate('/mechanicdashboard');
      } else{
        navigate('/userdashboard');
      }
    } catch (error) {
      messageApi.error({
        content: getErrorMessage(error.code),
        duration: 5,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      
      // Create user profile if it doesn't exist and check if profile is completed
      const { role, isNewUser, profileCompleted } = await createUserProfile(result.user);
      
      // If it's a new Google user or profile not completed, redirect to profile completion
      if (isNewUser || !profileCompleted) {
        messageApi.info('Please complete your profile to continue');
        navigate('/profile');
        return;
      }
     
      messageApi.success('Login successful!');
      
      // Navigate based on role
      if (role === 'admin' || role === 'superadmin') {
        navigate('/admindashboard');
      } else if (role === 'mechanic') {
        navigate('/mechanicdashboard');
      } else{
        navigate('/userdashboard');
      }
    } catch (error) {
      console.error('❌ Google sign-in error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Full error object:', JSON.stringify(error, null, 2));

      if (error.code === 'auth/popup-closed-by-user' || 
          error.code === 'auth/cancelled-popup-request') {
        setIsLoading(false);
        return;
      }
   
      let errorMessage = 'An error occurred. Please try again.';
      
      if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked. Please enable popups for this site and try again.';
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'An account already exists with the same email address but different sign-in method.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Google sign-in is not enabled. Please contact support.';
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMessage = 'This domain is not authorized for Google sign-in. Please contact support.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      messageApi.error({
        content: errorMessage,
        duration: 5,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/invalid-credential':
        return 'Invalid credentials. Please check your username/email and password.';
      default:
        return 'An error occurred. Please try again.';
    }
  };

  const handleRegisterClick = (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (e?.stopPropagation) e.stopPropagation();
    setRegisterOpen(true);
  };

  const handleForgotPasswordClick = (e) => {
    e.preventDefault();
    setForgotPasswordOpen(true);
  };

  return (
    <>
      {contextHolder}
      <App>
        <div className="login-container">
          {/* Animated Background - Lazy loaded */}
          <Suspense fallback={null}>
            <Threads 
              color={[1.0, 0.764, 0.0]} // Yellow color (#FFC300 in RGB normalized)
              amplitude={1.5}
              distance={0.4}
              enableMouseInteraction={false} // Disable mouse interaction for better performance
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 0,
                opacity: 0.3,
                willChange: 'transform' // GPU acceleration hint
              }}
            />
          </Suspense>
          
          <div className="hero-content">
            <div className="new-background-badge">
              <span>⚡Experience CJKB</span>
            </div>
            
            <h1 className="hero-title">Welcome to CJKB Motohub</h1>
          <p className="hero-tagline">
            Your one-stop automotive solution. We have all the parts you need in stock and ready to install, so you never have to go anywhere else.
          </p>
          
          <div className="hero-buttons">
            <button 
              type="button"
              onClick={() => setLoginOpen(true)}
              className="hero-button primary"
            >
              Login
            </button>
            <button 
              type="button"
              onClick={handleRegisterClick}
              className="hero-button secondary"
            >
              Register
            </button>
          </div>
          
          <div className="social-icon-container">
            <button 
              type="button"
              onClick={handleGoogleLogin} 
              className="google-icon-button"
              disabled={isLoading}
              title="Sign in with Google"
            >
              <FcGoogle className="google-icon-large" />
            </button>
          </div>
        </div>

        <RegisterModal
          open={registerOpen}
          onClose={() => setRegisterOpen(false)}
          onSuccess={(createdUser) => {
            // Registration successful - user will be auto-logged in by AuthContext
            setRegisterOpen(false);
            // No need to show success modal, user will be redirected to dashboard automatically
          }}
          onError={(err) => setRegistrationError(err)}
          onSwitchToLogin={() => {
            setRegisterOpen(false);
            setLoginOpen(true);
          }}
        />

        {registrationError && (
          <div style={{ width: '100%', maxWidth: 700, margin: '12px auto 0' }}>
            <Alert
              message={registrationError.code === 'auth/email-already-in-use' ? 'Username already taken' : 'Registration Error'}
              description={registrationError.message || 'An error occurred while creating your account.'}
              type="error"
              showIcon
              closable
              onClose={() => setRegistrationError(null)}
            />
          </div>
        )}

        <LoginModal
          open={loginOpen}
          onClose={() => setLoginOpen(false)}
          onSwitchToRegister={() => {
            setLoginOpen(false);
            setRegisterOpen(true);
          }}
        />

        <SuccessModal
          open={successOpen}
          onClose={() => setSuccessOpen(false)}
          title="Registration Successful"
          message={successMessage}
        />

        <ForgotPasswordModal
          open={forgotPasswordOpen}
          onClose={() => setForgotPasswordOpen(false)}
        />
        </div>
      </App>
    </>
  );
}

export default Login;