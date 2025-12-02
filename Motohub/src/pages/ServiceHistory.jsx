import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import { getFirestore, collection, getDocs, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { Wrench, Calendar, Clock, Car, ChevronDown, ChevronUp, Star } from 'lucide-react';
import { message, Rate, Input, Button } from 'antd';
import UserSidebar from '../components/UserSidebar';
import SuperAdminSidebar from '../components/SuperAdminSidebar';
import NavigationBar from '../components/NavigationBar';
import ProfileModal from '../components/modals/ProfileModal';
import '../css/ServiceHistory.css';

const { TextArea } = Input;

function ServiceHistory() {
  const [serviceHistory, setServiceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState([]);
  const [ratingService, setRatingService] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedMobileCards, setExpandedMobileCards] = useState([]);
  const itemsPerPage = 10;
  const { sidebarOpen } = useSidebar();
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

  const handleRatingSubmit = async (service) => {
    if (rating === 0) {
      message.warning('Please select a rating before submitting');
      return;
    }

    try {
      setSubmitting(true);

      if (!service.mechanicId) {
        message.error('Mechanic information not available');
        return;
      }

      const ratingData = {
        rating: rating,
        comment: comment,
        ratedAt: new Date().toISOString()
      };

      // Update the nested service record with the rating
      const serviceRef = doc(db, `users/${user.uid}/cars/${service.carId}/serviceHistory/${service.id}`);
      await updateDoc(serviceRef, ratingData);

      // Also update the top-level serviceReports collection if it exists
      try {
        const topLevelServiceRef = doc(db, `serviceReports/${service.id}`);
        const topLevelDoc = await getDoc(topLevelServiceRef);
        if (topLevelDoc.exists()) {
          await updateDoc(topLevelServiceRef, ratingData);
        }
      } catch (error) {
        console.error('Error updating top-level service report:', error);
        // Continue even if top-level update fails
      }

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
      setRating(0);
      setComment('');
      setRatingService(null);
      
      // Refresh the service history
      fetchServiceHistory();
    } catch (error) {
      console.error('Error submitting rating:', error);
      message.error('Failed to submit rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleRow = (serviceId) => {
    setExpandedRows(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const isRowExpanded = (serviceId) => expandedRows.includes(serviceId);

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
      {user?.role === 'superadmin' ? (
        <SuperAdminSidebar />
      ) : (
        <UserSidebar 
          user={user}
          className={`customer-sidebar${sidebarOpen ? '' : ' collapsed'}${sidebarMobileOpen ? ' open' : ''}`}
          onCloseMobile={() => setSidebarMobileOpen(false)}
        />
      )}

      <div className={`service-history-content ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        <NavigationBar
          title="Service History"
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
            <div className="service-history-table-container">
              {serviceHistory.length > 0 ? (
                <>
                  {/* Desktop Table View */}
                  <table className="service-history-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Vehicle</th>
                        <th>Mechanic</th>
                        <th>Status</th>
                        <th>Rating</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {serviceHistory
                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                        .map(service => (
                        <React.Fragment key={service.id}>
                          <tr 
                            className={`table-row ${isRowExpanded(service.id) ? 'expanded' : ''}`}
                            onClick={() => toggleRow(service.id)}
                          >
                            <td>
                              <div className="table-cell-content">
                                <Calendar size={16} />
                                {new Date(service.timestamp).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </div>
                            </td>
                            <td>
                              <div className="table-cell-content">
                                <Car size={16} />
                                <div>
                                  <div className="vehicle-name">{service.vehicle || 'Vehicle'}</div>
                                  <div className="plate-number">{service.plateNumber}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="table-cell-content">
                                <Wrench size={16} />
                                {service.mechanicName || 'Unknown'}
                              </div>
                            </td>
                            <td>
                              <span className={`status-badge ${service.status.toLowerCase()}`}>
                                {service.status}
                              </span>
                            </td>
                            <td>
                              {service.rating ? (
                                <div className="rating-display">
                                  <Rate value={service.rating} disabled style={{ fontSize: '16px' }} />
                                </div>
                              ) : (
                                service.status.toLowerCase() === 'completed' && (
                                  <button 
                                    className="rate-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setRatingService(service);
                                      setRating(0);
                                      setComment('');
                                    }}
                                  >
                                    Rate Service
                                  </button>
                                )
                              )}
                            </td>
                            <td>
                              <button className="expand-btn">
                                {isRowExpanded(service.id) ? (
                                  <ChevronUp size={20} />
                                ) : (
                                  <ChevronDown size={20} />
                                )}
                              </button>
                            </td>
                          </tr>
                          {isRowExpanded(service.id) && (
                            <tr className="expanded-row">
                              <td colSpan="6">
                                <div className="expanded-content">
                                  <div className="expanded-grid">
                                    <div className="expanded-section">
                                      <h5>Diagnosis</h5>
                                      <p>{service.diagnosis}</p>
                                    </div>

                                    <div className="expanded-section">
                                      <h5>Work Performed</h5>
                                      <p>{service.workPerformed}</p>
                                    </div>

                                    {service.partsUsed && (
                                      <div className="expanded-section">
                                        <h5>Parts Used</h5>
                                        <p>{service.partsUsed}</p>
                                      </div>
                                    )}

                                    {service.recommendations && (
                                      <div className="expanded-section">
                                        <h5>Recommendations</h5>
                                        <p>{service.recommendations}</p>
                                      </div>
                                    )}
                                  </div>

                                  {service.nextServiceDate && (
                                    <div className="next-service-info">
                                      <Clock size={18} />
                                      <span>
                                        Next Service: {new Date(service.nextServiceDate).toLocaleDateString('en-US', { 
                                          year: 'numeric', 
                                          month: 'long', 
                                          day: 'numeric' 
                                        })}
                                      </span>
                                    </div>
                                  )}

                                  {service.rating && service.comment && (
                                    <div className="service-feedback">
                                      <h5>Your Feedback</h5>
                                      <p>{service.comment}</p>
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

                  {/* Mobile List View */}
                  <div className="service-history-mobile-list">
                    {serviceHistory
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map(service => {
                      const isExpanded = isRowExpanded(service.id);
                      
                      return (
                        <div key={service.id} className="service-mobile-card">
                          <div 
                            className="service-mobile-header"
                            onClick={() => toggleRow(service.id)}
                          >
                            <div className="service-mobile-info">
                              <div className="service-mobile-vehicle">{service.vehicle || 'Vehicle'}</div>
                              <div className="service-mobile-plate">{service.plateNumber}</div>
                            </div>
                            <ChevronDown 
                              size={20} 
                              className={`service-mobile-toggle ${isExpanded ? 'expanded' : ''}`}
                            />
                          </div>

                          <div className="service-mobile-meta">
                            <span className={`service-mobile-badge status ${service.status.toLowerCase()}`}>
                              {service.status}
                            </span>
                            <span className="service-mobile-badge date">
                              <Calendar size={14} />
                              {new Date(service.timestamp).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          </div>

                          {isExpanded && (
                            <div className="service-mobile-expanded">
                              <div className="service-mobile-detail">
                                <span className="service-mobile-label">Mechanic</span>
                                <span className="service-mobile-value">{service.mechanicName || 'Unknown'}</span>
                              </div>

                              <div className="service-mobile-section">
                                <h5>Diagnosis</h5>
                                <p>{service.diagnosis}</p>
                              </div>

                              <div className="service-mobile-section">
                                <h5>Work Performed</h5>
                                <p>{service.workPerformed}</p>
                              </div>

                              {service.partsUsed && (
                                <div className="service-mobile-section">
                                  <h5>Parts Used</h5>
                                  <p>{service.partsUsed}</p>
                                </div>
                              )}

                              {service.recommendations && (
                                <div className="service-mobile-section">
                                  <h5>Recommendations</h5>
                                  <p>{service.recommendations}</p>
                                </div>
                              )}

                              {service.nextServiceDate && (
                                <div className="service-mobile-next">
                                  <Clock size={16} />
                                  <span>
                                    Next Service: {new Date(service.nextServiceDate).toLocaleDateString('en-US', { 
                                      year: 'numeric', 
                                      month: 'long', 
                                      day: 'numeric' 
                                    })}
                                  </span>
                                </div>
                              )}

                              {service.rating && service.comment && (
                                <div className="service-mobile-feedback">
                                  <h5>Your Feedback</h5>
                                  <p>{service.comment}</p>
                                </div>
                              )}

                              {/* Rating Section for Mobile */}
                              {service.status.toLowerCase() === 'completed' && (
                                <div className="service-mobile-rating">
                                  {service.rating ? (
                                    <div className="rating-display-mobile">
                                      <span>Your Rating:</span>
                                      <Rate value={service.rating} disabled style={{ fontSize: '18px' }} />
                                    </div>
                                  ) : (
                                    <button 
                                      className="rate-btn-mobile"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setRatingService(service);
                                        setRating(0);
                                        setComment('');
                                      }}
                                    >
                                      <Star size={18} />
                                      Rate This Service
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination Controls */}
                  {serviceHistory.length > itemsPerPage && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px 24px',
                      borderTop: '1px solid #e2e8f0',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}>
                      <span style={{ 
                        color: '#6B7280',
                        fontSize: '14px'
                      }}>
                        {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, serviceHistory.length)} of {serviceHistory.length} entries
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
                          max={Math.ceil(serviceHistory.length / itemsPerPage)}
                          value={currentPage}
                          onChange={(e) => {
                            const page = parseInt(e.target.value);
                            if (page >= 1 && page <= Math.ceil(serviceHistory.length / itemsPerPage)) {
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
                        <span style={{ color: '#FFC300', fontSize: '14px', fontWeight: '600' }}>of {Math.ceil(serviceHistory.length / itemsPerPage)}</span>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(serviceHistory.length / itemsPerPage)))}
                          disabled={currentPage >= Math.ceil(serviceHistory.length / itemsPerPage)}
                          style={{
                            width: '32px',
                            height: '32px',
                            background: currentPage >= Math.ceil(serviceHistory.length / itemsPerPage) ? '#f3f4f6' : 'linear-gradient(135deg, #FFC300 0%, #FFD54F 100%)',
                            color: currentPage >= Math.ceil(serviceHistory.length / itemsPerPage) ? '#9ca3af' : '#000',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: currentPage >= Math.ceil(serviceHistory.length / itemsPerPage) ? 'not-allowed' : 'pointer',
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
                          onClick={() => setCurrentPage(Math.ceil(serviceHistory.length / itemsPerPage))}
                          disabled={currentPage >= Math.ceil(serviceHistory.length / itemsPerPage)}
                          style={{
                            width: '32px',
                            height: '32px',
                            background: currentPage >= Math.ceil(serviceHistory.length / itemsPerPage) ? '#f3f4f6' : 'linear-gradient(135deg, #FFC300 0%, #FFD54F 100%)',
                            color: currentPage >= Math.ceil(serviceHistory.length / itemsPerPage) ? '#9ca3af' : '#000',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: currentPage >= Math.ceil(serviceHistory.length / itemsPerPage) ? 'not-allowed' : 'pointer',
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
                </>
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

      {/* Rating Modal */}
      {ratingService && (
        <div className="rating-modal-overlay" onClick={() => setRatingService(null)}>
          <div className="rating-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="rating-modal-header">
              <h3>Rate Your Service</h3>
              <button 
                className="close-modal-btn"
                onClick={() => setRatingService(null)}
              >
                ×
              </button>
            </div>

            <div className="service-info-card">
              <div className="info-row">
                <span className="info-label">Vehicle:</span>
                <span className="info-value">{ratingService.vehicle}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Plate Number:</span>
                <span className="info-value">{ratingService.plateNumber}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Mechanic:</span>
                <span className="info-value">{ratingService.mechanicName}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Date:</span>
                <span className="info-value">
                  {new Date(ratingService.timestamp).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
            </div>

            <div className="rating-section">
              <h4>How would you rate this service?</h4>
              <Rate 
                value={rating} 
                onChange={setRating}
                style={{ fontSize: '2.5rem' }}
              />
              {rating > 0 && (
                <p className="rating-label">
                  {rating === 1 && 'Poor'}
                  {rating === 2 && 'Fair'}
                  {rating === 3 && 'Good'}
                  {rating === 4 && 'Very Good'}
                  {rating === 5 && 'Excellent'}
                </p>
              )}
            </div>

            <div className="comment-section">
              <h4>Share your experience (optional)</h4>
              <TextArea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell us about your service experience..."
                rows={4}
                maxLength={500}
                showCount
              />
            </div>

            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setRatingService(null)}
              >
                Cancel
              </button>
              <Button
                type="primary"
                size="large"
                loading={submitting}
                disabled={rating === 0}
                onClick={() => handleRatingSubmit(ratingService)}
                style={{
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                  border: 'none',
                  fontWeight: 700,
                  height: '45px',
                  borderRadius: '8px'
                }}
              >
                Submit Rating
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ServiceHistory;