import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, updateUserProfile } from '../utils/auth';
import '../css/UserDashboard.css'; // reuse existing styles (adjust if you have a dedicated profile css)

export default function ProfileSection() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    // consider profile incomplete if address, phone or googleEmail missing
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
      setMessage('Profile saved successfully.');
    } catch (err) {
      console.error('save profile error', err);
      setError(err?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Loading profile…</div>;

  return (
    <div className="profile-page-container">
      {isIncomplete() && (
        <div className="profile-notice" style={{ marginBottom: 16, padding: 12, borderRadius: 8, background: '#fff7ed', color: '#92400e' }}>
          <strong>Complete your profile</strong>
          <div style={{ marginTop: 6 }}>
            Please complete your address and mobile number and connect a verified Gmail account so we can send notifications and enable password recovery.
          </div>
        </div>
      )}

      <div className="profile-card" style={{ padding: 16, borderRadius: 8, background: '#fff' }}>
        <h2 style={{ marginTop: 0 }}>My Profile</h2>

        {message && <div className="success-message" style={{ marginBottom: 8 }}>{message}</div>}
        {error && <div className="error-message" style={{ marginBottom: 8 }}>{error}</div>}

        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <input className="input-field" placeholder="First name" value={profile.firstName} onChange={handleChange('firstName')} required />
            <input className="input-field" placeholder="Last name" value={profile.lastName} onChange={handleChange('lastName')} required />
          </div>

          <input className="input-field" placeholder="Middle name (optional)" value={profile.middleName} onChange={handleChange('middleName')} />

          <input className="input-field" placeholder="Address (street, number)" value={profile.address} onChange={handleChange('address')} required />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <input className="input-field" placeholder="City" value={profile.city} onChange={handleChange('city')} />
            <input className="input-field" placeholder="Postal code" value={profile.postalCode} onChange={handleChange('postalCode')} />
          </div>

          <input className="input-field" placeholder="Mobile number" value={profile.phoneNumber} onChange={handleChange('phoneNumber')} required />

          <input className="input-field" placeholder="Google email (Gmail) to connect" value={profile.googleEmail} onChange={handleChange('googleEmail')} />

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button type="submit" className="primary-btn" disabled={saving}>
              {saving ? 'Saving…' : 'Save Profile'}
            </button>
            <button type="button" className="cancel-btn" onClick={() => {
              // reset to last saved
              (async () => {
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
              })();
            }} disabled={saving}>
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}