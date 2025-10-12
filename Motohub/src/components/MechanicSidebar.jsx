import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Wrench,
  ClipboardList,
  User,
  LogOut,
  Settings,
  ChevronRight
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

export default function MechanicSidebar({ sidebarOpen, user }) {
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
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <div className={`sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
      <div 
        className={`sidebar-header ${isPathActive('/mechanicdashboard/profile') ? 'active' : ''}`}
        onClick={() => navigate('/mechanicdashboard/profile')}
        style={{ 
          cursor: 'pointer',
          background: isPathActive('/mechanicdashboard/profile') ? 'rgba(255,255,255,0.1)' : 'transparent',
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
              <div className="user-name">{user?.displayName || 'Guest'}</div>
              <div className="user-status">
                <div className="status-indicator"></div>
                Mechanic
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
          {sidebarOpen && <div className="nav-section-title">Mechanic Controls</div>}
          <NavItem 
            icon={Wrench} 
            label="Dashboard" 
            active={isPathActive('/mechanicdashboard')}
            sidebarOpen={sidebarOpen}
            onClick={() => navigate('/mechanicdashboard')}
          />
          <NavItem 
            icon={ClipboardList} 
            label="My Requests" 
            active={isPathActive('/mechanicdashboard/requests')}
            sidebarOpen={sidebarOpen}
            onClick={() => navigate('/mechanicdashboard/requests')}
          />
          <NavItem 
            icon={Settings} 
            label="Settings" 
            active={isPathActive('/mechanicdashboard/settings')}
            sidebarOpen={sidebarOpen}
            onClick={() => navigate('/mechanicdashboard/settings')}
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