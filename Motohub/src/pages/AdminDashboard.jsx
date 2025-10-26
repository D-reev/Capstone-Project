import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { TrendingUp, TrendingDown, Package, Wrench, Car, Users } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import TopBar from '../components/TopBar';
import ProfileModal from '../components/modals/ProfileModal';
import '../css/AdminDashboard.css';

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const db = getFirestore();

  const [stats, setStats] = useState({
    totalServices: 0,
    servicesChange: 0,
    totalRevenue: 0,
    revenueChange: 0,
    totalParts: 0,
    partsChange: 0,
    totalCustomers: 0,
    customersChange: 0,
    totalVehicles: 0,
    totalRequests: 0,
    pendingRequests: 0,
    completedServices: 0,
    lowStockParts: 0
  });

  const [recentRequests, setRecentRequests] = useState([]);
  const [topMechanics, setTopMechanics] = useState([]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all users (customers)
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const customers = users.filter(u => u.role === 'customer');
      
      // Fetch all mechanics
      const mechanics = users.filter(u => u.role === 'mechanic');

      // Count total vehicles from all customers
      let totalVehicles = 0;
      let totalServiceHistory = 0;
      for (const u of customers) {
        const carsSnapshot = await getDocs(collection(db, 'users', u.id, 'cars'));
        totalVehicles += carsSnapshot.size;
        
        // Count service history
        for (const carDoc of carsSnapshot.docs) {
          const serviceHistorySnapshot = await getDocs(collection(db, 'users', u.id, 'cars', carDoc.id, 'serviceHistory'));
          totalServiceHistory += serviceHistorySnapshot.size;
        }
      }

      // Fetch part requests
      const requestsSnapshot = await getDocs(collection(db, 'partRequests'));
      const requests = requestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const pendingRequests = requests.filter(r => r.status === 'pending').length;
      const completedRequests = requests.filter(r => r.status === 'completed' || r.status === 'approved').length;

      // Fetch inventory parts
      const partsSnapshot = await getDocs(collection(db, 'inventory'));
      const parts = partsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const lowStockParts = parts.filter(p => (p.quantity || 0) < (p.reorderLevel || 10)).length;

      // Calculate revenue from completed requests (mock calculation)
      const totalRevenue = requests
        .filter(r => r.status === 'completed' || r.status === 'approved')
        .reduce((sum, req) => {
          const reqTotal = req.parts?.reduce((pSum, p) => pSum + (p.price || 0) * (p.quantity || 1), 0) || 0;
          return sum + reqTotal;
        }, 0);

      // Recent part requests data
      const recentRequestsData = requests
        .sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() || new Date(0);
          const bTime = b.createdAt?.toDate?.() || new Date(0);
          return bTime - aTime;
        })
        .slice(0, 5)
        .map((req, idx) => ({
          id: req.id,
          image: null,
          partName: req.parts?.[0]?.name || 'Multiple Parts',
          requestId: `REQ-${String(idx + 1).padStart(6, '0')}`,
          quantity: req.parts?.reduce((sum, p) => sum + (p.quantity || 0), 0) || 0,
          totalCost: `₱${(req.parts?.reduce((sum, p) => sum + (p.price || 0) * (p.quantity || 1), 0) || 0).toFixed(2)}`,
          requestTime: req.createdAt?.toDate?.() || new Date(),
          mechanic: req.mechanicName || req.requesterName || 'Unknown',
          status: req.status || 'pending'
        }));

      // Top mechanics by service count (mock data for now)
      const mechanicsPerformance = mechanics.slice(0, 6).map((mech, idx) => ({
        name: mech.name || `Mechanic ${idx + 1}`,
        servicesCompleted: Math.floor(Math.random() * 50) + 10,
        rating: (4.0 + Math.random()).toFixed(1)
      })).sort((a, b) => b.servicesCompleted - a.servicesCompleted);

      setStats({
        totalServices: totalServiceHistory,
        servicesChange: 5.2,
        totalRevenue,
        revenueChange: 3.8,
        totalParts: parts.length,
        partsChange: 2.1,
        totalCustomers: customers.length,
        customersChange: 1.5,
        totalVehicles,
        totalRequests: requests.length,
        pendingRequests,
        completedServices: completedRequests,
        lowStockParts
      });

      setRecentRequests(recentRequestsData);
      setTopMechanics(mechanicsPerformance);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    if (!date) return 'N/A';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <Loading text="Loading dashboard..." />;
  }

  return (
    <div className="dashboard-page">
      <AdminSidebar sidebarOpen={sidebarOpen} user={user} />
      
      <div className={`dashboard-main ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        <TopBar
          title="Dashboard"
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          notificationsCount={stats.pendingRequests}
          onProfileClick={() => setProfileOpen(true)}
        />

        <div className="dashboard-content">
          <div className="page-header">
            <div>
              <h1 className="page-title">MotoHub Admin Dashboard</h1>
              <div className="breadcrumb">
                <span>Dashboard</span>
                <span>/</span>
                <span>Overview</span>
              </div>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-label">Total Services</div>
                <div className={`stat-change ${stats.servicesChange >= 0 ? 'positive' : 'negative'}`}>
                  {stats.servicesChange >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {Math.abs(stats.servicesChange)}%
                </div>
              </div>
              <div className="stat-value">{stats.totalServices.toLocaleString()}</div>
              <div className="stat-chart">
                <svg viewBox="0 0 200 60" className="mini-chart">
                  <polyline points="0,40 25,35 50,45 75,30 100,38 125,25 150,32 175,20 200,28" fill="none" stroke="#6366f1" strokeWidth="2" />
                  <polyline points="0,40 25,35 50,45 75,30 100,38 125,25 150,32 175,20 200,28 200,60 0,60" fill="url(#gradient1)" opacity="0.3" />
                  <defs>
                    <linearGradient id="gradient1" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-label">Total Revenue</div>
                <div className={`stat-change ${stats.revenueChange >= 0 ? 'positive' : 'negative'}`}>
                  {stats.revenueChange >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {Math.abs(stats.revenueChange)}%
                </div>
              </div>
              <div className="stat-value">₱{stats.totalRevenue.toLocaleString()}</div>
              <div className="stat-chart">
                <svg viewBox="0 0 200 60" className="mini-chart">
                  <polyline points="0,45 25,42 50,38 75,35 100,30 125,28 150,25 175,22 200,18" fill="none" stroke="#ec4899" strokeWidth="2" />
                  <polyline points="0,45 25,42 50,38 75,35 100,30 125,28 150,25 175,22 200,18 200,60 0,60" fill="url(#gradient2)" opacity="0.3" />
                  <defs>
                    <linearGradient id="gradient2" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#ec4899" />
                      <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-label">Inventory Parts</div>
                <div className={`stat-change ${stats.partsChange >= 0 ? 'positive' : 'negative'}`}>
                  {stats.partsChange >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {Math.abs(stats.partsChange)}%
                </div>
              </div>
              <div className="stat-value">{stats.totalParts.toLocaleString()}</div>
              <div className="stat-chart">
                <svg viewBox="0 0 200 60" className="mini-chart">
                  <polyline points="0,30 25,32 50,28 75,35 100,33 125,38 150,36 175,42 200,40" fill="none" stroke="#3b82f6" strokeWidth="2" />
                  <polyline points="0,30 25,32 50,28 75,35 100,33 125,38 150,36 175,42 200,40 200,60 0,60" fill="url(#gradient3)" opacity="0.3" />
                  <defs>
                    <linearGradient id="gradient3" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            <div className="stat-card highlight">
              <div className="stat-header">
                <div className="stat-label">Total Customers</div>
                <div className={`stat-change ${stats.customersChange >= 0 ? 'positive' : 'negative'}`} style={{color: 'white', background: 'rgba(255,255,255,0.2)'}}>
                  {stats.customersChange >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {Math.abs(stats.customersChange)}%
                </div>
              </div>
              <div className="stat-value">{stats.totalCustomers.toLocaleString()}</div>
              <div className="stat-chart">
                <svg viewBox="0 0 200 60" className="mini-chart">
                  <polyline points="0,50 25,48 50,45 75,42 100,38 125,35 150,30 175,25 200,20" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.8" />
                  <polyline points="0,50 25,48 50,45 75,42 100,38 125,35 150,30 175,25 200,20 200,60 0,60" fill="url(#gradient4)" opacity="0.3" />
                  <defs>
                    <linearGradient id="gradient4" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </div>

          <div className="charts-row">
            <div className="chart-card orders-card">
              <div className="card-header">
                <h2>Recent Part Requests</h2>
                <button className="view-details">View All</button>
              </div>
              <div className="orders-table">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Icon</th>
                      <th>Part Name</th>
                      <th>Request ID</th>
                      <th>Quantity</th>
                      <th>Total Cost</th>
                      <th>Request Time</th>
                      <th>Mechanic</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentRequests.map((request, index) => (
                      <tr key={request.id}>
                        <td>{index + 1}</td>
                        <td>
                          <div className="product-image">
                            <div className="image-placeholder">
                              <Wrench size={20} />
                            </div>
                          </div>
                        </td>
                        <td>{request.partName}</td>
                        <td>{request.requestId}</td>
                        <td>{request.quantity}</td>
                        <td>{request.totalCost}</td>
                        <td>{formatTime(request.requestTime)}</td>
                        <td>{request.mechanic}</td>
                        <td>
                          <span className={`status-badge ${request.status}`}>
                            {request.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="chart-card acquisition-card">
              <div className="card-header">
                <h2>Service Overview</h2>
              </div>
              <div className="acquisition-chart">
                <svg viewBox="0 0 300 200" className="area-chart">
                  <line x1="0" y1="40" x2="300" y2="40" stroke="#e5e7eb" strokeWidth="1" />
                  <line x1="0" y1="80" x2="300" y2="80" stroke="#e5e7eb" strokeWidth="1" />
                  <line x1="0" y1="120" x2="300" y2="120" stroke="#e5e7eb" strokeWidth="1" />
                  <line x1="0" y1="160" x2="300" y2="160" stroke="#e5e7eb" strokeWidth="1" />
                  <polyline points="0,100 50,90 100,95 150,85 200,80 250,75 300,70" fill="none" stroke="#8b5cf6" strokeWidth="2" />
                  <polyline points="0,100 50,90 100,95 150,85 200,80 250,75 300,70 300,200 0,200" fill="url(#gradientPurple)" opacity="0.4" />
                  <polyline points="0,140 50,135 100,130 150,120 200,110 250,100 300,90" fill="none" stroke="#ec4899" strokeWidth="2" />
                  <polyline points="0,140 50,135 100,130 150,120 200,110 250,100 300,90 300,200 0,200" fill="url(#gradientPink)" opacity="0.4" />
                  <defs>
                    <linearGradient id="gradientPurple" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="gradientPink" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#ec4899" />
                      <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="chart-legend">
                  <div className="legend-item">
                    <div className="legend-color" style={{ background: '#ec4899' }}></div>
                    <span>Completed</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color" style={{ background: '#8b5cf6' }}></div>
                    <span>In Progress</span>
                  </div>
                </div>
                <div className="chart-labels">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bottom-row">
            <div className="chart-card category-card">
              <div className="card-header">
                <h2>Service Categories</h2>
              </div>
              <div className="donut-chart">
                <svg viewBox="0 0 200 200" className="donut-svg">
                  <circle cx="100" cy="100" r="70" fill="none" stroke="#3b82f6" strokeWidth="30" strokeDasharray="200 439" transform="rotate(-90 100 100)" />
                  <circle cx="100" cy="100" r="70" fill="none" stroke="#ec4899" strokeWidth="30" strokeDasharray="110 439" strokeDashoffset="-200" transform="rotate(-90 100 100)" />
                  <circle cx="100" cy="100" r="70" fill="none" stroke="#f59e0b" strokeWidth="30" strokeDasharray="80 439" strokeDashoffset="-310" transform="rotate(-90 100 100)" />
                  <circle cx="100" cy="100" r="70" fill="none" stroke="#10b981" strokeWidth="30" strokeDasharray="49 439" strokeDashoffset="-390" transform="rotate(-90 100 100)" />
                </svg>
              </div>
              <div className="chart-legend" style={{marginTop: '20px'}}>
                <div className="legend-item">
                  <div className="legend-color" style={{ background: '#3b82f6' }}></div>
                  <span>Engine Repair</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ background: '#ec4899' }}></div>
                  <span>Brake Service</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ background: '#f59e0b' }}></div>
                  <span>Oil Change</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ background: '#10b981' }}></div>
                  <span>Diagnostics</span>
                </div>
              </div>
            </div>

            <div className="chart-card sales-card">
              <div className="card-header">
                <h2>Monthly Services</h2>
              </div>
              <div className="bar-chart">
                <div className="bar-group">
                  <div className="bar-stack">
                    <div className="bar-segment" style={{ height: '40%', background: '#3b82f6' }}></div>
                    <div className="bar-segment" style={{ height: '30%', background: '#ec4899' }}></div>
                    <div className="bar-segment" style={{ height: '20%', background: '#f59e0b' }}></div>
                  </div>
                  <span className="bar-label">Jan</span>
                </div>
                <div className="bar-group">
                  <div className="bar-stack">
                    <div className="bar-segment" style={{ height: '50%', background: '#3b82f6' }}></div>
                    <div className="bar-segment" style={{ height: '25%', background: '#ec4899' }}></div>
                    <div className="bar-segment" style={{ height: '15%', background: '#f59e0b' }}></div>
                  </div>
                  <span className="bar-label">Feb</span>
                </div>
                <div className="bar-group">
                  <div className="bar-stack">
                    <div className="bar-segment" style={{ height: '60%', background: '#3b82f6' }}></div>
                    <div className="bar-segment" style={{ height: '20%', background: '#ec4899' }}></div>
                    <div className="bar-segment" style={{ height: '12%', background: '#f59e0b' }}></div>
                  </div>
                  <span className="bar-label">Mar</span>
                </div>
                <div className="bar-group">
                  <div className="bar-stack">
                    <div className="bar-segment" style={{ height: '55%', background: '#3b82f6' }}></div>
                    <div className="bar-segment" style={{ height: '28%', background: '#ec4899' }}></div>
                    <div className="bar-segment" style={{ height: '10%', background: '#f59e0b' }}></div>
                  </div>
                  <span className="bar-label">Apr</span>
                </div>
              </div>
            </div>

            <div className="chart-card campaigns-card">
              <div className="card-header">
                <h2>Top Performing Mechanics</h2>
                <button className="view-details">Details</button>
              </div>
              <div className="campaigns-table">
                <table>
                  <thead>
                    <tr>
                      <th>Mechanic</th>
                      <th>Services</th>
                      <th>Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topMechanics.map((mechanic, index) => (
                      <tr key={index}>
                        <td>{mechanic.name}</td>
                        <td>{mechanic.servicesCompleted}</td>
                        <td>⭐ {mechanic.rating}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} user={user} />
    </div>
  );
}
