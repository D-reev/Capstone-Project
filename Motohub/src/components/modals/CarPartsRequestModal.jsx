import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Checkbox, Button, Typography, Divider, App, Select, Badge } from 'antd';
import { SearchOutlined, FilterOutlined } from '@ant-design/icons';
import './CarPartsRequestModal.css';

const { TextArea } = Input;
const { Text } = Typography;
const { Option } = Select;

export default function CarPartsRequestModal({ onSubmit, onClose, open, inventoryParts = [], initialParts = [] }) {
  const [form] = Form.useForm();
  const [selectedParts, setSelectedParts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const { message: messageApi } = App.useApp();

  // Initialize selected parts when modal opens
  useEffect(() => {
    if (open) {
      console.log('Modal opened with initialParts:', initialParts);
      if (initialParts.length > 0) {
        setSelectedParts([...initialParts]); // Create new array to ensure state update
      } else {
        setSelectedParts([]);
      }
      setSearchTerm('');
      setCategoryFilter('all');
    }
  }, [open, initialParts.length]); // Track length to detect changes without causing infinite loop

  const handleSubmit = (values) => {
    if (selectedParts.length === 0) {
      messageApi.error('Please add at least one part');
      return;
    }

    const requestData = {
      parts: selectedParts,
      urgent: values.urgent || false,
      notes: values.notes || ''
    };
    onSubmit(requestData);
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
    setSearchTerm('');
    setCategoryFilter('all');
    onClose();
  };

  // Get unique categories from parts
  const categories = ['all', ...new Set(inventoryParts?.map(part => part.category).filter(Boolean) || [])];

  // Filter parts based on search and category
  const filteredParts = inventoryParts?.filter(part => {
    const matchesSearch = part.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         part.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || part.category === categoryFilter;
    return matchesSearch && matchesCategory;
  }) || [];

  return (
    <Modal
      open={open}
      title="Add Parts to Service Report"
      onCancel={handleCancel}
      footer={null}
      width={800}
      centered
      destroyOnClose
      zIndex={1200}
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
        .ant-select:not(.ant-select-disabled):hover .ant-select-selector {
          border-color: #FFC300 !important;
        }
        .ant-input:focus,
        .ant-input-focused,
        .ant-input-number:focus,
        .ant-select-focused .ant-select-selector {
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
        .carpartsreq-cancel-btn {
          height: 42px;
          border-radius: 8px;
          border-color: #FFC300 !important;
          color: #FFC300 !important;
          background: transparent !important;
        }
        .carpartsreq-cancel-btn:hover:not(:disabled) {
          border-color: #FFD54F !important;
          color: #FFD54F !important;
          background: transparent !important;
        }
        .carpartsreq-submit-btn {
          height: 42px;
          border-radius: 8px;
          background: linear-gradient(135deg, #FFC300, #FFD54F) !important;
          border-color: #FFC300 !important;
          color: #000 !important;
          font-weight: 600;
        }
        .carpartsreq-submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #FFD54F, #FFEB3B) !important;
          border-color: #FFD54F !important;
        }
        .part-card {
          background: #ffffff;
          border-radius: 8px;
          padding: 16px;
          border: 2px solid #e5e7eb;
          transition: all 0.2s;
        }
        .part-card:hover {
          border-color: #FFC300;
          box-shadow: 0 2px 8px rgba(255, 195, 0, 0.15);
        }
        .part-card-selected {
          border-color: #FFC300;
          background: #FFF9E6;
        }
      `}</style>

      {/* Search and Filter Section */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
        <Input
          placeholder="Search parts by name or category..."
          prefix={<SearchOutlined style={{ color: '#9CA3AF' }} />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="large"
          style={{ flex: 1 }}
        />
        <Select
          value={categoryFilter}
          onChange={(value) => setCategoryFilter(value)}
          style={{ width: 180 }}
          size="large"
          suffixIcon={<FilterOutlined />}
        >
          <Option value="all">All Categories</Option>
          {categories.filter(cat => cat !== 'all').map(category => (
            <Option key={category} value={category}>
              {category}
            </Option>
          ))}
        </Select>
      </div>

      {/* Selected Parts Counter */}
      {selectedParts.length > 0 && (
        <div style={{ 
          marginBottom: 12, 
          padding: '8px 12px', 
          background: '#FFF9E6', 
          borderRadius: 6,
          border: '1px solid #FFC300',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Text strong style={{ color: '#000' }}>
            <Badge count={selectedParts.length} style={{ backgroundColor: '#FFC300' }} />
            <span style={{ marginLeft: 8 }}>
              {selectedParts.length} part{selectedParts.length !== 1 ? 's' : ''} selected
            </span>
          </Text>
          <Button 
            size="small" 
            type="link" 
            onClick={() => setSelectedParts([])}
            style={{ color: '#D97706' }}
          >
            Clear All
          </Button>
        </div>
      )}

      <Divider orientation="left" style={{ margin: '12px 0 16px', fontWeight: 600 }}>
        Available Parts ({filteredParts.length})
      </Divider>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
          gap: 12,
          marginBottom: 16,
          maxHeight: 400,
          overflowY: 'auto',
          padding: '8px 4px'
        }}>
          {filteredParts.length > 0 ? filteredParts.map(part => {
            const isSelected = selectedParts.some(p => p.partId === part.id);
            const selectedQty = selectedParts.find(p => p.partId === part.id)?.quantity || 0;
            
            return (
              <div 
                key={part.id} 
                className={`part-card ${isSelected ? 'part-card-selected' : ''}`}
              >
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontWeight: 600, color: '#111827', marginBottom: 4, fontSize: '15px' }}>
                    {part.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: 4 }}>
                    {part.category || 'Other'}
                  </div>
                  <div style={{ 
                    fontSize: '13px', 
                    color: part.quantity > 10 ? '#059669' : part.quantity > 0 ? '#F59E0B' : '#DC2626',
                    fontWeight: 500
                  }}>
                    Stock: {part.quantity}
                  </div>
                </div>
                <InputNumber
                  key={`${part.id}-${selectedQty}`}
                  min={0}
                  max={part.quantity}
                  placeholder="Quantity"
                  style={{ width: '100%' }}
                  value={selectedQty || undefined}
                  onChange={(val) => handlePartSelection(part.id, val || 0)}
                  disabled={part.quantity === 0}
                />
              </div>
            );
          }) : (
            <div style={{ 
              gridColumn: '1 / -1', 
              textAlign: 'center', 
              padding: 48, 
              color: '#9CA3AF' 
            }}>
              {searchTerm || categoryFilter !== 'all' 
                ? 'No parts found matching your filters' 
                : 'No parts available'}
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
            className="carpartsreq-cancel-btn"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button 
            type="primary"
            className="carpartsreq-submit-btn"
            htmlType="submit"
            disabled={selectedParts.length === 0}
          >
            {selectedParts.length > 0 ? `Add to Form (${selectedParts.length})` : 'Add to Form'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
