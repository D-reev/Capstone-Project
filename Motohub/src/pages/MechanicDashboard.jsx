import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
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
import { useNavigate } from 'react-router-dom';
import { getUserRole } from '../utils/auth';
import MechanicSidebar from '../components/MechanicSidebar';
import CarPartsRequestModal from '../components/modals/CarPartsRequestModal';
import ServiceReportModal from '../components/modals/ServiceReportModal';
import { createPartsRequest } from '../utils/auth';
import SuccessModal from '../components/modals/SuccessModal';
import TopBar from '../components/TopBar';
import ProfileModal from '../components/modals/ProfileModal';
import '../css/MechanicDashboard.css'

export default function MechanicDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [parts, setParts] = useState([]);
  const [isReportingService, setIsReportingService] = useState(false);
  const [isRequestingParts, setIsRequestingParts] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerCars, setCustomerCars] = useState([]);
  const [selectedCar, setSelectedCar] = useState(null);
  const [view, setView] = useState('customers'); // 'customers' or 'services'
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
      
      await Promise.all([fetchServices(), fetchInventory(), fetchCustomers()]);
      setLoading(false);
    } catch (error) {
      console.error('Error checking user role:', error);
      setError('Access verification failed');
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const servicesRef = collection(db, 'services');
      // Simplified query without orderBy
      const q = query(
        servicesRef,
        where('status', 'in', ['pending', 'in-progress'])
      );
      
      const snapshot = await getDocs(q);
      const servicesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      // Sort the data client-side instead
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      setServices(servicesList);
    } catch (error) {
      console.error('Error fetching services:', error);
      setError('Failed to load services');
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
      // Remove orderBy to avoid index requirement
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

      // Sort the customers client-side instead
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

  const handleServiceReport = async (serviceData) => {
    try {
      // Create service history record
      const serviceHistoryRef = collection(db, 'serviceHistory');
      const historyDoc = await addDoc(serviceHistoryRef, {
        ...serviceData,
        mechanicId: user.uid,
        mechanicName: user.displayName,
        timestamp: new Date().toISOString(),
        status: 'completed'
      });

      // Update service status
      const serviceRef = doc(db, 'services', selectedService.id);
      await updateDoc(serviceRef, {
        status: 'completed',
        completedAt: new Date().toISOString(),
        historyRef: historyDoc.id
      });

      setIsReportingService(false);
      fetchServices();
    } catch (error) {
      console.error('Error reporting service:', error);
      setError('Failed to submit service report');
    }
  };

  // Update the handlePartsRequest function
  const handlePartsRequest = async (requestData) => {
    try {
      if (!selectedService || !selectedCustomer || !user) {
        throw new Error('Missing required information');
      }

      await createPartsRequest({
        car: selectedService,
        customer: selectedCustomer,
        parts: requestData.parts,
        urgent: requestData.urgent,
        notes: requestData.notes
      }, user.uid);
      
      setIsRequestingParts(false);
      setSelectedService(null);

      // show modal instead of alert
      setSuccessMessage('Parts request submitted successfully');
      setSuccessModalOpen(true);
    } catch (error) {
      console.error('Error requesting parts:', error);
      setError(error.message || 'Failed to submit parts request');
    }
  };

  const handleCustomerSelect = async (customer) => {
    if (expandedCustomerId === customer.id) {
      // If clicking the same customer, collapse it
      setExpandedCustomerId(null);
      setSelectedCustomer(null);
      setCustomerCars([]);
      setSelectedCar(null);
    } else {
      // If clicking a different customer, expand it
      setExpandedCustomerId(customer.id);
      setSelectedCustomer(customer);
      await fetchCustomerCars(customer.id);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className={`dashboard-container mechanic-page${!sidebarOpen ? ' sidebar-collapsed' : ''}`}> 
      {/* MechanicSidebar */}
      <MechanicSidebar sidebarOpen={sidebarOpen} user={user} />
      <div className={`main-content${!sidebarOpen ? ' expanded' : ''}`}> 
        <TopBar
          title="Mechanic"
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          notificationsCount={0}
          onProfileClick={() => setProfileOpen(true)}
        />
        <div className="content-area">
          <div className="view-toggle">
            <button 
              className={`toggle-btn ${view === 'customers' ? 'active' : ''}`}
              onClick={() => setView('customers')}
            >
              Customers
            </button>
            <button 
              className={`toggle-btn ${view === 'services' ? 'active' : ''}`}
              onClick={() => setView('services')}
            >
              Active Services
            </button>
          </div>

          {view === 'customers' ? (
            <div className="customers-section">
              <div className="section-header">
                <h2>Customer Management</h2>
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
                                  setSelectedService({ ...car, customerId: selectedCustomer.id });
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
                                  setSelectedService({ ...car, customerId: selectedCustomer.id });
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
          ) : (
            // Existing services view
            <div className="services-section">
              <div className="section-header">
                <h2>Current Services</h2>
                <span className="service-count">
                  {services.length} active {services.length === 1 ? 'service' : 'services'}
                </span>
              </div>

              <div className="services-grid">
                {services.map(service => (
                  <ServiceCard 
                    key={service.id}
                    service={service}
                    isSelected={selectedService?.id === service.id}
                    onSelect={setSelectedService}
                    onReport={() => setIsReportingService(true)}
                    onRequestParts={() => setIsRequestingParts(true)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {isReportingService && selectedService && selectedCustomer && (
        <ServiceReportModal
          car={selectedService}              // ✅ the selected car object
          customer={selectedCustomer}        // ✅ the selected customer object
          onSubmit={handleServiceReport}
          onClose={() => {
            setIsReportingService(false);
            setSelectedService(null);
          }}
        />
      )}


      {isRequestingParts && selectedService && selectedCustomer && (
        <CarPartsRequestModal
          car={selectedService}                // ✅ pass the car object
          customer={selectedCustomer}          // ✅ pass the selected customer
          onSubmit={handlePartsRequest}
          onClose={() => {
            setIsRequestingParts(false);
            setSelectedService(null);
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

// Separate ServiceCard component for better organization
const ServiceCard = ({ service, isSelected, onSelect, onReport, onRequestParts }) => (
  <div 
    className={`service-card ${isSelected ? 'selected' : ''}`}
    onClick={() => onSelect(service)}
  >
    <div className="service-header">
      <h3>{service.customerName}</h3>
      <span className={`status-badge ${service.status}`}>
        {service.status}
      </span>
    </div>
    <div className="service-details">
      <p><Wrench size={16} /> Vehicle: {service.vehicle}</p>
      <p><Calendar size={16} /> Service Type: {service.type}</p>
      <div className="service-actions">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onReport();
          }}
          className="report-btn"
        >
          <CheckCircle size={16} />
          Report Service
        </button>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onRequestParts();
          }}
          className="request-btn"
        >
          <ShoppingBag size={16} />
          Request Parts
        </button>
      </div>
    </div>
  </div>
);