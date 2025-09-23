import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getFirestore, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { createPartsRequest } from '../../utils/auth';
import './Modal.css';

export default function CarPartsRequestModal({ car, customer, onSubmit, onClose }) {
  // Add auth context
  const { user } = useAuth();
  
  const [requestData, setRequestData] = useState({
    parts: [],
    urgent: false,
    notes: ''
  });
  const [availableParts, setAvailableParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const db = getFirestore();

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const partsRef = collection(db, 'inventory');
        const q = query(
          partsRef,
          where('quantity', '>', 0),
          orderBy('quantity', 'desc')
        );

        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          setError('No parts available in inventory');
          setLoading(false);
          return;
        }

        const partsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          selected: false,
          requestQuantity: 0
        }));

        setAvailableParts(partsData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching inventory:', err);
        setError('Failed to load inventory: ' + err.message);
        setLoading(false);
      }
    };

    fetchInventory();
  }, []);

  const handlePartSelection = (partId, quantity) => {
    if (!quantity || quantity <= 0) {
      setRequestData(prev => ({
        ...prev,
        parts: prev.parts.filter(p => p.partId !== partId)
      }));
      return;
    }

    const selectedPart = availableParts.find(p => p.id === partId);
    if (!selectedPart) return;

    setRequestData(prev => {
      const existingPartIndex = prev.parts.findIndex(p => p.partId === partId);
      const updatedParts = [...prev.parts];

      if (existingPartIndex >= 0) {
        if (quantity <= selectedPart.quantity) {
          updatedParts[existingPartIndex] = {
            ...updatedParts[existingPartIndex],
            quantity: Number(quantity)
          };
        }
      } else {
        if (quantity <= selectedPart.quantity) {
          updatedParts.push({
            partId,
            name: selectedPart.name,
            price: selectedPart.price,
            quantity: Number(quantity)
          });
        }
      }

      return { ...prev, parts: updatedParts };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    if (requestData.parts.length === 0) {
      setError('Please add at least one part to the request');
      setIsSubmitting(false);
      return;
    }

    try {
      // Make sure all required data is present
      if (!car || !customer || !user) {
        throw new Error('Missing required information');
      }

      const response = await createPartsRequest({
        car: {
          id: car.id,
          make: car.make,
          model: car.model,
          year: car.year,
          plateNumber: car.plateNumber
        },
        customer: {
          id: customer.id,
          displayName: customer.displayName
        },
        parts: requestData.parts,
        urgent: requestData.urgent,
        notes: requestData.notes
      }, user.uid);

      await onSubmit(response);
      onClose();
    } catch (error) {
      console.error('Error submitting request:', error);
      setError(error.message || 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="modal-loading">Loading...</div>;
  if (error) return <div className="modal-error">{error}</div>;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Request Parts for Vehicle</h2>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-part-form">
          <div className="form-grid">
            <div className="form-group full-width">
              <h3>Vehicle Details</h3>
              <div className="details-grid">
                <p>Owner: {customer?.displayName || "Unknown"}</p>
                <p>Vehicle: {car ? `${car.year} ${car.make} ${car.model}` : "N/A"}</p>
                <p>Plate: {car?.plateNumber || "N/A"}</p>
              </div>
            </div>

            <div className="form-group full-width">
              <h3>Select Parts</h3>
              {availableParts.length > 0 ? (
                <div className="parts-selection">
                  {availableParts.map(part => (
                    <div key={part.id} className="part-selection-item">
                      <div className="part-info">
                        <span className="part-name">{part.name}</span>
                        <div className="part-details">
                          <span className="part-stock">Available: {part.quantity}</span>
                          <span className="part-price">₱{part.price?.toLocaleString()}</span>
                        </div>
                      </div>
                      <input
                        type="number"
                        min="0"
                        max={part.quantity}
                        value={requestData.parts.find(p => p.partId === part.id)?.quantity || ''}
                        onChange={(e) => handlePartSelection(part.id, e.target.value)}
                        placeholder="Qty"
                        className="quantity-input"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-parts-message">No parts available</div>
              )}
            </div>

            <div className="form-group full-width">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                value={requestData.notes}
                onChange={(e) => setRequestData(prev => ({ ...prev, notes: e.target.value }))}
                rows="3"
                placeholder="Add any additional notes..."
              />
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={requestData.urgent}
                  onChange={(e) => setRequestData(prev => ({ ...prev, urgent: e.target.checked }))}
                />
                Mark as Urgent
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={requestData.parts.length === 0 || isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
