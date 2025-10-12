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
    <div className="modal-overlay" onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.45)' }}>
      <div className="modal-content advanced-modal" style={{ borderRadius: 18, boxShadow: '0 8px 32px rgba(35,43,62,0.16)', padding: 0, maxWidth: 540, overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: '#fff' }} onClick={e => e.stopPropagation()}>
        <div style={{ background: 'var(--header-bg)', padding: '1.5rem 2rem 1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1.5rem', color: 'var(--signature-yellow, #FFC300)', letterSpacing: '0.04em' }}>Request Parts for Vehicle</h2>
          <button className="close-button" onClick={onClose} style={{ background: 'rgba(0,0,0,0.04)', borderRadius: 8, border: 'none', padding: 6, cursor: 'pointer' }}>
            <X size={20} color="var(--signature-yellow, #FFC300)" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-part-form" style={{ padding: '2rem', background: '#fff', overflowY: 'auto', flex: 1 }}>
          <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem 2rem', marginBottom: 0 }}>
            <div className="form-group full-width" style={{ gridColumn: '1/3', marginBottom: 0 }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 8, color: '#232b3e' }}>Vehicle Details</h3>
              <div className="details-grid" style={{ display: 'flex', gap: 24 }}>
                <p style={{ margin: 0, color: '#232b3e' }}>Owner: {customer?.displayName || "Unknown"}</p>
                <p style={{ margin: 0, color: '#232b3e' }}>Vehicle: {car ? `${car.year} ${car.make} ${car.model}` : "N/A"}</p>
                <p style={{ margin: 0, color: '#232b3e' }}>Plate: {car?.plateNumber || "N/A"}</p>
              </div>
            </div>

            <div className="form-group full-width" style={{ gridColumn: '1/3' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 8, color: '#232b3e' }}>Select Parts</h3>
              {availableParts.length > 0 ? (
                <div className="parts-selection" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {availableParts.map(part => (
                    <div key={part.id} className="part-selection-item" style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#f9fafb', borderRadius: 8, padding: '0.75rem 1rem', boxShadow: '0 2px 8px rgba(35,43,62,0.06)' }}>
                      <div className="part-info" style={{ flex: 1 }}>
                        <span className="part-name" style={{ fontWeight: 600, color: '#232b3e' }}>{part.name}</span>
                        <div className="part-details" style={{ fontSize: '0.95rem', color: '#888', marginTop: 2 }}>
                          <span className="part-stock">Available: {part.quantity}</span>
                          <span className="part-price" style={{ marginLeft: 12 }}>₱{part.price?.toLocaleString()}</span>
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
                        style={{ width: 70, padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '1rem', background: '#fff' }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-parts-message" style={{ color: '#888', fontStyle: 'italic', padding: '1rem' }}>No parts available</div>
              )}
            </div>

            <div className="form-group full-width" style={{ gridColumn: '1/3' }}>
              <label htmlFor="notes" style={{ fontWeight: 600, marginBottom: 6, display: 'block', color: '#232b3e' }}>Notes</label>
              <textarea
                id="notes"
                value={requestData.notes}
                onChange={(e) => setRequestData(prev => ({ ...prev, notes: e.target.value }))}
                rows="3"
                placeholder="Add any additional notes..."
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '1rem', background: '#f9fafb', marginTop: 2 }}
              />
            </div>

          </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginTop: 24 }}>
              <label className="checkbox-label" style={{ fontWeight: 600, color: '#232b3e', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', height: '48px' }}>
                <input
                  type="checkbox"
                  checked={requestData.urgent}
                  onChange={(e) => setRequestData(prev => ({ ...prev, urgent: e.target.checked }))}
                  style={{ accentColor: 'var(--signature-yellow, #FFC300)', marginRight: 8, marginTop: 0 }}
                />
                <span style={{ lineHeight: '1', display: 'inline-block' }}>Mark as Urgent</span>
              </label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" className="cancel-btn" onClick={onClose} style={{ background: '#f3f4f6', color: '#232b3e', borderRadius: 8, border: 'none', padding: '0.75rem 2rem', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={requestData.parts.length === 0 || isSubmitting}
                  style={{ background: 'var(--header-bg)', color: '#fff', borderRadius: 8, border: 'none', padding: '0.75rem 2rem', fontWeight: 600, fontSize: '1rem', cursor: requestData.parts.length === 0 || isSubmitting ? 'not-allowed' : 'pointer' }}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </div>
        </form>
      </div>
    </div>
  );
}
