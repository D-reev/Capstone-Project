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
import ServiceHistoryModal from '../components/modals/ServiceHistoryModal';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

import '../css/UserDashboard.css';

export default function MotohubCustomerDashboard() {
  const [customerVehicles, setCustomerVehicles] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [isAddingCar, setIsAddingCar] = useState(false);
  const [newCarData, setNewCarData] = useState({
    make: '',
    model: '',
    year: '',
    plateNumber: '',
    engine: '',
    transmission: '',
    mileage: ''
  });
  const { user } = useAuth();

  useEffect(() => {
    console.debug("CustomerDashboard: user =", user);
    if (user) loadUserCars();
  }, [user]);

  const loadUserCars = async () => {
    const userCars = await getUserCars(user.uid);
    setVehicles(userCars);  
    setCustomerVehicles(userCars);
  };

  const handleAddCar = async (e) => {
    e.preventDefault();
    try {
      await createCarModel(user.uid, newCarData);
      setIsAddingCar(false);
      setNewCarData({
        make: '',
        model: '',
        year: '',
        plateNumber: '',
        engine: '',
        transmission: '',
        mileage: ''
      });
      await loadUserCars();
    } catch (error) {
      console.error('Error adding car:', error);
    }
  };

  const AddCarModal = () => (
    <div className="add-car-modal-overlay">
      <div className="add-car-modal-content" onClick={e => e.stopPropagation()}>
        <div className="add-car-modal-header">
          <h2>Add New Vehicle</h2>
          <button className="add-car-close-button" onClick={() => setIsAddingCar(false)}>
            <span>&times;</span>
          </button>
        </div>

        <form onSubmit={handleAddCar} className="add-car-form">
          <div className="add-car-form-grid">
            <div className="add-car-form-group full-width">
              <label>Make</label>
              <input
                type="text"
                value={newCarData.make}
                onChange={e => setNewCarData(prev => ({ ...prev, make: e.target.value }))}
                required
              />
            </div>
            <div className="add-car-form-group full-width">
              <label>Model</label>
              <input
                type="text"
                value={newCarData.model}
                onChange={e => setNewCarData(prev => ({ ...prev, model: e.target.value }))}
                required
              />
            </div>
            <div className="add-car-form-group">
              <label>Year</label>
              <input
                type="number"
                value={newCarData.year}
                onChange={e => setNewCarData(prev => ({ ...prev, year: e.target.value }))}
                required
              />
            </div>
            <div className="add-car-form-group">
              <label>Plate Number</label>
              <input
                type="text"
                value={newCarData.plateNumber}
                onChange={e => setNewCarData(prev => ({ ...prev, plateNumber: e.target.value }))}
                required
              />
            </div>
            <div className="add-car-form-group">
              <label>Engine</label>
              <input
                type="text"
                value={newCarData.engine}
                onChange={e => setNewCarData(prev => ({ ...prev, engine: e.target.value }))}
                required
              />
            </div>
            <div className="add-car-form-group">
              <label>Transmission</label>
              <select
                value={newCarData.transmission}
                onChange={e => setNewCarData(prev => ({ ...prev, transmission: e.target.value }))}
                required
              >
                <option value="">Select Transmission</option>
                <option value="Manual">Manual</option>
                <option value="Automatic">Automatic</option>
                <option value="CVT">CVT</option>
              </select>
            </div>
            <div className="add-car-form-group full-width">
              <label>Current Mileage</label>
              <input
                type="number"
                value={newCarData.mileage}
                onChange={e => setNewCarData(prev => ({ ...prev, mileage: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="add-car-modal-footer">
            <button type="button" className="add-car-cancel-btn" onClick={() => setIsAddingCar(false)}>
              Cancel
            </button>
            <button type="submit" className="add-car-save-btn">
              Add Vehicle
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const VehicleCard = ({ vehicle }) => {
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [serviceHistory, setServiceHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const db = getFirestore();

    const loadServiceHistory = async () => {
      setLoading(true);
      try {
        const serviceHistoryRef = collection(db, `users/${user.uid}/cars/${vehicle.id}/serviceHistory`);
        const snapshot = await getDocs(serviceHistoryRef);
        
        const history = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        setServiceHistory(history);
      } catch (error) {
        console.error('Error fetching service history:', error);
        setServiceHistory([]);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      if (showHistoryModal) {
        loadServiceHistory();
      }
    }, [showHistoryModal]);

    const getStatusColor = (status) => {
      switch (status?.toLowerCase()) {
        case 'excellent': return 'status-excellent';
        case 'good': return 'status-good';
        case 'needs attention': return 'status-needs-attention';
        case 'in service': return 'status-in-service';
        default: return 'status-good';
      }
    };

    const getStatusIcon = (status) => {
      switch (status?.toLowerCase()) {
        case 'excellent': return <CheckCircle size={16} />;
        case 'good': return <CheckCircle size={16} />;
        case 'needs attention': return <AlertTriangle size={16} />;
        case 'in service': return <Wrench size={16} />;
        default: return <CheckCircle size={16} />;
      }
    };

    return (
      <>
        <div className="vehicle-card">
          <div className="vehicle-card-image">
            <Car size={64} />
            <div className={`vehicle-status-badge ${getStatusColor(vehicle.status)}`}>
              {getStatusIcon(vehicle.status)}
              <span>{vehicle.status}</span>
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
                <span className="vehicle-spec-value">{vehicle.lastService || 'N/A'}</span>
              </div>
              <div className="vehicle-spec-item">
                <span className="vehicle-spec-label">Next Service</span>
                <span className="vehicle-spec-value">{vehicle.nextService || 'N/A'}</span>
              </div>
              <div className="vehicle-spec-item">
                <span className="vehicle-spec-label">Service Due</span>
                <span className={`vehicle-spec-value service-due-${vehicle.serviceDue?.toLowerCase().replace(' ', '-')}`}>
                  {vehicle.serviceDue || 'N/A'}
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

        {showHistoryModal && (
          <ServiceHistoryModal
            vehicle={vehicle}
            serviceHistory={serviceHistory}
            onClose={() => setShowHistoryModal(false)}
          />
        )}
      </>
    );
  };

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
      <UserSidebar 
        sidebarOpen={sidebarOpen}
        user={user}
        className={`customer-sidebar${sidebarOpen ? '' : ' collapsed'}${sidebarMobileOpen ? ' open' : ''}`}
        onCloseMobile={() => setSidebarMobileOpen(false)}
      />

      <div className="customer-main-content">
        <div className="customer-top-bar">
          <div className="top-bar-left-section">
            <button
              className="top-bar-menu-btn"
              onClick={() => {
                if (window.innerWidth <= 768) {
                  setSidebarMobileOpen(!sidebarMobileOpen);
                } else {
                  setSidebarOpen(!sidebarOpen);
                }
              }}
            >
              <Menu size={20} />
            </button>
            <h1 className="top-bar-title-text">Motohub</h1>
          </div>
          <div className="top-bar-logo-wrapper">
            <div className="top-bar-logo-image" style={{ backgroundImage: `url(${logo})` }} />
          </div>
        </div>

        <div className="customer-content-area">
          <div className="welcome-section">
            <h2 className="welcome-title">Welcome Back, {user?.displayName || 'Juan'}!</h2>
            <p className="welcome-subtitle">Manage your vehicles and track your service history</p>
          </div>

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

          <div className="vehicles-section">
            <div className="section-header">
              <h3 className="vehicles-section-title">🚗 My Vehicles</h3>
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