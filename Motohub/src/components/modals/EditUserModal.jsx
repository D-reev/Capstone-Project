import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Select, Button, App } from "antd";
import { UserOutlined, MailOutlined, PhoneOutlined, HomeOutlined, LockOutlined } from "@ant-design/icons";
import { doc, updateDoc, getFirestore } from "firebase/firestore";
import "./Modal.css";

const { Option } = Select;

export default function EditUserModal({ user, onSubmit, onClose, open }) {
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const db = getFirestore();
  const { message: messageApi, modal } = App.useApp();

  useEffect(() => {
    if (user && open) {
      form.setFieldsValue({
        firstName: user.firstName || "",
        middleName: user.middleName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        role: user.role || "user",
        status: user.status || "active",
        address: user.address || "",
        city: user.city || "",
        postalCode: user.postalCode || "",
        phoneNumber: user.phoneNumber || user.mobileNumber || "",
      });
    } else if (!user && open) {
      // Reset form for add mode
      form.resetFields();
    }
  }, [user, open, form]);

  const handleSubmit = async (values) => {
    const displayName = `${values.firstName} ${values.lastName}`;
    const actionType = user ? 'update' : 'create';
    const confirmTitle = user ? 'Confirm Update User' : 'Confirm Add User';
    const confirmContent = user 
      ? `Are you sure you want to update ${displayName}'s information?`
      : `Are you sure you want to create a new user account for ${displayName}?`;

    // Show confirmation modal
    modal.confirm({
      title: confirmTitle,
      content: confirmContent,
      okText: user ? 'Yes, Update' : 'Yes, Create',
      cancelText: 'Cancel',
      centered: true,
      onOk: async () => {
        setIsSubmitting(true);
        try {
          if (user?.id) {
            // Edit mode - update existing user
            const userRef = doc(db, 'users', user.id);
            await updateDoc(userRef, {
              firstName: values.firstName,
              middleName: values.middleName || "",
              lastName: values.lastName,
              displayName: displayName,
              role: values.role,
              status: values.status,
              address: values.address || "",
              city: values.city || "",
              postalCode: values.postalCode || "",
              phoneNumber: values.phoneNumber || "",
              mobileNumber: values.phoneNumber || "",
              updatedAt: new Date().toISOString()
            });
            
            messageApi.success('User updated successfully!');
            onSubmit({
              ...values,
              id: user.id,
              displayName: displayName
            });
          } else {
            // Add mode - pass data to parent to create new user
            messageApi.success('User created successfully!');
            onSubmit({
              ...values,
              displayName: displayName,
              middleName: values.middleName || "",
              address: values.address || "",
              city: values.city || "",
              postalCode: values.postalCode || "",
              phoneNumber: values.phoneNumber || "",
              mobileNumber: values.phoneNumber || "",
            });
          }
          onClose(); // Close modal after successful submission
        } catch (err) {
          console.error("Error updating user:", err);
          messageApi.error(`Failed to ${user ? 'update' : 'create'} user. Please try again.`);
        } finally {
          setIsSubmitting(false);
        }
      }
    });
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      open={open}
      title={user ? "Edit User" : "Add New User"}
      onCancel={handleCancel}
      footer={null}
      width={600}
      centered
      destroyOnHidden
      maskClosable={!isSubmitting}
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
        .ant-select:not(.ant-select-disabled):hover .ant-select-selector,
        .ant-select-focused:not(.ant-select-disabled) .ant-select-selector {
          border-color: #FFC300 !important;
        }
        .ant-input:focus,
        .ant-input-focused,
        .ant-select-focused .ant-select-selector {
          border-color: #FFC300 !important;
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
        .edituser-cancel-btn {
          height: 42px;
          border-radius: 8px;
          border-color: #FFC300 !important;
          color: #FFC300 !important;
          background: transparent !important;
        }
        .edituser-cancel-btn:hover:not(:disabled) {
          border-color: #FFD54F !important;
          color: #FFD54F !important;
          background: transparent !important;
        }
        .edituser-submit-btn {
          height: 42px;
          border-radius: 8px;
          background: linear-gradient(135deg, #FFC300, #FFD54F) !important;
          border-color: #FFC300 !important;
          color: #000 !important;
          font-weight: 600;
        }
        .edituser-submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #FFD54F, #FFEB3B) !important;
          border-color: #FFD54F !important;
        }
      `}</style>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
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
              { required: true, message: 'Please enter first name' },
              { pattern: /^[A-Za-z\s'-]{2,}$/, message: 'Invalid name format' }
            ]}
          >
            <Input placeholder="Enter first name" size="large" />
          </Form.Item>

          <Form.Item
            label="Last Name"
            name="lastName"
            rules={[
              { required: true, message: 'Please enter last name' },
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
            { required: true, message: 'Please enter address' }
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
              { required: true, message: 'Please enter city' }
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
            { required: true, message: 'Please enter mobile number' },
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

        {!user && (
          <>
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: 'Please enter email' },
                { type: 'email', message: 'Please enter a valid email' }
              ]}
            >
              <Input 
                prefix={<MailOutlined />}
                placeholder="Enter email"
                size="large"
              />
            </Form.Item>

            <Form.Item
              label="Temporary Password"
              name="password"
              rules={[
                { required: true, message: 'Please enter a temporary password' },
                { min: 8, message: 'Must be at least 8 characters' }
              ]}
              extra="User will be able to change this after first login"
            >
              <Input.Password 
                prefix={<LockOutlined />}
                placeholder="Enter temporary password"
                size="large"
              />
            </Form.Item>
          </>
        )}

        <Form.Item
          label="Role"
          name="role"
          rules={[{ required: true, message: 'Please select role' }]}
        >
          <Select size="large">
            <Option value="user">User</Option>
            <Option value="mechanic">Mechanic</Option>
            <Option value="admin">Admin</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Status"
          name="status"
          rules={[{ required: true, message: 'Please select status' }]}
        >
          <Select size="large">
            <Option value="active">Active</Option>
            <Option value="inactive">Inactive</Option>
            <Option value="banned">Banned</Option>
          </Select>
        </Form.Item>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
          <Button 
            className="edituser-cancel-btn"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="primary"
            className="edituser-submit-btn"
            htmlType="submit"
            loading={isSubmitting}
          >
            {user ? "Save Changes" : "Create User"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
