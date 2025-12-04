import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import { collection, getDocs, getFirestore, query, orderBy, limit } from 'firebase/firestore';
import { FileText, Filter, Download, RefreshCw, Eye, Shield, User, Package, CheckCircle, XCircle, Clock, Edit, Trash2, Plus, ChevronDown } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import SuperAdminSidebar from '../components/SuperAdminSidebar';
import NavigationBar from '../components/NavigationBar';
import ProfileModal from '../components/modals/ProfileModal';
import LogDetailsModal from '../components/modals/LogDetailsModal';
import Loading from '../components/Loading';
import '../css/AdminLogs.css';

export default function AdminLogs() {
  const { sidebarOpen } = useSidebar();
  const [profileOpen, setProfileOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterResource, setFilterResource] = useState('all');
  const [expandedMobileCards, setExpandedMobileCards] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
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
      
      // Try with ordering first, fall back to unordered if index doesn't exist
      let snapshot;
      try {
        const q = query(logsRef, orderBy('timestamp', 'desc'), limit(500));
        snapshot = await getDocs(q);
      } catch (orderErr) {
        console.warn('Could not order by timestamp (index may not exist), fetching unordered:', orderErr);
        // Fallback: fetch without ordering
        snapshot = await getDocs(logsRef);
      }

      const logsList = snapshot.docs.map((logDoc) => {
        const data = logDoc.data();
        
        // Ensure we have userName and userRole (new logs have it, old logs might not)
        let userName = data.userName;
        let userRole = data.userRole || 'N/A';
        
        // For old logs without userName, try to infer or show System
        if (!userName) {
          if (data.userId) {
            userName = 'System User';
          } else {
            userName = 'System';
            userRole = 'system';
          }
        }
        
        // Normalize timestamp - handle both numeric and ISO string timestamps
        let timestamp = data.timestamp;
        if (typeof timestamp === 'string') {
          timestamp = new Date(timestamp).getTime();
        } else if (!timestamp) {
          timestamp = Date.now();
        }
        
        return {
          id: logDoc.id,
          ...data,
          userName,
          userRole,
          timestamp
        };
      });

      // Sort by timestamp in memory
      logsList.sort((a, b) => b.timestamp - a.timestamp);

      console.log('Fetched logs:', logsList.length);
      setLogs(logsList);
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'CREATE':
        return <Plus size={18} />;
      case 'UPDATE':
        return <Edit size={18} />;
      case 'DELETE':
        return <Trash2 size={18} />;
      case 'LOGIN':
      case 'LOGOUT':
      case 'USER_LOGIN':
      case 'USER_LOGOUT':
        return <User size={18} />;
      case 'ACCESS_DENIED':
      case 'UNAUTHORIZED_ACCESS_ATTEMPT':
        return <Shield size={18} />;
      case 'READ':
      case 'PAGE_VIEW':
        return <Eye size={18} />;
      case 'PARTS_REQUEST_CREATED':
      case 'PARTS_REQUEST_APPROVED':
      case 'PARTS_REQUEST_REJECTED':
      case 'INVENTORY_ADDED':
      case 'INVENTORY_UPDATED':
      case 'INVENTORY_DELETED':
        return <Package size={18} />;
      case 'NOTIFICATION_CREATED':
        return <Clock size={18} />;
      default:
        return <FileText size={18} />;
    }
  };

  const getLogTypeClass = (type) => {
    switch (type) {
      case 'CREATE':
      case 'USER_CREATED':
      case 'INVENTORY_ADDED':
      case 'PARTS_REQUEST_APPROVED':
        return 'log-type-success';
      case 'UPDATE':
      case 'USER_UPDATED':
      case 'INVENTORY_UPDATED':
      case 'PARTS_REQUEST_CREATED':
      case 'NOTIFICATION_CREATED':
        return 'log-type-info';
      case 'DELETE':
      case 'USER_DELETED':
      case 'INVENTORY_DELETED':
      case 'PARTS_REQUEST_REJECTED':
        return 'log-type-error';
      case 'LOGIN':
      case 'USER_LOGIN':
        return 'log-type-success';
      case 'LOGOUT':
      case 'USER_LOGOUT':
        return 'log-type-default';
      case 'ACCESS_DENIED':
      case 'UNAUTHORIZED_ACCESS_ATTEMPT':
        return 'log-type-warning';
      case 'READ':
      case 'PAGE_VIEW':
        return 'log-type-view';
      default:
        return 'log-type-default';
    }
  };

  const getResourceDisplay = (log) => {
    if (log.resource) return log.resource;
    
    // Infer resource from legacy log types
    const type = log.type || '';
    if (type.includes('USER')) return 'User';
    if (type.includes('PARTS_REQUEST') || type.includes('INVENTORY')) return 'Parts/Inventory';
    if (type.includes('VEHICLE')) return 'Vehicle';
    if (type.includes('NOTIFICATION')) return 'Notification';
    if (type === 'PAGE_VIEW') return 'Page View';
    
    return '—';
  };

  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setDetailsModalOpen(true);
  };

  const logTypes = ['all', ...new Set(logs.map(log => log.type).filter(Boolean))];
  const resourceTypes = ['all', ...new Set(logs.map(log => log.resource).filter(Boolean))];

  const filteredLogs = logs.filter(log => {
    const typeMatch = filterType === 'all' || log.type === filterType;
    const resourceMatch = filterResource === 'all' || log.resource === filterResource;
    return typeMatch && resourceMatch;
  });

  const toggleMobileCard = (logId) => {
    setExpandedMobileCards(prev =>
      prev.includes(logId)
        ? prev.filter(id => id !== logId)
        : [...prev, logId]
    );
  };

  if (loading) {
    return <Loading text="Loading activity logs" />;
  }

  return (
    <div className="user-management-bg logs-page">
      {user?.role === 'superadmin' ? <SuperAdminSidebar /> : <AdminSidebar />}

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
            <div className="filter-group">
              <Filter size={18} />
              <span>Filter by resource:</span>
              <div className="filter-buttons">
                {resourceTypes.map(resource => (
                  <button
                    key={resource}
                    className={`filter-btn${filterResource === resource ? ' active' : ''}`}
                    onClick={() => setFilterResource(resource)}
                  >
                    {resource === 'all' ? 'All' : resource}
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
                <span className="stat-label">Create Operations</span>
                <span className="stat-value">
                  {logs.filter(l => l.type === 'CREATE' || l.type?.includes('_CREATED')).length}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Update Operations</span>
                <span className="stat-value">
                  {logs.filter(l => l.type === 'UPDATE' || l.type?.includes('_UPDATED') || l.type?.includes('_APPROVED') || l.type?.includes('_REJECTED')).length}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Delete Operations</span>
                <span className="stat-value">
                  {logs.filter(l => l.type === 'DELETE' || l.type?.includes('_DELETED')).length}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Unauthorized Attempts</span>
                <span className="stat-value warning">
                  {logs.filter(l => l.type === 'ACCESS_DENIED' || l.type === 'UNAUTHORIZED_ACCESS_ATTEMPT').length}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">User Activities</span>
                <span className="stat-value">
                  {logs.filter(l => l.type === 'LOGIN' || l.type === 'LOGOUT' || l.type === 'USER_LOGIN' || l.type === 'USER_LOGOUT' || l.type === 'PAGE_VIEW').length}
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
                    <th>Resource</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Changes</th>
                    <th>Timestamp</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length > 0 ? (
                    filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((log) => (
                      <tr key={log.id} className="log-row">
                        <td>
                          <div className={`log-type-badge ${getLogTypeClass(log.type)}`}>
                            {getLogIcon(log.type)}
                            <span>{log.type || 'Unknown'}</span>
                          </div>
                        </td>
                        <td>
                          <span className="log-resource">{getResourceDisplay(log)}</span>
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
                          <div className="log-description">{log.action || log.description || 'No description'}</div>
                        </td>
                        <td>
                          {log.changes && Object.keys(log.changes).length > 0 ? (
                            <span className="changes-count">{Object.keys(log.changes).length} field(s)</span>
                          ) : (
                            <span className="no-changes">—</span>
                          )}
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
                        <td>
                          <button 
                            className="view-details-btn"
                            onClick={() => handleViewDetails(log)}
                            title="View detailed log information"
                          >
                            <Eye size={16} />
                            Details
                          </button>
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
                              {log.action || log.description || 'No description'}
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
                            {log.type || 'Unknown'}
                          </span>
                          <span className="logs-mobile-badge role">
                            {log.userRole || 'N/A'}
                          </span>
                          {getResourceDisplay(log) !== '—' && (
                            <span className="logs-mobile-badge resource">
                              {getResourceDisplay(log)}
                            </span>
                          )}
                        </div>

                        {isExpanded && (
                          <div className="logs-mobile-expanded">
                            {log.changes && Object.keys(log.changes).length > 0 && (
                              <div className="logs-mobile-detail">
                                <span className="logs-mobile-detail-label">Changes</span>
                                <span className="logs-mobile-detail-value">
                                  {Object.keys(log.changes).length} field(s) modified
                                </span>
                              </div>
                            )}
                            {log.resourceId && (
                              <div className="logs-mobile-detail">
                                <span className="logs-mobile-detail-label">Resource ID</span>
                                <span className="logs-mobile-detail-value">{log.resourceId}</span>
                              </div>
                            )}
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
                            <button 
                              className="view-details-btn mobile"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewDetails(log);
                              }}
                            >
                              <Eye size={16} />
                              View Full Details
                            </button>
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
      <LogDetailsModal 
        open={detailsModalOpen} 
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedLog(null);
        }} 
        log={selectedLog} 
      />
    </div>
  );
}