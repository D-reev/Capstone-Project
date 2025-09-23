import React from 'react';
import { X, CheckCircle, XCircle } from 'lucide-react';
import './Modal.css';

export default function RequestDetailsModal({
  request,
  open,
  onClose,
  onApprove,
  onReject,
  processing = false
}) {
  if (!open || !request) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content request-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Request Details</h3>
          <button className="close-button" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          <p><strong>Mechanic:</strong> {request.mechanicName || request.requesterName}</p>
          <p><strong>Customer:</strong> {request.customerName || request.customer?.name}</p>
          <p>
            <strong>Vehicle:</strong> {request.car?.make} {request.car?.model}
            {request.car?.plateNumber ? ` (${request.car.plateNumber})` : ''}
          </p>
          <p><strong>Priority:</strong> {request.priority || 'normal'}</p>
          <p><strong>Notes:</strong> {request.notes || '—'}</p>

          <h4>Parts</h4>
          <ul className="parts-list">
            {Array.isArray(request.parts) && request.parts.length > 0 ? (
              request.parts.map((p, i) => (
                <li key={i}>
                  {p.name} — Qty: {p.quantity} — Price: {p.price ?? '—'}
                </li>
              ))
            ) : (
              <li>No parts listed</li>
            )}
          </ul>

          <p><strong>Requested:</strong> {request.createdAt ? (request.createdAt.toDate ? request.createdAt.toDate().toLocaleString() : new Date(request.createdAt).toLocaleString()) : '—'}</p>
        </div>

        <div className="modal-footer">
          {request.status === 'pending' ? (
            <>
              <button className="approve-btn" onClick={() => onApprove(request.id)} disabled={processing}>
                <CheckCircle size={16} /> Approve
              </button>
              <button className="reject-btn" onClick={() => onReject(request.id)} disabled={processing}>
                <XCircle size={16} /> Reject
              </button>
              <button className="cancel-btn" onClick={onClose} disabled={processing}>Cancel</button>
            </>
          ) : (
            <button className="close-btn" onClick={onClose}>Close</button>
          )}
        </div>
      </div>
    </div>
  );
}