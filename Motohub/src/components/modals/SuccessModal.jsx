import React from 'react';
import { Modal, Button, Result } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import './Modal.css';

export default function SuccessModal({ open = false, message = 'Success', onClose = () => {} }) {
  return (
    <Modal
      open={open}
      title="Success"
      onCancel={onClose}
      footer={null}
      width={450}
      centered
      maskClosable
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
        .success-ok-btn {
          height: 42px;
          border-radius: 8px;
          background: linear-gradient(135deg, #FFC300, #FFD54F) !important;
          border-color: #FFC300 !important;
          color: #000 !important;
          font-weight: 600;
        }
        .success-ok-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #FFD54F, #FFEB3B) !important;
          border-color: #FFD54F !important;
        }
      `}</style>

      <Result
        icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
        title={message}
        style={{ padding: '24px 0' }}
      />

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
        <Button 
          type="primary"
          className="success-ok-btn"
          onClick={onClose}
          style={{ minWidth: '120px' }}
        >
          OK
        </Button>
      </div>
    </Modal>
  );
}