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
      <div className="modal-content request-modal advanced-modal" onClick={e => e.stopPropagation()} style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.18)', borderRadius: 20, padding: 0, overflow: 'hidden', maxWidth: 520 }}>
        <div style={{ background: 'var(--header-bg)', padding: '1.5rem 2rem 1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTopLeftRadius: 20, borderTopRightRadius: 20, boxShadow: '0 2px 8px rgba(35,43,62,0.08)' }}>
          <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1.35rem', color: '#FBBF24', letterSpacing: '0.04em', textShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>Request Details</h3>
          <button className="close-button" onClick={onClose} style={{ background: 'rgba(0,0,0,0.04)', borderRadius: 8, border: 'none', padding: 6, cursor: 'pointer' }}>
            <X size={20} color="#FBBF24" />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '2rem', fontSize: '1rem', color: '#232b3e', background: '#fff', borderBottomLeftRadius: 20, borderBottomRightRadius: 20, boxShadow: '0 2px 16px rgba(35,43,62,0.10)' }}>
          <div style={{ marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 2rem' }}>
            <div style={{ fontWeight: 600, color: '#232b3e' }}>Mechanic:</div>
            <div style={{ fontWeight: 400 }}>{request.mechanicName || request.requesterName}</div>
            <div style={{ fontWeight: 600, color: '#232b3e' }}>Customer:</div>
            <div style={{ fontWeight: 400 }}>{request.customerName || request.customer?.name}</div>
            <div style={{ fontWeight: 600, color: '#232b3e' }}>Vehicle:</div>
            <div style={{ fontWeight: 400 }}>{request.car?.make} {request.car?.model}{request.car?.plateNumber ? ` (${request.car.plateNumber})` : ''}</div>
            <div style={{ fontWeight: 600, color: '#232b3e' }}>Priority:</div>
            <div style={{ fontWeight: 400 }}>{request.priority || 'normal'}</div>
            <div style={{ fontWeight: 600, color: '#232b3e' }}>Notes:</div>
            <div style={{ fontWeight: 400 }}>{request.notes || '—'}</div>
          </div>
          <div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--header-bg)', fontSize: '1.1rem', letterSpacing: '0.02em' }}>Parts</div>
          <ul className="parts-list" style={{ margin: '10px 0 1.5rem 0', padding: 0, listStyle: 'none' }}>
            {Array.isArray(request.parts) && request.parts.length > 0 ? (
              request.parts.map((p, i) => (
                <li key={i} style={{ background: '#F9FAFB', borderRadius: 8, marginBottom: 6, padding: '0.75rem 1rem', boxShadow: '0 1px 4px rgba(35,43,62,0.06)', borderLeft: '4px solid var(--header-bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 500 }}>{p.name}</span>
                  <span style={{ color: '#374151', fontSize: '0.98rem' }}>Qty: {p.quantity}</span>
                  <span style={{ color: '#9CA3AF', fontSize: '0.98rem' }}>Price: {p.price ?? '—'}</span>
                </li>
              ))
            ) : (
              <li style={{ color: '#9CA3AF', fontStyle: 'italic' }}>No parts listed</li>
            )}
          </ul>
          <div style={{ fontWeight: 600, marginBottom: 8, color: '#232b3e' }}>Requested:</div>
          <div style={{ marginBottom: '2rem', color: '#232b3e', fontWeight: 400 }}>{request.createdAt ? (request.createdAt.toDate ? request.createdAt.toDate().toLocaleString() : new Date(request.createdAt).toLocaleString()) : '—'}</div>
        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '1.25rem 2rem', background: '#F9FAFB', borderTop: '1px solid #F3F4F6' }}>
          {request.status === 'pending' ? (
            <>
              <button className="approve-btn" onClick={() => onApprove(request.id)} disabled={processing} style={{ background: 'var(--header-bg)', color: '#fff', borderRadius: 8, border: 'none', padding: '0.75rem 1.5rem', fontWeight: 600, fontSize: '1rem', cursor: processing ? 'not-allowed' : 'pointer', boxShadow: '0 1px 4px rgba(35,43,62,0.08)', display: 'flex', alignItems: 'center', gap: 8, transition: 'background 0.2s' }}>
                <CheckCircle size={18} /> Approve
              </button>
              <button className="reject-btn" onClick={() => onReject(request.id)} disabled={processing} style={{ background: '#ef4444', color: '#fff', borderRadius: 8, border: 'none', padding: '0.75rem 1.5rem', fontWeight: 600, fontSize: '1rem', cursor: processing ? 'not-allowed' : 'pointer', boxShadow: '0 1px 4px rgba(239,68,68,0.08)', display: 'flex', alignItems: 'center', gap: 8, transition: 'background 0.2s' }}>
                <XCircle size={18} /> Reject
              </button>
              <button className="cancel-btn" onClick={onClose} disabled={processing} style={{ background: '#F3F4F6', color: '#232b3e', borderRadius: 8, border: 'none', padding: '0.75rem 1.5rem', fontWeight: 600, fontSize: '1rem', cursor: processing ? 'not-allowed' : 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', transition: 'background 0.2s' }}>
                Cancel
              </button>
            </>
          ) : (
            <button className="close-btn" onClick={onClose} style={{ background: '#F3F4F6', color: '#232b3e', borderRadius: 8, border: 'none', padding: '0.75rem 1.5rem', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', transition: 'background 0.2s' }}>Close</button>
          )}
        </div>
      </div>
    </div>
  );
}