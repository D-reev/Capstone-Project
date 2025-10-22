import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs, getFirestore, query, orderBy, limit } from 'firebase/firestore';
import { FileText, Filter, Download, RefreshCw, AlertCircle, Eye, Shield, User } from 'lucide-react';
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

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const logsRef = collection(db, 'logs');
      const q = query(logsRef, orderBy('timestamp', 'desc'), limit(100));
      const snapshot = await getDocs(q);

      const logsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
        return <Eye size={20} className="log-icon-view" />;
      case 'UNAUTHORIZED_ACCESS_ATTEMPT':
        return <Shield size={20} className="log-icon-warning" />;
      case 'PARTS_REQUEST_APPROVED':
        return <FileText size={20} className="log-icon-success" />;
      case 'PARTS_REQUEST_REJECTED':
        return <AlertCircle size={20} className="log-icon-error" />;
      default:
        return <FileText size={20} className="log-icon-default" />;
    }
  };

  const getLogTypeClass = (type) => {
    switch (type) {
      case 'PAGE_VIEW':
        return 'log-type-view';
      case 'UNAUTHORIZED_ACCESS_ATTEMPT':
        return 'log-type-warning';
      case 'PARTS_REQUEST_APPROVED':
        return 'log-type-success';
      case 'PARTS_REQUEST_REJECTED':
        return 'log-type-error';
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
    <div className={`dashboard-container${sidebarOpen ? '' : ' sidebar-collapsed'}`}>
      <AdminSidebar sidebarOpen={sidebarOpen} user={user} />

      <div className="main-content">
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
              <button className="logs-action-btn" onClick={fetchLogs} disabled={loading}>
                <RefreshCw size={18} className={loading ? 'rotating' : ''} />
                Refresh
              </button>
              <button className="logs-action-btn">
                <Download size={18} />
                Export
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
                        <th>IP Address</th>
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
                                <span>{log.type.replace(/_/g, ' ')}</span>
                              </div>
                            </td>
                            <td>
                              <div className="user-info">
                                <User size={16} />
                                <div>
                                  <div className="user-name">{log.userName || 'Unknown'}</div>
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
                              <code className="ip-address">{log.ip || 'N/A'}</code>
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
                          <td colSpan={5} className="no-logs">
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