import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Button, Spin, message } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, HomeOutlined } from '@ant-design/icons';
import './Modal.css';
import { getUserProfile, updateUserProfile } from '../../utils/auth';

export default function ProfileModal({ open, onClose, user, onSaved }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const profile = await getUserProfile(user.uid);
        if (!mounted) return;
        
        form.setFieldsValue({
          firstName: profile?.firstName ?? '',
          middleName: profile?.middleName ?? '',
          lastName: profile?.lastName ?? '',
          email: profile?.googleEmail ?? profile?.email ?? user.email ?? '',
          phoneNumber: profile?.phoneNumber ?? '',
          address: profile?.address ?? '',
          city: profile?.city ?? '',
          postalCode: profile?.postalCode ?? ''
        });
      } catch (err) {
        console.error('ProfileModal load error', err);
        message.error('Failed to load profile');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [user, open, form]);

  const handleSave = async (values) => {
    setSaving(true);
    try {
      const updates = {
        firstName: values.firstName || null,
        middleName: values.middleName || null,
        lastName: values.lastName || null,
        googleEmail: values.email || null,
        phoneNumber: values.phoneNumber || null,
        address: values.address || null,
        city: values.city || null,
        postalCode: values.postalCode || null,
        updatedAt: new Date().toISOString()
      };
      await updateUserProfile(user.uid, updates);
      message.success('Profile saved successfully!');
      if (typeof onSaved === 'function') onSaved(updates);
      onClose();
    } catch (err) {
      console.error('ProfileModal save error', err);
      message.error(err?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      open={open}
      title="Profile"
      onCancel={handleCancel}
      footer={null}
      width={600}
      centered
      maskClosable={!saving}
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
        .ant-input:focus,
        .ant-input-focused {
          box-shadow: 0 0 0 2px rgba(255, 195, 0, 0.1) !important;
          outline: none !important;
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
        .profile-cancel-btn {
          height: 42px;
          border-radius: 8px;
          border-color: #FFC300 !important;
          color: #FFC300 !important;
          background: transparent !important;
        }
        .profile-cancel-btn:hover:not(:disabled) {
          border-color: #FFD54F !important;
          color: #FFD54F !important;
          background: transparent !important;
        }
        .profile-submit-btn {
          height: 42px;
          border-radius: 8px;
          background: linear-gradient(135deg, #FFC300, #FFD54F) !important;
          border-color: #FFC300 !important;
          color: #000 !important;
          font-weight: 600;
        }
        .profile-submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #FFD54F, #FFEB3B) !important;
          border-color: #FFD54F !important;
        }
      `}</style>

      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Form.Item
              label="First Name"
              name="firstName"
              rules={[{ required: true, message: 'Please enter your first name' }]}
            >
              <Input 
                prefix={<UserOutlined />} 
                placeholder="First name" 
                size="large"
              />
            </Form.Item>

            <Form.Item
              label="Last Name"
              name="lastName"
              rules={[{ required: true, message: 'Please enter your last name' }]}
            >
              <Input 
                prefix={<UserOutlined />} 
                placeholder="Last name" 
                size="large"
              />
            </Form.Item>
          </div>

          <Form.Item
            label="Middle Name (optional)"
            name="middleName"
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Middle name" 
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Gmail (for notifications)"
            name="email"
          >
            <Input 
              prefix={<MailOutlined />} 
              placeholder="Connect verified Gmail here" 
              size="large"
            />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Form.Item
              label="Phone Number"
              name="phoneNumber"
            >
              <Input 
                prefix={<PhoneOutlined />} 
                placeholder="Phone number" 
                size="large"
              />
            </Form.Item>

            <Form.Item
              label="Postal Code"
              name="postalCode"
            >
              <Input 
                placeholder="Postal code" 
                size="large"
              />
            </Form.Item>
          </div>

          <Form.Item
            label="City"
            name="city"
          >
            <Input 
              prefix={<HomeOutlined />} 
              placeholder="City" 
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Address"
            name="address"
          >
            <Input 
              prefix={<HomeOutlined />} 
              placeholder="Address (street, number)" 
              size="large"
            />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <Button 
              className="profile-cancel-btn"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button 
              type="primary"
              className="profile-submit-btn"
              htmlType="submit"
              loading={saving}
            >
              Save
            </Button>
          </div>
        </Form>
      </Spin>
    </Modal>
  );
}