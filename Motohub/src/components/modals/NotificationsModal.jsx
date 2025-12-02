import React, { useState, useEffect } from 'react';
import { Modal, List, Badge, Empty, Divider, Spin, Input, App, Button } from 'antd';
import { getFirestore, collection, query, where, getDocs, orderBy, doc, updateDoc, getDoc, writeBatch } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { 
  Bell, 
  Package, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock,
  Search as SearchIcon,
  CheckCheck
} from 'lucide-react';
import './Modal.css';

const { Search } = Input;

export default function NotificationsModal({ open, onClose, onNotificationClick, onMarkAsRead, onRefreshNotifications, userRole }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  // filters removed: only search remains
  const [searchText, setSearchText] = useState('');
  const db = getFirestore();
  const { message: messageApi } = App.useApp();

  useEffect(() => {
    if (open && user) {
      fetchAllNotifications();
    }
  }, [open, user]);

  useEffect(() => {
    applyFilters();
  }, [notifications, searchText]);

  const fetchAllNotifications = async () => {
    setLoading(true);
    try {
      const notifs = [];

      if (userRole === 'admin') {
        // Fetch user-specific notifications (follow-ups)
        if (user?.uid) {
          const userNotificationsQuery = query(
            collection(db, 'users', user.uid, 'notifications'),
            orderBy('timestamp', 'desc')
          );
          const userNotificationsSnapshot = await getDocs(userNotificationsQuery);
          
          for (const notifDoc of userNotificationsSnapshot.docs) {
            const data = notifDoc.data();
            
            if (data.type === 'follow_up' && data.requestId) {
              try {
                const requestRef = doc(db, 'partRequests', data.requestId);
                const requestSnap = await getDoc(requestRef);
                
                if (requestSnap.exists()) {
                  const requestData = requestSnap.data();
                  notifs.push({
                    id: notifDoc.id,
                    title: data.title || 'Notification',
                    description: data.description || '',
                    timestamp: data.timestamp,
                    time: getTimeAgo(data.timestamp),
                    type: data.type || 'info',
                    status: requestData.status,
                    icon: <Bell size={18} />,
                    isRead: data.read || false,
                    requestId: data.requestId
                  });
                }
              } catch (error) {
                console.error('Error validating notification:', error);
              }
            } else {
              notifs.push({
                id: notifDoc.id,
                title: data.title || 'Notification',
                description: data.description || '',
                timestamp: data.timestamp,
                time: getTimeAgo(data.timestamp),
                type: data.type || 'info',
                status: data.status || 'pending',
                icon: <Bell size={18} />,
                isRead: data.read || false,
                requestId: data.requestId
              });
            }
          }
        }
        
        // Fetch all part requests
        const requestsQuery = query(
          collection(db, 'partRequests'),
          orderBy('timestamp', 'desc')
        );
        const requestsSnapshot = await getDocs(requestsQuery);
        
        requestsSnapshot.forEach(docSnap => {
          const data = docSnap.data();
          notifs.push({
            id: docSnap.id,
            title: 'Part Request',
            description: `${data.mechanicName || 'Mechanic'} requested ${data.parts?.length || 0} part(s)`,
            timestamp: data.timestamp,
            time: getTimeAgo(data.timestamp),
            type: 'request',
            status: data.status,
            icon: <Package size={18} />,
            isRead: data.status !== 'pending',
            requestId: docSnap.id
          });
        });
      }

      if (userRole === 'mechanic') {
        if (user?.uid) {
          const userNotificationsQuery = query(
            collection(db, 'users', user.uid, 'notifications'),
            orderBy('timestamp', 'desc')
          );
          const userNotificationsSnapshot = await getDocs(userNotificationsQuery);
          
          userNotificationsSnapshot.forEach(docSnap => {
            const data = docSnap.data();
            const isApproved = data.status === 'approved';
            const isRejected = data.status === 'rejected';
            
            notifs.push({
              id: docSnap.id,
              title: data.title || 'Notification',
              description: data.description || '',
              timestamp: data.timestamp,
              time: getTimeAgo(data.timestamp),
              type: data.type || 'info',
              status: data.status,
              icon: isApproved ? <CheckCircle size={18} /> : isRejected ? <XCircle size={18} /> : <Package size={18} />,
              isRead: data.read || false,
              requestId: data.requestId
            });
          });
        }
      }

      // Sort by timestamp
      notifs.sort((a, b) => {
        const timeA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
        const timeB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
        return timeB - timeA;
      });

      setNotifications(notifs);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      messageApi.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...notifications];

    // No type/status filters — only search remains

    // Filter by search text
    if (searchText) {
      filtered = filtered.filter(notif =>
        notif.title.toLowerCase().includes(searchText.toLowerCase()) ||
        notif.description.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    setFilteredNotifications(filtered);
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

  const markAsRead = async (notificationId) => {
    try {
      if (onMarkAsRead) {
        await onMarkAsRead(notificationId);
      }
      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const batch = writeBatch(db);
      const unreadNotifs = notifications.filter(notif => !notif.isRead && notif.id && notif.id.length > 10);

      if (unreadNotifs.length === 0) {
        messageApi.info('All notifications are already read');
        return;
      }

      // Update all unread notifications in Firestore
      unreadNotifs.forEach(notif => {
        const notifRef = doc(db, 'users', user.uid, 'notifications', notif.id);
        batch.update(notifRef, { read: true });
      });

      await batch.commit();

      // Update local state
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, isRead: true }))
      );

      // Refresh parent component's notifications
      if (onRefreshNotifications) {
        await onRefreshNotifications();
      }

      messageApi.success(`Marked ${unreadNotifs.length} notification${unreadNotifs.length > 1 ? 's' : ''} as read`);
    } catch (error) {
      console.error('Error marking all as read:', error);
      messageApi.error('Failed to mark all as read');
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead && notification.id) {
      await markAsRead(notification.id);
    }
    
    if (onNotificationClick && notification.requestId) {
      onNotificationClick(notification.requestId);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#52c41a';
      case 'rejected': return '#ff4d4f';
      case 'pending': return '#faad14';
      default: return '#1890ff';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'request': return 'Request';
      case 'follow_up': return 'Follow Up';
      case 'urgent': return 'Urgent';
      case 'info': return 'Info';
      default: return 'Notification';
    }
  };

  return (
    <Modal
      title="All Notifications"
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
      centered
      zIndex={1100}
    >
      <style>
        {`
          .ant-modal-header {
            background: linear-gradient(135deg, #FFC300, #FFD54F);
          }
          .ant-modal-title {
            color: #000 !important;
            font-weight: 700;
            font-size: 18px;
          }
          .notif-modal-filters {
            display: flex;
            gap: 12px;
            margin-bottom: 16px;
            align-items: center;
            flex-wrap: wrap;
          }
          .notif-modal-search {
            flex: 1;
            min-width: 200px;
          }
          .notif-modal-list .ant-list-item {
            padding: 12px;
            cursor: pointer;
            transition: background 0.2s;
            border-radius: 8px;
          }
          .notif-modal-list .ant-list-item:hover {
            background: #f5f5f5;
          }
          .notif-modal-list .ant-list-item.unread {
            background: #FFF9E6;
          }
          .notif-item-wrapper {
            display: flex;
            gap: 12px;
            width: 100%;
          }
          .notif-item-icon {
            flex-shrink: 0;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255, 195, 0, 0.1);
            color: #FFC300;
          }
          .notif-item-icon.request {
            background: rgba(24, 144, 255, 0.1);
            color: #1890ff;
          }
          .notif-item-icon.urgent {
            background: rgba(255, 77, 79, 0.1);
            color: #ff4d4f;
          }
          .notif-item-icon.approved {
            background: rgba(82, 196, 26, 0.1);
            color: #52c41a;
          }
          .notif-item-icon.rejected {
            background: rgba(255, 77, 79, 0.1);
            color: #ff4d4f;
          }
          .notif-item-content {
            flex: 1;
            min-width: 0;
          }
          .notif-item-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 4px;
          }
          .notif-item-title {
            font-weight: 600;
            font-size: 14px;
            color: #000;
          }
          .notif-item-time {
            font-size: 12px;
            color: #999;
            white-space: nowrap;
          }
          .notif-item-description {
            font-size: 13px;
            color: #666;
            margin: 0;
          }
          .notif-item-meta {
            display: flex;
            gap: 8px;
            margin-top: 8px;
          }
          .notif-badge {
            font-size: 11px;
            padding: 2px 8px;
            border-radius: 12px;
            font-weight: 500;
          }
        `}
      </style>

      <div className="notif-modal-filters">
        <Search
          placeholder="Search notifications..."
          onChange={(e) => setSearchText(e.target.value)}
          value={searchText}
          className="notif-modal-search"
          prefix={<SearchIcon />}
          allowClear
        />
        <Button
          type="default"
          icon={<CheckCheck size={16} />}
          onClick={markAllAsRead}
          disabled={loading || notifications.filter(n => !n.isRead && n.id && n.id.length > 10).length === 0}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            borderColor: '#FFC300',
            color: '#FFC300',
            fontWeight: 600
          }}
        >
          Mark All Read
        </Button>
      </div>

      <Divider style={{ margin: '12px 0' }} />

      <Spin spinning={loading}>
        <List
          className="notif-modal-list"
          dataSource={filteredNotifications}
          style={{ maxHeight: 500, overflowY: 'auto' }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No notifications found"
              />
            )
          }}
          renderItem={(notif) => (
            <List.Item
              className={!notif.isRead ? 'unread' : ''}
              onClick={() => handleNotificationClick(notif)}
            >
              <div className="notif-item-wrapper">
                <div className={`notif-item-icon ${notif.type} ${notif.status === 'approved' ? 'approved' : notif.status === 'rejected' ? 'rejected' : ''}`}>
                  {notif.icon}
                </div>
                <div className="notif-item-content">
                  <div className="notif-item-header">
                    <span className="notif-item-title">{notif.title}</span>
                    <span className="notif-item-time">{notif.time}</span>
                  </div>
                  <p className="notif-item-description">{notif.description}</p>
                  <div className="notif-item-meta">
                    <span
                      className="notif-badge"
                      style={{
                        background: `${getStatusColor(notif.status)}15`,
                        color: getStatusColor(notif.status)
                      }}
                    >
                      {notif.status?.toUpperCase()}
                    </span>
                    <span
                      className="notif-badge"
                      style={{ background: '#f0f0f0', color: '#666' }}
                    >
                      {getTypeLabel(notif.type)}
                    </span>
                    {!notif.isRead && (
                      <Badge
                        status="processing"
                        text="New"
                        style={{ fontSize: 11 }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </List.Item>
          )}
        />
      </Spin>
    </Modal>
  );
}
