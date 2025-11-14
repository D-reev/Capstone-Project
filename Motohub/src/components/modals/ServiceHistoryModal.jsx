import React, { useState } from 'react';
import { Modal, Tag, Typography, Divider, Empty, Card, Rate, Input, Button, message } from 'antd';
import { Wrench, Calendar, Clock, Star } from 'lucide-react';
import { getFirestore, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import './Modal.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function ServiceHistoryModal({ vehicle, serviceHistory = [], onClose, open }) {
  const { user } = useAuth();
  const db = getFirestore();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!vehicle) return null;

  // Get only the most recent service
  const recentService = serviceHistory.length > 0 
    ? serviceHistory.sort((a, b) => new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date))[0]
    : null;

  const handleRatingSubmit = async () => {
    if (!recentService) return;
    if (rating === 0) {
      message.warning('Please select a rating before submitting');
      return;
    }

    try {
      setSubmitting(true);

      // Update the service record with the rating and comment
      const serviceRef = doc(db, `users/${user.uid}/cars/${recentService.carId}/serviceHistory/${recentService.id}`);
      await updateDoc(serviceRef, {
        rating: rating,
        comment: comment,
        ratedAt: new Date().toISOString()
      });

      // Update mechanic's rating profile
      if (recentService.mechanicId) {
        const mechanicRatingRef = doc(db, `mechanicRatings/${recentService.mechanicId}`);
        const mechanicRatingDoc = await getDoc(mechanicRatingRef);

        if (mechanicRatingDoc.exists()) {
          const currentData = mechanicRatingDoc.data();
          const totalRatings = currentData.totalRatings || 0;
          const totalScore = currentData.totalScore || 0;
          
          await updateDoc(mechanicRatingRef, {
            totalRatings: totalRatings + 1,
            totalScore: totalScore + rating,
            averageRating: (totalScore + rating) / (totalRatings + 1),
            lastUpdated: new Date().toISOString()
          });
        } else {
          await setDoc(mechanicRatingRef, {
            mechanicId: recentService.mechanicId,
            mechanicName: recentService.mechanicName,
            totalRatings: 1,
            totalScore: rating,
            averageRating: rating,
            lastUpdated: new Date().toISOString()
          });
        }
      }

      message.success('Thank you for your rating and feedback!');
      setRating(0);
      setComment('');
      
      // Close modal after successful submission
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Error submitting rating:', error);
      message.error('Failed to submit rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

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
            Most Recent Service
          </Title>

          {recentService ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Card
                size="small"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Wrench size={18} style={{ color: '#4299e1' }} />
                    <Text strong>Service Report</Text>
                  </div>
                  <Tag color={recentService.status === 'completed' ? 'success' : 'error'}>
                    {recentService.status}
                  </Tag>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={14} />
                    <Text type="secondary">
                      Date: {new Date(recentService.timestamp || recentService.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Wrench size={14} />
                    <Text type="secondary">
                      Mechanic: {recentService.mechanicName || 'Unknown'}
                    </Text>
                  </div>
                </div>

                <Divider style={{ margin: '1rem 0' }} />

                <div>
                  <Title level={5} style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    Diagnosis:
                  </Title>
                  <Paragraph style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
                    {recentService.diagnosis}
                  </Paragraph>

                  <Title level={5} style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    Work Performed:
                  </Title>
                  <Paragraph style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
                    {recentService.workPerformed}
                  </Paragraph>

                  {recentService.partsUsed && (
                    <>
                      <Title level={5} style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                        Parts Used:
                      </Title>
                      <Paragraph style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
                        {recentService.partsUsed}
                      </Paragraph>
                    </>
                  )}

                  {recentService.recommendations && (
                    <>
                      <Title level={5} style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                        Recommendations:
                      </Title>
                      <Paragraph style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
                        {recentService.recommendations}
                      </Paragraph>
                    </>
                  )}

                  {recentService.nextServiceDate && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: '#fef5e7', borderRadius: '0.375rem', marginTop: '1rem' }}>
                      <Clock size={16} style={{ color: '#d69e2e' }} />
                      <Text style={{ fontSize: '0.875rem', color: '#744210' }}>
                        Next Service: {new Date(recentService.nextServiceDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </Text>
                    </div>
                  )}
                </div>
              </Card>

              {/* Rating and Comment Section - Only show for completed services that haven't been rated */}
              {recentService.status === 'completed' && !recentService.rating && (
                <Card
                  size="small"
                  style={{ 
                    boxShadow: '0 2px 8px rgba(251, 191, 36, 0.2)',
                    border: '2px solid #fbbf24',
                    background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <Star size={20} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                    <Title level={5} style={{ margin: 0 }}>
                      Rate Your Service Experience
                    </Title>
                  </div>

                  <Divider style={{ margin: '1rem 0' }} />

                  <div style={{ marginBottom: '1.5rem' }}>
                    <Text strong style={{ display: 'block', marginBottom: '0.5rem' }}>
                      How would you rate the mechanic's work?
                    </Text>
                    <Rate 
                      value={rating} 
                      onChange={setRating}
                      style={{ fontSize: '2rem', color: '#f59e0b' }}
                    />
                    {rating > 0 && (
                      <Text type="secondary" style={{ display: 'block', marginTop: '0.5rem' }}>
                        {rating === 1 && 'Poor'}
                        {rating === 2 && 'Fair'}
                        {rating === 3 && 'Good'}
                        {rating === 4 && 'Very Good'}
                        {rating === 5 && 'Excellent'}
                      </Text>
                    )}
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <Text strong style={{ display: 'block', marginBottom: '0.5rem' }}>
                      Share your experience (optional)
                    </Text>
                    <TextArea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Tell us about your service experience..."
                      rows={4}
                      maxLength={500}
                      showCount
                      style={{ 
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        resize: 'none'
                      }}
                    />
                  </div>

                  <Button
                    type="primary"
                    size="large"
                    loading={submitting}
                    disabled={rating === 0}
                    onClick={handleRatingSubmit}
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                      border: 'none',
                      fontWeight: 700,
                      height: '45px',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(251, 191, 36, 0.3)'
                    }}
                  >
                    Submit Rating
                  </Button>
                </Card>
              )}

              {/* Show existing rating if already rated */}
              {recentService.rating && (
                <Card
                  size="small"
                  style={{ 
                    boxShadow: '0 2px 8px rgba(34, 197, 94, 0.2)',
                    border: '2px solid #22c55e',
                    background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <Star size={20} style={{ color: '#22c55e', fill: '#22c55e' }} />
                    <Title level={5} style={{ margin: 0, color: '#16a34a' }}>
                      Your Rating
                    </Title>
                  </div>

                  <Rate 
                    value={recentService.rating} 
                    disabled
                    style={{ fontSize: '1.5rem', color: '#f59e0b' }}
                  />

                  {recentService.comment && (
                    <div style={{ marginTop: '1rem', padding: '1rem', background: 'white', borderRadius: '8px' }}>
                      <Text strong style={{ display: 'block', marginBottom: '0.5rem' }}>
                        Your Feedback:
                      </Text>
                      <Text>{recentService.comment}</Text>
                    </div>
                  )}

                  <Text type="secondary" style={{ display: 'block', marginTop: '1rem', fontSize: '0.875rem' }}>
                    Thank you for your feedback!
                  </Text>
                </Card>
              )}
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