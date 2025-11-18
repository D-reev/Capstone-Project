import React, { useEffect, useState } from 'react';
import { App, Modal } from 'antd';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import { getUserProfile, updateUserProfile } from '../utils/auth';
import { User, Save, RotateCcw, Edit2, Lock, Edit, X } from 'lucide-react';
import UserSidebar from '../components/UserSidebar';
import NavigationBar from '../components/NavigationBar';
import '../css/ProfileSection.css';
import Loading from '../components/Loading';

export default function ProfileSection() {
  const { message: messageApi } = App.useApp();
  const { user } = useAuth();
  const { sidebarOpen } = useSidebar();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const [photoURL, setPhotoURL] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [originalProfile, setOriginalProfile] = useState(null);
  const [originalPhotoURL, setOriginalPhotoURL] = useState('');
  const [profile, setProfile] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    address: '',
    city: '',
    postalCode: '',
    phoneNumber: '',
    googleEmail: ''
  });
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const p = await getUserProfile(user.uid);
        if (!mounted) return;
        const photoUrl = user?.photoURL || p?.photoURL || '';
        setPhotoURL(photoUrl);
        setOriginalPhotoURL(photoUrl);
        const profileData = {
          firstName: p?.firstName ?? '',
          middleName: p?.middleName ?? '',
          lastName: p?.lastName ?? '',
          address: p?.address ?? '',
          city: p?.city ?? '',
          postalCode: p?.postalCode ?? '',
          phoneNumber: p?.phoneNumber ?? '',
          googleEmail: p?.googleEmail ?? p?.email ?? ''
        };
        setProfile(profileData);
        setOriginalProfile(profileData);
      } catch (err) {
        console.error('load profile error', err);
        setError('Failed to load profile');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [user?.uid]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      messageApi.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      messageApi.error('Image size must be less than 5MB');
      return;
    }

    setUploadingPhoto(true);
    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result;
        setPhotoURL(base64String);
        
        // Save to Firebase
        if (user?.uid) {
          await updateUserProfile(user.uid, { photoURL: base64String });
          messageApi.success('Profile photo updated successfully!');
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Photo upload error:', err);
      messageApi.error('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const isIncomplete = () => {
    return !profile.address?.trim() || !profile.phoneNumber?.trim() || !profile.googleEmail?.trim();
  };

  const hasChanges = () => {
    if (!originalProfile) return false;
    
    // Check if photo changed
    if (photoURL !== originalPhotoURL) return true;
    
    // Check if any profile field changed
    return Object.keys(profile).some(key => profile[key] !== originalProfile[key]);
  };

  const handleCancelEdit = () => {
    if (hasChanges()) {
      Modal.confirm({
        title: 'Unsaved Changes',
        content: 'You have unsaved changes. Are you sure you want to cancel without saving?',
        okText: 'Discard Changes',
        cancelText: 'Continue Editing',
        okButtonProps: { danger: true },
        onOk: () => {
          // Revert changes
          setProfile(originalProfile);
          setPhotoURL(originalPhotoURL);
          setEditMode(false);
        },
      });
    } else {
      setEditMode(false);
    }
  };

  const handleChange = (field) => (e) => {
    setProfile(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!user?.uid) return setError('Not authenticated');
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updates = {
        firstName: profile.firstName || null,
        middleName: profile.middleName || null,
        lastName: profile.lastName || null,
        address: profile.address || null,
        city: profile.city || null,
        postalCode: profile.postalCode || null,
        phoneNumber: profile.phoneNumber || null,
        googleEmail: profile.googleEmail || null,
        updatedAt: new Date().toISOString()
      };
      await updateUserProfile(user.uid, updates);
      messageApi.success('Profile saved successfully!');
      
      // Update original values after successful save
      setOriginalProfile({ ...profile });
      setOriginalPhotoURL(photoURL);
      setEditMode(false);
    } catch (err) {
      console.error('save profile error', err);
      setError(err?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    const p = await getUserProfile(user.uid);
    setProfile({
      firstName: p?.firstName ?? '',
      middleName: p?.middleName ?? '',
      lastName: p?.lastName ?? '',
      address: p?.address ?? '',
      city: p?.city ?? '',
      postalCode: p?.postalCode ?? '',
      phoneNumber: p?.phoneNumber ?? '',
      googleEmail: p?.googleEmail ?? p?.email ?? ''
    });
    setLoading(false);
    setMessage(null);
    setError(null);
  };

  if (loading) return <Loading text="Loading profile" />;

  return (
    <div className="profile-dashboard-container">
      <UserSidebar 
        user={user}
        className={`customer-sidebar${sidebarOpen ? '' : ' collapsed'}${sidebarMobileOpen ? ' open' : ''}`}
        onCloseMobile={() => setSidebarMobileOpen(false)}
      />

      <div className={`profile-main-content ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        <NavigationBar
          title="Profile"
          userRole="customer"
          userName={user?.displayName || 'User'}
          userEmail={user?.email || ''}
        />

        {/* Main Content */}
        <div className="profile-content-area">
          <div className="profile-header">
            <div className="profile-header-text">
              <h2 className="profile-title">My Profile</h2>
              <p className="profile-subtitle">
                Manage your personal information and contact details
              </p>
            </div>
          </div>

          {/* Alert Messages */}
          {isIncomplete() && (
            <div className="alert alert-warning">
              <div className="alert-content">
                <User size={20} className="alert-icon" />
                <div>
                  <strong className="alert-title">Complete your profile</strong>
                  <div className="alert-message">
                    Please complete your address and mobile number and connect a verified Gmail account so we can send notifications and enable password recovery.
                  </div>
                </div>
              </div>
            </div>
          )}

          {message && (
            <div className="alert alert-success">
              {message}
            </div>
          )}

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          {/* Profile Cards Grid */}
          <div className="profile-cards-grid">
            {/* Profile Card */}
            <div className="profile-card profile-info-card">
              <div className="profile-card-header">
                <h3 className="profile-card-title">My profile</h3>
                <span className="profile-card-subtitle">Last seen: 07 Aug 2024 05:24AM</span>
              </div>
              
              <div className="profile-avatar-section">
                <div className="profile-avatar-container">
                  <label 
                    className={`profile-avatar-click ${editMode ? 'editable' : ''}`} 
                    htmlFor="photo-upload" 
                    style={{ cursor: editMode ? 'pointer' : 'default' }}
                  >
                    <div className="profile-avatar-large">
                      {photoURL && photoURL.trim() !== '' ? (
                        <img src={photoURL} alt={user?.displayName || 'User'} className="profile-avatar-img" />
                      ) : (
                        <User size={64} className="profile-avatar-icon" />
                      )}
                    </div>
                    {editMode && (
                      <div className="profile-avatar-edit-overlay">
                        <Edit size={18} />
                      </div>
                    )}
                    {editMode && (
                      <div className="profile-avatar-tooltip">Click to change photo</div>
                    )}
                  </label>
                  <input
                    type="file"
                    id="photo-upload"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    style={{ display: 'none' }}
                    disabled={uploadingPhoto}
                  />
                </div>
                <div className="profile-info-text">
                  <h2 className="profile-name">{profile.firstName} {profile.lastName}</h2>
                  <p className="profile-contact">{profile.phoneNumber || '(XXX) XXX-XXXX'}</p>
                  <p className="profile-email">{profile.googleEmail || user?.email || 'email@example.com'}</p>
                </div>
              </div>
            </div>

            {/* Account Details Cards */}
            <div className="profile-card account-details-card">
              <div className="account-section-header">
                <h3 className="account-section-title">Account Details</h3>
                {!editMode ? (
                  <button onClick={() => setEditMode(true)} className="edit-btn-small">
                    <Edit2 size={16} />
                    Edit
                  </button>
                ) : (
                  <button onClick={handleCancelEdit} className="cancel-edit-btn-small">
                    <X size={16} />
                    Cancel
                  </button>
                )}
              </div>

              <form onSubmit={handleSave} className="account-details-form">
                {/* Name Fields */}
                <div className="form-group-modern">
                  <label>First Name</label>
                  <input
                    type="text"
                    placeholder="Scani"
                    value={profile.firstName}
                    onChange={handleChange('firstName')}
                    disabled={!editMode}
                    required
                  />
                </div>

                <div className="form-group-modern">
                  <label>Middle Name</label>
                  <input
                    type="text"
                    placeholder="Middle name (optional)"
                    value={profile.middleName}
                    onChange={handleChange('middleName')}
                    disabled={!editMode}
                  />
                </div>

                <div className="form-group-modern">
                  <label>Last Name</label>
                  <input
                    type="text"
                    placeholder="Raheman"
                    value={profile.lastName}
                    onChange={handleChange('lastName')}
                    disabled={!editMode}
                    required
                  />
                </div>

                <div className="form-group-modern">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    placeholder="XXX) XXX-XXXX"
                    value={profile.phoneNumber}
                    onChange={handleChange('phoneNumber')}
                    disabled={!editMode}
                    required
                  />
                </div>

                <div className="form-group-modern">
                  <label>Email</label>
                  <input
                    type="email"
                    value={profile.googleEmail || user?.email}
                    disabled={true}
                    className="disabled-input"
                  />
                </div>

                <div className="form-group-modern">
                  <label>Address</label>
                  <input
                    type="text"
                    placeholder="Street address"
                    value={profile.address}
                    onChange={handleChange('address')}
                    disabled={!editMode}
                  />
                </div>

                <div className="form-group-modern">
                  <label>City</label>
                  <input
                    type="text"
                    placeholder="City"
                    value={profile.city}
                    onChange={handleChange('city')}
                    disabled={!editMode}
                  />
                </div>

                <div className="form-group-modern">
                  <label>Postal Code</label>
                  <input
                    type="text"
                    placeholder="Postal code"
                    value={profile.postalCode}
                    onChange={handleChange('postalCode')}
                    disabled={!editMode}
                  />
                </div>

                {editMode && (
                  <div className="form-actions-modern">
                    <button type="submit" className="save-btn-modern" disabled={saving}>
                      <Save size={18} />
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button type="button" className="cancel-btn-modern" onClick={handleCancelEdit} disabled={saving}>
                      <RotateCcw size={18} />
                      Cancel
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Save Button */}
      {editMode && (
        <div className="floating-save-container">
          <button 
            type="button" 
            className="floating-save-btn" 
            onClick={handleSave}
            disabled={saving}
          >
            <Save size={20} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button 
            type="button" 
            className="floating-cancel-btn" 
            onClick={handleCancelEdit}
            disabled={saving}
          >
            <RotateCcw size={18} />
          </button>
        </div>
      )}
    </div>
  );
}