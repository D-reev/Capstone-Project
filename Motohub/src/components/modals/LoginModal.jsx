import React, { useState } from 'react';
import { Modal, Form, Input, Button, Checkbox, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';
import ForgotPasswordModal from './ForgotPasswordModal';
import './Modal.css';

export default function LoginModal({ open, onClose }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  const handleLogin = async (values) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      message.success('Login successful!');
      form.resetFields();
      onClose();
    } catch (error) {
      console.error('Login error:', error);
      message.error(error.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <>
      <Modal
        open={open}
        title="Login to Motohub"
        onCancel={handleCancel}
        footer={null}
        width={450}
        centered
        maskClosable={!loading}
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
          .ant-checkbox-checked .ant-checkbox-inner {
            background-color: #FFC300 !important;
            border-color: #FFC300 !important;
          }
          .ant-checkbox-wrapper:hover .ant-checkbox-inner,
          .ant-checkbox:hover .ant-checkbox-inner {
            border-color: #FFC300 !important;
          }
          .login-cancel-btn {
            height: 42px;
            border-radius: 8px;
            border-color: #FFC300 !important;
            color: #FFC300 !important;
            background: transparent !important;
          }
          .login-cancel-btn:hover:not(:disabled) {
            border-color: #FFD54F !important;
            color: #FFD54F !important;
            background: transparent !important;
          }
          .login-submit-btn {
            height: 42px;
            border-radius: 8px;
            background: linear-gradient(135deg, #FFC300, #FFD54F) !important;
            border-color: #FFC300 !important;
            color: #000 !important;
            font-weight: 600;
          }
          .login-submit-btn:hover:not(:disabled) {
            background: linear-gradient(135deg, #FFD54F, #FFEB3B) !important;
            border-color: #FFD54F !important;
          }
          .forgot-password-link {
            color: #FFC300 !important;
            cursor: pointer;
            font-size: 14px;
          }
          .forgot-password-link:hover {
            color: #FFD54F !important;
            text-decoration: underline;
          }
        `}</style>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleLogin}
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input 
              prefix={<MailOutlined />} 
              placeholder="Enter your email" 
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Enter your password" 
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>Remember me</Checkbox>
              </Form.Item>
              <span 
                className="forgot-password-link"
                onClick={() => setForgotPasswordOpen(true)}
              >
                Forgot password?
              </span>
            </div>
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <Button 
              className="login-cancel-btn"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="primary"
              className="login-submit-btn"
              htmlType="submit"
              loading={loading}
            >
              Login
            </Button>
          </div>
        </Form>
      </Modal>

      <ForgotPasswordModal 
        open={forgotPasswordOpen} 
        onClose={() => setForgotPasswordOpen(false)} 
      />
    </>
  );
}
