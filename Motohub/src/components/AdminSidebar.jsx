import React from 'react';
import { App } from 'antd';
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
  Tag
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
      style={{ cursor: onClick ? 'pointer' : 'default' }}
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

export default function AdminSidebar() {
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
  
  const isPathActive = (path, isSuperAdmin = false) => {
    const basePath = isSuperAdmin ? '/superadmin' : '/admindashboard';
    const fullPath = basePath + (path === '/' ? '' : path);
    
    if (path === '/' || path === '') {
      return location.pathname === fullPath || location.pathname === basePath;
    }
    return location.pathname === fullPath || location.pathname.startsWith(`${fullPath}/`);
  };

  const isSuperAdmin = location.pathname.startsWith('/superadmin');

  const renderNavItems = () => {
    const basePath = isSuperAdmin ? '/superadmin' : '/admindashboard';
    
    return (
      <>
        <NavItem 
          icon={LayoutDashboard} 
          label="Dashboard" 
          active={isPathActive('/', isSuperAdmin)}
          sidebarOpen={sidebarOpen}
          onClick={() => navigate(`${basePath}`)}
        />
        <NavItem 
          icon={Users} 
          label="User Management" 
          active={isPathActive('/users', isSuperAdmin)}
          sidebarOpen={sidebarOpen}
          onClick={() => navigate(`${basePath}/users`)}
        />
        <NavItem 
          icon={Package} 
          label="Inventory" 
          active={isPathActive('/inventory', isSuperAdmin)}
          sidebarOpen={sidebarOpen}
          onClick={() => navigate(`${basePath}/inventory`)}
        />
        <NavItem 
          icon={ClipboardList} 
          label="Parts Requests" 
          active={isPathActive('/adminrequest', isSuperAdmin)}
          sidebarOpen={sidebarOpen}
          onClick={() => navigate(`${basePath}/adminrequest`)}
        />  
        <NavItem
          icon={Tag}
          label="Promotions"
          active={isPathActive('/promotions', isSuperAdmin)}
          sidebarOpen={sidebarOpen}
          onClick={() => navigate(`${basePath}/promotions`)}
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

  const basePath = isSuperAdmin ? '/superadmin' : '/admindashboard';

  const dockItems = [
    {
      icon: <LayoutDashboard size={24} />,
      label: 'Dashboard',
      onClick: () => navigate(`${basePath}`),
      className: isPathActive('/', isSuperAdmin) ? 'active' : ''
    },
    {
      icon: <Users size={24} />,
      label: 'Users',
      onClick: () => navigate(`${basePath}/users`),
      className: isPathActive('/users', isSuperAdmin) ? 'active' : ''
    },
    {
      icon: <Package size={24} />,
      label: 'Inventory',
      onClick: () => navigate(`${basePath}/inventory`),
      className: isPathActive('/inventory', isSuperAdmin) ? 'active' : ''
    },
    {
      icon: <ClipboardList size={24} />,
      label: 'Requests',
      onClick: () => navigate(`${basePath}/adminrequest`),
      className: (isPathActive('/requests', isSuperAdmin) || isPathActive('/adminrequest', isSuperAdmin)) ? 'active' : ''
    },
    {
      icon: <Tag size={24} />,
      label: 'Promotions',
      onClick: () => navigate(`${basePath}/promotions`),
      className: isPathActive('/promotions', isSuperAdmin) ? 'active' : ''
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