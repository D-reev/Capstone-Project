import React, { useEffect, useState } from 'react';
import { ConfigProvider, App } from 'antd';
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Car, History, Plus, Edit, Trash2 } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import UserSidebar from '../components/UserSidebar';
import SuperAdminSidebar from '../components/SuperAdminSidebar';
import NavigationBar from '../components/NavigationBar';
import ServiceHistoryModal from '../components/modals/ServiceHistoryModal';
import AddCarModal from '../components/modals/AddCarModal';
import EditCarModal from '../components/modals/EditCarModal';

import '../css/MyCars.css';

function MyCarsContent() {
  const [vehicles, setVehicles] = useState([]);
  const { sidebarOpen } = useSidebar();
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const [isAddingCar, setIsAddingCar] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const { user } = useAuth();
  const { message: messageApi, modal } = App.useApp();
  const db = getFirestore();

  useEffect(() => {
    if (user) loadUserCars();
  }, [user]);

  const loadUserCars = async () => {
    try {
      if (!user?.uid) return;
      const carsRef = collection(db, `users/${user.uid}/cars`);
      const snap = await getDocs(carsRef);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Fetch last service date for each vehicle
      const vehiclesWithLastService = await Promise.all(
        list.map(async (vehicle) => {
          const lastServiceDate = await getLastServiceDate(vehicle.id);
          return {
            ...vehicle,
            lastService: lastServiceDate || vehicle.lastService || 'N/A'
          };
        })
      );
      
      setVehicles(vehiclesWithLastService);
    } catch (error) {
      console.error('Error loading vehicles:', error);
      messageApi.error('Failed to load vehicles');
    }
  };

  const getLastServiceDate = async (vehicleId) => {
    try {
      if (!user?.uid) return null;
      const historyRef = collection(db, `users/${user.uid}/cars/${vehicleId}/serviceHistory`);
      const snapshot = await getDocs(historyRef);
      
      if (snapshot.empty) return null;
      
      // Get all service records and sort by timestamp
      const services = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by timestamp, newest first
      services.sort((a, b) => {
        const dateA = new Date(a.timestamp || a.date);
        const dateB = new Date(b.timestamp || b.date);
        return dateB - dateA;
      });
      
      // Return the most recent service date
      if (services.length > 0) {
        const lastService = services[0];
        const serviceDate = new Date(lastService.timestamp || lastService.date);
        return serviceDate.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
      }
      
      return null;
    } catch (error) {
      console.error('Error getting last service date:', error);
      return null;
    }
  };

  const handleAddCar = async (formData) => {
    try {
      if (!user?.uid) {
        messageApi.error('You must be logged in');
        return;
      }
      const carsRef = collection(db, `users/${user.uid}/cars`);
      await addDoc(carsRef, {
        ...formData,
        createdAt: new Date().toISOString(),
      });
      setIsAddingCar(false);
      await loadUserCars();
      messageApi.success('Vehicle added successfully!');
    } catch (error) {
      console.error('Error adding car:', error);
      messageApi.error('Failed to add vehicle');
    }
  };

  const handleEditCar = async (formData) => {
    try {
      if (!user?.uid || !editingVehicle?.id) {
        messageApi.error('Invalid operation');
        return;
      }
      const carRef = doc(db, `users/${user.uid}/cars/${editingVehicle.id}`);
      await updateDoc(carRef, {
        ...formData,
        updatedAt: new Date().toISOString(),
      });
      setEditingVehicle(null);
      await loadUserCars();
      messageApi.success('Vehicle updated successfully!');
    } catch (error) {
      console.error('Error updating car:', error);
      messageApi.error('Failed to update vehicle');
    }
  };

  const handleDeleteCar = (vehicle) => {
    modal.confirm({
      title: 'Delete Vehicle',
      content: `Are you sure you want to delete ${vehicle.year} ${vehicle.make} ${vehicle.model}?`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      centered: true,
      onOk: async () => {
        try {
          if (!user?.uid) return;
          const carRef = doc(db, `users/${user.uid}/cars/${vehicle.id}`);
          await deleteDoc(carRef);
          await loadUserCars();
          messageApi.success('Vehicle deleted successfully!');
        } catch (error) {
          console.error('Error deleting car:', error);
          messageApi.error('Failed to delete vehicle');
        }
      },
    });
  };

  const VehicleCard = ({ vehicle }) => {
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [serviceHistory, setServiceHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [lastServiceDisplay, setLastServiceDisplay] = useState(vehicle.lastService || 'N/A');

    const loadServiceHistory = async () => {
      try {
        setLoading(true);
        const historyRef = collection(db, `users/${user.uid}/cars/${vehicle.id}/serviceHistory`);
        const snapshot = await getDocs(historyRef);
        const history = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sort by timestamp to get the most recent
        history.sort((a, b) => {
          const dateA = new Date(a.timestamp || a.date);
          const dateB = new Date(b.timestamp || b.date);
          return dateB - dateA;
        });
        
        setServiceHistory(history);
        
        if (history.length > 0) {
          const lastService = history[0];
          const serviceDate = new Date(lastService.timestamp || lastService.date);
          const formattedDate = serviceDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          });
          setLastServiceDisplay(formattedDate);
        }
      } catch (error) {
        console.error('Error loading service history:', error);
        messageApi.error('Failed to load service history');
      } finally {
        setLoading(false);
      }
    };

    const handleHistoryClick = async () => {
      await loadServiceHistory();
      setShowHistoryModal(true);
    };

    return (
      <>
        <div className="vehicle-card">
          {vehicle.imageUrl ? (
            <div className="vehicle-card-image">
              <img src={vehicle.imageUrl} alt={`${vehicle.make} ${vehicle.model}`} />
            </div>
          ) : (
            <div className="vehicle-card-badge">
              <Car size={20} />
            </div>
          )}

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
                <span className="vehicle-spec-value">{lastServiceDisplay}</span>
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
              <button
                className="vehicle-action-btn btn-secondary"
                onClick={handleHistoryClick}
                disabled={loading}
              >
                <History size={16} />
                {loading ? 'Loading...' : 'History'}
              </button>
              <button
                className="vehicle-action-btn btn-primary"
                onClick={() => setEditingVehicle({ ...vehicle, userId: user.uid })}
              >
                <Edit size={16} />
                Edit
              </button>
              <button
                className="vehicle-action-btn btn-danger"
                onClick={() => handleDeleteCar(vehicle)}
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        </div>

        <ServiceHistoryModal
          vehicle={vehicle}
          serviceHistory={serviceHistory}
          open={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
        />
      </>
    );
  };

  return (
    <div className="my-cars-container">
      {user?.role === 'superadmin' ? (
        <SuperAdminSidebar />
      ) : (
        <UserSidebar
          user={user}
          className={`customer-sidebar${sidebarOpen ? '' : ' collapsed'}${sidebarMobileOpen ? ' open' : ''}`}
          onCloseMobile={() => setSidebarMobileOpen(false)}
        />
      )}

      <div className={`my-cars-main-content ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        <NavigationBar
          title="My Vehicles"
          subtitle="Manage your registered vehicles"
          userRole="customer"
          userName={user?.displayName || 'User'}
          userEmail={user?.email || ''}
        />

        <div className="my-cars-content-area">
          <div className="section-header">
            <div>
              <h2 className="section-title">My Vehicles</h2>
              <p className="section-subtitle">Manage and track all your registered vehicles</p>
            </div>
            <button className="add-vehicle-btn" onClick={() => setIsAddingCar(true)}>
              <Plus size={20} />
              Add Vehicle
            </button>
          </div>

          {vehicles.length > 0 ? (
            <div className="my-vehicles-grid">
              {vehicles.map(vehicle => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </div>
          ) : (
            <div className="no-vehicles">
              <Car size={64} />
              <h3>No Vehicles Yet</h3>
              <p>Start by adding your first vehicle to track its service history</p>
              <button className="add-vehicle-btn-large" onClick={() => setIsAddingCar(true)}>
                <Plus size={20} />
                Add Your First Vehicle
              </button>
            </div>
          )}
        </div>
      </div>

      {isAddingCar && (
        <AddCarModal
          userId={user?.uid}
          onSubmit={handleAddCar}
          onClose={() => setIsAddingCar(false)}
        />
      )}

      {editingVehicle && (
        <EditCarModal
          vehicle={editingVehicle}
          onSubmit={handleEditCar}
          onClose={() => setEditingVehicle(null)}
        />
      )}
    </div>
  );
}

export default function MyCars() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#FFC300',
          borderRadius: 8,
        },
      }}
    >
      <App>
        <MyCarsContent />
      </App>
    </ConfigProvider>
  );
}
