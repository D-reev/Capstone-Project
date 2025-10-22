import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, updateUserProfile } from '../utils/auth';
import { Menu, User, Save, RotateCcw, Edit2, Lock } from 'lucide-react';
import UserSidebar from '../components/UserSidebar';
import logo from '../assets/images/logo.jpeg';
import '../css/ProfileSection.css';
import Loading from '../components/Loading';

export default function ProfileSection() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
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

  const isIncomplete = () => {
    return !profile.address?.trim() || !profile.phoneNumber?.trim() || !profile.googleEmail?.trim();
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
      setMessage('Profile saved successfully!');
      setEditMode(false);
      setTimeout(() => setMessage(null), 3000);
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
        sidebarOpen={sidebarOpen}
        user={user}
        className={`customer-sidebar${sidebarOpen ? '' : ' collapsed'}${sidebarMobileOpen ? ' open' : ''}`}
        onCloseMobile={() => setSidebarMobileOpen(false)}
      />

      <div className="profile-main-content">
        {/* Top Bar */}
        <div className="profile-top-bar">
          <div className="profile-top-bar-left">
            <button
              onClick={() => {
                if (window.innerWidth <= 768) {
                  setSidebarMobileOpen(!sidebarMobileOpen);
                } else {
                  setSidebarOpen(!sidebarOpen);
                }
              }}
              className="profile-menu-btn"
            >
              <Menu size={20} />
            </button>
            <h1 className="profile-top-bar-title">PROFILE</h1>
          </div>
          <div className="profile-top-bar-logo">
            <div className="logo-image" style={{ backgroundImage: `url(${logo})` }} />
          </div>
        </div>

        {/* Main Content */}
        <div className="profile-content-area">
          <div className="profile-header">
            <div className="profile-header-text">
              <h2 className="profile-title">My Profile</h2>
              <p className="profile-subtitle">
                Manage your personal information and contact details
              </p>
            </div>
            {!editMode && (
              <button onClick={() => setEditMode(true)} className="edit-profile-btn">
                <Edit2 size={18} />
                Edit Profile
              </button>
            )}
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

          {/* Profile Form */}
          <div className="profile-form-container">
            <form onSubmit={handleSave} className="profile-form">
              {/* Name Fields */}
              <div className="form-row">
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    placeholder="Enter first name"
                    value={profile.firstName}
                    onChange={handleChange('firstName')}
                    disabled={!editMode}
                    required
                    className={!editMode ? 'disabled' : ''}
                  />
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    placeholder="Enter last name"
                    value={profile.lastName}
                    onChange={handleChange('lastName')}
                    disabled={!editMode}
                    required
                    className={!editMode ? 'disabled' : ''}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Middle Name</label>
                <input
                  type="text"
                  placeholder="Enter middle name (optional)"
                  value={profile.middleName}
                  onChange={handleChange('middleName')}
                  disabled={!editMode}
                  className={!editMode ? 'disabled' : ''}
                />
              </div>

              {/* Address Fields */}
              <div className="form-group">
                <label>Address *</label>
                <input
                  type="text"
                  placeholder="Street address, building, unit number"
                  value={profile.address}
                  onChange={handleChange('address')}
                  disabled={!editMode}
                  required
                  className={!editMode ? 'disabled' : ''}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    placeholder="Enter city"
                    value={profile.city}
                    onChange={handleChange('city')}
                    disabled={!editMode}
                    className={!editMode ? 'disabled' : ''}
                  />
                </div>
                <div className="form-group">
                  <label>Postal Code</label>
                  <input
                    type="text"
                    placeholder="Enter postal code"
                    value={profile.postalCode}
                    onChange={handleChange('postalCode')}
                    disabled={!editMode}
                    className={!editMode ? 'disabled' : ''}
                  />
                </div>
              </div>

              {/* Contact Fields */}
              <div className="form-group">
                <label>Mobile Number *</label>
                <input
                  type="tel"
                  placeholder="Enter mobile number"
                  value={profile.phoneNumber}
                  onChange={handleChange('phoneNumber')}
                  disabled={!editMode}
                  required
                  className={!editMode ? 'disabled' : ''}
                />
              </div>

              <div className="form-group">
                <label className="label-with-icon">
                  Google Email (Gmail)
                  <Lock size={14} className="lock-icon" />
                </label>
                <input
                  type="email"
                  placeholder="your.email@gmail.com"
                  value={profile.googleEmail}
                  disabled={true}
                  className="email-locked"
                />
                <p className="field-helper-text">
                  Email cannot be changed for security reasons
                </p>
              </div>

              {/* Action Buttons */}
              {editMode && (
                <div className="form-actions">
                  <button type="submit" className="save-btn" disabled={saving}>
                    <Save size={18} />
                    {saving ? 'Saving…' : 'Save Profile'}
                  </button>
                  <button type="button" className="reset-btn" onClick={handleReset} disabled={saving}>
                    <RotateCcw size={16} />
                    Reset
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}