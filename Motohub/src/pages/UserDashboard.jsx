import React, { useEffect, useState } from 'react';
import logo from '../assets/images/logo.jpeg';
import {
  Car,
  Wrench,
  FileText,
  MessageSquare,
  Phone,
  Mail,
  Download,
  Tag,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { ConfigProvider, App, Modal } from 'antd';
import { getFirestore, collection, getDocs, query, limit } from 'firebase/firestore';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

import { useAuth } from '../context/AuthContext';
import UserSidebar from '../components/UserSidebar';
import NavigationBar from '../components/NavigationBar';
import ScrollStack, { ScrollStackItem } from '../components/ScrollStack';

import '../css/UserDashboard.css';

function MotohubCustomerDashboardContent() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [stats, setStats] = useState({
    totalVehicles: 0,
    pendingServices: 0,
    completedServices: 0
  });
  const [showVehicleSelectionModal, setShowVehicleSelectionModal] = useState(false);
  const { user } = useAuth();
  const { message: messageApi, modal } = App.useApp();
  const db = getFirestore();

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      if (!user?.uid) return;
      
      // Load vehicles
      const carsRef = collection(db, `users/${user.uid}/cars`);
      const snap = await getDocs(carsRef);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setVehicles(list);
      
      // Calculate stats
      let pendingServices = 0;
      let completedServices = 0;
      
      for (const car of list) {
        const historyRef = collection(db, `users/${user.uid}/cars/${car.id}/serviceHistory`);
        const historySnap = await getDocs(historyRef);
        
        historySnap.docs.forEach(doc => {
          const data = doc.data();
          if (data.status === 'completed') {
            completedServices++;
          } else if (data.status === 'pending' || data.status === 'in-progress') {
            pendingServices++;
          }
        });
      }
      
      setStats({
        totalVehicles: list.length,
        pendingServices,
        completedServices
      });
    } catch (error) {
      console.error('Error loading user data:', error);
      messageApi.error('Failed to load dashboard data');
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Mail size={20} style={{ color: '#FFC300', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem' }}>Email</div>
                <a
                  href="mailto:support@motohub.com"
                  style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '0.875rem' }}
                  onMouseEnter={(e) => (e.target.style.textDecoration = 'underline')}
                  onMouseLeave={(e) => (e.target.style.textDecoration = 'none')}
                >
                  support@motohub.com
                </a>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Phone size={20} style={{ color: '#FFC300', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem' }}>Phone</div>
                <a
                  href="tel:09261184533"
                  style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '0.875rem' }}
                  onMouseEnter={(e) => (e.target.style.textDecoration = 'underline')}
                  onMouseLeave={(e) => (e.target.style.textDecoration = 'none')}
                >
                  0926 118 4533
                </a>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <MessageSquare size={20} style={{ color: '#FFC300', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem' }}>Facebook</div>
                <a
                  href="https://www.facebook.com/cjkbautocenter"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '0.875rem' }}
                  onMouseEnter={(e) => (e.target.style.textDecoration = 'underline')}
                  onMouseLeave={(e) => (e.target.style.textDecoration = 'none')}
                >
                  CJ KB Auto Center
                </a>
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: '1.5rem',
              padding: '0.75rem',
              backgroundColor: '#fffbf0',
              borderLeft: '3px solid #FFC300',
              borderRadius: '0.25rem',
            }}
          >
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
        },
      },
    });
  };

  const generateServiceHistoryPDF = async (vehicle) => {
    try {
      messageApi.loading({ content: 'Generating PDF...', key: 'pdf', duration: 0 });

      // Validate vehicle data
      if (!vehicle || !vehicle.id) {
        throw new Error('Invalid vehicle data');
      }

      // Fetch service history with error handling
      const serviceHistoryRef = collection(db, `users/${user.uid}/cars/${vehicle.id}/serviceHistory`);
      let snapshot;
      
      try {
        snapshot = await getDocs(serviceHistoryRef);
      } catch (fetchError) {
        console.error('Error fetching service history:', fetchError);
        throw new Error('Failed to fetch service history from database');
      }

      const history = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      history.sort((a, b) => {
        const dateA = new Date(a.timestamp || a.date);
        const dateB = new Date(b.timestamp || b.date);
        return dateB - dateA;
      });

      // Generate PDF with error handling
      let doc;
      try {
        // Initialize jsPDF
        doc = new jsPDF();

        // Add header
        doc.setFontSize(20);
        doc.setTextColor(255, 195, 0);
        doc.text('MOTOHUB', 105, 15, { align: 'center' });

        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text('Service History Report', 105, 25, { align: 'center' });

        // Add vehicle details with safe string conversion
        doc.setFontSize(12);
        const vehicleYear = vehicle.year ? String(vehicle.year) : 'N/A';
        const vehicleMake = vehicle.make ? String(vehicle.make) : 'N/A';
        const vehicleModel = vehicle.model ? String(vehicle.model) : 'N/A';
        const plateNumber = vehicle.plateNumber ? String(vehicle.plateNumber) : 'N/A';
        const engine = vehicle.engine ? String(vehicle.engine) : 'N/A';
        const transmission = vehicle.transmission ? String(vehicle.transmission) : 'N/A';
        const mileage = vehicle.mileage ? String(vehicle.mileage) : 'N/A';

        doc.text(`Vehicle: ${vehicleYear} ${vehicleMake} ${vehicleModel}`, 14, 40);
        doc.text(`Plate Number: ${plateNumber}`, 14, 47);
        doc.text(`Engine: ${engine}`, 14, 54);
        doc.text(`Transmission: ${transmission}`, 14, 61);
        doc.text(`Current Mileage: ${mileage} km`, 14, 68);

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 75);

        if (history.length > 0) {
          // Safely convert service data to table format
          const tableData = history.map(service => {
            try {
              const date = service.timestamp || service.date;
              const dateStr = date ? new Date(date).toLocaleDateString() : 'N/A';
              const serviceType = service.serviceType ? String(service.serviceType) : 'N/A';
              const description = service.description || service.diagnosis || 'N/A';
              const descStr = String(description).substring(0, 100); // Limit length
              const mechanicName = service.mechanicName ? String(service.mechanicName) : 'N/A';
              const cost = service.cost ? `₱${service.cost}` : 'N/A';
              const status = service.status ? String(service.status) : 'N/A';

              return [dateStr, serviceType, descStr, mechanicName, cost, status];
            } catch (rowError) {
              console.error('Error processing service record:', rowError, service);
              return ['Error', 'Error', 'Error processing record', 'N/A', 'N/A', 'N/A'];
            }
          });

          doc.autoTable({
            startY: 85,
            head: [['Date', 'Service Type', 'Description', 'Mechanic', 'Cost', 'Status']],
            body: tableData,
            theme: 'striped',
            headStyles: {
              fillColor: [255, 195, 0],
              textColor: [0, 0, 0],
              fontStyle: 'bold',
            },
            styles: {
              fontSize: 9,
              cellPadding: 3,
              overflow: 'linebreak',
            },
            columnStyles: {
              0: { cellWidth: 25 },
              1: { cellWidth: 30 },
              2: { cellWidth: 50 },
              3: { cellWidth: 30 },
              4: { cellWidth: 25 },
              5: { cellWidth: 25 },
            },
          });
        } else {
          doc.setFontSize(12);
          doc.setTextColor(150, 150, 150);
          doc.text('No service history available for this vehicle.', 105, 100, { align: 'center' });
        }

        // Add page numbers
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
      } catch (pdfError) {
        console.error('Error creating PDF document:', pdfError);
        console.error('Vehicle data:', vehicle);
        console.error('History data:', history);
        throw new Error('Failed to create PDF document: ' + pdfError.message);
      }

      // Save PDF with error handling
      try {
        const safeMake = (vehicle.make || 'Vehicle').replace(/[^a-z0-9]/gi, '_');
        const safeModel = (vehicle.model || 'Report').replace(/[^a-z0-9]/gi, '_');
        const safePlate = (vehicle.plateNumber || 'Unknown').replace(/[^a-z0-9]/gi, '_');
        const timestamp = new Date().getTime();
        const fileName = `ServiceHistory_${safeMake}_${safeModel}_${safePlate}_${timestamp}.pdf`;
        
        doc.save(fileName);
      } catch (saveError) {
        console.error('Error saving PDF:', saveError);
        throw new Error('Failed to save PDF file: ' + saveError.message);
      }

      messageApi.success({ content: 'PDF generated successfully!', key: 'pdf' });
      setShowVehicleSelectionModal(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to generate PDF. ';
      if (error.message.includes('Invalid vehicle')) {
        errorMessage += 'Vehicle data is invalid.';
      } else if (error.message.includes('fetch')) {
        errorMessage += 'Could not load service history. Please check your connection.';
      } else if (error.message.includes('create')) {
        errorMessage += 'PDF creation failed. Error: ' + error.message;
      } else if (error.message.includes('save')) {
        errorMessage += 'Could not save file. Please check browser permissions.';
      } else {
        errorMessage += 'Please try again or contact support. Error: ' + error.message;
      }
      
      messageApi.error({ 
        content: errorMessage, 
        key: 'pdf',
        duration: 7 
      });
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
          ...doc.data(),
        }));

        history.sort((a, b) => new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date));
        setServiceHistory(history);
      } catch (error) {
        console.error('Error fetching service history:', error);
        setServiceHistory([]);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      if (showHistoryModal) loadServiceHistory();
      // eslint-disable-next-line react-hooks/exhaustive-deps
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

        <ServiceHistoryModal
          vehicle={vehicle}
          serviceHistory={serviceHistory}
          open={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
        />
      </>
    );
  };

  const StatCard = ({ icon: Icon, title, value, color }) => (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: color }}>
        <Icon size={24} />
      </div>
      <div className="stat-content">
        <div className="stat-value">{value}</div>
        <div className="stat-title">{title}</div>
      </div>
    </div>
  );

  const QuickActionCard = ({ icon: Icon, title, description, onClick }) => (
    <div className="quick-action-card" onClick={onClick}>
      <div className="quick-action-icon">
        <Icon size={24} />
      </div>
      <div className="quick-action-title">{title}</div>
      <div className="quick-action-description">{description}</div>
    </div>
  );

  const PromoCard = ({ title, description, discount, validUntil, icon: Icon }) => (
    <div className="promo-card">
      <div className="promo-badge">
        <Tag size={16} />
        <span>LIMITED OFFER</span>
      </div>
      <div className="promo-icon">
        <Icon size={32} />
      </div>
      <div className="promo-content">
        <h3 className="promo-title">{title}</h3>
        <p className="promo-description">{description}</p>
        <div className="promo-discount">{discount}</div>
        <div className="promo-validity">
          <Calendar size={14} />
          <span>Valid until {validUntil}</span>
        </div>
      </div>
    </div>
  );

  const carouselSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    pauseOnHover: true,
    arrows: true,
  };

  return (
    <div className="customer-dashboard-container">
      <UserSidebar
        sidebarOpen={sidebarOpen}
        user={user}
        className={`customer-sidebar${sidebarOpen ? '' : ' collapsed'}${sidebarMobileOpen ? ' open' : ''}`}
        onCloseMobile={() => setSidebarMobileOpen(false)}
      />

      <div className={`customer-main-content ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        <NavigationBar
          title="Dashboard"
          subtitle="Overview of your vehicles and services"
          onToggleSidebar={() => {
            if (window.innerWidth <= 768) {
              setSidebarMobileOpen(!sidebarMobileOpen);
            } else {
              setSidebarOpen(!sidebarOpen);
            }
          }}
          userRole="customer"
          userName={user?.displayName || 'User'}
          userEmail={user?.email || ''}
        />

        <div className="customer-content-area">
          {/* Promos Carousel - Moved to Top */}
          <div className="section-with-title promo-section-top">
            <h3 className="section-title">
              <Tag size={20} />
              Current Promotions
            </h3>
            <div className="promo-carousel-container">
              <Slider {...carouselSettings}>
                <div>
                  <PromoCard
                    icon={Wrench}
                    title="Engine Tune-Up Special"
                    description="Complete engine diagnostic and tune-up service for all vehicle types"
                    discount="20% OFF"
                    validUntil="Dec 31, 2025"
                  />
                </div>
                <div>
                  <PromoCard
                    icon={Car}
                    title="Full Vehicle Inspection"
                    description="Comprehensive 50-point safety and performance inspection"
                    discount="15% OFF"
                    validUntil="Nov 30, 2025"
                  />
                </div>
                <div>
                  <PromoCard
                    icon={TrendingUp}
                    title="Premium Oil Change Package"
                    description="Includes full synthetic oil, filter replacement, and free tire rotation"
                    discount="25% OFF"
                    validUntil="Dec 15, 2025"
                  />
                </div>
              </Slider>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="stats-grid">
            <StatCard
              icon={Car}
              title="Total Vehicles"
              value={stats.totalVehicles}
              color="linear-gradient(135deg, #FFC300 0%, #FFD54F 100%)"
            />
            <StatCard
              icon={Wrench}
              title="Pending Services"
              value={stats.pendingServices}
              color="linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)"
            />
            <StatCard
              icon={FileText}
              title="Completed Services"
              value={stats.completedServices}
              color="linear-gradient(135deg, #10B981 0%, #34D399 100%)"
            />
          </div>

          {/* Quick Actions */}
          <div className="section-with-title">
            <h3 className="section-title">Quick Actions</h3>
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
                description="Download your vehicle history"
                onClick={handleServiceHistoryClick}
              />
            </div>
          </div>
        </div>
      </div>

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
          {vehicles.length > 0 ? (
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
                    alignItems: 'center',
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
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
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
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#9CA3AF' }}>
              <Car size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
              <p>No vehicles found. Please add a vehicle first.</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default function MotohubCustomerDashboard() {
  return (
    <ConfigProvider
      theme={{
        token: { colorPrimary: '#FFC300' },
      }}
    >
      <App>
        <MotohubCustomerDashboardContent />
      </App>
    </ConfigProvider>
  );
}