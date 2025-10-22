import React, { useState } from 'react';
import { X, Info } from 'lucide-react';
import './Modal.css';

export default function AddCarModal({ onSubmit, onClose }) {
  const [showTooltip, setShowTooltip] = useState(null);
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

  const fieldInfo = {
    make: "Enter the vehicle manufacturer (e.g., Toyota, Honda, Ford)",
    model: "Enter the specific model name (e.g., Camry, Civic, Mustang)",
    year: "Enter the year the vehicle was manufactured (e.g., 2020)",
    plateNumber: "Enter the vehicle's license plate number",
    engine: "Enter engine specifications (e.g., 2.0L Turbo, V6 3.5L)",
    transmission: "Select the type of transmission your vehicle has",
    mileage: "Enter the current odometer reading in kilometers"
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Vehicle</h2>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-part-form">
          <div className="form-grid">
            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label>Make *</label>
                <div 
                  style={{ position: 'relative', display: 'inline-flex' }}
                  onMouseEnter={() => setShowTooltip('make')}
                  onMouseLeave={() => setShowTooltip(null)}
                >
                  <Info size={14} style={{ color: '#a0aec0', cursor: 'help' }} />
                  {showTooltip === 'make' && (
                    <div style={{
                      position: 'absolute',
                      left: '20px',
                      top: '-5px',
                      background: '#2d3748',
                      color: 'white',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      width: '200px',
                      zIndex: 1000,
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      whiteSpace: 'normal'
                    }}>
                      {fieldInfo.make}
                    </div>
                  )}
                </div>
              </div>
              <input
                type="text"
                value={formData.make}
                onChange={(e) => handleChange('make', e.target.value)}
                placeholder="e.g., Toyota"
                required
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label>Model *</label>
                <div 
                  style={{ position: 'relative', display: 'inline-flex' }}
                  onMouseEnter={() => setShowTooltip('model')}
                  onMouseLeave={() => setShowTooltip(null)}
                >
                  <Info size={14} style={{ color: '#a0aec0', cursor: 'help' }} />
                  {showTooltip === 'model' && (
                    <div style={{
                      position: 'absolute',
                      left: '20px',
                      top: '-5px',
                      background: '#2d3748',
                      color: 'white',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      width: '200px',
                      zIndex: 1000,
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      whiteSpace: 'normal'
                    }}>
                      {fieldInfo.model}
                    </div>
                  )}
                </div>
              </div>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => handleChange('model', e.target.value)}
                placeholder="e.g., Camry"
                required
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label>Year *</label>
                <div 
                  style={{ position: 'relative', display: 'inline-flex' }}
                  onMouseEnter={() => setShowTooltip('year')}
                  onMouseLeave={() => setShowTooltip(null)}
                >
                  <Info size={14} style={{ color: '#a0aec0', cursor: 'help' }} />
                  {showTooltip === 'year' && (
                    <div style={{
                      position: 'absolute',
                      left: '20px',
                      top: '-5px',
                      background: '#2d3748',
                      color: 'white',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      width: '200px',
                      zIndex: 1000,
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      whiteSpace: 'normal'
                    }}>
                      {fieldInfo.year}
                    </div>
                  )}
                </div>
              </div>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => handleChange('year', e.target.value)}
                placeholder="e.g., 2020"
                min="1900"
                max={new Date().getFullYear() + 1}
                required
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label>Plate Number *</label>
                <div 
                  style={{ position: 'relative', display: 'inline-flex' }}
                  onMouseEnter={() => setShowTooltip('plateNumber')}
                  onMouseLeave={() => setShowTooltip(null)}
                >
                  <Info size={14} style={{ color: '#a0aec0', cursor: 'help' }} />
                  {showTooltip === 'plateNumber' && (
                    <div style={{
                      position: 'absolute',
                      left: '20px',
                      top: '-5px',
                      background: '#2d3748',
                      color: 'white',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      width: '200px',
                      zIndex: 1000,
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      whiteSpace: 'normal'
                    }}>
                      {fieldInfo.plateNumber}
                    </div>
                  )}
                </div>
              </div>
              <input
                type="text"
                value={formData.plateNumber}
                onChange={(e) => handleChange('plateNumber', e.target.value)}
                placeholder="e.g., ABC-1234"
                required
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label>Engine *</label>
                <div 
                  style={{ position: 'relative', display: 'inline-flex' }}
                  onMouseEnter={() => setShowTooltip('engine')}
                  onMouseLeave={() => setShowTooltip(null)}
                >
                  <Info size={14} style={{ color: '#a0aec0', cursor: 'help' }} />
                  {showTooltip === 'engine' && (
                    <div style={{
                      position: 'absolute',
                      left: '20px',
                      top: '-5px',
                      background: '#2d3748',
                      color: 'white',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      width: '200px',
                      zIndex: 1000,
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      whiteSpace: 'normal'
                    }}>
                      {fieldInfo.engine}
                    </div>
                  )}
                </div>
              </div>
              <input
                type="text"
                value={formData.engine}
                onChange={(e) => handleChange('engine', e.target.value)}
                placeholder="e.g., 2.0L Turbo"
                required
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label>Transmission *</label>
                <div 
                  style={{ position: 'relative', display: 'inline-flex' }}
                  onMouseEnter={() => setShowTooltip('transmission')}
                  onMouseLeave={() => setShowTooltip(null)}
                >
                  <Info size={14} style={{ color: '#a0aec0', cursor: 'help' }} />
                  {showTooltip === 'transmission' && (
                    <div style={{
                      position: 'absolute',
                      left: '20px',
                      top: '-5px',
                      background: '#2d3748',
                      color: 'white',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      width: '200px',
                      zIndex: 1000,
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      whiteSpace: 'normal'
                    }}>
                      {fieldInfo.transmission}
                    </div>
                  )}
                </div>
              </div>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label>Current Mileage (km) *</label>
                <div 
                  style={{ position: 'relative', display: 'inline-flex' }}
                  onMouseEnter={() => setShowTooltip('mileage')}
                  onMouseLeave={() => setShowTooltip(null)}
                >
                  <Info size={14} style={{ color: '#a0aec0', cursor: 'help' }} />
                  {showTooltip === 'mileage' && (
                    <div style={{
                      position: 'absolute',
                      left: '20px',
                      top: '-5px',
                      background: '#2d3748',
                      color: 'white',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      width: '200px',
                      zIndex: 1000,
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      whiteSpace: 'normal'
                    }}>
                      {fieldInfo.mileage}
                    </div>
                  )}
                </div>
              </div>
              <input
                type="number"
                value={formData.mileage}
                onChange={(e) => handleChange('mileage', e.target.value)}
                placeholder="e.g., 50000"
                min="0"
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button 
              type="button" 
              className="cancel-btn"
              onClick={onClose}
            >
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