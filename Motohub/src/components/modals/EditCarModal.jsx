import React, { useState, useRef } from 'react';
import { Info, X, Image as ImageIcon } from 'lucide-react';
import { Modal, Form, Input, Select, InputNumber, Tooltip, Button, App } from 'antd';
import './Modal.css';

export default function EditCarModal({ vehicle, onSubmit, onClose }) {
  const [form] = Form.useForm();
  const [imagePreview, setImagePreview] = useState(vehicle?.imageUrl || null);
  const [imageBase64, setImageBase64] = useState(vehicle?.imageUrl || null);
  const fileInputRef = useRef(null);
  const { message: messageApi } = App.useApp();

  const fieldInfo = {
    make: "Enter the vehicle manufacturer (e.g., Toyota, Honda, Ford)",
    model: "Enter the specific model name (e.g., Camry, Civic, Mustang)",
    year: "Enter the year the vehicle was manufactured",
    plateNumber: "Enter your vehicle's license plate number",
    engine: "Enter engine specifications (e.g., 2.0L Turbo, V6 3.5L)",
    transmission: "Select the type of transmission your vehicle has",
    mileage: "Enter the current odometer reading in kilometers",
    image: "Upload a photo of your vehicle (optional)"
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        messageApi.error('Please select an image file');
        return;
      }

      // Validate file size (2MB max for base64 storage in Firestore)
      if (file.size > 2 * 1024 * 1024) {
        messageApi.error('Image size should be less than 2MB');
        return;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setImagePreview(base64String);
        setImageBase64(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageBase64(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFinish = async (values) => {
    try {
      await onSubmit({
        ...values,
        imageUrl: imageBase64 // Store base64 string directly
      });
      messageApi.success('Vehicle updated successfully!');
    } catch (error) {
      console.error('Error updating vehicle:', error);
      messageApi.error('Failed to update vehicle');
    }
  };

  return (
    <Modal
      open={true}
      title="Edit Vehicle"
      onCancel={onClose}
      footer={null}
      width={600}
      destroyOnHidden
      maskClosable={false}
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
        .editcar-cancel-btn {
          height: 40px;
          border-radius: 8px;
          border-color: #FFC300 !important;
          color: #FFC300 !important;
          background: transparent !important;
        }
        .editcar-cancel-btn:hover:not(:disabled) {
          border-color: #FFD54F !important;
          color: #FFD54F !important;
          background: transparent !important;
        }
        .editcar-submit-btn {
          height: 40px;
          border-radius: 8px;
          background: linear-gradient(135deg, #FFC300, #FFD54F) !important;
          border-color: #FFC300 !important;
          color: #000 !important;
          font-weight: 600;
        }
        .editcar-submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #FFD54F, #FFEB3B) !important;
          border-color: #FFD54F !important;
        }
        .image-upload-area {
          border: 2px dashed #e2e8f0;
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: #f7fafc;
          margin-bottom: 1rem;
        }
        .image-upload-area:hover {
          border-color: #FFC300;
          background: #fffbf0;
        }
        .image-preview-container {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 1rem;
        }
        .image-preview {
          width: 100%;
          height: 200px;
          object-fit: cover;
          border-radius: 12px;
        }
        .image-remove-btn {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          background: rgba(239, 68, 68, 0.9);
          color: white;
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .image-remove-btn:hover {
          background: rgba(220, 38, 38, 1);
          transform: scale(1.1);
        }
      `}</style>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          make: vehicle?.make || '',
          model: vehicle?.model || '',
          year: vehicle?.year || null,
          plateNumber: vehicle?.plateNumber || '',
          engine: vehicle?.engine || '',
          transmission: vehicle?.transmission || '',
          mileage: vehicle?.mileage || null
        }}
      >
        <Form.Item
          label={<span>VEHICLE IMAGE <Tooltip title={fieldInfo.image}><Info size={14} /></Tooltip></span>}
        >
          {imagePreview ? (
            <div className="image-preview-container">
              <img src={imagePreview} alt="Vehicle preview" className="image-preview" />
              <button
                type="button"
                className="image-remove-btn"
                onClick={handleRemoveImage}
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <div
              className="image-upload-area"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon size={48} style={{ color: '#a0aec0', marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '0.875rem', color: '#718096', marginBottom: '0.25rem' }}>
                Click to upload vehicle image
              </div>
              <div style={{ fontSize: '0.75rem', color: '#a0aec0' }}>
                JPG, PNG up to 2MB
              </div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageSelect}
          />
        </Form.Item>

        <Form.Item
          label={<span>MAKE <Tooltip title={fieldInfo.make}><Info size={14} /></Tooltip></span>}
          name="make"
          rules={[{ required: true, message: 'Please enter the make' }]}
        >
          <Input placeholder="e.g., Toyota" />
        </Form.Item>

        <Form.Item
          label={<span>MODEL <Tooltip title={fieldInfo.model}><Info size={14} /></Tooltip></span>}
          name="model"
          rules={[{ required: true, message: 'Please enter the model' }]}
        >
          <Input placeholder="e.g., Camry" />
        </Form.Item>

        <Form.Item
          label={<span>YEAR <Tooltip title={fieldInfo.year}><Info size={14} /></Tooltip></span>}
          name="year"
          rules={[{ required: true, message: 'Please enter the year' }]}
        >
          <InputNumber style={{ width: '100%' }} min={1886} max={2100} placeholder="e.g., 2020" />
        </Form.Item>

        <Form.Item
          label={<span>PLATE NUMBER <Tooltip title={fieldInfo.plateNumber}><Info size={14} /></Tooltip></span>}
          name="plateNumber"
          rules={[{ required: true, message: 'Please enter the plate number' }]}
        >
          <Input placeholder="e.g., ABC-1234" />
        </Form.Item>

        <Form.Item
          label={<span>ENGINE <Tooltip title={fieldInfo.engine}><Info size={14} /></Tooltip></span>}
          name="engine"
          rules={[{ required: true, message: 'Please enter engine details' }]}
        >
          <Input placeholder="e.g., 2.0L Turbo" />
        </Form.Item>

        <Form.Item
          label={<span>TRANSMISSION <Tooltip title={fieldInfo.transmission}><Info size={14} /></Tooltip></span>}
          name="transmission"
          rules={[{ required: true, message: 'Please select transmission' }]}
        >
          <Select placeholder="Select Transmission">
            <Select.Option value="Manual">Manual</Select.Option>
            <Select.Option value="Automatic">Automatic</Select.Option>
            <Select.Option value="CVT">CVT</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label={<span>CURRENT MILEAGE (KM) <Tooltip title={fieldInfo.mileage}><Info size={14} /></Tooltip></span>}
          name="mileage"
          rules={[{ required: true, message: 'Please enter current mileage' }]}
        >
          <InputNumber style={{ width: '100%' }} min={0} placeholder="e.g., 50000" />
        </Form.Item>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
          <Button 
            className="editcar-cancel-btn"
            onClick={onClose}
            style={{ height: '40px' }}
          >
            Cancel
          </Button>
          <Button 
            type="primary" 
            className="editcar-submit-btn"
            onClick={() => form.submit()}
            style={{ height: '40px' }}
          >
            Save Changes
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
