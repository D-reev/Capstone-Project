import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, Button, Upload as AntUpload, App, AutoComplete } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import './Modal.css';

const { TextArea } = Input;
const { Option } = Select;

export default function AddPartModal({ open = false, onClose = () => {}, onAdd = () => {} }) {
  const [form] = Form.useForm();
  const [imagePreview, setImagePreview] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unitPrice, setUnitPrice] = useState(0);
  const [markupPercentage, setMarkupPercentage] = useState(20);
  const [salesPrice, setSalesPrice] = useState(0);
  const [suppliers, setSuppliers] = useState([]);
  const { message: messageApi, modal } = App.useApp();
  const db = getFirestore();

  // Fetch existing suppliers
  useEffect(() => {
    if (open) {
      fetchSuppliers();
    }
  }, [open]);

  const fetchSuppliers = async () => {
    try {
      const inventoryRef = collection(db, 'inventory');
      const snapshot = await getDocs(inventoryRef);
      const supplierSet = new Set();
      
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.supplier && data.supplier.trim()) {
          supplierSet.add(data.supplier.trim());
        }
      });
      
      setSuppliers(Array.from(supplierSet).sort());
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  // Calculate sales price whenever unit price or markup changes
  const calculateSalesPrice = (unit, markup) => {
    const calculated = unit * (1 + markup / 100);
    const rounded = Math.round(calculated * 100) / 100;
    setSalesPrice(rounded);
    form.setFieldsValue({ price: rounded });
  };

  const handleUnitPriceChange = (value) => {
    setUnitPrice(value || 0);
    calculateSalesPrice(value || 0, markupPercentage);
  };

  const handleMarkupChange = (value) => {
    setMarkupPercentage(value || 0);
    calculateSalesPrice(unitPrice, value || 0);
  };

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
    setUnitPrice(0);
    setMarkupPercentage(20);
    setSalesPrice(0);
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
      zIndex={1050}
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
          unitPrice: 0,
          markupPercentage: 20,
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
              },
              {
                validator: async (_, value) => {
                  if (!value || !value.trim()) return Promise.resolve();
                  
                  try {
                    const inventoryRef = collection(db, 'inventory');
                    const snapshot = await getDocs(inventoryRef);
                    
                    const duplicate = snapshot.docs.some(doc => {
                      const data = doc.data();
                      return data.name?.toLowerCase().trim() === value.toLowerCase().trim();
                    });
                    
                    if (duplicate) {
                      return Promise.reject(new Error('A part with this name already exists'));
                    }
                    return Promise.resolve();
                  } catch (error) {
                    console.error('Error checking duplicate:', error);
                    return Promise.resolve(); // Don't block if check fails
                  }
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
              <Option value="Accessories">Accessories</Option>
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
              max={999999}
              placeholder="Enter reorder level"
              size="large"
            />
          </Form.Item>
          <Form.Item
            label="Unit Price (₱)"
            name="unitPrice"
            rules={[
              { required: true, message: 'Please enter unit price' },
              {
                validator: (_, value) => {
                  if (value === null || value === undefined) return Promise.resolve();
                  if (value < 0) return Promise.reject(new Error('Unit price cannot be negative'));
                  return Promise.resolve();
                }
              }
            ]}
            tooltip="The cost price you paid for this part"
          >
            <InputNumber 
              style={{ width: '100%' }} 
              max={9999999}
              step={0.01}
              placeholder="Enter unit price"
              size="large"
              onChange={handleUnitPriceChange}
            />
          </Form.Item>

          <Form.Item
            label="Markup (%)"
            name="markupPercentage"
            rules={[
              { required: true, message: 'Please enter markup percentage' },
              {
                validator: (_, value) => {
                  if (value === null || value === undefined) return Promise.resolve();
                  if (value < 0) return Promise.reject(new Error('Markup cannot be negative'));
                  return Promise.resolve();
                }
              }
            ]}
            tooltip="Profit margin percentage"
          >
            <InputNumber 
              style={{ width: '100%' }} 
              max={1000}
              step={1}
              placeholder="Enter markup %"
              size="large"
              onChange={handleMarkupChange}
            />
          </Form.Item>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Form.Item
            label="Sales Price (₱)"
            name="price"
            tooltip="Automatically calculated from Unit Price + Markup"
          >
            <InputNumber 
              style={{ width: '100%', background: '#f3f4f6' }} 
              value={salesPrice}
              disabled
              size="large"
              formatter={value => `₱ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/₱\s?|(,*)/g, '')}
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
              max={999999}
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

          <Form.Item
            label="Supplier"
            name="supplier"
            rules={[{ required: true, message: 'Please enter supplier name' }]}
          >
            <AutoComplete
              options={suppliers.map(s => ({ value: s }))}
              placeholder="Enter or select supplier name"
              size="large"
              filterOption={(inputValue, option) =>
                option.value.toLowerCase().includes(inputValue.toLowerCase())
              }
            />
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