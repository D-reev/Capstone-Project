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
  User
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

export default function UserSidebar({ sidebarOpen, user }) {
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
    <div className={`sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
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
              <div className="user-name">{user?.displayName || 'Guest User'}</div>
              <div className="user-status">
                <div className="status-indicator"></div>
                Customer
              </div>
            </div>
          )}
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          {sidebarOpen && <div className="nav-section-title">My Services</div>}
          
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
            active={isPathActive('/profile') || isPathActive('/profilesection')}
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