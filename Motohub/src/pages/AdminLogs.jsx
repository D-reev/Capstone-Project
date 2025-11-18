import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import { collection, getDocs, getDoc, doc, getFirestore, query, orderBy, limit } from 'firebase/firestore';
import { FileText, Filter, Download, RefreshCw, AlertCircle, Eye, Shield, User, Package, CheckCircle, XCircle, ChevronDown, Clock } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import NavigationBar from '../components/NavigationBar';
import ProfileModal from '../components/modals/ProfileModal';
import Loading from '../components/Loading';
import '../css/AdminLogs.css';

export default function AdminLogs() {
  const { sidebarOpen } = useSidebar();
  const [profileOpen, setProfileOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [expandedMobileCards, setExpandedMobileCards] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
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

      const logsList = await Promise.all(
        snapshot.docs.map(async (logDoc) => {
          const logData = logDoc.data();
          let userName = 'System';
          let userRole = 'system';
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

  const toggleMobileCard = (logId) => {
    setExpandedMobileCards(prev =>
      prev.includes(logId)
        ? prev.filter(id => id !== logId)
        : [...prev, logId]
    );
  };

  const logTypes = ['all', ...new Set(logs.map(log => log.type))];

  if (loading) {
    return <Loading text="Loading activity logs" />;
  }

  return (
    <div className="user-management-bg logs-page">
      <AdminSidebar />

      <div className={`main-content ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        <NavigationBar
          title="Activity Logs"
          onProfileClick={() => setProfileOpen(true)}
          userRole="admin"
          userName={user?.displayName || 'Admin'}
          userEmail={user?.email || ''}
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
              <div className="stat-item">
                <span className="stat-label">Parts Requests</span>
                <span className="stat-value">
                  {logs.filter(l => l.type?.includes('PARTS_REQUEST')).length}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">User Actions</span>
                <span className="stat-value">
                  {logs.filter(l => l.type?.includes('USER_')).length}
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
                    filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((log) => (
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
                          {log.details && Object.keys(log.details).length > 0 && (
                            <details className="log-details-expandable">
                              <summary>View details</summary>
                              <div className="log-details-content">
                                {log.details.page && (
                                  <div className="detail-row">
                                    <span className="detail-label">Page:</span>
                                    <span className="detail-value">{log.details.page}</span>
                                  </div>
                                )}
                                {log.details.parts && Array.isArray(log.details.parts) && (
                                  <div className="detail-row">
                                    <span className="detail-label">Parts:</span>
                                    <span className="detail-value">{log.details.parts.length} item(s)</span>
                                  </div>
                                )}
                                {log.details.totalAmount !== undefined && (
                                  <div className="detail-row">
                                    <span className="detail-label">Amount:</span>
                                    <span className="detail-value">₱{log.details.totalAmount.toFixed(2)}</span>
                                  </div>
                                )}
                                {log.details.mechanic && (
                                  <div className="detail-row">
                                    <span className="detail-label">Mechanic:</span>
                                    <span className="detail-value">{log.details.mechanic}</span>
                                  </div>
                                )}
                                {log.details.mechanicId && (
                                  <div className="detail-row">
                                    <span className="detail-label">Mechanic ID:</span>
                                    <span className="detail-value">{log.details.mechanicId}</span>
                                  </div>
                                )}
                                {log.details.status && (
                                  <div className="detail-row">
                                    <span className="detail-label">Status:</span>
                                    <span className="detail-value">{log.details.status}</span>
                                  </div>
                                )}
                                {log.details.reason && (
                                  <div className="detail-row">
                                    <span className="detail-label">Reason:</span>
                                    <span className="detail-value">{log.details.reason}</span>
                                  </div>
                                )}
                                {log.details.userAgent && (
                                  <div className="detail-row">
                                    <span className="detail-label">Browser:</span>
                                    <span className="detail-value">{log.details.userAgent.substring(0, 50)}...</span>
                                  </div>
                                )}
                              </div>
                            </details>
                          )}
                        </td>
                        <td>
                          <div className="log-ip">
                            {log.ipAddress || log.details?.ipAddress || 'N/A'}
                          </div>
                        </td>
                        <td>
                          <div className="log-timestamp">
                            <div className="timestamp-date">
                              {new Date(log.timestamp).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })}
                            </div>
                            <div className="timestamp-time">
                              {new Date(log.timestamp).toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                second: '2-digit'
                              })}
                            </div>
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

              {/* Mobile Card List */}
              <div className="logs-mobile-list">
                {filteredLogs.length > 0 ? (
                  filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(log => {
                    const isExpanded = expandedMobileCards.includes(log.id);
                    const getTypeClass = () => {
                      if (log.type?.includes('PAGE_VIEW')) return 'type-page-view';
                      if (log.type?.includes('UNAUTHORIZED')) return 'type-unauthorized';
                      if (log.type?.includes('PARTS_REQUEST')) return 'type-parts-request';
                      if (log.type?.includes('USER_')) return 'type-user';
                      if (log.type?.includes('INVENTORY')) return 'type-inventory';
                      return 'type-page-view';
                    };
                    
                    return (
                      <div key={log.id} className="logs-mobile-card">
                        <div 
                          className="logs-mobile-card-header"
                          onClick={() => toggleMobileCard(log.id)}
                        >
                          <div className="logs-mobile-info">
                            <div className="logs-mobile-user">
                              {log.userName || 'Unknown User'}
                            </div>
                            <div className="logs-mobile-description">
                              {log.description}
                            </div>
                          </div>
                          <ChevronDown 
                            size={20} 
                            className={`logs-mobile-toggle ${isExpanded ? 'expanded' : ''}`}
                          />
                        </div>

                        <div className="logs-mobile-meta">
                          <span className={`logs-mobile-badge ${getTypeClass()}`}>
                            {getLogIcon(log.type)}
                            {log.type?.replace(/_/g, ' ') || 'Unknown'}
                          </span>
                          <span className="logs-mobile-badge role">
                            {log.userRole || 'N/A'}
                          </span>
                        </div>

                        {isExpanded && (
                          <div className="logs-mobile-expanded">
                            <div className="logs-mobile-detail">
                              <span className="logs-mobile-detail-label">IP Address</span>
                              <span className="logs-mobile-detail-value">
                                {log.ipAddress || log.details?.ipAddress || 'N/A'}
                              </span>
                            </div>
                            <div className="logs-mobile-detail">
                              <span className="logs-mobile-detail-label">Date</span>
                              <span className="logs-mobile-detail-value">
                                {new Date(log.timestamp).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric', 
                                  year: 'numeric' 
                                })}
                              </span>
                            </div>
                            <div className="logs-mobile-detail">
                              <span className="logs-mobile-detail-label">Time</span>
                              <span className="logs-mobile-detail-value">
                                {new Date(log.timestamp).toLocaleTimeString('en-US', { 
                                  hour: '2-digit', 
                                  minute: '2-digit',
                                  second: '2-digit'
                                })}
                              </span>
                            </div>
                            
                            {/* Additional Details */}
                            {log.details && Object.keys(log.details).length > 0 && (
                              <>
                                {log.details.page && (
                                  <div className="logs-mobile-detail">
                                    <span className="logs-mobile-detail-label">Page</span>
                                    <span className="logs-mobile-detail-value">{log.details.page}</span>
                                  </div>
                                )}
                                {log.details.parts && Array.isArray(log.details.parts) && (
                                  <div className="logs-mobile-detail">
                                    <span className="logs-mobile-detail-label">Parts</span>
                                    <span className="logs-mobile-detail-value">{log.details.parts.length} item(s)</span>
                                  </div>
                                )}
                                {log.details.totalAmount !== undefined && (
                                  <div className="logs-mobile-detail">
                                    <span className="logs-mobile-detail-label">Amount</span>
                                    <span className="logs-mobile-detail-value">₱{log.details.totalAmount.toFixed(2)}</span>
                                  </div>
                                )}
                                {log.details.mechanic && (
                                  <div className="logs-mobile-detail">
                                    <span className="logs-mobile-detail-label">Mechanic</span>
                                    <span className="logs-mobile-detail-value">{log.details.mechanic}</span>
                                  </div>
                                )}
                                {log.details.status && (
                                  <div className="logs-mobile-detail">
                                    <span className="logs-mobile-detail-label">Status</span>
                                    <span className="logs-mobile-detail-value">{log.details.status}</span>
                                  </div>
                                )}
                                {log.details.reason && (
                                  <div className="logs-mobile-detail">
                                    <span className="logs-mobile-detail-label">Reason</span>
                                    <span className="logs-mobile-detail-value">{log.details.reason}</span>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div style={{ 
                    padding: '2rem', 
                    textAlign: 'center', 
                    color: '#6B7280',
                    fontSize: '0.875rem'
                  }}>
                    <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                    <p>No logs found</p>
                  </div>
                )}
              </div>

              {/* Pagination Controls */}
              {filteredLogs.length > itemsPerPage && (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '16px 24px',
                  borderTop: '1px solid #e5e7eb',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <span style={{ 
                    color: '#6B7280',
                    fontSize: '14px'
                  }}>
                    {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredLogs.length)} of {filteredLogs.length} entries
                  </span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      style={{
                        width: '32px',
                        height: '32px',
                        background: currentPage === 1 ? '#f3f4f6' : 'linear-gradient(135deg, #FFC300 0%, #FFD54F 100%)',
                        color: currentPage === 1 ? '#9ca3af' : '#000',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                    >
                      &lt;&lt;
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      style={{
                        width: '32px',
                        height: '32px',
                        background: currentPage === 1 ? '#f3f4f6' : 'linear-gradient(135deg, #FFC300 0%, #FFD54F 100%)',
                        color: currentPage === 1 ? '#9ca3af' : '#000',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}
                    >
                      &lt;
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={Math.ceil(filteredLogs.length / itemsPerPage)}
                      value={currentPage}
                      onChange={(e) => {
                        const page = parseInt(e.target.value);
                        if (page >= 1 && page <= Math.ceil(filteredLogs.length / itemsPerPage)) {
                          setCurrentPage(page);
                        }
                      }}
                      style={{
                        width: '50px',
                        height: '32px',
                        textAlign: 'center',
                        background: '#fff',
                        color: '#374151',
                        border: '1px solid #FFC300',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}
                    />
                    <span style={{ color: '#FFC300', fontSize: '14px', fontWeight: '600' }}>of {Math.ceil(filteredLogs.length / itemsPerPage)}</span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredLogs.length / itemsPerPage)))}
                      disabled={currentPage >= Math.ceil(filteredLogs.length / itemsPerPage)}
                      style={{
                        width: '32px',
                        height: '32px',
                        background: currentPage >= Math.ceil(filteredLogs.length / itemsPerPage) ? '#f3f4f6' : 'linear-gradient(135deg, #FFC300 0%, #FFD54F 100%)',
                        color: currentPage >= Math.ceil(filteredLogs.length / itemsPerPage) ? '#9ca3af' : '#000',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: currentPage >= Math.ceil(filteredLogs.length / itemsPerPage) ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}
                    >
                      &gt;
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.ceil(filteredLogs.length / itemsPerPage))}
                      disabled={currentPage >= Math.ceil(filteredLogs.length / itemsPerPage)}
                      style={{
                        width: '32px',
                        height: '32px',
                        background: currentPage >= Math.ceil(filteredLogs.length / itemsPerPage) ? '#f3f4f6' : 'linear-gradient(135deg, #FFC300 0%, #FFD54F 100%)',
                        color: currentPage >= Math.ceil(filteredLogs.length / itemsPerPage) ? '#9ca3af' : '#000',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: currentPage >= Math.ceil(filteredLogs.length / itemsPerPage) ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                    >
                      &gt;&gt;
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} user={user} />
    </div>
  );
}