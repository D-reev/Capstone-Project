import React, { useState, useEffect } from 'react';
import './Modal.css';
import { registerWithUsername } from '../../utils/auth';

export default function RegisterModal({ open, onClose, onSuccess }) {
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isValid, setIsValid] = useState(false);

  const validateName = (v) => {
    if (!v || !v.trim()) return 'Required';
    if (!/^[A-Za-z\s'-]{2,}$/.test(v.trim())) return 'Invalid name';
    return '';
  };

  const validateUsername = (v) => {
    if (!v || !v.trim()) return 'Required';
    const s = v.trim();
    if (s.length < 4) return 'Must be at least 4 characters';
    if (!/^[a-z0-9._-]+$/.test(s)) return 'Use lowercase letters, numbers, . _ or -';
    return '';
  };

  const validatePassword = (v) => {
    if (!v) return 'Required';
    if (v.length < 8) return 'Must be at least 8 characters';
    return '';
  };

  const runAllValidations = () => {
    const errs = {
      firstName: firstName.trim() ? validateName(firstName) : 'Required',
      lastName: lastName.trim() ? validateName(lastName) : 'Required',
      username: username.trim() ? validateUsername(username) : 'Required',
      password: password ? validatePassword(password) : 'Required'
    };
    setFieldErrors(errs);
    
    // Simplified validation - just check if required fields are filled
    const valid = firstName.trim() && 
                 lastName.trim() && 
                 username.trim() && 
                 password.length >= 8;
    
    setIsValid(valid);
    return valid;
  };

  useEffect(() => {
    if (open) {
      runAllValidations();
    }
  }, [firstName, lastName, username, password, open]);

  const handleRegister = async (e) => {
    e?.preventDefault();
    setError('');
    
    if (!runAllValidations()) {
      setError('Please fix the errors highlighted below');
      return;
    }

    setIsLoading(true);
    try {
      const user = await registerWithUsername({
        firstName: firstName.trim(),
        middleName: middleName.trim(),
        lastName: lastName.trim(),
        username: username.trim(),
        password,
        role: 'user'
      });

      if (typeof onSuccess === 'function') onSuccess(user);
      onClose();
    } catch (err) {
      setError(err?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create account</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <form className="modal-body" onSubmit={handleRegister}>
          {error && <div className="error-message">{error}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">First name *</label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="input-field"
                disabled={isLoading}
              />
              {fieldErrors.firstName && <div className="field-error">{fieldErrors.firstName}</div>}
            </div>
            
            <div className="form-group">
              <label className="form-label">Last name *</label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="input-field"
                disabled={isLoading}
              />
              {fieldErrors.lastName && <div className="field-error">{fieldErrors.lastName}</div>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Middle name (optional)</label>
            <input
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
              className="input-field"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Username *</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="input-field"
              disabled={isLoading}
            />
            {fieldErrors.username && <div className="field-error">{fieldErrors.username}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Password *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-field"
              disabled={isLoading}
              minLength={8}
            />
            {fieldErrors.password && <div className="field-error">{fieldErrors.password}</div>}
            <small className="helper-text">Must be at least 8 characters</small>
          </div>

          <div className="modal-actions">
            <button 
              type="submit" 
              className="submit-btn" 
              disabled={isLoading || !isValid}
            >
              {isLoading ? 'Registering…' : 'Register'}
            </button>
            <button 
              type="button" 
              className="cancel-btn" 
              onClick={onClose} 
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}