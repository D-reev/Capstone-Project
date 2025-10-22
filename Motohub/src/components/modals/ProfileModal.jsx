import React, { useEffect, useState } from 'react';
import './Modal.css';
import { getUserProfile, updateUserProfile } from '../../utils/auth';

export default function ProfileModal({ open, onClose, user, onSaved }) {
  if (!open || !user) return null;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    address: '',
    city: '',
    postalCode: ''
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const profile = await getUserProfile(user.uid);
        if (!mounted) return;
        setForm({
          firstName: profile?.firstName ?? '',
          middleName: profile?.middleName ?? '',
          lastName: profile?.lastName ?? '',
          email: profile?.googleEmail ?? profile?.email ?? user.email ?? '',
          phoneNumber: profile?.phoneNumber ?? '',
          address: profile?.address ?? '',
          city: profile?.city ?? '',
          postalCode: profile?.postalCode ?? ''
        });
      } catch (err) {
        console.error('ProfileModal load error', err);
        setError('Failed to load profile');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [user]);

  const onChange = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSave = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setError('');
    try {
      const updates = {
        firstName: form.firstName || null,
        middleName: form.middleName || null,
        lastName: form.lastName || null,
        googleEmail: form.email || null,
        phoneNumber: form.phoneNumber || null,
        address: form.address || null,
        city: form.city || null,
        postalCode: form.postalCode || null,
        updatedAt: new Date().toISOString()
      };
      await updateUserProfile(user.uid, updates);
      if (typeof onSaved === 'function') onSaved(updates);
      onClose();
      alert('Profile saved. Please connect a verified Gmail for notifications if you have not done so.');
    } catch (err) {
      console.error('ProfileModal save error', err);
      setError(err?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Profile</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <form className="modal-body" onSubmit={handleSave}>
          {error && <div className="error-message">{error}</div>}
          {loading ? (
            <div>Loading…</div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
                <input className="input-field" placeholder="First name" value={form.firstName} onChange={onChange('firstName')} required />
                <input className="input-field" placeholder="Last name" value={form.lastName} onChange={onChange('lastName')} required />
              </div>

              <input className="input-field" placeholder="Middle name (optional)" value={form.middleName} onChange={onChange('middleName')} />

              <input className="input-field" placeholder="Gmail (connect verified Gmail here)" value={form.email} onChange={onChange('email')} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
                <input className="input-field" placeholder="Phone number" value={form.phoneNumber} onChange={onChange('phoneNumber')} />
                <input className="input-field" placeholder="Postal code" value={form.postalCode} onChange={onChange('postalCode')} />
              </div>

              <input className="input-field" placeholder="City" value={form.city} onChange={onChange('city')} />
              <input className="input-field" placeholder="Address (street, number)" value={form.address} onChange={onChange('address')} />

              <div className="modal-actions">
                <button type="submit" className="primary-btn" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
                <button type="button" className="cancel-btn" onClick={onClose} disabled={saving}>Cancel</button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}