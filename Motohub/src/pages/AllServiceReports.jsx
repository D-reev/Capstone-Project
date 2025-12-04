import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { ConfigProvider, Input, Select, Tag, Empty, Tabs, Badge, Modal, Descriptions, Divider } from 'antd';
import { SearchOutlined, FilterOutlined, EyeOutlined } from '@ant-design/icons';
import { FileText, User, Car, Calendar, ChevronDown, Wrench, Clock, CheckCircle, Settings } from 'lucide-react';
import SuperAdminSidebar from '../components/SuperAdminSidebar';
import NavigationBar from '../components/NavigationBar';
import Loading from '../components/Loading';
import ProfileModal from '../components/modals/ProfileModal';
import '../css/AllServiceReports.css';

const { Option } = Select;
const { TabPane } = Tabs;

export default function AllServiceReports() {
  const { sidebarOpen } = useSidebar();
  const { user } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allReports, setAllReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMechanic, setFilterMechanic] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('all');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const itemsPerPage = 12;
  const db = getFirestore();

  useEffect(() => {
    fetchAllServiceReports();
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchAllServiceReports = async () => {
    try {
      setLoading(true);
      const allReportsData = [];
      
      // Fetch from top-level serviceReports collection
      const serviceReportsRef = collection(db, 'serviceReports');
      const reportsSnapshot = await getDocs(serviceReportsRef);
      
      // Fetch customer data and car details for each report
      await Promise.all(reportsSnapshot.docs.map(async (reportDoc) => {
        const reportData = reportDoc.data();
        
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
        
        allReportsData.push({
          id: reportDoc.id,
          ...reportData,
          customerName,
          carDetails
        });
      }));
      
      // Sort by timestamp, newest first
      allReportsData.sort((a, b) => {
        const dateA = new Date(a.timestamp || 0);
        const dateB = new Date(b.timestamp || 0);
        return dateB - dateA;
      });
      
      setAllReports(allReportsData);
    } catch (error) {
      console.error('Error fetching service reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (report) => {
    setSelectedReport(report);
    setDetailsModalOpen(true);
  };

  const handleCloseModal = () => {
    setDetailsModalOpen(false);
    setSelectedReport(null);
  };

  const filteredReports = allReports.filter(report => {
    const matchesSearch = 
      report.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.mechanicHeadName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.carDetails?.plateNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.carDetails?.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.carDetails?.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.serviceType?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    const matchesMechanic = filterMechanic === 'all' || report.mechanicHeadName === filterMechanic;
    const matchesTab = activeTab === 'all' || report.status === activeTab;
    
    return matchesSearch && matchesStatus && matchesMechanic && matchesTab;
  });

  const uniqueMechanics = [...new Set(allReports.map(r => r.mechanicHeadName).filter(Boolean))].sort();

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} />;
      case 'pending':
        return <Clock size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);

  const pendingCount = allReports.filter(r => r.status === 'pending').length;
  const completedCount = allReports.filter(r => r.status === 'completed').length;

  if (loading) {
    return <Loading text="Loading service reports..." />;
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
      <div className="all-reports-page">
        <SuperAdminSidebar />

        <div className={`main-content ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
          <NavigationBar
            title="All Service Reports"
            onProfileClick={() => setProfileOpen(true)}
            userRole="superadmin"
            userName={user?.displayName || 'Super Admin'}
            userEmail={user?.email || ''}
          />

          <div className="all-reports-container">
            <div className="all-reports-card">
              {/* Header */}
              <div className="all-reports-header">
                <div className="all-reports-header-left">
                  <h1 className="all-reports-title">Service Reports & Requests</h1>
                  <span className="all-reports-subtitle">
                    Showing {filteredReports.length} of {allReports.length} reports
                  </span>
                </div>
                <div className="all-reports-actions">
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
                    placeholder="Search reports..."
                    prefix={<SearchOutlined style={{ color: '#9CA3AF' }} />}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: 300 }}
                    size="large"
                  />
                </div>
              </div>

              {/* Stats Row */}
              <div className="all-reports-stats">
                <div className="stat-card">
                  <FileText size={24} className="stat-icon" />
                  <div className="stat-content">
                    <div className="stat-value">{allReports.length}</div>
                    <div className="stat-label">Total Reports</div>
                  </div>
                </div>
                <div className="stat-card pending">
                  <Clock size={24} className="stat-icon" />
                  <div className="stat-content">
                    <div className="stat-value">{pendingCount}</div>
                    <div className="stat-label">Pending</div>
                  </div>
                </div>
                <div className="stat-card completed">
                  <CheckCircle size={24} className="stat-icon" />
                  <div className="stat-content">
                    <div className="stat-value">{completedCount}</div>
                    <div className="stat-label">Completed</div>
                  </div>
                </div>
                <div className="stat-card">
                  <Wrench size={24} className="stat-icon" />
                  <div className="stat-content">
                    <div className="stat-value">{uniqueMechanics.length}</div>
                    <div className="stat-label">Mechanics</div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <Tabs 
                activeKey={activeTab} 
                onChange={setActiveTab}
                className="reports-tabs"
              >
                <TabPane 
                  tab={
                    <span>
                      <FileText size={16} style={{ marginRight: 8 }} />
                      All Reports
                      <Badge count={allReports.length} style={{ marginLeft: 8, backgroundColor: '#FBBF24' }} />
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
                      Completed
                      <Badge count={completedCount} style={{ marginLeft: 8, backgroundColor: '#10B981' }} />
                    </span>
                  } 
                  key="completed"
                />
              </Tabs>

              {/* Reports Grid */}
              <div className="all-reports-grid">
                {paginatedReports.length === 0 ? (
                  <div className="empty-state">
                    <Empty
                      description={
                        searchTerm || filterMechanic !== 'all'
                          ? 'No reports found matching your filters'
                          : 'No service reports available yet'
                      }
                    />
                  </div>
                ) : (
                  paginatedReports.map((report) => {
                    return (
                      <div key={report.id} className="report-card">
                        {/* Report Header */}
                        <div className="report-header">
                          <div className="report-status-badge">
                            {getStatusIcon(report.status)}
                            <Tag color={getStatusColor(report.status)}>
                              {report.status?.toUpperCase()}
                            </Tag>
                          </div>
                          <div className="report-date">
                            <Calendar size={14} />
                            {formatDate(report.timestamp)}
                          </div>
                        </div>

                        {/* Report Info */}
                        <div className="report-info">
                          <div className="report-section">
                            <div className="section-label">
                              <Car size={16} />
                              Vehicle
                            </div>
                            {report.carDetails ? (
                              <div className="section-value">
                                <strong>{report.carDetails.make} {report.carDetails.model}</strong>
                                <span className="plate-number">{report.carDetails.plateNumber}</span>
                              </div>
                            ) : (
                              <div className="section-value">N/A</div>
                            )}
                          </div>

                          <div className="report-section">
                            <div className="section-label">
                              <User size={16} />
                              Customer
                            </div>
                            <div className="section-value">{report.customerName}</div>
                          </div>

                          <div className="report-section">
                            <div className="section-label">
                              <Wrench size={16} />
                              Mechanic Head
                            </div>
                            <div className="section-value">{report.mechanicHeadName || 'N/A'}</div>
                          </div>

                          {report.serviceType && (
                            <div className="report-section">
                              <div className="section-label">
                                <Settings size={16} />
                                Service Type
                              </div>
                              <div className="section-value">{report.serviceType}</div>
                            </div>
                          )}

                          {/* View Details Button */}
                          <button
                            className="toggle-details-btn"
                            onClick={() => handleViewDetails(report)}
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

        {/* Report Details Modal */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={20} />
              <span>Service Report Details</span>
            </div>
          }
          open={detailsModalOpen}
          onCancel={handleCloseModal}
          footer={null}
          width={800}
        >
          {selectedReport && (
            <div style={{ padding: '1rem 0' }}>
              {/* Status Badge */}
              <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Tag 
                  color={getStatusColor(selectedReport.status)}
                  style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                >
                  {getStatusIcon(selectedReport.status)}
                  <span style={{ marginLeft: '0.5rem' }}>
                    {selectedReport.status?.toUpperCase()}
                  </span>
                </Tag>
                <span style={{ color: '#6B7280', fontSize: '0.875rem' }}>
                  <Calendar size={14} style={{ marginRight: '0.25rem' }} />
                  {formatDate(selectedReport.timestamp)}
                </span>
              </div>

              {/* Main Information */}
              <Descriptions bordered column={1} size="small" style={{ marginBottom: '1.5rem' }}>
                <Descriptions.Item label="Customer">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={16} />
                    {selectedReport.customerName}
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Vehicle">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Car size={16} />
                    {selectedReport.carDetails ? (
                      <div>
                        <strong>{selectedReport.carDetails.make} {selectedReport.carDetails.model}</strong>
                        <span style={{ marginLeft: '0.5rem', color: '#6B7280' }}>({selectedReport.carDetails.plateNumber})</span>
                      </div>
                    ) : 'N/A'}
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Mechanic Head">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Wrench size={16} />
                    {selectedReport.mechanicHeadName || 'N/A'}
                  </div>
                </Descriptions.Item>
                {selectedReport.mechanicName && (
                  <Descriptions.Item label="Mechanics Assigned">
                    <div style={{ color: '#6B7280' }}>
                      {selectedReport.mechanicName}
                    </div>
                  </Descriptions.Item>
                )}
                {selectedReport.serviceType && (
                  <Descriptions.Item label="Service Type">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Settings size={16} />
                      {selectedReport.serviceType}
                    </div>
                  </Descriptions.Item>
                )}
              </Descriptions>

              {/* Diagnosis, Findings, Recommendations */}
              {(selectedReport.diagnosis || selectedReport.findings || selectedReport.recommendations || selectedReport.workPerformed) && (
                <>
                  <Divider orientation="left">Service Details</Divider>
                  {selectedReport.diagnosis && (
                    <div style={{ marginBottom: '1rem' }}>
                      <strong style={{ color: '#374151', display: 'block', marginBottom: '0.5rem' }}>Diagnosis:</strong>
                      <p style={{ margin: 0, color: '#6B7280', lineHeight: 1.6, padding: '0.75rem', background: '#F9FAFB', borderRadius: '6px', whiteSpace: 'pre-line' }}>
                        {selectedReport.diagnosis}
                      </p>
                    </div>
                  )}
                  {selectedReport.workPerformed && (
                    <div style={{ marginBottom: '1rem' }}>
                      <strong style={{ color: '#374151', display: 'block', marginBottom: '0.5rem' }}>Work Performed:</strong>
                      <p style={{ margin: 0, color: '#6B7280', lineHeight: 1.6, padding: '0.75rem', background: '#F9FAFB', borderRadius: '6px', whiteSpace: 'pre-line' }}>
                        {selectedReport.workPerformed}
                      </p>
                    </div>
                  )}
                  {selectedReport.findings && (
                    <div style={{ marginBottom: '1rem' }}>
                      <strong style={{ color: '#374151', display: 'block', marginBottom: '0.5rem' }}>Findings:</strong>
                      <p style={{ margin: 0, color: '#6B7280', lineHeight: 1.6, padding: '0.75rem', background: '#F9FAFB', borderRadius: '6px', whiteSpace: 'pre-line' }}>
                        {selectedReport.findings}
                      </p>
                    </div>
                  )}
                  {selectedReport.recommendations && (
                    <div style={{ marginBottom: '1rem' }}>
                      <strong style={{ color: '#374151', display: 'block', marginBottom: '0.5rem' }}>Recommendations:</strong>
                      <p style={{ margin: 0, color: '#6B7280', lineHeight: 1.6, padding: '0.75rem', background: '#F9FAFB', borderRadius: '6px', whiteSpace: 'pre-line' }}>
                        {selectedReport.recommendations}
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Parts Used */}
              {selectedReport.partsUsed && (
                <>
                  <Divider orientation="left">Parts Used</Divider>
                  <div style={{ marginBottom: '1.5rem' }}>
                    {typeof selectedReport.partsUsed === 'string' ? (
                      <p style={{ margin: 0, color: '#6B7280', lineHeight: 1.6, padding: '0.75rem', background: '#F9FAFB', borderRadius: '6px', whiteSpace: 'pre-line' }}>
                        {selectedReport.partsUsed}
                      </p>
                    ) : Array.isArray(selectedReport.partsUsed) && selectedReport.partsUsed.length > 0 ? (
                      selectedReport.partsUsed.map((part, index) => (
                        <div 
                          key={index} 
                          style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            padding: '0.75rem', 
                            background: '#F9FAFB', 
                            borderRadius: '6px',
                            marginBottom: '0.5rem'
                          }}
                        >
                          <span style={{ fontWeight: 500 }}>{part.name}</span>
                          <span style={{ color: '#6B7280' }}>Qty: {part.quantity}</span>
                        </div>
                      ))
                    ) : null}
                  </div>
                </>
              )}

              {/* Costs */}
              {(selectedReport.laborCost || selectedReport.totalCost) && (
                <>
                  <Divider orientation="left">Cost Breakdown</Divider>
                  <div style={{ 
                    padding: '1rem', 
                    background: '#FEF3C7', 
                    borderRadius: '8px',
                    border: '1px solid #FDE68A'
                  }}>
                    {selectedReport.laborCost && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <strong style={{ color: '#92400E' }}>Labor Cost:</strong>
                        <span style={{ color: '#92400E' }}>₱{selectedReport.laborCost.toLocaleString()}</span>
                      </div>
                    )}
                    {selectedReport.totalCost && (
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        paddingTop: '0.5rem',
                        borderTop: '2px solid #FCD34D'
                      }}>
                        <strong style={{ color: '#92400E', fontSize: '1.125rem' }}>Total Cost:</strong>
                        <span style={{ color: '#92400E', fontSize: '1.125rem', fontWeight: 600 }}>
                          ₱{selectedReport.totalCost.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </>
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
