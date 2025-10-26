import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, Button, Upload as AntUpload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import './Modal.css';

const { TextArea } = Input;
const { Option } = Select;

export default function EditPartModal({ part, onClose, onUpdate, open = false }) {
  const [form] = Form.useForm();
  const [imagePreview, setImagePreview] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (part && open) {
      form.setFieldsValue({
        name: part.name,
        category: part.category,
        quantity: part.quantity,
        price: part.price,
        minStock: part.minStock,
        status: part.status,
        description: part.description || ''
      });
      setImagePreview(part.image || '');
      setImageUrl(part.image || '');
    }
  }, [part, open, form]);

  const handleImageUpload = (file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setImageUrl('');
    };
    reader.readAsDataURL(file);
    return false;
  };

  const handleUrlChange = (e) => {
    const url = e.target.value;
    setImageUrl(url);
    setImagePreview(url);
  };

  const handleSubmit = async (values) => {
    const updatedData = {
      ...values,
      image: imageUrl || imagePreview
    };
    onUpdate(part.id, updatedData);
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
      title="Edit Part"
      onCancel={handleCancel}
      footer={null}
      width={600}
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
        .editpart-cancel-btn {
          height: 42px;
          border-radius: 8px;
          border-color: #FFC300 !important;
          color: #FFC300 !important;
          background: transparent !important;
        }
        .editpart-cancel-btn:hover:not(:disabled) {
          border-color: #FFD54F !important;
          color: #FFD54F !important;
          background: transparent !important;
        }
        .editpart-submit-btn {
          height: 42px;
          border-radius: 8px;
          background: linear-gradient(135deg, #FFC300, #FFD54F) !important;
          border-color: #FFC300 !important;
          color: #000 !important;
          font-weight: 600;
        }
        .editpart-submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #FFD54F, #FFEB3B) !important;
          border-color: #FFD54F !important;
        }
      `}</style>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Form.Item
            label="Part Name"
            name="name"
            rules={[{ required: true, message: 'Please enter part name' }]}
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
            label="Stock"
            name="quantity"
            rules={[{ required: true, message: 'Please enter quantity' }]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              min={0} 
              placeholder="Enter quantity"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Price (₱)"
            name="price"
            rules={[{ required: true, message: 'Please enter price' }]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              min={0} 
              step={0.01}
              placeholder="Enter price"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Minimum Stock"
            name="minStock"
            rules={[{ required: true, message: 'Please enter minimum stock' }]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              min={0}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
            {imagePreview && (
              <div style={{ 
                width: 150, 
                height: 150, 
                borderRadius: 12, 
                overflow: 'hidden', 
                border: '2px solid #FFC300',
                marginBottom: '8px'
              }}>
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
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
            className="editpart-cancel-btn"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button 
            type="primary"
            className="editpart-submit-btn"
            htmlType="submit"
          >
            Update Part
          </Button>
        </div>
      </Form>
    </Modal>
  );
}