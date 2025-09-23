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
import EditPartModal from '../components/modals/EditPartModal';  // Add this import
import TopBar from '../components/TopBar';
import ProfileModal from '../components/modals/ProfileModal';
import '../css/Inventory.css';

export default function Inventory() {
  // Add sidebarOpen state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [parts, setParts] = useState([]);
  const [selectedPart, setSelectedPart] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  // Use an object for the part being edited and a boolean to control modal visibility
  const [editPart, setEditPart] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [lowStockAlert, setLowStockAlert] = useState([]);
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
      
      // Check for low stock items
      const lowStock = partsList.filter(part => part.quantity <= part.minStock);
      setLowStockAlert(lowStock);
    } catch (error) {
      console.error('Error fetching parts:', error);
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
      // clear selection and close edit modal
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

  return (
    <div className="dashboard-container">
      <AdminSidebar sidebarOpen={sidebarOpen} user={user} />

      <div className="main-content">
        {/* Keep TopBar (already added) */}
        <TopBar
          title="Inventory"
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          notificationsCount={0}
          onProfileClick={() => setProfileOpen(true)}
        />

        <div className="content-area">
          {/* existing inventory content */}
          <div className="inventory-header">
            <h1>Inventory Management</h1>
            <div className="inventory-actions">
              <div className="search-container">
                <Search size={20} />
                <input
                  type="text"
                  placeholder="Search parts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button className="add-part-btn" onClick={() => setIsAddModalOpen(true)}>
                <Plus size={20} />
                Add New Part
              </button>
            </div>
          </div>
          
          {lowStockAlert.length > 0 && (
            <div className="low-stock-alert">
              <AlertCircle size={20} />
              <span>{lowStockAlert.length} items are running low on stock</span>
            </div>
          )}

          <div className="inventory-grid">
            <div className="parts-list">
              <table className="parts-table">
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
                  {filteredParts.map(part => (
                    <tr 
                      key={part.id}
                      className={selectedPart?.id === part.id ? 'selected' : ''}
                      onClick={() => setSelectedPart(part)}
                    >
                      <td>{part.name}</td>
                      <td>{part.category}</td>
                      <td className={part.quantity <= part.minStock ? 'low-stock' : ''}>
                        {part.quantity}
                      </td>
                      <td>₱{part.price}</td>
                      <td>
                        <span className={`status-badge ${part.status.toLowerCase()}`}>
                          {part.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button onClick={(e) => {
                            e.stopPropagation();
                            // open edit modal for this part
                            setSelectedPart(part);
                            setEditPart(part);
                            setIsEditModalOpen(true);
                          }}>
                            <Edit size={16} />
                          </button>
                          <button onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePart(part.id);
                          }}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedPart && (
              <div className="part-details">
                <h2>Part Details</h2>
                <div className="part-info">
                  <img src={selectedPart.image} alt={selectedPart.name} />
                  <div className="details-grid">
                    <div className="detail-item">
                      <label>Name</label>
                      <span>{selectedPart.name}</span>
                    </div>
                    <div className="detail-item">
                      <label>Category</label>
                      <span>{selectedPart.category}</span>
                    </div>
                    <div className="detail-item">
                      <label>Stock</label>
                      <span>{selectedPart.quantity}</span>
                    </div>
                    <div className="detail-item">
                      <label>Price</label>
                      <span>₱{selectedPart.price}</span>
                    </div>
                    <div className="detail-item">
                      <label>Minimum Stock</label>
                      <span>{selectedPart.minStock}</span>
                    </div>
                    <div className="detail-item">
                      <label>Status</label>
                      <span>{selectedPart.status}</span>
                    </div>
                    <div className="detail-item full-width">
                      <label>Description</label>
                      <p>{selectedPart.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* modals */}
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