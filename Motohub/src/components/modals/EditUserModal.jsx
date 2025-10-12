import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { doc, updateDoc, getFirestore } from "firebase/firestore";
import "./Modal.css";

export default function EditUserModal({ user, onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    role: "user",
    status: "active",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const db = getFirestore();

  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || "",
        email: user.email || "",
        role: user.role || "user",
        status: user.status || "active",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (user?.id) {
        const userRef = doc(db, 'users', user.id);
        await updateDoc(userRef, {
          displayName: formData.displayName,
          role: formData.role,
          status: formData.status,
          updatedAt: new Date().toISOString()
        });
        
        onSubmit({
          ...formData,
          id: user.id
        });
      }
    } catch (err) {
      setError("Failed to update user. Please try again.");
      console.error("Error updating user:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content advanced-modal" style={{ borderRadius: 18, boxShadow: '0 8px 32px rgba(35,43,62,0.16)', padding: 0, maxWidth: 480, overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ background: 'var(--header-bg)', padding: '1.5rem 2rem 1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1.5rem', color: 'var(--signature-yellow, #FFC300)', letterSpacing: '0.04em' }}>{user ? "Edit User" : "Add New User"}</h2>
          <button className="close-button" onClick={onClose} style={{ background: 'rgba(0,0,0,0.04)', borderRadius: 8, border: 'none', padding: 6, cursor: 'pointer' }}>
            <X size={20} color="var(--signature-yellow, #FFC300)" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form" style={{ padding: '2rem', background: '#fff' }}>
          {error && <div className="error-message" style={{ color: '#ef4444', marginBottom: 12 }}>{error}</div>}

          <div className="form-group" style={{ marginBottom: 18 }}>
            <label style={{ fontWeight: 600, marginBottom: 6, display: 'block', color: '#232b3e' }}>Display Name</label>
            <input
              type="text"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '1rem', background: '#f9fafb', marginTop: 2 }}
            />
          </div>

          {!user && (
            <div className="form-group" style={{ marginBottom: 18 }}>
              <label style={{ fontWeight: 600, marginBottom: 6, display: 'block', color: '#232b3e' }}>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '1rem', background: '#f9fafb', marginTop: 2 }}
              />
            </div>
          )}

          <div className="form-group" style={{ marginBottom: 18 }}>
            <label style={{ fontWeight: 600, marginBottom: 6, display: 'block', color: '#232b3e' }}>Role</label>
            <select name="role" value={formData.role} onChange={handleChange} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '1rem', background: '#f9fafb', marginTop: 2 }}>
              <option value="user">User</option>
              <option value="mechanic">Mechanic</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 18 }}>
            <label style={{ fontWeight: 600, marginBottom: 6, display: 'block', color: '#232b3e' }}>Status</label>
            <select name="status" value={formData.status} onChange={handleChange} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '1rem', background: '#f9fafb', marginTop: 2 }}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="banned">Banned</option>
            </select>
          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: 24 }}>
            <button 
              type="button" 
              className="cancel-btn" 
              onClick={onClose}
              disabled={isSubmitting}
              style={{ background: '#f3f4f6', color: '#232b3e', borderRadius: 8, border: 'none', padding: '0.75rem 2rem', fontWeight: 600, fontSize: '1rem', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={isSubmitting}
              style={{ background: 'var(--header-bg)', color: '#fff', borderRadius: 8, border: 'none', padding: '0.75rem 2rem', fontWeight: 600, fontSize: '1rem', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
            >
              {isSubmitting ? "Saving..." : (user ? "Save Changes" : "Create User")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
