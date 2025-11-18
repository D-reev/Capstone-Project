import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import { useAuthNavigation } from '../hooks/useAuthNavigation';
import Loading from '../components/Loading.jsx';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc,
  doc, 
  getFirestore,
  query,
  where,
  orderBy,
  collectionGroup 
} from 'firebase/firestore';
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Calendar,
  User, 
  Wrench,
  Menu,
  FileText,
  Search
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUserRole } from '../utils/auth.js';
import MechanicSidebar from '../components/MechanicSidebar.jsx';
import CarPartsRequestModal from '../components/modals/CarPartsRequestModal.jsx';
import ServiceReportModal from '../components/modals/ServiceReportModal.jsx';
import { createPartsRequest } from '../utils/auth.js';
import SuccessModal from '../components/modals/SuccessModal.jsx';
import ProfileModal from '../components/modals/ProfileModal.jsx';
import NavigationBar from "../components/NavigationBar.jsx";
import '../css/MechanicDashboard.css';

export default function MechanicDashboard() {
  const { user } = useAuth();
  const { sidebarOpen } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const [parts, setParts] = useState([]);
  const [isReportingService, setIsReportingService] = useState(false);
  const [isRequestingParts, setIsRequestingParts] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerCars, setCustomerCars] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedCar, setSelectedCar] = useState(null);
  const [expandedCustomerId, setExpandedCustomerId] = useState(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const db = getFirestore();

  useEffect(() => {
    console.log('Modal states:', { 
      isReportingService, 
      isRequestingParts, 
      hasSelectedCar: !!selectedCar, 
      hasSelectedCustomer: !!selectedCustomer 
    });
  }, [isReportingService, isRequestingParts, selectedCar, selectedCustomer]);

  useEffect(() => {
    checkUserAccess();
  }, [user]);

  const checkUserAccess = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      const userRole = await getUserRole(user.uid);
      if (userRole !== 'mechanic' && userRole !== 'admin') {
        navigate("/login");
        return;
      }
      
      await Promise.all([fetchInventory(), fetchCustomers()]);
      setLoading(false);
    } catch (error) {
      console.error('Error checking user role:', error);
      setError('Access verification failed');
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      const partsRef = collection(db, 'inventory');
      const q = query(partsRef, where('available', '==', true));
      const snapshot = await getDocs(q);
      const partsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setParts(partsList);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setError('Failed to load inventory');
    }
  };

  const fetchCustomers = async () => {
    try {
      console.log('Fetching customers...');
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef, 
        where('role', '==', 'user')
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        console.log('No customers found');
        setCustomers([]);
        return;
      }

      console.log('Found customers:', snapshot.size);

      const customersList = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const customerData = { id: docSnap.id, ...docSnap.data() };
          
          try {
            const carsRef = collection(db, `users/${docSnap.id}/cars`);
            const carsSnap = await getDocs(carsRef);
            console.log(`Customer ${customerData.displayName || docSnap.id} has ${carsSnap.size} cars`);
            return {
              ...customerData,
              carsCount: carsSnap.size
            };
          } catch (error) {
            console.error(`Error fetching cars for customer ${docSnap.id}:`, error);
            return {
              ...customerData,
              carsCount: 0
            };
          }
        })
      );

      const sortedCustomers = customersList.sort((a, b) => {
        if (!a.displayName) return 1;
        if (!b.displayName) return -1;
        return a.displayName.localeCompare(b.displayName);
      });

      console.log('Sorted customers:', sortedCustomers);
      setCustomers(sortedCustomers);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError('Failed to load customers');
    }
  };

  const fetchCustomerCars = async (customerId) => {
    if (!customerId) return;

    try {
      console.log('Fetching cars for customer:', customerId);
      const carsRef = collection(db, `users/${customerId}/cars`);
      const snapshot = await getDocs(carsRef);
      
      console.log('Cars snapshot size:', snapshot.size);
      
      if (snapshot.empty) {
        console.log('No cars found for customer:', customerId);
        setCustomerCars([]);
        return;
      }

      const carsList = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Car data:', { id: doc.id, ...data });
        return {
          id: doc.id,
          ...data
        };
      });
      
      // Sort by updatedAt or createdAt if available, otherwise by id
      const sortedCars = carsList.sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt || 0);
        const dateB = new Date(b.updatedAt || b.createdAt || 0);
        return dateB - dateA;
      });
      
      console.log('Sorted cars list:', sortedCars);
      setCustomerCars(sortedCars);
    } catch (error) {
      console.error('Error fetching customer cars:', error);
      setError('Failed to load customer cars');
      setCustomerCars([]);
    }
  };

  const handlePartsRequest = async (requestData) => {
    try {
      if (!selectedCar || !selectedCustomer || !user) {
        throw new Error('Missing required information');
      }

      await createPartsRequest({
        car: selectedCar,
        customer: selectedCustomer,
        parts: requestData.parts,
        urgent: requestData.urgent,
        notes: requestData.notes
      }, user.uid);
      
      setIsRequestingParts(false);
      setSelectedCar(null);

      setSuccessMessage('Parts request submitted successfully');
      setSuccessModalOpen(true);
    } catch (error) {
      console.error('Error requesting parts:', error);
      setError(error.message || 'Failed to submit parts request');
    }
  };

  const handleCustomerSelect = async (customer) => {
    console.log('Customer selected:', customer);
    if (expandedCustomerId === customer.id) {
      // Collapse
      setExpandedCustomerId(null);
      setSelectedCustomer(null);
      setCustomerCars([]);
      setSelectedCar(null);
    } else {
      // Expand and fetch cars
      setExpandedCustomerId(customer.id);
      setSelectedCustomer(customer);
      setCustomerCars([]); // Clear old data first
      await fetchCustomerCars(customer.id);
    }
  };

  if (loading) {
    return <Loading text="Loading data" />; // replaced inline placeholder
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  // Filter and search customers
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || (customer.status || 'active') === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusCounts = () => {
    return {
      all: customers.length,
      active: customers.filter(c => (c.status || 'active') === 'active').length,
      inactive: customers.filter(c => c.status === 'inactive').length
    };
  };

  const statusCounts = getStatusCounts();

  return (
    <div className={`dashboard-container mechanic-page${!sidebarOpen ? ' sidebar-collapsed' : ''}`}> 
      {/* MechanicSidebar */}
      <MechanicSidebar active={location.pathname === '/mechanicdashboard'} />
      <div className={`main-content${!sidebarOpen ? ' expanded' : ''}`}> 
        <NavigationBar
          title="Mechanic Dashboard"
          userRole="mechanic"
          userName={user?.displayName || 'Mechanic'}
          userEmail={user?.email || ''}
          onProfileClick={() => setProfileOpen(true)}
        />
        <div className="content-area">
          <div className="customers-section">
            <div className="customers-header">
              <div className="customers-header-left">
                <h2 className="customers-title">Customer Management</h2>
                <p className="customers-subtitle">Manage customer information and vehicles</p>
              </div>
              <div className="customers-actions">
                <div className="customers-search">
                  <Search size={18} />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
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
                All <span className="filter-count">{statusCounts.all}</span>
              </button>
              <button 
                className={`filter-tab ${filterStatus === 'active' ? 'active' : ''}`}
                onClick={() => setFilterStatus('active')}
              >
                <CheckCircle size={16} />
                Active <span className="filter-count">{statusCounts.active}</span>
              </button>
              <button 
                className={`filter-tab ${filterStatus === 'inactive' ? 'active' : ''}`}
                onClick={() => setFilterStatus('inactive')}
              >
                <Clock size={16} />
                Inactive <span className="filter-count">{statusCounts.inactive}</span>
              </button>
            </div>

            <div className="grid-layout">
              <div className="customers-list">
                {/* Desktop Table */}
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Customer Name</th>
                      <th>Email</th>
                      <th>Cars</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(customer => (
                      <React.Fragment key={customer.id}>
                        <tr 
                          onClick={() => handleCustomerSelect(customer)}
                          className={expandedCustomerId === customer.id ? 'selected' : ''}
                        >
                          <td>{customer.displayName}</td>
                          <td>{customer.email}</td>
                          <td>{customer.carsCount || 0}</td>
                          <td>
                            <span className={`status-badge ${customer.status || 'active'}`}>
                              {customer.status || 'Active'}
                            </span>
                          </td>
                        </tr>
                        {expandedCustomerId === customer.id && (
                          <tr className="expanded-row">
                            <td colSpan="4">
                              <div className="expanded-content">
                                <div className="expanded-header">
                                  <h3>Vehicles - {customer.displayName}</h3>
                                  <span className="vehicles-count">
                                    {customerCars.length} {customerCars.length === 1 ? 'vehicle' : 'vehicles'}
                                  </span>
                                </div>
                                {customerCars.length > 0 ? (
                                  <div className="expanded-cars-grid">
                                    {customerCars.map(car => (
                                      <div 
                                        key={car.id}
                                        className={`expanded-car-card ${selectedCar?.id === car.id ? 'selected' : ''}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedCar(car);
                                        }}
                                      >
                                        <div className="car-card-header">
                                          <h4>{car.year} {car.make} {car.model}</h4>
                                          <span className="car-plate-badge">{car.plateNumber}</span>
                                        </div>
                                        <div className="car-card-details">
                                          <p>{car.engine} • {car.transmission}</p>
                                          <p>Mileage: {car.mileage} km</p>
                                        </div>
                                        <div className="car-card-actions">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedCar(car);
                                              setIsReportingService(true);
                                            }}
                                            className="report-btn"
                                          >
                                            <FileText size={16} />
                                            Write Report
                                          </button>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedCar(car);
                                              setIsRequestingParts(true);
                                            }}
                                            className="request-btn"
                                          >
                                            <ShoppingBag size={16} />
                                            Request Parts
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="expanded-no-cars">
                                    <p>No vehicles found for this customer.</p>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>

                {/* Mobile Card List */}
                <div className="customers-mobile-list">
                  {filteredCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(customer => (
                    <div key={customer.id} className="customer-mobile-wrapper">
                      <div
                        className={`customer-mobile-card ${expandedCustomerId === customer.id ? 'selected' : ''}`}
                        onClick={() => handleCustomerSelect(customer)}
                      >
                        <div className="customer-mobile-header">
                          <div className="customer-mobile-info">
                            <h4 className="customer-mobile-name">{customer.displayName}</h4>
                            <p className="customer-mobile-email">{customer.email}</p>
                          </div>
                          <span className={`status-badge ${customer.status || 'active'}`}>
                            {customer.status || 'Active'}
                          </span>
                        </div>
                        <div className="customer-mobile-details">
                          <div className="customer-mobile-stat">
                            <User size={14} />
                            <span>{customer.carsCount || 0} {customer.carsCount === 1 ? 'vehicle' : 'vehicles'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Cars Section */}
                      {expandedCustomerId === customer.id && (
                        <div className="customer-mobile-expanded">
                          <div className="mobile-cars-header">
                            <h4>Vehicles</h4>
                            <span className="mobile-cars-count">
                              {customerCars.length} {customerCars.length === 1 ? 'vehicle' : 'vehicles'}
                            </span>
                          </div>
                          {customerCars.length > 0 ? (
                            <div className="mobile-cars-list">
                              {customerCars.map(car => (
                                <div 
                                  key={car.id}
                                  className={`mobile-car-card ${selectedCar?.id === car.id ? 'selected' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCar(car);
                                  }}
                                >
                                  <div className="mobile-car-header">
                                    <h5>{car.year} {car.make} {car.model}</h5>
                                    <span className="mobile-plate-number">{car.plateNumber}</span>
                                  </div>
                                  <div className="mobile-car-details">
                                    <p>{car.engine} • {car.transmission}</p>
                                    <p>Mileage: {car.mileage} km</p>
                                  </div>
                                  <div className="mobile-car-actions">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedCar(car);
                                        setIsReportingService(true);
                                      }}
                                      className="report-btn"
                                    >
                                      <FileText size={14} />
                                      Report
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedCar(car);
                                        setIsRequestingParts(true);
                                      }}
                                      className="request-btn"
                                    >
                                      <ShoppingBag size={14} />
                                      Parts
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="mobile-no-cars">
                              <p>No vehicles found for this customer.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {customers.length > itemsPerPage && (
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
                      {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredCustomers.length)} of {filteredCustomers.length} entries
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
                        max={Math.ceil(customers.length / itemsPerPage)}
                        value={currentPage}
                        onChange={(e) => {
                          const page = parseInt(e.target.value);
                          if (page >= 1 && page <= Math.ceil(customers.length / itemsPerPage)) {
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
                      <span style={{ color: '#FFC300', fontSize: '14px', fontWeight: '600' }}>of {Math.ceil(customers.length / itemsPerPage)}</span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(customers.length / itemsPerPage)))}
                        disabled={currentPage >= Math.ceil(customers.length / itemsPerPage)}
                        style={{
                          width: '32px',
                          height: '32px',
                          background: currentPage >= Math.ceil(customers.length / itemsPerPage) ? '#f3f4f6' : 'linear-gradient(135deg, #FFC300 0%, #FFD54F 100%)',
                          color: currentPage >= Math.ceil(customers.length / itemsPerPage) ? '#9ca3af' : '#000',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: currentPage >= Math.ceil(customers.length / itemsPerPage) ? 'not-allowed' : 'pointer',
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
                        onClick={() => setCurrentPage(Math.ceil(customers.length / itemsPerPage))}
                        disabled={currentPage >= Math.ceil(customers.length / itemsPerPage)}
                        style={{
                          width: '32px',
                          height: '32px',
                          background: currentPage >= Math.ceil(customers.length / itemsPerPage) ? '#f3f4f6' : 'linear-gradient(135deg, #FFC300 0%, #FFD54F 100%)',
                          color: currentPage >= Math.ceil(customers.length / itemsPerPage) ? '#9ca3af' : '#000',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: currentPage >= Math.ceil(customers.length / itemsPerPage) ? 'not-allowed' : 'pointer',
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
        </div>
      </div>

      {/* Modals */}
      <ServiceReportModal
        open={isReportingService && !!selectedCar && !!selectedCustomer}
        car={selectedCar}
        customer={selectedCustomer}
        onSubmit={() => {
          setIsReportingService(false);
          setSelectedCar(null);
          setSuccessMessage('Service report submitted successfully');
          setSuccessModalOpen(true);
        }}
        onClose={() => {
          setIsReportingService(false);
          setSelectedCar(null);
        }}
      />

      {isRequestingParts && selectedCar && selectedCustomer && (
        <CarPartsRequestModal
          car={selectedCar}
          customer={selectedCustomer}
          onSubmit={handlePartsRequest}
          onClose={() => {
            setIsRequestingParts(false);
            setSelectedCar(null);
          }}
        />
      )}

      {successModalOpen && (
        <SuccessModal
          message={successMessage}
          onClose={() => {
            setSuccessModalOpen(false);
            setSuccessMessage('');
          }}
        />
      )}

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} user={user} />
    </div>
  );
}