import React, { useState, useEffect } from 'react';
import { App } from 'antd';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import { useAuthNavigation } from '../hooks/useAuthNavigation';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard,
  LogOut,
  ChevronRight,
  ChevronDown,
  Crown,
  User,
  Users,
  Package,
  ClipboardList,
  FileText,
  Tag,
  Settings,
  Car,
  Wrench
} from 'lucide-react';
import logo from '../assets/images/logo.jpeg';
import Dock from './Dock';
import './Sidebar.css';
import TriangleArrow from './TriangleArrow';

// Using shared TriangleArrow component from ./TriangleArrow

function NavItem({ icon: Icon, label, active = false, badge, color = "red", sidebarOpen, onClick }) {
  const badgeClass = `nav-item-badge ${color}`;
  return (
    <div 
      className={`nav-item ${active ? 'active' : ''}`} 
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="nav-item-content">
        <Icon className="nav-item-icon" size={20} />
        {sidebarOpen && (
          <>
            <span className="nav-item-label">{label}</span>
            {badge && <span className={badgeClass}>{badge}</span>}
            {active && <TriangleArrow className="nav-item-indicator" size={12} />}
          </>
        )}
      </div>
    </div>
  );
}

function CollapsibleSection({ icon: Icon, label, sidebarOpen, isOpen, onToggle, children, badge, color = "blue" }) {
  const badgeClass = `nav-item-badge ${color}`;
  return (
    <>
      <div 
        className="nav-item collapsible"
        onClick={onToggle}
        style={{ cursor: 'pointer' }}
      >
        <div className="nav-item-content">
          <Icon className="nav-item-icon" size={20} />
          {sidebarOpen && (
            <>
              <span className="nav-item-label">{label}</span>
              {badge && <span className={badgeClass}>{badge}</span>}
              <TriangleArrow className="nav-item-indicator" size={12} down={isOpen} />
            </>
          )}
        </div>
      </div>
      {isOpen && sidebarOpen && (
        <div className="nav-section-children">
          {children}
        </div>
      )}
    </>
  );
}

function ChildNavItem({ label, active = false, sidebarOpen, onClick }) {
  return (
    <div 
      className={`nav-item-child ${active ? 'active' : ''}`}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <div className="nav-item-child-content">
        <div className="child-dot"></div>
        {sidebarOpen && (
          <>
            <span className="nav-item-label">{label}</span>
            {active && <TriangleArrow className="nav-item-indicator" size={10} />}
          </>
        )}
      </div>
    </div>
  );
}

