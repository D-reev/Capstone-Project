import React, { useState } from 'react';
import { X } from 'lucide-react';
import './Modal.css';

export default function PartsRequestModal({ parts, service, onSubmit, onClose }) {
  const [requestData, setRequestData] = useState({
    parts: [],
    urgent: false,
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(requestData);
  };

  const handlePartSelection = (partId, quantity) => {
    setRequestData(prev => {
      const existingPart = prev.parts.find(p => p.partId === partId);
      if (existingPart) {
        return {
          ...prev,
          parts: prev.parts.map(p => 
            p.partId === partId 
              ? { ...p, quantity: Number(quantity) }
              : p
          )
        };
      }
      return {
        ...prev,
        parts: [...prev.parts, { partId, quantity: Number(quantity) }]
      };
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Request Parts</h2>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-part-form">
          <div className="form-grid">
            <div className="form-group full-width">
              <h3>Service Details</h3>
              <p>Customer: {service.customerName}</p>
              <p>Vehicle: {service.vehicle}</p>
              <p>Service Type: {service.type}</p>
            </div>

            <div className="form-group full-width">
              <label>Select Parts</label>
              <div className="parts-selection">
                {parts.map(part => (
                  <div key={part.id} className="part-selection-item">
                    <div className="part-info">
                      <span>{part.name}</span>
                      <span className="part-stock">Stock: {part.quantity}</span>
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

            <div className="form-group full-width">
              <label>Notes</label>
              <textarea
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
              disabled={requestData.parts.length === 0}
            >
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}