import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getFirestore, collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { Badge, Dropdown, Space, Typography, Button, Grid } from 'antd';
import { 
  Bell, 
  Menu,
  Package,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import RequestDetailsModal from './modals/RequestDetailsModal';
import '../css/NavigationBar.css';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const NavigationBar = ({ 
  title, 
  subtitle,
  onToggleSidebar, 
  userRole, 
  userName, 
  userEmail,
  onRefresh,
  loading = false
}) => {
  const { user } = useAuth();
  const db = getFirestore();
  const screens = useBreakpoint();
  
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [requestModalOpen, setRequestModalOpen] = useState(false);

  // Responsive breakpoints
  const isMdUp = screens.md;
  const isSm = screens.sm;
  const isXs = screens.xs;

  useEffect(() => {
    if (userRole === 'admin' || userRole === 'mechanic') {
      fetchNotifications();
    }
  }, [userRole, user]);

  const handleNotificationClick = (requestId) => {
    setSelectedRequestId(requestId);
    setRequestModalOpen(true);
  };

  const handleRequestModalClose = () => {
    setRequestModalOpen(false);
    setSelectedRequestId(null);
  };

  const handleStatusChange = () => {
    // Refresh notifications after status change
    fetchNotifications();
    if (onRefresh) {
      onRefresh();
    }
  };

  const fetchNotifications = async () => {
    try {
      const notifs = [];

      if (userRole === 'admin') {
        // Fetch user-specific notifications (follow-ups)
        if (user?.uid) {
          const userNotificationsQuery = query(
            collection(db, 'users', user.uid, 'notifications'),
            orderBy('timestamp', 'desc'),
            limit(10)
          );
          const userNotificationsSnapshot = await getDocs(userNotificationsQuery);
          
          // Filter and validate each notification
          for (const notifDoc of userNotificationsSnapshot.docs) {
            const data = notifDoc.data();
            
            // If it's a follow-up notification, check if the request is still pending
            if (data.type === 'follow_up' && data.requestId) {
              try {
                const requestRef = doc(db, 'partRequests', data.requestId);
                const requestSnap = await getDoc(requestRef);
                
                // Only show if request still exists and is pending
                if (requestSnap.exists() && requestSnap.data().status === 'pending') {
                  notifs.push({
                    title: data.title || 'Notification',
                    description: data.description || '',
                    time: getTimeAgo(data.timestamp),
                    type: data.type || 'info',
                    icon: <Bell size={18} />,
                    action: () => handleNotificationClick(data.requestId),
                    isRead: data.read || false,
                    requestId: data.requestId
                  });
                }
              } catch (error) {
                console.error('Error validating notification:', error);
              }
            } else {
              // Show other notification types as is
              notifs.push({
                title: data.title || 'Notification',
                description: data.description || '',
                time: getTimeAgo(data.timestamp),
                type: data.type || 'info',
                icon: data.type === 'follow_up' ? <Bell size={18} /> : <Package size={18} />,
                action: () => handleNotificationClick(data.requestId),
                isRead: data.read || false,
                requestId: data.requestId
              });
            }
          }
        }
        
        // Fetch pending part requests
        const requestsQuery = query(
          collection(db, 'partRequests'),
          where('status', '==', 'pending'),
          orderBy('timestamp', 'desc'),
          limit(5)
        );
        const requestsSnapshot = await getDocs(requestsQuery);
        
        requestsSnapshot.forEach(doc => {
          const data = doc.data();
          // Only show pending requests
          if (data.status === 'pending') {
            notifs.push({
              title: 'New Part Request',
              description: `${data.mechanicName || 'Mechanic'} requested ${data.parts?.length || 0} part(s)`,
              time: getTimeAgo(data.timestamp),
              type: 'request',
              icon: <Package size={18} />,
              action: () => handleNotificationClick(doc.id),
              requestId: doc.id
            });
          }
        });

        // Check low stock items
        const inventorySnapshot = await getDocs(collection(db, 'inventory'));
        let lowStockCount = 0;
        
        inventorySnapshot.forEach(doc => {
          const data = doc.data();
          if (data.quantity <= data.reorderLevel) {
            lowStockCount++;
          }
        });

        if (lowStockCount > 0) {
          notifs.push({
            title: 'Low Stock Alert',
            description: `${lowStockCount} item${lowStockCount > 1 ? 's' : ''} running low on stock`,
            time: 'Now',
            type: 'urgent',
            icon: <AlertCircle size={18} />,
            action: () => console.log('View inventory')
          });
        }
      }

      if (userRole === 'mechanic') {
        // Fetch user-specific notifications (request status changes)
        if (user?.uid) {
          const userNotificationsQuery = query(
            collection(db, 'users', user.uid, 'notifications'),
            orderBy('timestamp', 'desc'),
            limit(10)
          );
          const userNotificationsSnapshot = await getDocs(userNotificationsQuery);
          
          userNotificationsSnapshot.forEach(doc => {
            const data = doc.data();
            const isApproved = data.status === 'approved';
            const isRejected = data.status === 'rejected';
            
            notifs.push({
              title: data.title || 'Notification',
              description: data.description || '',
              time: getTimeAgo(data.timestamp),
              type: data.type || 'info',
              icon: isApproved ? <CheckCircle size={18} /> : isRejected ? <XCircle size={18} /> : <Package size={18} />,
              action: () => handleNotificationClick(data.requestId),
              isRead: data.read || false,
              requestId: data.requestId
            });
          });
        }
        
        // Fetch pending service requests
        const usersSnapshot = await getDocs(collection(db, 'users'));
        let pendingTasks = 0;
        
        for (const userDoc of usersSnapshot.docs) {
          const carsSnapshot = await getDocs(collection(db, 'users', userDoc.id, 'cars'));
          
          for (const carDoc of carsSnapshot.docs) {
            const serviceQuery = query(
              collection(db, 'users', userDoc.id, 'cars', carDoc.id, 'serviceHistory'),
              where('status', '==', 'pending'),
              limit(3)
            );
            const serviceSnapshot = await getDocs(serviceQuery);
            pendingTasks += serviceSnapshot.size;
          }
        }

        if (pendingTasks > 0) {
          notifs.push({
            title: 'Pending Service Tasks',
            description: `You have ${pendingTasks} pending service task${pendingTasks > 1 ? 's' : ''}`,
            time: 'Today',
            type: 'info',
            icon: <Clock size={18} />,
            action: () => console.log('View tasks')
          });
        }
      }

      setNotifications(notifs);
      setNotificationCount(notifs.length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Recently';
    
    const now = new Date();
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffInMinutes = Math.floor((now - date) / 60000);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
    if (userRole === 'admin' || userRole === 'mechanic') {
      fetchNotifications();
    }
  };

  const notificationMenuItems = notifications.length > 0 ? [
    {
      key: 'header',
      label: (
        <div className="notification-header">
          <span className="notification-header-title">Notifications</span>
          <Badge count={notificationCount} className="notification-header-badge" />
        </div>
      ),
      disabled: true
    },
    { type: 'divider' },
    ...notifications.map((notif, index) => ({
      key: `notif-${index}`,
      label: (
        <div className="notification-item" onClick={notif.action}>
          <div className={`notification-item-icon ${notif.type}`}>
            {notif.icon}
          </div>
          <div className="notification-item-content">
            <div className="notification-item-header">
              <span className="notification-item-title">{notif.title}</span>
              <span className="notification-item-time">{notif.time}</span>
            </div>
            <p className="notification-item-description">{notif.description}</p>
          </div>
        </div>
      )
    })),
    { type: 'divider' },
    {
      key: 'view-all',
      label: (
        <div className="notification-footer">
          <span>View all notifications</span>
        </div>
      )
    }
  ] : [
    {
      key: 'empty',
      label: (
        <div className="notification-empty">
          <CheckCircle size={32} />
          <span>All caught up!</span>
          <p>No new notifications</p>
        </div>
      ),
      disabled: true
    }
  ];

  // Generate subtitle if not provided
  const defaultSubtitle = "Overview • Management • Reports";

  return (
    <nav className="navigation-bar">
      <Space
        direction="vertical"
        size={0}
        style={{ minWidth: 0, flex: 1 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            className="nav-toggle-btn"
            onClick={onToggleSidebar}
            aria-label="Toggle Sidebar"
          >
            <Menu size={20} />
          </button>
          
          <Title
            level={isMdUp ? 4 : 5}
            style={{
              margin: 0,
              color: '#FFC300',
              fontSize: isMdUp ? 'clamp(18px, 2.2vw, 22px)' : '18px',
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </Title>
        </div>
        
        {!isXs && (
          <Text 
            type="secondary" 
            style={{ 
              fontSize: 12,
              marginLeft: isMdUp ? '44px' : '32px',
              color: 'rgba(255, 255, 255, 0.5)'
            }}
          >
            {subtitle || defaultSubtitle}
          </Text>
        )}
      </Space>

      <Space size={isMdUp ? 12 : 8} wrap={false}>
        {onRefresh && (
          <Button
            icon={<RefreshCw size={16} />}
            onClick={handleRefresh}
            loading={loading}
            style={{
              borderColor: '#FFC300',
              color: '#FFC300',
              borderRadius: 999,
              background: 'rgba(255, 195, 0, 0.08)',
            }}
            size={isMdUp ? 'middle' : 'small'}
            className="nav-refresh-btn"
          >
            {isMdUp ? 'Refresh' : null}
          </Button>
        )}

        {(userRole === 'admin' || userRole === 'mechanic') && (
          <Dropdown
            menu={{ items: notificationMenuItems }}
            trigger={['click']}
            placement="bottomRight"
            overlayClassName="nav-dropdown notification-dropdown"
          >
            <Badge count={notificationCount} size="small" offset={[-4, 4]}>
              <button className="nav-icon-btn" aria-label="Notifications">
                <Bell size={18} />
              </button>
            </Badge>
          </Dropdown>
        )}
      </Space>

      {/* Request Details Modal */}
      <RequestDetailsModal
        requestId={selectedRequestId}
        open={requestModalOpen}
        onClose={handleRequestModalClose}
        onStatusChange={handleStatusChange}
      />
    </nav>
  );
};

export default NavigationBar;
