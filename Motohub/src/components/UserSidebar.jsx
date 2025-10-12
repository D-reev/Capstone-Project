import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Car, 
  Calendar, 
  History, 
  FileText, 
  Settings, 
  MessageSquare,
  LogOut,
  User,
  ChevronRight
} from 'lucide-react';

function NavItem({ icon: Icon, label, active = false, badge, color = "red", sidebarOpen, onClick }) {
  const badgeClass = `nav-item-badge ${color}`;
  
  return (
    <div 
      className={`nav-item ${active ? 'active' : ''}`} 
      onClick={onClick}
      style={{ cursor: 'pointer' }}
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

export default function UserSidebar({ sidebarOpen, user, className = '', onCloseMobile }) {
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

  const isPathActive = (path) => {
    return location.pathname.startsWith(path);
  };

  return (
    <div
      className={`customer-sidebar${sidebarOpen ? '' : ' collapsed'} ${className}`.trim()}
      style={{ background: 'var(--header-bg)', minHeight: '100vh', boxShadow: '0 2px 8px rgba(35,43,62,0.06)', zIndex: 2, color: '#fff' }}
    >
      <div 
        className={`sidebar-header ${isPathActive('/profile') ? 'active' : ''}`}
        onClick={() => navigate('/profile')}
        style={{ 
          cursor: 'pointer',
          background: isPathActive('/profile') ? 'rgba(255,255,255,0.1)' : 'transparent',
          transition: 'background-color 0.2s',
          position: 'relative'
        }}
        role="button"
        title="View Profile"
      >
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
              <div className="user-name">{user?.displayName || 'Guest User'}</div>
              <div className="user-status">
                <div className="status-indicator"></div>
                Customer
              </div>
            </div>
          )}
        </div>
        {sidebarOpen && (
          <div className="profile-indicator" style={{
            opacity: 1,
            color: '#e2e8f0',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            textDecoration: 'underline'
          }}>
            <span>View Profile</span>
            <ChevronRight size={16} />
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          {sidebarOpen && <div className="nav-section-title">My Services</div>}
          {/* ...existing code... */}
          <NavItem 
            icon={Car} 
            label="My Vehicles" 
            active={isPathActive('/userdashboard')}
            sidebarOpen={sidebarOpen}
            onClick={() => navigate('/userdashboard')}
          />
          <NavItem 
            icon={FileText} 
            label="Service History" 
            active={isPathActive('/servicehistory')}
            sidebarOpen={sidebarOpen}
            onClick={() => navigate('/servicehistory')}
          />
          {/* Profile nav item */}
          <NavItem
            icon={User}
            label="Profile"
            active={isPathActive('/profile')}
            sidebarOpen={sidebarOpen}
            onClick={() => navigate('/profile')}
          />
          <NavItem 
            icon={LogOut} 
            label="Logout" 
            sidebarOpen={sidebarOpen} 
            onClick={handleLogout}
          />
        </div>
      </nav>
    </div>
  );
}