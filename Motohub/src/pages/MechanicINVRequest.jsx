import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getFirestore, collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Search,
  Calendar,
  User as UserIcon,
  Car
} from 'lucide-react';
import MechanicSidebar from '../components/MechanicSidebar';
import TopBar from '../components/TopBar';
import ProfileModal from '../components/modals/ProfileModal';
import '../css/MechanicINVRequest.css';

export default function MechanicINVRequest() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
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
        <MechanicSidebar sidebarOpen={sidebarOpen} />
        <div className="main-content">
          <TopBar
            title="My Requests"
            onToggle={() => setSidebarOpen(!sidebarOpen)}
            notificationsCount={0}
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
    <div className="dashboard-container mechanic-requests-page">
      <MechanicSidebar sidebarOpen={sidebarOpen} />

      <div className={`main-content ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        <TopBar
          title="My Requests"
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          notificationsCount={counts.pending}
          onProfileClick={() => setProfileOpen(true)}
        />

        <div className={`requests-container ${!selectedRequest ? 'single-column' : ''}`}>
          <div className="requests-list-section">
            <div className="requests-header">
              <h1 className="requests-title">Parts Requests</h1>
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

            {/* Requests List */}
            <div className="requests-list">
              {filteredRequests.length > 0 ? (
                filteredRequests.map(request => (
                  <div 
                    key={request.id}
                    className={`request-card ${selectedRequest?.id === request.id ? 'selected' : ''}`}
                    onClick={() => setSelectedRequest(selectedRequest?.id === request.id ? null : request)}
                  >
                    <div className="request-card-header">
                      <div className="request-info">
                        <h3 className="request-vehicle">
                          {request.carDetails?.year} {request.carDetails?.make} {request.carDetails?.model}
                        </h3>
                        <p className="request-plate">{request.carDetails?.plateNumber}</p>
                      </div>
                      <span className={`request-status ${getStatusClass(request.status)}`}>
                        {getStatusIcon(request.status)}
                        {request.status || 'Unknown'}
                      </span>
                    </div>

                    <div className="request-card-body">
                      <div className="request-detail">
                        <UserIcon size={16} />
                        <span>Customer: {request.customerName || 'Unknown'}</span>
                      </div>
                      <div className="request-detail">
                        <Package size={16} />
                        <span>{request.parts?.length || 0} part(s) requested</span>
                      </div>
                      <div className="request-detail">
                        <Calendar size={16} />
                        <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                      </div>
                      {request.urgent && (
                        <div className="request-urgent">
                          <AlertCircle size={16} />
                          <span>URGENT</span>
                        </div>
                      )}
                    </div>

                    {request.notes && (
                      <div className="request-notes">
                        <p>{request.notes}</p>
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