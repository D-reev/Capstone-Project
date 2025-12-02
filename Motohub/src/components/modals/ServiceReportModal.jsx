import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, DatePicker, Button, message, AutoComplete, Tooltip, App } from 'antd';
import { PlusOutlined, MinusCircleOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import PartsRequestModal from './PartsRequestModal';
import dayjs from 'dayjs';

const { TextArea } = Input;

export default function ServiceReportModal({ car, customer, onSubmit, onClose, open }) {
  const { user } = useAuth();
  const { modal } = App.useApp();
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mechanicNames, setMechanicNames] = useState([]);
  const [mechanicFields, setMechanicFields] = useState([0]);
  const [diagnosisFields, setDiagnosisFields] = useState([0]);
  const [workPartsFields, setWorkPartsFields] = useState([0]);
  const [isPartsRequestModalOpen, setIsPartsRequestModalOpen] = useState(false);
  const [inventoryParts, setInventoryParts] = useState([]);
  const [requestedParts, setRequestedParts] = useState([]);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [isRequestSent, setIsRequestSent] = useState(false);
  const [lockedPartsFields, setLockedPartsFields] = useState({});
  const [editingFieldIndex, setEditingFieldIndex] = useState(null);
  const db = getFirestore();

  // Watch form values to enable/disable submit button
  const formValues = Form.useWatch([], form);
  const [isFormValid, setIsFormValid] = useState(false);

  // Check if form is valid
  useEffect(() => {
    if (!formValues) {
      setIsFormValid(false);
      return;
    }

    // Check if at least one mechanic name is filled
    const hasMechanic = mechanicFields.some(index => {
      const value = formValues[`mechanicName_${index}`];
      return value && value.trim();
    });

    // Check if at least one diagnosis is filled
    const hasDiagnosis = diagnosisFields.some(index => {
      const value = formValues[`diagnosis_${index}`];
      return value && value.trim();
    });

    // Check if at least one work performed is filled
    const hasWork = workPartsFields.some(index => {
      const value = formValues[`workPerformed_${index}`];
      return value && value.trim();
    });

    const isValid = hasMechanic && hasDiagnosis && hasWork;
    setIsFormValid(isValid);
  }, [formValues, mechanicFields, diagnosisFields, workPartsFields]);

  // Fetch existing mechanic names from service history
  useEffect(() => {
    if (open) {
      fetchMechanicNames();
      fetchInventoryParts();
    }
  }, [open]);

  const fetchMechanicNames = async () => {
    try {
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      const mechanicSet = new Set();

      // Iterate through all users
      for (const userDoc of usersSnapshot.docs) {
        const carsRef = collection(db, `users/${userDoc.id}/cars`);
        const carsSnapshot = await getDocs(carsRef);

        // Iterate through all cars for each user
        for (const carDoc of carsSnapshot.docs) {
          const serviceHistoryRef = collection(db, `users/${userDoc.id}/cars/${carDoc.id}/serviceHistory`);
          const serviceHistorySnapshot = await getDocs(serviceHistoryRef);

          // Extract mechanic names from service history
          serviceHistorySnapshot.forEach(doc => {
            const data = doc.data();
            if (data.mechanicName && data.mechanicName.trim()) {
              mechanicSet.add(data.mechanicName.trim());
            }
          });
        }
      }

      setMechanicNames(Array.from(mechanicSet).sort());
    } catch (error) {
      // Error fetching mechanic names
    }
  };

  const fetchInventoryParts = async () => {
    try {
      const inventoryRef = collection(db, 'inventory');
      const snapshot = await getDocs(inventoryRef);
      const partsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setInventoryParts(partsList);
    } catch (error) {
      // Error fetching inventory
    }
  };

  const handlePartsRequest = (requestData) => {
    const selectedPartsDetails = requestData.parts.map(part => {
      const partInfo = inventoryParts.find(p => p.id === part.partId);
      return `${partInfo?.name || 'Unknown'} (Qty: ${part.quantity})`;
    });
    
    setRequestedParts(selectedPartsDetails);
    
    // Determine which field to add parts to
    let targetFieldIndex = editingFieldIndex !== null ? editingFieldIndex : workPartsFields[0];
    let isNewField = false;
    
    // If not editing and the first field already has parts, find an empty field or create new one
    if (editingFieldIndex === null) {
      const emptyFieldIndex = workPartsFields.find(index => {
        const parts = form.getFieldValue(`partsUsed_${index}`) || '';
        return !parts.trim();
      });
      
      if (emptyFieldIndex !== undefined) {
        targetFieldIndex = emptyFieldIndex;
      } else {
        // All fields are filled, create a new entry
        const newIndex = Math.max(...workPartsFields) + 1;
        setWorkPartsFields(prev => [...prev, newIndex]);
        targetFieldIndex = newIndex;
        isNewField = true;
      }
    }
    
    // Use setTimeout to ensure state update completes before setting form value and lock
    setTimeout(() => {
      // Replace parts in the target field (always replace, never append)
      const newParts = selectedPartsDetails.join(', ');
      form.setFieldValue(`partsUsed_${targetFieldIndex}`, newParts);
      
      // Lock the field
      setLockedPartsFields(prev => ({
        ...prev,
        [targetFieldIndex]: true
      }));
      
      // Show success message
      message.success(`${selectedPartsDetails.length} part(s) ${editingFieldIndex !== null ? 'updated' : 'added'} successfully!`);
    }, isNewField ? 100 : 0);
    
    // Clear editing state
    setEditingFieldIndex(null);
    setIsPartsRequestModalOpen(false);
  };

  const handleEditParts = (fieldIndex) => {
    setEditingFieldIndex(fieldIndex);
    
    // Parse existing parts from the field to pre-fill quantities
    const existingPartsText = form.getFieldValue(`partsUsed_${fieldIndex}`) || '';
    const parsedParts = [];
    
    if (existingPartsText.trim()) {
      // Split by comma and parse each part
      const partEntries = existingPartsText.split(',').map(p => p.trim());
      partEntries.forEach(entry => {
        // Extract quantity if present (e.g., "Oil filter (Qty: 2)")
        const qtyMatch = entry.match(/\(Qty:\s*(\d+)\)/);
        const partName = entry.replace(/\(Qty:\s*\d+\)/, '').trim();
        const quantity = qtyMatch ? parseInt(qtyMatch[1]) : 1;
        
        // Try to find matching part in inventory
        const matchedPart = inventoryParts.find(p => 
          p.name.toLowerCase() === partName.toLowerCase()
        );
        
        if (matchedPart) {
          parsedParts.push({
            partId: matchedPart.id,
            quantity: quantity
          });
        }
      });
    }
    
    // Store parsed parts for the modal
    setRequestedParts(parsedParts);
    setIsPartsRequestModalOpen(true);
  };

  const handleClearParts = (fieldIndex) => {
    // Clear the parts field
    form.setFieldValue(`partsUsed_${fieldIndex}`, '');
    // Unlock the field
    setLockedPartsFields(prev => {
      const updated = { ...prev };
      delete updated[fieldIndex];
      return updated;
    });
  };

  const handleSubmitPartsRequest = async () => {
    try {
      setIsSubmittingRequest(true);

      // Collect all work/parts pairs from the form, tracking if they're from inventory
      const allWorkParts = workPartsFields
        .map(index => ({
          partsUsed: form.getFieldValue(`partsUsed_${index}`) || '',
          workPerformed: form.getFieldValue(`workPerformed_${index}`) || '',
          isFromInventory: lockedPartsFields[index] || false // Track if from inventory
        }))
        .filter(pair => pair.partsUsed.trim() || pair.workPerformed.trim());

      // Only include parts that are from inventory (locked fields)
      const inventoryWorkParts = allWorkParts.filter(pair => pair.isFromInventory);

      if (inventoryWorkParts.length === 0) {
        message.error('Please select parts from inventory before submitting request');
        setIsSubmittingRequest(false);
        return;
      }

      // Parse parts from the text and match with inventory
      const requestedPartsData = [];
      inventoryWorkParts.forEach(pair => {
        if (pair.partsUsed.trim()) {
          // Try to extract part names and quantities
          const partEntries = pair.partsUsed.split(',').map(p => p.trim());
          partEntries.forEach(entry => {
            // Extract quantity if present (e.g., "Oil filter (Qty: 2)")
            const qtyMatch = entry.match(/\(Qty:\s*(\d+)\)/);
            const partName = entry.replace(/\(Qty:\s*\d+\)/, '').trim();
            const quantity = qtyMatch ? parseInt(qtyMatch[1]) : 1;

            // Try to find matching part in inventory
            const matchedPart = inventoryParts.find(p => 
              p.name.toLowerCase() === partName.toLowerCase()
            );

            requestedPartsData.push({
              partId: matchedPart?.id || null,
              name: partName,
              quantity: quantity,
              price: matchedPart?.unitPrice || 0,
              workPerformed: pair.workPerformed
            });
          });
        }
      });

      const requestPayload = {
        mechanicId: user?.uid,
        mechanicName: user?.displayName || 'Unknown',
        customerId: customer?.id,
        customerName: customer?.displayName || 'Unknown',
        carDetails: {
          make: car?.make,
          model: car?.model,
          year: car?.year,
          plateNumber: car?.plateNumber
        },
        parts: requestedPartsData,
        workDetails: inventoryWorkParts,
        status: 'pending',
        createdAt: new Date().toISOString(),
        notes: `Service report parts request for ${car?.year} ${car?.make} ${car?.model} (${car?.plateNumber})`
      };

      const requestsRef = collection(db, 'partRequests');
      await addDoc(requestsRef, requestPayload);

      const partsCount = requestedPartsData.length;
      setIsRequestSent(true);
      message.success({
        content: `Parts request submitted successfully! ${partsCount} part(s) requested from inventory.`,
        duration: 4,
      });
    } catch (error) {
      message.error({
        content: `Failed to submit parts request: ${error.message || 'Unknown error'}`,
        duration: 5,
      });
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleSubmit = async (values) => {
    setIsSubmitting(true);

    try {
      if (!user?.uid) {
        throw new Error('You must be logged in as a mechanic');
      }

      if (!car?.id || !customer?.id) {
        throw new Error('Missing car or customer information');
      }

      // Collect all mechanic names from the dynamic fields
      const allMechanicNames = mechanicFields
        .map(index => values[`mechanicName_${index}`])
        .filter(name => name && name.trim());

      if (allMechanicNames.length === 0) {
        throw new Error('Please enter at least one mechanic name');
      }

      // Collect all diagnosis points from the dynamic fields
      const allDiagnosisPoints = diagnosisFields
        .map(index => values[`diagnosis_${index}`])
        .filter(point => point && point.trim());

      if (allDiagnosisPoints.length === 0) {
        throw new Error('Please enter at least one diagnosis point');
      }

      // Collect all work/parts pairs from the dynamic fields
      const allWorkParts = workPartsFields
        .map(index => ({
          partsUsed: values[`partsUsed_${index}`] || '',
          workPerformed: values[`workPerformed_${index}`] || ''
        }))
        .filter(pair => pair.partsUsed.trim() || pair.workPerformed.trim());

      if (allWorkParts.length === 0 || !allWorkParts.some(pair => pair.workPerformed.trim())) {
        throw new Error('Please enter at least one work performed entry');
      }

      // Format parts and work as bullet points
      const partsUsedFormatted = allWorkParts
        .filter(pair => pair.partsUsed.trim())
        .map(pair => `• ${pair.partsUsed}`)
        .join('\n');
      
      const workPerformedFormatted = allWorkParts
        .filter(pair => pair.workPerformed.trim())
        .map(pair => `• ${pair.workPerformed}`)
        .join('\n');

      const reportPayload = {
        diagnosis: allDiagnosisPoints.map(point => `• ${point}`).join('\n'),
        workPerformed: workPerformedFormatted,
        recommendations: values.recommendations || '',
        partsUsed: partsUsedFormatted,
        status: 'pending',
        carId: car.id,
        customerId: customer.id,
        mechanicId: user.uid,
        mechanicHeadName: user.displayName || 'Unknown',
        mechanicName: allMechanicNames.join(', '),
        mechanicNames: allMechanicNames,
        vehicle: `${car.year} ${car.make} ${car.model}`,
        plateNumber: car.plateNumber,
        timestamp: new Date().toISOString()
      };

      // Save to top-level serviceReports collection for efficient querying
      const serviceReportsRef = collection(db, 'serviceReports');
      await addDoc(serviceReportsRef, reportPayload);

      // Also save to nested path for backward compatibility and customer access
      const serviceHistoryRef = collection(
        db,
        `users/${customer.id}/cars/${car.id}/serviceHistory`
      );

      await addDoc(serviceHistoryRef, reportPayload);
      
      modal.success({
        title: 'Service Report Submitted',
        content: `Service report for ${car.year} ${car.make} ${car.model} has been successfully submitted.`,
        okText: 'Done',
        centered: true,
      });
      
      if (onSubmit) {
        onSubmit(reportPayload);
      }
      
      form.resetFields();
      onClose();
    } catch (err) {
      message.error(err.message || 'Failed to submit service report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setMechanicFields([0]);
    setDiagnosisFields([0]);
    setWorkPartsFields([0]);
    onClose();
  };

  const addMechanicField = () => {
    const newIndex = mechanicFields.length > 0 ? Math.max(...mechanicFields) + 1 : 0;
    setMechanicFields([...mechanicFields, newIndex]);
  };

  const removeMechanicField = (index) => {
    if (mechanicFields.length > 1) {
      setMechanicFields(mechanicFields.filter(i => i !== index));
      form.setFieldValue(`mechanicName_${index}`, undefined);
    }
  };

  const addDiagnosisField = () => {
    const newIndex = diagnosisFields.length > 0 ? Math.max(...diagnosisFields) + 1 : 0;
    setDiagnosisFields([...diagnosisFields, newIndex]);
  };

  const removeDiagnosisField = (index) => {
    if (diagnosisFields.length > 1) {
      setDiagnosisFields(diagnosisFields.filter(i => i !== index));
      form.setFieldValue(`diagnosis_${index}`, undefined);
    }
  };

  const addWorkPartsField = () => {
    const newIndex = workPartsFields.length > 0 ? Math.max(...workPartsFields) + 1 : 0;
    setWorkPartsFields([...workPartsFields, newIndex]);
  };

  const removeWorkPartsField = (index) => {
    if (workPartsFields.length > 1) {
      setWorkPartsFields(workPartsFields.filter(i => i !== index));
      form.setFieldValue(`partsUsed_${index}`, undefined);
      form.setFieldValue(`workPerformed_${index}`, undefined);
    }
  };

  return (
    <>
    <Modal
      title="Service Report"
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={600}
      destroyOnHidden
      centered
      zIndex={1100}
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
        <p style={{ margin: '0.25rem 0' }}><strong>Mobile:</strong> {customer?.phoneNumber || 'N/A'}</p>
        <p style={{ margin: '0.25rem 0' }}><strong>Vehicle:</strong> {car ? `${car.year} ${car.make} ${car.model}` : 'N/A'}</p>
        <p style={{ margin: '0.25rem 0' }}><strong>Plate:</strong> {car?.plateNumber || 'N/A'}</p>
        <p style={{ margin: '0.25rem 0' }}><strong>Mechanic Head:</strong> {user?.displayName || 'Unknown'}</p>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
      >
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontWeight: 500, fontSize: '14px' }}>Mechanic Names</label>
            <Button
              type="dashed"
              onClick={addMechanicField}
              icon={<PlusOutlined />}
              size="small"
              style={{
                borderColor: '#FFC300',
                color: '#FFC300',
              }}
            >
              Add Mechanic
            </Button>
          </div>
          {mechanicFields.map((fieldIndex, arrayIndex) => (
            <div key={fieldIndex} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <Form.Item
                name={`mechanicName_${fieldIndex}`}
                rules={[
                  { required: true, message: 'Please enter mechanic name' },
                  {
                    validator: async (_, value) => {
                      if (!value || !value.trim()) {
                        return Promise.resolve();
                      }
                      
                      // Validate name format: First Name [Middle Name] Last Name
                      const trimmedValue = value.trim();
                      const nameParts = trimmedValue.split(/\s+/);
                      
                      if (nameParts.length < 2) {
                        return Promise.reject(new Error('Please enter at least first name and last name'));
                      }
                      
                      // Check if each part contains only letters, hyphens, and apostrophes
                      const namePattern = /^[A-Za-zÀ-ÿ\-']+$/;
                      const invalidPart = nameParts.find(part => !namePattern.test(part));
                      
                      if (invalidPart) {
                        return Promise.reject(new Error('Name should contain only letters'));
                      }
                      
                      // Get all current mechanic name values
                      const allValues = mechanicFields
                        .map(idx => form.getFieldValue(`mechanicName_${idx}`))
                        .filter(name => name && name.trim());
                      
                      // Check for duplicates (case-insensitive)
                      const normalizedValue = trimmedValue.toLowerCase();
                      const duplicates = allValues.filter(
                        name => name && name.trim().toLowerCase() === normalizedValue
                      );
                      
                      if (duplicates.length > 1) {
                        return Promise.reject(new Error('This mechanic name is already added'));
                      }
                      
                      return Promise.resolve();
                    }
                  }
                ]}
                style={{ flex: 1, marginBottom: 0 }}
              >
                <AutoComplete
                  options={mechanicNames.map(name => ({ value: name }))}
                  placeholder={`Mechanic ${arrayIndex + 1} name...`}
                  filterOption={(inputValue, option) =>
                    option.value.toLowerCase().includes(inputValue.toLowerCase())
                  }
                  onChange={() => {
                    // Trigger validation on all mechanic fields when any field changes
                    mechanicFields.forEach(idx => {
                      form.validateFields([`mechanicName_${idx}`]).catch(() => {});
                    });
                  }}
                />
              </Form.Item>
              {mechanicFields.length > 1 && (
                <Button
                  danger
                  icon={<MinusCircleOutlined />}
                  onClick={() => removeMechanicField(fieldIndex)}
                  style={{ marginTop: '0' }}
                />
              )}
            </div>
          ))}
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontWeight: 500, fontSize: '14px' }}>Diagnosis</label>
            <Button
              type="dashed"
              onClick={addDiagnosisField}
              icon={<PlusOutlined />}
              size="small"
              style={{
                borderColor: '#FFC300',
                color: '#FFC300',
              }}
            >
              Add Point
            </Button>
          </div>
          {diagnosisFields.map((fieldIndex, arrayIndex) => (
            <div key={fieldIndex} style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'flex-start' }}>
              <span style={{ marginTop: '8px', fontWeight: 'bold', fontSize: '16px' }}>•</span>
              <Form.Item
                name={`diagnosis_${fieldIndex}`}
                rules={[{ required: true, message: 'Please enter diagnosis point' }]}
                style={{ flex: 1, marginBottom: 0 }}
              >
                <Input
                  placeholder={`Diagnosis point ${arrayIndex + 1}...`}
                />
              </Form.Item>
              {diagnosisFields.length > 1 && (
                <Button
                  danger
                  icon={<MinusCircleOutlined />}
                  onClick={() => removeDiagnosisField(fieldIndex)}
                  style={{ marginTop: '0' }}
                />
              )}
            </div>
          ))}
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontWeight: 500, fontSize: '14px' }}>Parts Used & Work Performed</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                type="dashed"
                onClick={() => setIsPartsRequestModalOpen(true)}
                icon={<ShoppingCartOutlined />}
                size="small"
                disabled={isRequestSent}
                style={{
                  borderColor: isRequestSent ? '#d1d5db' : '#FFC300',
                  color: isRequestSent ? '#9ca3af' : '#FFC300',
                }}
              >
                Request Parts
              </Button>
              <Button
                type="dashed"
                onClick={addWorkPartsField}
                icon={<PlusOutlined />}
                size="small"
                disabled={isRequestSent}
                style={{
                  borderColor: isRequestSent ? '#d1d5db' : '#FFC300',
                  color: isRequestSent ? '#9ca3af' : '#FFC300',
                }}
              >
                Add Entry
              </Button>
            </div>
          </div>
          {workPartsFields.map((fieldIndex, arrayIndex) => (
            <div key={fieldIndex} style={{ 
              marginBottom: '16px', 
              padding: '12px',
              background: '#F9FAFB',
              borderRadius: '8px',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 500, color: '#6B7280', fontSize: '13px' }}>Entry {arrayIndex + 1}</span>
                {workPartsFields.length > 1 && (
                  <Button
                    danger
                    icon={<MinusCircleOutlined />}
                    onClick={() => removeWorkPartsField(fieldIndex)}
                    size="small"
                  />
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span style={{ marginTop: '8px', fontWeight: 'bold', fontSize: '16px' }}>•</span>
                <Form.Item
                  name={`partsUsed_${fieldIndex}`}
                  style={{ flex: 1, marginBottom: 0 }}
                >
                  <Input
                    placeholder="Parts used (e.g., Oil filter, Brake pads)..."
                    disabled={lockedPartsFields[fieldIndex] || isRequestSent}
                    style={{
                      backgroundColor: (lockedPartsFields[fieldIndex] || isRequestSent) ? '#F3F4F6' : 'white',
                      cursor: (lockedPartsFields[fieldIndex] || isRequestSent) ? 'not-allowed' : 'text'
                    }}
                  />
                </Form.Item>
                {lockedPartsFields[fieldIndex] && !isRequestSent && (
                  <>
                    <Button
                      type="dashed"
                      onClick={() => handleEditParts(fieldIndex)}
                      size="small"
                      style={{
                        marginTop: '0',
                        borderColor: '#FFC300',
                        color: '#FFC300',
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      danger
                      onClick={() => handleClearParts(fieldIndex)}
                      size="small"
                      style={{
                        marginTop: '0',
                      }}
                    >
                      Clear
                    </Button>
                  </>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <span style={{ marginTop: '8px', fontWeight: 'bold', fontSize: '16px' }}>•</span>
                <Form.Item
                  name={`workPerformed_${fieldIndex}`}
                  rules={[{ required: true, message: 'Please describe the work performed' }]}
                  style={{ flex: 1, marginBottom: 0 }}
                >
                  <Input
                    placeholder="Work performed for these parts..."
                    disabled={isRequestSent}
                  />
                </Form.Item>
              </div>
            </div>
          ))}
          <Button
            type="primary"
            icon={<ShoppingCartOutlined />}
            onClick={handleSubmitPartsRequest}
            loading={isSubmittingRequest}
            disabled={isRequestSent || !Object.keys(lockedPartsFields).some(key => lockedPartsFields[key])}
            style={{ 
              marginTop: '12px',
              background: isRequestSent 
                ? '#10B981' 
                : Object.keys(lockedPartsFields).some(key => lockedPartsFields[key]) 
                  ? 'linear-gradient(135deg, #FFC300 0%, #FFD54F 100%)' 
                  : '#D1D5DB',
              borderColor: isRequestSent 
                ? '#10B981' 
                : Object.keys(lockedPartsFields).some(key => lockedPartsFields[key]) 
                  ? '#FFC300' 
                  : '#D1D5DB',
              color: '#000',
              height: '40px',
              borderRadius: '8px',
              fontWeight: 600,
              boxShadow: isRequestSent 
                ? '0 2px 4px rgba(16, 185, 129, 0.2)' 
                : Object.keys(lockedPartsFields).some(key => lockedPartsFields[key]) 
                  ? '0 2px 4px rgba(255, 195, 0, 0.2)' 
                  : 'none',
              width: '100%',
              cursor: (isRequestSent || !Object.keys(lockedPartsFields).some(key => lockedPartsFields[key])) 
                ? 'not-allowed' 
                : 'pointer'
            }}
          >
            {isRequestSent 
              ? 'Request Sent ✓' 
              : Object.keys(lockedPartsFields).filter(key => lockedPartsFields[key]).length > 0 
                ? `Submit Request (${Object.keys(lockedPartsFields).filter(key => lockedPartsFields[key]).length})`
                : 'Submit Request'}
          </Button>
        </div>

        <Form.Item
          label="Recommendations"
          name="recommendations"
        >
          <TextArea
            rows={2}
            placeholder="Any recommendations for future maintenance..."
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
            disabled={!isFormValid || isSubmitting}
            style={{ 
              height: '40px',
              background: '#D1D5DB',
              borderColor: '#D1D5DB',
              color: '#000',
              fontWeight: 600,
              padding: '0 24px',
              borderRadius: '8px',
              boxShadow: 'none',
              cursor: (isFormValid && !isSubmitting) ? 'pointer' : 'not-allowed',
            }}
          >
            Submit Report
          </Button>
        </div>
      </Form>
    </Modal>
    
    <PartsRequestModal
      open={isPartsRequestModalOpen}
      onClose={() => {
        setIsPartsRequestModalOpen(false);
        setEditingFieldIndex(null);
        setRequestedParts([]);
      }}
      parts={inventoryParts}
      onSubmit={handlePartsRequest}
      initialParts={editingFieldIndex !== null ? requestedParts : []}
    />
    </>
  );
}
