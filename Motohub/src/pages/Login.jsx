import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../config/firebase.js";
import { createUserProfile, getUserRole } from '../utils/auth';
import '../css/Login.css';
import GoogleIcon from '@mui/icons-material/Google';
import RegisterModal from '../components/modals/RegisterModal';
import SuccessModal from '../components/modals/SuccessModal';

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
 
  const googleProvider = new GoogleAuthProvider();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // support username or email input:
      // if input contains '@' treat as email, otherwise treat as username and use synthetic domain
      const identifier = (email || "").trim();
      const loginEmail = identifier.includes('@') ? identifier : `${identifier}@motohub.local`;

      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, password);
      const role = await getUserRole(userCredential.user.uid);
     
      if (role === 'admin') {
        navigate('/admindashboard');
      } else if (role === 'mechanic'){
        navigate('/mechanicdashboard');
      } else{
        navigate('/userdashboard');
      }
    } catch (error) {
      setError(getErrorMessage(error.code));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError("");

    try {
      const result = await signInWithPopup(auth, googleProvider);
      await createUserProfile(result.user);
      const role = await getUserRole(result.user.uid);
     
      if (role === 'admin') {
        navigate('/admindashboard');
      } else if (role === 'mechanic'){
        navigate('/mechanicdashboard');
      } else{
        navigate('/userdashboard');
      }
    } catch (error) {
      setError(getErrorMessage(error.code));
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
      default:
        return 'An error occurred. Please try again.';
    }
  };

  const handleRegisterClick = (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (e?.stopPropagation) e.stopPropagation();
    setRegisterOpen(true);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        {/* Header Section - matches the design */}
        <div className="header-section">
          <div className="header-decoration"></div> {/* CHANGE IMAGE: Add bird/decoration icon */}
          <h1 className="welcome-text">Welcome to Motohub</h1>
          <p className="tagline">
            Assuring that if your car needs to replace a part, you don’t have to go anywhere 
            else because we already have everything you need in stock and ready to install.
          </p>
        </div>

        {/* Form Title */}
        <h2 className="form-title">Customer Login</h2>

        {/* Error Message */}
        {error && (
          <div className="error-message">{error}</div>
        )}

        {/* Login Form */}
        <form onSubmit={handleEmailLogin} className="form-container">
          <div className="input-group">
            <input
              type="text"
              placeholder="Username or Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-field"
              disabled={isLoading}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-field"
              disabled={isLoading}
            />
          </div>

          {/* Remember Me and Forgot Password */}
          <div className="login-options">
            <a href="#" className="forgot-password">
              Forgot Password?
            </a>
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Register Section */}
        <div className="register-section">
          <p className="register-text">
            Don't have an account?{' '}
            <button 
              type="button"
              onClick={(e) => handleRegisterClick(e)}
              className="register-link"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Register
            </button>
          </p>
        </div>

        {/* Social Login Section */}
        <div className="social-login-container">
          <span className="social-login-text">Or login with</span>
          
          <div className="social-buttons">
            <button 
              type="button"
              onClick={handleGoogleLogin} 
              className="social-button"
              disabled={isLoading}
              title="Login with Google"
            >
              <img 
                src="/google-icon.svg" 
                alt="Google" 
                className="social-icon" 
              />
            </button>
          </div>
        </div>
      </div>

      <div className="footer-attribution">
        designed by D-reev
      </div>

      <RegisterModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onSuccess={(createdUser) => {
          setRegisterOpen(false);
          setSuccessMessage('Registration successful. Please complete your profile in the Profile section and connect a verified Gmail account to enable notifications and password recovery.');
          setSuccessOpen(true);
        }}
      />

      <SuccessModal
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
        title="Registration Successful"
        message={successMessage}
        // keep styling consistent by relying on modal's CSS (Modal.css)
      />
    </div>
  );
}

export default Login;