import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { Wrench, Calendar, Clock } from 'lucide-react';
import UserSidebar from '../components/UserSidebar';
import TopBar from '../components/TopBar';
import ProfileModal from '../components/modals/ProfileModal';
import '../css/ServiceHistory.css';

function ServiceHistory() {
  const [serviceHistory, setServiceHistory] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
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
          <Tool size={20} />
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
      <UserSidebar user={user} />

      <div className="service-history-content">
        <TopBar
          title="Service History"
          onToggle={() => {}}
          notificationsCount={0}
          onProfileClick={() => setProfileOpen(true)}
        />

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
              <Wrench size={40} />
              <p>No service history found</p>
            </div>
          )}
        </div>
      </div>

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} user={user} />
    </div>
  );
}

export default ServiceHistory;