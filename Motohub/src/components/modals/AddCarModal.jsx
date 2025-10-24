import React from 'react';
import { Info } from 'lucide-react';
import { Modal, Form, Input, Select, InputNumber, Tooltip } from 'antd';
import './Modal.css';

export default function AddCarModal({ onSubmit, onClose }) {
  const [form] = Form.useForm();

  const fieldInfo = {
    make: "Enter the vehicle manufacturer (e.g., Toyota, Honda, Ford)",
    model: "Enter the specific model name (e.g., Camry, Civic, Mustang)",
    year: "Enter the year the vehicle was manufactured",
    plateNumber: "Enter your vehicle's license plate number",
    engine: "Enter engine specifications (e.g., 2.0L Turbo, V6 3.5L)",
    transmission: "Select the type of transmission your vehicle has",
    mileage: "Enter the current odometer reading in kilometers"
  };

  const handleFinish = (values) => {
    onSubmit(values);
  };

  return (
    <Modal
      open={true}
      title="Add New Vehicle"
      onCancel={onClose}
      okText="Add Vehicle"
      cancelText="Cancel"
      onOk={() => form.submit()}
      destroyOnClose
      maskClosable
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          make: '',
          model: '',
          year: null,
          plateNumber: '',
          engine: '',
          transmission: '',
          mileage: null
        }}
      >
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
      </Form>
    </Modal>
  );
}