import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, updateUserProfile } from '../utils/auth';
import { Menu, User, MapPin, Phone, Mail, Save, RotateCcw } from 'lucide-react';
import UserSidebar from '../components/UserSidebar';
import logo from '../assets/images/logo.jpeg';
import '../css/UserDashboard.css';

export default function ProfileSection() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  if (loading) {
    return (
      <div className="customer-dashboard-container">
        <UserSidebar 
          sidebarOpen={sidebarOpen}
          user={user}
          className={`customer-sidebar${sidebarOpen ? '' : ' collapsed'}${sidebarMobileOpen ? ' open' : ''}`}
          onCloseMobile={() => setSidebarMobileOpen(false)}
        />
        <div className="customer-main-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-dashboard-container">
      <UserSidebar 
        sidebarOpen={sidebarOpen}
        user={user}
        className={`customer-sidebar${sidebarOpen ? '' : ' collapsed'}${sidebarMobileOpen ? ' open' : ''}`}
        onCloseMobile={() => setSidebarMobileOpen(false)}
      />

      <div className="customer-main-content">
        {/* Top Bar */}
        <div className="customer-top-bar" style={{position: 'relative', background: 'var(--header-bg)', color: '#fff', minHeight: 64, display: 'flex', alignItems: 'center', boxShadow: '0 2px 8px rgba(35,43,62,0.06)', zIndex: 1}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
            <button
              onClick={() => {
                if (window.innerWidth <= 768) {
                  setSidebarMobileOpen(!sidebarMobileOpen);
                } else {
                  setSidebarOpen(!sidebarOpen);
                }
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '0.5rem',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <Menu size={20} color="#fff" />
            </button>
            <h1 style={{
              color: '#FFC300',
              fontWeight: 800,
              letterSpacing: '0.08em',
              fontSize: '1.15rem',
              margin: '0 0 0 0.15rem',
              fontFamily: 'Montserrat, Arial, sans-serif',
              textTransform: 'uppercase',
              textShadow: 'none'
            }}>PROFILE</h1>
          </div>
          <div style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            height: '100%',
            paddingRight: '1rem'
          }}>
            <div style={{
              width: '147px',
              height: '47px',
              background: `url(${logo}) center/contain no-repeat`,
              display: 'block'
            }} />
          </div>
        </div>

        {/* Main Content */}
        <div className="customer-content-area">
          <div style={{marginBottom: '2rem'}}>
            <h2 style={{fontSize: '2rem', fontWeight: '700', color: '#2d3748', marginBottom: '0.25rem'}}>
              My Profile
            </h2>
            <p style={{color: '#718096', fontSize: '1rem'}}>
              Manage your personal information and contact details
            </p>
          </div>

          {/* Alert Messages */}
          {isIncomplete() && (
            <div style={{
              marginBottom: '2rem',
              padding: '1.25rem 1.5rem',
              borderRadius: '1rem',
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%)',
              border: '2px solid rgba(251, 191, 36, 0.3)',
              color: '#92400e'
            }}>
              <div style={{display: 'flex', alignItems: 'start', gap: '1rem'}}>
                <User size={20} style={{flexShrink: 0, marginTop: '0.125rem', color: '#f59e0b'}} />
                <div>
                  <strong style={{fontSize: '1rem', fontWeight: '700', color: '#1a202c', display: 'block', marginBottom: '0.5rem'}}>
                    Complete your profile
                  </strong>
                  <div style={{fontSize: '0.95rem', lineHeight: '1.6', color: '#4a5568'}}>
                    Please complete your address and mobile number and connect a verified Gmail account so we can send notifications and enable password recovery.
                  </div>
                </div>
              </div>
            </div>
          )}

          {message && (
            <div style={{
              marginBottom: '2rem',
              padding: '1.25rem 1.5rem',
              borderRadius: '1rem',
              background: 'linear-gradient(135deg, rgba(72, 187, 120, 0.1) 0%, rgba(48, 164, 108, 0.1) 100%)',
              border: '2px solid rgba(72, 187, 120, 0.3)',
              color: '#065f46',
              fontWeight: '600'
            }}>
              {message}
            </div>
          )}

          {error && (
            <div style={{
              marginBottom: '2rem',
              padding: '1.25rem 1.5rem',
              borderRadius: '1rem',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)',
              border: '2px solid rgba(239, 68, 68, 0.3)',
              color: '#991b1b',
              fontWeight: '600'
            }}>
              {error}
            </div>
          )}

          {/* Profile Form */}
          <div style={{
            background: 'white',
            borderRadius: '1.25rem',
            padding: '2.5rem',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
            border: '1px solid #e2e8f0'
          }}>
            <form onSubmit={handleSave}>
              {/* Name Fields */}
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '1.75rem'}}>
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    placeholder="Enter first name"
                    value={profile.firstName}
                    onChange={handleChange('firstName')}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    placeholder="Enter last name"
                    value={profile.lastName}
                    onChange={handleChange('lastName')}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{marginBottom: '1.75rem'}}>
                <label>Middle Name</label>
                <input
                  type="text"
                  placeholder="Enter middle name (optional)"
                  value={profile.middleName}
                  onChange={handleChange('middleName')}
                />
              </div>

              {/* Address Fields */}
              <div className="form-group" style={{marginBottom: '1.75rem'}}>
                <label>Address *</label>
                <input
                  type="text"
                  placeholder="Street address, building, unit number"
                  value={profile.address}
                  onChange={handleChange('address')}
                  required
                />
              </div>

              <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '1.75rem'}}>
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    placeholder="Enter city"
                    value={profile.city}
                    onChange={handleChange('city')}
                  />
                </div>
                <div className="form-group">
                  <label>Postal Code</label>
                  <input
                    type="text"
                    placeholder="Enter postal code"
                    value={profile.postalCode}
                    onChange={handleChange('postalCode')}
                  />
                </div>
              </div>

              {/* Contact Fields */}
              <div className="form-group" style={{marginBottom: '1.75rem'}}>
                <label>Mobile Number *</label>
                <input
                  type="tel"
                  placeholder="Enter mobile number"
                  value={profile.phoneNumber}
                  onChange={handleChange('phoneNumber')}
                  required
                />
              </div>

              <div className="form-group" style={{marginBottom: '2.5rem'}}>
                <label>Google Email (Gmail)</label>
                <input
                  type="email"
                  placeholder="your.email@gmail.com"
                  value={profile.googleEmail}
                  onChange={handleChange('googleEmail')}
                />
              </div>

              {/* Action Buttons */}
              <div style={{display: 'flex', gap: '1rem'}}>
                <button
                  type="submit"
                  className="save-btn"
                  disabled={saving}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    justifyContent: 'center'
                  }}
                >
                  <Save size={18} />
                  {saving ? 'Saving…' : 'Save Profile'}
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={handleReset}
                  disabled={saving}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    justifyContent: 'center'
                  }}
                >
                  <RotateCcw size={18} />
                  Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}