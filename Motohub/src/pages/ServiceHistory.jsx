import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { Wrench, Calendar, Clock, Menu } from 'lucide-react';
import UserSidebar from '../components/UserSidebar';
import TopBar from '../components/TopBar';
import ProfileModal from '../components/modals/ProfileModal';
import logo from '../assets/images/logo.jpeg';
import '../css/ServiceHistory.css';

function ServiceHistory() {
  const [serviceHistory, setServiceHistory] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
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
      const servicesRef = collection(db, 'serviceHistory');
      const q = query(servicesRef, where('customerId', '==', user.uid));
      const snapshot = await getDocs(q);
      const history = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setServiceHistory(history);
    } catch (error) {
      console.error('Error fetching service history:', error);
    }
  };

  const ServiceHistoryCard = ({ service }) => (
    <div className="service-history-card">
      <div className="service-history-header">
        <div className="service-type">
          <Wrench size={20} />
          <h4>{service.serviceType}</h4>
        </div>
        <span className={`service-status ${service.status.toLowerCase()}`}>
          {service.status}
        </span>
      </div>
      
      <div className="service-details">
        <div className="detail-item">
          <Calendar size={16} />
          <span>Date: {new Date(service.date).toLocaleDateString()}</span>
        </div>
        <div className="detail-item">
          <Clock size={16} />
          <span>Duration: {service.duration}</span>
        </div>
        <div className="detail-item">
          <Wrench size={16} />
          <span>Mechanic: {service.mechanicName}</span>
        </div>
      </div>

      <div className="service-description">
        <p>{service.description}</p>
      </div>

      <div className="service-cost">
        <span>Total Cost:</span>
        <strong>₱{service.cost.toLocaleString()}</strong>
      </div>

      {service.partsUsed && service.partsUsed.length > 0 && (
        <div className="parts-used">
          <h5>Parts Used:</h5>
          <ul>
            {service.partsUsed.map((part, index) => (
              <li key={index}>
                {part.name} x{part.quantity} - ₱{part.cost.toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <div className="service-history-container">
      <UserSidebar 
        sidebarOpen={sidebarOpen}
        user={user}
        className={`customer-sidebar${sidebarOpen ? '' : ' collapsed'}${sidebarMobileOpen ? ' open' : ''}`}
        style={{ background: 'var(--header-bg)' }}
        onCloseMobile={() => setSidebarMobileOpen(false)}
      />

      <div className="service-history-content">
        {/* Top Bar */}
        <div className="customer-top-bar" style={{position: 'sticky', top: 0, zIndex: 100}}>
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
              Service History
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

        {/* Main Content */}
        <div className="service-history-main">
          <div className="service-history-header">
            <h2>Your Service History</h2>
            <p>View all your past vehicle service records</p>
          </div>

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
              </div>
            )}
          </div>
        </div>
      </div>

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} user={user} />
    </div>
  );
}

export default ServiceHistory;