import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Modal, Form, Input, InputNumber, Checkbox, List, Typography, Divider, Empty, Spin, message } from 'antd';
import { getFirestore, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { createPartsRequest } from '../../utils/auth';
import './CarPartsRequestModal.css';

const { TextArea } = Input;
const { Text } = Typography;

export default function CarPartsRequestModal({ car, customer, onSubmit, onClose, open }) {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [availableParts, setAvailableParts] = useState([]);
  const [selectedParts, setSelectedParts] = useState([]); // [{ partId, name, price, quantity }]
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const db = getFirestore();

  const isOpen = open ?? true;

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      const partsRef = collection(db, 'inventory');
      const q = query(partsRef, where('quantity', '>', 0), orderBy('quantity', 'desc'));
      const snapshot = await getDocs(q);

      const partsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setAvailableParts(partsData);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      if (err?.code === 'permission-denied') {
        message.error('Not authorized to read inventory. Check Firestore rules.');
      } else if (err?.code === 'failed-precondition') {
        message.error('Missing Firestore index for this query. Create the suggested index from the console link.');
      } else {
        message.error('Failed to load inventory');
      }
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    if (isOpen) fetchInventory();
  }, [isOpen, fetchInventory]);

  const handleQuantityChange = (part, qty) => {
    const quantity = Number(qty || 0);
    setSelectedParts(prev => {
      const next = [...prev];
      const idx = next.findIndex(p => p.partId === part.id);

      if (!quantity || quantity <= 0) {
        if (idx >= 0) next.splice(idx, 1);
        return next;
      }

      if (quantity > part.quantity) {
        message.warning(`Only ${part.quantity} in stock for ${part.name}`);
        return next;
      }

      if (idx >= 0) {
        next[idx] = { ...next[idx], quantity };
      } else {
        next.push({ partId: part.id, name: part.name, price: part.price, quantity });
      }
      return next;
    });
  };

  const selectedMap = useMemo(() => {
    const map = new Map();
    selectedParts.forEach(p => map.set(p.partId, p.quantity));
    return map;
  }, [selectedParts]);

  const totalCost = useMemo(
    () => selectedParts.reduce((sum, p) => sum + (Number(p.price || 0) * Number(p.quantity || 0)), 0),
    [selectedParts]
  );

  const resetState = () => {
    setSelectedParts([]);
    form.resetFields();
  };

  const handleCancel = () => {
    resetState();
    onClose?.();
  };

  const handleFinish = async (values) => {
    if (selectedParts.length === 0) {
      message.error('Please add at least one part to the request');
      return;
    }
    if (!car || !customer || !user) {
      message.error('Missing required information');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        car: {
          id: car.id,
          make: car.make,
          model: car.model,
          year: car.year,
          plateNumber: car.plateNumber,
        },
        customer: {
          id: customer.id,
          displayName: customer.displayName,
        },
        parts: selectedParts,
        urgent: !!values.urgent,
        notes: values.notes || '',
      };

      await createPartsRequest(payload, user.uid);

      // Success alert (toast)
      message.success({
        content: (
          <div>
            <div><b>Parts request submitted</b></div>
            <div>Vehicle: {car.year} {car.make} {car.model} • {car.plateNumber}</div>
            <div>Items: {selectedParts.length} • Total: ₱{totalCost.toLocaleString()}</div>
          </div>
        ),
        duration: 4,
        className: 'mh-yellow-message'
      });

      onSubmit?.(payload);
      handleCancel();
    } catch (err) {
      console.error('Error submitting request:', err);
      message.error(err?.message || 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title="Request Parts for Vehicle"
      open={isOpen}
      onCancel={handleCancel}
      footer={null}
      width={640}
      destroyOnHidden
      maskClosable={!isSubmitting}
      afterOpenChange={(visible) => { if (visible) fetchInventory(); }}
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
        .ant-input-number:hover,
        .ant-input-number:focus,
        .ant-input-number-focused {
          border-color: #FFC300 !important;
        }
        .ant-input-number:focus,
        .ant-input-number-focused {
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
          height: 40px;
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
          height: 40px;
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
      `}</style>
      <div style={{ marginBottom: 16, padding: 12, background: '#f7fafc', borderRadius: 8 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 13 }}>
          <Text><b>Owner:</b> {customer?.displayName || 'Unknown'}</Text>
          <Text><b>Vehicle:</b> {car ? `${car.year} ${car.make} ${car.model}` : 'N/A'}</Text>
          <Text><b>Plate:</b> {car?.plateNumber || 'N/A'}</Text>
        </div>
      </div>

      <Divider orientation="left" style={{ margin: '12px 0' }}>Select Parts</Divider>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
          <Spin />
        </div>
      ) : availableParts.length > 0 ? (
        <List
          dataSource={availableParts}
          style={{ maxHeight: 260, overflowY: 'auto', marginBottom: 12 }}
          renderItem={(part) => (
            <List.Item
              key={part.id}
              className="mh-part-item"
              actions={[
                <InputNumber
                  key="qty"
                  min={0}
                  max={Number(part.quantity) || 0}
                  precision={0}
                  value={selectedMap.get(part.id) ?? 0}
                  onChange={(val) => handleQuantityChange(part, val)}
                  style={{ width: 90 }}
                  placeholder="Qty"
                />
              ]}
            >
              <List.Item.Meta
                title={<b>{part.name}</b>}
                description={
                  <div style={{ color: '#666' }}>
                    Available: {part.quantity} • Price: ₱{Number(part.price || 0).toLocaleString()}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      ) : (
        <Empty description="No parts available in inventory" style={{ padding: '24px 0' }} />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{ notes: '', urgent: false }}
      >
        <Form.Item label="Notes" name="notes">
          <TextArea rows={3} placeholder="Add any additional notes..." />
        </Form.Item>
        <Form.Item name="urgent" valuePropName="checked" style={{ marginBottom: 8 }}>
          <Checkbox>Mark as Urgent</Checkbox>
        </Form.Item>

        <div className="mh-total-row">
          <Text type="secondary">
            Selected parts: {selectedParts.length}
          </Text>
          <Text strong>
            Total: ₱{totalCost.toLocaleString()}
          </Text>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
          <Button 
            className="carpartsreq-cancel-btn"
            onClick={handleCancel}
            disabled={isSubmitting}
            style={{ height: '40px' }}
          >
            Cancel
          </Button>
          <Button 
            type="primary" 
            className="carpartsreq-submit-btn"
            onClick={() => form.submit()}
            loading={isSubmitting}
            disabled={selectedParts.length === 0}
            style={{ height: '40px' }}
          >
            Submit Request
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
