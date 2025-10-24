import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Wrench, 
  Package, 
  ShoppingCart, 
  Plus,
  Search,
  Edit,
  Trash2,
  AlertCircle,
  Menu,
  Bell,
  MessageSquare,
  User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import AdminSidebar from '../components/AdminSidebar';
import AddPartModal from '../components/modals/AddPartModal';
import EditPartModal from '../components/modals/EditPartModal';
import TopBar from '../components/TopBar';
import ProfileModal from '../components/modals/ProfileModal';
import '../css/Inventory.css';

export default function Inventory() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [parts, setParts] = useState([]);
  const [selectedPart, setSelectedPart] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editPart, setEditPart] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [lowStockAlert, setLowStockAlert] = useState([]);
  const { user } = useAuth();
  const db = getFirestore();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetchParts();
  }, [db]); // Add db as dependency

  const fetchParts = async () => {
    try {
      const partsCollection = collection(db, 'inventory');
      const snapshot = await getDocs(partsCollection);
      
      if (snapshot.empty) {
        setParts([]);
        setLowStockAlert([]);
        return;
      }

      const partsList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || 'Unknown',
          category: data.category || 'Uncategorized',
          quantity: Number(data.quantity) || 0,
          price: Number(data.price) || 0,
          minStock: Number(data.minStock) || 0,
          status: data.status || 'Available',
          image: data.image || null,
          ...data
        };
      });

      setParts(partsList);
      
      // Filter low stock items
      const lowStock = partsList.filter(part => 
        part.quantity <= part.minStock && part.quantity >= 0
      );
      setLowStockAlert(lowStock);
    } catch (error) {
      console.error('Error fetching parts:', error);
      setParts([]);
      setLowStockAlert([]);
      
      // Optional: Show user-friendly error
      if (error.code === 'permission-denied') {
        alert('You do not have permission to view inventory.');
      } else {
        alert('Failed to load inventory. Please try again.');
      }
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
      setSelectedPart(null);
      setEditPart(null);
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating part:', error);
    }
  };

  const handleDeletePart = async (id) => {
    if (window.confirm('Are you sure you want to delete this part?')) {
      try {
        await deleteDoc(doc(db, 'inventory', id));
        fetchParts();
      } catch (error) {
        console.error('Error deleting part:', error);
      }
    }
  };

  const filteredParts = parts.filter(part => 
    part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredParts.length / pageSize));
  
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [filteredParts.length, totalPages, currentPage]);

  const paginatedParts = filteredParts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="dashboard-container inventory-page">
      <AdminSidebar sidebarOpen={sidebarOpen} user={user} />

      <div className={`main-content ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        <TopBar
          title="Inventory"
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          notificationsCount={0}
          onProfileClick={() => setProfileOpen(true)}
        />

        <div className={`user-management-container ${!selectedPart ? 'single-column' : ''}`}>
          <div className="user-table-section">
            <div className="user-table-header">
              <h1 className="user-table-title">Inventory</h1>
              <div className="user-table-actions">
                <div className="user-table-search">
                  <Search size={18} />
                  <input
                    type="text"
                    placeholder="Search parts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button className="user-table-add-btn" onClick={() => setIsAddModalOpen(true)}>
                  <Plus size={16} />
                  Add Part
                </button>
              </div>
            </div>

            <div className="user-table-container">
              <table className="user-table">
                <thead>
                  <tr>
                    <th>Part Name</th>
                    <th>Category</th>
                    <th>Stock</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedParts.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        {searchTerm ? 'No parts found matching your search.' : 'No parts available.'}
                      </td>
                    </tr>
                  ) : (
                    paginatedParts.map(part => (
                      <tr 
                        key={part.id}
                        className={selectedPart?.id === part.id ? 'selected' : ''}
                        onClick={(e) => {
                          if (e.target.closest('.user-table-action-btn')) return;
                          setSelectedPart(prev => (prev && prev.id === part.id) ? null : part);
                        }}
                      >
                        <td>
                          <div className="user-table-user">
                            <div className="user-table-avatar">
                              {part.image ? (
                                <img src={part.image} alt={part.name} />
                              ) : (
                                part.name.slice(0,2).toUpperCase()
                              )}
                            </div>
                            <span className="user-table-name">{part.name}</span>
                          </div>
                        </td>
                        <td>{part.category}</td>
                        <td className={part.quantity <= part.minStock ? 'low-stock' : ''}>{part.quantity}</td>
                        <td>₱{part.price}</td>
                        <td>
                          <span className={`role-badge ${part.status?.toLowerCase()}`}>{part.status}</span>
                        </td>
                        <td className="user-table-actions-col">
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setSelectedPart(part); 
                              setEditPart(part); 
                              setIsEditModalOpen(true); 
                            }} 
                            className="user-table-action-btn edit" 
                            title="Edit part"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              handleDeletePart(part.id); 
                            }} 
                            className="user-table-action-btn delete" 
                            title="Delete part"
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

          {selectedPart && (
            <div className={`user-profile-panel ${selectedPart ? 'active' : ''}`}>
              <div className="user-profile-header">
                <div className="user-profile-avatar">
                  {selectedPart.image ? (
                    <img src={selectedPart.image} alt={selectedPart.name} />
                  ) : (
                    selectedPart.name.slice(0,2).toUpperCase()
                  )}
                </div>
                <h3 className="user-profile-name">{selectedPart.name}</h3>
                <p className="user-profile-email">{selectedPart.category}</p>
              </div>

              <div className="user-profile-content">
                <div className="user-profile-info">
                  <div className="user-profile-info-row">
                    <span className="icon">📦</span>
                    <span>Stock: {selectedPart.quantity}</span>
                  </div>
                  <div className="user-profile-info-row">
                    <span className="icon">₱</span>
                    <span>Price: ₱{selectedPart.price}</span>
                  </div>
                  <div className="user-profile-info-row">
                    <span className="icon">⚙️</span>
                    <span>Min Stock: {selectedPart.minStock}</span>
                  </div>
                </div>

                <div className="user-profile-quick-stats">
                  <div className="user-profile-stat">
                    <span>{selectedPart.quantity}</span>
                    <span className="user-profile-stat-label">In Stock</span>
                  </div>
                  <div className="user-profile-stat">
                    <span>{selectedPart.minStock}</span>
                    <span className="user-profile-stat-label">Min Stock</span>
                  </div>

                  <div className="user-profile-booking-stats">
                    <div className="stat">
                      <span>---</span>
                      <span className="stat-label">Reserved</span>
                    </div>
                    <div className="stat">
                      <span>---</span>
                      <span className="stat-label">Available</span>
                    </div>
                    <div className="stat">
                      <span>---</span>
                      <span className="stat-label">Backordered</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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
          setSelectedPart(null);
        }}
        onUpdate={handleUpdatePart}
        open={isEditModalOpen}
      />

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} user={user} />
    </div>
  );
}