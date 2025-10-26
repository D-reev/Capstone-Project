import React, { useState } from 'react';
import { Modal, Form, Input, DatePicker, Button, message } from 'antd';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import dayjs from 'dayjs';

const { TextArea } = Input;

export default function ServiceReportModal({ car, customer, onSubmit, onClose, open }) {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const db = getFirestore();

  const handleSubmit = async (values) => {
    setIsSubmitting(true);

    try {
      if (!user?.uid) {
        throw new Error('You must be logged in as a mechanic');
      }

      if (!car?.id || !customer?.id) {
        throw new Error('Missing car or customer information');
      }

      const reportPayload = {
        diagnosis: values.diagnosis,
        workPerformed: values.workPerformed,
        recommendations: values.recommendations || '',
        partsUsed: values.partsUsed || '',
        nextServiceDate: values.nextServiceDate ? values.nextServiceDate.format('YYYY-MM-DD') : '',
        status: 'completed',
        carId: car.id,
        customerId: customer.id,
        mechanicId: user.uid,
        mechanicName: user.displayName || 'Unknown Mechanic',
        vehicle: `${car.year} ${car.make} ${car.model}`,
        plateNumber: car.plateNumber,
        timestamp: new Date().toISOString()
      };

      // Save to nested path: users/{customerId}/cars/{carId}/serviceHistory
      const serviceHistoryRef = collection(
        db,
        `users/${customer.id}/cars/${car.id}/serviceHistory`
      );

      await addDoc(serviceHistoryRef, reportPayload);
      
      message.success('Service report submitted successfully');
      
      if (onSubmit) {
        onSubmit(reportPayload);
      }
      
      form.resetFields();
      onClose();
    } catch (err) {
      console.error('Error submitting report:', err);
      message.error(err.message || 'Failed to submit service report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="Service Report"
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={600}
      destroyOnHidden
      centered
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
          .ant-picker:hover .ant-picker-input,
          .ant-picker-focused .ant-picker-input,
          .ant-picker:hover,
          .ant-picker-focused {
            border-color: #FFC300 !important;
          }
          .ant-input:focus,
          .ant-input-focused,
          .ant-picker-focused {
            outline: 0;
            box-shadow: 0 0 0 2px rgba(255, 195, 0, 0.1) !important;
            border-color: #FFC300 !important;
          }
          .servicereport-cancel-btn {
            height: 40px;
            border-radius: 8px;
            border-color: #FFC300 !important;
            color: #FFC300 !important;
            background: transparent !important;
          }
          .servicereport-cancel-btn:hover:not(:disabled) {
            border-color: #FFD54F !important;
            color: #FFD54F !important;
            background: transparent !important;
          }
          .servicereport-submit-btn {
            height: 40px;
            border-radius: 8px;
            background: linear-gradient(135deg, #FFC300, #FFD54F) !important;
            border-color: #FFC300 !important;
            color: #000 !important;
            font-weight: 600;
          }
          .servicereport-submit-btn:hover:not(:disabled) {
            background: linear-gradient(135deg, #FFD54F, #FFEB3B) !important;
            border-color: #FFD54F !important;
          }
        `}
      </style>
      <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#FFF9E6', borderRadius: '0.5rem', border: '2px solid #FFC300' }}>
        <p style={{ margin: '0.25rem 0' }}><strong>Customer:</strong> {customer?.displayName || 'Unknown'}</p>
        <p style={{ margin: '0.25rem 0' }}><strong>Vehicle:</strong> {car ? `${car.year} ${car.make} ${car.model}` : 'N/A'}</p>
        <p style={{ margin: '0.25rem 0' }}><strong>Plate:</strong> {car?.plateNumber || 'N/A'}</p>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
      >
        <Form.Item
          label="Diagnosis"
          name="diagnosis"
          rules={[{ required: true, message: 'Please enter the diagnosis' }]}
        >
          <TextArea
            rows={3}
            placeholder="Enter detailed diagnosis..."
          />
        </Form.Item>

        <Form.Item
          label="Work Performed"
          name="workPerformed"
          rules={[{ required: true, message: 'Please describe the work performed' }]}
        >
          <TextArea
            rows={3}
            placeholder="Describe the work performed..."
          />
        </Form.Item>

        <Form.Item
          label="Parts Used"
          name="partsUsed"
        >
          <TextArea
            rows={2}
            placeholder="List parts used (e.g., Oil filter, Brake pads)..."
          />
        </Form.Item>

        <Form.Item
          label="Recommendations"
          name="recommendations"
        >
          <TextArea
            rows={2}
            placeholder="Any recommendations for future maintenance..."
          />
        </Form.Item>

        <Form.Item
          label="Next Service Date"
          name="nextServiceDate"
        >
          <DatePicker
            style={{ width: '100%' }}
            disabledDate={(current) => current && current < dayjs().startOf('day')}
            format="YYYY-MM-DD"
          />
        </Form.Item>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
          <Button 
            className="servicereport-cancel-btn"
            onClick={handleCancel}
            disabled={isSubmitting}
            style={{ height: '40px' }}
          >
            Cancel
          </Button>
          <Button 
            type="primary" 
            className="servicereport-submit-btn"
            htmlType="submit" 
            loading={isSubmitting}
            style={{ height: '40px' }}
          >
            Submit Report
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
