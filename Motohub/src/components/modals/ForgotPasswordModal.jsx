import React, { useState, useEffect } from 'react';
import { initiatePasswordReset, verifyOTP, resetPassword } from '../../utils/auth';
import { X, Mail, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import './Modal.css';

function ForgotPasswordModal({ open, onClose }) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Reset everything when modal closes
  useEffect(() => {
    if (!open) {
      setEmail('');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setStep(1);
      setError('');
      setIsLoading(false);
    }
  }, [open]);

  const handleClose = () => {
    setEmail('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setStep(1);
    setError('');
    setIsLoading(false);
    onClose();
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await initiatePasswordReset(email);
      setStep(2);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerification = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await verifyOTP(otp);
      setStep(3);
    } catch (error) {
      setError('Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      await resetPassword(otp, newPassword);
      handleClose();
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Reset Password</h2>
          <button className="close-button" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <div className="add-part-form">
          {error && (
            <div className="error-message" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              padding: '1rem',
              marginBottom: '1rem',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              borderRadius: '0.5rem'
            }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleEmailSubmit}>
              <div className="form-group full-width">
                <label>Email Address</label>
                <p>Enter your email address to receive a password reset code</p>
                <div style={{ position: 'relative' }}>
                  <Mail 
                    size={18} 
                    style={{ 
                      position: 'absolute', 
                      left: '1rem', 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      color: '#a0aec0'
                    }} 
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    required
                    disabled={isLoading}
                    style={{ paddingLeft: '3rem' }}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ padding: '1.5rem 0 0 0', marginTop: '1.5rem' }}>
                <button type="button" className="cancel-btn" onClick={handleClose}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn" disabled={isLoading}>
                  {isLoading ? 'Sending...' : 'Send Reset Code'}
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleOTPVerification}>
              <div className="form-group full-width">
                <label>Verification Code</label>
                <p>Enter the 6-digit code sent to <strong>{email}</strong></p>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  padding: '0.75rem',
                  marginBottom: '1rem',
                  backgroundColor: '#fef3c7',
                  color: '#92400e',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem'
                }}>
                  <AlertCircle size={16} />
                  <span>Check your spam/junk folder if you don't see the email</span>
                </div>
                <div style={{ position: 'relative' }}>
                  <CheckCircle 
                    size={18} 
                    style={{ 
                      position: 'absolute', 
                      left: '1rem', 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      color: '#a0aec0'
                    }} 
                  />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit code"
                    required
                    maxLength={6}
                    disabled={isLoading}
                    style={{ 
                      paddingLeft: '3rem',
                      textAlign: 'center',
                      fontSize: '1.25rem',
                      letterSpacing: '0.5rem'
                    }}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ padding: '1.5rem 0 0 0', marginTop: '1.5rem' }}>
                <button type="button" className="cancel-btn" onClick={() => setStep(1)}>
                  Back
                </button>
                <button type="submit" className="submit-btn" disabled={isLoading}>
                  {isLoading ? 'Verifying...' : 'Verify Code'}
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handlePasswordReset}>
              <div className="form-group full-width">
                <label>New Password</label>
                <p>Enter your new password (minimum 6 characters)</p>
                <div style={{ position: 'relative' }}>
                  <Lock 
                    size={18} 
                    style={{ 
                      position: 'absolute', 
                      left: '1rem', 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      color: '#a0aec0'
                    }} 
                  />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    minLength={6}
                    disabled={isLoading}
                    style={{ paddingLeft: '3rem' }}
                  />
                </div>
              </div>

              <div className="form-group full-width">
                <label>Confirm New Password</label>
                <p>Re-enter your new password to confirm</p>
                <div style={{ position: 'relative' }}>
                  <Lock 
                    size={18} 
                    style={{ 
                      position: 'absolute', 
                      left: '1rem', 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      color: '#a0aec0'
                    }} 
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    minLength={6}
                    disabled={isLoading}
                    style={{ paddingLeft: '3rem' }}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ padding: '1.5rem 0 0 0', marginTop: '1.5rem' }}>
                <button type="button" className="cancel-btn" onClick={() => setStep(2)}>
                  Back
                </button>
                <button type="submit" className="submit-btn" disabled={isLoading}>
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordModal;