import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getFirestore, collection, getDocs, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { Users, Pencil, Trash2, Search, UserPlus, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar'; // Fixed path
import EditUserModal from '../components/modals/EditUserModal'; // Fixed path
import TopBar from '../components/TopBar';
import ProfileModal from '../components/modals/ProfileModal';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import '../css/UserManagement.css';

export default function UserManagement() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const db = getFirestore();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const usersCollection = collection(db, 'users');
      const userSnapshot = await getDocs(usersCollection);
      const userList = userSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(userList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };

  const handleEditUser = async (updates) => {
    setIsSubmitting(true);
    try {
      const userRef = doc(db, 'users', selectedUser.id);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      await fetchUsers();
      setIsEditModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleAddUser = async (userData) => {
    setIsSubmitting(true);
    try {
      let uid;
      if (!selectedUser) {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          userData.email,
          'tempPassword123'
        );
        uid = userCredential.user.uid;
      }

      const userRef = doc(db, 'users', selectedUser?.id || uid);
      await setDoc(userRef, {
        displayName: userData.displayName,
        role: userData.role,
        status: userData.status,
        updatedAt: new Date().toISOString(),
        ...((!selectedUser) && {
          createdAt: new Date().toISOString(),
          email: userData.email
        })
      }, { merge: true });

      await fetchUsers();
      setIsEditModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error adding user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-container">
      <AdminSidebar sidebarOpen={sidebarOpen} user={user} />

      <div className="main-content">
        <TopBar
          title="User Management"
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          notificationsCount={0}
          onProfileClick={() => setProfileOpen(true)}
        />

        <div className="content-area">
          <div className="inventory-header">
            <h1>User Management</h1>
            <div className="inventory-actions">
              <div className="search-container">
                <Search size={20} />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button className="add-part-btn" onClick={() => {
                setSelectedUser(null);
                setIsEditModalOpen(true);
              }}>
                <UserPlus size={20} />
                Add New User
              </button>
            </div>
          </div>

          <div className="inventory-grid">
            <div className="parts-list">
              <table className="parts-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id} onClick={() => setSelectedUser(user)}>
                      <td>
                        <div className="user-info-cell">
                          {user.photoURL ? (
                            <img src={user.photoURL} alt={user.displayName} className="user-avatar-small" />
                          ) : (
                            <Users size={24} className="user-avatar-icon" />
                          )}
                          <span>{user.displayName || 'No Name'}</span>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td><span className={`role-badge ${user.role}`}>{user.role || 'user'}</span></td>
                      <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
                      <td><span className={`status-badge ${user.status || 'active'}`}>{user.status || 'Active'}</span></td>
                      <td>
                        <button onClick={(e) => { e.stopPropagation(); setSelectedUser(user); setIsEditModalOpen(true); }}>
                          <Pencil size={16} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteUser(user.id); }}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedUser && (
              <div className="part-details">
                <h2>User Details</h2>
                <div className="part-info">
                  <div className="user-profile-header">
                    {selectedUser.photoURL ? (
                      <img src={selectedUser.photoURL} alt={selectedUser.displayName} className="user-avatar-large" />
                    ) : (
                      <Users size={64} className="user-avatar-icon-large" />
                    )}
                    <h3>{selectedUser.displayName || 'No Name'}</h3>
                  </div>
                  <div className="details-grid">
                    <div><label>Email</label><span>{selectedUser.email}</span></div>
                    <div><label>Role</label><span className={`role-badge ${selectedUser.role}`}>{selectedUser.role || 'user'}</span></div>
                    <div><label>Status</label><span className={`status-badge ${selectedUser.status || 'active'}`}>{selectedUser.status || 'Active'}</span></div>
                    <div><label>Joined Date</label><span>{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'N/A'}</span></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} user={user} />
    </div>
  );
}
