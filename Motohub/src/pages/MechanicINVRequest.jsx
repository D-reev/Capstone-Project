import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import { getFirestore, collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { createFollowUpNotification } from '../utils/auth';
import { App } from 'antd';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Search,
  Calendar,
  User as UserIcon,
  Car,
  Bell
} from 'lucide-react';
import MechanicSidebar from '../components/MechanicSidebar';
import NavigationBar from '../components/NavigationBar';
import ProfileModal from '../components/modals/ProfileModal';
import '../css/MechanicINVRequest.css';

export default function MechanicINVRequest() {
  const { user } = useAuth();
  const { sidebarOpen } = useSidebar();
  const { message: messageApi } = App.useApp();
  const [profileOpen, setProfileOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [followingUp, setFollowingUp] = useState({});
  const [expandedRows, setExpandedRows] = useState([]);
  const db = getFirestore();

  useEffect(() => {
    if (user) {
      fetchMyRequests();
    }
  }, [user]);

  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      const requestsRef = collection(db, 'partRequests');
      const q = query(
        requestsRef,
        where('mechanicId', '==', user.uid)
      );

      const snapshot = await getDocs(q);
      
      // Fetch car details for each request
      const requestsList = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const requestData = docSnap.data();
          let carDetails = requestData.carDetails || requestData.car || null;
          
          // If we have a car ID and customer ID, fetch full car details
          if (requestData.car?.id && requestData.customerId) {
            try {
              const carRef = doc(db, `users/${requestData.customerId}/cars/${requestData.car.id}`);
              const carDoc = await getDoc(carRef);
              
              if (carDoc.exists()) {
                carDetails = {
                  ...requestData.car,
                  ...carDoc.data()
                };
              }
            } catch (error) {
              console.error('Error fetching car details:', error);
              // Fall back to the car data stored in the request
              carDetails = requestData.car;
            }
          }
          
          return {
            id: docSnap.id,
            ...requestData,
            carDetails: carDetails,
            customerName: requestData.customer?.name || requestData.customerName || 'Unknown'
          };
        })
      );
      
      // Sort by createdAt in descending order (newest first)
      requestsList.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB - dateA;
      });

      setRequests(requestsList);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpandRow = (requestId) => {
    setExpandedRows(prev => 
      prev.includes(requestId) 
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    );
  };

  const handleFollowUp = async (requestId) => {
    try {
      setFollowingUp(prev => ({ ...prev, [requestId]: true }));
      
      await createFollowUpNotification(requestId, user.uid, user.displayName || 'Mechanic');
      
      messageApi.success('Follow-up request sent to admin');
      
      // Refresh the requests to show updated follow-up status
      await fetchMyRequests();
    } catch (error) {
      console.error('Error sending follow-up:', error);
      messageApi.error('Failed to send follow-up request');
    } finally {
      setFollowingUp(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <Clock size={18} style={{ color: '#f59e0b' }} />;
      case 'approved':
        return <CheckCircle size={18} style={{ color: '#10b981' }} />;
      case 'rejected':
        return <XCircle size={18} style={{ color: '#ef4444' }} />;
      case 'fulfilled':
        return <CheckCircle size={18} style={{ color: '#3b82f6' }} />;
      default:
        return <AlertCircle size={18} style={{ color: '#6b7280' }} />;
    }
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'status-pending';
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      case 'fulfilled':
        return 'status-fulfilled';
      default:
        return 'status-default';
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.carDetails?.plateNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.parts?.some(part => part.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterStatus === 'all' || request.status?.toLowerCase() === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusCounts = () => {
    return {
      all: requests.length,
      pending: requests.filter(r => r.status?.toLowerCase() === 'pending').length,
      approved: requests.filter(r => r.status?.toLowerCase() === 'approved').length,
      fulfilled: requests.filter(r => r.status?.toLowerCase() === 'fulfilled').length,
      rejected: requests.filter(r => r.status?.toLowerCase() === 'rejected').length
    };
  };

  const counts = getStatusCounts();

  if (loading) {
    return (
      <div className="dashboard-container mechanic-requests-page">
        <MechanicSidebar />
        <div className="main-content">
          <NavigationBar
            title="My Requests"
            userRole="mechanic"
            userName={user?.displayName || 'Mechanic'}
            userEmail={user?.email || ''}
            onProfileClick={() => setProfileOpen(true)}
          />
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 100px)' }}>
            <p>Loading requests...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management-bg mechanic-requests-page">
      <MechanicSidebar />

      <div className={`main-content ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        <NavigationBar
          title="My Requests"
          userRole="mechanic"
          userName={user?.displayName || 'Mechanic'}
          userEmail={user?.email || ''}
          onProfileClick={() => setProfileOpen(true)}
        />

        <div className="requests-container-full">
          <div className="requests-header">
            <div className="requests-header-left">
              <h1 className="requests-title">Parts Requests</h1>
              <p className="requests-subtitle">View and manage your parts requests</p>
            </div>
            <div className="requests-actions">
              <div className="requests-search">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search by vehicle, customer, or part..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="status-filters">
            <button 
              className={`filter-tab ${filterStatus === 'all' ? 'active' : ''}`}
              onClick={() => setFilterStatus('all')}
            >
              All <span className="filter-count">{counts.all}</span>
            </button>
            <button 
              className={`filter-tab ${filterStatus === 'pending' ? 'active' : ''}`}
              onClick={() => setFilterStatus('pending')}
            >
              <Clock size={16} />
              Pending <span className="filter-count">{counts.pending}</span>
            </button>
            <button 
              className={`filter-tab ${filterStatus === 'approved' ? 'active' : ''}`}
              onClick={() => setFilterStatus('approved')}
            >
              <CheckCircle size={16} />
              Approved <span className="filter-count">{counts.approved}</span>
            </button>
            <button 
              className={`filter-tab ${filterStatus === 'fulfilled' ? 'active' : ''}`}
              onClick={() => setFilterStatus('fulfilled')}
            >
              <Package size={16} />
              Fulfilled <span className="filter-count">{counts.fulfilled}</span>
            </button>
            <button 
              className={`filter-tab ${filterStatus === 'rejected' ? 'active' : ''}`}
              onClick={() => setFilterStatus('rejected')}
            >
              <XCircle size={16} />
              Rejected <span className="filter-count">{counts.rejected}</span>
            </button>
          </div>

          {/* Requests Table */}
          <div className="requests-table-container">
            <table className="requests-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Vehicle</th>
                  <th>Customer</th>
                  <th>Parts</th>
                  <th>Total Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.length > 0 ? (
                  filteredRequests.map(request => (
                    <React.Fragment key={request.id}>
                      <tr 
                        className={`request-row ${expandedRows.includes(request.id) ? 'expanded' : ''}`}
                        onClick={() => toggleExpandRow(request.id)}
                      >
                        <td>
                          <span className={`status-badge ${getStatusClass(request.status)}`}>
                            {getStatusIcon(request.status)}
                            <span>{request.status || 'Unknown'}</span>
                          </span>
                        </td>
                        <td>
                          <div className="vehicle-info">
                            <div className="vehicle-name">
                              {request.carDetails?.year} {request.carDetails?.make} {request.carDetails?.model}
                            </div>
                            <div className="vehicle-plate">{request.carDetails?.plateNumber}</div>
                          </div>
                        </td>
                        <td>
                          <div className="customer-info">
                            <UserIcon size={16} />
                            <span>{request.customerName || 'Unknown'}</span>
                          </div>
                        </td>
                        <td>
                          <div className="parts-info">
                            <Package size={16} />
                            <span>{request.parts?.length || 0} part(s)</span>
                          </div>
                        </td>
                        <td>
                          <span className="amount">
                            ₱{request.parts?.reduce((sum, part) => sum + (part.price * part.quantity), 0).toLocaleString()}
                          </span>
                        </td>
                        <td>
                          <div className="date-info">
                            <Calendar size={16} />
                            <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                          </div>
                        </td>
                      </tr>
                      {expandedRows.includes(request.id) && (
                        <tr className="expanded-row">
                          <td colSpan="6">
                            <div className="expanded-content">
                              {/* Follow-up button for pending requests */}
                              {request.status?.toLowerCase() === 'pending' && (
                                <div className="expanded-section follow-up-section">
                                  <button
                                    className={`follow-up-btn ${request.followUpRequested ? 'already-requested' : ''}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleFollowUp(request.id);
                                    }}
                                    disabled={followingUp[request.id] || request.followUpRequested}
                                  >
                                    <Bell size={18} />
                                    {followingUp[request.id] 
                                      ? 'Sending...' 
                                      : request.followUpRequested 
                                      ? 'Follow-up Requested' 
                                      : 'Request Follow-up from Admin'}
                                  </button>
                                  {request.followUpRequested && request.followUpRequestedAt && (
                                    <p className="follow-up-info">
                                      Follow-up requested on {new Date(request.followUpRequestedAt).toLocaleString()}
                                    </p>
                                  )}
                                </div>
                              )}

                              <div className="expanded-grid">
                                <div className="expanded-section">
                                  <h3>Requested Parts</h3>
                                  <div className="parts-list-expanded">
                                    {request.parts?.map((part, index) => (
                                      <div key={index} className="part-item-expanded">
                                        <div className="part-info-expanded">
                                          <Package size={16} />
                                          <span className="part-name">{part.name}</span>
                                        </div>
                                        <div className="part-details">
                                          <span className="part-quantity">Qty: {part.quantity}</span>
                                          <span className="part-price">₱{(part.price * part.quantity).toLocaleString()}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {request.notes && (
                                  <div className="expanded-section">
                                    <h3>Request Notes</h3>
                                    <p className="notes-text">{request.notes}</p>
                                  </div>
                                )}

                                {request.adminNotes && (
                                  <div className="expanded-section">
                                    <h3>Admin Response</h3>
                                    <p className="admin-notes-text">{request.adminNotes}</p>
                                  </div>
                                )}

                                {request.urgent && (
                                  <div className="expanded-section urgent-badge">
                                    <AlertCircle size={20} />
                                    <span>URGENT REQUEST</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="no-data">
                      <div className="no-requests">
                        <Package size={48} />
                        <p>No requests found</p>
                        <p className="no-requests-subtitle">
                          {filterStatus === 'all' 
                            ? 'You haven\'t made any parts requests yet.'
                            : `No ${filterStatus} requests.`}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Requests List */}
          <div className="requests-mobile-list">
            {filteredRequests.length > 0 ? (
              filteredRequests.map(request => (
                <div key={request.id} className="request-mobile-wrapper">
                  <div
                    className={`request-mobile-card ${expandedRows.includes(request.id) ? 'expanded' : ''}`}
                    onClick={() => toggleExpandRow(request.id)}
                  >
                    <div className="request-mobile-header">
                      <div className="request-mobile-info">
                        <h4 className="request-mobile-vehicle">
                          {request.carDetails?.year} {request.carDetails?.make} {request.carDetails?.model}
                        </h4>
                        <p className="request-mobile-customer">{request.customerName || 'Unknown'}</p>
                      </div>
                      <span className={`status-badge ${getStatusClass(request.status)}`}>
                        {getStatusIcon(request.status)}
                        <span>{request.status || 'Unknown'}</span>
                      </span>
                    </div>
                    <div className="request-mobile-details">
                      <div className="request-mobile-stat">
                        <Package size={14} />
                        <span>{request.parts?.length || 0} parts</span>
                      </div>
                      <div className="request-mobile-stat">
                        <Calendar size={14} />
                        <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                      </div>
                      <span className="request-mobile-amount">
                        ₱{request.parts?.reduce((sum, part) => sum + (part.price * part.quantity), 0).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Request Section */}
                  {expandedRows.includes(request.id) && (
                    <div className="request-mobile-expanded">
                      {request.status?.toLowerCase() === 'pending' && (
                        <div className="mobile-request-section mobile-follow-up">
                          <button
                            className={`follow-up-btn ${request.followUpRequested ? 'already-requested' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFollowUp(request.id);
                            }}
                            disabled={followingUp[request.id] || request.followUpRequested}
                          >
                            <Bell size={16} />
                            {followingUp[request.id] 
                              ? 'Sending...' 
                              : request.followUpRequested 
                              ? 'Follow-up Requested' 
                              : 'Request Follow-up from Admin'}
                          </button>
                          {request.followUpRequested && request.followUpRequestedAt && (
                            <p className="follow-up-info">
                              Follow-up requested on {new Date(request.followUpRequestedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="mobile-request-section">
                        <h4>Requested Parts</h4>
                        <div className="mobile-parts-list">
                          {request.parts?.map((part, index) => (
                            <div key={index} className="mobile-part-item">
                              <div className="mobile-part-info">
                                <Package size={14} />
                                <span className="mobile-part-name">{part.name}</span>
                              </div>
                              <div className="mobile-part-details">
                                <span className="mobile-part-qty">Qty: {part.quantity}</span>
                                <span className="mobile-part-price">₱{(part.price * part.quantity).toLocaleString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {request.notes && (
                        <div className="mobile-request-section">
                          <h4>Request Notes</h4>
                          <div className="mobile-notes">{request.notes}</div>
                        </div>
                      )}

                      {request.adminNotes && (
                        <div className="mobile-request-section">
                          <h4>Admin Response</h4>
                          <div className="mobile-admin-notes">{request.adminNotes}</div>
                        </div>
                      )}

                      {request.urgent && (
                        <div className="mobile-request-section">
                          <div className="urgent-badge">
                            <AlertCircle size={18} />
                            <span>URGENT REQUEST</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="no-requests">
                <Package size={48} />
                <p>No requests found</p>
                <p className="no-requests-subtitle">
                  {filterStatus === 'all' 
                    ? 'You haven\'t made any parts requests yet.'
                    : `No ${filterStatus} requests.`}
                </p>
              </div>
            )}
          </div>

          {/* Request Details Panel */}
          {selectedRequest && (
            <div className="request-details-panel active">
              <div className="panel-header">
                <h2>Request Details</h2>
                <span className={`status-badge ${getStatusClass(selectedRequest.status)}`}>
                  {getStatusIcon(selectedRequest.status)}
                  {selectedRequest.status}
                </span>
              </div>

              <div className="panel-content">
                {/* Follow-up button for pending requests */}
                {selectedRequest.status?.toLowerCase() === 'pending' && (
                  <div className="detail-section follow-up-section">
                    <button
                      className={`follow-up-btn ${selectedRequest.followUpRequested ? 'already-requested' : ''}`}
                      onClick={() => handleFollowUp(selectedRequest.id)}
                      disabled={followingUp[selectedRequest.id] || selectedRequest.followUpRequested}
                    >
                      <Bell size={18} />
                      {followingUp[selectedRequest.id] 
                        ? 'Sending...' 
                        : selectedRequest.followUpRequested 
                        ? 'Follow-up Requested' 
                        : 'Request Follow-up from Admin'}
                    </button>
                    {selectedRequest.followUpRequested && selectedRequest.followUpRequestedAt && (
                      <p className="follow-up-info">
                        Follow-up requested on {new Date(selectedRequest.followUpRequestedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                <div className="detail-section">
                  <h3>Vehicle Information</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Vehicle:</span>
                      <span className="detail-value">
                        {selectedRequest.carDetails?.year} {selectedRequest.carDetails?.make} {selectedRequest.carDetails?.model}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Plate Number:</span>
                      <span className="detail-value">{selectedRequest.carDetails?.plateNumber}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Customer:</span>
                      <span className="detail-value">{selectedRequest.customerName}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Requested Parts ({selectedRequest.parts?.length || 0})</h3>
                  <div className="parts-list">
                    {selectedRequest.parts?.map((part, index) => (
                      <div key={index} className="part-item">
                        <div className="part-info">
                          <span className="part-name">{part.name}</span>
                          <span className="part-quantity">Qty: {part.quantity}</span>
                        </div>
                        <span className="part-price">₱{(part.price * part.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="parts-total">
                    <span>Total Amount:</span>
                    <span className="total-amount">
                      ₱{selectedRequest.parts?.reduce((sum, part) => sum + (part.price * part.quantity), 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                {selectedRequest.notes && (
                  <div className="detail-section">
                    <h3>Notes</h3>
                    <p className="request-notes-text">{selectedRequest.notes}</p>
                  </div>
                )}

                {selectedRequest.adminNotes && (
                  <div className="detail-section">
                    <h3>Admin Response</h3>
                    <p className="admin-notes">{selectedRequest.adminNotes}</p>
                  </div>
                )}

                <div className="detail-section">
                  <h3>Timeline</h3>
                  <div className="timeline">
                    <div className="timeline-item">
                      <div className="timeline-marker"></div>
                      <div className="timeline-content">
                        <span className="timeline-label">Created</span>
                        <span className="timeline-date">
                          {new Date(selectedRequest.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {selectedRequest.updatedAt && selectedRequest.updatedAt !== selectedRequest.createdAt && (
                      <div className="timeline-item">
                        <div className="timeline-marker"></div>
                        <div className="timeline-content">
                          <span className="timeline-label">Last Updated</span>
                          <span className="timeline-date">
                            {new Date(selectedRequest.updatedAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} user={user} />
    </div>
  );
}