import React, { useState } from 'react';
import { Modal, Input, Button, InputNumber, App } from 'antd';
import { PackagePlus } from 'lucide-react';

export default function RestockModal({ part, open, onClose, onRestock }) {
  const [quantity, setQuantity] = useState(0);
  const [supplier, setSupplier] = useState(part?.supplier || '');
  const [loading, setLoading] = useState(false);
  const { message: messageApi, modal } = App.useApp();

  const handleRestock = async () => {
    if (!quantity || quantity <= 0) {
      messageApi.error('Please enter a valid positive quantity');
      return;
    }

    if (quantity < 0) {
      messageApi.error('Quantity cannot be negative');
      return;
    }

    // Show confirmation modal
    modal.confirm({
      title: 'Confirm Restock',
      content: `Are you sure you want to add ${quantity} units to "${part.name}"? New stock will be ${(part?.quantity || 0) + quantity} units.`,
      okText: 'Yes, Restock',
      cancelText: 'Cancel',
      centered: true,
      onOk: async () => {
        setLoading(true);
        try {
          const newQuantity = (part?.quantity || 0) + quantity;
          const updates = {
            quantity: newQuantity,
            lastRestocked: new Date().toISOString()
          };
          
          // Only add supplier if it has a value
          if (supplier && supplier.trim()) {
            updates.supplier = supplier.trim();
          } else if (part?.supplier) {
            updates.supplier = part.supplier;
          }
          
          await onRestock(part.id, updates);
          messageApi.success(`Successfully restocked ${quantity} units!`);
          setQuantity(0);
          setSupplier('');
          onClose(); // Close modal after successful restock
        } catch (error) {
          console.error('Error restocking:', error);
          messageApi.error('Failed to restock part');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleClose = () => {
    setQuantity(0);
    setSupplier('');
    onClose();
  };

  if (!part) return null;

  const currentStock = part?.quantity || 0;
  const newStock = currentStock + (quantity || 0);

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <PackagePlus size={24} color="#FBBF24" />
          <span>Restock Inventory</span>
        </div>
      }
      open={open}
      onCancel={handleClose}
      width={550}
      footer={[
        <Button
          key="cancel"
          size="large"
          onClick={handleClose}
          disabled={loading}
        >
          Cancel
        </Button>,
        <Button
          key="restock"
          type="primary"
          size="large"
          onClick={handleRestock}
          loading={loading}
          icon={<PackagePlus size={18} />}
          style={{
            background: '#FBBF24',
            borderColor: '#FBBF24',
            color: '#111827',
            fontWeight: 600,
          }}
        >
          Confirm Restock
        </Button>,
      ]}
    >
      <div style={{ padding: '1rem 0' }}>
        {/* Part Info */}
        <div style={{
          padding: '1rem',
          background: '#FEF3C7',
          borderRadius: '8px',
          borderLeft: '4px solid #FBBF24',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#92400E', fontSize: '1.1rem' }}>
            {part.name}
          </h3>
          <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#6B7280' }}>
            Category: <span style={{ fontWeight: 600 }}>{part.category || 'N/A'}</span>
          </p>
          <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#6B7280' }}>
            Current Stock: <span style={{ 
              fontWeight: 600,
              color: currentStock <= (part.minStock || 0) ? '#DC2626' : '#059669'
            }}>
              {currentStock} units
            </span>
          </p>
        </div>

        {/* Restock Quantity */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: 600,
            color: '#374151',
            fontSize: '0.95rem'
          }}>
            Quantity to Add *
          </label>
          <InputNumber
            size="large"
            min={1}
            max={99999}
            value={quantity}
            onChange={setQuantity}
            placeholder="Enter quantity to add"
            style={{ width: '100%' }}
            addonAfter="units"
          />
        </div>

        {/* Supplier */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: 600,
            color: '#374151',
            fontSize: '0.95rem'
          }}>
            Supplier (Optional)
          </label>
          <Input
            size="large"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            placeholder="Enter supplier name"
          />
        </div>

        {/* Stock Summary */}
        {quantity > 0 && (
          <div style={{
            padding: '1rem',
            background: '#F3F4F6',
            borderRadius: '8px',
            border: '1px solid #E5E7EB'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem'
            }}>
              <span style={{ color: '#6B7280', fontSize: '0.875rem' }}>Current Stock:</span>
              <span style={{ fontWeight: 600, color: '#374151' }}>{currentStock} units</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem'
            }}>
              <span style={{ color: '#6B7280', fontSize: '0.875rem' }}>Adding:</span>
              <span style={{ fontWeight: 600, color: '#059669' }}>+{quantity} units</span>
            </div>
            <div style={{
              height: '1px',
              background: '#E5E7EB',
              margin: '0.75rem 0'
            }} />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontWeight: 600, color: '#374151' }}>New Stock:</span>
              <span style={{
                fontWeight: 700,
                color: '#059669',
                fontSize: '1.1rem'
              }}>
                {newStock} units
              </span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
