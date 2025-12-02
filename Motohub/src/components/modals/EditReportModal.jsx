import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, List, Badge, Spin, Button, App, Divider, Typography } from 'antd';
import { EditOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, PlusOutlined, MinusCircleOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { getFirestore, collection, getDocs, query, where, addDoc, updateDoc, doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import PartsRequestModal from './PartsRequestModal';
import './Modal.css';

const { TextArea } = Input;
const { Text } = Typography;

export default function EditReportModal({ report, onSave, onClose, open }) {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [partsRequests, setPartsRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [mechanicFields, setMechanicFields] = useState([0]);
  const [diagnosisFields, setDiagnosisFields] = useState([0]);
  const [workPartsFields, setWorkPartsFields] = useState([0]);
  const [isPartsRequestModalOpen, setIsPartsRequestModalOpen] = useState(false);
  const [inventoryParts, setInventoryParts] = useState([]);
  const [lockedPartsFields, setLockedPartsFields] = useState({});
  const [partsFieldStatus, setPartsFieldStatus] = useState({}); // Track approved/rejected status per field
  const [editingFieldIndex, setEditingFieldIndex] = useState(null);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [hasPartsChanges, setHasPartsChanges] = useState(false);
  const [initialEditParts, setInitialEditParts] = useState([]);
  const [initialPartsSnapshot, setInitialPartsSnapshot] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { message: messageApi, modal: modalApi } = App.useApp();
  const db = getFirestore();

  useEffect(() => {
    if (open && report) {
      fetchInventoryParts();
      setHasPartsChanges(false);
      
      // Parse mechanic names
      const mechanicNames = report.mechanicName ? report.mechanicName.split(',').map(m => m.trim()).filter(m => m) : [];
      setMechanicFields(mechanicNames.length > 0 ? mechanicNames.map((_, i) => i) : [0]);
      
      // Parse existing diagnosis points
      const diagnosisPoints = report.diagnosis ? report.diagnosis.split('\n').map(d => d.replace('• ', '').trim()).filter(d => d) : [];
      setDiagnosisFields(diagnosisPoints.length > 0 ? diagnosisPoints.map((_, i) => i) : [0]);
      
      // Parse existing work/parts entries
      const workPerformedEntries = report.workPerformed ? report.workPerformed.split('\n').map(w => w.replace('• ', '').trim()).filter(w => w) : [];
      const partsUsedEntries = report.partsUsed ? report.partsUsed.split('\n').map(p => p.replace('• ', '').trim()).filter(p => p) : [];
      const maxEntries = Math.max(workPerformedEntries.length, partsUsedEntries.length, 1);
      setWorkPartsFields(Array.from({ length: maxEntries }, (_, i) => i));
      
      // Set form values
      const formValues = {};
      mechanicNames.forEach((name, i) => {
        formValues[`mechanicName_${i}`] = name;
      });
      diagnosisPoints.forEach((point, i) => {
        formValues[`diagnosis_${i}`] = point;
      });
      workPerformedEntries.forEach((work, i) => {
        formValues[`workPerformed_${i}`] = work;
      });
      partsUsedEntries.forEach((parts, i) => {
        formValues[`partsUsed_${i}`] = parts;
      });
      formValues.recommendations = report.recommendations || '';
      
      form.setFieldsValue(formValues);
      
      // Detect locked fields (parts from inventory with "Qty:" pattern)
      const locked = {};
      const initialParts = [];
      
      partsUsedEntries.forEach((parts, i) => {
        if (parts.includes('(Qty:')) {
          locked[i] = true;
          initialParts.push(parts);
        }
      });
      
      setLockedPartsFields(locked);
      setInitialPartsSnapshot(initialParts);
      
      // Fetch related parts requests
      fetchPartsRequests();
    }
  }, [open, report, form]);

  // Set up real-time listener for parts requests
  useEffect(() => {
    if (!open || !report?.customerId || !report?.plateNumber) {
      return;
    }

    setLoadingRequests(true);
    const requestsRef = collection(db, 'partRequests');
    const q = query(
      requestsRef,
      where('customerId', '==', report.customerId),
      where('carDetails.plateNumber', '==', report.plateNumber)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requests = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        // Only include requests related to this report's timeframe (within 24 hours)
        const requestTime = new Date(data.createdAt);
        const reportTime = new Date(report.timestamp);
        const timeDiff = Math.abs(reportTime - requestTime);
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        if (hoursDiff <= 24) {
          requests.push({
            id: doc.id,
            ...data
          });
        }
      });
      
      setPartsRequests(requests);
      setLoadingRequests(false);

      // Update field status based on parts requests
      if (requests.length > 0 && report) {
        const partsUsedEntries = report.partsUsed ? report.partsUsed.split('\n').map(p => p.replace('• ', '').trim()).filter(p => p) : [];
        const fieldStatus = {};
        
        partsUsedEntries.forEach((parts, i) => {
          if (parts.includes('(Qty:')) {
            // Find matching request for this part
            const matchingRequest = requests.find(req => {
              if (!req.parts) return false;
              return req.parts.some(part => {
                const partString = `${part.name} (Qty: ${part.quantity})`;
                return parts.includes(partString) || parts.includes(part.name);
              });
            });
            
            if (matchingRequest) {
              fieldStatus[i] = matchingRequest.status;
            }
          }
        });
        
        setPartsFieldStatus(fieldStatus);
      }
    });

    // Cleanup listener on unmount or when dependencies change
    return () => unsubscribe();
  }, [open, report, db]);

  const fetchPartsRequests = async () => {
    if (!report?.customerId || !report?.carId) return;
    
    try {
      setLoadingRequests(true);
      const requestsRef = collection(db, 'partRequests');
      const q = query(
        requestsRef,
        where('customerId', '==', report.customerId),
        where('carDetails.plateNumber', '==', report.plateNumber)
      );
      
      const snapshot = await getDocs(q);
      const requests = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        // Only include requests related to this report's timeframe (within 24 hours)
        const requestTime = new Date(data.createdAt);
        const reportTime = new Date(report.timestamp);
        const timeDiff = Math.abs(reportTime - requestTime);
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        if (hoursDiff <= 24) {
          requests.push({
            id: doc.id,
            ...data
          });
        }
      });
      
      setPartsRequests(requests);
      
      // Update field status based on parts requests
      if (requests.length > 0 && report) {
        const partsUsedEntries = report.partsUsed ? report.partsUsed.split('\n').map(p => p.replace('• ', '').trim()).filter(p => p) : [];
        const fieldStatus = {};
        
        partsUsedEntries.forEach((parts, i) => {
          if (parts.includes('(Qty:')) {
            // Find matching request for this part
            const matchingRequest = requests.find(req => {
              if (!req.parts) return false;
              return req.parts.some(part => {
                const partString = `${part.name} (Qty: ${part.quantity})`;
                return parts.includes(partString) || parts.includes(part.name);
              });
            });
            
            if (matchingRequest) {
              fieldStatus[i] = matchingRequest.status;
            }
          }
        });
        
        setPartsFieldStatus(fieldStatus);
      }
    } catch (error) {
      console.error('Error fetching parts requests:', error);
    } finally {
      setLoadingRequests(false);
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
      console.error('Error fetching inventory:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: '#F59E0B', icon: <ClockCircleOutlined />, text: 'Pending' },
      approved: { color: '#10B981', icon: <CheckCircleOutlined />, text: 'Approved' },
      rejected: { color: '#EF4444', icon: <CloseCircleOutlined />, text: 'Rejected' },
      completed: { color: '#3B82F6', icon: <CheckCircleOutlined />, text: 'Completed' },
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '6px 16px',
        borderRadius: '20px',
        fontSize: '13px',
        fontWeight: 600,
        backgroundColor: config.color,
        color: '#fff'
      }}>
        {config.icon}
        {config.text}
      </span>
    );
  };

  const handleSubmit = async (values) => {
    try {
      setIsSubmitting(true);
      
      // Validate user is logged in
      if (!user?.uid) {
        messageApi.error('You must be logged in as a mechanic');
        return;
      }

      // Validate report data exists
      if (!report?.customerId || !report?.carId) {
        messageApi.error('Missing car or customer information');
        return;
      }

      // Collect all mechanic names
      const allMechanicNames = mechanicFields
        .map(index => values[`mechanicName_${index}`])
        .filter(name => name && name.trim());

      if (allMechanicNames.length === 0) {
        messageApi.error('Please enter at least one mechanic name');
        return;
      }
      
      // Collect all diagnosis points
      const allDiagnosisPoints = diagnosisFields
        .map(index => values[`diagnosis_${index}`])
        .filter(point => point && point.trim());

      if (allDiagnosisPoints.length === 0) {
        messageApi.error('Please enter at least one diagnosis point');
        return;
      }

      // Collect all work/parts pairs
      const allWorkParts = workPartsFields
        .map(index => ({
          partsUsed: values[`partsUsed_${index}`] || '',
          workPerformed: values[`workPerformed_${index}`] || ''
        }))
        .filter(pair => pair.partsUsed.trim() || pair.workPerformed.trim());

      if (allWorkParts.length === 0 || !allWorkParts.some(pair => pair.workPerformed.trim())) {
        messageApi.error('Please enter at least one work performed entry');
        return;
      }

      // Format as bullet points
      const partsUsedFormatted = allWorkParts
        .filter(pair => pair.partsUsed.trim())
        .map(pair => `• ${pair.partsUsed}`)
        .join('\n');
      
      const workPerformedFormatted = allWorkParts
        .filter(pair => pair.workPerformed.trim())
        .map(pair => `• ${pair.workPerformed}`)
        .join('\n');
      
      const updatedReport = {
        ...report,
        mechanicName: allMechanicNames.join(', '),
        mechanicNames: allMechanicNames,
        diagnosis: allDiagnosisPoints.map(point => `• ${point}`).join('\n'),
        workPerformed: workPerformedFormatted,
        partsUsed: partsUsedFormatted,
        recommendations: values.recommendations || '',
      };
      
      await onSave(updatedReport);
      
      // Clear form state - parent handles modal closing and success message
      form.resetFields();
      setMechanicFields([0]);
      setDiagnosisFields([0]);
      setWorkPartsFields([0]);
      setLockedPartsFields({});
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error updating report:', error);
      messageApi.error(error.message || 'Failed to update report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      modalApi.confirm({
        title: 'Unsaved Changes',
        content: 'You have unsaved changes. Do you want to save them before closing?',
        okText: 'Save Changes',
        cancelText: 'Discard',
        onOk: () => {
          form.submit();
        },
        onCancel: () => {
          form.resetFields();
          setMechanicFields([0]);
          setDiagnosisFields([0]);
          setWorkPartsFields([0]);
          setLockedPartsFields({});
          setHasPartsChanges(false);
          setHasUnsavedChanges(false);
          onClose();
        }
      });
    } else {
      form.resetFields();
      setMechanicFields([0]);
      setDiagnosisFields([0]);
      setWorkPartsFields([0]);
      setLockedPartsFields({});
      setHasPartsChanges(false);
      setHasUnsavedChanges(false);
      onClose();
    }
  };

  const addMechanicField = () => {
    setMechanicFields([...mechanicFields, Math.max(...mechanicFields) + 1]);
  };

  const removeMechanicField = (index) => {
    if (mechanicFields.length > 1) {
      setMechanicFields(mechanicFields.filter(i => i !== index));
      form.setFieldValue(`mechanicName_${index}`, undefined);
    }
  };

  const addDiagnosisField = () => {
    setDiagnosisFields([...diagnosisFields, Math.max(...diagnosisFields) + 1]);
  };

  const removeDiagnosisField = (index) => {
    if (diagnosisFields.length > 1) {
      setDiagnosisFields(diagnosisFields.filter(i => i !== index));
      form.setFieldValue(`diagnosis_${index}`, undefined);
    }
  };

  const addWorkPartsField = () => {
    setWorkPartsFields([...workPartsFields, Math.max(...workPartsFields) + 1]);
  };

  const removeWorkPartsField = (index) => {
    if (workPartsFields.length > 1) {
      // Check if the entry has any data
      const partsUsed = form.getFieldValue(`partsUsed_${index}`) || '';
      const workPerformed = form.getFieldValue(`workPerformed_${index}`) || '';
      const hasData = partsUsed.trim() || workPerformed.trim();
      
      if (hasData) {
        // Show confirmation modal
        modalApi.confirm({
          title: 'Delete Entry?',
          content: 'This entry contains data. Are you sure you want to delete it?',
          okText: 'Delete',
          okType: 'danger',
          cancelText: 'Cancel',
          onOk: () => {
            setWorkPartsFields(workPartsFields.filter(i => i !== index));
            form.setFieldValue(`partsUsed_${index}`, undefined);
            form.setFieldValue(`workPerformed_${index}`, undefined);
            // Remove from locked fields if it exists
            setLockedPartsFields(prev => {
              const updated = { ...prev };
              delete updated[index];
              return updated;
            });
            messageApi.success('Entry deleted successfully');
          }
        });
      } else {
        // No data, delete without confirmation
        setWorkPartsFields(workPartsFields.filter(i => i !== index));
        form.setFieldValue(`partsUsed_${index}`, undefined);
        form.setFieldValue(`workPerformed_${index}`, undefined);
        // Remove from locked fields if it exists
        setLockedPartsFields(prev => {
          const updated = { ...prev };
          delete updated[index];
          return updated;
        });
      }
    }
  };

  const handlePartsRequest = (requestData) => {
    const selectedPartsDetails = requestData.parts.map(part => {
      const partInfo = inventoryParts.find(p => p.id === part.partId);
      return `${partInfo?.name || 'Unknown'} (Qty: ${part.quantity})`;
    });
    
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
      
      // Mark as having changes
      setHasPartsChanges(true);
      
      // Show success message
      messageApi.success(`${selectedPartsDetails.length} part(s) ${editingFieldIndex !== null ? 'updated' : 'added'} successfully!`);
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
    
    setInitialEditParts(parsedParts);
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
    // Show success message
    messageApi.success('Parts field cleared successfully!');
  };

  const handleSubmitPartsRequest = async () => {
    try {
      setIsSubmittingRequest(true);

      // Collect all work/parts pairs from the form
      const allWorkParts = workPartsFields
        .map(index => ({
          partsUsed: form.getFieldValue(`partsUsed_${index}`) || '',
          workPerformed: form.getFieldValue(`workPerformed_${index}`) || '',
          isFromInventory: lockedPartsFields[index] || false // Track if this is from inventory
        }))
        .filter(pair => pair.partsUsed.trim() || pair.workPerformed.trim());

      // Only process parts that are from inventory (locked fields)
      const inventoryWorkParts = allWorkParts.filter(pair => pair.isFromInventory);

      if (inventoryWorkParts.length === 0) {
        messageApi.error('Please select parts from inventory using the "Request Parts" button');
        setIsSubmittingRequest(false);
        return;
      }

      // Parse parts from the text and match with inventory
      const requestedPartsData = [];
      const newPartsOnly = [];
      
      inventoryWorkParts.forEach((pair, pairIndex) => {
        if (pair.partsUsed.trim()) {
          // Check if this is a new entry (not in initial snapshot)
          const isNewEntry = !initialPartsSnapshot.includes(pair.partsUsed);
          
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

            const partData = {
              partId: matchedPart?.id || null,
              name: partName,
              quantity: quantity,
              price: matchedPart?.unitPrice || 0,
              workPerformed: pair.workPerformed
            };
            
            requestedPartsData.push(partData);
            
            // Only add to newPartsOnly if this is a new entry
            if (isNewEntry) {
              newPartsOnly.push(partData);
            }
          });
        }
      });

      const carDetails = report.carDetails || report.car || {};
      const make = report.make || carDetails.make || 'Unknown';
      const model = report.model || carDetails.model || 'Unknown';
      const year = report.year || carDetails.year || 'N/A';
      const plateNumber = report.plateNumber || carDetails.plateNumber || 'N/A';

      // Check if there's already a pending request for this report
      // Match by mechanic ID, customer ID, plate number, and pending status
      const existingRequest = partsRequests.find(req => 
        req.status === 'pending' && 
        req.customerId === report.customerId &&
        req.mechanicId === user?.uid &&
        req.carDetails?.plateNumber === plateNumber
      );

      const requestPayload = {
        mechanicId: user?.uid || '',
        mechanicName: user?.displayName || 'Unknown',
        customerId: report.customerId || '',
        customerName: report.customerName || 'Unknown',
        carDetails: {
          make: make,
          model: model,
          year: year,
          plateNumber: plateNumber
        },
        parts: requestedPartsData,
        workDetails: inventoryWorkParts,
        status: 'pending',
        lastModified: new Date().toISOString(),
        notes: `Service report parts request for ${year} ${make} ${model} (${plateNumber})`
      };

      if (existingRequest) {
        // Replace all parts with the current form values (don't merge/add)
        // This ensures edited quantities replace rather than add to existing ones
        
        // Update existing request with current parts data
        const requestRef = doc(db, 'partRequests', existingRequest.id);
        await updateDoc(requestRef, {
          ...requestPayload,
          modificationCount: (existingRequest.modificationCount || 0) + 1,
        });
        messageApi.success('Parts request updated successfully!');
      } else {
        // Create new request
        requestPayload.createdAt = new Date().toISOString();
        requestPayload.modificationCount = 0;
        const requestsRef = collection(db, 'partRequests');
        await addDoc(requestsRef, requestPayload);
        messageApi.success('Parts request submitted to admin successfully!');
      }
      // Reset changes flag
      setHasPartsChanges(false);
      
      // Refresh parts requests and wait for it to complete
      await fetchPartsRequests();
    } catch (error) {
      console.error('Error submitting parts request:', error);
      if (error.code === 'permission-denied') {
        messageApi.error('Permission denied. Please check your access rights.');
      } else if (error.code === 'unavailable') {
        messageApi.error('Network error. Please check your connection and try again.');
      } else {
        messageApi.error(`Failed to submit parts request: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  if (!report) return null;

  return (
    <>
    <Modal
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <EditOutlined />
          Edit Service Report
          {hasUnsavedChanges && <Badge count="*" style={{ backgroundColor: '#FFC300', marginLeft: '8px' }} />}
        </span>
      }
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={800}
      destroyOnClose
      maskClosable={false}
      style={{ top: 20 }}
      bodyStyle={{
        maxHeight: 'calc(100vh - 200px)',
        overflowY: 'auto',
        paddingRight: '8px'
      }}
    >
      <div style={{ marginBottom: '1.5rem', padding: '12px', background: '#FFF9E6', borderRadius: '8px', border: '1px solid #FFE8A3' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
          <div>
            <Text type="secondary">Customer:</Text>
            <Text strong style={{ marginLeft: '8px' }}>{report.customerName || 'N/A'}</Text>
          </div>
          <div>
            <Text type="secondary">Vehicle:</Text>
            <Text strong style={{ marginLeft: '8px' }}>{report.vehicle || 'N/A'}</Text>
          </div>
          <div>
            <Text type="secondary">Plate:</Text>
            <Text strong style={{ marginLeft: '8px' }}>{report.plateNumber || 'N/A'}</Text>
          </div>
          <div>
            <Text type="secondary">Mechanic Head:</Text>
            <Text strong style={{ marginLeft: '8px' }}>{report.mechanicHeadName || 'N/A'}</Text>
          </div>
        </div>
      </div>

      {/* Parts Requests Section */}
      {partsRequests.length > 0 && (
        <>
          <Divider orientation="left" style={{ margin: '12px 0 16px 0' }}>
            Related Parts Requests
          </Divider>
          {loadingRequests ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
              <Spin />
            </div>
          ) : (
            <div style={{ maxHeight: '250px', overflowY: 'auto', marginBottom: '1.5rem' }}>
              <List
                dataSource={partsRequests}
                renderItem={(request) => (
                  <List.Item
                    style={{
                      padding: '12px',
                      background: '#FFF9E6',
                      borderRadius: '8px',
                      marginBottom: '8px',
                      border: '1px solid #FFE8A3'
                    }}
                  >
                    <List.Item.Meta
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text strong>Request from {new Date(request.createdAt).toLocaleDateString()}</Text>
                          {getStatusBadge(request.status)}
                        </div>
                      }
                      description={
                        <div style={{ marginTop: '8px' }}>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            Mechanic Head: {request.mechanicName}
                          </Text>
                          <div style={{ marginTop: '8px' }}>
                            {request.parts && request.parts.length > 0 ? (
                              <List
                                size="small"
                                dataSource={request.parts}
                                renderItem={(part) => (
                                  <List.Item style={{ padding: '4px 0', border: 'none' }}>
                                    <Text style={{ fontSize: '13px' }}>
                                      • {part.name} (Qty: {part.quantity})
                                      {part.workPerformed && (
                                        <Text type="secondary" style={{ marginLeft: '8px' }}>
                                          - {part.workPerformed}
                                        </Text>
                                      )}
                                    </Text>
                                  </List.Item>
                                )}
                              />
                            ) : (
                              <Text type="secondary" style={{ fontSize: '13px' }}>No parts listed</Text>
                            )}
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </div>
          )}
        </>
      )}

      <Divider orientation="left" style={{ margin: '16px 0' }}>
        Report Details
      </Divider>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        onValuesChange={() => setHasUnsavedChanges(true)}
      >
        {/* Mechanic Names Section */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <Form.Item style={{ margin: 0 }}>
              <Text strong>Other Mechanics</Text>
            </Form.Item>
            <Button
              type="dashed"
              onClick={addMechanicField}
              icon={<PlusOutlined />}
              size="small"
              style={{ borderColor: '#FFC300', color: '#FFC300' }}
            >
              Add Mechanic
            </Button>
          </div>
          {mechanicFields.map((index, arrayIndex) => (
            <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <Form.Item
                name={`mechanicName_${index}`}
                style={{ flex: 1, margin: 0 }}
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
              >
                <Input 
                  placeholder={`Mechanic ${arrayIndex + 1} name...`} 
                  onChange={() => {
                    // Trigger validation on all mechanic fields when any field changes
                    mechanicFields.forEach(idx => {
                      form.validateFields([`mechanicName_${idx}`]).catch(() => {});
                    });
                  }}
                />
              </Form.Item>
              {mechanicFields.length > 1 && (
                <MinusCircleOutlined
                  onClick={() => removeMechanicField(index)}
                  style={{ color: '#EF4444', fontSize: '20px', marginTop: '8px', cursor: 'pointer' }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Diagnosis Section */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <Form.Item style={{ margin: 0 }}>
              <Text strong>Diagnosis</Text>
            </Form.Item>
            <Button
              type="dashed"
              onClick={addDiagnosisField}
              icon={<PlusOutlined />}
              size="small"
              style={{ borderColor: '#FFC300', color: '#FFC300' }}
            >
              Add Point
            </Button>
          </div>
          {diagnosisFields.map((index, arrayIndex) => (
            <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <span style={{ marginTop: '8px', color: '#6B7280' }}>•</span>
              <Form.Item
                name={`diagnosis_${index}`}
                style={{ flex: 1, margin: 0 }}
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input placeholder={`Diagnosis point ${arrayIndex + 1}...`} />
              </Form.Item>
              {diagnosisFields.length > 1 && (
                <MinusCircleOutlined
                  onClick={() => removeDiagnosisField(index)}
                  style={{ color: '#EF4444', fontSize: '20px', marginTop: '8px', cursor: 'pointer' }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Parts Used & Work Performed Section */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <Form.Item style={{ margin: 0 }}>
              <Text strong>Parts Used & Work Performed</Text>
            </Form.Item>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                type="dashed"
                icon={<ShoppingCartOutlined />}
                size="small"
                style={{ borderColor: '#FFC300', color: '#FFC300' }}
                onClick={() => setIsPartsRequestModalOpen(true)}
              >
                Request Parts
              </Button>
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                size="small"
                style={{ borderColor: '#FFC300', color: '#FFC300' }}
                onClick={addWorkPartsField}
              >
                Add Entry
              </Button>
            </div>
          </div>
          {workPartsFields.map((index, arrayIndex) => (
            <div key={index} style={{ marginBottom: '16px' }}>
              <div style={{ 
                marginBottom: '8px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                color: '#6B7280', 
                fontSize: '12px', 
                fontWeight: 600 
              }}>
                <span>Entry {arrayIndex + 1}</span>
                {partsFieldStatus[index] === 'approved' && (
                  <Badge 
                    count="Approved"
                    style={{ backgroundColor: '#10B981', fontSize: '10px' }}
                  />
                )}
                {partsFieldStatus[index] === 'rejected' && (
                  <Badge 
                    count="Rejected"
                    style={{ backgroundColor: '#EF4444', fontSize: '10px' }}
                  />
                )}
              </div>
              <div style={{ position: 'relative', paddingRight: workPartsFields.length > 1 && !partsFieldStatus[index] ? '40px' : '0' }}>
                {workPartsFields.length > 1 && !partsFieldStatus[index] && (
                  <MinusCircleOutlined
                    onClick={() => removeWorkPartsField(index)}
                    style={{ position: 'absolute', top: '8px', right: '8px', color: '#EF4444', fontSize: '18px', cursor: 'pointer', zIndex: 1 }}
                  />
                )}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'flex-start' }}>
                  <span style={{ marginTop: '8px', color: '#6B7280' }}>•</span>
                  <Form.Item
                    name={`partsUsed_${index}`}
                    style={{ flex: 1, margin: 0 }}
                  >
                    <Input 
                      placeholder="Parts used (e.g., Oil filter, Brake pads)..." 
                      disabled={lockedPartsFields[index] || partsFieldStatus[index] === 'approved'}
                      readOnly={lockedPartsFields[index] || partsFieldStatus[index] === 'approved'}
                      onChange={(e) => {
                        // If user manually changes a locked field (shouldn't happen but safety check)
                        if (lockedPartsFields[index] && !e.target.value.includes('(Qty:')) {
                          setLockedPartsFields(prev => {
                            const updated = { ...prev };
                            delete updated[index];
                            return updated;
                          });
                        }
                      }}
                      style={{
                        backgroundColor: (lockedPartsFields[index] || partsFieldStatus[index] === 'approved') ? '#F3F4F6' : 'white',
                        cursor: (lockedPartsFields[index] || partsFieldStatus[index] === 'approved') ? 'not-allowed' : 'text',
                        color: (lockedPartsFields[index] || partsFieldStatus[index] === 'approved') ? '#6B7280' : '#000'
                      }}
                    />
                  </Form.Item>
                  {lockedPartsFields[index] && partsFieldStatus[index] !== 'approved' && partsFieldStatus[index] !== 'rejected' && (
                    <>
                      <Button
                        type="dashed"
                        onClick={() => handleEditParts(index)}
                        size="small"
                        style={{
                          marginTop: '0',
                          borderColor: '#FFC300',
                          color: '#FFC300'
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        danger
                        onClick={() => handleClearParts(index)}
                        size="small"
                        style={{ marginTop: '0' }}
                      >
                        Clear
                      </Button>
                    </>
                  )}
                  {partsFieldStatus[index] === 'rejected' && (
                    <Button
                      danger
                      onClick={() => handleClearParts(index)}
                      size="small"
                      style={{ marginTop: '0' }}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ marginTop: '8px', color: '#6B7280' }}>•</span>
                  <Form.Item
                    name={`workPerformed_${index}`}
                    style={{ flex: 1, margin: 0 }}
                    rules={[{ required: true, message: 'Required' }]}
                  >
                    <Input 
                      placeholder="Work performed for these parts..." 
                      disabled={partsFieldStatus[index] === 'approved'}
                      style={{ 
                        borderColor: '#FFC300',
                        boxShadow: '0 0 0 1px #FFC300',
                        backgroundColor: partsFieldStatus[index] === 'approved' ? '#F3F4F6' : 'white',
                        cursor: partsFieldStatus[index] === 'approved' ? 'not-allowed' : 'text',
                      }}
                    />
                  </Form.Item>
                </div>
              </div>
            </div>
          ))}
          <Button
            type="primary"
            icon={<ShoppingCartOutlined />}
            loading={isSubmittingRequest}
            disabled={!hasPartsChanges}
            onClick={handleSubmitPartsRequest}
            style={{ 
              marginTop: '12px',
              background: hasPartsChanges ? 'linear-gradient(135deg, #FFC300 0%, #FFD54F 100%)' : '#D1D5DB',
              borderColor: hasPartsChanges ? '#FFC300' : '#D1D5DB',
              color: '#000',
              height: '40px',
              borderRadius: '8px',
              fontWeight: 600,
              boxShadow: hasPartsChanges ? '0 2px 4px rgba(255, 195, 0, 0.2)' : 'none',
              width: '100%',
              cursor: hasPartsChanges ? 'pointer' : 'not-allowed'
            }}
          >
            Submit Request
          </Button>
        </div>

        {/* Recommendations */}
        <Form.Item
          label="Recommendations"
          name="recommendations"
        >
          <TextArea
            rows={3}
            placeholder="Enter recommendations (optional)..."
            style={{ fontSize: '0.875rem' }}
          />
        </Form.Item>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
          <Button
            type="primary"
            size="large"
            htmlType="submit"
            loading={isSubmitting}
            style={{
              background: 'linear-gradient(135deg, #FFC300, #FFD54F)',
              borderColor: '#FFC300',
              color: '#000',
              fontWeight: 600,
              height: '40px',
              padding: '0 32px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(255, 195, 0, 0.3)',
            }}
          >
            Save Changes
          </Button>
        </div>
      </Form>
    </Modal>
    <PartsRequestModal
      open={isPartsRequestModalOpen}
      onClose={() => {
        setIsPartsRequestModalOpen(false);
        setEditingFieldIndex(null);
        setInitialEditParts([]);
      }}
      onSubmit={handlePartsRequest}
      customer={{ id: report.customerId, displayName: report.customerName }}
      car={{
        make: report.make,
        model: report.model,
        year: report.year,
        plateNumber: report.plateNumber
      }}
      parts={inventoryParts}
      initialParts={initialEditParts}
    />
    </>
  );
}
