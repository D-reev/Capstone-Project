import React from 'react';
import { X, Wrench, Calendar, Clock, Car } from 'lucide-react';
import './Modal.css';

export default function ServiceHistoryModal({ vehicle, serviceHistory, onClose }) {
  if (!vehicle) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <h2>Service History - {vehicle.make} {vehicle.model}</h2>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f7fafc', borderRadius: '0.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem', color: '#2d3748' }}>
              Vehicle Details
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.875rem', color: '#4a5568' }}>
              <p><strong>Make:</strong> {vehicle.make}</p>
              <p><strong>Model:</strong> {vehicle.model}</p>
              <p><strong>Year:</strong> {vehicle.year}</p>
              <p><strong>Plate:</strong> {vehicle.plateNumber}</p>
              <p><strong>Engine:</strong> {vehicle.engine}</p>
              <p><strong>Transmission:</strong> {vehicle.transmission}</p>
            </div>
          </div>

          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#2d3748' }}>
            Service Records ({serviceHistory.length})
          </h3>

          {serviceHistory.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {serviceHistory.map((service, index) => (
                <div 
                  key={service.id || index} 
                  style={{ 
                    padding: '1.5rem', 
                    background: '#fff', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '0.5rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Wrench size={18} style={{ color: '#4299e1' }} />
                      <span style={{ fontWeight: '600', color: '#2d3748' }}>Service Report</span>
                    </div>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      background: service.status === 'completed' ? '#c6f6d5' : '#fed7d7',
                      color: service.status === 'completed' ? '#22543d' : '#742a2a',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      {service.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem', color: '#4a5568' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Calendar size={14} />
                      <span>Date: {new Date(service.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Wrench size={14} />
                      <span>Mechanic: {service.mechanicName || 'Unknown'}</span>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                    <div style={{ marginBottom: '1rem' }}>
                      <h5 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#2d3748', marginBottom: '0.5rem' }}>
                        Diagnosis:
                      </h5>
                      <p style={{ fontSize: '0.875rem', color: '#4a5568', lineHeight: '1.5' }}>
                        {service.diagnosis}
                      </p>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <h5 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#2d3748', marginBottom: '0.5rem' }}>
                        Work Performed:
                      </h5>
                      <p style={{ fontSize: '0.875rem', color: '#4a5568', lineHeight: '1.5' }}>
                        {service.workPerformed}
                      </p>
                    </div>

                    {service.partsUsed && (
                      <div style={{ marginBottom: '1rem' }}>
                        <h5 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#2d3748', marginBottom: '0.5rem' }}>
                          Parts Used:
                        </h5>
                        <p style={{ fontSize: '0.875rem', color: '#4a5568', lineHeight: '1.5' }}>
                          {service.partsUsed}
                        </p>
                      </div>
                    )}

                    {service.recommendations && (
                      <div style={{ marginBottom: '1rem' }}>
                        <h5 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#2d3748', marginBottom: '0.5rem' }}>
                          Recommendations:
                        </h5>
                        <p style={{ fontSize: '0.875rem', color: '#4a5568', lineHeight: '1.5' }}>
                          {service.recommendations}
                        </p>
                      </div>
                    )}

                    {service.nextServiceDate && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: '#fef5e7', borderRadius: '0.375rem', marginTop: '1rem' }}>
                        <Clock size={16} style={{ color: '#d69e2e' }} />
                        <span style={{ fontSize: '0.875rem', color: '#744210' }}>
                          Next Service: {new Date(service.nextServiceDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ 
              padding: '3rem', 
              textAlign: 'center', 
              color: '#a0aec0',
              background: '#f7fafc',
              borderRadius: '0.5rem'
            }}>
              <Wrench size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p>No service history available for this vehicle.</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}