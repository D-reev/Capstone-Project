import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Select, Button, message } from "antd";
import { UserOutlined, MailOutlined } from "@ant-design/icons";
import { doc, updateDoc, getFirestore } from "firebase/firestore";
import "./Modal.css";

const { Option } = Select;

export default function EditUserModal({ user, onSubmit, onClose, open }) {
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const db = getFirestore();

  useEffect(() => {
    if (user && open) {
      form.setFieldsValue({
        displayName: user.displayName || "",
        email: user.email || "",
        role: user.role || "user",
        status: user.status || "active",
      });
    }
  }, [user, open, form]);

  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      if (user?.id) {
        const userRef = doc(db, 'users', user.id);
        await updateDoc(userRef, {
          displayName: values.displayName,
          role: values.role,
          status: values.status,
          updatedAt: new Date().toISOString()
        });
        
        message.success('User updated successfully!');
        onSubmit({
          ...values,
          id: user.id
        });
      }
    } catch (err) {
      console.error("Error updating user:", err);
      message.error("Failed to update user. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
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
      width={500}
      centered
      destroyOnClose
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
        <Form.Item
          label="Display Name"
          name="displayName"
          rules={[{ required: true, message: 'Please enter display name' }]}
        >
          <Input 
            prefix={<UserOutlined />}
            placeholder="Enter display name"
            size="large"
          />
        </Form.Item>

        {!user && (
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
