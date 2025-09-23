import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Bell, 
  MessageSquare,
  Menu,
  Car,
  Users,
  ShoppingCart,
  TrendingUp,
  Eye,
  Heart,
  Calendar,
  ChevronDown,
  X,
  Minus,
  RotateCw,
  User
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import TopBar from '../components/TopBar';
import ProfileModal from '../components/modals/ProfileModal';
import '../css/AdminDashboard.css';

export default function MotohubDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandableOpen, setExpandableOpen] = useState(true);
  const [collapsibleOpen, setCollapsibleOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false); // added
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  const StatCard = ({ icon: Icon, value, label, increase }) => (
    <div className="stat-card">
      <div className="stat-card-header">
        <div className="stat-card-content">
          <div className="stat-card-value">{value}</div>
          <div className="stat-card-label">{label}</div>
        </div>
        <Icon className="stat-card-icon" />
      </div>
      {increase && (
        <div className="stat-card-footer">
          <span className={increase.includes('-') ? 'stat-decrease' : 'stat-increase'}>
            {increase} increase in 30 Days
          </span>
        </div>
      )}
    </div>
  );
 
  const LargeStatCard = ({ value, label, moreInfo }) => (
    <div className="large-stat-card">
      <div className="large-stat-value">{value}</div>
      <div className="large-stat-label">{label}</div>
      <div className="large-stat-more">
        {moreInfo} →
      </div>
    </div>
  );

  const WidgetBox = ({ title, isOpen, onToggle, canClose = false, onClose, isLoading = false }) => (
    <div className="widget-box">
      <div className="widget-header">
        <span className="widget-title">{title}</span>
        <div className="widget-controls">
          {onToggle && (
            <button 
              onClick={onToggle}
              className="widget-control-btn focus-outline"
              aria-label={isOpen ? 'Collapse' : 'Expand'}
            >
              {isOpen ? <Minus size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
          {canClose && (
            <button 
              onClick={onClose}
              className="widget-control-btn focus-outline"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
      {isOpen && (
        <div className="widget-content">
          {isLoading ? (
            <div className="widget-loading">
              <RotateCw className="loading-spinner" />
            </div>
          ) : (
            <p>The body of the box</p>
          )}
        </div>
      )}
    </div>
  );

  const UserInfoBlock = ({ user }) => (
    <div className="user-info-block">
      <div className="user-info-header">
        {user?.photoURL ? (
          <img 
            src={user.photoURL} 
            alt={user.displayName} 
            className="user-avatar-large"
          />
        ) : (
          <div className="user-avatar-placeholder">
            <User size={32} />
          </div>
        )}
        <div className="user-details">
          <h3>{user?.displayName || 'Guest User'}</h3>
          <span className="user-role">{user?.role || 'Administrator'}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="dashboard-container">
      <AdminSidebar 
        sidebarOpen={sidebarOpen} 
        user={user} 
      />
      
      {/* Main Content */}
      <div className="main-content">
        {/* Top Bar - replaced inline bar with shared TopBar component */}
        <TopBar
          title="Motohub"
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          notificationsCount={4}
          onProfileClick={() => setProfileOpen(true)}
        >
          {/* preserve message icon as extra child (appears next to brand) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 8 }}>
            <MessageSquare size={18} />
          </div>
        </TopBar>

        {/* Content */}
        <div className="content-area">
          {/* Content Header */}
          <div className="content-header">
            <h2 className="content-title">Dashboard</h2>
            <p className="content-subtitle">Welcome to Motohub Management System</p>
          </div>

          {/* Top Stats Row */}
          <div className="stats-grid">
            <StatCard 
              icon={Car} 
              value="1,245" 
              label="VEHICLES" 
            />
            <StatCard 
              icon={Users} 
              value="3,847" 
              label="CUSTOMERS" 
            />
            <StatCard 
              icon={ShoppingCart} 
              value="892" 
              label="ORDERS" 
            />
            <StatCard 
              icon={TrendingUp} 
              value="₱2.4M" 
              label="REVENUE" 
            />
          </div>

          {/* Second Stats Row */}
          <div className="stats-grid">
            <StatCard 
              icon={Eye} 
              value="15,420" 
              label="PAGE VIEWS" 
              increase="17%"
            />
            <StatCard 
              icon={Heart} 
              value="8,932" 
              label="FAVORITES" 
              increase="23%"
            />
            <StatCard 
              icon={Calendar} 
              value="156" 
              label="APPOINTMENTS" 
              increase="-5%"
            />
            <StatCard 
              icon={MessageSquare} 
              value="2,847" 
              label="INQUIRIES" 
              increase="45%"
            />
          </div>

          {/* Large Stats Row */}
          <div className="stats-grid">
            <LargeStatCard 
              value="89" 
              label="New Listings" 
              moreInfo="View Details"
            />
            <LargeStatCard 
              value="94%" 
              label="Customer Satisfaction" 
              moreInfo="View Details"
            />
            <LargeStatCard 
              value="267" 
              label="Test Drives" 
              moreInfo="View Details"
            />
            <LargeStatCard 
              value="₱180K" 
              label="Daily Revenue" 
              moreInfo="View Details"
            />
          </div>

          {/* Widget Examples */}
          <div className="stats-grid">
            <WidgetBox 
              title="Vehicle Analytics"
              isOpen={expandableOpen}
              onToggle={() => setExpandableOpen(!expandableOpen)}
            />
            <WidgetBox 
              title="Customer Feedback"
              isOpen={collapsibleOpen}
              onToggle={() => setCollapsibleOpen(!collapsibleOpen)}
            />
            <WidgetBox 
              title="Sales Report"
              isOpen={true}
              canClose={true}
              onClose={() => alert('Widget closed')}
            />
            <WidgetBox 
              title="Loading Data..."
              isOpen={true}
              isLoading={true}
            />
          </div>
        </div>
      </div>

      {/* Profile modal opened from TopBar */}
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} user={user} />
    </div>
  );
}