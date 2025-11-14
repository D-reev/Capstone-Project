import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Tag, Plus, Edit2, Trash2, Save, X, Calendar } from 'lucide-react';
import { message } from 'antd';
import AdminSidebar from '../components/AdminSidebar';
import NavigationBar from '../components/NavigationBar';
import SuccessModal from '../components/modals/SuccessModal';
import DeletePromotionModal from '../components/modals/DeletePromotionModal';
import '../css/AdminPromotions.css';

export default function AdminPromotions() {
  const { user } = useAuth();
  const { sidebarOpen } = useSidebar();
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [promotionToDelete, setPromotionToDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [editingPromo, setEditingPromo] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discount: '',
    savings: '',
    validUntil: '',
    expirationDate: '',
    icon: 'Wrench',
    features: [],
    active: true
  });

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
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'discount') {
      const numValue = value.replace(/[^0-9]/g, '');
      setFormData({ ...formData, [name]: numValue });
    } else if (name === 'expirationDate') {
      const date = new Date(value);
      const validUntil = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      setFormData({ ...formData, [name]: value, validUntil });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const addFeature = () => {
    if (formData.features.length >= 10) {
      alert('Maximum 10 features allowed');
      return;
    }
    setFormData({ ...formData, features: [...formData.features, ''] });
  };

  const updateFeature = (index, value) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  const removeFeature = (index) => {
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData({ ...formData, features: newFeatures });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const promoData = {
        ...formData,
        discount: formData.discount ? `${formData.discount}% OFF` : '',
        features: formData.features.filter(f => f.trim() !== ''),
        active: true,
        updatedAt: new Date().toISOString()
      };

      if (editingPromo) {
        await updateDoc(doc(db, 'promotions', editingPromo.id), promoData);
        setSuccessMessage('Promotion updated successfully');
      } else {
        await addDoc(collection(db, 'promotions'), {
          ...promoData,
          createdAt: new Date().toISOString()
        });
        setSuccessMessage('Promotion created successfully');
      }

      setShowModal(false);
      setEditingPromo(null);
      resetForm();
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
    setFormData({
      title: promo.title || '',
      description: promo.description || '',
      discount: promo.discount ? promo.discount.replace(/[^0-9]/g, '') : '',
      savings: promo.savings || '',
      validUntil: promo.validUntil || '',
      expirationDate: promo.expirationDate || '',
      icon: promo.icon || 'Wrench',
      features: promo.features || [],
      active: promo.active !== false
    });
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

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      discount: '',
      savings: '',
      validUntil: '',
      expirationDate: '',
      icon: 'Wrench',
      features: [],
      active: true
    });
  };

  const handleCancel = () => {
    setShowModal(false);
    setEditingPromo(null);
    resetForm();
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
    <div className="admin-promotions-container">
      <AdminSidebar />
      
      <div className={`admin-promotions-main${!sidebarOpen ? ' sidebar-collapsed' : ''}`}>
        <NavigationBar
          title="Promotions Management"
          subtitle="Create and manage customer promotions"
          userRole="admin"
          userName={user?.displayName || 'Admin'}
          userEmail={user?.email || ''}
        />

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
      </div>

      {showModal && (
        <div className="promo-modal-overlay" onClick={handleCancel}>
          <div className="promo-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="promo-modal-header">
              <h2>{editingPromo ? 'Edit Promotion' : 'Add New Promotion'}</h2>
              <button type="button" className="close-modal-btn" onClick={handleCancel}>
                <X size={24} />
              </button>
            </div>
            <form className="promo-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={3}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Discount (%) *</label>
                    <input
                      type="text"
                      name="discount"
                      value={formData.discount}
                      onChange={handleInputChange}
                      placeholder="20"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Savings</label>
                    <input
                      type="text"
                      name="savings"
                      value={formData.savings}
                      onChange={handleInputChange}
                      placeholder="Save up to ₱5,000"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Expiration Date *</label>
                    <input
                      type="date"
                      name="expirationDate"
                      value={formData.expirationDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Valid Until (Auto-filled)</label>
                    <input
                      type="text"
                      name="validUntil"
                      value={formData.validUntil}
                      readOnly
                      placeholder="Auto-filled from expiration date"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Icon</label>
                  <select name="icon" value={formData.icon} onChange={handleInputChange}>
                    <option value="Wrench">Wrench</option>
                    <option value="Car">Car</option>
                    <option value="TrendingUp">Trending Up</option>
                  </select>
                </div>

                <div className="form-group">
                  <div className="features-header">
                    <label>Features</label>
                    <button
                      type="button"
                      className="add-feature-btn"
                      onClick={addFeature}
                      disabled={formData.features.length >= 10}
                    >
                      <Plus size={16} />
                      Add Feature
                    </button>
                  </div>
                  {formData.features.map((feature, index) => (
                    <div key={index} className="feature-input-group">
                      <input
                        type="text"
                        className="feature-input"
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        placeholder={`Feature ${index + 1}`}
                      />
                      <button
                        type="button"
                        className="remove-feature-btn"
                        onClick={() => removeFeature(index)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="modal-actions">
                  <button type="button" className="cancel-btn" onClick={handleCancel}>
                    <X size={18} />
                    Cancel
                  </button>
                  <button type="submit" className="save-btn" disabled={loading}>
                    <Save size={18} />
                    {loading ? 'Saving...' : 'Save Promotion'}
                  </button>
                </div>
              </form>
          </div>
        </div>
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
