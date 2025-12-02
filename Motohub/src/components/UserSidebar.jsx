import React from 'react';
import { App } from 'antd';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import { useAuthNavigation } from '../hooks/useAuthNavigation';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Car, 
  FileText, 
  User,
  LogOut,
  LayoutDashboard
} from 'lucide-react';
import TriangleArrow from './TriangleArrow';
import logo from '../assets/images/logo.jpeg';
import Dock from './Dock';
import './Sidebar.css';

function NavItem({ icon: Icon, label, active = false, badge, color = "red", sidebarOpen, onClick }) {
  const badgeClass = `nav-item-badge ${color}`;
  
  return (
    <div 
      className={`nav-item ${active ? 'active' : ''}`} 
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <div className="nav-item-content">
        <Icon className="nav-item-icon" size={20} />
        {sidebarOpen && (
          <>
            <span className="nav-item-label">{label}</span>
            {badge && <span className={badgeClass}>{badge}</span>}
            {active && <TriangleArrow className="nav-item-indicator" size={16} />}
          </>
        )}
      </div>
    </div>
  );
}

export default function UserSidebar() {
  const { user } = useAuth();
  const { sidebarOpen } = useSidebar();
  const { logout } = useAuthNavigation();
  const navigate = useNavigate();
  const location = useLocation();
  const { modal } = App.useApp();

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

  const isPathActive = (path) => {
    if (path === '/userdashboard') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const renderNavItems = () => (
    <>
      <NavItem 
        icon={LayoutDashboard} 
        label="Dashboard" 
        active={isPathActive('/userdashboard')}
        sidebarOpen={sidebarOpen}
        onClick={() => navigate('/userdashboard')}
      />
      <NavItem 
        icon={Car} 
        label="My Vehicles" 
        active={isPathActive('/mycars')}
        sidebarOpen={sidebarOpen}
        onClick={() => navigate('/mycars')}
      />
      <NavItem 
        icon={FileText} 
        label="Service History" 
        active={isPathActive('/servicehistory')}
        sidebarOpen={sidebarOpen}
        onClick={() => navigate('/servicehistory')}
      />
      <NavItem
        icon={User}
        label="Profile"
        active={isPathActive('/profile')}
        sidebarOpen={sidebarOpen}
        onClick={() => navigate('/profile')}
      />
    </>
  );

  const dockItems = [
    {
      icon: <LayoutDashboard size={24} />,
      label: 'Dashboard',
      onClick: () => navigate('/userdashboard'),
      className: isPathActive('/userdashboard') ? 'active' : ''
    },
    {
      icon: <Car size={24} />,
      label: 'Vehicles',
      onClick: () => navigate('/mycars'),
      className: isPathActive('/mycars') ? 'active' : ''
    },
    {
      icon: <FileText size={24} />,
      label: 'History',
      onClick: () => navigate('/servicehistory'),
      className: isPathActive('/servicehistory') ? 'active' : ''
    },
    {
      icon: <User size={24} />,
      label: 'Profile',
      onClick: () => navigate('/profile'),
      className: isPathActive('/profile') ? 'active' : ''
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
        {/* Brand Section */}
        <div className="sidebar-brand">
          <div className="brand-logo">
            <img src={logo} alt="Motohub Logo" className="brand-logo-img" />
          </div>
          {sidebarOpen && (
            <div className="brand-text">
              <h1 className="brand-title">MOTOHUB</h1>
              <p className="brand-subtitle">Customer Portal</p>
            </div>
          )}
        </div>

        {/* User Profile Section */}
        <div className="sidebar-header">
          <div className="user-profile">
            <div className="user-avatar">
              {(() => {
                const hasPhoto = user?.photoURL && user.photoURL.trim() !== '';
                
                if (hasPhoto) {
                  return (
                    <img 
                      src={user.photoURL} 
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
                  );
                }
                return <User size={24} />;
              })()}
            </div>
            {sidebarOpen && (
              <div className="user-info">
                <div className="user-name">{user?.displayName || 'Guest User'}</div>
                <div className="user-status">
                  <div className="status-indicator"></div>
                  <span className="user-role-text">Customer</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="sidebar-nav">
          <div className="nav-section">
            {sidebarOpen && <div className="nav-section-title">MAIN MENU</div>}
            {renderNavItems()}
            <NavItem 
              icon={LogOut} 
              label="Sign Out" 
              sidebarOpen={sidebarOpen} 
              onClick={handleLogout}
            />
          </div>
        </nav>

        {/* Footer Section */}
        {sidebarOpen && (
          <div className="sidebar-footer">
            <div className="footer-info">
              <p className="footer-text">© 2025 Motohub</p>
              <p className="footer-version">v1.0.0</p>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Dock */}
      <Dock items={dockItems} />
    </>
  );
}