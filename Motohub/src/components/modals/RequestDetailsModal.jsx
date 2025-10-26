import React from 'react';
import { Modal, Button, Descriptions, Tag, Typography } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import './Modal.css';

const { Title, Text } = Typography;

export default function RequestDetailsModal({
  request,
  open,
  onClose,
  onApprove,
  onReject,
  processing = false
}) {
  if (!request) return null;

  if (!request) return null;

  return (
    <Modal
      open={open}
      title="Request Details"
      onCancel={onClose}
      footer={null}
      width={650}
      centered
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
        .reqdetails-close-btn {
          height: 42px;
          border-radius: 8px;
          border-color: #FFC300 !important;
          color: #FFC300 !important;
          background: transparent !important;
        }
        .reqdetails-close-btn:hover:not(:disabled) {
          border-color: #FFD54F !important;
          color: #FFD54F !important;
          background: transparent !important;
        }
        .reqdetails-approve-btn {
          height: 42px;
          border-radius: 8px;
          background: linear-gradient(135deg, #10B981, #059669) !important;
          border-color: #10B981 !important;
          color: #fff !important;
          font-weight: 600;
        }
        .reqdetails-approve-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #059669, #047857) !important;
          border-color: #059669 !important;
        }
        .reqdetails-reject-btn {
          height: 42px;
          border-radius: 8px;
          background: linear-gradient(135deg, #EF4444, #DC2626) !important;
          border-color: #EF4444 !important;
          color: #fff !important;
          font-weight: 600;
        }
        .reqdetails-reject-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #DC2626, #B91C1C) !important;
          border-color: #DC2626 !important;
        }
      `}</style>

      <Descriptions column={1} bordered size="small" style={{ marginBottom: '16px' }}>
        <Descriptions.Item label="Mechanic">
          {request.mechanicName || request.requesterName || 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Customer">
          {request.customerName || request.customer?.name || 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Vehicle">
          {request.car?.make} {request.car?.model}
          {request.car?.plateNumber ? ` (${request.car.plateNumber})` : ''}
        </Descriptions.Item>
        <Descriptions.Item label="Priority">
          <Tag color={request.priority === 'urgent' ? 'red' : 'default'}>
            {request.priority || 'normal'}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Notes">
          {request.notes || '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Requested">
          {request.createdAt ? (
            request.createdAt.toDate ? 
              request.createdAt.toDate().toLocaleString() : 
              new Date(request.createdAt).toLocaleString()
          ) : '—'}
        </Descriptions.Item>
      </Descriptions>

      <Title level={5} style={{ marginTop: 16, marginBottom: 12 }}>Parts Requested</Title>
      {Array.isArray(request.parts) && request.parts.length > 0 ? (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 8,
          marginBottom: 24
        }}>
          {request.parts.map((part, index) => (
            <div key={index} style={{ 
              background: '#f9fafb', 
              borderRadius: 8, 
              padding: '12px 16px',
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              borderLeft: '4px solid #FFC300'
            }}>
              <Text strong>{part.name}</Text>
              <div style={{ display: 'flex', gap: 16 }}>
                <Text type="secondary">Qty: {part.quantity}</Text>
                {part.price && <Text type="secondary">₱{part.price}</Text>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Text type="secondary" style={{ display: 'block', marginBottom: 24, fontStyle: 'italic' }}>
          No parts listed
        </Text>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        {request.status === 'pending' ? (
          <>
            <Button 
              className="reqdetails-approve-btn"
              icon={<CheckCircleOutlined />}
              onClick={() => onApprove(request.id)}
              disabled={processing}
              loading={processing}
            >
              Approve
            </Button>
            <Button 
              className="reqdetails-reject-btn"
              icon={<CloseCircleOutlined />}
              onClick={() => onReject(request.id)}
              disabled={processing}
            >
              Reject
            </Button>
            <Button 
              className="reqdetails-close-btn"
              onClick={onClose}
              disabled={processing}
            >
              Cancel
            </Button>
          </>
        ) : (
          <Button 
            className="reqdetails-close-btn"
            onClick={onClose}
          >
            Close
          </Button>
        )}
      </div>
    </Modal>
  );
}