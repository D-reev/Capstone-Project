import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getFirestore, collection, getDocs, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { Wrench, Calendar, Clock, Car } from 'lucide-react';
import { message } from 'antd';
import UserSidebar from '../components/UserSidebar';
import NavigationBar from '../components/NavigationBar';
import ProfileModal from '../components/modals/ProfileModal';
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

  const handleRatingSubmit = async (service, rating) => {
    try {
      if (!service.mechanicId) {
        message.error('Mechanic information not available');
        return;
      }

      // Update the service record with the rating
      const serviceRef = doc(db, `users/${user.uid}/cars/${service.carId}/serviceHistory/${service.id}`);
      await updateDoc(serviceRef, {
        rating: rating,
        ratedAt: new Date().toISOString()
      });

      // Update mechanic's rating profile
      const mechanicRatingRef = doc(db, `mechanicRatings/${service.mechanicId}`);
      const mechanicRatingDoc = await getDoc(mechanicRatingRef);

      if (mechanicRatingDoc.exists()) {
        const currentData = mechanicRatingDoc.data();
        const totalRatings = currentData.totalRatings || 0;
        const totalScore = currentData.totalScore || 0;
        
        await updateDoc(mechanicRatingRef, {
          totalRatings: totalRatings + 1,
          totalScore: totalScore + rating,
          averageRating: (totalScore + rating) / (totalRatings + 1),
          lastUpdated: new Date().toISOString()
        });
      } else {
        await setDoc(mechanicRatingRef, {
          mechanicId: service.mechanicId,
          mechanicName: service.mechanicName,
          totalRatings: 1,
          totalScore: rating,
          averageRating: rating,
          lastUpdated: new Date().toISOString()
        });
      }

      message.success('Thank you for your rating!');
      
      // Refresh the service history
      fetchServiceHistory();
    } catch (error) {
      console.error('Error submitting rating:', error);
      message.error('Failed to submit rating. Please try again.');
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

      {/* Rating Section - Only show for completed services */}
      {service.status.toLowerCase() === 'completed' && (
        <div className="service-rating-section">
          <h5>Rate this service:</h5>
          {service.rating ? (
            <div className="rating-submitted">
              <p>You rated this service: </p>
              <div className="radio">
                {[1, 2, 3, 4, 5].map((star) => (
                  <label key={star} className={star <= service.rating ? 'rated' : ''}>
                    <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 576 512">
                      <path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"></path>
                    </svg>
                  </label>
                ))}
              </div>
              <p className="rating-thank-you">Thank you for your feedback!</p>
            </div>
          ) : (
            <div className="radio">
              {[1, 2, 3, 4, 5].map((star) => (
                <React.Fragment key={star}>
                  <input 
                    value={star} 
                    name={`rating-${service.id}`} 
                    type="radio" 
                    id={`rating-${service.id}-${star}`}
                    onChange={() => handleRatingSubmit(service, star)}
                  />
                  <label title={`${star} star${star > 1 ? 's' : ''}`} htmlFor={`rating-${service.id}-${star}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 576 512">
                      <path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"></path>
                    </svg>
                  </label>
                </React.Fragment>
              ))}
            </div>
          )}
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
        onCloseMobile={() => setSidebarMobileOpen(false)}
      />

      <div className={`service-history-content ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        <NavigationBar
          title="Service History"
          onToggleSidebar={() => {
            if (window.innerWidth <= 768) {
              setSidebarMobileOpen(!sidebarMobileOpen);
            } else {
              setSidebarOpen(!sidebarOpen);
            }
          }}
          userRole="customer"
          userName={user?.displayName || 'User'}
          userEmail={user?.email || ''}
        />

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