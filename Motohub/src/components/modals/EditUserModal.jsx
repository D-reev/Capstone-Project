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
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{user ? "Edit User" : "Add New User"}</h2>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label>Display Name</label>
            <input
              type="text"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              required
            />
          </div>

          {!user && (
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Role</label>
            <select name="role" value={formData.role} onChange={handleChange}>
              <option value="user">User</option>
              <option value="mechanic">Mechanic</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="form-group">
            <label>Status</label>
            <select name="status" value={formData.status} onChange={handleChange}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="banned">Banned</option>
            </select>
          </div>

          <div className="modal-footer">
            <button 
              type="button" 
              className="cancel-btn" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : (user ? "Save Changes" : "Create User")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
