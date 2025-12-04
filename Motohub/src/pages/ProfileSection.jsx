import React, { useEffect, useState } from 'react';
import { App, Modal } from 'antd';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import { getUserProfile, updateUserProfile, markProfileCompleted } from '../utils/auth';
import { User, Save, RotateCcw, Edit2, Lock, Edit, X, Eye, EyeOff } from 'lucide-react';
import UserSidebar from '../components/UserSidebar';
import SuperAdminSidebar from '../components/SuperAdminSidebar';
import NavigationBar from '../components/NavigationBar';
import ForgotPasswordModal from '../components/modals/ForgotPasswordModal';
import '../css/ProfileSection.css';
import Loading from '../components/Loading';
import { getAuth, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

export default function ProfileSection() {
  const { message: messageApi } = App.useApp();
  const { user } = useAuth();
  const { sidebarOpen } = useSidebar();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const [photoURL, setPhotoURL] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [originalProfile, setOriginalProfile] = useState(null);
  const [originalPhotoURL, setOriginalPhotoURL] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
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

  const isGoogleUser = () => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    return currentUser?.providerData?.some(provider => provider.providerId === 'google.com');
  };

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

    if (!file.type.startsWith('image/')) {
      messageApi.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      messageApi.error('Image size must be less than 5MB');
      return;
    }

    setUploadingPhoto(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64String = reader.result;
          
          // Validate the base64 string
          if (!base64String || base64String.length === 0) {
            messageApi.error('Failed to read image file');
            setUploadingPhoto(false);
            return;
          }
          
          setPhotoURL(base64String);

          if (user?.uid) {
            await updateUserProfile(user.uid, { photoURL: base64String });
            messageApi.success('Profile photo updated successfully! Refreshing...', 1.5);
            
            // Reload page to refresh AuthContext with new photo
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          }
        } catch (err) {
          console.error('Error processing photo upload:', err);
          messageApi.error('Failed to upload photo');
          setUploadingPhoto(false);
        }
      };
      
      reader.onerror = () => {
        console.error('FileReader error:', reader.error);
        messageApi.error('Failed to read image file');
        setUploadingPhoto(false);
      };
      
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Photo upload error:', err);
      messageApi.error('Failed to upload photo');
      setUploadingPhoto(false);
    }
  };

  const isIncomplete = () => {
    return !profile.address?.trim() || !profile.phoneNumber?.trim();
  };

  const hasChanges = () => {
    if (!originalProfile) return false;

    if (photoURL !== originalPhotoURL) return true;

    if (passwordData.oldPassword || passwordData.newPassword || passwordData.confirmPassword) return true;

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
          setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
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

  const handlePasswordChange = (field) => (e) => {
    setPasswordData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!user?.uid) return setError('Not authenticated');
    
    //Validation
    if (passwordData.oldPassword || passwordData.newPassword || passwordData.confirmPassword) {
      if (!passwordData.oldPassword) {
        messageApi.error('Please enter your current password');
        return;
      }
      if (!passwordData.newPassword) {
        messageApi.error('Please enter a new password');
        return;
      }
      if (passwordData.newPassword.length < 6) {
        messageApi.error('New password must be at least 6 characters');
        return;
      }
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        messageApi.error('Passwords do not match');
        return;
      }
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      if (passwordData.oldPassword && passwordData.newPassword) {
        setChangingPassword(true);
        const auth = getAuth();
        const currentUser = auth.currentUser;
        
        if (!currentUser || !currentUser.email) {
          throw new Error('No authenticated user found');
        }

        const credential = EmailAuthProvider.credential(
          currentUser.email,
          passwordData.oldPassword
        );
        
        try {
          await reauthenticateWithCredential(currentUser, credential);
        } catch (error) {
          setChangingPassword(false);
          if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            messageApi.error('Current password is incorrect');
            setSaving(false);
            return;
          }
          throw new Error('Failed to verify current password');
        }

        await updatePassword(currentUser, passwordData.newPassword);
        messageApi.success('Password changed successfully!');
        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        setChangingPassword(false);
      }

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
      
      // Mark profile as completed if all required fields are filled
      const wasIncomplete = !user.profileCompleted;
      if (profile.address?.trim() && profile.phoneNumber?.trim()) {
        await markProfileCompleted(user.uid);
        
        // If profile was just completed, reload the page to update the auth context
        if (wasIncomplete) {
          messageApi.success('Profile completed successfully! Reloading...', 1.5);
          setTimeout(() => {
            window.location.reload();
          }, 1500);
          return;
        }
      }
      
      messageApi.success('Profile saved successfully!');
      
      setOriginalProfile({ ...profile });
      setOriginalPhotoURL(photoURL);
      setEditMode(false);
    } catch (err) {
      console.error('save profile error', err);
      setError(err?.message || 'Failed to save profile');
      messageApi.error(err?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
      setChangingPassword(false);
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
      {user?.role === 'superadmin' ? (
        <SuperAdminSidebar />
      ) : (
        <UserSidebar 
          user={user}
          className={`customer-sidebar${sidebarOpen ? '' : ' collapsed'}${sidebarMobileOpen ? ' open' : ''}`}
          onCloseMobile={() => setSidebarMobileOpen(false)}
        />
      )}

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
          {!user.profileCompleted && (
            <div className="alert alert-warning" style={{ 
              backgroundColor: '#FEF3C7', 
              border: '2px solid #FCD34D',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div className="alert-content">
                <User size={20} className="alert-icon" style={{ color: '#92400E' }} />
                <div>
                  <strong className="alert-title" style={{ color: '#92400E' }}>Profile Completion Required</strong>
                  <div className="alert-message" style={{ color: '#78350F' }}>
                    Welcome! Please complete your profile with your address and phone number to access all features. You won't be able to use other features until your profile is complete.
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {isIncomplete() && user.profileCompleted && (
            <div className="alert alert-warning">
              <div className="alert-content">
                <User size={20} className="alert-icon" />
                <div>
                  <strong className="alert-title">Complete your profile</strong>
                  <div className="alert-message">
                    Please complete your address and mobile number. You can also connect a Gmail account for notifications and password recovery.
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
                  {editMode ? (
                    <label 
                      className="profile-avatar-click editable" 
                      htmlFor="photo-upload" 
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="profile-avatar-large">
                        {photoURL && photoURL.trim() !== '' ? (
                          <img src={photoURL} alt={user?.displayName || 'User'} className="profile-avatar-img" />
                        ) : (
                          <User size={64} className="profile-avatar-icon" />
                        )}
                      </div>
                      <div className="profile-avatar-edit-overlay">
                        <Edit size={18} />
                      </div>
                      <div className="profile-avatar-tooltip">Click to change photo</div>
                    </label>
                  ) : (
                    <div className="profile-avatar-click">
                      <div className="profile-avatar-large">
                        {photoURL && photoURL.trim() !== '' ? (
                          <img src={photoURL} alt={user?.displayName || 'User'} className="profile-avatar-img" />
                        ) : (
                          <User size={64} className="profile-avatar-icon" />
                        )}
                      </div>
                    </div>
                  )}
                  <input
                    type="file"
                    id="photo-upload"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    style={{ display: 'none' }}
                    disabled={uploadingPhoto || !editMode}
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

                <div className="form-group">
                  <label>Middle Name</label>
                  <input
                    type="text"
                    placeholder="Middle name (optional)"
                    value={profile.middleName}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow letters, spaces, periods, and hyphens
                      if (/^[a-zA-Z\s.\-]*$/.test(value)) {
                        handleChange('middleName')(e);
                      }
                    }}
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

                {/* Password Change Section - Only for email/password users */}
                {!isGoogleUser() && (
                  <>
                    <div className="password-section-divider">
                      <div className="divider-line"></div>
                      <div className="divider-text">
                        <Lock size={16} />
                        Change Password
                      </div>
                      <div className="divider-line"></div>
                    </div>

                <div className="form-group-modern">
                  <label>Current Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showOldPassword ? "text" : "password"}
                      placeholder="Enter current password"
                      value={passwordData.oldPassword}
                      onChange={handlePasswordChange('oldPassword')}
                      disabled={!editMode}
                    />
                    {editMode && (
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                      >
                        {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    )}
                  </div>
                </div>

                <div className="form-group-modern">
                  <label>New Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter new password (min 6 characters)"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange('newPassword')}
                      disabled={!editMode}
                    />
                    {editMode && (
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    )}
                  </div>
                </div>

                <div className="form-group-modern">
                  <label>Confirm New Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange('confirmPassword')}
                      disabled={!editMode}
                    />
                    {editMode && (
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    )}
                  </div>
                </div>

                {editMode && (
                  <div className="forgot-password-link">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="link-btn"
                    >
                      Forgot your password? Click here to reset
                    </button>
                  </div>
                )}
                  </>
                )}

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

      <ForgotPasswordModal
        open={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </div>
  );
}