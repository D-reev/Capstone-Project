import React, { useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, Button, Upload as AntUpload, App } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import './Modal.css';

const { TextArea } = Input;
const { Option } = Select;

export default function AddPartModal({ open = false, onClose = () => {}, onAdd = () => {} }) {
  const [form] = Form.useForm();
  const [imagePreview, setImagePreview] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { message: messageApi, modal } = App.useApp();

  const handleSubmit = async (values) => {
    // Show confirmation modal
    modal.confirm({
      title: 'Confirm Add Part',
      content: `Are you sure you want to add "${values.name}" to the inventory?`,
      okText: 'Yes, Add Part',
      cancelText: 'Cancel',
      centered: true,
      onOk: async () => {
        setIsSubmitting(true);
        try {
          // Filter out undefined values to prevent Firestore errors
          const partData = Object.entries({
            ...values,
            image: imageUrl || imagePreview || ''
          }).reduce((acc, [key, value]) => {
            if (value !== undefined) {
              acc[key] = value;
            }
            return acc;
          }, {});
          
          await onAdd(partData);
          messageApi.success('Part added successfully!');
          form.resetFields();
          setImagePreview('');
          setImageUrl('');
          onClose(); // Close modal after successful submission
        } catch (error) {
          console.error('Error adding part:', error);
          messageApi.error('Failed to add part');
        } finally {
          setIsSubmitting(false);
        }
      }
    });
  };

  const handleImageUpload = (file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setImageUrl('');
    };
    reader.readAsDataURL(file);
    return false; // Prevent auto upload
  };

  const handleUrlChange = (e) => {
    const url = e.target.value;
    setImageUrl(url);
    setImagePreview(url);
  };

  const handleCancel = () => {
    form.resetFields();
    setImagePreview('');
    setImageUrl('');
    onClose();
  };

  return (
    <Modal
      open={open}
      title="Add New Part"
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
        .ant-input-number:focus,
        .ant-input-number-focused,
        .ant-select:not(.ant-select-disabled):hover .ant-select-selector,
        .ant-select-focused:not(.ant-select-disabled) .ant-select-selector {
          border-color: #FFC300 !important;
        }
        .ant-input:focus,
        .ant-input-focused,
        .ant-input-number:focus,
        .ant-input-number-focused,
        .ant-select-focused .ant-select-selector {
          border-color: #FFC300 !important;
          box-shadow: 0 0 0 2px rgba(255, 195, 0, 0.1) !important;
          outline: none !important;
        }
        .addpart-cancel-btn {
          height: 42px;
          border-radius: 8px;
          border-color: #FFC300 !important;
          color: #FFC300 !important;
          background: transparent !important;
        }
        .addpart-cancel-btn:hover:not(:disabled) {
          border-color: #FFD54F !important;
          color: #FFD54F !important;
          background: transparent !important;
        }
        .addpart-submit-btn {
          height: 42px;
          border-radius: 8px;
          background: linear-gradient(135deg, #FFC300, #FFD54F) !important;
          border-color: #FFC300 !important;
          color: #000 !important;
          font-weight: 600;
        }
        .addpart-submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #FFD54F, #FFEB3B) !important;
          border-color: #FFD54F !important;
        }
      `}</style>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          status: 'available',
          quantity: 0,
          price: 0,
          minStock: 0
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Form.Item
            label="Part Name"
            name="name"
            rules={[
              { required: true, message: 'Please enter part name' },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  if (/^\d+$/.test(value.trim())) {
                    return Promise.reject(new Error('Part name cannot be only numbers'));
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <Input placeholder="Enter part name" size="large" />
          </Form.Item>

          <Form.Item
            label="Category"
            name="category"
            rules={[{ required: true, message: 'Please select category' }]}
          >
            <Select placeholder="Select Category" size="large">
              <Option value="Engine">Engine</Option>
              <Option value="Transmission">Transmission</Option>
              <Option value="Brake">Brake</Option>
              <Option value="Suspension">Suspension</Option>
              <Option value="Electrical">Electrical</Option>
              <Option value="Body">Body</Option>
              <Option value="Other">Other</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Initial Stock"
            name="quantity"
            rules={[
              { required: true, message: 'Please enter quantity' },
              {
                validator: (_, value) => {
                  if (value === null || value === undefined) return Promise.resolve();
                  if (value < 0) return Promise.reject(new Error('Quantity cannot be negative'));
                  return Promise.resolve();
                }
              }
            ]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              min={0}
              max={999999}
              placeholder="Enter quantity"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Price (₱)"
            name="price"
            rules={[
              { required: true, message: 'Please enter price' },
              {
                validator: (_, value) => {
                  if (value === null || value === undefined) return Promise.resolve();
                  if (value < 0) return Promise.reject(new Error('Price cannot be negative'));
                  return Promise.resolve();
                }
              }
            ]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              min={0}
              max={9999999}
              step={0.01}
              placeholder="Enter price"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Minimum Stock"
            name="minStock"
            rules={[
              { required: true, message: 'Please enter minimum stock' },
              {
                validator: (_, value) => {
                  if (value === null || value === undefined) return Promise.resolve();
                  if (value < 0) return Promise.reject(new Error('Minimum stock cannot be negative'));
                  return Promise.resolve();
                }
              }
            ]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              min={0}
              max={99999}
              placeholder="Enter minimum stock"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Status"
            name="status"
            rules={[{ required: true, message: 'Please select status' }]}
          >
            <Select size="large">
              <Option value="available">Available</Option>
              <Option value="low">Low Stock</Option>
              <Option value="unavailable">Unavailable</Option>
            </Select>
          </Form.Item>
        </div>

        <Form.Item label="Part Image">
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            {imagePreview && (
              <div style={{ 
                width: 80, 
                height: 80, 
                borderRadius: 8, 
                overflow: 'hidden', 
                border: '2px solid #FFC300' 
              }}>
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </div>
            )}
            <AntUpload
              beforeUpload={handleImageUpload}
              showUploadList={false}
              accept="image/*"
            >
              <Button icon={<UploadOutlined />}>Upload Image</Button>
            </AntUpload>
            <Input
              placeholder="Or enter image URL"
              value={imageUrl}
              onChange={handleUrlChange}
              style={{ maxWidth: '250px' }}
            />
          </div>
        </Form.Item>

        <Form.Item
          label="Description"
          name="description"
        >
          <TextArea 
            rows={3} 
            placeholder="Enter part description..."
            size="large"
          />
        </Form.Item>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
          <Button 
            className="addpart-cancel-btn"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="primary"
            className="addpart-submit-btn"
            htmlType="submit"
            loading={isSubmitting}
          >
            Add Part
          </Button>
        </div>
      </Form>
    </Modal>
  );
}