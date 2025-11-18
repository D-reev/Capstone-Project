import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import { getFirestore, collection, getDocs, updateDoc, doc, query, orderBy, getDoc, runTransaction } from 'firebase/firestore';
import { SearchOutlined, FilterOutlined, InfoCircleOutlined, MoreOutlined, PlusOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { Input, Button, Avatar, Dropdown, Menu, Modal, message, App, ConfigProvider } from 'antd';
import { ChevronDown, Car, Package } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import NavigationBar from '../components/NavigationBar';
import ProfileModal from '../components/modals/ProfileModal';
import Loading from '../components/Loading';
import { logHelpers } from '../utils/logger';
import { notifyRequestStatusChange } from '../utils/auth';
import '../css/AdminRequest.css';

function AdminRequestsContent() {
  const { message: messageApi } = App.useApp();
  const { sidebarOpen } = useSidebar();
  const [profileOpen, setProfileOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [expandedMobileCards, setExpandedMobileCards] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
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

      setRequests(requestsList); // ← ADD THIS LINE
    } catch (error) {
      console.error('Error fetching requests:', error);
      messageApi.error('Failed to fetch requests. Check console for details.');
      setRequests([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      const requestRef = doc(db, 'partRequests', requestId);
      const requestSnap = await getDoc(requestRef);
      const requestData = requestSnap.data();
      
      await updateDoc(requestRef, {
        status: 'approved',
        approvedBy: user?.displayName || user?.email,
        approvedAt: new Date().toISOString()
      });
      
      // Send notification to mechanic
      if (requestData?.mechanicId) {
        await notifyRequestStatusChange(requestId, requestData.mechanicId, 'approved');
      }
      
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
      const requestSnap = await getDoc(requestRef);
      const requestData = requestSnap.data();
      
      await updateDoc(requestRef, {
        status: 'rejected',
        rejectedBy: user?.displayName || user?.email,
        rejectedAt: new Date().toISOString()
      });
      
      // Send notification to mechanic
      if (requestData?.mechanicId) {
        await notifyRequestStatusChange(
          requestId, 
          requestData.mechanicId, 
          'rejected', 
          requestData.adminNotes || ''
        );
      }
      
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

  const toggleMobileCard = (requestId) => {
    setExpandedMobileCards(prev =>
      prev.includes(requestId)
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    );
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
      <AdminSidebar />

      <div className={`requests-main ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        <NavigationBar
          title="Parts Requests Management"
          onProfileClick={() => setProfileOpen(true)}
          userRole="admin"
          userName={user?.displayName || 'Admin'}
          userEmail={user?.email || ''}
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
                  filteredRequests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((request) => (
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

            {/* Mobile Card List */}
            <div className="requests-mobile-list">
              {filteredRequests.length > 0 ? (
                filteredRequests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(request => {
                  const isExpanded = expandedMobileCards.includes(request.id);
                  const vehicleInfo = request.carDetails ? 
                    `${request.carDetails.year || ''} ${request.carDetails.make || ''} ${request.carDetails.model || ''}`.trim() || request.carDetails.plateNumber || 'N/A'
                    : 'N/A';
                  
                  return (
                    <div key={request.id} className="requests-mobile-card">
                      <div 
                        className="requests-mobile-card-header"
                        onClick={() => toggleMobileCard(request.id)}
                      >
                        <div className="requests-mobile-info">
                          <div className="requests-mobile-mechanic">
                            {request.mechanicName || 'Unknown Mechanic'}
                          </div>
                          <div className="requests-mobile-customer">
                            Customer: {request.customerName || 'N/A'}
                          </div>
                        </div>
                        <ChevronDown 
                          size={20} 
                          className={`requests-mobile-toggle ${isExpanded ? 'expanded' : ''}`}
                        />
                      </div>

                      <div className="requests-mobile-meta">
                        <span className="requests-mobile-badge vehicle">
                          <Car size={14} />
                          {vehicleInfo}
                        </span>
                        <span className="requests-mobile-badge parts">
                          <Package size={14} />
                          {request.parts?.length || 0} parts
                        </span>
                        <span className={`requests-mobile-badge status-${request.status || 'pending'}`}>
                          {(request.status || 'pending').charAt(0).toUpperCase() + (request.status || 'pending').slice(1)}
                        </span>
                      </div>

                      {isExpanded && (
                        <div className="requests-mobile-expanded">
                          <div className="requests-mobile-detail">
                            <span className="requests-mobile-detail-label">Request Date</span>
                            <span className="requests-mobile-detail-value">{formatDate(request.createdAt)}</span>
                          </div>
                          {request.carDetails?.plateNumber && (
                            <div className="requests-mobile-detail">
                              <span className="requests-mobile-detail-label">Plate Number</span>
                              <span className="requests-mobile-detail-value">{request.carDetails.plateNumber}</span>
                            </div>
                          )}
                          {request.notes && (
                            <div className="requests-mobile-detail">
                              <span className="requests-mobile-detail-label">Notes</span>
                              <span className="requests-mobile-detail-value">{request.notes}</span>
                            </div>
                          )}

                          <div className="requests-mobile-actions">
                            <button 
                              className="requests-mobile-view"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRowClick(request);
                              }}
                            >
                              <InfoCircleOutlined />
                              View Details
                            </button>
                            {request.status === 'pending' && (
                              <>
                                <button 
                                  className="requests-mobile-approve"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleApprove(request.id);
                                  }}
                                >
                                  <CheckOutlined />
                                  Approve
                                </button>
                                <button 
                                  className="requests-mobile-reject"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReject(request.id);
                                  }}
                                >
                                  <CloseOutlined />
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div style={{ 
                  padding: '2rem', 
                  textAlign: 'center', 
                  color: '#6B7280',
                  fontSize: '0.875rem'
                }}>
                  {loading ? 'Loading requests...' : searchTerm ? 'No requests match your search' : requests.length === 0 ? 'No parts requests found in database' : 'No requests found'}
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {filteredRequests.length > itemsPerPage && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '16px 24px',
                borderTop: '1px solid #e5e7eb',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <span style={{ 
                  color: '#6B7280',
                  fontSize: '14px'
                }}>
                  {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredRequests.length)} of {filteredRequests.length} entries
                </span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    style={{
                      width: '32px',
                      height: '32px',
                      background: currentPage === 1 ? '#f3f4f6' : 'linear-gradient(135deg, #FFC300 0%, #FFD54F 100%)',
                      color: currentPage === 1 ? '#9ca3af' : '#000',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}
                  >
                    &lt;&lt;
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    style={{
                      width: '32px',
                      height: '32px',
                      background: currentPage === 1 ? '#f3f4f6' : 'linear-gradient(135deg, #FFC300 0%, #FFD54F 100%)',
                      color: currentPage === 1 ? '#9ca3af' : '#000',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    &lt;
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={Math.ceil(filteredRequests.length / itemsPerPage)}
                    value={currentPage}
                    onChange={(e) => {
                      const page = parseInt(e.target.value);
                      if (page >= 1 && page <= Math.ceil(filteredRequests.length / itemsPerPage)) {
                        setCurrentPage(page);
                      }
                    }}
                    style={{
                      width: '50px',
                      height: '32px',
                      textAlign: 'center',
                      background: '#fff',
                      color: '#374151',
                      border: '1px solid #FFC300',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  />
                  <span style={{ color: '#FFC300', fontSize: '14px', fontWeight: '600' }}>of {Math.ceil(filteredRequests.length / itemsPerPage)}</span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredRequests.length / itemsPerPage)))}
                    disabled={currentPage >= Math.ceil(filteredRequests.length / itemsPerPage)}
                    style={{
                      width: '32px',
                      height: '32px',
                      background: currentPage >= Math.ceil(filteredRequests.length / itemsPerPage) ? '#f3f4f6' : 'linear-gradient(135deg, #FFC300 0%, #FFD54F 100%)',
                      color: currentPage >= Math.ceil(filteredRequests.length / itemsPerPage) ? '#9ca3af' : '#000',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: currentPage >= Math.ceil(filteredRequests.length / itemsPerPage) ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    &gt;
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.ceil(filteredRequests.length / itemsPerPage))}
                    disabled={currentPage >= Math.ceil(filteredRequests.length / itemsPerPage)}
                    style={{
                      width: '32px',
                      height: '32px',
                      background: currentPage >= Math.ceil(filteredRequests.length / itemsPerPage) ? '#f3f4f6' : 'linear-gradient(135deg, #FFC300 0%, #FFD54F 100%)',
                      color: currentPage >= Math.ceil(filteredRequests.length / itemsPerPage) ? '#9ca3af' : '#000',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: currentPage >= Math.ceil(filteredRequests.length / itemsPerPage) ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}
                  >
                    &gt;&gt;
                  </button>
                </div>
              </div>
            )}
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

