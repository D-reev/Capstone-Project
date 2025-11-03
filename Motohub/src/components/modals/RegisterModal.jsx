import React, { useState } from 'react';
import { Modal, Form, Input, Button, message, Alert } from 'antd';
import { UserOutlined, LockOutlined, ExclamationCircleOutlined, PhoneOutlined, HomeOutlined, MailOutlined } from '@ant-design/icons';
import './Modal.css';
import { registerWithUsername } from '../../utils/auth';

export default function RegisterModal({ open, onClose, onSuccess, onSwitchToLogin }) {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (values) => {
    setIsLoading(true);
    try {
      const user = await registerWithUsername({
        firstName: values.firstName.trim(),
        middleName: values.middleName?.trim() || '',
        lastName: values.lastName.trim(),
        username: values.username.trim().toLowerCase(),
        password: values.password,
        role: 'user',
        address: values.address?.trim() || '',
        city: values.city?.trim() || '',
        postalCode: values.postalCode?.trim() || '',
        phoneNumber: values.phoneNumber?.trim() || '',
        googleEmail: values.googleEmail?.trim() || ''
      });

      message.success('Registration successful!');
      if (typeof onSuccess === 'function') onSuccess(user);
      form.resetFields();
      onClose();
    } catch (err) {
      console.error('Registration error:', err);
      
      let errorMessage = 'Registration failed';
      let tips = [];
      
      if (err?.code === 'auth/email-already-in-use') {
        errorMessage = 'This username is already taken.';
        tips = [
          'Try a different username',
          'If this is your account, use "Login here" below',
          'Usernames must be unique across all users'
        ];
      } else if (err?.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak.';
        tips = [
          'Use at least 8 characters',
          'Include a mix of letters and numbers',
          'Consider adding special characters'
        ];
      } else if (err?.code === 'auth/invalid-email') {
        errorMessage = 'Invalid username format.';
        tips = [
          'Use only lowercase letters (a-z)',
          'Numbers (0-9) are allowed',
          'You can use dots (.), underscores (_), or hyphens (-)',
          'No spaces or special characters'
        ];
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      // Show error in a modal
      Modal.error({
        title: 'Registration Failed',
        icon: <ExclamationCircleOutlined />,
        content: (
          <div>
            <p>{errorMessage}</p>
            {tips.length > 0 && (
              <div style={{ marginTop: '12px', padding: '12px', background: '#fff7e6', borderRadius: '8px' }}>
                <strong>Tips:</strong>
                <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                  {tips.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
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
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      open={open}
      title="Create Account"
      onCancel={handleCancel}
      footer={null}
      width={600}
      centered
      maskClosable={!isLoading}
      styles={{
        body: { maxHeight: 'calc(90vh - 120px)', overflowY: 'auto', paddingRight: '8px' }
      }}
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
        .register-cancel-btn {
          height: 42px;
          border-radius: 8px;
          border-color: #FFC300 !important;
          color: #FFC300 !important;
          background: transparent !important;
        }
        .register-cancel-btn:hover:not(:disabled) {
          border-color: #FFD54F !important;
          color: #FFD54F !important;
          background: transparent !important;
        }
        .register-submit-btn {
          height: 42px;
          border-radius: 8px;
          background: linear-gradient(135deg, #FFC300, #FFD54F) !important;
          border-color: #FFC300 !important;
          color: #000 !important;
          font-weight: 600;
        }
        .register-submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #FFD54F, #FFEB3B) !important;
          border-color: #FFD54F !important;
        }
      `}</style>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleRegister}
      >
        {/* Personal Information Section */}
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: '#333' }}>
            Personal Information
          </h4>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Form.Item
            label="First Name"
            name="firstName"
            rules={[
              { required: true, message: 'Please enter your first name' },
              { pattern: /^[A-Za-z\s'-]{2,}$/, message: 'Invalid name format' }
            ]}
          >
            <Input placeholder="Enter first name" size="large" />
          </Form.Item>

          <Form.Item
            label="Last Name"
            name="lastName"
            rules={[
              { required: true, message: 'Please enter your last name' },
              { pattern: /^[A-Za-z\s'-]{2,}$/, message: 'Invalid name format' }
            ]}
          >
            <Input placeholder="Enter last name" size="large" />
          </Form.Item>
        </div>

        <Form.Item
          label="Middle Name (optional)"
          name="middleName"
        >
          <Input placeholder="Enter middle name" size="large" />
        </Form.Item>

        {/* Address Section */}
        <div style={{ marginTop: '20px', marginBottom: '12px' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: '#333' }}>
            Address Information
          </h4>
        </div>

        <Form.Item
          label="Address"
          name="address"
          rules={[
            { required: true, message: 'Please enter your address' }
          ]}
        >
          <Input 
            prefix={<HomeOutlined />}
            placeholder="Street address, building, unit number" 
            size="large" 
          />
        </Form.Item>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Form.Item
            label="City"
            name="city"
            rules={[
              { required: true, message: 'Please enter your city' }
            ]}
          >
            <Input placeholder="Enter city" size="large" />
          </Form.Item>

          <Form.Item
            label="Postal Code"
            name="postalCode"
            rules={[
              { required: true, message: 'Please enter postal code' }
            ]}
          >
            <Input placeholder="Enter postal code" size="large" />
          </Form.Item>
        </div>

        <Form.Item
          label="Mobile Number"
          name="phoneNumber"
          rules={[
            { required: true, message: 'Please enter your mobile number' },
            { pattern: /^[0-9]{10,11}$/, message: 'Enter a valid 10-11 digit mobile number' }
          ]}
        >
          <Input 
            prefix={<PhoneOutlined />}
            placeholder="e.g., 09171234567" 
            size="large" 
          />
        </Form.Item>

        {/* Account Information Section */}
        <div style={{ marginTop: '20px', marginBottom: '12px' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: '#333' }}>
            Account Information
          </h4>
        </div>

        <Form.Item
          label="Username"
          name="username"
          rules={[
            { required: true, message: 'Please enter a username' },
            { min: 4, message: 'Must be at least 4 characters' },
            { pattern: /^[a-z0-9._-]+$/, message: 'Use lowercase letters, numbers, . _ or -' }
          ]}
        >
          <Input 
            prefix={<UserOutlined />} 
            placeholder="Enter username" 
            size="large"
          />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[
            { required: true, message: 'Please enter a password' },
            { min: 8, message: 'Must be at least 8 characters' }
          ]}
          extra="Must be at least 8 characters"
        >
          <Input.Password 
            prefix={<LockOutlined />} 
            placeholder="Enter password" 
            size="large"
          />
        </Form.Item>

        <Form.Item
          label="Google Email (Gmail) - Optional"
          name="googleEmail"
          rules={[
            { type: 'email', message: 'Please enter a valid email address' }
          ]}
        >
          <Input 
            prefix={<MailOutlined />}
            placeholder="your.email@gmail.com" 
            size="large"
          />
        </Form.Item>

        <Alert
          message="Important: Gmail Account"
          description="If you don't provide a Gmail address, password recovery via 'Forgot Password' will not be available. You can add it later in your profile settings."
          type="warning"
          showIcon
          style={{ marginBottom: '20px' }}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
          <Button 
            className="register-cancel-btn"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            type="primary"
            className="register-submit-btn"
            htmlType="submit"
            loading={isLoading}
          >
            Register
          </Button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px' }}>
          Already have an account?{' '}
          <span 
            onClick={() => {
              handleCancel();
              if (onSwitchToLogin) onSwitchToLogin();
            }}
            style={{ 
              color: '#FFC300', 
              cursor: 'pointer',
              fontWeight: 600
            }}
            onMouseEnter={(e) => e.target.style.color = '#FFD54F'}
            onMouseLeave={(e) => e.target.style.color = '#FFC300'}
          >
            Login here
          </span>
        </div>
      </Form>
    </Modal>
  );
}