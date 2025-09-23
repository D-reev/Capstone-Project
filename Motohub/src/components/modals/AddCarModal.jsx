import React from 'react';
import './Modal.css';

export default function AddCarModal({ onSubmit, onClose, newCarData, setNewCarData }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Add New Vehicle</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Make</label>
            <input
              type="text"
              value={newCarData.make}
              onChange={(e) => setNewCarData(prev => ({
                ...prev,
                make: e.target.value
              }))}
              required
            />
          </div>
          <div className="form-group">
            <label>Model</label>
            <input
              value={newCarData.model}
              onChange={(e) => setNewCarData(prev => ({
                ...prev,
                model: e.target.value
              }))}
              required
            />
          </div>
          <div className="form-group">
            <label>Year</label>
            <input
              type="number"
              value={newCarData.year}
              onChange={(e) => setNewCarData(prev => ({
                ...prev,
                year: e.target.value
              }))}
              required
            />
          </div>
          <div className="form-group">
            <label>Plate Number</label>
            <input
              type="text"
              value={newCarData.plateNumber}
              onChange={(e) => setNewCarData(prev => ({
                ...prev,
                plateNumber: e.target.value
              }))}
              required
            />
          </div>
          <div className="form-group">
            <label>Engine</label>
            <input
              type="text"
              value={newCarData.engine}
              onChange={(e) => setNewCarData(prev => ({
                ...prev,
                engine: e.target.value
              }))}
              required
            />
          </div>
          <div className="form-group">
            <label>Transmission</label>
            <select
              value={newCarData.transmission}
              onChange={(e) => setNewCarData(prev => ({
                ...prev,
                transmission: e.target.value
              }))}
              required
            >
              <option value="">Select Transmission</option>
              <option value="Manual">Manual</option>
              <option value="Automatic">Automatic</option>
              <option value="CVT">CVT</option>
            </select>
          </div>
          <div className="form-group">
            <label>Current Mileage</label>
            <input
              type="number"
              value={newCarData.mileage}
              onChange={(e) => setNewCarData(prev => ({
                ...prev,
                mileage: e.target.value
              }))}
              required
            />
          </div>
          <div className="modal-actions">
            <button type="submit" className="save-btn">Add Vehicle</button>
            <button 
              type="button" 
              className="cancel-btn"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}