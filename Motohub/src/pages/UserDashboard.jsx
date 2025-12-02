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
  TrendingUp,
  History,
  Plus
} from 'lucide-react';
import { ConfigProvider, App, Modal } from 'antd';
import { getFirestore, collection, getDocs, query, limit } from 'firebase/firestore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import UserSidebar from '../components/UserSidebar';
import SuperAdminSidebar from '../components/SuperAdminSidebar';
import NavigationBar from '../components/NavigationBar';
import ScrollStack, { ScrollStackItem } from '../components/ScrollStack';
import ServiceHistoryModal from '../components/modals/ServiceHistoryModal';

import '../css/UserDashboard.css';

function MotohubCustomerDashboardContent() {
  const { sidebarOpen } = useSidebar();
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [promotions, setPromotions] = useState([]);
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
    loadPromotions();
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

  const loadPromotions = async () => {
    try {
      const promoRef = collection(db, 'promotions');
      const snapshot = await getDocs(promoRef);
      const promoList = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(promo => promo.active !== false);
      setPromotions(promoList);
    } catch (error) {
      console.error('Error loading promotions:', error);
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
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // ========== HEADER SECTION ==========
        // Add background header rectangle
        doc.setFillColor(31, 41, 55); // Dark gray background
        doc.rect(0, 0, pageWidth, 45, 'F');
        
        // Add accent line
        doc.setFillColor(255, 195, 0); // Gold accent
        doc.rect(0, 45, pageWidth, 3, 'F');

        // MOTOHUB Logo/Title
        doc.setFontSize(28);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 195, 0);
        doc.text('MOTOHUB', pageWidth / 2, 20, { align: 'center' });

        // Subtitle
        doc.setFontSize(12);
        doc.setTextColor(255, 255, 255);
        doc.text('Professional Auto Care Services', pageWidth / 2, 28, { align: 'center' });

        // Report Type
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 195, 0);
        doc.text('SERVICE HISTORY REPORT', pageWidth / 2, 38, { align: 'center' });

        // ========== VEHICLE INFORMATION SECTION ==========
        let currentY = 58;
        
        // Section Title
        doc.setFillColor(245, 245, 245);
        doc.rect(14, currentY - 5, pageWidth - 28, 8, 'F');
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(31, 41, 55);
        doc.text('VEHICLE INFORMATION', 17, currentY);
        
        currentY += 10;

        // Vehicle details with improved formatting
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        
        const vehicleYear = vehicle.year ? String(vehicle.year) : 'N/A';
        const vehicleMake = vehicle.make ? String(vehicle.make) : 'N/A';
        const vehicleModel = vehicle.model ? String(vehicle.model) : 'N/A';
        const plateNumber = vehicle.plateNumber ? String(vehicle.plateNumber) : 'N/A';
        const engine = vehicle.engine ? String(vehicle.engine) : 'N/A';
        const transmission = vehicle.transmission ? String(vehicle.transmission) : 'N/A';
        const mileage = vehicle.mileage ? String(vehicle.mileage) : 'N/A';

        // Left Column
        doc.setFont('helvetica', 'bold');
        doc.text('Vehicle:', 17, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(`${vehicleYear} ${vehicleMake} ${vehicleModel}`, 45, currentY);
        
        currentY += 7;
        doc.setFont('helvetica', 'bold');
        doc.text('Plate Number:', 17, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(plateNumber, 45, currentY);
        
        currentY += 7;
        doc.setFont('helvetica', 'bold');
        doc.text('Engine:', 17, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(engine, 45, currentY);

        // Right Column
        currentY = 68;
        doc.setFont('helvetica', 'bold');
        doc.text('Transmission:', 110, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(transmission, 145, currentY);
        
        currentY += 7;
        doc.setFont('helvetica', 'bold');
        doc.text('Current Mileage:', 110, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(`${mileage} km`, 145, currentY);

        currentY += 7;
        doc.setFont('helvetica', 'bold');
        doc.text('Report Date:', 110, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }), 145, currentY);

        currentY += 12;

        // ========== SERVICE HISTORY SECTION ==========
        if (history.length > 0) {
          // Section Title
          doc.setFillColor(245, 245, 245);
          doc.rect(14, currentY - 5, pageWidth - 28, 8, 'F');
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(31, 41, 55);
          doc.text('SERVICE HISTORY', 17, currentY);
          
          currentY += 8;

          // Prepare table data with better formatting
          const tableData = history.map((service, index) => {
            try {
              const date = service.timestamp || service.date;
              const dateStr = date ? new Date(date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              }) : 'N/A';
              const serviceType = service.serviceType ? String(service.serviceType) : 'N/A';
              const description = service.description || service.diagnosis || 'N/A';
              const descStr = String(description).substring(0, 80);
              const mechanicName = service.mechanicName ? String(service.mechanicName) : 'N/A';
              const cost = service.cost ? `₱${Number(service.cost).toLocaleString()}` : 'N/A';
              const status = service.status ? String(service.status) : 'N/A';

              return [dateStr, serviceType, descStr, mechanicName, cost, status];
            } catch (rowError) {
              console.error('Error processing service record:', rowError, service);
              return ['Error', 'Error', 'Error processing record', 'N/A', 'N/A', 'N/A'];
            }
          });

          // Enhanced table with better styling
          autoTable(doc, {
            startY: currentY,
            head: [['Date', 'Service Type', 'Description', 'Mechanic', 'Cost', 'Status']],
            body: tableData,
            theme: 'grid',
            headStyles: {
              fillColor: [255, 195, 0],
              textColor: [31, 41, 55],
              fontStyle: 'bold',
              fontSize: 9,
              halign: 'center',
              cellPadding: 4,
            },
            styles: {
              fontSize: 8,
              cellPadding: 3,
              overflow: 'linebreak',
              lineColor: [220, 220, 220],
              lineWidth: 0.1,
            },
            columnStyles: {
              0: { cellWidth: 24, halign: 'center' },
              1: { cellWidth: 28, halign: 'left' },
              2: { cellWidth: 55, halign: 'left' },
              3: { cellWidth: 28, halign: 'left' },
              4: { cellWidth: 22, halign: 'right' },
              5: { cellWidth: 22, halign: 'center' },
            },
            alternateRowStyles: {
              fillColor: [250, 250, 250],
            },
            didDrawCell: (data) => {
              // Add status badge styling
              if (data.column.index === 5 && data.cell.section === 'body') {
                const status = data.cell.text[0];
                if (status === 'Completed') {
                  doc.setTextColor(34, 197, 94); // Green
                } else if (status === 'Pending') {
                  doc.setTextColor(251, 191, 36); // Yellow
                } else if (status === 'Cancelled') {
                  doc.setTextColor(239, 68, 68); // Red
                }
              }
            },
          });

          // Add summary statistics
          const finalY = doc.lastAutoTable.finalY + 10;
          if (finalY < pageHeight - 40) {
            doc.setFillColor(245, 245, 245);
            doc.rect(14, finalY, pageWidth - 28, 20, 'F');
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(31, 41, 55);
            doc.text('Summary:', 17, finalY + 7);
            
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(60, 60, 60);
            doc.text(`Total Services: ${history.length}`, 17, finalY + 14);
            
            const totalCost = history.reduce((sum, service) => {
              return sum + (Number(service.cost) || 0);
            }, 0);
            doc.text(`Total Cost: ₱${totalCost.toLocaleString()}`, 80, finalY + 14);
            
            const completedServices = history.filter(s => s.status === 'Completed').length;
            doc.text(`Completed Services: ${completedServices}`, 140, finalY + 14);
          }
        } else {
          doc.setFontSize(11);
          doc.setTextColor(150, 150, 150);
          doc.setFont('helvetica', 'italic');
          doc.text('No service history available for this vehicle.', pageWidth / 2, currentY + 20, { align: 'center' });
        }

        // ========== FOOTER SECTION ==========
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          
          // Footer background
          doc.setFillColor(245, 245, 245);
          doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');
          
          // Footer line
          doc.setDrawColor(255, 195, 0);
          doc.setLineWidth(0.5);
          doc.line(14, pageHeight - 20, pageWidth - 14, pageHeight - 20);
          
          // Page number
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
          doc.setFont('helvetica', 'normal');
          doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
          
          // Footer text
          doc.setFontSize(7);
          doc.text('© 2025 Motohub - Professional Auto Care Services', 14, pageHeight - 10);
          doc.text('This is a computer-generated document', pageWidth - 14, pageHeight - 10, { align: 'right' });
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
    const [lastServiceDisplay, setLastServiceDisplay] = useState(vehicle.lastService || 'N/A');

    const loadServiceHistory = async () => {
      try {
        setLoading(true);
        const historyRef = collection(db, `users/${user.uid}/cars/${vehicle.id}/serviceHistory`);
        const snapshot = await getDocs(historyRef);
        const history = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sort by timestamp to get the most recent
        history.sort((a, b) => {
          const dateA = new Date(a.timestamp || a.date);
          const dateB = new Date(b.timestamp || b.date);
          return dateB - dateA;
        });
        
        setServiceHistory(history);
        
        // Update last service display
        if (history.length > 0) {
          const lastService = history[0];
          const serviceDate = new Date(lastService.timestamp || lastService.date);
          const formattedDate = serviceDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          });
          setLastServiceDisplay(formattedDate);
        }
      } catch (error) {
        console.error('Error loading service history:', error);
        messageApi.error('Failed to load service history');
      } finally {
        setLoading(false);
      }
    };

    const handleHistoryClick = async () => {
      await loadServiceHistory();
      setShowHistoryModal(true);
    };

    return (
      <>
        <div className="vehicle-card">
          {vehicle.imageUrl ? (
            <div className="vehicle-card-image">
              <img src={vehicle.imageUrl} alt={`${vehicle.make} ${vehicle.model}`} />
            </div>
          ) : (
            <div className="vehicle-card-badge">
              <Car size={20} />
            </div>
          )}

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
                <span className="vehicle-spec-value">{lastServiceDisplay}</span>
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
                onClick={handleHistoryClick}
                disabled={loading}
              >
                <History size={16} />
                {loading ? 'Loading...' : 'History'}
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

  const PromoCard = ({ title, description, discount, validUntil, icon: Icon, features, savings }) => (
    <div className="promo-card">
      <div className="promo-header">
        <div className="promo-icon-wrapper">
          <Icon size={32} className="promo-icon-main" />
        </div>
        <div className="promo-badge-container">
          <div className="promo-badge">
            <Tag size={14} />
            <span>LIMITED OFFER</span>
          </div>
        </div>
      </div>
      
      <div className="promo-body">
        <h3 className="promo-title">{title}</h3>
        <p className="promo-description">{description}</p>
        
        {features && features.length > 0 && (
          <ul className="promo-features">
            {features.map((feature, index) => (
              <li key={index} className="promo-feature-item">
                <span className="promo-feature-check">✓</span>
                {feature}
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div className="promo-footer">
        <div className="promo-discount-section">
          <div className="promo-discount">{discount}</div>
          {savings && <div className="promo-savings">Save up to {savings}</div>}
        </div>
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
      {user?.role === 'superadmin' ? <SuperAdminSidebar /> : <UserSidebar />}

      <div className={`customer-main-content ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        <NavigationBar
          title="Dashboard"
          subtitle="Overview of your vehicles and services"
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
              {promotions.length > 0 ? (
                <Slider {...carouselSettings}>
                  {promotions.map((promo) => {
                    // Map icon name to component
                    let IconComponent = Wrench;
                    if (promo.icon === 'Car') IconComponent = Car;
                    else if (promo.icon === 'TrendingUp') IconComponent = TrendingUp;
                    
                    return (
                      <div key={promo.id}>
                        <PromoCard
                          icon={IconComponent}
                          title={promo.title}
                          description={promo.description}
                          discount={promo.discount}
                          savings={promo.savings}
                          validUntil={promo.validUntil}
                          features={promo.features || []}
                        />
                      </div>
                    );
                  })}
                </Slider>
              ) : (
                <div className="promo-empty-state">
                  <Tag size={48} className="promo-empty-icon" />
                  <p>No promotions available at the moment</p>
                </div>
              )}
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

          {/* My Vehicles and Quick Actions Grid */}
          <div className="vehicles-actions-grid">
            {/* My Vehicles Section */}
            <div className="section-with-title">
              <h3 className="section-title">
                <Car size={20} />
                My Vehicles
              </h3>
              {vehicles.length > 0 ? (
                <div className="my-vehicles-grid">
                  {vehicles.map(vehicle => (
                    <VehicleCard key={vehicle.id} vehicle={vehicle} />
                  ))}
                </div>
              ) : (
                <div className="no-vehicles">
                  <Car size={64} />
                  <h3>No Vehicles Yet</h3>
                  <p>Start by adding your first vehicle to track its service history</p>
                </div>
              )}
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