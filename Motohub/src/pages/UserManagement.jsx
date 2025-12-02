import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import Loading from '../components/Loading';
import { getFirestore, collection, getDocs, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { SearchOutlined, UserAddOutlined, EditOutlined, DeleteOutlined, FilterOutlined } from '@ant-design/icons';
import { ChevronDown, Mail, Phone, MapPin } from 'lucide-react';
import { Table, Tag, Input, Button, Space, Avatar, ConfigProvider, Select } from 'antd';
import AdminSidebar from '../components/AdminSidebar';
import SuperAdminSidebar from '../components/SuperAdminSidebar';
import EditUserModal from '../components/modals/EditUserModal';
import DeleteUserModal from '../components/modals/DeleteUserModal';
import NavigationBar from '../components/NavigationBar';
import ProfileModal from '../components/modals/ProfileModal';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import '../css/UserManagement.css';

const { Option } = Select;

export default function UserManagement() {
  const { sidebarOpen } = useSidebar();
  const [profileOpen, setProfileOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [expandedMobileCards, setExpandedMobileCards] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { user } = useAuth();
  const db = getFirestore();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
      setExpandedRowKeys([]);
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    setIsSubmitting(true);
    try {
      await deleteDoc(doc(db, 'users', userToDelete.id));
      await fetchUsers();
      if (expandedRowKeys.includes(userToDelete.id)) {
        setExpandedRowKeys([]);
      }
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddUser = async (userData) => {
    setIsSubmitting(true);
    try {
      let uid;
      if (!selectedUser) {
        // Create new user with the password provided in the form
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          userData.email,
          userData.password || 'tempPassword123' // Use form password or fallback
        );
        uid = userCredential.user.uid;
      }

      const userRef = doc(db, 'users', selectedUser?.id || uid);
      await setDoc(userRef, {
        displayName: userData.displayName,
        firstName: userData.firstName,
        middleName: userData.middleName || '',
        lastName: userData.lastName,
        role: userData.role,
        status: userData.status || 'active',
        address: userData.address || '',
        city: userData.city || '',
        postalCode: userData.postalCode || '',
        phoneNumber: userData.phoneNumber || '',
        mobileNumber: userData.phoneNumber || '',
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

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.displayName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

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

  const handleRowExpand = (expanded, record) => {
    const keys = expanded ? [record.id] : [];
    setExpandedRowKeys(keys);
  };

  const handleRowClick = (record) => {
    // Toggle expansion on row click
    const isExpanded = expandedRowKeys.includes(record.id);
    setExpandedRowKeys(isExpanded ? [] : [record.id]);
  };

  const toggleMobileCard = (userId) => {
    setExpandedMobileCards(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Expanded row render - More Info section
  const expandedRowRender = (record) => {
    return (
      <div className="user-expanded-info">
        <div className="user-expanded-grid">
          <div className="user-expanded-item">
            <span className="user-expanded-label">User ID</span>
            <span className="user-expanded-value">{record.id || 'N/A'}</span>
          </div>
          <div className="user-expanded-item">
            <span className="user-expanded-label">Phone Number</span>
            <span className="user-expanded-value">{record.phoneNumber || record.number || 'Not provided'}</span>
          </div>
          <div className="user-expanded-item">
            <span className="user-expanded-label">Full Address</span>
            <span className="user-expanded-value">
              {record.address ? 
                `${record.address}${record.city ? `, ${record.city}` : ''}${record.postalCode ? ` ${record.postalCode}` : ''}` 
                : 'Not provided'
              }
            </span>
          </div>
          <div className="user-expanded-item">
            <span className="user-expanded-label">Last Updated</span>
            <span className="user-expanded-value">{formatDate(record.updatedAt)}</span>
          </div>
        </div>
        <div className="user-expanded-actions">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedUser(record);
              setIsEditModalOpen(true);
            }}
            style={{
              background: '#FBBF24',
              borderColor: '#FBBF24',
              color: '#111827',
              fontWeight: 600,
            }}
          >
            Edit User
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              setUserToDelete(record);
              setIsDeleteModalOpen(true);
            }}
          >
            Delete User
          </Button>
        </div>
      </div>
    );
  };

  // Table columns configuration
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (text) => (
        <span style={{ fontFamily: 'monospace', color: '#6B7280', fontSize: '13px' }}>
          {text?.substring(0, 8) || 'N/A'}
        </span>
      ),
    },
    {
      title: 'Full Name',
      dataIndex: 'displayName',
      key: 'displayName',
      render: (text, record) => (
        <Space>
          <Avatar 
            size={40}
            style={{ 
              backgroundColor: '#FEF3C7', 
              color: '#D97706',
              fontWeight: 600,
              border: '2px solid #FBBF24'
            }}
            src={record.photoURL}
          >
            {getUserInitials(text)}
          </Avatar>
          <span style={{ fontWeight: 500, color: '#111827' }}>
            {text || 'Unknown User'}
          </span>
        </Space>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (text) => (
        <span style={{ color: '#6B7280' }}>{text || 'No email'}</span>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role) => {
        const roleConfig = {
          admin: { color: '#DC2626', bg: '#FEE2E2', label: 'Admin' },
          mechanic: { color: '#2563EB', bg: '#DBEAFE', label: 'Mechanic' },
          user: { color: '#059669', bg: '#D1FAE5', label: 'User' },
        };
        const config = roleConfig[role] || roleConfig.user;
        return (
          <Tag 
            style={{ 
              backgroundColor: config.bg,
              color: config.color,
              border: 'none',
              borderRadius: '6px',
              padding: '4px 12px',
              fontWeight: 500,
              fontSize: '13px'
            }}
          >
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: 'Last Activity',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date) => (
        <span style={{ color: '#6B7280', fontSize: '13px' }}>
          {formatDate(date)}
        </span>
      ),
    },
  ];

  if (loading) {
    return <Loading text="Loading users..." />;
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#FBBF24',
          colorLink: '#FBBF24',
          colorLinkHover: '#D97706',
          borderRadius: 8,
        },
        components: {
          Table: {
            headerBg: '#1F2937',
            headerColor: '#FFFFFF',
            rowHoverBg: '#F8FAFC',
          },
        },
      }}
    >
      <div className="user-management-page">
        {user?.role === 'superadmin' ? <SuperAdminSidebar /> : <AdminSidebar />}

        <div className={`main-content ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
          <NavigationBar
            title="User Management"
            onProfileClick={() => setProfileOpen(true)}
            userRole="admin"
            userName={user?.displayName || 'Admin'}
            userEmail={user?.email || ''}
          />

          <div className="user-management-container">
            <div className="user-table-card">
              <div className="user-table-header">
                <div className="user-table-header-left">
                  <h1 className="user-table-title">Users Data</h1>
                  <span className="user-table-subtitle">
                    Showing {filteredUsers.length} of {users.length} entries
                  </span>
                </div>
                <div className="user-table-actions">
                  <Select
                    value={roleFilter}
                    onChange={(value) => setRoleFilter(value)}
                    style={{ 
                      width: 160,
                      borderRadius: 8,
                    }}
                    size="large"
                    suffixIcon={<FilterOutlined />}
                    placement={isMobile ? "topLeft" : "bottomLeft"}
                    getPopupContainer={(trigger) => trigger.parentNode}
                  >
                    <Option value="all">All Roles</Option>
                    <Option value="admin">Admin</Option>
                    <Option value="mechanic">Mechanic</Option>
                    <Option value="user">User</Option>
                  </Select>
                  <Input
                    placeholder="Search users..."
                    prefix={<SearchOutlined style={{ color: '#9CA3AF' }} />}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ 
                      width: 280,
                      borderRadius: 8,
                    }}
                    size="large"
                  />
                  <Button 
                    type="primary"
                    icon={<UserAddOutlined />}
                    size="large"
                    onClick={() => {
                      setSelectedUser(null);
                      setIsEditModalOpen(true);
                    }}
                    style={{
                      background: '#FBBF24',
                      borderColor: '#FBBF24',
                      color: '#111827',
                      fontWeight: 600,
                      borderRadius: 8,
                    }}
                  >
                    Add User
                  </Button>
                </div>
              </div>

              <div className="user-table-container">
                <Table
                  columns={columns}
                  dataSource={filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)}
                  rowKey="id"
                  expandable={{
                    expandedRowRender,
                    expandedRowKeys,
                    onExpand: handleRowExpand,
                    expandIcon: () => null, // Hide expand icon
                  }}
                  onRow={(record) => ({
                    onClick: () => handleRowClick(record),
                    style: { cursor: 'pointer' }
                  })}
                  pagination={false}
                  locale={{
                    emptyText: searchTerm ? 'No users found matching your search.' : 'No users available.'
                  }}
                  className="user-data-table"
                />

                {/* Mobile Card List */}
                <div className="user-mobile-list">
                  {filteredUsers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                      {searchTerm ? 'No users found matching your search.' : 'No users available.'}
                    </div>
                  ) : (
                    filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((userItem) => {
                      const isExpanded = expandedMobileCards.includes(userItem.id);
                      return (
                        <div 
                          key={userItem.id} 
                          className="user-mobile-card"
                        >
                          <div 
                            className="user-mobile-card-header"
                            onClick={() => toggleMobileCard(userItem.id)}
                          >
                            <div className="user-mobile-info">
                              <div className="user-mobile-name">{userItem.displayName || userItem.name || 'No Name'}</div>
                              <div className="user-mobile-email">
                                <Mail style={{ fontSize: 12 }} />
                                {userItem.email || 'No email'}
                              </div>
                            </div>
                            <ChevronDown 
                              className={`user-mobile-toggle ${isExpanded ? 'expanded' : ''}`}
                              style={{ fontSize: 20 }}
                            />
                          </div>

                          <div className="user-mobile-meta">
                            <span className="user-mobile-badge role">
                              {userItem.role ? userItem.role.charAt(0).toUpperCase() + userItem.role.slice(1) : 'N/A'}
                            </span>
                            <span className={`user-mobile-badge status-${userItem.status === 'active' ? 'active' : 'inactive'}`}>
                              {userItem.status ? userItem.status.charAt(0).toUpperCase() + userItem.status.slice(1) : 'Active'}
                            </span>
                          </div>

                          {isExpanded && (
                            <div className="user-mobile-expanded">
                              <div className="user-mobile-detail">
                                <span className="user-mobile-detail-label">Phone</span>
                                <span className="user-mobile-detail-value">{userItem.phoneNumber || userItem.number || 'Not provided'}</span>
                              </div>
                              <div className="user-mobile-detail">
                                <span className="user-mobile-detail-label">Address</span>
                                <span className="user-mobile-detail-value">
                                  {userItem.address ? 
                                    `${userItem.address}${userItem.city ? `, ${userItem.city}` : ''}${userItem.postalCode ? ` ${userItem.postalCode}` : ''}` 
                                    : 'Not provided'
                                  }
                                </span>
                              </div>
                              <div className="user-mobile-detail">
                                <span className="user-mobile-detail-label">Created</span>
                                <span className="user-mobile-detail-value">{formatDate(userItem.createdAt)}</span>
                              </div>
                              <div className="user-mobile-detail">
                                <span className="user-mobile-detail-label">Last Updated</span>
                                <span className="user-mobile-detail-value">{formatDate(userItem.updatedAt)}</span>
                              </div>

                              <div className="user-mobile-actions">
                                <button
                                  className="user-mobile-edit"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedUser(userItem);
                                    setIsEditModalOpen(true);
                                  }}
                                >
                                  <EditOutlined />
                                  Edit
                                </button>
                                <button
                                  className="user-mobile-delete"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setUserToDelete(userItem);
                                    setIsDeleteModalOpen(true);
                                  }}
                                >
                                  <DeleteOutlined />
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })  
                  )}
                </div>

                {/* Pagination Controls */}
                {filteredUsers.length > itemsPerPage && (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '16px 24px',
                    borderTop: '1px solid #e5e7eb',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <span style={{ 
                      color: '#6B7280',
                      fontSize: '14px'
                    }}>
                      {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} entries
                    </span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        style={{
                          width: '32px',
                          height: '32px',
                          background: currentPage === 1 ? '#f3f4f6' : 'linear-gradient(135deg, #FFC300 0%, #FFD54F 100%)',
                          color: currentPage === 1 ? '#9ca3af' : '#000',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        &lt;&lt;
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        style={{
                          width: '32px',
                          height: '32px',
                          background: currentPage === 1 ? '#f3f4f6' : 'linear-gradient(135deg, #FFC300 0%, #FFD54F 100%)',
                          color: currentPage === 1 ? '#9ca3af' : '#000',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          fontWeight: '600'
                        }}
                      >
                        &lt;
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={Math.ceil(filteredUsers.length / itemsPerPage)}
                        value={currentPage}
                        onChange={(e) => {
                          const page = parseInt(e.target.value);
                          if (page >= 1 && page <= Math.ceil(filteredUsers.length / itemsPerPage)) {
                            setCurrentPage(page);
                          }
                        }}
                        style={{
                          width: '50px',
                          height: '32px',
                          textAlign: 'center',
                          background: '#fff',
                          color: '#374151',
                          border: '1px solid #FFC300',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '600'
                        }}
                      />
                      <span style={{ color: '#FFC300', fontSize: '14px', fontWeight: '600' }}>of {Math.ceil(filteredUsers.length / itemsPerPage)}</span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredUsers.length / itemsPerPage)))}
                        disabled={currentPage >= Math.ceil(filteredUsers.length / itemsPerPage)}
                        style={{
                          width: '32px',
                          height: '32px',
                          background: currentPage >= Math.ceil(filteredUsers.length / itemsPerPage) ? '#f3f4f6' : 'linear-gradient(135deg, #FFC300 0%, #FFD54F 100%)',
                          color: currentPage >= Math.ceil(filteredUsers.length / itemsPerPage) ? '#9ca3af' : '#000',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: currentPage >= Math.ceil(filteredUsers.length / itemsPerPage) ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          fontWeight: '600'
                        }}
                      >
                        &gt;
                      </button>
                      <button
                        onClick={() => setCurrentPage(Math.ceil(filteredUsers.length / itemsPerPage))}
                        disabled={currentPage >= Math.ceil(filteredUsers.length / itemsPerPage)}
                        style={{
                          width: '32px',
                          height: '32px',
                          background: currentPage >= Math.ceil(filteredUsers.length / itemsPerPage) ? '#f3f4f6' : 'linear-gradient(135deg, #FFC300 0%, #FFD54F 100%)',
                          color: currentPage >= Math.ceil(filteredUsers.length / itemsPerPage) ? '#9ca3af' : '#000',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: currentPage >= Math.ceil(filteredUsers.length / itemsPerPage) ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        &gt;&gt;
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
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

        <DeleteUserModal
          open={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setUserToDelete(null);
          }}
          onDelete={handleDeleteUser}
          user={userToDelete}
          processing={isSubmitting}
        />

        <ProfileModal 
          open={profileOpen} 
          onClose={() => setProfileOpen(false)} 
          user={user} 
        />
      </div>
    </ConfigProvider>
  );
}
