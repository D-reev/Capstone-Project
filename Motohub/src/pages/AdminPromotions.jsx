import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Tag, Plus, Edit2, Trash2, Save, X, Calendar } from 'lucide-react';
import { Modal, Form, Input, Select, Button, App } from 'antd';
import AdminSidebar from '../components/AdminSidebar';
import SuperAdminSidebar from '../components/SuperAdminSidebar';
import NavigationBar from '../components/NavigationBar';
import { logHelpers } from '../utils/logger';
import SuccessModal from '../components/modals/SuccessModal';
import DeletePromotionModal from '../components/modals/DeletePromotionModal';
import Loading from '../components/Loading';
import '../css/AdminPromotions.css';

const { TextArea } = Input;
const { Option } = Select;

export default function AdminPromotions() {
  const { user } = useAuth();
  const { sidebarOpen } = useSidebar();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [promotionToDelete, setPromotionToDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [editingPromo, setEditingPromo] = useState(null);
  const [features, setFeatures] = useState([]);

  const db = getFirestore();

  useEffect(() => {
    loadPromotions();
    checkExpiredPromotions();
  }, []);

  const checkExpiredPromotions = async () => {
    try {
      const promoRef = collection(db, 'promotions');
      const snapshot = await getDocs(promoRef);
      const now = new Date();
      
      for (const docSnap of snapshot.docs) {
        const promo = docSnap.data();
        if (promo.expirationDate && promo.active !== false) {
          const expirationDate = new Date(promo.expirationDate);
          if (now > expirationDate) {
            await updateDoc(doc(db, 'promotions', docSnap.id), {
              active: false,
              expiredAt: new Date().toISOString()
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking expired promotions:', error);
    }
  };

  const loadPromotions = async () => {
    setLoading(true);
    try {
      const promoRef = collection(db, 'promotions');
      const snapshot = await getDocs(promoRef);
      const promoList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPromotions(promoList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (error) {
      console.error('Error loading promotions:', error);
      message.error('Failed to load promotions');
    } finally {
      setLoading(false);
    }
  };

  const addFeature = () => {
    if (features.length >= 10) {
      message.warning('Maximum 10 features allowed');
      return;
    }
    setFeatures([...features, '']);
  };

  const updateFeature = (index, value) => {
    const newFeatures = [...features];
    newFeatures[index] = value;
    setFeatures(newFeatures);
  };

  const removeFeature = (index) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const promoData = {
        ...values,
        discount: values.discount ? `${values.discount}% OFF` : '',
        validUntil: values.expirationDate ? new Date(values.expirationDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '',
        features: features.filter(f => f.trim() !== ''),
        active: true,
        updatedAt: new Date().toISOString()
      };

      if (editingPromo) {
        await updateDoc(doc(db, 'promotions', editingPromo.id), promoData);
        
        // Log the promotion update
        await logHelpers.updatePromotion(
          user.uid,
          user.displayName || user.email,
          user.role,
          editingPromo.id,
          editingPromo,
          { ...editingPromo, ...promoData }
        );
        
        setSuccessMessage('Promotion updated successfully');
      } else {
        const docRef = await addDoc(collection(db, 'promotions'), {
          ...promoData,
          createdAt: new Date().toISOString()
        });
        
        // Log the promotion creation
        await logHelpers.createPromotion(
          user.uid,
          user.displayName || user.email,
          user.role,
          { id: docRef.id, ...promoData }
        );
        
        setSuccessMessage('Promotion created successfully');
      }

      handleCancel();
      loadPromotions();
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error saving promotion:', error);
      message.error('Failed to save promotion');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (promo) => {
    setEditingPromo(promo);
    form.setFieldsValue({
      title: promo.title || '',
      description: promo.description || '',
      discount: promo.discount ? promo.discount.replace(/[^0-9]/g, '') : '',
      savings: promo.savings || '',
      expirationDate: promo.expirationDate || '',
      icon: promo.icon || 'Wrench'
    });
    setFeatures(promo.features || []);
    setShowModal(true);
  };

  const handleDeleteClick = (promo) => {
    setPromotionToDelete(promo);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!promotionToDelete) return;
    
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'promotions', promotionToDelete.id));
      
      // Log the promotion deletion
      await logHelpers.deletePromotion(
        user.uid,
        user.displayName || user.email,
        user.role,
        promotionToDelete
      );
      
      message.success('Promotion deleted successfully');
      setShowDeleteModal(false);
      setPromotionToDelete(null);
      loadPromotions();
    } catch (error) {
      console.error('Error deleting promotion:', error);
      message.error('Failed to delete promotion');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setEditingPromo(null);
    form.resetFields();
    setFeatures([]);
  };

  const isExpired = (expirationDate) => {
    if (!expirationDate) return false;
    return new Date() > new Date(expirationDate);
  };

  const formatExpirationDate = (expirationDate) => {
    if (!expirationDate) return 'No expiration set';
    const date = new Date(expirationDate);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="admin-promotions-page">
      {user?.role === 'superadmin' ? <SuperAdminSidebar /> : <AdminSidebar />}
      
      <div className={`admin-promotions-main${!sidebarOpen ? ' sidebar-collapsed' : ''}`}>
        <NavigationBar
          title="Promotions Management"
          subtitle="Create and manage customer promotions"
          userRole="admin"
          userName={user?.displayName || 'Admin'}
          userEmail={user?.email || ''}
        />

        {loading ? (
          <Loading text="Loading promotions..." />
        ) : (
          <div className="admin-promotions-content">
            <div className="promotions-header">
              <div className="promotions-header-text">
                <h1 className="promotions-title">Promotions</h1>
                <p className="promotions-subtitle">{promotions.length} total promotions</p>
              </div>
              <button className="add-promotion-btn" onClick={() => setShowModal(true)}>
                <Plus size={20} />
                Add Promotion
              </button>
            </div>

            <div className="promotions-grid">
              {promotions.map(promo => (
                <div key={promo.id} className="promotion-card">
                  <div className="promotion-card-header">
                    <div className="promotion-actions">
                      <button className="edit-btn" onClick={() => handleEdit(promo)}>
                        <Edit2 size={16} />
                      </button>
                      <button className="delete-btn" onClick={() => handleDeleteClick(promo)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="promotion-card-body">
                    <h3 className="promotion-card-title">{promo.title}</h3>
                    <p className="promotion-card-description">{promo.description}</p>
                    
                    {promo.features && promo.features.length > 0 && (
                      <ul className="promotion-features-list">
                        {promo.features.map((feature, index) => (
                          <li key={index}>{feature}</li>
                        ))}
                      </ul>
                    )}

                    <div className={`expiration-info${isExpired(promo.expirationDate) ? ' expired' : ''}`}>
                      <Calendar size={14} />
                      {isExpired(promo.expirationDate) ? 'Expired: ' : 'Expires: '}
                      {formatExpirationDate(promo.expirationDate)}
                    </div>
                  </div>

                  <div className="promotion-card-footer">
                    <div className="promotion-discount">{promo.discount}</div>
                    <div className="promotion-validity">
                      <Calendar size={14} />
                      Valid until {promo.validUntil}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <Modal
          open={showModal}
          title={editingPromo ? 'Edit Promotion' : 'Add New Promotion'}
          onCancel={handleCancel}
          footer={null}
          width={700}
          centered
          destroyOnClose
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
            .ant-input:hover,
            .ant-input:focus,
            .ant-input-focused,
            .ant-input-number:hover,
            .ant-input-number:focus,
            .ant-input-number-focused,
            .ant-select:not(.ant-select-disabled):hover .ant-select-selector,
            .ant-select-focused:not(.ant-select-disabled) .ant-select-selector {
              border-color: #FFC300 !important;
            }
            .ant-input:focus,
            .ant-input-focused,
            .ant-input-number:focus,
            .ant-input-number-focused,
            .ant-select-focused .ant-select-selector {
              border-color: #FFC300 !important;
              box-shadow: 0 0 0 2px rgba(255, 195, 0, 0.1) !important;
              outline: none !important;
            }
            .promo-cancel-btn {
              height: 42px;
              border-radius: 8px;
              border-color: #FFC300 !important;
              color: #FFC300 !important;
              background: transparent !important;
            }
            .promo-cancel-btn:hover:not(:disabled) {
              border-color: #FFD54F !important;
              color: #FFD54F !important;
              background: transparent !important;
            }
            .promo-submit-btn {
              height: 42px;
              border-radius: 8px;
              background: linear-gradient(135deg, #FFC300, #FFD54F) !important;
              border-color: #FFC300 !important;
              color: #000 !important;
              font-weight: 600;
            }
            .promo-submit-btn:hover:not(:disabled) {
              background: linear-gradient(135deg, #FFD54F, #FFEB3B) !important;
              border-color: #FFD54F !important;
            }
            .add-feature-btn {
              height: 32px;
              border-radius: 8px;
              background: linear-gradient(135deg, #FFC300, #FFD54F) !important;
              border-color: #FFC300 !important;
              color: #000 !important;
              font-weight: 600;
              font-size: 14px;
            }
            .remove-feature-btn {
              height: 32px;
              width: 32px;
              border-radius: 8px;
              background: #FFC300 !important;
              border-color: #FFC300 !important;
              color: #000 !important;
            }
            .feature-input-group {
              display: flex;
              gap: 8px;
              margin-bottom: 8px;
            }
            .feature-input-group .ant-input {
              flex: 1;
            }
          `}</style>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              icon: 'Wrench'
            }}
          >
            <Form.Item
              label="Title"
              name="title"
              rules={[{ required: true, message: 'Please enter promotion title' }]}
            >
              <Input placeholder="Enter promotion title" size="large" />
            </Form.Item>

            <Form.Item
              label="Description"
              name="description"
              rules={[{ required: true, message: 'Please enter description' }]}
            >
              <TextArea rows={3} placeholder="Enter promotion description" size="large" />
            </Form.Item>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Form.Item
                label="Discount (%)"
                name="discount"
                rules={[{ required: true, message: 'Please enter discount percentage' }]}
              >
                <Input placeholder="20" size="large" />
              </Form.Item>

              <Form.Item
                label="Savings"
                name="savings"
              >
                <Input placeholder="Save up to ₱5,000" size="large" />
              </Form.Item>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Form.Item
                label="Expiration Date"
                name="expirationDate"
                rules={[{ required: true, message: 'Please select expiration date' }]}
              >
                <Input type="date" size="large" />
              </Form.Item>

              <Form.Item
                label="Icon"
                name="icon"
              >
                <Select size="large">
                  <Option value="Wrench">Wrench</Option>
                  <Option value="Car">Car</Option>
                  <Option value="TrendingUp">Trending Up</Option>
                </Select>
              </Form.Item>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ fontWeight: 600 }}>Features</label>
                <Button
                  className="add-feature-btn"
                  onClick={addFeature}
                  disabled={features.length >= 10}
                  icon={<Plus size={16} />}
                  size="small"
                >
                  Add Feature
                </Button>
              </div>
              {features.map((feature, index) => (
                <div key={index} className="feature-input-group">
                  <Input
                    value={feature}
                    onChange={(e) => updateFeature(index, e.target.value)}
                    placeholder={`Feature ${index + 1}`}
                    size="large"
                  />
                  <Button
                    className="remove-feature-btn"
                    onClick={() => removeFeature(index)}
                    icon={<X size={16} />}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <Button
                className="promo-cancel-btn"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                className="promo-submit-btn"
                htmlType="submit"
                loading={loading}
              >
                {loading ? 'Saving...' : 'Save Promotion'}
              </Button>
            </div>
          </Form>
        </Modal>
      )}

      <SuccessModal
        open={showSuccessModal}
        message={successMessage}
        onClose={() => setShowSuccessModal(false)}
      />

      <DeletePromotionModal
        promotion={promotionToDelete}
        open={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setPromotionToDelete(null);
        }}
        onDelete={handleDeleteConfirm}
        processing={loading}
      />
    </div>
  );
}
