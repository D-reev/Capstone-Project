import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  User,
  Wrench,
  Package,
  ClipboardList  // Add this import
} from 'lucide-react';

function NavItem({ icon: Icon, label, active = false, badge, color = "red", sidebarOpen, onClick }) {
  const badgeClass = `nav-item-badge ${color}`;
  return (
    <div 
      className={`nav-item ${active ? 'active' : ''}`} 
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <Icon className="nav-item-icon" size={20} />
      {sidebarOpen && (
        <>
          <span className="nav-item-label">{label}</span>
          {badge && <span className={badgeClass}>{badge}</span>}
        </>
      )}
    </div>
  );
}

export default function AdminSidebar({ sidebarOpen, user }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Fix the path matching logic
  const isPathActive = (path) => {
    // Exact match for dashboard to avoid matching subpaths
    if (path === '/admindashboard') {
      return location.pathname === path;
    }
    // For other routes, use startsWith to match subpaths
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
          icon={Settings} 
          label="Settings" 
          active={isPathActive('/admindashboard/settings')}
          sidebarOpen={sidebarOpen}
          onClick={() => navigate('/admindashboard/settings')}
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

  return (
    <div
      className={`sidebar ${sidebarOpen ? '' : 'collapsed'}`}
      style={{ background: 'var(--header-bg)' }} // Force sync with UserManagement sidebar
    >
      <div className="sidebar-header">
        <div className="user-profile">
          <div className="user-avatar">
            {user?.photoURL ? (
              <img src={user.photoURL} alt={user.displayName} className="user-avatar-img"/>
            ) : (
              <User size={16} />
            )}
          </div>
          {sidebarOpen && (
            <div className="user-info">
              <div className="user-name">{user?.displayName || 'Guest'}</div>
              <div className="user-status">
                <div className="status-indicator"></div>
                {user?.role === 'mechanic' ? 'Mechanic' : 'Administrator'}
              </div>
            </div>
          )}
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          {sidebarOpen && (
            <div className="nav-section-title">
              {user?.role === 'mechanic' ? 'Mechanic Controls' : 'Admin Controls'}
            </div>
          )}
          {renderNavItems()}
        </div>
      </nav>
    </div>
  );
}