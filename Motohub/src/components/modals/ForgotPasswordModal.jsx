import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Alert, App } from 'antd';
import { MailOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { sendPasswordReset } from '../../utils/auth';
import './Modal.css';

function ForgotPasswordModal({ open, onClose }) {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const { message: messageApi } = App.useApp();

  // Reset everything when modal closes
  useEffect(() => {
    if (!open) {
      form.resetFields();
      setEmailSent(false);
      setSentEmail('');
      setIsLoading(false);
    }
  }, [open, form]);

  const handleSubmit = async (values) => {
    setIsLoading(true);
    try {
      await sendPasswordReset(values.email);
      setSentEmail(values.email);
      setEmailSent(true);
      messageApi.success('Password reset link sent!');
    } catch (error) {
      messageApi.error(error.message || 'Failed to send reset link');
    } finally {
      setIsLoading(false);
    }
  };

    const handleClose = () => {
      form.resetFields();
      setEmailSent(false);
      setSentEmail('');
      setIsLoading(false);
      onClose();
    };

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
        .ant-input-focused {
          border-color: #FFC300 !important;
        }
        .ant-input:focus {
          box-shadow: 0 0 0 2px rgba(255, 195, 0, 0.1) !important;
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
        }
        .success-checkmark {
          font-size: 64px;
          color: #52c41a;
          margin-bottom: 16px;
        }
      `}</style>

      {!emailSent ? (
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Alert
            message="Enter your email address to receive a password reset link"
            type="info"
            showIcon
            style={{ marginBottom: '20px' }}
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
              Send Reset Link
            </Button>
          </div>
        </Form>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <CheckCircleOutlined className="success-checkmark" />
          
          <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px', color: '#000' }}>
            Check Your Email
          </h3>
          
          <p style={{ color: '#666', marginBottom: '8px', fontSize: '14px' }}>
            We've sent a password reset link to:
          </p>
          <p style={{ color: '#000', fontWeight: 600, marginBottom: '20px', fontSize: '16px' }}>
            {sentEmail}
          </p>
          
          <Alert
            message="Click the link in the email to reset your password"
            description="If you don't see the email, check your spam/junk folder"
            type="success"
            showIcon
            style={{ marginBottom: '24px', textAlign: 'left' }}
          />

          <Button 
            type="primary"
            className="forgot-submit-btn"
            onClick={handleClose}
            style={{ minWidth: '120px' }}
          >
            Close
          </Button>
        </div>
      )}
    </Modal>
  );
}

export default ForgotPasswordModal;