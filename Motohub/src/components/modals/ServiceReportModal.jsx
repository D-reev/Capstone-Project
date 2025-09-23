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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Service Report</h2>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-part-form">
          <div className="form-grid">
            <div className="form-group full-width">
              <h3>Service Details</h3>
              <p>Customer: {customer?.displayName || 'Unknown'}</p>
              <p>Vehicle: {car ? `${car.year} ${car.make} ${car.model}` : 'N/A'}</p>
              <p>Plate: {car?.plateNumber || 'N/A'}</p>
            </div>

            <div className="form-group full-width">
              <label htmlFor="diagnosis">Diagnosis*</label>
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
              <label htmlFor="workPerformed">Work Performed*</label>
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

            <div className="form-group">
              <label htmlFor="laborHours">Labor Hours*</label>
              <input
                type="number"
                id="laborHours"
                name="laborHours"
                min="0"
                step="0.5"
                value={reportData.laborHours}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="laborCost">Labor Cost per Hour (₱)*</label>
              <input
                type="number"
                id="laborCost"
                name="laborCost"
                min="0"
                value={reportData.laborCost}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group full-width">
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
