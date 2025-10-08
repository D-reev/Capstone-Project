import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs, getFirestore, query, orderBy } from 'firebase/firestore';
import { Menu, FileText } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import TopBar from '../components/TopBar';
import ProfileModal from '../components/modals/ProfileModal';
import '../css/AdminLogs.css';

export default function AdminLogs() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const db = getFirestore();

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const logsRef = collection(db, 'logs');
      const q = query(logsRef, orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);

      const logsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLogs(logsList);
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <AdminSidebar sidebarOpen={sidebarOpen} user={user} />

      <div className="main-content">
        <TopBar
          title="Activity Logs"
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          notificationsCount={0}
          onProfileClick={() => setProfileOpen(true)}
        />
        <div className="content-area">
          <div className="logs-container">
            {loading ? (
              <div className="loading">Loading logs...</div>
            ) : (
              <div className="logs-list">
                {logs.map(log => (
                  <div key={log.id} className="log-item">
                    <div className="log-icon"><FileText size={20} /></div>
                    <div className="log-content">
                      <div className="log-header">
                        <span className="log-type">{log.type}</span>
                        <span className="log-date">{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="log-description">{log.description}</p>
                      {log.details && (
                        <div className="log-details">
                          <h4>Details:</h4>
                          <pre>{JSON.stringify(log.details, null, 2)}</pre>
                        </div>
                      )}

                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} user={user} />
    </div>
  );
}