import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs, getDoc, doc, getFirestore, query, orderBy, limit } from 'firebase/firestore';
import { FileText, Filter, Download, RefreshCw, AlertCircle, Eye, Shield, User, Package, CheckCircle, XCircle } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import TopBar from '../components/TopBar';
import ProfileModal from '../components/modals/ProfileModal';
import Loading from '../components/Loading';
import '../css/AdminLogs.css';

export default function AdminLogs() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const { user } = useAuth();
  const db = getFirestore();

  useEffect(() => {
    fetchLogs();
  }, []);

  // Refresh logs - fetches the latest 100 log entries from the database
  // This is useful when logs are being created by other users/processes
  const fetchLogs = async () => {
    try {
      setLoading(true);
      const logsRef = collection(db, 'logs');
      const q = query(logsRef, orderBy('timestamp', 'desc'), limit(100));
      const snapshot = await getDocs(q);

      const logsList = await Promise.all(
        snapshot.docs.map(async (logDoc) => {
          const logData = logDoc.data();
          let userName = 'System';
          let userRole = 'system';

          // Fetch user details if userId exists
          if (logData.userId) {
            try {
              const userDoc = await getDoc(doc(db, 'users', logData.userId));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                userName = userData.displayName || userData.email || 'Unknown User';
                userRole = userData.role || 'user';
              }
            } catch (err) {
              console.error('Error fetching user:', err);
            }
          } else if (logData.details?.mechanicId) {
            // Try to fetch from mechanicId in details
            try {
              const userDoc = await getDoc(doc(db, 'users', logData.details.mechanicId));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                userName = userData.displayName || userData.email || 'Unknown User';
                userRole = userData.role || 'mechanic';
              }
            } catch (err) {
              console.error('Error fetching mechanic:', err);
            }
          }

          // Use existing description or generate one
          let description = logData.description || '';
          if (!description) {
            switch (logData.type) {
              case 'PAGE_VIEW':
                description = `Viewed ${logData.page || logData.details?.page || 'a page'}`;
                break;
              case 'UNAUTHORIZED_ACCESS_ATTEMPT':
                description = `Attempted to access ${logData.page || logData.details?.page || 'restricted area'} without authorization`;
                break;
              case 'PARTS_REQUEST_CREATED':
                const partsCount = logData.details?.parts?.length || 0;
                const totalAmount = logData.details?.totalAmount || 0;
                description = `Created parts request with ${partsCount} item${partsCount !== 1 ? 's' : ''} (₱${totalAmount.toFixed(2)})`;
                break;
              case 'PARTS_REQUEST_APPROVED':
                description = `Approved parts request for ${logData.details?.mechanic || 'mechanic'}`;
                break;
              case 'PARTS_REQUEST_REJECTED':
                description = `Rejected parts request`;
                break;
              case 'USER_LOGIN':
                description = 'Logged into the system';
                break;
              case 'USER_LOGOUT':
                description = 'Logged out of the system';
                break;
              case 'USER_CREATED':
                description = `Created new user account`;
                break;
              case 'USER_UPDATED':
                description = `Updated user information`;
                break;
              case 'USER_DELETED':
                description = `Deleted user account`;
                break;
              case 'INVENTORY_ADDED':
                description = `Added new part to inventory`;
                break;
              case 'INVENTORY_UPDATED':
                description = `Updated inventory part`;
                break;
              case 'INVENTORY_DELETED':
                description = `Deleted part from inventory`;
                break;
              default:
                description = logData.type?.replace(/_/g, ' ').toLowerCase() || 'System activity';
            }
          }

          return {
            id: logDoc.id,
            ...logData,
            userName,
            userRole,
            description
          };
        })
      );

      setLogs(logsList);
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'PAGE_VIEW':
        return <Eye size={18} />;
      case 'UNAUTHORIZED_ACCESS_ATTEMPT':
        return <Shield size={18} />;
      case 'PARTS_REQUEST_CREATED':
        return <Package size={18} />;
      case 'PARTS_REQUEST_APPROVED':
        return <CheckCircle size={18} />;
      case 'PARTS_REQUEST_REJECTED':
        return <XCircle size={18} />;
      case 'USER_LOGIN':
      case 'USER_LOGOUT':
        return <User size={18} />;
      case 'USER_CREATED':
      case 'USER_UPDATED':
      case 'USER_DELETED':
        return <User size={18} />;
      case 'INVENTORY_ADDED':
      case 'INVENTORY_UPDATED':
      case 'INVENTORY_DELETED':
        return <Package size={18} />;
      default:
        return <FileText size={18} />;
    }
  };

  const getLogTypeClass = (type) => {
    switch (type) {
      case 'PAGE_VIEW':
        return 'log-type-view';
      case 'UNAUTHORIZED_ACCESS_ATTEMPT':
        return 'log-type-warning';
      case 'PARTS_REQUEST_APPROVED':
      case 'USER_CREATED':
      case 'INVENTORY_ADDED':
        return 'log-type-success';
      case 'PARTS_REQUEST_REJECTED':
      case 'USER_DELETED':
      case 'INVENTORY_DELETED':
        return 'log-type-error';
      case 'PARTS_REQUEST_CREATED':
      case 'USER_UPDATED':
      case 'INVENTORY_UPDATED':
        return 'log-type-info';
      default:
        return 'log-type-default';
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filterType === 'all') return true;
    return log.type === filterType;
  });

  const logTypes = ['all', ...new Set(logs.map(log => log.type))];

  return (
    <div className="user-management-bg logs-page">
      <AdminSidebar sidebarOpen={sidebarOpen} user={user} />

      <div className={`main-content ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        <TopBar
          title="Activity Logs"
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          notificationsCount={0}
          onProfileClick={() => setProfileOpen(true)}
        />

        <div className="content-area">
          <div className="logs-header">
            <div className="logs-header-left">
              <h2 className="logs-title">System Activity Logs</h2>
              <p className="logs-subtitle">Monitor all system activities and user actions</p>
            </div>
            <div className="logs-header-actions">
              <button className="logs-action-btn" onClick={fetchLogs} disabled={loading} title="Refresh logs from database">
                <RefreshCw size={18} className={loading ? 'rotating' : ''} />
                Refresh
              </button>
            </div>
          </div>

          <div className="logs-filters">
            <div className="filter-group">
              <Filter size={18} />
              <span>Filter by type:</span>
              <div className="filter-buttons">
                {logTypes.map(type => (
                  <button
                    key={type}
                    className={`filter-btn${filterType === type ? ' active' : ''}`}
                    onClick={() => setFilterType(type)}
                  >
                    {type === 'all' ? 'All' : type.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="logs-container">
            {loading ? (
              <Loading text="Loading logs" />
            ) : (
              <>
                <div className="logs-stats">
                  <div className="stat-item">
                    <span className="stat-label">Total Logs</span>
                    <span className="stat-value">{filteredLogs.length}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Page Views</span>
                    <span className="stat-value">
                      {logs.filter(l => l.type === 'PAGE_VIEW').length}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Unauthorized Attempts</span>
                    <span className="stat-value warning">
                      {logs.filter(l => l.type === 'UNAUTHORIZED_ACCESS_ATTEMPT').length}
                    </span>
                  </div>
                </div>

                <div className="logs-table-container">
                  <table className="logs-table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>User</th>
                        <th>Description</th>
                        <th>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.length > 0 ? (
                        filteredLogs.map(log => (
                          <tr key={log.id} className="log-row">
                            <td>
                              <div className={`log-type-badge ${getLogTypeClass(log.type)}`}>
                                {getLogIcon(log.type)}
                                <span>{log.type?.replace(/_/g, ' ') || 'Unknown'}</span>
                              </div>
                            </td>
                            <td>
                              <div className="user-info">
                                <div className="user-avatar">
                                  {log.userName?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div>
                                  <div className="user-name">{log.userName || 'Unknown User'}</div>
                                  <div className="user-role">{log.userRole || 'N/A'}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="log-description">{log.description}</div>
                              {log.details && (
                                <details className="log-details-expandable">
                                  <summary>View details</summary>
                                  <pre className="log-details-content">
                                    {JSON.stringify(log.details, null, 2)}
                                  </pre>
                                </details>
                              )}
                            </td>
                            <td>
                              <div className="log-timestamp">
                                {new Date(log.timestamp).toLocaleString()}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="no-logs">
                            <FileText size={48} />
                            <p>No logs found</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} user={user} />
    </div>
  );
}