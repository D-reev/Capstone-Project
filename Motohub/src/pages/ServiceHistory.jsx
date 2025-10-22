import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { Wrench, Calendar, Clock, Menu, Car } from 'lucide-react';
import UserSidebar from '../components/UserSidebar';
import ProfileModal from '../components/modals/ProfileModal';
import logo from '../assets/images/logo.jpeg';
import '../css/ServiceHistory.css';

function ServiceHistory() {
  const [serviceHistory, setServiceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const { user } = useAuth();
  const db = getFirestore();

  useEffect(() => {
    if (user) {
      fetchServiceHistory();
    }
  }, [user]);

  const fetchServiceHistory = async () => {
    try {
      setLoading(true);
      
      // Get all user's cars
      const carsRef = collection(db, `users/${user.uid}/cars`);
      const carsSnapshot = await getDocs(carsRef);
      
      // Fetch service history for each car
      const allHistory = [];
      
      for (const carDoc of carsSnapshot.docs) {
        const serviceHistoryRef = collection(db, `users/${user.uid}/cars/${carDoc.id}/serviceHistory`);
        const historySnapshot = await getDocs(serviceHistoryRef);
        
        historySnapshot.docs.forEach(doc => {
          allHistory.push({
            id: doc.id,
            carId: carDoc.id,
            ...doc.data()
          });
        });
      }
      
      // Sort by timestamp, newest first
      allHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      setServiceHistory(allHistory);
    } catch (error) {
      console.error('Error fetching service history:', error);
    } finally {
      setLoading(false);
    }
  };

  const ServiceHistoryCard = ({ service }) => (
    <div className="service-history-card">
      <div className="service-card-header">
        <div className="service-type">
          <Wrench size={20} />
          <h4>{service.vehicle || 'Service'}</h4>
        </div>
        <span className={`service-status ${service.status.toLowerCase()}`}>
          {service.status}
        </span>
      </div>
      
      <div className="service-details">
        <div className="detail-item">
          <Calendar size={16} />
          <span>Date: {new Date(service.timestamp).toLocaleDateString()}</span>
        </div>
        <div className="detail-item">
          <Wrench size={16} />
          <span>Mechanic: {service.mechanicName || 'Unknown'}</span>
        </div>
        <div className="detail-item">
          <Car size={16} />
          <span>Plate: {service.plateNumber}</span>
        </div>
      </div>

      <div className="service-description">
        <h5>Diagnosis:</h5>
        <p>{service.diagnosis}</p>
        
        <h5>Work Performed:</h5>
        <p>{service.workPerformed}</p>

        {service.partsUsed && (
          <>
            <h5>Parts Used:</h5>
            <p>{service.partsUsed}</p>
          </>
        )}

        {service.recommendations && (
          <>
            <h5>Recommendations:</h5>
            <p>{service.recommendations}</p>
          </>
        )}

        {service.nextServiceDate && (
          <div className="next-service">
            <Clock size={16} />
            <span>Next Service: {new Date(service.nextServiceDate).toLocaleDateString()}</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="service-history-container">
      <UserSidebar 
        sidebarOpen={sidebarOpen}
        user={user}
        className={`customer-sidebar${sidebarOpen ? '' : ' collapsed'}${sidebarMobileOpen ? ' open' : ''}`}
        onCloseMobile={() => setSidebarMobileOpen(false)}
      />

      <div className="service-history-content">
        <div className="customer-top-bar">
          <div className="top-bar-left">
            <button
              onClick={() => {
                if (window.innerWidth <= 768) {
                  setSidebarMobileOpen(!sidebarMobileOpen);
                } else {
                  setSidebarOpen(!sidebarOpen);
                }
              }}
              className="menu-toggle-btn"
            >
              <Menu size={20} />
            </button>
            <h1 className="top-bar-title">Service History</h1>
          </div>
          <div className="top-bar-logo-container">
            <div className="top-bar-logo" style={{ backgroundImage: `url(${logo})` }} />
          </div>
        </div>

        <div className="service-history-main">
          <div className="service-history-header">
            <h2>Your Service History</h2>
            <p>View all your past vehicle service records</p>
          </div>

          {loading ? (
            <div className="loading-state">
              <Wrench size={48} />
              <p>Loading service history...</p>
            </div>
          ) : (
            <div className="service-history-grid">
              {serviceHistory.length > 0 ? (
                serviceHistory.map(service => (
                  <ServiceHistoryCard 
                    key={service.id} 
                    service={service}
                  />
                ))
              ) : (
                <div className="no-history">
                  <Wrench size={48} />
                  <p>No service history found</p>
                  <p className="no-history-subtitle">
                    Service reports will appear here once your mechanic completes work on your vehicles.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} user={user} />
    </div>
  );
}

export default ServiceHistory;