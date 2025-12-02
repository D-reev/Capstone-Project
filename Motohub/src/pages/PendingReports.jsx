import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc, query, where, onSnapshot } from 'firebase/firestore';
import { SearchOutlined, FilterOutlined, InfoCircleOutlined, EditOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { Input, Button, Modal, ConfigProvider, Badge, Empty, Tabs, message, App, Tooltip } from 'antd';
import { ChevronDown, Calendar, User, Car, FileText, RefreshCw } from 'lucide-react';
import MechanicSidebar from '../components/MechanicSidebar';
import NavigationBar from '../components/NavigationBar';
import ProfileModal from '../components/modals/ProfileModal';
import EditReportModal from '../components/modals/EditReportModal';
import Loading from '../components/Loading';
import '../css/PendingReports.css';

export default function PendingReports() {
  const { message: messageApi } = App.useApp();
  const { sidebarOpen } = useSidebar();
  const [profileOpen, setProfileOpen] = useState(false);
  const [reports, setReports] = useState([]);
  const [completedReports, setCompletedReports] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasPendingParts, setHasPendingParts] = useState(false);
  const [checkingParts, setCheckingParts] = useState(false);
  const itemsPerPage = 12;
  const { user } = useAuth();
  const db = getFirestore();

  useEffect(() => {
    if (user?.displayName) {
      fetchPendingReports();
      fetchCompletedReports();
      
      // Set up real-time listener for both pending and completed reports
      const serviceReportsRef = collection(db, 'serviceReports');
      const qPending = query(
        serviceReportsRef,
        where('mechanicHeadName', '==', user.displayName),
        where('status', '==', 'pending')
      );
      
      const qCompleted = query(
        serviceReportsRef,
        where('mechanicHeadName', '==', user.displayName),
        where('status', '==', 'completed')
      );
      
      const unsubscribePending = onSnapshot(qPending, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added' || change.type === 'modified') {
            fetchPendingReports();
          }
        });
      });

      const unsubscribeCompleted = onSnapshot(qCompleted, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added' || change.type === 'modified') {
            fetchCompletedReports();
          }
        });
      });
      
      // Cleanup function to unsubscribe from listeners
      return () => {
        unsubscribePending();
        unsubscribeCompleted();
      };
    }
  }, [user]);

  const fetchPendingReports = async () => {
    try {
      setLoading(true);
      
      // Query the top-level serviceReports collection directly with filters
      const serviceReportsRef = collection(db, 'serviceReports');
      const q = query(
        serviceReportsRef,
        where('mechanicHeadName', '==', user.displayName),
        where('status', '==', 'pending')
      );
      
      const reportsSnapshot = await getDocs(q);
      const allReports = [];

      // Fetch customer data and car details for each report in parallel
      await Promise.all(reportsSnapshot.docs.map(async (reportDoc) => {
        const reportData = reportDoc.data();
        
        // Fetch customer information
        let customerName = 'Unknown Customer';
        let carDetails = null;
        
        if (reportData.customerId) {
          try {
            const customerRef = doc(db, 'users', reportData.customerId);
            const customerSnap = await getDoc(customerRef);
            
            if (customerSnap.exists()) {
              const customerData = customerSnap.data();
              customerName = customerData.displayName || customerData.email || 'Unknown Customer';
            }
            
            // Fetch car details if carId is available
            if (reportData.carId) {
              const carRef = doc(db, `users/${reportData.customerId}/cars/${reportData.carId}`);
              const carSnap = await getDoc(carRef);
              
              if (carSnap.exists()) {
                const carData = carSnap.data();
                carDetails = {
                  make: carData.make,
                  model: carData.model,
                  year: carData.year,
                  plateNumber: carData.plateNumber
                };
              }
            }
          } catch (error) {
            console.error('Error fetching customer/car data:', error);
          }
        }
        
        allReports.push({
          id: reportDoc.id,
          ...reportData,
          customerName,
          carDetails
        });
      }));

      // Sort by timestamp descending (newest first)
      allReports.sort((a, b) => {
        const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0);
        const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);
        return dateB - dateA;
      });

      setReports(allReports);
    } catch (error) {
      console.error('Error fetching pending reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletedReports = async () => {
    try {
      setLoading(true);
      
      // Query the top-level serviceReports collection for completed reports
      const serviceReportsRef = collection(db, 'serviceReports');
      const q = query(
        serviceReportsRef,
        where('mechanicHeadName', '==', user.displayName),
        where('status', '==', 'completed')
      );
      
      const reportsSnapshot = await getDocs(q);
      const allReports = [];

      // Fetch customer data and car details for each report in parallel
      await Promise.all(reportsSnapshot.docs.map(async (reportDoc) => {
        const reportData = reportDoc.data();
        
        // Fetch customer information
        let customerName = 'Unknown Customer';
        let carDetails = null;
        
        if (reportData.customerId) {
          try {
            const customerRef = doc(db, 'users', reportData.customerId);
            const customerSnap = await getDoc(customerRef);
            
            if (customerSnap.exists()) {
              const customerData = customerSnap.data();
              customerName = customerData.displayName || customerData.email || 'Unknown Customer';
            }
            
            // Fetch car details if carId is available
            if (reportData.carId) {
              const carRef = doc(db, `users/${reportData.customerId}/cars/${reportData.carId}`);
              const carSnap = await getDoc(carRef);
              
              if (carSnap.exists()) {
                const carData = carSnap.data();
                carDetails = {
                  make: carData.make,
                  model: carData.model,
                  year: carData.year,
                  plateNumber: carData.plateNumber
                };
              }
            }
          } catch (error) {
            console.error('Error fetching customer/car data:', error);
          }
        }
        
        allReports.push({
          id: reportDoc.id,
          ...reportData,
          customerName,
          carDetails
        });
      }));

      // Sort by timestamp descending (newest first)
      allReports.sort((a, b) => {
        const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0);
        const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);
        return dateB - dateA;
      });

      setCompletedReports(allReports);
    } catch (error) {
      console.error('Error fetching completed reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditReport = () => {
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (updatedReport) => {
    if (!updatedReport?.id) {
      messageApi.error('Invalid report data');
      throw new Error('Invalid report data');
    }

    const updateData = {
      mechanicName: updatedReport.mechanicName,
      mechanicNames: updatedReport.mechanicNames || [],
      diagnosis: updatedReport.diagnosis,
      workPerformed: updatedReport.workPerformed,
      partsUsed: updatedReport.partsUsed || '',
      recommendations: updatedReport.recommendations || '',
      lastModified: new Date().toISOString(),
      isEdited: true,
    };

    try {
      // Update in top-level serviceReports collection
      const reportRef = doc(db, 'serviceReports', updatedReport.id);
      await updateDoc(reportRef, updateData);

      // Try to update nested collection for backward compatibility
      // If this fails due to permissions, we still consider the save successful
      if (updatedReport.customerId && updatedReport.carId) {
        try {
          const nestedReportRef = doc(
            db, 
            `users/${updatedReport.customerId}/cars/${updatedReport.carId}/serviceHistory/${updatedReport.id}`
          );
          await updateDoc(nestedReportRef, updateData);
        } catch (nestedError) {
          // Log but don't fail - nested collection is optional/legacy
          console.warn('Could not update nested collection:', nestedError.message);
        }
      }
    } catch (error) {
      console.error('Error saving report to database:', error);
      messageApi.error('Failed to update report');
      throw error;
    }

    // Close modals and refresh - errors here shouldn't fail the save
    try {
      setEditModalOpen(false);
      setDetailsModalOpen(false);
      setSelectedReport(null);
      
      // Refresh pending reports list
      await fetchPendingReports();
      
      // Show success message after refresh
      messageApi.success('Report updated successfully');
    } catch (error) {
      console.error('Error refreshing reports:', error);
      // Still show success since the save worked
      messageApi.success('Report updated successfully');
    }
  };

  const handleCompleteReport = async () => {
    try {
      if (!selectedReport?.id) return;

      // Update in top-level serviceReports collection
      const reportRef = doc(db, 'serviceReports', selectedReport.id);
      await updateDoc(reportRef, {
        status: 'completed',
        completedAt: new Date().toISOString(),
      });

      // Update in nested collection for backward compatibility
      if (selectedReport.customerId && selectedReport.carId) {
        const nestedReportRef = doc(
          db, 
          `users/${selectedReport.customerId}/cars/${selectedReport.carId}/serviceHistory/${selectedReport.id}`
        );
        await updateDoc(nestedReportRef, {
          status: 'completed',
          completedAt: new Date().toISOString(),
        });
      }

      messageApi.success('Report marked as completed');
      setDetailsModalOpen(false);
      setEditModalOpen(false);
      fetchPendingReports();
      if (activeTab === 'completed') {
        fetchCompletedReports();
      }
    } catch (error) {
      console.error('Error completing report:', error);
      messageApi.error('Failed to complete report');
    }
  };

  const filteredReports = (activeTab === 'pending' ? reports : completedReports).filter(report => {
    const matchesSearch = 
      report.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.mechanicName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.vehicle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.plateNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCardClick = async (report) => {
    setSelectedReport(report);
    setDetailsModalOpen(true);
    
    // Check for pending parts requests
    await checkPendingParts(report);
  };

  const checkPendingParts = async (report) => {
    if (!report?.customerId || !report?.plateNumber) {
      setHasPendingParts(false);
      return;
    }
    
    try {
      setCheckingParts(true);
      const requestsRef = collection(db, 'partRequests');
      const q = query(
        requestsRef,
        where('customerId', '==', report.customerId),
        where('carDetails.plateNumber', '==', report.plateNumber),
        where('status', '==', 'pending')
      );
      
      const snapshot = await getDocs(q);
      const pendingRequests = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        // Only include requests related to this report's timeframe (within 24 hours)
        const requestTime = new Date(data.createdAt);
        const reportTime = new Date(report.timestamp);
        const timeDiff = Math.abs(reportTime - requestTime);
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        if (hoursDiff <= 24) {
          pendingRequests.push({
            id: doc.id,
            ...data
          });
        }
      });
      
      setHasPendingParts(pendingRequests.length > 0);
    } catch (error) {
      console.error('Error checking pending parts:', error);
      setHasPendingParts(false);
    } finally {
      setCheckingParts(false);
    }
  };

  if (loading) {
    return <Loading text="Loading pending reports..." />;
  }

  return (
    <App>
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
        <div className="pending-reports-page">
        <MechanicSidebar />

        <div className={`main-content ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
          <NavigationBar
            title="Pending Reports"
            onProfileClick={() => setProfileOpen(true)}
            userRole="mechanic"
            userName={user?.displayName || 'Mechanic'}
            userEmail={user?.email || ''}
          />

          <div className="pending-reports-container">
            {/* Header Section */}
            <div className="pending-reports-header">
              <div className="header-left">
                <h1 className="page-title">Service Reports</h1>
                <p className="page-subtitle">
                  {activeTab === 'pending' 
                    ? `Showing ${filteredReports.length} of ${reports.length} pending reports assigned to you`
                    : `Showing ${filteredReports.length} of ${completedReports.length} completed reports`
                  }
                </p>
              </div>
              <div className="header-actions">
                <Input
                  placeholder="Search by customer, mechanic, or vehicle..."
                  prefix={<SearchOutlined style={{ color: '#9CA3AF' }} />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: 320 }}
                  size="large"
                />
                <Button 
                  size="large"
                  loading={refreshing}
                  onClick={async () => {
                    setRefreshing(true);
                    if (activeTab === 'pending') {
                      await fetchPendingReports();
                    } else {
                      await fetchCompletedReports();
                    }
                    setRefreshing(false);
                  }}
                  icon={<RefreshCw size={16} />}
                  style={{
                    background: 'linear-gradient(135deg, #FFC300, #FFD54F)',
                    borderColor: '#FFC300',
                    color: '#000',
                    fontWeight: 600,
                  }}
                >
                  Refresh
                </Button>
              </div>
            </div>

            {/* Tabs for Pending and Completed */}
            <Tabs
              activeKey={activeTab}
              onChange={(key) => setActiveTab(key)}
              items={[
                {
                  key: 'pending',
                  label: (
                    <span style={{ fontSize: '1rem', fontWeight: 600, padding: '8px 0' }}>
                      Pending Reports ({reports.length})
                    </span>
                  ),
                },
                {
                  key: 'completed',
                  label: (
                    <span style={{ fontSize: '1rem', fontWeight: 600, padding: '8px 0' }}>
                      Completed Reports ({completedReports.length})
                    </span>
                  ),
                },
              ]}
              style={{ marginBottom: '1.5rem' }}
            />

            {/* Cards Grid */}
            {filteredReports.length > 0 ? (
              <>
                <div className="reports-grid">
                  {filteredReports.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((report) => (
                    <div 
                      key={report.id} 
                      className="report-card"
                      onClick={() => handleCardClick(report)}
                    >
                      <div className="report-card-header">
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <Badge 
                            count={report.status === 'completed' ? 'Completed' : 'Pending'}
                            style={{ 
                              backgroundColor: report.status === 'completed' ? '#10B981' : '#F59E0B',
                              fontWeight: 600,
                              fontSize: '11px'
                            }} 
                          />
                          {report.isEdited && (
                            <Badge 
                              count="Edited"
                              style={{ 
                                backgroundColor: '#3B82F6',
                                fontWeight: 600,
                                fontSize: '11px'
                              }} 
                            />
                          )}
                        </div>
                        <div className="report-date">
                          <Calendar size={14} />
                          {formatDate(report.timestamp)}
                        </div>
                      </div>

                      <div className="report-card-body">
                        <div className="report-info-row">
                          <User size={16} className="report-icon" />
                          <div className="report-info-content">
                            <span className="report-label">Customer</span>
                            <span className="report-value">{report.customerName || 'N/A'}</span>
                          </div>
                        </div>

                        <div className="report-info-row">
                          <Car size={16} className="report-icon" />
                          <div className="report-info-content">
                            <span className="report-label">Vehicle</span>
                            <span className="report-value">{report.vehicle || 'N/A'}</span>
                          </div>
                        </div>

                        <div className="report-info-row">
                          <FileText size={16} className="report-icon" />
                          <div className="report-info-content">
                            <span className="report-label">Other Mechanics</span>
                            <span className="report-value">{report.mechanicName || 'None'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="report-card-footer">
                        <Button 
                          type="link" 
                          icon={<InfoCircleOutlined />}
                          style={{ color: '#FBBF24', fontWeight: 600, padding: 0 }}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {filteredReports.length > itemsPerPage && (
                  <div className="pagination-container">
                    <span className="pagination-info">
                      {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredReports.length)} of {filteredReports.length} reports
                    </span>
                    <div className="pagination-controls">
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
                      >
                        &lt;&lt;
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
                      >
                        &lt;
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={Math.ceil(filteredReports.length / itemsPerPage)}
                        value={currentPage}
                        onChange={(e) => {
                          const page = parseInt(e.target.value);
                          if (page >= 1 && page <= Math.ceil(filteredReports.length / itemsPerPage)) {
                            setCurrentPage(page);
                          }
                        }}
                        className="pagination-input"
                      />
                      <span className="pagination-of">of {Math.ceil(filteredReports.length / itemsPerPage)}</span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredReports.length / itemsPerPage)))}
                        disabled={currentPage >= Math.ceil(filteredReports.length / itemsPerPage)}
                        className={`pagination-btn ${currentPage >= Math.ceil(filteredReports.length / itemsPerPage) ? 'disabled' : ''}`}
                      >
                        &gt;
                      </button>
                      <button
                        onClick={() => setCurrentPage(Math.ceil(filteredReports.length / itemsPerPage))}
                        disabled={currentPage >= Math.ceil(filteredReports.length / itemsPerPage)}
                        className={`pagination-btn ${currentPage >= Math.ceil(filteredReports.length / itemsPerPage) ? 'disabled' : ''}`}
                      >
                        &gt;&gt;
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state">
                <Empty
                  description={
                    <span style={{ color: '#6B7280', fontSize: '16px' }}>
                      {searchTerm ? 'No pending reports match your search' : 'No pending reports found'}
                    </span>
                  }
                />
              </div>
            )}
          </div>
        </div>

        {/* Details Modal */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Report Details</span>
              {selectedReport?.isEdited && (
                <Badge 
                  count="Edited"
                  style={{ 
                    backgroundColor: '#3B82F6',
                    fontWeight: 600,
                    fontSize: '11px'
                  }} 
                />
              )}
            </div>
          }
          open={detailsModalOpen}
          onCancel={() => {
            setDetailsModalOpen(false);
            setSelectedReport(null);
            setEditModalOpen(false);
            setHasPendingParts(false);
          }}
          footer={null}
          width={800}
          style={{ top: 20 }}
          bodyStyle={{
            maxHeight: 'calc(100vh - 200px)',
            overflowY: 'auto',
            paddingRight: '8px'
          }}
        >
          {selectedReport && (
            <div style={{ padding: '1rem 0' }}>
              {/* Report Information */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#111827' }}>
                  Service Information
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.25rem' }}>Customer</p>
                    <p style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                      {selectedReport.customerName || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.25rem' }}>Mechanic Head</p>
                    <p style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                      {selectedReport.mechanicHeadName || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.25rem' }}>Other Mechanics</p>
                    <p style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                      {selectedReport.mechanicName || 'None'}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.25rem' }}>Vehicle</p>
                    <p style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                      {selectedReport.vehicle || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.25rem' }}>Plate Number</p>
                    <p style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                      {selectedReport.plateNumber || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.25rem' }}>Report Date</p>
                    <p style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                      {formatDate(selectedReport.timestamp)}
                    </p>
                  </div>
                  {selectedReport.isEdited && selectedReport.lastModified && (
                    <div>
                      <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.25rem' }}>Last Modified</p>
                      <p style={{ fontSize: '1rem', fontWeight: 600, color: '#3B82F6', margin: 0 }}>
                        {formatDate(selectedReport.lastModified)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Mechanics */}
              {selectedReport.mechanicName && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#111827' }}>
                    Other Mechanics Involved
                  </h3>
                  <p style={{ padding: '1rem', background: '#FFF9E6', borderRadius: '8px', fontSize: '0.875rem', color: '#111827', margin: 0 }}>
                    {selectedReport.mechanicName}
                  </p>
                </div>
              )}

              {/* Diagnosis */}
              {selectedReport.diagnosis && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#111827' }}>
                    Diagnosis
                  </h3>
                  <div style={{ padding: '1rem', background: '#F9FAFB', borderRadius: '8px', fontSize: '0.875rem', color: '#111827', whiteSpace: 'pre-line' }}>
                    {selectedReport.diagnosis}
                  </div>
                </div>
              )}

              {/* Parts Used & Work Performed */}
              {(selectedReport.partsUsed || selectedReport.workPerformed) && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                      Parts Used & Work Performed
                    </h3>
                    <span style={{
                      display: 'inline-block',
                      padding: '6px 16px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 700,
                      backgroundColor: hasPendingParts ? '#FFC300' : '#10B981',
                      color: hasPendingParts ? '#000' : '#fff',
                      boxShadow: hasPendingParts ? '0 2px 6px rgba(255, 195, 0, 0.3)' : '0 2px 6px rgba(16, 185, 129, 0.3)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {hasPendingParts ? 'PENDING' : 'COMPLETED'}
                    </span>
                  </div>
                  <div style={{ padding: '1rem', background: '#F9FAFB', borderRadius: '8px', fontSize: '0.875rem', color: '#111827' }}>
                    {(() => {
                      const partsLines = selectedReport.partsUsed ? selectedReport.partsUsed.split('\n').filter(line => line.trim()) : [];
                      const workLines = selectedReport.workPerformed ? selectedReport.workPerformed.split('\n').filter(line => line.trim()) : [];
                      const maxLength = Math.max(partsLines.length, workLines.length);
                      
                      return Array.from({ length: maxLength }, (_, i) => {
                        const part = partsLines[i] || '';
                        const work = workLines[i] || '';
                        
                        return (
                          <div key={i} style={{ marginBottom: i < maxLength - 1 ? '12px' : '0' }}>
                            {part && (
                              <div style={{ marginBottom: '4px', color: '#374151', fontWeight: 500 }}>
                                {part}
                              </div>
                            )}
                            {work && (
                              <div style={{ color: '#6B7280', paddingLeft: '16px' }}>
                                {work}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {selectedReport.recommendations && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#111827' }}>
                    Recommendations
                  </h3>
                  <div style={{ padding: '1rem', background: '#FFF9E6', borderRadius: '8px', fontSize: '0.875rem', color: '#111827' }}>
                    {selectedReport.recommendations}
                  </div>
                </div>
              )}

              {/* Next Service Date */}
              {selectedReport.nextServiceDate && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#111827' }}>
                    Next Service Date
                  </h3>
                  <p style={{ fontSize: '1rem', color: '#111827', margin: 0 }}>
                    {new Date(selectedReport.nextServiceDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                {selectedReport.status === 'pending' && (
                  <>
                    <Button 
                      size="large"
                      icon={<EditOutlined />}
                      onClick={handleEditReport}
                      style={{
                        background: 'linear-gradient(135deg, #FFC300, #FFD54F)',
                        borderColor: '#FFC300',
                        color: '#000',
                        fontWeight: 600,
                      }}
                    >
                      Edit Report
                    </Button>
                    <Tooltip 
                      title={hasPendingParts ? "Parts request pending - Complete button is disabled until parts are fulfilled" : "Mark this service report as completed"}
                      placement="top"
                    >
                      <Button 
                        size="large"
                        icon={<CheckCircleOutlined />}
                        onClick={handleCompleteReport}
                        disabled={hasPendingParts}
                        style={{
                          background: hasPendingParts ? '#E5E7EB' : 'linear-gradient(135deg, #FFC300, #FFD54F)',
                          borderColor: hasPendingParts ? '#D1D5DB' : '#FFC300',
                          color: hasPendingParts ? '#9CA3AF' : '#000',
                          fontWeight: 600,
                          cursor: hasPendingParts ? 'not-allowed' : 'pointer',
                          opacity: hasPendingParts ? 0.6 : 1,
                        }}
                      >
                        Complete
                      </Button>
                    </Tooltip>
                  </>
                )}
              </div>
            </div>
          )}
        </Modal>

        {/* Edit Report Modal */}
        <EditReportModal
          report={selectedReport}
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSave={handleSaveEdit}
        />

        <ProfileModal 
          open={profileOpen} 
          onClose={() => setProfileOpen(false)} 
          user={user} 
        />
      </div>
    </ConfigProvider>
    </App>
  );
}
