import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getFirestore, collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import './Modal.css';

export default function CarServiceReportModal({ car, customer, onSubmit, onClose }) {
  const { user } = useAuth();
  const [reportData, setReportData] = useState({
    diagnosis: '',
    workPerformed: '',
    recommendations: '',
    laborHours: 0,
    laborCost: 0,
    partsUsed: [],
    totalCost: 0,
    status: 'completed',
    timestamp: new Date().toISOString(), // Add timestamp
    mechanicId: user?.uid || '' // Add mechanicId
  });
  const [availableParts, setAvailableParts] = useState([]);
  const [serviceHistory, setServiceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const db = getFirestore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if user is authorized
        if (!user) {
          throw new Error('User not authenticated');
        }

        // Fetch available parts from inventory
        const partsRef = collection(db, 'inventory');
        const partsSnapshot = await getDocs(query(partsRef, 
          where('status', '==', 'available')
        ));
        const partsData = partsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAvailableParts(partsData);

        // Fetch car's service history with proper path
        const historyPath = `users/${customer.id}/cars/${car.id}/serviceHistory`;
        const historyRef = collection(db, historyPath);
        const historySnapshot = await getDocs(historyRef);
        const historyData = historySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setServiceHistory(historyData);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to load necessary data');
        setLoading(false);
      }
    };

    if (user && car && customer) {
      fetchData();
    }
  }, [db, car, customer, user]);

  const handlePartSelection = (partId, quantity) => {
    const selectedPart = availableParts.find(p => p.id === partId);
    if (!selectedPart) return;

    setReportData(prev => {
      const existingPart = prev.partsUsed.find(p => p.partId === partId);
      if (existingPart) {
        return {
          ...prev,
          partsUsed: prev.partsUsed.map(p =>
            p.partId === partId
              ? { ...p, quantity: Number(quantity) }
              : p
          ),
          totalCost: calculateTotalCost(prev.partsUsed, prev.laborHours, prev.laborCost)
        };
      }
      return {
        ...prev,
        partsUsed: [...prev.partsUsed, {
          partId,
          name: selectedPart.name,
          price: selectedPart.price,
          quantity: Number(quantity)
        }],
        totalCost: calculateTotalCost([...prev.partsUsed, {
          partId,
          price: selectedPart.price,
          quantity: Number(quantity)
        }], prev.laborHours, prev.laborCost)
      };
    });
  };

  const calculateTotalCost = (parts, hours, rate) => {
    const partsCost = parts.reduce((sum, part) => sum + (part.price * part.quantity), 0);
    const laborCost = hours * rate;
    return partsCost + laborCost;
  };

  const handleServiceReport = async (reportPayload) => {
    try {
      // Correct nested path
      const serviceHistoryRef = collection(
        db,
        `users/${reportPayload.customerId}/cars/${reportPayload.carId}/serviceHistory`
      );

      await addDoc(serviceHistoryRef, reportPayload);
      console.log("✅ Service report saved successfully!");
    } catch (err) {
      console.error("❌ Error saving service report:", err);
      throw err; // Propagate error for error handling in handleSubmit
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user?.uid) {
      setError('You must be logged in as a mechanic to submit a report');
      return;
    }

    const requiredFields = [
      'diagnosis',
      'workPerformed',
      'partsUsed',
      'laborCost',
      'totalCost',
      'status'
    ];

    const missingFields = requiredFields.filter(field => !reportData[field]);
    
    if (missingFields.length > 0) {
      setError(`Missing required fields: ${missingFields.join(', ')}`);
      return;
    }

    console.log("Submitting report data:", reportData, "as mechanic:", user.uid);

    try {
      const reportPayload = {
        diagnosis: reportData.diagnosis,
        workPerformed: reportData.workPerformed,
        partsUsed: reportData.partsUsed,
        laborCost: reportData.laborCost,
        totalCost: reportData.totalCost,
        status: reportData.status,
        timestamp: new Date().toISOString(),
        mechanicId: user.uid,
        customerId: customer.id,
        carId: car.id,
        vehicle: `${car.year} ${car.make} ${car.model}`,
        plateNumber: car.plateNumber
      };

      await handleServiceReport(reportPayload);
      onSubmit(reportPayload); // Keep onSubmit for any parent component handling
      onClose();
    } catch (error) {
      console.error('Error submitting report:', error);
      setError(error.message || 'Failed to submit service report');
    }
  };

  if (loading) return <div className="modal-loading">Loading...</div>;
  if (error) return <div className="modal-error">{error}</div>;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Car Service Report</h2>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-part-form">
          <div className="form-grid">
            {/* Vehicle Details Section */}
            <div className="form-group full-width">
              <h3>Vehicle Details</h3>
              <div className="details-grid">
                <p>Owner: {customer.displayName}</p>
                <p>Vehicle: {car.year} {car.make} {car.model}</p>
                <p>Plate: {car.plateNumber}</p>
                <p>Mileage: {car.mileage} km</p>
              </div>
            </div>

            {/* Service History Summary */}
            <div className="form-group full-width">
              <h3>Service History</h3>
              <div className="service-history">
                {serviceHistory.length > 0 ? (
                  <ul>
                    {serviceHistory.slice(-3).map(service => (
                      <li key={service.id}>
                        <span>{new Date(service.timestamp).toLocaleDateString()}</span>
                        <span>{service.workPerformed}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No previous service records found</p>
                )}
              </div>
            </div>

            {/* Parts Selection */}
            <div className="form-group full-width">
              <h3>Parts Used</h3>
              <div className="parts-selection">
                {availableParts.map(part => (
                  <div key={part.id} className="part-selection-item">
                    <div className="part-info">
                      <span>{part.name}</span>
                      <span className="part-price">₱{part.price}</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      max={part.quantity}
                      onChange={(e) => handlePartSelection(part.id, e.target.value)}
                      placeholder="Qty"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Add missing form fields for required data */}
            <div className="form-group full-width">
              <label htmlFor="diagnosis">Diagnosis *</label>
              <textarea
                id="diagnosis"
                value={reportData.diagnosis}
                onChange={(e) => setReportData(prev => ({
                  ...prev,
                  diagnosis: e.target.value
                }))}
                required
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="workPerformed">Work Performed *</label>
              <textarea
                id="workPerformed"
                value={reportData.workPerformed}
                onChange={(e) => setReportData(prev => ({
                  ...prev,
                  workPerformed: e.target.value
                }))}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="laborCost">Labor Cost *</label>
              <input
                type="number"
                id="laborCost"
                value={reportData.laborCost}
                onChange={(e) => setReportData(prev => ({
                  ...prev,
                  laborCost: Number(e.target.value),
                  totalCost: calculateTotalCost(prev.partsUsed, prev.laborHours, Number(e.target.value))
                }))}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="status">Status *</label>
              <select
                id="status"
                value={reportData.status}
                onChange={(e) => setReportData(prev => ({
                  ...prev,
                  status: e.target.value
                }))}
                required
              >
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
              </select>
            </div>

            <div className="form-group">
              <label>Total Cost</label>
              <div className="total-cost">₱{reportData.totalCost.toLocaleString()}</div>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-footer">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}