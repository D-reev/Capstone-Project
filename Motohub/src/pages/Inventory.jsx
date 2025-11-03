import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, FilterOutlined, TagOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { Table, Tag, Input, Button, Space, Avatar, ConfigProvider, Select, Modal, App } from 'antd';
import { PackagePlus } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import AddPartModal from '../components/modals/AddPartModal';
import EditPartModal from '../components/modals/EditPartModal';
import RestockModal from '../components/modals/RestockModal';
import NavigationBar from '../components/NavigationBar';
import ProfileModal from '../components/modals/ProfileModal';
import Loading from '../components/Loading';
import '../css/Inventory.css';

const { Option } = Select;

function InventoryPage() {
  const { message: messageApi } = App.useApp();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editPart, setEditPart] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [partToDelete, setPartToDelete] = useState(null);
  const [restockModalOpen, setRestockModalOpen] = useState(false);
  const [partToRestock, setPartToRestock] = useState(null);
  const { user } = useAuth();
  const db = getFirestore();

  useEffect(() => {
    fetchParts();
  }, []);

  const fetchParts = async () => {
    try {
      const partsCollection = collection(db, 'inventory');
      const snapshot = await getDocs(partsCollection);
      const partsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setParts(partsList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching parts:', error);
      setLoading(false);
    }
  };

  const handleAddPart = async (partData) => {
    try {
      const partsRef = collection(db, 'inventory');
      await addDoc(partsRef, {
        ...partData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      fetchParts();
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error adding part:', error);
    }
  };

  const handleUpdatePart = async (id, updates) => {
    try {
      const partRef = doc(db, 'inventory', id);
      await updateDoc(partRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      fetchParts();
      setEditPart(null);
      setIsEditModalOpen(false);
      setExpandedRowKeys([]);
    } catch (error) {
      console.error('Error updating part:', error);
    }
  };

  const handleDeletePart = async (id) => {
    setPartToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!partToDelete) return;
    
    try {
      await deleteDoc(doc(db, 'inventory', partToDelete));
      
      // Update local state
      setParts(prevParts => prevParts.filter(part => part.id !== partToDelete));
      
      if (expandedRowKeys.includes(partToDelete)) {
        setExpandedRowKeys([]);
      }
      
      messageApi.success('Part deleted successfully!');
      setDeleteModalOpen(false);
      setPartToDelete(null);
    } catch (error) {
      console.error('Error deleting part:', error);
      messageApi.error('Failed to delete part');
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setPartToDelete(null);
  };

  const handleEditFromDeleteModal = () => {
    const part = parts.find(p => p.id === partToDelete);
    if (part) {
      setEditPart(part);
      setIsEditModalOpen(true);
      setDeleteModalOpen(false);
      setPartToDelete(null);
    }
  };

  const handleRestock = (part) => {
    setPartToRestock(part);
    setRestockModalOpen(true);
  };

  const handleRestockUpdate = async (id, updates) => {
    try {
      const partRef = doc(db, 'inventory', id);
      
      // Filter out undefined values to prevent Firebase errors
      const cleanUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = value;
        }
        return acc;
      }, {});
      
      const updateData = {
        ...cleanUpdates,
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(partRef, updateData);
      
      // Update local state with the same data
      setParts(prevParts => 
        prevParts.map(part => 
          part.id === id ? { ...part, ...updateData } : part
        )
      );
      
      messageApi.success('Inventory restocked successfully!');
      
      setRestockModalOpen(false);
      setPartToRestock(null);
    } catch (error) {
      console.error('Error restocking part:', error);
      messageApi.error('Failed to restock inventory');
      throw error;
    }
  };

  const filteredParts = parts.filter(part => {
    const matchesSearch = part.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         part.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || part.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPartInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleRowExpand = (expanded, record) => {
    const keys = expanded ? [record.id] : [];
    setExpandedRowKeys(keys);
  };

  const handleRowClick = (record) => {
    const isExpanded = expandedRowKeys.includes(record.id);
    setExpandedRowKeys(isExpanded ? [] : [record.id]);
  };

  // Get unique categories for filter
  const categories = ['all', ...new Set(parts.map(part => part.category).filter(Boolean))];

  // Expanded row render
  const expandedRowRender = (record) => {
    return (
      <div className="inventory-expanded-info">
        <div className="inventory-expanded-grid">
          <div className="inventory-expanded-item">
            <span className="inventory-expanded-label">Part ID</span>
            <span className="inventory-expanded-value">{record.id || 'N/A'}</span>
          </div>
          <div className="inventory-expanded-item">
            <span className="inventory-expanded-label">Min Stock Level</span>
            <span className="inventory-expanded-value">{record.minStock || '0'}</span>
          </div>
          <div className="inventory-expanded-item">
            <span className="inventory-expanded-label">Supplier</span>
            <span className="inventory-expanded-value">{record.supplier || 'Not specified'}</span>
          </div>
          <div className="inventory-expanded-item">
            <span className="inventory-expanded-label">Last Updated</span>
            <span className="inventory-expanded-value">{formatDate(record.updatedAt)}</span>
          </div>
        </div>
        <div className="inventory-expanded-actions">
          <Button
            type="primary"
            icon={<PackagePlus size={18} />}
            onClick={() => handleRestock(record)}
            style={{
              background: '#059669',
              borderColor: '#059669',
              color: '#FFFFFF',
              fontWeight: 600,
            }}
          >
            Restock
          </Button>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              setEditPart(record);
              setIsEditModalOpen(true);
            }}
            style={{
              background: '#FBBF24',
              borderColor: '#FBBF24',
              color: '#111827',
              fontWeight: 600,
            }}
          >
            Edit Part
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeletePart(record.id)}
          >
            Delete Part
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
      title: 'Part Name',
      dataIndex: 'name',
      key: 'name',
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
            src={record.image}
          >
            {getPartInitials(text)}
          </Avatar>
          <span style={{ fontWeight: 500, color: '#111827' }}>
            {text || 'Unknown Part'}
          </span>
        </Space>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (text) => (
        <span style={{ color: '#6B7280' }}>{text || 'Uncategorized'}</span>
      ),
    },
    {
      title: 'Stock',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      render: (quantity, record) => {
        const isLowStock = quantity <= (record.minStock || 0);
        return (
          <span style={{ 
            color: isLowStock ? '#DC2626' : '#059669',
            fontWeight: 600,
            fontSize: '14px'
          }}>
            {quantity || 0}
          </span>
        );
      },
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      render: (price) => (
        <span style={{ fontWeight: 500, color: '#111827' }}>
          ₱{price?.toFixed(2) || '0.00'}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const statusConfig = {
          Available: { color: '#059669', bg: '#D1FAE5', label: 'Available' },
          Unavailable: { color: '#DC2626', bg: '#FEE2E2', label: 'Unavailable' },
          'Low Stock': { color: '#D97706', bg: '#FEF3C7', label: 'Low Stock' },
        };
        const config = statusConfig[status] || statusConfig.Available;
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
  ];

  if (loading) {
    return <Loading text="Loading inventory..." />;
  }

  return (
    <div className="inventory-page">
        <AdminSidebar sidebarOpen={sidebarOpen} user={user} />

        <div className={`main-content ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
          <NavigationBar
            title="Inventory Management"
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            onProfileClick={() => setProfileOpen(true)}
            userRole="admin"
            userName={user?.displayName || 'Admin'}
            userEmail={user?.email || ''}
          />

          <div className="inventory-container">
            <div className="inventory-table-card">
              <div className="inventory-table-header">
                <div className="inventory-table-header-left">
                  <h1 className="inventory-table-title">Parts Inventory</h1>
                  <span className="inventory-table-subtitle">
                    Showing {filteredParts.length} of {parts.length} parts
                  </span>
                </div>
                <div className="inventory-table-actions">
                  <Select
                    value={categoryFilter}
                    onChange={(value) => setCategoryFilter(value)}
                    style={{ 
                      width: 180,
                      borderRadius: 8,
                    }}
                    size="large"
                    suffixIcon={<FilterOutlined />}
                  >
                    <Option value="all">All Categories</Option>
                    {categories.filter(cat => cat !== 'all').map(category => (
                      <Option key={category} value={category}>{category}</Option>
                    ))}
                  </Select>
                  <Input
                    placeholder="Search parts..."
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
                    icon={<PlusOutlined />}
                    size="large"
                    onClick={() => setIsAddModalOpen(true)}
                    style={{
                      background: '#FBBF24',
                      borderColor: '#FBBF24',
                      color: '#111827',
                      fontWeight: 600,
                      borderRadius: 8,
                    }}
                  >
                    Add Part
                  </Button>
                </div>
              </div>

              <div className="inventory-table-container">
                <Table
                  columns={columns}
                  dataSource={filteredParts}
                  rowKey="id"
                  expandable={{
                    expandedRowRender,
                    expandedRowKeys,
                    onExpand: handleRowExpand,
                    expandIcon: () => null,
                  }}
                  onRow={(record) => ({
                    onClick: () => handleRowClick(record),
                    style: { cursor: 'pointer' }
                  })}
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: false,
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} parts`,
                    style: { marginTop: 16, marginBottom: 16 }
                  }}
                  locale={{
                    emptyText: searchTerm ? 'No parts found matching your search.' : 'No parts available in inventory.'
                  }}
                  className="inventory-data-table"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        <AddPartModal 
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddPart}
          open={isAddModalOpen}
        />

        <EditPartModal 
          part={editPart}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditPart(null);
          }}
          onUpdate={handleUpdatePart}
          open={isEditModalOpen}
        />

        <ProfileModal 
          open={profileOpen} 
          onClose={() => setProfileOpen(false)} 
          user={user} 
        />

        <RestockModal
          part={partToRestock}
          open={restockModalOpen}
          onClose={() => {
            setRestockModalOpen(false);
            setPartToRestock(null);
          }}
          onRestock={handleRestockUpdate}
        />

        {/* Delete Confirmation Modal */}
        <Modal
          title={
            <Space>
              <ExclamationCircleOutlined style={{ color: '#DC2626', fontSize: '24px' }} />
              <span>Delete Part</span>
            </Space>
          }
          open={deleteModalOpen}
          onCancel={cancelDelete}
          width={500}
          footer={[
            <Button
              key="cancel"
              size="large"
              onClick={cancelDelete}
            >
              Cancel
            </Button>,
            <Button
              key="edit"
              size="large"
              icon={<EditOutlined />}
              onClick={handleEditFromDeleteModal}
              style={{
                background: '#FBBF24',
                borderColor: '#FBBF24',
                color: '#111827',
                fontWeight: 600,
              }}
            >
              Edit Instead
            </Button>,
            <Button
              key="delete"
              danger
              size="large"
              onClick={confirmDelete}
              icon={<DeleteOutlined />}
            >
              Delete
            </Button>,
          ]}
        >
          <div style={{ padding: '1rem 0' }}>
            <p style={{ fontSize: '1rem', color: '#374151', marginBottom: '1rem' }}>
              Are you sure you want to delete this part from the inventory?
            </p>
            {partToDelete && parts.find(p => p.id === partToDelete) && (
              <div style={{
                padding: '1rem',
                background: '#FEF3C7',
                borderRadius: '8px',
                borderLeft: '4px solid #FBBF24'
              }}>
                <p style={{ margin: 0, fontWeight: 600, color: '#92400E' }}>
                  {parts.find(p => p.id === partToDelete)?.name}
                </p>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#6B7280' }}>
                  Category: {parts.find(p => p.id === partToDelete)?.category || 'N/A'}
                </p>
              </div>
            )}
            <p style={{ 
              fontSize: '0.875rem', 
              color: '#DC2626', 
              marginTop: '1rem',
              marginBottom: 0,
              fontWeight: 500
            }}>
              ⚠️ This action cannot be undone.
            </p>
          </div>
        </Modal>
      </div>
  );
}

export default function InventoryContent() {
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
      <App>
        <InventoryPage />
      </App>
    </ConfigProvider>
  );
}
