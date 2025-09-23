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

  const handleRegister = async (e) => {
    e?.preventDefault();
    setError('');
    if (!firstName.trim() || !lastName.trim() || !username.trim() || !password) {
      setError('Please fill required fields');
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
              placeholder="First name"
              required
              className="input-field"
              disabled={isLoading}
            />
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name"
              required
              className="input-field"
              disabled={isLoading}
            />
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
            placeholder="Username"
            required
            className="input-field"
            disabled={isLoading}
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="input-field"
            disabled={isLoading}
          />

          <div className="modal-actions">
            <button type="submit" className="submit-btn" disabled={isLoading}>
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