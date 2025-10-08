import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';
import './Modal.css';

export default function AddPartModal({ open = false, onClose = () => {}, onAdd = () => {} }) {
  if (!open) return null;
  const [partData, setPartData] = useState({
    name: '',
    category: '',
    quantity: 0,
    price: 0,
    minStock: 0,
    status: 'available',
    description: '',
    image: ''
  });
  const [imagePreview, setImagePreview] = useState('');
  const fileInputRef = React.useRef();

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(partData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPartData(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'price' || name === 'minStock' 
        ? Number(value) 
        : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setPartData(prev => ({
          ...prev,
          image: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlChange = (e) => {
    const url = e.target.value;
    setPartData(prev => ({
      ...prev,
      image: url
    }));
    setImagePreview(url);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1.5rem', lineHeight: 1 }}>Add New Part</h2>
          <button className="close-button" onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-part-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name">Part Name*</label>
              <input
                type="text"
                id="name"
                name="name"
                value={partData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">Category*</label>
              <select
                id="category"
                name="category"
                value={partData.category}
                onChange={handleChange}
                required
              >
                <option value="">Select Category</option>
                <option value="Engine">Engine</option>
                <option value="Transmission">Transmission</option>
                <option value="Brake">Brake</option>
                <option value="Suspension">Suspension</option>
                <option value="Electrical">Electrical</option>
                <option value="Body">Body</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="quantity">Initial Stock*</label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                min="0"
                value={partData.quantity}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="price">Price (₱)*</label>
              <input
                type="number"
                id="price"
                name="price"
                min="0"
                step="0.01"
                value={partData.price}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="minStock">Minimum Stock*</label>
              <input
                type="number"
                id="minStock"
                name="minStock"
                min="0"
                value={partData.minStock}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="status">Status*</label>
              <select
                id="status"
                name="status"
                value={partData.status}
                onChange={handleChange}
                required
              >
                <option value="available">Available</option>
                <option value="low">Low Stock</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>

            <div className="form-group full-width">
              <label>Part Image</label>
              <div className="image-upload-container">
                {imagePreview && (
                  <div className="image-preview">
                    <img src={imagePreview} alt="Preview" />
                  </div>
                )}
                <div className="image-input-controls">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    className="upload-btn"
                    onClick={() => fileInputRef.current.click()}
                  >
                    <Upload size={16} />
                    Browse Files
                  </button>
                  <div className="url-input">
                    <input
                      type="url"
                      placeholder="Or enter image URL"
                      value={partData.image}
                      onChange={handleUrlChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="form-group full-width">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={partData.description}
                onChange={handleChange}
                rows="3"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              Add Part
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}