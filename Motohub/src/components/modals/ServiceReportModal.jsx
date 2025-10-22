import React, { useState } from 'react';
import { X } from 'lucide-react';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import './Modal.css';

export default function ServiceReportModal({ car, customer, onSubmit, onClose }) {
  const { user } = useAuth();
  const [reportData, setReportData] = useState({
    diagnosis: '',
    workPerformed: '',
    recommendations: '',
    partsUsed: '',
    nextServiceDate: '',
    status: 'completed'
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const db = getFirestore();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setReportData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (!user?.uid) {
        throw new Error('You must be logged in as a mechanic');
      }

      if (!car?.id || !customer?.id) {
        throw new Error('Missing car or customer information');
      }

      const reportPayload = {
        ...reportData,
        carId: car.id,
        customerId: customer.id,
        mechanicId: user.uid,
        mechanicName: user.displayName || 'Unknown Mechanic',
        vehicle: `${car.year} ${car.make} ${car.model}`,
        plateNumber: car.plateNumber,
        timestamp: new Date().toISOString()
      };

      // Save to nested path: users/{customerId}/cars/{carId}/serviceHistory
      const serviceHistoryRef = collection(
        db,
        `users/${customer.id}/cars/${car.id}/serviceHistory`
      );

      await addDoc(serviceHistoryRef, reportPayload);
      
      if (onSubmit) {
        onSubmit(reportPayload);
      }
      
      onClose();
    } catch (err) {
      console.error('Error submitting report:', err);
      setError(err.message || 'Failed to submit service report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Service Report</h2>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-part-form">
          {error && (
            <div className="error-message" style={{
              padding: '1rem',
              marginBottom: '1rem',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              borderRadius: '0.5rem'
            }}>
              {error}
            </div>
          )}

          <div className="form-grid">
            <div className="form-group full-width">
              <h3>Service Details</h3>
              <p>Customer: {customer?.displayName || 'Unknown'}</p>
              <p>Vehicle: {car ? `${car.year} ${car.make} ${car.model}` : 'N/A'}</p>
              <p>Plate: {car?.plateNumber || 'N/A'}</p>
            </div>

            <div className="form-group full-width">
              <label htmlFor="diagnosis">Diagnosis *</label>
              <textarea
                id="diagnosis"
                name="diagnosis"
                value={reportData.diagnosis}
                onChange={handleChange}
                required
                rows="3"
                placeholder="Enter detailed diagnosis..."
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="workPerformed">Work Performed *</label>
              <textarea
                id="workPerformed"
                name="workPerformed"
                value={reportData.workPerformed}
                onChange={handleChange}
                required
                rows="3"
                placeholder="Describe the work performed..."
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="partsUsed">Parts Used</label>
              <textarea
                id="partsUsed"
                name="partsUsed"
                value={reportData.partsUsed}
                onChange={handleChange}
                rows="2"
                placeholder="List parts used (e.g., Oil filter, Brake pads)..."
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="recommendations">Recommendations</label>
              <textarea
                id="recommendations"
                name="recommendations"
                value={reportData.recommendations}
                onChange={handleChange}
                rows="2"
                placeholder="Any recommendations for future maintenance..."
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="nextServiceDate">Next Service Date</label>
              <input
                type="date"
                id="nextServiceDate"
                name="nextServiceDate"
                value={reportData.nextServiceDate}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="cancel-btn" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
