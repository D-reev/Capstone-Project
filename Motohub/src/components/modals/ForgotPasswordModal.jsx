import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Steps, Alert, message } from 'antd';
import { MailOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { initiatePasswordReset, verifyOTP, resetPassword } from '../../utils/auth';
import './Modal.css';

function ForgotPasswordModal({ open, onClose }) {
  const [form] = Form.useForm();
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');

  // Reset everything when modal closes
  useEffect(() => {
    if (!open) {
      form.resetFields();
      setStep(0);
      setEmail('');
      setOtp('');
      setIsLoading(false);
    }
  }, [open, form]);

  const handleEmailSubmit = async (values) => {
    setIsLoading(true);
    try {
      await initiatePasswordReset(values.email);
      setEmail(values.email);
      setStep(1);
    } catch (error) {
      message.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerification = async (values) => {
    setIsLoading(true);
    try {
      await verifyOTP(values.otp);
      setOtp(values.otp);
      setStep(2);
    } catch (error) {
      message.error('Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (values) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(otp, values.newPassword);
      message.success('Password reset successfully!');
      handleClose();
    } catch (error) {
      message.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    setStep(0);
    setEmail('');
    setOtp('');
    setIsLoading(false);
    onClose();
  };

  const steps = [
    { title: 'Email' },
    { title: 'Verify OTP' },
    { title: 'Reset Password' }
  ];

  return (
    <Modal
      open={open}
      title="Reset Password"
      onCancel={handleClose}
      footer={null}
      width={500}
      centered
      maskClosable={!isLoading}
    >
      <style>{`
        .ant-modal-header {
          background: linear-gradient(135deg, #FFC300, #FFD54F);
        }
        .ant-modal-title {
          color: #000 !important;
          font-weight: 700;
          font-size: 18px;
          text-align: center;
        }
        .ant-input:hover,
        .ant-input:focus,
        .ant-input-focused,
        .ant-input-password:hover,
        .ant-input-password:focus {
          border-color: #FFC300 !important;
        }
        .ant-input-affix-wrapper:hover,
        .ant-input-affix-wrapper:focus,
        .ant-input-affix-wrapper-focused {
          border-color: #FFC300 !important;
        }
        .ant-input-affix-wrapper:focus,
        .ant-input-affix-wrapper-focused {
          box-shadow: 0 0 0 2px rgba(255, 195, 0, 0.1) !important;
          outline: none !important;
        }
        .ant-steps-item-finish .ant-steps-item-icon {
          background-color: #FFC300 !important;
          border-color: #FFC300 !important;
        }
        .ant-steps-item-process .ant-steps-item-icon {
          background-color: #FFC300 !important;
          border-color: #FFC300 !important;
        }
        .forgot-cancel-btn {
          height: 42px;
          border-radius: 8px;
          border-color: #FFC300 !important;
          color: #FFC300 !important;
          background: transparent !important;
        }
        .forgot-cancel-btn:hover:not(:disabled) {
          border-color: #FFD54F !important;
          color: #FFD54F !important;
          background: transparent !important;
        }
        .forgot-submit-btn {
          height: 42px;
          border-radius: 8px;
          background: linear-gradient(135deg, #FFC300, #FFD54F) !important;
          border-color: #FFC300 !important;
          color: #000 !important;
          font-weight: 600;
        }
        .forgot-submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #FFD54F, #FFEB3B) !important;
          border-color: #FFD54F !important;
        }
      `}</style>

      <Steps current={step} items={steps} style={{ marginBottom: '24px' }} />

      {step === 0 && (
        <Form form={form} layout="vertical" onFinish={handleEmailSubmit}>
          <Alert
            message="Enter your email address to receive a password reset code"
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />
          
          <Form.Item
            label="Email Address"
            name="email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input 
              prefix={<MailOutlined />} 
              placeholder="your.email@example.com" 
              size="large"
            />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <Button 
              className="forgot-cancel-btn"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="primary"
              className="forgot-submit-btn"
              htmlType="submit"
              loading={isLoading}
            >
              Send Reset Code
            </Button>
          </div>
        </Form>
      )}

      {step === 1 && (
        <Form form={form} layout="vertical" onFinish={handleOTPVerification}>
          <Alert
            message={`Enter the 6-digit code sent to ${email}`}
            type="warning"
            description="Check your spam/junk folder if you don't see the email"
            showIcon
            style={{ marginBottom: '16px' }}
          />
          
          <Form.Item
            label="Verification Code"
            name="otp"
            rules={[
              { required: true, message: 'Please enter the OTP code' },
              { len: 6, message: 'OTP must be 6 digits' }
            ]}
          >
            <Input 
              prefix={<SafetyOutlined />} 
              placeholder="Enter 6-digit code" 
              maxLength={6}
              size="large"
              style={{ letterSpacing: '0.5rem', textAlign: 'center' }}
            />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <Button 
              className="forgot-cancel-btn"
              onClick={() => setStep(0)}
              disabled={isLoading}
            >
              Back
            </Button>
            <Button 
              type="primary"
              className="forgot-submit-btn"
              htmlType="submit"
              loading={isLoading}
            >
              Verify Code
            </Button>
          </div>
        </Form>
      )}

      {step === 2 && (
        <Form form={form} layout="vertical" onFinish={handlePasswordReset}>
          <Alert
            message="Enter your new password (minimum 6 characters)"
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />
          
          <Form.Item
            label="New Password"
            name="newPassword"
            rules={[
              { required: true, message: 'Please enter a new password' },
              { min: 6, message: 'Password must be at least 6 characters' }
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Enter new password" 
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Confirm New Password"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Please confirm your password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Confirm new password" 
              size="large"
            />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <Button 
              className="forgot-cancel-btn"
              onClick={() => setStep(1)}
              disabled={isLoading}
            >
              Back
            </Button>
            <Button 
              type="primary"
              className="forgot-submit-btn"
              htmlType="submit"
              loading={isLoading}
            >
              Reset Password
            </Button>
          </div>
        </Form>
      )}
    </Modal>
  );
}

export default ForgotPasswordModal;