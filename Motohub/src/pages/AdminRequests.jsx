import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getFirestore, collection, getDocs, updateDoc, doc, query, orderBy, getDoc, runTransaction } from 'firebase/firestore';
import { SearchOutlined, FilterOutlined, InfoCircleOutlined, MoreOutlined, PlusOutlined } from '@ant-design/icons';
import { Input, Button, Avatar, Dropdown, Menu, Modal, message, App, ConfigProvider } from 'antd';
import AdminSidebar from '../components/AdminSidebar';
import TopBar from '../components/TopBar';
import ProfileModal from '../components/modals/ProfileModal';
import Loading from '../components/Loading';
import { logHelpers } from '../utils/logger';
import '../css/AdminRequest.css';

function AdminRequestsContent() {
  const { message: messageApi } = App.useApp();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const { user } = useAuth();
  const db = getFirestore();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const requestsRef = collection(db, 'partRequests');
      const snapshot = await getDocs(requestsRef);
      
      // Fetch mechanic names for each request
      const requestsList = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const requestData = docSnap.data();
          let mechanicName = requestData.mechanicName || 'Unknown Mechanic';
          let customerName = requestData.customerName || 'Unknown Customer';
          
          // Try to fetch mechanic details if we have mechanicId
          if (requestData.mechanicId && !requestData.mechanicName) {
            try {
              const mechanicRef = doc(db, 'users', requestData.mechanicId);
              const mechanicDoc = await getDoc(mechanicRef);
              if (mechanicDoc.exists()) {
                mechanicName = mechanicDoc.data().displayName || mechanicDoc.data().email || 'Unknown Mechanic';
              }
            } catch (error) {
              console.error('Error fetching mechanic:', error);
            }
          }
          
          // Try to fetch customer details if we have customerId
          if (requestData.customerId && !requestData.customerName) {
            try {
              const customerRef = doc(db, 'users', requestData.customerId);
              const customerDoc = await getDoc(customerRef);
              if (customerDoc.exists()) {
                customerName = customerDoc.data().displayName || customerDoc.data().email || 'Unknown Customer';
              }
            } catch (error) {
              console.error('Error fetching customer:', error);
            }
          }
          
          return {
            id: docSnap.id,
            ...requestData,
            mechanicName,
            customerName,
            carDetails: requestData.carDetails || requestData.car || null
          };
        })
      );

      // Sort by createdAt descending (newest first)
      requestsList.sort((a, b) => {
        const dateA = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt)) : new Date(0);
        const dateB = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt)) : new Date(0);
        return dateB - dateA;
      });
    } catch (error) {
      console.error('Error fetching requests:', error);
      alert('Failed to fetch requests. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      const requestRef = doc(db, 'partRequests', requestId);
      await updateDoc(requestRef, {
        status: 'approved',
        approvedBy: user?.displayName || user?.email,
        approvedAt: new Date().toISOString()
      });
      
      // Update the local state instead of fetching all data
      setRequests(prevRequests => 
        prevRequests.map(req => 
          req.id === requestId 
            ? { 
                ...req, 
                status: 'approved',
                approvedBy: user?.displayName || user?.email,
                approvedAt: new Date().toISOString()
              }
            : req
        )
      );
      
      messageApi.success('Request approved successfully!');
      setDetailsModalOpen(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error approving request:', error);
      messageApi.error('Failed to approve request');
    }
  };

  const handleReject = async (requestId) => {
    try {
      const requestRef = doc(db, 'partRequests', requestId);
      await updateDoc(requestRef, {
        status: 'rejected',
        rejectedBy: user?.displayName || user?.email,
        rejectedAt: new Date().toISOString()
      });
      
      // Update the local state instead of fetching all data
      setRequests(prevRequests => 
        prevRequests.map(req => 
          req.id === requestId 
            ? { 
                ...req, 
                status: 'rejected',
                rejectedBy: user?.displayName || user?.email,
                rejectedAt: new Date().toISOString()
              }
            : req
        )
      );
      
      messageApi.error('Request rejected successfully!');
      setDetailsModalOpen(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error rejecting request:', error);
      messageApi.error('Failed to reject request');
    }
  };

  const handleRowClick = (request) => {
    setSelectedRequest(request);
    setDetailsModalOpen(true);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const calculateTotalTime = (request) => {
    if (!request.parts || !Array.isArray(request.parts)) return '0';
    return request.parts.reduce((sum, part) => sum + (part.quantity || 0), 0);
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.mechanicName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.carDetails?.plateNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by tab
    let matchesTab = true;
    if (activeTab === 'timeoff') {
      // Pending Requests tab - only show pending
      matchesTab = request.status === 'pending';
    } else if (activeTab === 'overtime') {
      // Approved Requests tab - only show approved
      matchesTab = request.status === 'approved';
    }
    // When activeTab === 'overview', matchesTab stays true - shows ALL statuses
    
    return matchesSearch && matchesTab;
  });

  const getStatusCounts = () => ({
    all: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length
  });

  const counts = getStatusCounts();

  if (loading) return <Loading text="Loading requests..." />;

  return (
    <div className="requests-page">
      <AdminSidebar sidebarOpen={sidebarOpen} user={user} />

      <div className={`requests-main ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        <TopBar
          title="Parts Requests Management"
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          notificationsCount={counts.pending}
          onProfileClick={() => setProfileOpen(true)}
        />

        <div className="requests-content">
          <h1 className="page-title">Parts Requests</h1>

          {/* Controls Card */}
          <div className="controls-card">
            {/* Tabs */}
            <div className="tabs">
              <button 
                className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button 
                className={`tab ${activeTab === 'timeoff' ? 'active' : ''}`}
                onClick={() => setActiveTab('timeoff')}
              >
                Pending Requests
              </button>
              <button 
                className={`tab ${activeTab === 'overtime' ? 'active' : ''}`}
                onClick={() => setActiveTab('overtime')}
              >
                Approved Requests
              </button>
            </div>

            {/* Actions Bar */}
            <div className="actions-bar">
              <Input
                placeholder="Search by mechanic, customer, or plate number..."
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: 320 }}
              />
            </div>
          </div>

          {/* Table Card */}
          <div className="table-card">
            <div className="card-header">
              <h2>Parts Requests ({filteredRequests.length})</h2>
              <button className="view-all" onClick={fetchRequests}>Refresh</button>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Mechanic</th>
                  <th>Customer</th>
                  <th>Vehicle</th>
                  <th>Parts Count</th>
                  <th>Request Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.length > 0 ? (
                  filteredRequests.map((request) => (
                    <tr 
                      key={request.id} 
                      onClick={() => handleRowClick(request)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <div className="name-cell">
                          <Avatar size={32} style={{ backgroundColor: '#3B82F6' }}>
                            {request.mechanicName?.charAt(0) || 'M'}
                          </Avatar>
                          <span>{request.mechanicName || 'Unknown Mechanic'}</span>
                        </div>
                      </td>
                      <td>{request.customerName || 'N/A'}</td>
                      <td>
                        {request.carDetails ? 
                          `${request.carDetails.year || ''} ${request.carDetails.make || ''} ${request.carDetails.model || ''}`.trim() || request.carDetails.plateNumber || 'N/A'
                          : 'N/A'}
                      </td>
                      <td>{request.parts?.length || 0} items</td>
                      <td>{formatDate(request.createdAt)}</td>
                      <td>
                        <span className={`status ${request.status || 'pending'}`}>
                          {(request.status || 'pending').charAt(0).toUpperCase() + (request.status || 'pending').slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>
                      {loading ? 'Loading requests...' : searchTerm ? 'No requests match your search' : requests.length === 0 ? 'No parts requests found in database' : 'No requests found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Request Details Modal */}
      <Modal
        title="Request Details"
        open={detailsModalOpen}
        onCancel={() => {
          setDetailsModalOpen(false);
          setSelectedRequest(null);
        }}
        footer={null}
        width={700}
      >
        {selectedRequest && (
          <div style={{ padding: '1rem 0' }}>
            {/* Request Information */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#111827' }}>
                Request Information
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.25rem' }}>Mechanic</p>
                  <p style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                    {selectedRequest.mechanicName || 'Unknown Mechanic'}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.25rem' }}>Customer</p>
                  <p style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                    {selectedRequest.customerName || 'N/A'}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.25rem' }}>Request Date</p>
                  <p style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                    {formatDate(selectedRequest.createdAt)}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.25rem' }}>Status</p>
                  <span className={`status ${selectedRequest.status || 'pending'}`}>
                    {(selectedRequest.status || 'pending').charAt(0).toUpperCase() + (selectedRequest.status || 'pending').slice(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Vehicle Information */}
            {selectedRequest.carDetails && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#111827' }}>
                  Vehicle Information
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.25rem' }}>Vehicle</p>
                    <p style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                      {`${selectedRequest.carDetails.year || ''} ${selectedRequest.carDetails.make || ''} ${selectedRequest.carDetails.model || ''}`.trim() || 'N/A'}
                    </p>
                  </div>
                  {selectedRequest.carDetails.plateNumber && (
                    <div>
                      <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.25rem' }}>Plate Number</p>
                      <p style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                        {selectedRequest.carDetails.plateNumber}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Parts Requested */}
            {selectedRequest.parts && selectedRequest.parts.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#111827' }}>
                  Parts Requested ({selectedRequest.parts.length} items)
                </h3>
                <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#F9FAFB' }}>
                      <tr>
                        <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#6B7280' }}>
                          Part Name
                        </th>
                        <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: 600, color: '#6B7280' }}>
                          Quantity
                        </th>
                        <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: 600, color: '#6B7280' }}>
                          Price
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRequest.parts.map((part, index) => (
                        <tr key={index} style={{ borderTop: '1px solid #E5E7EB' }}>
                          <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#111827' }}>
                            {part.name || 'N/A'}
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', color: '#111827' }}>
                            {part.quantity || 0}
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>
                            ₱{((part.price || 0) * (part.quantity || 0)).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot style={{ background: '#F9FAFB', borderTop: '2px solid #E5E7EB' }}>
                      <tr>
                        <td colSpan="2" style={{ padding: '0.75rem', fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>
                          Total Amount
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '1rem', fontWeight: 700, color: '#FBBF24' }}>
                          ₱{selectedRequest.parts.reduce((sum, part) => sum + ((part.price || 0) * (part.quantity || 0)), 0).toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Notes */}
            {selectedRequest.notes && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#111827' }}>
                  Notes
                </h3>
                <p style={{ padding: '1rem', background: '#FEF3C7', borderRadius: '8px', borderLeft: '4px solid #FBBF24', fontSize: '0.875rem', color: '#111827', margin: 0 }}>
                  {selectedRequest.notes}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <Button 
                size="large"
                onClick={() => {
                  setDetailsModalOpen(false);
                  setSelectedRequest(null);
                }}
              >
                Close
              </Button>
              {selectedRequest.status === 'pending' && (
                <>
                  <Button 
                    danger
                    size="large"
                    onClick={() => handleReject(selectedRequest.id)}
                  >
                    Reject Request
                  </Button>
                  <Button 
                    type="primary"
                    size="large"
                    style={{ background: '#10B981', borderColor: '#10B981' }}
                    onClick={() => handleApprove(selectedRequest.id)}
                  >
                    Approve Request
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} user={user} />
    </div>
  );
}

export default function AdminRequests() {
  return (
    <ConfigProvider>
      <App>
        <AdminRequestsContent />
      </App>
    </ConfigProvider>
  );
}

