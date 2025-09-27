import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getFirestore, collection, getDocs, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { Users, Pencil, Trash2, Search, UserPlus, Menu, Mail, Calendar, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import EditUserModal from '../components/modals/EditUserModal';
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
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Handle sidebar toggle
  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Handle user selection with smooth transitions
  // Toggle: clicking the same user again will close the profile panel
  const handleUserSelect = (userToSelect) => {
    setSelectedUser(prev => (prev && prev.id === userToSelect.id) ? null : userToSelect);
  };

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
        if (selectedUser?.id === userId) {
          setSelectedUser(null);
        }
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

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [filteredUsers.length, totalPages]);

  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getUserInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleRowClick = (user, e) => {
    // Don't select user if clicking on action buttons
    if (e.target.closest('.user-table-action-btn')) return;
    handleUserSelect(user);
  };

  if (loading) {
    return (
      <div className="user-management-bg">
        <AdminSidebar sidebarOpen={sidebarOpen} user={user} />
        <div className="main-content">
          <TopBar
            title="User Management"
            onToggle={() => setSidebarOpen(!sidebarOpen)}
            notificationsCount={0}
            onProfileClick={() => setProfileOpen(true)}
          />
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="user-management-bg users-page">
      <AdminSidebar sidebarOpen={sidebarOpen} user={user} />

      <div className={`main-content ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        <TopBar
          title="User Management"
          onToggle={handleSidebarToggle}
          notificationsCount={0}
          onProfileClick={() => setProfileOpen(true)}
        />

        <div className={`user-management-container ${!selectedUser ? 'single-column' : ''}`}>
          {/* Main Table Section */}
          <div className="user-table-section">
            <div className="user-table-header">
              <h1 className="user-table-title">Users</h1>
              <div className="user-table-actions">
                <div className="user-table-search">
                  <Search size={18} />
                  <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button 
                  className="user-table-add-btn" 
                  onClick={() => {
                    setSelectedUser(null);
                    setIsEditModalOpen(true);
                  }}
                >
                  <UserPlus size={16} />
                  Add User
                </button>
              </div>
            </div>

            <div className="user-table-container">
              <table className="user-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        {searchTerm ? 'No users found matching your search.' : 'No users available.'}
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map(u => (
                      <tr 
                        key={u.id} 
                        onClick={(e) => handleRowClick(u, e)}
                        className={selectedUser?.id === u.id ? 'selected' : ''}
                      >
                        <td>
                          <div className="user-table-user">
                            <div className="user-table-avatar">
                              {u.photoURL ? (
                                <img src={u.photoURL} alt={u.displayName} />
                              ) : (
                                getUserInitials(u.displayName)
                              )}
                            </div>
                            <span className="user-table-name">
                              {u.displayName || 'Unknown User'}
                            </span>
                          </div>
                        </td>
                        <td>{u.email || 'No email'}</td>
                        <td>
                          <span className={`role-badge ${u.role || 'user'}`}>
                            {u.role || 'user'}
                          </span>
                        </td>
                        <td>{formatDate(u.createdAt)}</td>
                        <td>
                          <span className={`user-status-badge ${u.status || 'active'}`}>
                            {u.status || 'active'}
                          </span>
                        </td>
                        <td className="user-table-actions-col">
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setSelectedUser(u); 
                              setIsEditModalOpen(true); 
                            }} 
                            className="user-table-action-btn edit"
                            title="Edit user"
                          >
                            <Pencil size={16} />
                          </button>
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              handleDeleteUser(u.id); 
                            }} 
                            className="user-table-action-btn delete"
                            title="Delete user"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="user-table-pagination">
              {totalPages > 1 && (
                <div className="user-table-pagination">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      className={`user-table-pagination-btn ${currentPage === i + 1 ? 'active' : ''}`}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* User Profile Panel */}
          {selectedUser && (
            <div className={`user-profile-panel ${selectedUser ? 'active' : ''}`}>
              <div className="user-profile-header">
                <div className="user-profile-avatar">
                  {selectedUser.photoURL ? (
                    <img src={selectedUser.photoURL} alt={selectedUser.displayName} />
                  ) : (
                    getUserInitials(selectedUser.displayName)
                  )}
                </div>
                <h3 className="user-profile-name">
                  {selectedUser.displayName || 'Unknown User'}
                </h3>
                <p className="user-profile-email">{selectedUser.email}</p>
                <div className="user-profile-status">
                  <span className={`user-status-badge ${selectedUser.status || 'active'}`}>
                    {selectedUser.status || 'active'}
                  </span>
                </div>
              </div>

              <div className="user-profile-content">
                <div className="user-profile-info">
                  <div className="user-profile-info-row">
                    <Mail className="icon" size={16} />
                    <span>{selectedUser.email || 'No email provided'}</span>
                  </div>
                  <div className="user-profile-info-row">
                    <User className="icon" size={16} />
                    <span>{selectedUser.role || 'user'}</span>
                  </div>
                  <div className="user-profile-info-row">
                    <Calendar className="icon" size={16} />
                    <span>Joined {formatDate(selectedUser.createdAt)}</span>
                  </div>
                </div>

                <div className="user-profile-quick-stats">
                  <div className="user-profile-stat">
                    <span>0%</span>
                    <span className="user-profile-stat-label">Acceptance Rate</span>
                  </div>
                  <div className="user-profile-stat">
                    <span>0.0</span>
                    <span className="user-profile-stat-label">Rating</span>
                  </div>
                </div>

                <div className="user-profile-booking-stats">
                  <div className="stat">
                    <span>0</span>
                    <span className="stat-label">Completed</span>
                  </div>
                  <div className="stat">
                    <span>0</span>
                    <span className="stat-label">Confirmed</span>
                  </div>
                  <div className="stat">
                    <span>0</span>
                    <span className="stat-label">Cancelled</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {isEditModalOpen && (
        <EditUserModal
          open={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          onSave={selectedUser ? handleEditUser : handleAddUser}
          isSubmitting={isSubmitting}
        />
      )}

      <ProfileModal 
        open={profileOpen} 
        onClose={() => setProfileOpen(false)} 
        user={user} 
      />
    </div>
  );
}