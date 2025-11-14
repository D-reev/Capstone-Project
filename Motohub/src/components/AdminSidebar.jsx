import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import { useAuthNavigation } from '../hooks/useAuthNavigation';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard,
  Users,
  LogOut,
  User,
  Package,
  ClipboardList,
  FileText,
  ChevronRight,
  Tag
} from 'lucide-react';
import logo from '../assets/images/logo.jpeg';
import Dock from './Dock';
import './Sidebar.css';

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
            {active && <ChevronRight className="nav-item-indicator" size={16} />}
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminSidebar() {
  const { user } = useAuth();
  const { sidebarOpen } = useSidebar();
  const { logout } = useAuthNavigation();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  
  const isPathActive = (path) => {
    if (path === '/admindashboard') {
      return location.pathname === path;
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const renderNavItems = () => {
    return (
      <>
        <NavItem 
          icon={LayoutDashboard} 
          label="Dashboard" 
          active={isPathActive('/admindashboard')}
          sidebarOpen={sidebarOpen}
          onClick={() => navigate('/admindashboard')}
        />
        <NavItem 
          icon={Users} 
          label="User Management" 
          active={isPathActive('/admindashboard/users')}
          sidebarOpen={sidebarOpen}
          onClick={() => navigate('/admindashboard/users')}
        />
        <NavItem 
          icon={Package} 
          label="Inventory" 
          active={isPathActive('/admindashboard/inventory')}
          sidebarOpen={sidebarOpen}
          onClick={() => navigate('/admindashboard/inventory')}
        />
        <NavItem 
          icon={ClipboardList} 
          label="Parts Requests" 
          active={isPathActive('/admindashboard/adminrequest')}
          sidebarOpen={sidebarOpen}
          onClick={() => navigate('/admindashboard/adminrequest')}
        />  
        <NavItem
          icon={FileText}
          label="Activity Logs"
          active={isPathActive('/admindashboard/logs')}
          sidebarOpen={sidebarOpen}
          onClick={() => navigate('/admindashboard/logs')}
        />
        <NavItem
          icon={Tag}
          label="Promotions"
          active={isPathActive('/admindashboard/promotions')}
          sidebarOpen={sidebarOpen}
          onClick={() => navigate('/admindashboard/promotions')}
        />
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
      className: isPathActive('/admindashboard') ? 'active' : ''
    },
    {
      icon: <Users size={24} />,
      label: 'Users',
      onClick: () => navigate('/admindashboard/users'),
      className: isPathActive('/admindashboard/users') ? 'active' : ''
    },
    {
      icon: <Package size={24} />,
      label: 'Inventory',
      onClick: () => navigate('/admindashboard/inventory'),
      className: isPathActive('/admindashboard/inventory') ? 'active' : ''
    },
    {
      icon: <ClipboardList size={24} />,
      label: 'Requests',
      onClick: () => navigate('/admindashboard/adminrequest'),
      className: isPathActive('/admindashboard/adminrequest') ? 'active' : ''
    },
    {
      icon: <FileText size={24} />,
      label: 'Logs',
      onClick: () => navigate('/admindashboard/logs'),
      className: isPathActive('/admindashboard/logs') ? 'active' : ''
    },
    {
      icon: <Tag size={24} />,
      label: 'Promotions',
      onClick: () => navigate('/admindashboard/promotions'),
      className: isPathActive('/admindashboard/promotions') ? 'active' : ''
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
              <p className="brand-subtitle">Admin Portal</p>
            </div>
          )}
        </div>

        {/* User Profile Section */}
        <div className="sidebar-header">
          <div className="user-profile">
            <div className="user-avatar">
              {user?.photoURL && user.photoURL.trim() !== '' ? (
                <img src={user.photoURL} alt={user?.displayName || 'User'} className="user-avatar-img" />
              ) : (
                <User size={24} />
              )}
            </div>
            {sidebarOpen && (
              <div className="user-info">
                <div className="user-name">{user?.displayName || 'Guest'}</div>
                <div className="user-status">
                  <div className="status-indicator"></div>
                  <span className="user-role-text">Administrator</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="sidebar-nav">
          <div className="nav-section">
            {sidebarOpen && (
              <div className="nav-section-title">MAIN MENU</div>
            )}
            {renderNavItems()}
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