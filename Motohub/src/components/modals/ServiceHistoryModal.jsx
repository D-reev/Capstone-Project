import React from 'react';
import { Modal, Tag, Typography, Divider, Empty, Card } from 'antd';
import { Wrench, Calendar, Clock } from 'lucide-react';
import './Modal.css';

const { Title, Text, Paragraph } = Typography;

export default function ServiceHistoryModal({ vehicle, serviceHistory = [], onClose, open }) {
  if (!vehicle) return null;

  return (
    <Modal
      open={open}
      title={`Service History - ${vehicle.make} ${vehicle.model}`}
      onCancel={onClose}
      footer={null}
      width={900}
      destroyOnHidden
      maskClosable
      centered
    >
      <style>{`
        .ant-modal-header {
          background: linear-gradient(135deg, #FFC300, #FFD54F);
        }
        .ant-modal-title {
          color: #000 !important;
          font-weight: 700;
          font-size: 18px;
          text-align: center;
        }
      `}</style>

      <div style={{ padding: '1rem' }}>
          <Card
            size="small"
            style={{ marginBottom: '1.5rem', background: '#f7fafc' }}
            title={<Text strong>Vehicle Details</Text>}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.875rem' }}>
              <div><Text strong>Make:</Text> {vehicle.make}</div>
              <div><Text strong>Model:</Text> {vehicle.model}</div>
              <div><Text strong>Year:</Text> {vehicle.year}</div>
              <div><Text strong>Plate:</Text> {vehicle.plateNumber}</div>
              <div><Text strong>Engine:</Text> {vehicle.engine}</div>
              <div><Text strong>Transmission:</Text> {vehicle.transmission}</div>
            </div>
          </Card>

          <Title level={5} style={{ marginBottom: '1rem' }}>
            Service Records ({serviceHistory.length})
          </Title>

          {serviceHistory.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {serviceHistory.map((service, index) => (
                <Card
                  key={service.id || index}
                  size="small"
                  style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Wrench size={18} style={{ color: '#4299e1' }} />
                      <Text strong>Service Report</Text>
                    </div>
                    <Tag color={service.status === 'completed' ? 'success' : 'error'}>
                      {service.status}
                    </Tag>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Calendar size={14} />
                      <Text type="secondary">
                        Date: {new Date(service.timestamp || service.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Wrench size={14} />
                      <Text type="secondary">
                        Mechanic: {service.mechanicName || 'Unknown'}
                      </Text>
                    </div>
                  </div>

                  <Divider style={{ margin: '1rem 0' }} />

                  <div>
                    <Title level={5} style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                      Diagnosis:
                    </Title>
                    <Paragraph style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
                      {service.diagnosis}
                    </Paragraph>

                    <Title level={5} style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                      Work Performed:
                    </Title>
                    <Paragraph style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
                      {service.workPerformed}
                    </Paragraph>

                    {service.partsUsed && (
                      <>
                        <Title level={5} style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                          Parts Used:
                        </Title>
                        <Paragraph style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
                          {service.partsUsed}
                        </Paragraph>
                      </>
                    )}

                    {service.recommendations && (
                      <>
                        <Title level={5} style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                          Recommendations:
                        </Title>
                        <Paragraph style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
                          {service.recommendations}
                        </Paragraph>
                      </>
                    )}

                    {service.nextServiceDate && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: '#fef5e7', borderRadius: '0.375rem', marginTop: '1rem' }}>
                        <Clock size={16} style={{ color: '#d69e2e' }} />
                        <Text style={{ fontSize: '0.875rem', color: '#744210' }}>
                          Next Service: {new Date(service.nextServiceDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </Text>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Empty
              image={<Wrench size={48} style={{ margin: '0 auto', opacity: 0.5, color: '#a0aec0' }} />}
              description="No service history available for this vehicle."
              style={{ padding: '3rem 0' }}
            />
          )}
      </div>
    </Modal>
  );
}