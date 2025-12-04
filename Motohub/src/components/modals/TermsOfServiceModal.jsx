import React, { useState } from 'react';
import { Modal, Checkbox, Button } from 'antd';
import { Lock, ShieldCheck, FileText, AlertCircle } from 'lucide-react';
import './Modal.css';

export default function TermsOfServiceModal({ open, onAccept, onDecline, isLoading = false }) {
  const [agreed, setAgreed] = useState(false);

  const handleAccept = () => {
    if (agreed) {
      onAccept();
    }
  };

  const handleDecline = () => {
    setAgreed(false);
    onDecline();
  };

  return (
    <Modal
      open={open}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={20} />
          <span>Terms of Service & Privacy Policy</span>
        </div>
      }
      onCancel={handleDecline}
      footer={null}
      width={700}
      centered
      closable={!isLoading}
      maskClosable={false}
      styles={{
        body: { maxHeight: 'calc(80vh - 120px)', overflowY: 'auto' }
      }}
    >
      <style>{`
        .tos-modal-content {
          padding: 20px;
        }
        .tos-section {
          margin-bottom: 24px;
        }
        .tos-section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 12px;
        }
        .tos-section-content {
          font-size: 14px;
          color: #4B5563;
          line-height: 1.6;
        }
        .tos-list {
          list-style: disc;
          padding-left: 24px;
          margin: 12px 0;
        }
        .tos-list li {
          margin-bottom: 8px;
        }
        .tos-highlight {
          background-color: #FEF3C7;
          border-left: 4px solid #FFC300;
          padding: 16px;
          border-radius: 8px;
          margin: 16px 0;
        }
        .tos-checkbox-container {
          background-color: #F9FAFB;
          border: 2px solid #E5E7EB;
          border-radius: 8px;
          padding: 16px;
          margin: 24px 0;
        }
        .tos-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
        }
        .tos-decline-btn {
          height: 42px;
          border-radius: 8px;
          border-color: #DC2626 !important;
          color: #DC2626 !important;
          background: transparent !important;
        }
        .tos-decline-btn:hover:not(:disabled) {
          border-color: #EF4444 !important;
          color: #EF4444 !important;
          background: #FEE2E2 !important;
        }
        .tos-accept-btn {
          height: 42px;
          border-radius: 8px;
          background: linear-gradient(135deg, #FFC300, #FFD54F) !important;
          border-color: #FFC300 !important;
          color: #000 !important;
          font-weight: 600;
        }
        .tos-accept-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #FFD54F, #FFEB3B) !important;
          border-color: #FFD54F !important;
        }
        .tos-accept-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .ant-checkbox-wrapper:hover .ant-checkbox-inner,
        .ant-checkbox:hover .ant-checkbox-inner,
        .ant-checkbox-input:focus + .ant-checkbox-inner {
          border-color: #FFC300 !important;
        }
        .ant-checkbox-checked .ant-checkbox-inner {
          background-color: #FFC300 !important;
          border-color: #FFC300 !important;
        }
      `}</style>

      <div className="tos-modal-content">
        {/* Welcome Message */}
        <div className="tos-highlight">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <AlertCircle size={24} style={{ color: '#92400E', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: '#92400E', display: 'block', marginBottom: '8px' }}>
                Please Review Before Continuing
              </strong>
              <p style={{ color: '#78350F', margin: 0 }}>
                By creating an account with MotoHub, you agree to the following terms and conditions. 
                Please read carefully before accepting.
              </p>
            </div>
          </div>
        </div>

        {/* Data Privacy Section */}
        <div className="tos-section">
          <div className="tos-section-title">
            <Lock size={20} style={{ color: '#059669' }} />
            <span>Data Privacy & Security</span>
          </div>
          <div className="tos-section-content">
            <p>
              Your personal information and data are safely managed and protected by{' '}
              <strong style={{ color: '#111827' }}>CJKB</strong> in accordance with industry-standard 
              security practices and data protection regulations.
            </p>
            <p style={{ marginTop: '12px' }}>We are committed to:</p>
            <ul className="tos-list">
              <li>Protecting your personal information with enterprise-grade encryption</li>
              <li>Never sharing your data with third parties without your explicit consent</li>
              <li>Maintaining transparent data collection and usage practices</li>
              <li>Storing your data securely in compliance with privacy regulations</li>
              <li>Providing you with full control over your account and data</li>
            </ul>
          </div>
        </div>

        {/* Terms of Service Section */}
        <div className="tos-section">
          <div className="tos-section-title">
            <ShieldCheck size={20} style={{ color: '#2563EB' }} />
            <span>Terms of Service</span>
          </div>
          <div className="tos-section-content">
            <p>By registering with MotoHub, you agree to:</p>
            <ul className="tos-list">
              <li>Provide accurate and complete information during registration</li>
              <li>Maintain the security and confidentiality of your account credentials</li>
              <li>Use the service for lawful purposes only</li>
              <li>Not attempt to gain unauthorized access to any part of the system</li>
              <li>Accept responsibility for all activities that occur under your account</li>
              <li>Comply with all applicable local, state, and national laws</li>
            </ul>
          </div>
        </div>

        {/* Account Management */}
        <div className="tos-section">
          <div className="tos-section-title">
            <FileText size={20} style={{ color: '#7C3AED' }} />
            <span>Account Management</span>
          </div>
          <div className="tos-section-content">
            <ul className="tos-list">
              <li>You have the right to access, modify, or delete your personal information at any time</li>
              <li>You can request account closure by contacting our support team</li>
              <li>We reserve the right to suspend or terminate accounts that violate our terms</li>
              <li>You will receive notifications about important account updates via email (if provided)</li>
            </ul>
          </div>
        </div>

        {/* Agreement Checkbox */}
        <div className="tos-checkbox-container">
          <Checkbox 
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            disabled={isLoading}
          >
            <span style={{ fontSize: '14px', fontWeight: 500 }}>
              I have read and agree to the Terms of Service and Privacy Policy managed by CJKB
            </span>
          </Checkbox>
        </div>

        {/* Footer Buttons */}
        <div className="tos-footer">
          <Button 
            className="tos-decline-btn"
            onClick={handleDecline}
            disabled={isLoading}
            size="large"
          >
            Decline
          </Button>
          <Button 
            className="tos-accept-btn"
            onClick={handleAccept}
            disabled={!agreed || isLoading}
            loading={isLoading}
            size="large"
          >
            Accept & Continue
          </Button>
        </div>

        <p style={{ 
          fontSize: '12px', 
          color: '#6B7280', 
          textAlign: 'center',
          marginTop: '16px',
          fontStyle: 'italic'
        }}>
          By clicking "Accept & Continue", you will be registered and redirected to your dashboard.
          If you decline, your account will not be created and you will return to the login screen.
        </p>
      </div>
    </Modal>
  );
}
