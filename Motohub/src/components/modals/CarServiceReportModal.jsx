import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, message, Spin, Button } from 'antd';
import { getFirestore, collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import './Modal.css';

const { TextArea } = Input;
const { Option } = Select;

export default function CarServiceReportModal({ car, customer, open, onSubmit, onClose }) {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [reportData, setReportData] = useState({
    diagnosis: '',
    workPerformed: '',
    recommendations: '',
    laborHours: 0,
    laborCost: 0,
    partsUsed: [],
    totalCost: 0,
    status: 'completed',
    timestamp: new Date().toISOString(),
    mechanicId: user?.uid || ''
  });
  const [availableParts, setAvailableParts] = useState([]);
  const [serviceHistory, setServiceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const db = getFirestore();

  useEffect(() => {
    const fetchData = async () => {
      if (!open || !user || !car || !customer) {
        return;
      }

      try {
        setLoading(true);

        // Fetch available parts from inventory
        const partsRef = collection(db, 'inventory');
        const partsSnapshot = await getDocs(query(partsRef, 
          where('status', '==', 'available')
        ));
        const partsData = partsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAvailableParts(partsData);

        // Fetch car's service history with proper path
        const historyPath = `users/${customer.id}/cars/${car.id}/serviceHistory`;
        const historyRef = collection(db, historyPath);
        const historySnapshot = await getDocs(historyRef);
        const historyData = historySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setServiceHistory(historyData);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        message.error(err.message || 'Failed to load necessary data');
        setLoading(false);
      }
    };

    fetchData();
  }, [db, car, customer, user, open]);

  const handlePartSelection = (partId, quantity) => {
    const selectedPart = availableParts.find(p => p.id === partId);
    if (!selectedPart) return;

    setReportData(prev => {
      const existingPart = prev.partsUsed.find(p => p.partId === partId);
      if (existingPart) {
        return {
          ...prev,
          partsUsed: prev.partsUsed.map(p =>
            p.partId === partId
              ? { ...p, quantity: Number(quantity) }
              : p
          ),
          totalCost: calculateTotalCost(prev.partsUsed, prev.laborHours, prev.laborCost)
        };
      }
      return {
        ...prev,
        partsUsed: [...prev.partsUsed, {
          partId,
          name: selectedPart.name,
          price: selectedPart.price,
          quantity: Number(quantity)
        }],
        totalCost: calculateTotalCost([...prev.partsUsed, {
          partId,
          price: selectedPart.price,
          quantity: Number(quantity)
        }], prev.laborHours, prev.laborCost)
      };
    });
  };

  const calculateTotalCost = (parts, hours, rate) => {
    const partsCost = parts.reduce((sum, part) => sum + (part.price * part.quantity), 0);
    const laborCost = hours * rate;
    return partsCost + laborCost;
  };

  const handleServiceReport = async (reportPayload) => {
    try {
      // Correct nested path
      const serviceHistoryRef = collection(
        db,
        `users/${reportPayload.customerId}/cars/${reportPayload.carId}/serviceHistory`
      );

      await addDoc(serviceHistoryRef, reportPayload);
      console.log("✅ Service report saved successfully!");
    } catch (err) {
      console.error("❌ Error saving service report:", err);
      throw err; // Propagate error for error handling in handleSubmit
    }
  };

  const handleSubmit = async () => {
    if (!user?.uid) {
      message.error('You must be logged in as a mechanic to submit a report');
      return;
    }

    try {
      const values = await form.validateFields();
      setIsSubmitting(true);

      const reportPayload = {
        diagnosis: values.diagnosis,
        workPerformed: values.workPerformed,
        recommendations: values.recommendations || '',
        partsUsed: reportData.partsUsed,
        laborCost: values.laborCost || 0,
        totalCost: reportData.totalCost,
        status: values.status,
        timestamp: new Date().toISOString(),
        mechanicId: user.uid,
        customerId: customer.id,
        carId: car.id,
        vehicle: `${car.year} ${car.make} ${car.model}`,
        plateNumber: car.plateNumber
      };

      await handleServiceReport(reportPayload);
      message.success('Service report submitted successfully!');
      form.resetFields();
      setReportData({
        diagnosis: '',
        workPerformed: '',
        recommendations: '',
        laborHours: 0,
        laborCost: 0,
        partsUsed: [],
        totalCost: 0,
        status: 'completed',
        timestamp: new Date().toISOString(),
        mechanicId: user?.uid || ''
      });
      onSubmit(reportPayload);
    } catch (error) {
      if (error.errorFields) {
        message.error('Please fill in all required fields');
      } else {
        console.error('Error submitting report:', error);
        message.error(error.message || 'Failed to submit service report');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setReportData({
      diagnosis: '',
      workPerformed: '',
      recommendations: '',
      laborHours: 0,
      laborCost: 0,
      partsUsed: [],
      totalCost: 0,
      status: 'completed',
      timestamp: new Date().toISOString(),
      mechanicId: user?.uid || ''
    });
    onClose();
  };

  if (error) return <div className="modal-error">{error}</div>;

  return (
    <Modal
      title="Car Service Report"
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={800}
      destroyOnHidden
      centered
      maskClosable={!isSubmitting}
    >
      <style>
        {`
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
          .ant-select:not(.ant-select-disabled):hover .ant-select-selector,
          .ant-select-focused:not(.ant-select-disabled) .ant-select-selector,
          .ant-picker:hover .ant-picker-input,
          .ant-picker-focused .ant-picker-input,
          .ant-checkbox-wrapper:hover .ant-checkbox-inner,
          .ant-checkbox:hover .ant-checkbox-inner {
            border-color: #FFC300 !important;
          }
          .ant-input:focus,
          .ant-input-focused,
          .ant-input-number:focus,
          .ant-select-focused .ant-select-selector,
          .ant-picker-focused {
            border-color: #FFC300 !important;
            box-shadow: 0 0 0 2px rgba(255, 195, 0, 0.1) !important;
            outline: none !important;
          }
          .ant-checkbox-checked .ant-checkbox-inner {
            background-color: #FFC300 !important;
            border-color: #FFC300 !important;
          }
          .carservicereport-cancel-btn {
            height: 40px;
            border-radius: 8px;
            border-color: #FFC300 !important;
            color: #FFC300 !important;
            background: transparent !important;
          }
          .carservicereport-cancel-btn:hover:not(:disabled) {
            border-color: #FFD54F !important;
            color: #FFD54F !important;
            background: transparent !important;
          }
          .carservicereport-submit-btn {
            height: 40px;
            border-radius: 8px;
            background: linear-gradient(135deg, #FFC300, #FFD54F) !important;
            border-color: #FFC300 !important;
            color: #000 !important;
            font-weight: 600;
          }
          .carservicereport-submit-btn:hover:not(:disabled) {
            background: linear-gradient(135deg, #FFD54F, #FFEB3B) !important;
            border-color: #FFD54F !important;
          }
        `}
      </style>
      <Spin spinning={loading}>
        {/* Vehicle Details Section */}
        <div style={{ marginBottom: 24, padding: 16, background: '#FFF9E6', borderRadius: 8, border: '2px solid #FFC300' }}>
          <h3 style={{ marginTop: 0, marginBottom: 12, color: '#000' }}>Vehicle Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <p style={{ margin: 0 }}><strong>Owner:</strong> {customer?.displayName}</p>
            <p style={{ margin: 0 }}><strong>Vehicle:</strong> {car?.year} {car?.make} {car?.model}</p>
            <p style={{ margin: 0 }}><strong>Plate:</strong> {car?.plateNumber}</p>
            <p style={{ margin: 0 }}><strong>Mileage:</strong> {car?.mileage} km</p>
          </div>
        </div>

        {/* Service History Summary */}
        <div style={{ marginBottom: 24, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
          <h3 style={{ marginTop: 0, marginBottom: 12 }}>Service History</h3>
          <div style={{ maxHeight: 120, overflowY: 'auto' }}>
            {serviceHistory.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {serviceHistory.slice(-3).map(service => (
                  <li key={service.id} style={{ marginBottom: 8 }}>
                    <strong>{new Date(service.timestamp).toLocaleDateString()}</strong> - {service.workPerformed}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ margin: 0, color: '#888' }}>No previous service records found</p>
            )}
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            status: 'completed',
            laborCost: 0
          }}
        >
          <Form.Item
            name="diagnosis"
            label="Diagnosis"
            rules={[{ required: true, message: 'Please enter the diagnosis' }]}
          >
            <TextArea
              rows={3}
              placeholder="Describe the issue diagnosed..."
            />
          </Form.Item>

          <Form.Item
            name="workPerformed"
            label="Work Performed"
            rules={[{ required: true, message: 'Please describe the work performed' }]}
          >
            <TextArea
              rows={4}
              placeholder="Describe the work that was performed..."
            />
          </Form.Item>

          <Form.Item
            name="recommendations"
            label="Recommendations"
          >
            <TextArea
              rows={2}
              placeholder="Any recommendations for future maintenance..."
            />
          </Form.Item>

          {/* Parts Selection */}
          <div style={{ marginBottom: 24 }}>
            <h4>Parts Used</h4>
            <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #d9d9d9', borderRadius: 4, padding: 12 }}>
              {availableParts.length > 0 ? (
                availableParts.map(part => (
                  <div key={part.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>{part.name}</div>
                      <div style={{ fontSize: 12, color: '#888' }}>₱{part.price} (Stock: {part.quantity})</div>
                    </div>
                    <InputNumber
                      min={0}
                      max={part.quantity}
                      placeholder="Qty"
                      style={{ width: 80 }}
                      onChange={(value) => handlePartSelection(part.id, value || 0)}
                    />
                  </div>
                ))
              ) : (
                <p style={{ margin: 0, color: '#888' }}>No parts available</p>
              )}
            </div>
            {reportData.partsUsed.length > 0 && (
              <div style={{ marginTop: 12, padding: 12, background: '#FFF9E6', borderRadius: 4, border: '1px solid #FFC300' }}>
                <strong style={{ color: '#000' }}>Selected Parts:</strong>
                <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
                  {reportData.partsUsed.map((part, idx) => (
                    <li key={idx}>
                      {part.name} - Qty: {part.quantity} - ₱{(part.price * part.quantity).toLocaleString()}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              name="laborCost"
              label="Labor Cost"
              rules={[{ required: true, message: 'Please enter labor cost' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                prefix="₱"
                placeholder="0.00"
                onChange={(value) => {
                  setReportData(prev => ({
                    ...prev,
                    laborCost: value || 0,
                    totalCost: calculateTotalCost(prev.partsUsed, prev.laborHours, value || 0)
                  }));
                }}
              />
            </Form.Item>

            <Form.Item
              name="status"
              label="Status"
              rules={[{ required: true, message: 'Please select status' }]}
            >
              <Select>
                <Option value="completed">Completed</Option>
                <Option value="pending">Pending</Option>
                <Option value="in-progress">In Progress</Option>
              </Select>
            </Form.Item>
          </div>

          <div style={{ padding: 16, background: '#FFF9E6', borderRadius: 8, border: '2px solid #FFC300' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: 16, color: '#000' }}>Total Cost:</strong>
              <strong style={{ fontSize: 20, color: '#000' }}>₱{reportData.totalCost.toLocaleString()}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <Button 
              className="carservicereport-cancel-btn"
              onClick={handleCancel}
              disabled={isSubmitting}
              style={{ height: '40px' }}
            >
              Cancel
            </Button>
            <Button 
              type="primary" 
              className="carservicereport-submit-btn"
              onClick={handleSubmit}
              loading={isSubmitting}
              style={{ height: '40px' }}
            >
              Submit Report
            </Button>
          </div>
        </Form>
      </Spin>
    </Modal>
  );
}