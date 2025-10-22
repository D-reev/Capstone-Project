import logo from '../assets/images/logo.jpeg';
import React, { useState, useEffect } from 'react';
import { 
  Car, 
  Calendar, 
  Settings, 
  User,
  Bell,
  Menu,
  Wrench,
  FileText,
  CreditCard,
  Phone,
  Mail,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  History,
  MapPin,
  Download
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { createCarModel, getUserCars, updateCarModel, addServiceHistory, getCarServiceHistory } from '../utils/auth';
import UserSidebar from '../components/UserSidebar';
import ServiceHistoryModal from '../components/modals/ServiceHistoryModal';
import AddCarModal from '../components/modals/AddCarModal';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { Modal, message, ConfigProvider, App } from 'antd';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

import '../css/UserDashboard.css';

function MotohubCustomerDashboardContent() {
  const [customerVehicles, setCustomerVehicles] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [isAddingCar, setIsAddingCar] = useState(false);
  const [showVehicleSelectionModal, setShowVehicleSelectionModal] = useState(false);
  const { user } = useAuth();
  const { message: messageApi, modal } = App.useApp();
  const db = getFirestore();

  useEffect(() => {
    if (user) loadUserCars();
  }, [user]);

  const loadUserCars = async () => {
    try {
      const userCars = await getUserCars(user.uid);
      setVehicles(userCars);  
      setCustomerVehicles(userCars);
    } catch (error) {
      console.error('Error loading vehicles:', error);
      messageApi.error('Failed to load vehicles');
    }
  };

  const handleAddCar = async (formData) => {
    try {
      await createCarModel(user.uid, formData);
      setIsAddingCar(false);
      await loadUserCars();
      messageApi.success('Vehicle added successfully!');
    } catch (error) {
      console.error('Error adding car:', error);
      messageApi.error('Failed to add vehicle');
    }
  };

  const handleServiceHistoryClick = () => {
    if (!vehicles || vehicles.length === 0) {
      messageApi.warning('No vehicles found. Please add a vehicle first.');
      return;
    }

    modal.confirm({
      title: 'Download Service History',
      content: 'Would you like to download the service history for your vehicle?',
      okText: 'Yes, Download',
      cancelText: 'Cancel',
      centered: true,
      onOk: () => {
        setShowVehicleSelectionModal(true);
      },
    });
  };

  const handleContactSupport = () => {
    modal.info({
      title: 'Contact Support',
      width: 500,
      centered: true,
      content: (
        <div style={{ padding: '1rem 0' }}>
          <p style={{ marginBottom: '1.5rem', color: '#666' }}>
            Get in touch with our support team through any of the following channels:
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Email */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Mail size={20} style={{ color: '#FFC300', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  Email
                </div>
                <a 
                  href="mailto:support@motohub.com"
                  style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '0.875rem' }}
                  onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                  onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                >
                  support@motohub.com
                </a>
              </div>
            </div>

            {/* Phone */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Phone size={20} style={{ color: '#FFC300', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  Phone
                </div>
                <a 
                  href="tel:09261184533"
                  style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '0.875rem' }}
                  onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                  onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                >
                  0926 118 4533
                </a>
              </div>
            </div>

            {/* Facebook */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <MessageSquare size={20} style={{ color: '#FFC300', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  Facebook
                </div>
                <a 
                  href="https://www.facebook.com/cjkbautocenter"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '0.875rem' }}
                  onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                  onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                >
                  CJ KB Auto Center
                </a>
              </div>
            </div>
          </div>

          <div style={{ 
            marginTop: '1.5rem', 
            padding: '0.75rem', 
            backgroundColor: '#fffbf0', 
            borderLeft: '3px solid #FFC300',
            borderRadius: '0.25rem'
          }}>
            <p style={{ fontSize: '0.8125rem', color: '#666', margin: 0 }}>
              Our support team is available Monday to Saturday, 8:00 AM - 6:00 PM.
              We'll get back to you as soon as possible!
            </p>
          </div>
        </div>
      ),
      okText: 'Close',
      okButtonProps: {
        style: {
          backgroundColor: '#FFC300',
          borderColor: '#FFC300',
          color: '#000',
        }
      }
    });
  };

  const generateServiceHistoryPDF = async (vehicle) => {
    try {
      messageApi.loading({ content: 'Generating PDF...', key: 'pdf', duration: 0 });

      const serviceHistoryRef = collection(db, `users/${user.uid}/cars/${vehicle.id}/serviceHistory`);
      const snapshot = await getDocs(serviceHistoryRef);
      
      const history = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      history.sort((a, b) => {
        const dateA = new Date(b.timestamp || b.date);
        const dateB = new Date(a.timestamp || a.date);
        return dateB - dateA;
      });

      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.setTextColor(255, 195, 0);
      doc.text('MOTOHUB', 105, 15, { align: 'center' });
      
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text('Service History Report', 105, 25, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text(`Vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model}`, 14, 40);
      doc.text(`Plate Number: ${vehicle.plateNumber}`, 14, 47);
      doc.text(`Engine: ${vehicle.engine || 'N/A'}`, 14, 54);
      doc.text(`Transmission: ${vehicle.transmission || 'N/A'}`, 14, 61);
      doc.text(`Current Mileage: ${vehicle.mileage || 'N/A'} km`, 14, 68);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 75);
      
      if (history.length > 0) {
        const tableData = history.map(service => [
          new Date(service.timestamp || service.date).toLocaleDateString(),
          service.serviceType || 'N/A',
          service.description || 'N/A',
          service.mechanicName || 'N/A',
          service.cost ? `₱${service.cost}` : 'N/A',
          service.status || 'N/A'
        ]);

        doc.autoTable({
          startY: 85,
          head: [['Date', 'Service Type', 'Description', 'Mechanic', 'Cost', 'Status']],
          body: tableData,
          theme: 'striped',
          headStyles: {
            fillColor: [255, 195, 0],
            textColor: [0, 0, 0],
            fontStyle: 'bold'
          },
          styles: {
            fontSize: 9,
            cellPadding: 3
          },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 30 },
            2: { cellWidth: 50 },
            3: { cellWidth: 30 },
            4: { cellWidth: 25 },
            5: { cellWidth: 25 }
          }
        });
      } else {
        doc.setFontSize(12);
        doc.setTextColor(150, 150, 150);
        doc.text('No service history available for this vehicle.', 105, 100, { align: 'center' });
      }

      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Page ${i} of ${pageCount}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      const fileName = `ServiceHistory_${vehicle.make}_${vehicle.model}_${vehicle.plateNumber}_${new Date().getTime()}.pdf`;
      doc.save(fileName);

      messageApi.success({ content: 'PDF generated successfully!', key: 'pdf' });
      setShowVehicleSelectionModal(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      messageApi.error({ content: 'Failed to generate PDF. Please try again.', key: 'pdf' });
    }
  };

  const VehicleCard = ({ vehicle }) => {
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [serviceHistory, setServiceHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    const loadServiceHistory = async () => {
      setLoading(true);
      try {
        const serviceHistoryRef = collection(db, `users/${user.uid}/cars/${vehicle.id}/serviceHistory`);
        const snapshot = await getDocs(serviceHistoryRef);
        
        const history = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        setServiceHistory(history);
      } catch (error) {
        console.error('Error fetching service history:', error);
        setServiceHistory([]);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      if (showHistoryModal) {
        loadServiceHistory();
      }
    }, [showHistoryModal]);

    const getStatusColor = (status) => {
      switch (status?.toLowerCase()) {
        case 'excellent': return 'status-excellent';
        case 'good': return 'status-good';
        case 'needs attention': return 'status-needs-attention';
        case 'in service': return 'status-in-service';
        default: return 'status-good';
      }
    };

    const getStatusIcon = (status) => {
      switch (status?.toLowerCase()) {
        case 'excellent': return <CheckCircle size={16} />;
        case 'good': return <CheckCircle size={16} />;
        case 'needs attention': return <AlertTriangle size={16} />;
        case 'in service': return <Wrench size={16} />;
        default: return <CheckCircle size={16} />;
      }
    };

    return (
      <>
        <div className="vehicle-card">
          <div className="vehicle-card-image">
            <Car size={64} />
            <div className={`vehicle-status-badge ${getStatusColor(vehicle.status)}`}>
              {getStatusIcon(vehicle.status)}
              <span>{vehicle.status}</span>
            </div>
          </div>
          
          <div className="vehicle-card-content">
            <div className="vehicle-header">
              <div className="vehicle-info">
                <h3 className="vehicle-title">{vehicle.year} {vehicle.make} {vehicle.model}</h3>
                <p className="vehicle-subtitle">{vehicle.engine} • {vehicle.transmission}</p>
                <div className="vehicle-plate">{vehicle.plateNumber}</div>
              </div>
            </div>

            <div className="vehicle-specs">
              <div className="vehicle-spec-item">
                <span className="vehicle-spec-label">Mileage</span>
                <span className="vehicle-spec-value">{vehicle.mileage} km</span>
              </div>
              <div className="vehicle-spec-item">
                <span className="vehicle-spec-label">Last Service</span>
                <span className="vehicle-spec-value">{vehicle.lastService || 'N/A'}</span>
              </div>
              <div className="vehicle-spec-item">
                <span className="vehicle-spec-label">Next Service</span>
                <span className="vehicle-spec-value">{vehicle.nextService || 'N/A'}</span>
              </div>
              <div className="vehicle-spec-item">
                <span className="vehicle-spec-label">Service Due</span>
                <span className={`vehicle-spec-value service-due-${vehicle.serviceDue?.toLowerCase().replace(' ', '-')}`}>
                  {vehicle.serviceDue || 'N/A'}
                </span>
              </div>
            </div>

            <div className="vehicle-actions">
              <button 
                className="vehicle-action-btn btn-secondary"
                onClick={() => setShowHistoryModal(true)}
              >
                <History size={16} />
                History
              </button>
            </div>
          </div>
        </div>

        {showHistoryModal && (
          <ServiceHistoryModal
            vehicle={vehicle}
            serviceHistory={serviceHistory}
            onClose={() => setShowHistoryModal(false)}
          />
        )}
      </>
    );
  };

  const QuickActionCard = ({ icon: Icon, title, description, onClick }) => (
    <div className="quick-action-card" onClick={onClick}>
      <div className="quick-action-icon">
        <Icon size={24} />
      </div>
      <div className="quick-action-title">{title}</div>
      <div className="quick-action-description">{description}</div>
    </div>
  );

  return (
    <div className="customer-dashboard-container">
      <UserSidebar 
        sidebarOpen={sidebarOpen}
        user={user}
        className={`customer-sidebar${sidebarOpen ? '' : ' collapsed'}${sidebarMobileOpen ? ' open' : ''}`}
        onCloseMobile={() => setSidebarMobileOpen(false)}
      />

      <div className="customer-main-content">
        <div className="customer-top-bar">
          <div className="top-bar-left-section">
            <button
              className="top-bar-menu-btn"
              onClick={() => {
                if (window.innerWidth <= 768) {
                  setSidebarMobileOpen(!sidebarMobileOpen);
                } else {
                  setSidebarOpen(!sidebarOpen);
                }
              }}
            >
              <Menu size={20} />
            </button>
            <h1 className="top-bar-title-text">Motohub</h1>
          </div>
          <div className="top-bar-logo-wrapper">
            <div className="top-bar-logo-image" style={{ backgroundImage: `url(${logo})` }} />
          </div>
        </div>

        <div className="customer-content-area">
          <div className="welcome-section">
            <h2 className="welcome-title">Welcome Back, {user?.displayName || 'Juan'}!</h2>
            <p className="welcome-subtitle">Manage your vehicles and track your service history</p>
          </div>

          <div className="quick-actions">
          
            <QuickActionCard 
              icon={MessageSquare} 
              title="Contact Support" 
              description="Get help from our team"
              onClick={handleContactSupport}
            />
            <QuickActionCard 
              icon={FileText} 
              title="Service History" 
              description="Download your vehicle History"
              onClick={handleServiceHistoryClick}
            />
          </div>

          <div className="vehicles-section">
            <div className="section-header">
              <h3 className="vehicles-section-title">🚗 My Vehicles</h3>
              <button 
                className="add-vehicle-btn"
                onClick={() => setIsAddingCar(true)}
              >
                <Car size={16} />
                Add Vehicle
              </button>
            </div>
            <div className="my-vehicles-grid">
              {vehicles.map(vehicle => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {isAddingCar && (
        <AddCarModal 
          onSubmit={handleAddCar}
          onClose={() => setIsAddingCar(false)}
        />
      )}

      <Modal
        title="Select Vehicle"
        open={showVehicleSelectionModal}
        onCancel={() => setShowVehicleSelectionModal(false)}
        footer={null}
        width={600}
        centered
      >
        <div style={{ padding: '1rem 0' }}>
          <p style={{ marginBottom: '1rem', color: '#666' }}>
            Choose a vehicle to download its service history:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {vehicles.map(vehicle => (
              <div
                key={vehicle.id}
                onClick={() => generateServiceHistoryPDF(vehicle)}
                style={{
                  padding: '1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#FFC300';
                  e.currentTarget.style.backgroundColor = '#fffbf0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#666' }}>
                    {vehicle.plateNumber} • {vehicle.engine || 'N/A'}
                  </div>
                </div>
                <Download size={20} style={{ color: '#FFC300' }} />
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function MotohubCustomerDashboard() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#FFC300',
        },
      }}
    >
      <App>
        <MotohubCustomerDashboardContent />
      </App>
    </ConfigProvider>
  );
}