export default function SuperAdminSidebar() {
  const { user } = useAuth();
  const { sidebarOpen } = useSidebar();
  const { logout } = useAuthNavigation();
  const navigate = useNavigate();
  const location = useLocation();
  const { modal } = App.useApp();
  const [profilePhoto, setProfilePhoto] = useState(null);
  
  const [expandedSections, setExpandedSections] = useState(() => {
    const saved = localStorage.getItem('superAdminExpandedSections');
    return saved ? JSON.parse(saved) : {
      adminPages: true,
      userPages: false,
      mechanicPages: false
    };
  });

  // Fetch profile photo from Firestore
  useEffect(() => {
    const fetchProfilePhoto = async () => {
      if (user?.uid) {
        try {
          const { getFirestore, doc, getDoc } = await import('firebase/firestore');
          const db = getFirestore();
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setProfilePhoto(userData.photoURL || null);
          }
        } catch (error) {
          console.error('Error fetching profile photo:', error);
        }
      }
    };
    fetchProfilePhoto();
  }, [user?.uid]);

  // Persist expanded sections to localStorage
  useEffect(() => {
    localStorage.setItem('superAdminExpandedSections', JSON.stringify(expandedSections));
  }, [expandedSections]);

  const handleLogout = () => {
    modal.confirm({
      title: 'Confirm Logout',
      content: 'Are you sure you want to logout?',
      okText: 'Yes, Logout',
      cancelText: 'Cancel',
      centered: true,
      okButtonProps: {
        style: {
          background: 'linear-gradient(135deg, #FFC300, #FFD54F)',
          borderColor: '#FFC300',
          color: '#000',
          fontWeight: 600
        }
      },
      onOk() {
        logout().catch((error) => {
          console.error('Error logging out:', error);
        });
      }
    });
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  const isPathActive = (path) => {
    if (location.pathname === path) return true;
    if (location.pathname.startsWith(`${path}/`)) return true;
    return false;
  };
  
  const isDashboardActive = () => {
    return location.pathname === '/admindashboard';
  };

  const isMechanicDashboardActive = () => {
    return location.pathname === '/mechanicdashboard';
  };

  const renderNavItems = () => {
    return (
      <>
        {/* Dashboard */}
        <NavItem 
          icon={LayoutDashboard} 
          label="Dashboard" 
          active={isDashboardActive()}
          sidebarOpen={sidebarOpen}
          onClick={() => navigate('/admindashboard')}
        />

        {/* Activity Logs */}
        <NavItem 
          icon={FileText} 
          label="Activity Logs" 
          active={isPathActive('/admindashboard/logs')}
          sidebarOpen={sidebarOpen}
          onClick={() => navigate('/admindashboard/logs')}
        />

        {/* Admin Pages Section */}
        <CollapsibleSection
          icon={Settings}
          label="Admin Pages"
          sidebarOpen={sidebarOpen}
          isOpen={expandedSections.adminPages}
          onToggle={() => toggleSection('adminPages')}
          color="blue"
        >
          <ChildNavItem
            label="User Management"
            active={isPathActive('/admindashboard/users')}
            sidebarOpen={sidebarOpen}
            onClick={() => navigate('/admindashboard/users')}
          />
          <ChildNavItem
            label="Inventory"
            active={isPathActive('/admindashboard/inventory')}
            sidebarOpen={sidebarOpen}
            onClick={() => navigate('/admindashboard/inventory')}
          />
          <ChildNavItem
            label="Parts Requests"
            active={isPathActive('/admindashboard/adminrequest')}
            sidebarOpen={sidebarOpen}
            onClick={() => navigate('/admindashboard/adminrequest')}
          />
          <ChildNavItem
            label="Promotions"
            active={isPathActive('/admindashboard/promotions')}
            sidebarOpen={sidebarOpen}
            onClick={() => navigate('/admindashboard/promotions')}
          />
        </CollapsibleSection>

        {/* User Pages Section */}
        <CollapsibleSection
          icon={Users}
          label="User Pages"
          sidebarOpen={sidebarOpen}
          isOpen={expandedSections.userPages}
          onToggle={() => toggleSection('userPages')}
          color="green"
        >
          <ChildNavItem
            label="Dashboard"
            active={isPathActive('/userdashboard')}
            sidebarOpen={sidebarOpen}
            onClick={() => navigate('/userdashboard')}
          />
          <ChildNavItem
            label="My Vehicles"
            active={isPathActive('/mycars')}
            sidebarOpen={sidebarOpen}
            onClick={() => navigate('/mycars')}
          />
          <ChildNavItem
            label="Service History"
            active={isPathActive('/servicehistory')}
            sidebarOpen={sidebarOpen}
            onClick={() => navigate('/servicehistory')}
          />
          <ChildNavItem
            label="Profile"
            active={isPathActive('/profile')}
            sidebarOpen={sidebarOpen}
            onClick={() => navigate('/profile')}
          />
        </CollapsibleSection>

        {/* Mechanic Pages Section */}
        <CollapsibleSection
          icon={Wrench}
          label="Mechanic Pages"
          sidebarOpen={sidebarOpen}
          isOpen={expandedSections.mechanicPages}
          onToggle={() => toggleSection('mechanicPages')}
          color="orange"
        >
          <ChildNavItem
            label="Dashboard"
            active={isMechanicDashboardActive()}
            sidebarOpen={sidebarOpen}
            onClick={() => navigate('/mechanicdashboard')}
          />
          <ChildNavItem
            label="My Requests"
            active={isPathActive('/mechanicdashboard/requests')}
            sidebarOpen={sidebarOpen}
            onClick={() => navigate('/mechanicdashboard/requests')}
          />
        </CollapsibleSection>

        <NavItem 
          icon={LogOut} 
          label="Logout" 
          sidebarOpen={sidebarOpen} 
          onClick={handleLogout}
        />
      </>
    );
  };

  const dockItems = [
    {
      icon: <LayoutDashboard size={24} />,
      label: 'Dashboard',
      onClick: () => navigate('/admindashboard'),
      className: isDashboardActive() ? 'active' : ''
    },
    {
      icon: <LogOut size={24} />,
      label: 'Logout',
      onClick: handleLogout,
      className: ''
    }
  ];

  return (
    <>
      <div className={`sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
        {/* Brand/Logo Section */}
        <div className="sidebar-brand">
          <div className="brand-logo">
            <img src={logo} alt="Motohub Logo" className="brand-logo-img" />
          </div>
          {sidebarOpen && (
            <div className="brand-text">
              <h1 className="brand-title">MOTOHUB</h1>
              <p className="brand-subtitle">Super Admin Portal</p>
            </div>
          )}
        </div>

        {/* User Profile Section */}
        <div className="sidebar-header">
          <div className="user-profile">
            <div className="user-avatar">
              {profilePhoto && profilePhoto.trim() !== '' ? (
                <img 
                  src={profilePhoto} 
                  alt={user?.displayName || 'User'} 
                  className="user-avatar-img"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const parent = e.target.parentElement;
                    if (parent && !parent.querySelector('.fallback-icon')) {
                      const icon = document.createElement('div');
                      icon.className = 'fallback-icon';
                      icon.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
                      parent.appendChild(icon);
                    }
                  }}
                />
              ) : (
                <User size={24} />
              )}
            </div>
            {sidebarOpen && (
              <div className="user-info">
                <div className="user-name">{user?.displayName || 'Guest'}</div>
                <div className="user-status">
                  <div className="status-indicator"></div>
                  <span className="user-role-text">
                    <Crown size={12} style={{ marginRight: '4px', display: 'inline' }} />
                    Super Administrator
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="sidebar-nav">
          <div className="nav-section">
            {sidebarOpen && (
              <div className="nav-section-title">SUPER ADMIN MENU</div>
            )}
            {renderNavItems()}
          </div>
        </nav>

        {/* Footer Section */}
        {sidebarOpen && (
          <div className="sidebar-footer">
            <div className="footer-info">
              <p className="footer-text">© 2025 Motohub</p>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Dock */}
      <Dock items={dockItems} />
    </>
  );
}
