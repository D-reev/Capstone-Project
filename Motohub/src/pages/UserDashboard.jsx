import logo from '../assets/images/logo.jpeg';
import React, { useState, useEffect } from 'react';
import { 
  Car, 
  Calendar, 
  Settings, 
  User,
  Bell,
  Menu,
  Wrench,
  FileText,
  CreditCard,
  Phone,
  Mail,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  History,
  MapPin
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { createCarModel, getUserCars, updateCarModel, addServiceHistory, getCarServiceHistory } from '../utils/auth';
import UserSidebar from '../components/UserSidebar';

// Import the customer-specific CSS file
import '../css/UserDashboard.css';

export default function MotohubCustomerDashboard() {
  const [customerVehicles, setCustomerVehicles] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [isAddingCar, setIsAddingCar] = useState(false);
  const [newCarData, setNewCarData] = useState({
    carId: '',
    make: '',      // Changed from 'name' to 'make'
    model: '',
    year: '',
    plateNumber: '',
    engine: '',
    transmission: '',
    mileage: '',
    status: 'Good'
  });
  const { user } = useAuth();

  useEffect(() => {
    console.debug("CustomerDashboard: user =", user);
    if (user) loadUserCars();
  }, [user]);


  const loadUserCars = async () => {
    const userCars = await getUserCars(user.uid);
    setVehicles(userCars);  
    setCustomerVehicles(userCars); // ✅ keeps them in sync
  };

  const handleAddCar = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      // Remove carId from newCarData since we'll generate it in Firestore
      const { carId, ...carDataWithoutId } = newCarData;
      
      await createCarModel(user.uid, carDataWithoutId);
      
      setIsAddingCar(false);
      setNewCarData({
        carId: '',
        make: '',      // Changed from 'name' to 'make'
        model: '',
        year: '',
        plateNumber: '',
        engine: '',
        transmission: '',
        mileage: '',
        status: 'Good'
      });
      
      // Reload the cars after adding
      await loadUserCars();
    } catch (error) {
      console.error('Error adding car:', error);
    }
  };

  // Add Car Modal
  const AddCarModal = () => (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Add New Vehicle</h2>
        <form onSubmit={handleAddCar}>
          <div className="form-group">
            <label>Make</label>  {/* Changed from 'Name' to 'Make' */}
            <input
              type="text"
              value={newCarData.make}
              onChange={(e) => setNewCarData(prev => ({
                ...prev,
                make: e.target.value
              }))}
              required
            />
          </div>
          <div className="form-group">
            <label>Model</label>
            <input
              value={newCarData.model}
              onChange={(e) => setNewCarData(prev => ({
                ...prev,
                model: e.target.value
              }))}
              required
            />
          </div>
          <div className="form-group">
            <label>Year</label>
            <input
              type="number"
              value={newCarData.year}
              onChange={(e) => setNewCarData(prev => ({
                ...prev,
                year: e.target.value
              }))}
              required
            />
          </div>
          <div className="form-group">
            <label>Plate Number</label>
            <input
              type="text"
              value={newCarData.plateNumber}
              onChange={(e) => setNewCarData(prev => ({
                ...prev,
                plateNumber: e.target.value
              }))}
              required
            />
          </div>
          <div className="form-group">
            <label>Engine</label>
            <input
              type="text"
              value={newCarData.engine}
              onChange={(e) => setNewCarData(prev => ({
                ...prev,
                engine: e.target.value
              }))}
              required
            />
          </div>
          <div className="form-group">
            <label>Transmission</label>
            <select
              value={newCarData.transmission}
              onChange={(e) => setNewCarData(prev => ({
                ...prev,
                transmission: e.target.value
              }))}
              required
            >
              <option value="">Select Transmission</option>
              <option value="Manual">Manual</option>
              <option value="Automatic">Automatic</option>
              <option value="CVT">CVT</option>
            </select>
          </div>
          <div className="form-group">
            <label>Current Mileage</label>
            <input
              type="number"
              value={newCarData.mileage}
              onChange={(e) => setNewCarData(prev => ({
                ...prev,
                mileage: e.target.value
              }))}
              required
            />
          </div>
          <div className="modal-actions">
            <button type="submit" className="save-btn">Add Vehicle</button>
            <button 
              type="button" 
              className="cancel-btn"
              onClick={() => setIsAddingCar(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const VehicleCard = ({ vehicle }) => {
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [serviceHistory, setServiceHistory] = useState([]);
    const { user } = useAuth();

    const loadServiceHistory = async () => {
      const history = await getCarServiceHistory(user.uid, vehicle.id);
      setServiceHistory(history);
    };

    useEffect(() => {
      if (showHistoryModal) {
        loadServiceHistory();
      }
    }, [showHistoryModal]);

    const getStatusColor = (status) => {
      switch (status.toLowerCase()) {
        case 'excellent': return 'status-excellent';
        case 'good': return 'status-good';
        case 'needs attention': return 'status-needs-attention';
        case 'in service': return 'status-in-service';
        default: return 'status-good';
      }
    };

    const getStatusIcon = (status) => {
      switch (status.toLowerCase()) {
        case 'excellent': return <CheckCircle size={16} />;
        case 'good': return <CheckCircle size={16} />;
        case 'needs attention': return <AlertTriangle size={16} />;
        case 'in service': return <Wrench size={16} />; // Changed from Tool to Wrench
        default: return <CheckCircle size={16} />;
      }
    };

    return (
      <>
        <div className="vehicle-card">
          <div className="vehicle-card-image">
            <Car size={64} style={{color: '#a0aec0'}} />
            <div className={`vehicle-status-badge ${getStatusColor(vehicle.status)}`}>
              {getStatusIcon(vehicle.status)}
              <span style={{marginLeft: '0.25rem'}}>{vehicle.status}</span>
            </div>
          </div>
          
          <div className="vehicle-card-content">
            <div className="vehicle-header">
              <div className="vehicle-info">
                <h3 className="vehicle-title">{vehicle.year} {vehicle.make} {vehicle.model}</h3>
                <p className="vehicle-subtitle">{vehicle.engine} • {vehicle.transmission}</p>
                <div className="vehicle-plate">{vehicle.plateNumber}</div>
              </div>
            </div>

            <div className="vehicle-specs">
              <div className="vehicle-spec-item">
                <span className="vehicle-spec-label">Mileage</span>
                <span className="vehicle-spec-value">{vehicle.mileage} km</span>
              </div>
              <div className="vehicle-spec-item">
                <span className="vehicle-spec-label">Last Service</span>
                <span className="vehicle-spec-value">{vehicle.lastService}</span>
              </div>
              <div className="vehicle-spec-item">
                <span className="vehicle-spec-label">Next Service</span>
                <span className="vehicle-spec-value">{vehicle.nextService}</span>
              </div>
              <div className="vehicle-spec-item">
                <span className="vehicle-spec-label">Service Due</span>
                <span className="vehicle-spec-value" style={{
                  color: vehicle.serviceDue === 'Overdue' ? '#f56565' : 
                        vehicle.serviceDue === 'Due Soon' ? '#ed8936' : '#48bb78'
                }}>
                  {vehicle.serviceDue}
                </span>
              </div>
            </div>

            <div className="vehicle-actions">
              <button className="vehicle-action-btn btn-primary">
                <Calendar size={16} />
                Book Service
              </button>
              <button 
                className="vehicle-action-btn btn-secondary"
                onClick={() => setShowHistoryModal(true)}
              >
                <History size={16} />
                History
              </button>
              <button className="vehicle-action-btn btn-outline">
                <FileText size={16} />
                Reports
              </button>
            </div>
          </div>
        </div>

        {/* Service History Modal */}
        {showHistoryModal && (
          <div className="history-modal-overlay" onClick={() => setShowHistoryModal(false)}>
            <div className="history-modal" onClick={e => e.stopPropagation()}>
              <div className="history-modal-header">
                <h3 className="history-modal-title">
                  Service History - {vehicle.make} {vehicle.model}
                </h3>
                <button 
                  className="close-modal-btn"
                  onClick={() => setShowHistoryModal(false)}
                >
                  <XCircle size={20} />
                </button>
              </div>
              <div className="service-history-list">
                {serviceHistory.length > 0 ? (
                  serviceHistory.map((service) => (
                    <div key={service.id} className="service-entry">
                      <div className="service-item-header">
                        <Wrench size={16} />
                        <span className="service-type">{service.serviceType}</span>
                        <span className="service-date">
                          {new Date(service.date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="service-description">{service.description}</p>
                      <div className="service-details">
                        <span>Cost: ₱{service.cost}</span>
                        <span>Technician: {service.technician}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-history">No service history available</p>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  const ServiceHistoryCard = ({ vehicle }) => (
    <div className="service-history">
      <div className="service-history-header">
        <h3 className="service-history-title">Recent Service History - {vehicle.make} {vehicle.model}</h3>
      </div>
      <div>
        {vehicle.serviceHistory?.map((service, index) => (
          <div key={index} className="service-item">
            <div className="service-icon">
              <Wrench size={20} />
            </div>
            <div className="service-details">
              <div className="service-name">{service.service}</div>
              <div className="service-date">{service.date} • {service.technician}</div>
            </div>
            <div className="service-cost">₱{service.cost.toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const QuickActionCard = ({ icon: Icon, title, description, onClick }) => (
    <div className="quick-action-card" onClick={onClick}>
      <div className="quick-action-icon">
        <Icon size={24} />
      </div>
      <div className="quick-action-title">{title}</div>
      <div className="quick-action-description">{description}</div>
    </div>
  );

  return (
  <div className="customer-dashboard-container">
      {/* Sidebar: desktop and mobile */}
      <UserSidebar 
        sidebarOpen={sidebarOpen}
        user={user}
        className={`customer-sidebar${sidebarOpen ? '' : ' collapsed'}${sidebarMobileOpen ? ' open' : ''}`}
        onCloseMobile={() => setSidebarMobileOpen(false)}
      />

      {/* Main content */}
      <div className="customer-main-content">
        <div className="customer-top-bar" style={{position: 'relative'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
            <button
              onClick={() => {
                if (window.innerWidth <= 768) {
                  setSidebarMobileOpen(!sidebarMobileOpen);
                } else {
                  setSidebarOpen(!sidebarOpen);
                }
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                padding: '0.25rem',
                borderRadius: '0.25rem'
              }}
            >
              <Menu size={20} />
            </button>
            <h1 style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              color: '#f6e05e',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Motohub
            </h1>
          </div>
          <div style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            height: '100%',
            paddingRight: '0.5rem'
          }}>
            <div style={{
              width: '147px',
              height: '47px',
              background: `url(${logo}) center/contain no-repeat`,
              display: 'block'
            }} />
          </div>
        </div>

        <div className="customer-content-area">
          <div style={{marginBottom: '2rem'}}>
            <h2 style={{fontSize: '2rem', fontWeight: '700', color: '#2d3748', marginBottom: '0.25rem'}}>
              Welcome Back, Juan!
            </h2>
            <p style={{color: '#718096', fontSize: '1rem'}}>
              Manage your vehicles and track your service history
            </p>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions">
            <QuickActionCard 
              icon={Calendar} 
              title="Book Appointment" 
              description="Schedule your next service"
              onClick={() => alert('Book appointment clicked')}
            />
            <QuickActionCard 
              icon={Phone} 
              title="Emergency Service" 
              description="24/7 roadside assistance"
              onClick={() => alert('Emergency service clicked')}
            />
            <QuickActionCard 
              icon={MessageSquare} 
              title="Contact Support" 
              description="Get help from our team"
              onClick={() => alert('Contact support clicked')}
            />
            <QuickActionCard 
              icon={FileText} 
              title="Service Reports" 
              description="Download your vehicle reports"
              onClick={() => alert('Service reports clicked')}
            />
          </div>

          {/* My Vehicles Section */}
          <div style={{marginBottom: '2rem'}}>
            <div className="section-header">
              <h3 style={{fontSize: '1.5rem', fontWeight: '600', color: '#2d3748'}}>
                🚗 My Vehicles
              </h3>
              <button 
                className="add-vehicle-btn"
                onClick={() => setIsAddingCar(true)}
              >
                <Car size={16} />
                Add Vehicle
              </button>
            </div>
            <div className="my-vehicles-grid">
              {vehicles.map(vehicle => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {isAddingCar && <AddCarModal />}
    </div>
  );
}

function CustomerNavItem({ icon: Icon, label, active = false, sidebarOpen }) {
  return (
    <div className={`customer-nav-item ${active ? 'active' : ''}`}>
      <Icon className="customer-nav-icon" size={20} />
      {sidebarOpen && (
        <span className="customer-nav-label">{label}</span>
      )}
    </div>
  );
}