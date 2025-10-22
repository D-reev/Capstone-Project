import React, { useState } from 'react';
import { X, Info } from 'lucide-react';
import './Modal.css';

export default function AddCarModal({ onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    plateNumber: '',
    engine: '',
    transmission: '',
    mileage: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const fieldInfo = {
    make: "Enter the vehicle manufacturer (e.g., Toyota, Honda, Ford)",
    model: "Enter the specific model name (e.g., Camry, Civic, Mustang)",
    year: "Enter the year the vehicle was manufactured",
    plateNumber: "Enter your vehicle's license plate number",
    engine: "Enter engine specifications (e.g., 2.0L Turbo, V6 3.5L)",
    transmission: "Select the type of transmission your vehicle has",
    mileage: "Enter the current odometer reading in kilometers"
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Vehicle</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group">
                <label>
                  MAKE
                </label>
                <input
                  type="text"
                  value={formData.make}
                  onChange={(e) => handleChange('make', e.target.value)}
                  placeholder="e.g., Toyota"
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  MODEL
                </label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => handleChange('model', e.target.value)}
                  placeholder="e.g., Camry"
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  YEAR 
                </label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => handleChange('year', e.target.value)}
                  placeholder="e.g., 2020"
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  PLATE NUMBER 
                </label>
                <input
                  type="text"
                  value={formData.plateNumber}
                  onChange={(e) => handleChange('plateNumber', e.target.value)}
                  placeholder="e.g., ABC-1234"
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  ENGINE 
                </label>
                <input
                  type="text"
                  value={formData.engine}
                  onChange={(e) => handleChange('engine', e.target.value)}
                  placeholder="e.g., 2.0L Turbo"
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  TRANSMISSION 
                </label>
                <select
                  value={formData.transmission}
                  onChange={(e) => handleChange('transmission', e.target.value)}
                  required
                >
                  <option value="">Select Transmission</option>
                  <option value="Manual">Manual</option>
                  <option value="Automatic">Automatic</option>
                  <option value="CVT">CVT</option>
                </select>
              </div>

              <div className="form-group full-width">
                <label>
                  CURRENT MILEAGE (KM) 
                </label>
                <input
                  type="number"
                  value={formData.mileage}
                  onChange={(e) => handleChange('mileage', e.target.value)}
                  placeholder="e.g., 50000"
                  required
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              Add Vehicle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}