import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import { getFirestore, collection, getDocs, query } from 'firebase/firestore';
import { ConfigProvider, Input, Select, Tag, Avatar, Empty, Modal, Descriptions } from 'antd';
import { SearchOutlined, FilterOutlined, EyeOutlined } from '@ant-design/icons';
import { Car, User, Calendar, Gauge, Fuel, Settings as SettingsIcon, Phone, Mail } from 'lucide-react';
import SuperAdminSidebar from '../components/SuperAdminSidebar';
import NavigationBar from '../components/NavigationBar';
import Loading from '../components/Loading';
import ProfileModal from '../components/modals/ProfileModal';
import '../css/AllCustomerCars.css';

const { Option } = Select;

export default function AllCustomerCars() {
  const { sidebarOpen } = useSidebar();
  const { user } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allCars, setAllCars] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMake, setFilterMake] = useState('all');
  const [selectedCar, setSelectedCar] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const itemsPerPage = 12;
  const db = getFirestore();

  useEffect(() => {
    fetchAllCustomerCars();
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchAllCustomerCars = async () => {
    try {
      setLoading(true);
      const allCarsData = [];
      
      // Get all users
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      
      // For each user, fetch their cars
      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        
        // Only fetch cars for regular users
        if (userData.role === 'user') {
          const carsRef = collection(db, `users/${userDoc.id}/cars`);
          const carsSnapshot = await getDocs(carsRef);
          
          carsSnapshot.docs.forEach(carDoc => {
            allCarsData.push({
              id: carDoc.id,
              userId: userDoc.id,
              userName: userData.displayName || userData.email || 'Unknown User',
              userEmail: userData.email || '',
              userPhone: userData.phoneNumber || userData.mobileNumber || 'N/A',
              ...carDoc.data()
            });
          });
        }
      }
      
      // Sort by creation date, newest first
      allCarsData.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });
      
      setAllCars(allCarsData);
    } catch (error) {
      console.error('Error fetching customer cars:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (car) => {
    setSelectedCar(car);
    setDetailsModalOpen(true);
  };

  const handleCloseModal = () => {
    setDetailsModalOpen(false);
    setSelectedCar(null);
  };

  const filteredCars = allCars.filter(car => {
    const matchesSearch = 
      car.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.plateNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.userEmail?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMake = filterMake === 'all' || car.make === filterMake;
    
    return matchesSearch && matchesMake;
  });

  const uniqueMakes = [...new Set(allCars.map(car => car.make).filter(Boolean))].sort();

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const paginatedCars = filteredCars.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredCars.length / itemsPerPage);

  if (loading) {
    return <Loading text="Loading customer vehicles..." />;
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
      <div className="all-cars-page">
        <SuperAdminSidebar />

        <div className={`main-content ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
          <NavigationBar
            title="All Customer Vehicles"
            onProfileClick={() => setProfileOpen(true)}
            userRole="superadmin"
            userName={user?.displayName || 'Super Admin'}
            userEmail={user?.email || ''}
          />

          <div className="all-cars-container">
            <div className="all-cars-card">
              {/* Header */}
              <div className="all-cars-header">
                <div className="all-cars-header-left">
                  <h1 className="all-cars-title">Customer Vehicles</h1>
                  <span className="all-cars-subtitle">
                    Showing {filteredCars.length} of {allCars.length} vehicles
                  </span>
                </div>
                <div className="all-cars-actions">
                  <Select
                    value={filterMake}
                    onChange={(value) => setFilterMake(value)}
                    style={{ width: 180 }}
                    size="large"
                    suffixIcon={<FilterOutlined />}
                  >
                    <Option value="all">All Makes</Option>
                    {uniqueMakes.map(make => (
                      <Option key={make} value={make}>{make}</Option>
                    ))}
                  </Select>
                  <Input
                    placeholder="Search vehicles..."
                    prefix={<SearchOutlined style={{ color: '#9CA3AF' }} />}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: 300 }}
                    size="large"
                  />
                </div>
              </div>

              {/* Stats Row */}
              <div className="all-cars-stats">
                <div className="stat-card">
                  <Car size={24} className="stat-icon" />
                  <div className="stat-content">
                    <div className="stat-value">{allCars.length}</div>
                    <div className="stat-label">Total Vehicles</div>
                  </div>
                </div>
                <div className="stat-card">
                  <User size={24} className="stat-icon" />
                  <div className="stat-content">
                    <div className="stat-value">
                      {new Set(allCars.map(car => car.userId)).size}
                    </div>
                    <div className="stat-label">Customers</div>
                  </div>
                </div>
                <div className="stat-card">
                  <SettingsIcon size={24} className="stat-icon" />
                  <div className="stat-content">
                    <div className="stat-value">{uniqueMakes.length}</div>
                    <div className="stat-label">Makes</div>
                  </div>
                </div>
              </div>

              {/* Cars Grid */}
              <div className="all-cars-grid">
                {paginatedCars.length === 0 ? (
                  <div className="empty-state">
                    <Empty
                      description={
                        searchTerm || filterMake !== 'all'
                          ? 'No vehicles found matching your filters'
                          : 'No customer vehicles registered yet'
                      }
                    />
                  </div>
                ) : (
                  paginatedCars.map((car) => {
                    return (
                      <div key={car.id} className="car-card">
                        {/* Car Image */}
                        <div className="car-image-container">
                          {car.image ? (
                            <img src={car.image} alt={`${car.make} ${car.model}`} className="car-image" />
                          ) : (
                            <div className="car-image-placeholder">
                              <Car size={48} />
                            </div>
                          )}
                        </div>

                        {/* Car Info */}
                        <div className="car-info">
                          <div className="car-main-info">
                            <h3 className="car-name">
                              {car.make} {car.model}
                            </h3>
                            <Tag className="car-year-tag">{car.year}</Tag>
                          </div>
                          
                          <div className="car-plate">
                            <strong>Plate:</strong> {car.plateNumber}
                          </div>

                          {/* Owner Info */}
                          <div className="car-owner">
                            <User size={14} />
                            <span className="owner-name">{car.userName}</span>
                          </div>

                          {/* View Details Button */}
                          <button
                            className="toggle-details-btn"
                            onClick={() => handleViewDetails(car)}
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

        {/* Car Details Modal */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Car size={20} />
              <span>Vehicle Details</span>
            </div>
          }
          open={detailsModalOpen}
          onCancel={handleCloseModal}
          footer={null}
          width={700}
        >
          {selectedCar && (
            <div style={{ padding: '1rem 0' }}>
              {selectedCar.image && (
                <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                  <img 
                    src={selectedCar.image} 
                    alt={`${selectedCar.make} ${selectedCar.model}`}
                    style={{ 
                      width: '100%', 
                      maxHeight: '300px', 
                      objectFit: 'cover',
                      borderRadius: '8px'
                    }}
                  />
                </div>
              )}
              
              <Descriptions bordered column={1} size="small">
                <Descriptions.Item label="Vehicle">
                  <strong>{selectedCar.make} {selectedCar.model} ({selectedCar.year})</strong>
                </Descriptions.Item>
                <Descriptions.Item label="Plate Number">
                  {selectedCar.plateNumber}
                </Descriptions.Item>
                <Descriptions.Item label="Fuel Type">
                  {selectedCar.fuelType || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Transmission">
                  {selectedCar.transmission || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Engine">
                  {selectedCar.engine || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Mileage">
                  {selectedCar.mileage ? `${selectedCar.mileage.toLocaleString()} km` : 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Registered On">
                  {formatDate(selectedCar.createdAt)}
                </Descriptions.Item>
              </Descriptions>

              <div style={{ 
                marginTop: '1.5rem', 
                padding: '1rem', 
                background: '#F0FDF4', 
                borderRadius: '8px',
                border: '1px solid #BBF7D0'
              }}>
                <h4 style={{ 
                  margin: '0 0 1rem 0', 
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <User size={18} />
                  Owner Information
                </h4>
                <Descriptions bordered column={1} size="small">
                  <Descriptions.Item label="Name">
                    {selectedCar.userName}
                  </Descriptions.Item>
                  <Descriptions.Item label="Email">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Mail size={14} />
                      {selectedCar.userEmail}
                    </div>
                  </Descriptions.Item>
                  <Descriptions.Item label="Phone">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Phone size={14} />
                      {selectedCar.userPhone}
                    </div>
                  </Descriptions.Item>
                </Descriptions>
              </div>
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
