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
  <div className="modal-overlay" onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0, zIndex: 9999 }}>
  <div className="modal-content advanced-modal" style={{ borderRadius: 18, boxShadow: '0 8px 32px rgba(35,43,62,0.16)', padding: 0, maxWidth: 520, overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <div style={{ background: 'var(--header-bg)', padding: '1.5rem 2rem 1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1.5rem', color: 'var(--signature-yellow, #FFC300)', letterSpacing: '0.04em' }}>Add New Part</h2>
          <button className="close-button" onClick={onClose} style={{ background: 'rgba(0,0,0,0.04)', borderRadius: 8, border: 'none', padding: 6, cursor: 'pointer' }}>
            <X size={20} color="var(--signature-yellow, #FFC300)" />
          </button>
        </div>

  <form onSubmit={handleSubmit} className="add-part-form" style={{ padding: '2rem', background: '#fff', overflowY: 'auto', flex: 1 }}>
          <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem 2rem', marginBottom: 0 }}>
            <div className="form-group">
              <label htmlFor="name" style={{ fontWeight: 600, marginBottom: 6, display: 'block', color: '#232b3e' }}>Part Name*</label>
              <input
                type="text"
                id="name"
                name="name"
                value={partData.name}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '1rem', background: '#f9fafb', marginTop: 2 }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="category" style={{ fontWeight: 600, marginBottom: 6, display: 'block', color: '#232b3e' }}>Category*</label>
              <select
                id="category"
                name="category"
                value={partData.category}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '1rem', background: '#f9fafb', marginTop: 2 }}
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
              <label htmlFor="quantity" style={{ fontWeight: 600, marginBottom: 6, display: 'block', color: '#232b3e' }}>Initial Stock*</label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                min="0"
                value={partData.quantity}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '1rem', background: '#f9fafb', marginTop: 2 }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="price" style={{ fontWeight: 600, marginBottom: 6, display: 'block', color: '#232b3e' }}>Price (₱)*</label>
              <input
                type="number"
                id="price"
                name="price"
                min="0"
                step="0.01"
                value={partData.price}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '1rem', background: '#f9fafb', marginTop: 2 }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="minStock" style={{ fontWeight: 600, marginBottom: 6, display: 'block', color: '#232b3e' }}>Minimum Stock*</label>
              <input
                type="number"
                id="minStock"
                name="minStock"
                min="0"
                value={partData.minStock}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '1rem', background: '#f9fafb', marginTop: 2 }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="status" style={{ fontWeight: 600, marginBottom: 6, display: 'block', color: '#232b3e' }}>Status*</label>
              <select
                id="status"
                name="status"
                value={partData.status}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '1rem', background: '#f9fafb', marginTop: 2 }}
              >
                <option value="available">Available</option>
                <option value="low">Low Stock</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>

            <div className="form-group full-width" style={{ gridColumn: '1/3' }}>
              <label style={{ fontWeight: 600, marginBottom: 6, display: 'block', color: '#232b3e' }}>Part Image</label>
              <div className="image-upload-container" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {imagePreview && (
                  <div className="image-preview" style={{ width: 64, height: 64, borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(35,43,62,0.10)' }}>
                    <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div className="image-input-controls" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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
                    style={{ background: 'var(--header-bg)', color: '#fff', borderRadius: 8, border: 'none', padding: '0.5rem 1.25rem', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
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
                      style={{ width: 180, padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '1rem', background: '#f9fafb' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="form-group full-width" style={{ gridColumn: '1/3' }}>
              <label htmlFor="description" style={{ fontWeight: 600, marginBottom: 6, display: 'block', color: '#232b3e' }}>Description</label>
              <textarea
                id="description"
                name="description"
                value={partData.description}
                onChange={handleChange}
                rows="3"
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '1rem', background: '#f9fafb', marginTop: 2 }}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: 24 }}>
            <button type="button" className="cancel-btn" onClick={onClose} style={{ background: '#f3f4f6', color: '#232b3e', borderRadius: 8, border: 'none', padding: '0.75rem 2rem', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" style={{ background: 'var(--header-bg)', color: '#fff', borderRadius: 8, border: 'none', padding: '0.75rem 2rem', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}>
              Add Part
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}