import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import { 
  collection, 
  getDocs, 
  updateDoc,
  doc, 
  getFirestore,
  query,
  orderBy,
  addDoc,
  getDoc,
  deleteDoc,
  runTransaction
} from 'firebase/firestore';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import RequestDetailsModal from '../components/modals/RequestDetailsModal';
import TopBar from '../components/TopBar';
import ProfileModal from '../components/modals/ProfileModal';
import '../css/AdminRequest.css';

export default function AdminRequests() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const db = getFirestore();

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');

  const formatDate = (ts) => {
    if (!ts) return '—';
    if (ts?.toDate) return ts.toDate().toLocaleString();
    try { return new Date(ts).toLocaleString(); } catch { return String(ts); }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const requestsRef = collection(db, 'partRequests');
      const q = query(requestsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      const raw = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      if (raw.length === 0) {
        setRequests([]);
        setLoading(false);
        return;
      }

      const userIds = Array.from(new Set(
        raw
          .map(r => r.mechanicId || r.requesterId || r.customerId)
          .filter(Boolean)
      ));

      const userDocs = await Promise.all(userIds.map(id => getDoc(doc(db, 'users', id))));
      const usersMap = {};
      userDocs.forEach(ud => {
        if (ud.exists()) {
          const data = ud.data();
          usersMap[ud.id] = data.displayName || data.name || data.email || 'User';
        }
      });

      const requestsList = raw.map(r => ({
        ...r,
        mechanicName: r.mechanicName || usersMap[r.mechanicId] || r.requesterName || usersMap[r.requesterId] || 'Unknown',
        customerName: r.customer?.name || usersMap[r.customerId] || 'Customer'
      }));

      setRequests(requestsList);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId, newStatus) => {
    try {
      setProcessing(true);
      const requestRef = doc(db, 'partRequests', requestId);

      if (newStatus === 'approved') {
        await runTransaction(db, async (tx) => {
          const reqSnap = await tx.get(requestRef);
          if (!reqSnap.exists()) throw new Error('Request not found');
          const request = { id: reqSnap.id, ...reqSnap.data() };

          if (!Array.isArray(request.parts) || request.parts.length === 0) {
            throw new Error('No parts to approve');
          }

          const partRefs = request.parts.map(p => doc(db, 'inventory', p.partId));
          const partSnaps = await Promise.all(partRefs.map(rf => tx.get(rf)));

          const insufficient = [];
          partSnaps.forEach((ps, idx) => {
            const requested = Number(request.parts[idx]?.quantity || 0);
            const current = Number(ps.exists() ? (ps.data().quantity || 0) : 0);
            if (!ps.exists() || current < requested) {
              insufficient.push(request.parts[idx]?.name || request.parts[idx]?.partId || 'unknown');
            }
          });

          if (insufficient.length > 0) {
            throw new Error(`Insufficient stock for: ${insufficient.join(', ')}`);
          }

          partSnaps.forEach((ps, idx) => {
            const requested = Number(request.parts[idx]?.quantity || 0);
            const current = Number(ps.data().quantity || 0);
            tx.update(partRefs[idx], {
              quantity: current - requested,
              updatedAt: new Date().toISOString()
            });
          });

          tx.update(requestRef, {
            status: 'approved',
            updatedAt: new Date().toISOString(),
            approvedBy: user?.displayName || user?.email || 'admin',
            approvedAt: new Date().toISOString()
          });
        });

        const requestSnap = await getDoc(requestRef);
        const request = requestSnap.exists() ? { id: requestSnap.id, ...requestSnap.data() } : null;
        const mechanicSafe = request?.mechanicName ?? request?.requesterName ?? request?.mechanicId ?? 'Unknown';
        const vehicleSafe = `${request?.car?.make ?? ''} ${request?.car?.model ?? ''}`.trim() || 'Unknown';
        const partsSafe = (request?.parts || []).map(p => ({
          name: p?.name ?? p?.partId ?? 'Unknown',
          quantity: Number(p?.quantity ?? 0),
          price: Number(p?.price ?? 0),
          total: Number(p?.price ?? 0) * Number(p?.quantity ?? 0)
        }));
        const totalAmountSafe = partsSafe.reduce((s, p) => s + p.total, 0);

        await addDoc(collection(db, 'logs'), {
          type: 'PARTS_REQUEST_APPROVED',
          timestamp: new Date().toISOString(),
          description: `Parts request approved for ${mechanicSafe}`,
          details: {
            requestId: request?.id ?? null,
            mechanic: mechanicSafe,
            mechanicId: request?.mechanicId ?? null,
            vehicle: vehicleSafe,
            parts: partsSafe,
            totalAmount: totalAmountSafe
          }
        });
      } else {
        await updateDoc(requestRef, {
          status: newStatus,
          updatedAt: new Date().toISOString(),
          ...(newStatus === 'completed' && { completedBy: user?.displayName || user?.email || 'admin', completedAt: new Date().toISOString() })
        });
      }

      setModalOpen(false);
      setSelectedRequest(null);
      await fetchRequests();
    } catch (err) {
      console.error('Error updating request:', err);
      alert(err.message || 'Failed to update request');
    } finally {
      setProcessing(false);
    }
  };

  const handleApprove = async (requestId) => {
    await handleStatusUpdate(requestId, 'approved');
  };

  const handleReject = async (requestId) => {
    try {
      setProcessing(true);
      const requestRef = doc(db, 'partRequests', requestId);
      const requestSnap = await getDoc(requestRef);
      if (!requestSnap.exists()) throw new Error('Request not found');
      const request = { id: requestSnap.id, ...requestSnap.data() };

      await deleteDoc(requestRef);

      const partsSafe = (request.parts || []).map(p => ({
        name: p?.name ?? p?.partId ?? 'Unknown',
        quantity: Number(p?.quantity ?? 0),
        price: Number(p?.price ?? 0)
      }));

      await addDoc(collection(db, 'logs'), {
        type: 'PARTS_REQUEST_REJECTED',
        timestamp: new Date().toISOString(),
        description: `Parts request ${request.id ?? 'unknown'} rejected by ${user?.displayName || user?.email || 'admin'}`,
        requestId: request.id ?? null,
        details: {
          parts: partsSafe,
          customerId: request.customerId ?? request.customer?.id ?? null,
          mechanicId: request.mechanicId ?? null
        }
      });

      setModalOpen(false);
      setSelectedRequest(null);
      await fetchRequests();
    } catch (err) {
      console.error('Error rejecting request:', err);
      alert(err.message || 'Failed to reject request');
    } finally {
      setProcessing(false);
    }
  };

  const openModal = (request) => {
    setSelectedRequest(request);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedRequest(null);
  };

  if (loading) return <Loading text="Loading requests" />;
  if (error) return <div className="error-message">{error}</div>;

  const displayedRequests = requests.filter(r => 
    activeTab === 'pending'
      ? (r.status || 'pending') === 'pending'
      : (r.status || '') === 'approved'
  );

  return (
    <div className={`dashboard-container${sidebarOpen ? '' : ' sidebar-collapsed'}`}>
      <AdminSidebar sidebarOpen={sidebarOpen} user={user} />
      <div className={`main-content${sidebarOpen ? '' : ' expanded'}`}>
        <TopBar
          title="Motohub"
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          notificationsCount={0}
          onProfileClick={() => setProfileOpen(true)}
        />

        <div className="content-area">
          <div className="requests-tabs">
            <button
              className={`requests-tab${activeTab === 'pending' ? ' active' : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              Pending
            </button>
            <button
              className={`requests-tab${activeTab === 'approved' ? ' active' : ''}`}
              onClick={() => setActiveTab('approved')}
            >
              Approved
            </button>
          </div>

          <div className="requests-table-container">
            <table className="requests-table">
              <thead>
                <tr>
                  <th>Mechanic</th>
                  <th>Vehicle</th>
                  <th>Parts Requested</th>
                  <th>Date</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedRequests.map(request => (
                  <tr
                    key={request.id}
                    className="request-row hoverable"
                    onClick={() => openModal(request)}
                  >
                    <td>{request.mechanicName || request.requesterName}</td>
                    <td>{request.car?.make} {request.car?.model}</td>
                    <td>
                      <ul className="parts-list">
                        {Array.isArray(request.parts) ? request.parts.map((part, index) => (
                          <li key={index}>{part.name} (Qty: {part.quantity})</li>
                        )) : null}
                      </ul>
                    </td>
                    <td>{formatDate(request.createdAt)}</td>
                    <td><span className={`priority-badge ${request.priority || 'normal'}`}>{request.priority || 'normal'}</span></td>
                    <td><span className={`status-badge ${request.status || 'pending'}`}>{request.status || 'pending'}</span></td>
                    <td>
                      <div className="action-buttons">
                        {request.status === 'pending' && (
                          <>
                            <button onClick={(e) => { e.stopPropagation(); handleStatusUpdate(request.id, 'approved'); }} className="approve-btn" title="Approve">
                              <CheckCircle size={18} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleReject(request.id); }} className="reject-btn" title="Reject">
                              <XCircle size={18} />
                            </button>
                          </>
                        )}
                        {request.status === 'approved' && (
                          <button onClick={(e) => { e.stopPropagation(); handleStatusUpdate(request.id, 'completed'); }} className="complete-btn" title="Mark Completed">
                            <Clock size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {displayedRequests.length === 0 && (
                  <tr>
                    <td colSpan={7} className="no-requests-cell">
                      No requests found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <RequestDetailsModal
        request={selectedRequest}
        open={modalOpen}
        onClose={closeModal}
        onApprove={handleApprove}
        onReject={handleReject}
        processing={processing}
      />
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} user={user} />
    </div>
  );
}