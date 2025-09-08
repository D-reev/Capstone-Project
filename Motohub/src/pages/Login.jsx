import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../config/firebase.js"; // Add .js extension
import { createUserProfile, getUserRole } from '../utils/auth';
import './Login.css'

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  
  const googleProvider = new GoogleAuthProvider();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const role = await getUserRole(userCredential.user.uid);
      
      if (role === 'admin') {
        navigate('/admindashboard');
      } else {
        navigate('/userdashboard');
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await createUserProfile(result.user);
      const role = await getUserRole(result.user.uid);
      
      if (role === 'admin') {
        navigate('/admindashboard');
      } else {
        navigate('/userdashboard');
      }
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div   className="login-container">
      <div className="login-box">
        <div>
          <h2 className="login-title">WELCOME</h2>
        </div>

        {error && (
          <p className="error-message">{error}</p>
        )}

        <form onSubmit={handleEmailLogin} className="form-container">
          <div className="input-group">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-field"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-field"
            />
          </div>

          <button type="submit" className="login-button">
            LOGIN
          </button>

          <div>
            <p className="register-text">
              Don't have an account? <a href="#" className="register-link">Register</a>
            </p>
          </div>
        </form>

        <div className="social-login-container">
          <div>
            <span className="social-login-text">OR LOGIN WITH</span>
          </div>
          
          <div className="social-buttons">
            <button onClick={handleGoogleLogin} className="social-button">
              <img src="/google.svg" alt="Google" className="social-icon" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;