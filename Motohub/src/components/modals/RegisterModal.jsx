import React, { useState } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import './Modal.css';
import { registerWithUsername } from '../../utils/auth';

export default function RegisterModal({ open, onClose, onSuccess }) {
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
        role: 'user'
      });

      message.success('Registration successful!');
      if (typeof onSuccess === 'function') onSuccess(user);
      form.resetFields();
      onClose();
    } catch (err) {
      console.error('Registration error:', err);
      message.error(err?.message || 'Registration failed');
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
      </Form>
    </Modal>
  );
}