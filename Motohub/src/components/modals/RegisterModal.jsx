import React, { useState } from 'react';
import './Modal.css';
import { registerWithUsername } from '../../utils/auth';

export default function RegisterModal({ open, onClose, onSuccess }) {
  if (!open) return null;

  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [fieldErrors, setFieldErrors] = useState({});

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
    if (!/[0-9]/.test(v)) return 'Include at least one number';
    if (!/[A-Z]/.test(v)) return 'Include at least one uppercase letter';
    return '';
  };

  const runAllValidations = () => {
    const errs = {
      firstName: validateName(firstName),
      lastName: validateName(lastName),
      username: validateUsername(username),
      password: validatePassword(password)
    };
    setFieldErrors(errs);
    // return true if no errors
    return !Object.values(errs).some(Boolean);
  };

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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create account</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <form className="modal-body" onSubmit={handleRegister}>
          {error && <div className="error-message">{error}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              onBlur={() => setFieldErrors(prev => ({ ...prev, firstName: validateName(firstName) }))}
              placeholder="First name"
              required
              className="input-field"
              disabled={isLoading}
            />
            {fieldErrors.firstName && <div className="field-error">{fieldErrors.firstName}</div>}
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              onBlur={() => setFieldErrors(prev => ({ ...prev, lastName: validateName(lastName) }))}
              placeholder="Last name"
              required
              className="input-field"
              disabled={isLoading}
            />
            {fieldErrors.lastName && <div className="field-error">{fieldErrors.lastName}</div>}
          </div>

          <input
            value={middleName}
            onChange={(e) => setMiddleName(e.target.value)}
            placeholder="Middle name (optional)"
            className="input-field"
            disabled={isLoading}
          />

          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onBlur={() => setFieldErrors(prev => ({ ...prev, username: validateUsername(username) }))}
            placeholder="Username"
            required
            className="input-field"
            disabled={isLoading}
          />
          {fieldErrors.username && <div className="field-error">{fieldErrors.username}</div>}

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setFieldErrors(prev => ({ ...prev, password: validatePassword(password) }))}
            placeholder="Password"
            required
            className="input-field"
            disabled={isLoading}
          />
          {fieldErrors.password && <div className="field-error">{fieldErrors.password}</div>}

          <div className="modal-actions">
            <button type="submit" className="submit-btn" disabled={isLoading || !runAllValidations()}>
              {isLoading ? 'Registering…' : 'Register'}
            </button>
            <button type="button" className="cancel-btn" onClick={onClose} disabled={isLoading}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}