import React, { useState } from 'react';
import { Modal, Form, Input, InputNumber, Checkbox, Button, Typography, Divider, App } from 'antd';
import './Modal.css';

const { TextArea } = Input;
const { Text } = Typography;

export default function PartsRequestModal({ parts, service, onSubmit, onClose, open }) {
  const [form] = Form.useForm();
  const [selectedParts, setSelectedParts] = useState([]);
  const { message: messageApi } = App.useApp();

  const handleSubmit = (values) => {
    const requestData = {
      parts: selectedParts,
      urgent: values.urgent || false,
      notes: values.notes || ''
    };
    onSubmit(requestData);
    messageApi.success('Parts request submitted successfully!');
    form.resetFields();
    setSelectedParts([]);
  };

  const handlePartSelection = (partId, quantity) => {
    setSelectedParts(prev => {
      const existing = prev.find(p => p.partId === partId);
      if (quantity <= 0) {
        return prev.filter(p => p.partId !== partId);
      }
      if (existing) {
        return prev.map(p => 
          p.partId === partId ? { ...p, quantity: Number(quantity) } : p
        );
      }
      return [...prev, { partId, quantity: Number(quantity) }];
    });
  };

  const handleCancel = () => {
    form.resetFields();
    setSelectedParts([]);
    onClose();
  };

  return (
    <Modal
      open={open}
      title="Request Parts"
      onCancel={handleCancel}
      footer={null}
      width={600}
      centered
      destroyOnHidden
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
        .ant-input-number:hover,
        .ant-input-number:focus {
          border-color: #FFC300 !important;
        }
        .ant-input:focus,
        .ant-input-focused,
        .ant-input-number:focus {
          border-color: #FFC300 !important;
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
        .partsreq-cancel-btn {
          height: 42px;
          border-radius: 8px;
          border-color: #FFC300 !important;
          color: #FFC300 !important;
          background: transparent !important;
        }
        .partsreq-cancel-btn:hover:not(:disabled) {
          border-color: #FFD54F !important;
          color: #FFD54F !important;
          background: transparent !important;
        }
        .partsreq-submit-btn {
          height: 42px;
          border-radius: 8px;
          background: linear-gradient(135deg, #FFC300, #FFD54F) !important;
          border-color: #FFC300 !important;
          color: #000 !important;
          font-weight: 600;
        }
        .partsreq-submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #FFD54F, #FFEB3B) !important;
          border-color: #FFD54F !important;
        }
      `}</style>

      <div style={{ marginBottom: 16, padding: 12, background: '#FFF9E6', borderRadius: 8, border: '1px solid #FFC300' }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13 }}>
          <Text><strong>Customer:</strong> {service?.customerName || 'N/A'}</Text>
          <Text><strong>Vehicle:</strong> {service?.vehicle || 'N/A'}</Text>
          <Text><strong>Type:</strong> {service?.type || 'N/A'}</Text>
        </div>
      </div>

      <Divider orientation="left" style={{ margin: '12px 0 16px' }}>Select Parts</Divider>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: 12,
          marginBottom: 16,
          maxHeight: 300,
          overflowY: 'auto',
          padding: '8px 4px'
        }}>
          {parts && parts.length > 0 ? parts.map(part => (
            <div key={part.id} style={{ 
              background: '#f9fafb', 
              borderRadius: 8, 
              padding: 12,
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ fontWeight: 600, color: '#232b3e', marginBottom: 4 }}>
                {part.name}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#9CA3AF', marginBottom: 8 }}>
                Stock: {part.quantity}
              </div>
              <InputNumber
                min={0}
                max={part.quantity}
                placeholder="Qty"
                style={{ width: '100%' }}
                onChange={(val) => handlePartSelection(part.id, val || 0)}
              />
            </div>
          )) : (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 24, color: '#9CA3AF' }}>
              No parts available
            </div>
          )}
        </div>

        <Form.Item
          label="Notes"
          name="notes"
        >
          <TextArea 
            rows={3} 
            placeholder="Add any additional notes..."
            size="large"
          />
        </Form.Item>

        <Form.Item name="urgent" valuePropName="checked">
          <Checkbox>Mark as Urgent</Checkbox>
        </Form.Item>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
          <Button 
            className="partsreq-cancel-btn"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button 
            type="primary"
            className="partsreq-submit-btn"
            htmlType="submit"
            disabled={selectedParts.length === 0}
          >
            Submit Request
          </Button>
        </div>
      </Form>
    </Modal>
  );
}