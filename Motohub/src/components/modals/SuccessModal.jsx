import React from 'react';
import { X } from 'lucide-react';
import './Modal.css';

export default function SuccessModal({ message = 'Success', onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content success-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Success</h3>
          <button className="close-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <p>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="submit-btn" onClick={onClose}>OK</button>
        </div>
      </div>
    </div>
  );
}