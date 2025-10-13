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
      <div className="modal-content advanced-modal" onClick={e => e.stopPropagation()} style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.18)', borderRadius: 20, padding: 0, overflow: 'hidden', maxWidth: 520 }}>
        <div style={{ background: 'var(--header-bg)', padding: '1.5rem 2rem 1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1.5rem', color: '#FBBF24', letterSpacing: '0.04em' }}>Request Parts</h2>
          <button className="close-button" onClick={onClose} style={{ background: 'rgba(0,0,0,0.04)', borderRadius: 8, border: 'none', padding: 6, cursor: 'pointer' }}>
            <X size={20} color="#FBBF24" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-part-form" style={{ padding: '2rem' }}>
          <div className="form-grid" style={{ gap: 24 }}>
            <div className="form-group full-width" style={{ marginBottom: 18 }}>
              <h3 style={{ fontWeight: 600, fontSize: '1.1rem', color: '#232b3e', marginBottom: 8 }}>Service Details</h3>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: '0.98rem', color: '#374151' }}>
                <span><strong>Customer:</strong> {service.customerName}</span>
                <span><strong>Vehicle:</strong> {service.vehicle}</span>
                <span><strong>Type:</strong> {service.type}</span>
              </div>
            </div>

            <div className="form-group full-width" style={{ marginBottom: 18 }}>
              <label style={{ fontWeight: 600, color: '#232b3e', marginBottom: 8, display: 'block' }}>Select Parts</label>
              <div className="parts-selection" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {parts.map(part => (
                  <div key={part.id} className="part-selection-item" style={{ background: '#F9FAFB', borderRadius: 10, padding: '0.75rem 1rem', boxShadow: '0 2px 8px rgba(251,191,36,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', border: '1px solid #F3F4F6' }}>
                    <div className="part-info" style={{ fontWeight: 600, color: '#232b3e', marginBottom: 4 }}>{part.name}</div>
                    <span className="part-stock" style={{ fontSize: '0.85rem', color: '#9CA3AF', marginBottom: 8 }}>Stock: {part.quantity}</span>
                    <input
                      type="number"
                      min="0"
                      max={part.quantity}
                      onChange={(e) => handlePartSelection(part.id, e.target.value)}
                      placeholder="Qty"
                      style={{ width: 70, padding: '0.5rem', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: '1rem', marginBottom: 2 }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group full-width" style={{ marginBottom: 18 }}>
              <label style={{ fontWeight: 600, color: '#232b3e', marginBottom: 8, display: 'block' }}>Notes</label>
              <textarea
                value={requestData.notes}
                onChange={(e) => setRequestData(prev => ({ ...prev, notes: e.target.value }))}
                rows="3"
                placeholder="Add any additional notes..."
                style={{ width: '100%', borderRadius: 8, border: '1px solid #E5E7EB', padding: '0.75rem', fontSize: '1rem', background: '#F9FAFB', color: '#232b3e' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 18 }}>
              <label className="checkbox-label" style={{ fontWeight: 500, color: '#232b3e', display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={requestData.urgent}
                  onChange={(e) => setRequestData(prev => ({ ...prev, urgent: e.target.checked }))}
                  style={{ accentColor: '#FBBF24', width: 18, height: 18 }}
                />
                Mark as Urgent
              </label>
            </div>
          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 18 }}>
            <button type="button" className="cancel-btn" onClick={onClose} style={{ background: '#F3F4F6', color: '#232b3e', borderRadius: 8, border: 'none', padding: '0.75rem 1.5rem', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={requestData.parts.length === 0}
              style={{ background: 'linear-gradient(90deg, #FBBF24 0%, #F59E0B 100%)', color: '#232b3e', borderRadius: 8, border: 'none', padding: '0.75rem 1.5rem', fontWeight: 700, fontSize: '1rem', cursor: requestData.parts.length === 0 ? 'not-allowed' : 'pointer', opacity: requestData.parts.length === 0 ? 0.7 : 1, boxShadow: '0 2px 8px rgba(251,191,36,0.10)', transition: 'all 0.2s' }}
            >
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}