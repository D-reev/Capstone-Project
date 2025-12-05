import React, { useState } from 'react';
import { Modal, Form, Input, Button, Checkbox, message, Tooltip, App } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, ExclamationCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../config/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { getUserRole } from '../../utils/auth';
import { useNavigate } from 'react-router-dom';
import ForgotPasswordModal from './ForgotPasswordModal';
import './Modal.css';

export default function LoginModal({ open, onClose, onSwitchToRegister }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const navigate = useNavigate();
  const { modal } = App.useApp();

  const handleLogin = async (values) => {
    setLoading(true);
    try {
      const identifier = (values.emailOrUsername || "").trim();
      
      // Validate identifier format
      if (!identifier) {
        modal.error({
          title: 'Invalid Input',
          icon: <ExclamationCircleOutlined />,
          content: 'Please enter a valid username or email address.',
          okText: 'Got it',
          centered: true,
          okButtonProps: {
            style: {
              background: 'linear-gradient(135deg, #FFC300, #FFD54F)',
              borderColor: '#FFC300',
              color: '#000',
              fontWeight: 600
            }
          }
        });
        setLoading(false);
        return;
      }

      // Check for invalid characters in username
      if (!identifier.includes('@') && !/^[a-zA-Z0-9_.-]+$/.test(identifier)) {
        modal.error({
          title: 'Invalid Username',
          icon: <ExclamationCircleOutlined />,
          content: (
            <div>
              <p>Username contains invalid characters.</p>
              <div style={{ marginTop: '12px', padding: '12px', background: '#fff7e6', borderRadius: '8px' }}>
                <strong>Valid username format:</strong>
                <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                  <li>Letters (a-z, A-Z)</li>
                  <li>Numbers (0-9)</li>
                  <li>Underscore (_), dash (-), or period (.)</li>
                </ul>
              </div>
            </div>
          ),
          okText: 'Got it',
          centered: true,
          okButtonProps: {
            style: {
              background: 'linear-gradient(135deg, #FFC300, #FFD54F)',
              borderColor: '#FFC300',
              color: '#000',
              fontWeight: 600
            }
          }
        });
        setLoading(false);
        return;
      }

      let loginEmail = identifier;

      // If it's not an email format, assume it's a username and convert to synthetic email
      if (!identifier.includes('@')) {
        loginEmail = `${identifier}@motohub.local`;
      }

      console.log('Attempting login with:', loginEmail); // Debug log
      
      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, values.password);
      const role = await getUserRole(userCredential.user.uid);
      
      message.success('Login successful!');
      form.resetFields();
      onClose();

      // Navigate based on role
      if (role === 'admin') {
        navigate('/admindashboard');
      } else if (role === 'mechanic'){
        navigate('/mechanicdashboard');
      } else {
        navigate('/userdashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      const errorMessage = getErrorMessage(error.code, values.emailOrUsername);
      
      // Show error in a modal
      modal.error({
        title: 'Login Failed',
        icon: <ExclamationCircleOutlined />,
        content: (
          <div>
            <p style={{ fontSize: '15px', marginBottom: '16px' }}>{errorMessage}</p>
            {(error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') && (
              <div style={{ marginTop: '12px', padding: '12px', background: '#fff7e6', borderRadius: '8px' }}>
                <strong style={{ fontSize: '14px' }}>Troubleshooting Tips:</strong>
                <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', fontSize: '13px' }}>
                  <li>Make sure you're using the correct username or email</li>
                  <li>Check that your password is correct (case-sensitive)</li>
                  <li>Verify there are no extra spaces before or after your input</li>
                  <li>If you forgot your password, click "Forgot password?"</li>
                  <li>Don't have an account? Click "Register here" below</li>
                </ul>
              </div>
            )}
          </div>
        ),
        okText: 'Got it',
        centered: true,
        okButtonProps: {
          style: {
            background: 'linear-gradient(135deg, #FFC300, #FFD54F)',
            borderColor: '#FFC300',
            color: '#000',
            fontWeight: 600
          }
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (errorCode, identifier) => {
    const isEmail = identifier && identifier.includes('@');
    const accountType = isEmail ? 'email address' : 'username';
    
    switch (errorCode) {
      case 'auth/user-not-found':
        return `No account found with this ${accountType}. Please check your credentials or register a new account.`;
      case 'auth/wrong-password':
        return 'Incorrect password. Click "Forgot password?" to reset it.';
      case 'auth/invalid-email':
        return 'Invalid email format. Please enter a valid email address or use your username instead.';
      case 'auth/too-many-requests':
        return 'Too many failed login attempts. Please try again later or reset your password.';
      case 'auth/invalid-credential':
        return `The ${accountType} or password you entered is incorrect. Please double-check your credentials and try again.`;
      default:
        return 'Login failed. Please verify your credentials and try again.';
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
            label={
              <span>
                Email or Username{' '}
                <Tooltip
                  title={
                    <div style={{ fontSize: '13px' }}>
                      <div style={{ marginBottom: 8, fontWeight: 600 }}>You can log in using:</div>
                      <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                        <li>Your <strong>username</strong> (e.g., john_doe)</li>
                        <li>Your <strong>email address</strong></li>
                        <li>Your <strong>Gmail</strong> (if added during registration)</li>
                      </ul>
                      <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(0,0,0,0.1)', fontSize: '12px' }}>
                        <InfoCircleOutlined style={{ marginRight: 4 }} />
                        Username accounts use <code style={{ background: 'rgba(0,0,0,0.1)', padding: '2px 4px', borderRadius: 3, color: '#000' }}>@motohub.local</code> internally
                      </div>
                    </div>
                  }
                  overlayStyle={{ maxWidth: '350px' }}
                  overlayInnerStyle={{
                    background: 'linear-gradient(135deg, #FFC300, #FFD54F)',
                    color: '#000',
                    borderRadius: '8px',
                    padding: '12px 16px'
                  }}
                  placement="right"
                >
                  <InfoCircleOutlined 
                    style={{ 
                      color: '#FFC300', 
                      fontSize: '14px',
                      cursor: 'help',
                      marginLeft: '4px'
                    }} 
                  />
                </Tooltip>
              </span>
            }
            name="emailOrUsername"
            rules={[
              { required: true, message: 'Please enter your email or username' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Enter your email or username" 
              size="large"
              autoComplete="username"
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

          <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px' }}>
            Don't have an account?{' '}
            <span 
              onClick={() => {
                handleCancel();
                if (onSwitchToRegister) onSwitchToRegister();
              }}
              style={{ 
                color: '#FFC300', 
                cursor: 'pointer',
                fontWeight: 600
              }}
              onMouseEnter={(e) => e.target.style.color = '#FFD54F'}
              onMouseLeave={(e) => e.target.style.color = '#FFC300'}
            >
              Register here
            </span>
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
