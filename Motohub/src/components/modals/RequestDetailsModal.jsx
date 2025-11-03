import React, { useState, useEffect } from 'react';
import { Modal, Button, Descriptions, Tag, Typography, App, Space, Divider } from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  UserOutlined,
  CarOutlined,
  PhoneOutlined,
  MailOutlined,
  ShoppingOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { notifyRequestStatusChange } from '../../utils/auth';
import './Modal.css';

const { Title, Text } = Typography;

export default function RequestDetailsModal({
  requestId,
  open,
  onClose,
  onStatusChange
}) {
  const { message: messageApi } = App.useApp();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [mechanicData, setMechanicData] = useState(null);
  const db = getFirestore();

  useEffect(() => {
    if (open && requestId) {
      fetchRequestDetails();
    }
  }, [open, requestId]);

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      const requestRef = doc(db, 'partRequests', requestId);
      const requestSnap = await getDoc(requestRef);
      
      if (requestSnap.exists()) {
        const requestData = {
          id: requestSnap.id,
          ...requestSnap.data()
        };
        setRequest(requestData);
        
        // Fetch mechanic details if we have mechanicId
        if (requestData.mechanicId) {
          const mechanicRef = doc(db, 'users', requestData.mechanicId);
          const mechanicSnap = await getDoc(mechanicRef);
          if (mechanicSnap.exists()) {
            setMechanicData(mechanicSnap.data());
          }
        }
      } else {
        messageApi.error('Request not found');
        onClose();
      }
    } catch (error) {
      console.error('Error fetching request details:', error);
      messageApi.error('Failed to load request details');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setProcessing(true);
      const requestRef = doc(db, 'partRequests', requestId);
      
      await updateDoc(requestRef, {
        status: 'approved',
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Send notification to mechanic
      if (request?.mechanicId) {
        await notifyRequestStatusChange(requestId, request.mechanicId, 'approved');
      }

      messageApi.success('Request approved successfully!');
      onStatusChange?.();
      onClose();
    } catch (error) {
      console.error('Error approving request:', error);
      messageApi.error('Failed to approve request');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    try {
      setProcessing(true);
      const requestRef = doc(db, 'partRequests', requestId);
      
      await updateDoc(requestRef, {
        status: 'rejected',
        rejectedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Send notification to mechanic
      if (request?.mechanicId) {
        await notifyRequestStatusChange(
          requestId, 
          request.mechanicId, 
          'rejected',
          request.adminNotes || ''
        );
      }

      messageApi.success('Request rejected');
      onStatusChange?.();
      onClose();
    } catch (error) {
      console.error('Error rejecting request:', error);
      messageApi.error('Failed to reject request');
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkFulfilled = async () => {
    try {
      setProcessing(true);
      const requestRef = doc(db, 'partRequests', requestId);
      
      await updateDoc(requestRef, {
        status: 'fulfilled',
        fulfilledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      messageApi.success('Request marked as fulfilled!');
      onStatusChange?.();
      onClose();
    } catch (error) {
      console.error('Error updating request:', error);
      messageApi.error('Failed to update request');
    } finally {
      setProcessing(false);
    }
  };

  const handleViewInventory = () => {
    messageApi.info('Redirecting to inventory...');
    window.location.href = '/inventory';
  };

  const handleViewMechanicHistory = () => {
    messageApi.info('Viewing mechanic request history...');
    // Could open another modal or redirect
  };

  if (!request) return null;

  const isPending = request.status === 'pending';
  const isApproved = request.status === 'approved';
  const totalAmount = request.parts?.reduce((sum, part) => sum + (part.price * part.quantity), 0) || 0;

  return (
    <Modal
      open={open}
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
          <Text style={{ fontSize: 18, fontWeight: 700, color: '#1F2937' }}>Parts Request Details</Text>
          <Tag 
            color={
              request.status === 'pending' ? 'warning' : 
              request.status === 'approved' ? 'success' : 
              request.status === 'fulfilled' ? 'processing' : 
              'error'
            }
            style={{ 
              textTransform: 'uppercase', 
              fontWeight: 600,
              fontSize: 12,
              padding: '4px 12px',
              borderRadius: 6
            }}
          >
            {request.status}
          </Tag>
        </div>
      }
      onCancel={onClose}
      footer={null}
      width={750}
      centered
      loading={loading}
      styles={{
        header: {
          background: 'linear-gradient(135deg, #FFC300 0%, #FFD54F 100%)',
          borderBottom: 'none',
          borderRadius: '8px 8px 0 0',
          padding: '20px 24px'
        },
        body: {
          padding: '24px'
        }
      }}
    >
      {/* Mechanic Information Card */}
      <div style={{
        background: 'linear-gradient(135deg, #1F2937 0%, #374151 100%)',
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
        color: 'white',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space size={12}>
              <div style={{
                background: 'rgba(255, 195, 0, 0.15)',
                borderRadius: 8,
                padding: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <UserOutlined style={{ fontSize: 24, color: '#FFC300' }} />
              </div>
              <div>
                <Text style={{ color: '#9CA3AF', fontSize: 12, display: 'block', marginBottom: 4 }}>
                  Requested by
                </Text>
                <Text style={{ color: 'white', fontSize: 17, fontWeight: 700 }}>
                  {mechanicData?.displayName || request.mechanicName || 'Unknown Mechanic'}
                </Text>
              </div>
            </Space>
            {request.followUpRequested && (
              <Tag 
                color="blue" 
                style={{ 
                  margin: 0,
                  padding: '4px 12px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600
                }}
              >
                🔔 Follow-up Requested
              </Tag>
            )}
          </div>
          
          {mechanicData && (
            <Space size={20} style={{ marginTop: 8, paddingLeft: 46 }}>
              {mechanicData.email && (
                <Space size={6}>
                  <MailOutlined style={{ color: '#9CA3AF', fontSize: 14 }} />
                  <Text style={{ color: '#D1D5DB', fontSize: 13 }}>{mechanicData.email}</Text>
                </Space>
              )}
              {mechanicData.mobileNumber && (
                <Space size={6}>
                  <PhoneOutlined style={{ color: '#9CA3AF', fontSize: 14 }} />
                  <Text style={{ color: '#D1D5DB', fontSize: 13 }}>{mechanicData.mobileNumber}</Text>
                </Space>
              )}
            </Space>
          )}
        </Space>
      </div>

      {/* Quick Actions */}
      {isPending && (
        <>
          <Title level={5} style={{ marginTop: 0, marginBottom: 12, color: '#6B7280' }}>Quick Actions</Title>
          <Space wrap style={{ marginBottom: 20 }}>
            <Button 
              icon={<ShoppingOutlined />}
              onClick={handleViewInventory}
              style={{
                height: 36,
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                borderColor: '#FFC300',
                color: '#FFC300',
                background: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#FFD54F';
                e.currentTarget.style.color = '#FFD54F';
                e.currentTarget.style.background = 'rgba(255, 195, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#FFC300';
                e.currentTarget.style.color = '#FFC300';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              Check Inventory
            </Button>
            <Button 
              icon={<HistoryOutlined />}
              onClick={handleViewMechanicHistory}
              style={{
                height: 36,
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                borderColor: '#FFC300',
                color: '#FFC300',
                background: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#FFD54F';
                e.currentTarget.style.color = '#FFD54F';
                e.currentTarget.style.background = 'rgba(255, 195, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#FFC300';
                e.currentTarget.style.color = '#FFC300';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              Mechanic History
            </Button>
          </Space>
          <Divider style={{ margin: '16px 0' }} />
        </>
      )}

      {/* Request Details */}
      <Descriptions column={1} bordered size="small" style={{ marginBottom: '16px' }}>
        <Descriptions.Item label={<Space><CarOutlined />Customer</Space>}>
          {request.customerName || request.customer?.name || 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label={<Space><CarOutlined />Vehicle</Space>}>
          {request.car?.year} {request.car?.make} {request.car?.model}
          {request.car?.plateNumber ? ` (${request.car.plateNumber})` : ''}
        </Descriptions.Item>
        <Descriptions.Item label="Priority">
          <Space>
            <Tag color={request.urgent || request.priority === 'urgent' ? 'red' : 'default'}>
              {request.urgent ? 'URGENT' : (request.priority || 'normal').toUpperCase()}
            </Tag>
            {request.followUpRequestedAt && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                Follow-up: {new Date(request.followUpRequestedAt).toLocaleString()}
              </Text>
            )}
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="Notes">
          {request.notes || '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Requested On">
          {request.createdAt ? (
            request.createdAt.toDate ? 
              request.createdAt.toDate().toLocaleString() : 
              new Date(request.createdAt).toLocaleString()
          ) : '—'}
        </Descriptions.Item>
      </Descriptions>

      <Title level={5} style={{ marginTop: 16, marginBottom: 12 }}>
        Parts Requested ({request.parts?.length || 0})
      </Title>
      {Array.isArray(request.parts) && request.parts.length > 0 ? (
        <>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 8,
            marginBottom: 12
          }}>
            {request.parts.map((part, index) => (
              <div key={index} style={{ 
                background: '#f9fafb', 
                borderRadius: 8, 
                padding: '12px 16px',
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                borderLeft: '4px solid #FFC300'
              }}>
                <Text strong>{part.name}</Text>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <Text type="secondary">Qty: {part.quantity}</Text>
                  <Text strong style={{ color: '#FFC300' }}>
                    ₱{(part.price * part.quantity).toLocaleString()}
                  </Text>
                </div>
              </div>
            ))}
          </div>
          <div style={{
            background: '#1F2937',
            padding: '12px 16px',
            borderRadius: 8,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24
          }}>
            <Text strong style={{ color: 'white' }}>Total Amount:</Text>
            <Text strong style={{ color: '#FFC300', fontSize: 18 }}>
              ₱{totalAmount.toLocaleString()}
            </Text>
          </div>
        </>
      ) : (
        <Text type="secondary" style={{ display: 'block', marginBottom: 24, fontStyle: 'italic' }}>
          No parts listed
        </Text>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: 20 }}>
        {isPending ? (
          <>
            <Button 
              icon={<CheckCircleOutlined />}
              onClick={handleApprove}
              disabled={processing}
              loading={processing}
              style={{
                height: 42,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #10B981, #059669)',
                borderColor: '#10B981',
                color: '#fff',
                fontWeight: 600
              }}
              onMouseEnter={(e) => {
                if (!processing) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #059669, #047857)';
                  e.currentTarget.style.borderColor = '#059669';
                }
              }}
              onMouseLeave={(e) => {
                if (!processing) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #10B981, #059669)';
                  e.currentTarget.style.borderColor = '#10B981';
                }
              }}
            >
              Approve
            </Button>
            <Button 
              icon={<CloseCircleOutlined />}
              onClick={handleReject}
              disabled={processing}
              loading={processing}
              style={{
                height: 42,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                borderColor: '#EF4444',
                color: '#fff',
                fontWeight: 600
              }}
              onMouseEnter={(e) => {
                if (!processing) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #DC2626, #B91C1C)';
                  e.currentTarget.style.borderColor = '#DC2626';
                }
              }}
              onMouseLeave={(e) => {
                if (!processing) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #EF4444, #DC2626)';
                  e.currentTarget.style.borderColor = '#EF4444';
                }
              }}
            >
              Reject
            </Button>
            <Button 
              onClick={onClose}
              disabled={processing}
              style={{
                height: 42,
                borderRadius: 8,
                borderColor: '#FFC300',
                color: '#FFC300',
                background: 'transparent',
                fontWeight: 600
              }}
              onMouseEnter={(e) => {
                if (!processing) {
                  e.currentTarget.style.borderColor = '#FFD54F';
                  e.currentTarget.style.color = '#FFD54F';
                }
              }}
              onMouseLeave={(e) => {
                if (!processing) {
                  e.currentTarget.style.borderColor = '#FFC300';
                  e.currentTarget.style.color = '#FFC300';
                }
              }}
            >
              Cancel
            </Button>
          </>
        ) : isApproved ? (
          <>
            <Button 
              onClick={handleMarkFulfilled}
              disabled={processing}
              loading={processing}
              style={{
                height: 42,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                borderColor: '#3B82F6',
                color: '#fff',
                fontWeight: 600
              }}
              onMouseEnter={(e) => {
                if (!processing) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #2563EB, #1D4ED8)';
                  e.currentTarget.style.borderColor = '#2563EB';
                }
              }}
              onMouseLeave={(e) => {
                if (!processing) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #3B82F6, #2563EB)';
                  e.currentTarget.style.borderColor = '#3B82F6';
                }
              }}
            >
              Mark as Fulfilled
            </Button>
            <Button 
              onClick={onClose}
              style={{
                height: 42,
                borderRadius: 8,
                borderColor: '#FFC300',
                color: '#FFC300',
                background: 'transparent',
                fontWeight: 600
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#FFD54F';
                e.currentTarget.style.color = '#FFD54F';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#FFC300';
                e.currentTarget.style.color = '#FFC300';
              }}
            >
              Close
            </Button>
          </>
        ) : (
          <Button 
            onClick={onClose}
            style={{
              height: 42,
              borderRadius: 8,
              borderColor: '#FFC300',
              color: '#FFC300',
              background: 'transparent',
              fontWeight: 600
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#FFD54F';
              e.currentTarget.style.color = '#FFD54F';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#FFC300';
              e.currentTarget.style.color = '#FFC300';
            }}
          >
            Close
          </Button>
        )}
      </div>
    </Modal>
  );
}