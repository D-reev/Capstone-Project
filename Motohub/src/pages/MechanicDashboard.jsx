import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
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
  FileText
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUserRole } from '../utils/auth.js';
import MechanicSidebar from '../components/MechanicSidebar.jsx';
import CarPartsRequestModal from '../components/modals/CarPartsRequestModal.jsx';
import ServiceReportModal from '../components/modals/ServiceReportModal.jsx';
import { createPartsRequest } from '../utils/auth.js';
import SuccessModal from '../components/modals/SuccessModal.jsx';
import ProfileModal from '../components/modals/ProfileModal.jsx';
import TopBar from "../components/TopBar.jsx";
import '../css/MechanicDashboard.css';

export default function MechanicDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [parts, setParts] = useState([]);
  const [isReportingService, setIsReportingService] = useState(false);
  const [isRequestingParts, setIsRequestingParts] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerCars, setCustomerCars] = useState([]);
  const [selectedCar, setSelectedCar] = useState(null);
  const [expandedCustomerId, setExpandedCustomerId] = useState(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const db = getFirestore();

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

      const customersList = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const customerData = { id: docSnap.id, ...docSnap.data() };
          
          try {
            const carsRef = collection(db, `users/${docSnap.id}/cars`);
            const carsSnap = await getDocs(carsRef);
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

      setCustomers(sortedCustomers);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError('Failed to load customers');
    }
  };

  const fetchCustomerCars = async (customerId) => {
    if (!customerId) return;

    try {
      const carsRef = collection(db, `users/${customerId}/cars`);
      const q = query(carsRef, orderBy('updatedAt', 'desc'));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setCustomerCars([]);
        return;
      }

      const carsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setCustomerCars(carsList);
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
    if (expandedCustomerId === customer.id) {
      setExpandedCustomerId(null);
      setSelectedCustomer(null);
      setCustomerCars([]);
      setSelectedCar(null);
    } else {
      setExpandedCustomerId(customer.id);
      setSelectedCustomer(customer);
      await fetchCustomerCars(customer.id);
    }
  };

  if (loading) {
    return <Loading text="Loading data" />; // replaced inline placeholder
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className={`dashboard-container mechanic-page${!sidebarOpen ? ' sidebar-collapsed' : ''}`}> 
      {/* MechanicSidebar */}
      <MechanicSidebar sidebarOpen={sidebarOpen} active={location.pathname === '/mechanicdashboard'} />
      <div className={`main-content${!sidebarOpen ? ' expanded' : ''}`}> 
        <TopBar
          title="Mechanic Dashboard"
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          notificationsCount={0}
          onProfileClick={() => setProfileOpen(true)}
        />
        <div className="content-area">
          <div className="customers-section">
            <div className="section-header">
              <h2>Customer Management</h2>
              <span className="customer-count">
                {customers.length} {customers.length === 1 ? 'customer' : 'customers'}
              </span>
            </div>

            <div className="grid-layout">
              <div className="customers-list">
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
                    {customers.map(customer => (
                      <tr 
                        key={customer.id}
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
                    ))}
                  </tbody>
                </table>
              </div>

              {expandedCustomerId && selectedCustomer && (
                <div className="cars-grid">
                  <h3>
                    Vehicles - {selectedCustomer.displayName}
                    <span className="cars-count">
                      ({customerCars.length} {customerCars.length === 1 ? 'vehicle' : 'vehicles'})
                    </span>
                  </h3>
                  <div className="cars-list">
                    {customerCars.length > 0 ? (
                      customerCars.map(car => (
                        <div 
                          key={car.id}
                          className={`car-card ${selectedCar?.id === car.id ? 'selected' : ''}`}
                          onClick={() => setSelectedCar(car)}
                        >
                          <div className="car-header">
                            <h4>{car.year} {car.make} {car.model}</h4>
                            <span className="plate-number">{car.plateNumber}</span>
                          </div>
                          <div className="car-details">
                            <p>{car.engine} • {car.transmission}</p>
                            <p>Mileage: {car.mileage} km</p>
                          </div>
                          <div className="car-actions">
                            <button
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
                      ))
                    ) : (
                      <div className="no-cars">
                        <p>No vehicles found for this customer.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isReportingService && selectedCar && selectedCustomer && (
        <ServiceReportModal
          car={selectedCar}
          customer={selectedCustomer}
          onSubmit={() => {
            setIsReportingService(false);
            setSuccessMessage('Service report submitted successfully');
            setSuccessModalOpen(true);
          }}
          onClose={() => {
            setIsReportingService(false);
            setSelectedCar(null);
          }}
        />
      )}

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