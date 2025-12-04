import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { ConfigProvider, Input, Select, Tag, Empty, Tabs, Badge, Modal, Descriptions, Divider } from 'antd';
import { SearchOutlined, FilterOutlined, EyeOutlined } from '@ant-design/icons';
import { Package, User, Car, Calendar, Clock, CheckCircle, XCircle, Wrench } from 'lucide-react';
import SuperAdminSidebar from '../components/SuperAdminSidebar';
import NavigationBar from '../components/NavigationBar';
import Loading from '../components/Loading';
import ProfileModal from '../components/modals/ProfileModal';
import '../css/AllPartsRequests.css';

const { Option } = Select;
const { TabPane } = Tabs;

export default function AllPartsRequests() {
  const { sidebarOpen } = useSidebar();
  const { user } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allRequests, setAllRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMechanic, setFilterMechanic] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('all');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const itemsPerPage = 12;
  const db = getFirestore();

  useEffect(() => {
    fetchAllPartsRequests();
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchAllPartsRequests = async () => {
    try {
      setLoading(true);
      const allRequestsData = [];
      
      // Fetch from partRequests collection
      const requestsRef = collection(db, 'partRequests');
      const requestsSnapshot = await getDocs(requestsRef);
      
      // Fetch mechanic and customer data for each request
      await Promise.all(requestsSnapshot.docs.map(async (requestDoc) => {
        const requestData = requestDoc.data();
        
        let mechanicName = requestData.mechanicName || 'Unknown Mechanic';
        let customerName = requestData.customerName || 'Unknown Customer';
        
        // Fetch mechanic details
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
        
        // Fetch customer details
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
        
        allRequestsData.push({
          id: requestDoc.id,
          ...requestData,
          mechanicName,
          customerName,
          carDetails: requestData.carDetails || requestData.car || null
        });
      }));
      
      // Sort by creation date, newest first
      allRequestsData.sort((a, b) => {
        const dateA = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt)) : new Date(0);
        const dateB = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt)) : new Date(0);
        return dateB - dateA;
      });
      
      setAllRequests(allRequestsData);
    } catch (error) {
      console.error('Error fetching parts requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setDetailsModalOpen(true);
  };

  const handleCloseModal = () => {
    setDetailsModalOpen(false);
    setSelectedRequest(null);
  };

  const filteredRequests = allRequests.filter(request => {
    const matchesSearch = 
      request.mechanicName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.carDetails?.plateNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.carDetails?.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.carDetails?.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.parts?.some(part => part.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
    const matchesMechanic = filterMechanic === 'all' || request.mechanicName === filterMechanic;
    const matchesTab = activeTab === 'all' || request.status === activeTab;
    
    return matchesSearch && matchesStatus && matchesMechanic && matchesTab;
  });

  const uniqueMechanics = [...new Set(allRequests.map(r => r.mechanicName).filter(Boolean))].sort();

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={16} />;
      case 'pending':
        return <Clock size={16} />;
      case 'rejected':
        return <XCircle size={16} />;
      default:
        return <Package size={16} />;
    }
  };

  const calculateTotalItems = (parts) => {
    if (!parts || !Array.isArray(parts)) return 0;
    return parts.reduce((sum, part) => sum + (part.quantity || 0), 0);
  };

  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  const pendingCount = allRequests.filter(r => r.status === 'pending').length;
  const approvedCount = allRequests.filter(r => r.status === 'approved').length;
  const rejectedCount = allRequests.filter(r => r.status === 'rejected').length;

  if (loading) {
    return <Loading text="Loading parts requests..." />;
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#FBBF24',
          colorLink: '#FBBF24',
          colorLinkHover: '#D97706',
          borderRadius: 8,
        },
      }}
    >
      <div className="all-parts-requests-page">
        <SuperAdminSidebar />

        <div className={`main-content ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
          <NavigationBar
            title="All Parts Requests"
            onProfileClick={() => setProfileOpen(true)}
            userRole="superadmin"
            userName={user?.displayName || 'Super Admin'}
            userEmail={user?.email || ''}
          />

          <div className="all-parts-requests-container">
            <div className="all-parts-requests-card">
              {/* Header */}
              <div className="all-parts-requests-header">
                <div className="all-parts-requests-header-left">
                  <h1 className="all-parts-requests-title">Parts Requests</h1>
                  <span className="all-parts-requests-subtitle">
                    Showing {filteredRequests.length} of {allRequests.length} requests
                  </span>
                </div>
                <div className="all-parts-requests-actions">
                  <Select
                    value={filterMechanic}
                    onChange={(value) => setFilterMechanic(value)}
                    style={{ width: 200 }}
                    size="large"
                    suffixIcon={<FilterOutlined />}
                  >
                    <Option value="all">All Mechanics</Option>
                    {uniqueMechanics.map(mechanic => (
                      <Option key={mechanic} value={mechanic}>{mechanic}</Option>
                    ))}
                  </Select>
                  <Input
                    placeholder="Search requests..."
                    prefix={<SearchOutlined style={{ color: '#9CA3AF' }} />}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: 300 }}
                    size="large"
                  />
                </div>
              </div>

              {/* Stats Row */}
              <div className="all-parts-requests-stats">
                <div className="stat-card">
                  <Package size={24} className="stat-icon" />
                  <div className="stat-content">
                    <div className="stat-value">{allRequests.length}</div>
                    <div className="stat-label">Total Requests</div>
                  </div>
                </div>
                <div className="stat-card pending">
                  <Clock size={24} className="stat-icon" />
                  <div className="stat-content">
                    <div className="stat-value">{pendingCount}</div>
                    <div className="stat-label">Pending</div>
                  </div>
                </div>
                <div className="stat-card approved">
                  <CheckCircle size={24} className="stat-icon" />
                  <div className="stat-content">
                    <div className="stat-value">{approvedCount}</div>
                    <div className="stat-label">Approved</div>
                  </div>
                </div>
                <div className="stat-card rejected">
                  <XCircle size={24} className="stat-icon" />
                  <div className="stat-content">
                    <div className="stat-value">{rejectedCount}</div>
                    <div className="stat-label">Rejected</div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <Tabs 
                activeKey={activeTab} 
                onChange={setActiveTab}
                className="parts-requests-tabs"
              >
                <TabPane 
                  tab={
                    <span>
                      <Package size={16} style={{ marginRight: 8 }} />
                      All Requests
                      <Badge count={allRequests.length} style={{ marginLeft: 8, backgroundColor: '#FBBF24' }} />
                    </span>
                  } 
                  key="all"
                />
                <TabPane 
                  tab={
                    <span>
                      <Clock size={16} style={{ marginRight: 8 }} />
                      Pending
                      <Badge count={pendingCount} style={{ marginLeft: 8, backgroundColor: '#F59E0B' }} />
                    </span>
                  } 
                  key="pending"
                />
                <TabPane 
                  tab={
                    <span>
                      <CheckCircle size={16} style={{ marginRight: 8 }} />
                      Approved
                      <Badge count={approvedCount} style={{ marginLeft: 8, backgroundColor: '#10B981' }} />
                    </span>
                  } 
                  key="approved"
                />
                <TabPane 
                  tab={
                    <span>
                      <XCircle size={16} style={{ marginRight: 8 }} />
                      Rejected
                      <Badge count={rejectedCount} style={{ marginLeft: 8, backgroundColor: '#EF4444' }} />
                    </span>
                  } 
                  key="rejected"
                />
              </Tabs>

              {/* Requests Grid */}
              <div className="all-parts-requests-grid">
                {paginatedRequests.length === 0 ? (
                  <div className="empty-state">
                    <Empty
                      description={
                        searchTerm || filterMechanic !== 'all'
                          ? 'No requests found matching your filters'
                          : 'No parts requests available yet'
                      }
                    />
                  </div>
                ) : (
                  paginatedRequests.map((request) => {
                    return (
                      <div key={request.id} className="request-card">
                        {/* Request Header */}
                        <div className="request-header">
                          <div className="request-status-badge">
                            {getStatusIcon(request.status)}
                            <Tag color={getStatusColor(request.status)}>
                              {request.status?.toUpperCase()}
                            </Tag>
                          </div>
                          <div className="request-date">
                            <Calendar size={14} />
                            {formatDate(request.createdAt)}
                          </div>
                        </div>

                        {/* Request Info */}
                        <div className="request-info">
                          <div className="request-section">
                            <div className="section-label">
                              <Wrench size={16} />
                              Mechanic Head
                            </div>
                            <div className="section-value">{request.mechanicName}</div>
                          </div>

                          <div className="request-section">
                            <div className="section-label">
                              <User size={16} />
                              Customer
                            </div>
                            <div className="section-value">{request.customerName}</div>
                          </div>

                          {request.carDetails && (
                            <div className="request-section">
                              <div className="section-label">
                                <Car size={16} />
                                Vehicle
                              </div>
                              <div className="section-value">
                                <strong>{request.carDetails.make} {request.carDetails.model}</strong>
                                <span className="plate-number">{request.carDetails.plateNumber}</span>
                              </div>
                            </div>
                          )}

                          <div className="request-section">
                            <div className="section-label">
                              <Package size={16} />
                              Items Requested
                            </div>
                            <div className="section-value">
                              {request.parts?.length || 0} types ({calculateTotalItems(request.parts)} total items)
                            </div>
                          </div>

                          {/* View Details Button */}
                          <button
                            className="toggle-details-btn"
                            onClick={() => handleViewDetails(request)}
                          >
                            <EyeOutlined />
                            View Details
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination-container">
                  <div className="pagination-info">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="pagination-controls">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="pagination-btn"
                    >
                      &lt;&lt;
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="pagination-btn"
                    >
                      &lt;
                    </button>
                    <span className="pagination-current">{currentPage}</span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="pagination-btn"
                    >
                      &gt;
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="pagination-btn"
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
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Package size={20} />
              <span>Parts Request Details</span>
            </div>
          }
          open={detailsModalOpen}
          onCancel={handleCloseModal}
          footer={null}
          width={800}
        >
          {selectedRequest && (
            <div style={{ padding: '1rem 0' }}>
              {/* Status Badge */}
              <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Tag 
                  color={getStatusColor(selectedRequest.status)}
                  style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                >
                  {getStatusIcon(selectedRequest.status)}
                  <span style={{ marginLeft: '0.5rem' }}>
                    {selectedRequest.status?.toUpperCase()}
                  </span>
                </Tag>
                <span style={{ color: '#6B7280', fontSize: '0.875rem' }}>
                  <Calendar size={14} style={{ marginRight: '0.25rem' }} />
                  {formatDate(selectedRequest.createdAt)}
                </span>
              </div>

              {/* Main Information */}
              <Descriptions bordered column={1} size="small" style={{ marginBottom: '1.5rem' }}>
                <Descriptions.Item label="Mechanic Head">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Wrench size={16} />
                    {selectedRequest.mechanicName}
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Customer">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={16} />
                    {selectedRequest.customerName}
                  </div>
                </Descriptions.Item>
                {selectedRequest.carDetails && (
                  <Descriptions.Item label="Vehicle">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Car size={16} />
                      <div>
                        <strong>{selectedRequest.carDetails.make} {selectedRequest.carDetails.model}</strong>
                        <span style={{ marginLeft: '0.5rem', color: '#6B7280' }}>({selectedRequest.carDetails.plateNumber})</span>
                      </div>
                    </div>
                  </Descriptions.Item>
                )}
              </Descriptions>

              {/* Parts Requested */}
              {selectedRequest.parts && Array.isArray(selectedRequest.parts) && selectedRequest.parts.length > 0 && (
                <>
                  <Divider orientation="left">Parts Requested ({selectedRequest.parts.length} items)</Divider>
                  <div style={{ marginBottom: '1.5rem' }}>
                    {selectedRequest.parts.map((part, index) => (
                      <div 
                        key={index} 
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          padding: '0.75rem', 
                          background: '#F9FAFB', 
                          borderRadius: '6px',
                          marginBottom: '0.5rem',
                          border: '1px solid #E5E7EB'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{part.name}</div>
                          {part.brand && (
                            <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                              Brand: {part.brand}
                            </div>
                          )}
                        </div>
                        <div style={{ 
                          background: '#FBBF24', 
                          color: '#000',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '4px',
                          fontWeight: 600
                        }}>
                          Qty: {part.quantity}
                        </div>
                      </div>
                    ))}
                  </div>
                </> 
              )}

              {/* Reason (if rejected) */}
              {selectedRequest.status === 'rejected' && selectedRequest.reason && (
                <>
                  <Divider orientation="left">Rejection Reason</Divider>
                  <div style={{ 
                    padding: '1rem', 
                    background: '#FEE2E2', 
                    borderRadius: '8px',
                    border: '1px solid #FECACA',
                    color: '#991B1B'
                  }}>
                    {selectedRequest.reason}
                  </div>
                </> 
              )}

              {/* Approval Info */}
              {selectedRequest.approvedBy && (
                <div style={{ 
                  marginTop: '1.5rem',
                  padding: '1rem', 
                  background: '#F0FDF4', 
                  borderRadius: '8px',
                  border: '1px solid #BBF7D0'
                }}>
                  <strong style={{ color: '#059669' }}>Processed by: </strong>
                  <span style={{ color: '#047857' }}>{selectedRequest.approvedBy}</span>
                  {selectedRequest.processedAt && (
                    <div style={{ fontSize: '0.875rem', color: '#059669', marginTop: '0.25rem' }}>
                      on {formatDate(selectedRequest.processedAt)}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </Modal>

        <ProfileModal 
          open={profileOpen} 
          onClose={() => setProfileOpen(false)} 
          user={user} 
        />
      </div>
    </ConfigProvider>
  );
}
