import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import './Modal.css';

export default function CarServiceReportModal({ car, customer, onSubmit, onClose }) {
  const [reportData, setReportData] = useState({
    diagnosis: '',
    workPerformed: '',
    recommendations: '',
    laborHours: 0,
    laborCost: 0,
    partsUsed: [],
    totalCost: 0,
    status: 'completed'
  });
  const [availableParts, setAvailableParts] = useState([]);
  const [serviceHistory, setServiceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const db = getFirestore();

  useEffect(() => {
    const fetchData = async () => {
      try {
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

        // Fetch car's service history
        const historyRef = collection(db, `users/${customer.id}/cars/${car.id}/serviceHistory`);
        const historySnapshot = await getDocs(historyRef);
        const historyData = historySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setServiceHistory(historyData);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load necessary data');
        setLoading(false);
      }
    };

    fetchData();
  }, [db, car.id, customer.id]);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...reportData,
      carId: car.id,
      customerId: customer.id,
      timestamp: new Date().toISOString(),
      vehicle: `${car.year} ${car.make} ${car.model}`,
      plateNumber: car.plateNumber
    });
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

            {/* Rest of the form fields */}
            {/* ... existing diagnosis, work performed, etc. fields ... */}

            <div className="form-group">
              <label>Total Cost</label>
              <div className="total-cost">₱{reportData.totalCost.toLocaleString()}</div>
            </div>
          </div>

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