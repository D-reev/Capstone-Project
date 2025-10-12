import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import './Modal.css';

export default function ServiceReportModal({ car, customer, onSubmit, onClose }) {
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

  const calculateTotalCost = () => {
    const partsCost = reportData.partsUsed.reduce(
      (total, part) => total + (part.price * part.quantity), 
      0
    );
    const laborCost = reportData.laborHours * reportData.laborCost;
    return partsCost + laborCost;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setReportData(prev => ({
      ...prev,
      [name]: name === 'laborHours' || name === 'laborCost' ? Number(value) : value,
      totalCost: calculateTotalCost()
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!car || !customer) return;
    onSubmit({
      ...reportData,
      carId: car.id,
      customerId: customer.id,
      vehicle: `${car.year} ${car.make} ${car.model}`,
      plateNumber: car.plateNumber,
      timestamp: new Date().toISOString()
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.45)' }}>
      <div className="modal-content advanced-modal" style={{ borderRadius: 18, boxShadow: '0 8px 32px rgba(35,43,62,0.16)', padding: 0, maxWidth: 540, overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: '#fff' }} onClick={e => e.stopPropagation()}>
        <div style={{ background: 'var(--header-bg)', padding: '1.5rem 2rem 1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1.5rem', color: 'var(--signature-yellow, #FFC300)', letterSpacing: '0.04em' }}>Service Report</h2>
          <button className="close-button" onClick={onClose} style={{ background: 'rgba(0,0,0,0.04)', borderRadius: 8, border: 'none', padding: 6, cursor: 'pointer' }}>
            <X size={20} color="var(--signature-yellow, #FFC300)" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-part-form" style={{ padding: '2rem', background: '#fff', overflowY: 'auto', flex: 1 }}>
          <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem 2rem', marginBottom: 0 }}>
            <div className="form-group full-width" style={{ gridColumn: '1/3', marginBottom: 0 }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 8, color: '#232b3e' }}>Service Details</h3>
              <p style={{ margin: 0, color: '#232b3e' }}>Customer: {customer?.displayName || 'Unknown'}</p>
              <p style={{ margin: 0, color: '#232b3e' }}>Vehicle: {car ? `${car.year} ${car.make} ${car.model}` : 'N/A'}</p>
              <p style={{ margin: 0, color: '#232b3e' }}>Plate: {car?.plateNumber || 'N/A'}</p>
            </div>

            <div className="form-group full-width" style={{ gridColumn: '1/3' }}>
              <label htmlFor="diagnosis" style={{ fontWeight: 600, marginBottom: 6, display: 'block', color: '#232b3e' }}>Diagnosis*</label>
              <textarea
                id="diagnosis"
                name="diagnosis"
                value={reportData.diagnosis}
                onChange={handleChange}
                required
                rows="3"
                placeholder="Enter detailed diagnosis..."
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '1rem', background: '#f9fafb', marginTop: 2 }}
              />
            </div>

            <div className="form-group full-width" style={{ gridColumn: '1/3' }}>
              <label htmlFor="workPerformed" style={{ fontWeight: 600, marginBottom: 6, display: 'block', color: '#232b3e' }}>Work Performed*</label>
              <textarea
                id="workPerformed"
                name="workPerformed"
                value={reportData.workPerformed}
                onChange={handleChange}
                required
                rows="3"
                placeholder="Describe the work performed..."
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '1rem', background: '#f9fafb', marginTop: 2 }}
              />
            </div>

            <div className="form-group full-width" style={{ gridColumn: '1/3' }}>
              <label htmlFor="recommendations" style={{ fontWeight: 600, marginBottom: 6, display: 'block', color: '#232b3e' }}>Recommendations</label>
              <textarea
                id="recommendations"
                name="recommendations"
                value={reportData.recommendations}
                onChange={handleChange}
                rows="2"
                placeholder="Any recommendations for future maintenance..."
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '1rem', background: '#f9fafb', marginTop: 2 }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="laborHours" style={{ fontWeight: 600, marginBottom: 6, display: 'block', color: '#232b3e' }}>Labor Hours*</label>
              <input
                type="number"
                id="laborHours"
                name="laborHours"
                min="0"
                step="0.5"
                value={reportData.laborHours}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '1rem', background: '#f9fafb', marginTop: 2 }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="laborCost" style={{ fontWeight: 600, marginBottom: 6, display: 'block', color: '#232b3e' }}>Labor Cost per Hour (₱)*</label>
              <input
                type="number"
                id="laborCost"
                name="laborCost"
                min="0"
                value={reportData.laborCost}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '1rem', background: '#f9fafb', marginTop: 2 }}
              />
            </div>

            <div className="form-group full-width" style={{ gridColumn: '1/3' }}>
              <label style={{ fontWeight: 600, marginBottom: 6, display: 'block', color: '#232b3e' }}>Total Cost</label>
              <div className="total-cost" style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--signature-yellow, #FFC300)', marginTop: 2 }}>₱{reportData.totalCost.toLocaleString()}</div>
            </div>
          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: 24 }}>
            <button type="button" className="cancel-btn" onClick={onClose} style={{ background: '#f3f4f6', color: '#232b3e', borderRadius: 8, border: 'none', padding: '0.75rem 2rem', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" style={{ background: 'var(--header-bg)', color: '#fff', borderRadius: 8, border: 'none', padding: '0.75rem 2rem', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}>
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
