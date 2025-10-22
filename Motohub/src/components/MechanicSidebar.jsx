import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useAuthNavigation } from '../hooks/useAuthNavigation';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Wrench,
  ClipboardList,
  User,
  LogOut,
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

export default function MechanicSidebar({ sidebarOpen }) {
  const { user } = useAuth();
  const { logout } = useAuthNavigation();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      const success = await logout();
      if (success) {
        console.log('Logged out successfully');
      }
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className={`sidebar ${sidebarOpen ? '' : 'collapsed'}`} style={{ background: 'var(--header-bg)' }}>
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
                Mechanic
              </div>
            </div>
          )}
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          {sidebarOpen && <div className="nav-section-title">Mechanic Controls</div>}
          <NavItem 
            icon={Wrench} 
            label="Dashboard" 
            active={location.pathname === '/mechanicdashboard'}
            sidebarOpen={sidebarOpen}
            onClick={() => navigate('/mechanicdashboard')}
          />
          <NavItem 
            icon={ClipboardList} 
            label="My Requests" 
            active={location.pathname === '/mechanicdashboard/requests'}
            sidebarOpen={sidebarOpen}
            onClick={() => navigate('/mechanicdashboard/requests')}
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