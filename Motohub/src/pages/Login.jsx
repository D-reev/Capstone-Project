import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../config/firebase.js";
import { createUserProfile, getUserRole } from '../utils/auth';
import { message } from 'antd';
import '../css/Login.css';
import { FcGoogle } from 'react-icons/fc';
import RegisterModal from '../components/modals/RegisterModal';
import LoginModal from '../components/modals/LoginModal';
import SuccessModal from '../components/modals/SuccessModal';
import ForgotPasswordModal from '../components/modals/ForgotPasswordModal';
import Threads from '../components/Threads';
import headerBg from '../assets/images/header.jpg';

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
 
  const googleProvider = new GoogleAuthProvider();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const identifier = (email || "").trim();
      const loginEmail = identifier.includes('@') ? identifier : `${identifier}@motohub.local`;

      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, password);
      const role = await getUserRole(userCredential.user.uid);
     
      messageApi.success('Login successful!');
      
      if (role === 'admin') {
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
      await createUserProfile(result.user);
      const role = await getUserRole(result.user.uid);
     
      messageApi.success('Login successful!');
      
      if (role === 'admin') {
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
      <div className="login-container">
        {/* Animated Background */}
        <Threads 
          color={[1.0, 0.764, 0.0]} // Yellow color (#FFC300 in RGB normalized)
          amplitude={1.5}
          distance={0.4}
          enableMouseInteraction={true}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 0,
            opacity: 0.4
          }}
        />
        
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

        <div className="footer-attribution">
          designed by D-reev
        </div>

        <RegisterModal
          open={registerOpen}
          onClose={() => setRegisterOpen(false)}
          onSuccess={(createdUser) => {
            setRegisterOpen(false);
            setSuccessMessage('Registration successful! You can now login with your username and password. If you provided a Gmail address, you can use "Forgot Password" for account recovery.');
            setSuccessOpen(true);
          }}
          onSwitchToLogin={() => {
            setRegisterOpen(false);
            setLoginOpen(true);
          }}
        />

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
    </>
  );
}

export default Login;