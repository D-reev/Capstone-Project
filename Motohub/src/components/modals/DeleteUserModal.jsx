import React from 'react';
import { Modal, Descriptions, Button } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import './Modal.css';

export default function DeleteUserModal({ user, open, onClose, onDelete, processing = false }) {
  if (!user) return null;

  return (
    <Modal
      open={open}
      title="Delete User"
      onCancel={onClose}
      footer={null}
      width={500}
      centered
      maskClosable={!processing}
    >
      <style>{`
        .ant-modal-header {
          background: linear-gradient(135deg, #FFC300, #FFD54F);
        }
        .ant-modal-title {
          color: #000 !important;
          font-weight: 700;
          font-size: 18px;
        }
        .delete-cancel-btn {
          height: 40px;
          border-radius: 8px;
          border-color: #FFC300 !important;
          color: #FFC300 !important;
          background: transparent !important;
        }
        .delete-cancel-btn:hover:not(:disabled) {
          border-color: #FFD54F !important;
          color: #FFD54F !important;
          background: transparent !important;
        }
        .delete-confirm-btn {
          height: 40px;
          border-radius: 8px;
          background: linear-gradient(135deg, #EF4444, #DC2626) !important;
          border-color: #EF4444 !important;
          color: #fff !important;
          font-weight: 600;
        }
        .delete-confirm-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #DC2626, #B91C1C) !important;
          border-color: #DC2626 !important;
        }
      `}</style>

      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <ExclamationCircleOutlined style={{ fontSize: '48px', color: '#EF4444', marginBottom: '16px' }} />
        <h3 style={{ margin: 0, marginBottom: '8px', fontSize: '18px', fontWeight: 600 }}>
          Are you sure you want to delete this user?
        </h3>
        <p style={{ color: '#666', margin: 0 }}>
          This action cannot be undone. All user data will be permanently removed.
        </p>
      </div>

      <Descriptions column={1} bordered size="small" style={{ marginBottom: '24px' }}>
        <Descriptions.Item label="Name">{user.displayName || 'N/A'}</Descriptions.Item>
        <Descriptions.Item label="Email">{user.email || 'N/A'}</Descriptions.Item>
        <Descriptions.Item label="Role">{user.role || 'user'}</Descriptions.Item>
        <Descriptions.Item label="Status">{user.status || 'active'}</Descriptions.Item>
      </Descriptions>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <Button 
          className="delete-cancel-btn"
          onClick={onClose}
          disabled={processing}
        >
          Cancel
        </Button>
        <Button 
          className="delete-confirm-btn"
          onClick={() => onDelete(user.id)}
          loading={processing}
        >
          Delete User
        </Button>
      </div>
    </Modal>
  );
}
