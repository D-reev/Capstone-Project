import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { TrendingUp, TrendingDown, Package, Wrench, Car, Users } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import NavigationBar from '../components/NavigationBar';
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
  const [lowStockItems, setLowStockItems] = useState([]);
  const [mechanicRatings, setMechanicRatings] = useState({});
  const [inventoryStats, setInventoryStats] = useState({
    totalValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    topCategories: []
  });

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Get current date and time periods for comparison
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      // Fetch all users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = usersSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(0)
      }));
      
      // Filter only customers (users with role 'user')
      const customers = users.filter(u => u.role === 'user');
      const customersThisMonth = customers.filter(u => u.createdAt >= thirtyDaysAgo).length;
      const customersLastMonth = customers.filter(u => u.createdAt >= sixtyDaysAgo && u.createdAt < thirtyDaysAgo).length;
      const customerGrowth = customersLastMonth > 0 
        ? parseFloat(((customersThisMonth - customersLastMonth) / customersLastMonth * 100).toFixed(1))
        : (customersThisMonth > 0 ? 100 : 0);
      
      // Fetch all mechanics
      const mechanics = users.filter(u => u.role === 'mechanic');

      // Fetch mechanic ratings from the mechanicRatings collection
      const ratingsSnapshot = await getDocs(collection(db, 'mechanicRatings'));
      const ratingsMap = {};
      ratingsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        ratingsMap[doc.id] = {
          averageRating: data.averageRating || 0,
          totalRatings: data.totalRatings || 0,
          totalScore: data.totalScore || 0
        };
      });
      setMechanicRatings(ratingsMap);

      // Count total vehicles and service history from all customers
      let totalVehicles = 0;
      let totalServiceHistory = 0;
      let servicesThisMonth = 0;
      let servicesLastMonth = 0;
      
      const allCustomers = users.filter(u => u.role === 'user');
      for (const u of allCustomers) {
        const carsSnapshot = await getDocs(collection(db, 'users', u.id, 'cars'));
        totalVehicles += carsSnapshot.size;
        
        // Count service history and track by date
        for (const carDoc of carsSnapshot.docs) {
          const serviceHistorySnapshot = await getDocs(collection(db, 'users', u.id, 'cars', carDoc.id, 'serviceHistory'));
          totalServiceHistory += serviceHistorySnapshot.size;
          
          // Count services in the last 30 days vs previous 30 days
          serviceHistorySnapshot.docs.forEach(serviceDoc => {
            const serviceData = serviceDoc.data();
            const serviceDate = serviceData.timestamp?.toDate?.() || serviceData.date?.toDate?.() || new Date(0);
            
            if (serviceDate >= thirtyDaysAgo) {
              servicesThisMonth++;
            } else if (serviceDate >= sixtyDaysAgo && serviceDate < thirtyDaysAgo) {
              servicesLastMonth++;
            }
          });
        }
      }
      
      const servicesGrowth = servicesLastMonth > 0 
        ? parseFloat(((servicesThisMonth - servicesLastMonth) / servicesLastMonth * 100).toFixed(1))
        : (servicesThisMonth > 0 ? 100 : 0);

      // Fetch part requests
      const requestsSnapshot = await getDocs(collection(db, 'partRequests'));
      const requests = requestsSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().timestamp?.toDate?.() || new Date(0)
      }));
      const pendingRequests = requests.filter(r => r.status === 'pending').length;
      const completedRequests = requests.filter(r => r.status === 'completed' || r.status === 'approved').length;

      // Fetch inventory parts
      const partsSnapshot = await getDocs(collection(db, 'inventory'));
      const parts = partsSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(0)
      }));
      const lowStockParts = parts.filter(p => (p.quantity || 0) <= (p.minStock || p.reorderLevel || 10));
      const outOfStockParts = parts.filter(p => (p.quantity || 0) === 0);
      
      // Calculate parts growth (new parts added in last 30 days vs previous 30 days)
      const partsThisMonth = parts.filter(p => p.createdAt >= thirtyDaysAgo).length;
      const partsLastMonth = parts.filter(p => p.createdAt >= sixtyDaysAgo && p.createdAt < thirtyDaysAgo).length;
      const partsGrowth = partsLastMonth > 0 
        ? parseFloat(((partsThisMonth - partsLastMonth) / partsLastMonth * 100).toFixed(1))
        : (partsThisMonth > 0 ? 100 : 0);

      // Calculate inventory value
      const totalInventoryValue = parts.reduce((sum, p) => sum + ((p.price || 0) * (p.quantity || 0)), 0);

      // Get top categories by count
      const categoryCount = {};
      parts.forEach(p => {
        const cat = p.category || 'Uncategorized';
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      });
      const topCategories = Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      // Low stock items for analytics
      const lowStockItemsData = lowStockParts
        .sort((a, b) => (a.quantity || 0) - (b.quantity || 0))
        .slice(0, 8)
        .map(p => ({
          id: p.id,
          name: p.name,
          category: p.category,
          quantity: p.quantity || 0,
          minStock: p.minStock || p.reorderLevel || 10,
          price: p.price || 0,
          status: (p.quantity || 0) === 0 ? 'Out of Stock' : 'Low Stock'
        }));

      setLowStockItems(lowStockItemsData);
      setInventoryStats({
        totalValue: totalInventoryValue,
        lowStockCount: lowStockParts.length,
        outOfStockCount: outOfStockParts.length,
        topCategories
      });

      // Calculate revenue from completed requests (last 30 days vs previous 30 days)
      const completedRequestsThisMonth = requests.filter(r => 
        (r.status === 'completed' || r.status === 'approved') && r.createdAt >= thirtyDaysAgo
      );
      const completedRequestsLastMonth = requests.filter(r => 
        (r.status === 'completed' || r.status === 'approved') && 
        r.createdAt >= sixtyDaysAgo && r.createdAt < thirtyDaysAgo
      );
      
      const revenueThisMonth = completedRequestsThisMonth.reduce((sum, req) => {
        const reqTotal = req.parts?.reduce((pSum, p) => pSum + (p.price || 0) * (p.quantity || 1), 0) || 0;
        return sum + reqTotal;
      }, 0);
      
      const revenueLastMonth = completedRequestsLastMonth.reduce((sum, req) => {
        const reqTotal = req.parts?.reduce((pSum, p) => pSum + (p.price || 0) * (p.quantity || 1), 0) || 0;
        return sum + reqTotal;
      }, 0);
      
      const totalRevenue = requests
        .filter(r => r.status === 'completed' || r.status === 'approved')
        .reduce((sum, req) => {
          const reqTotal = req.parts?.reduce((pSum, p) => pSum + (p.price || 0) * (p.quantity || 1), 0) || 0;
          return sum + reqTotal;
        }, 0);
      
      const revenueGrowth = revenueLastMonth > 0 
        ? parseFloat(((revenueThisMonth - revenueLastMonth) / revenueLastMonth * 100).toFixed(1))
        : (revenueThisMonth > 0 ? 100 : 0);

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

      // Top mechanics by service count and ratings
      const mechanicsPerformance = mechanics.map((mech) => {
        const mechanicId = mech.id;
        const rating = ratingsMap[mechanicId];
        
        return {
          id: mechanicId,
          name: mech.name || mech.displayName || mech.email?.split('@')[0] || 'Unknown',
          servicesCompleted: rating?.totalRatings || 0, // Using total ratings as service count
          rating: rating?.averageRating || 0,
          totalRatings: rating?.totalRatings || 0
        };
      })
      .sort((a, b) => {
        // Sort by average rating first, then by number of services
        if (b.rating !== a.rating) {
          return b.rating - a.rating;
        }
        return b.servicesCompleted - a.servicesCompleted;
      })
      .slice(0, 6); // Get top 6 mechanics

      console.log('Mechanics:', mechanics);
      console.log('Ratings Map:', ratingsMap);
      console.log('Mechanics Performance:', mechanicsPerformance);

      setStats({
        totalServices: totalServiceHistory,
        servicesChange: servicesGrowth,
        totalRevenue,
        revenueChange: revenueGrowth,
        totalParts: parts.length,
        partsChange: partsGrowth,
        totalCustomers: customers.length,
        customersChange: customerGrowth,
        totalVehicles,
        totalRequests: requests.length,
        pendingRequests,
        completedServices: completedRequests,
        lowStockParts: inventoryStats.lowStockCount
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

  const StarRating = ({ rating, totalRatings }) => {
    const numericRating = typeof rating === 'number' ? rating : parseFloat(rating) || 0;
    const fullStars = Math.floor(numericRating);
    const hasHalfStar = numericRating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '2px' }}>
          {[...Array(fullStars)].map((_, i) => (
            <svg key={`full-${i}`} width="16" height="16" viewBox="0 0 24 24" fill="#ff9e0b" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          ))}
          {hasHalfStar && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="halfGrad">
                  <stop offset="50%" stopColor="#ff9e0b" />
                  <stop offset="50%" stopColor="#cbd5e0" />
                </linearGradient>
              </defs>
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="url(#halfGrad)" />
            </svg>
          )}
          {[...Array(emptyStars)].map((_, i) => (
            <svg key={`empty-${i}`} width="16" height="16" viewBox="0 0 24 24" fill="#cbd5e0" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          ))}
        </div>
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
          {numericRating.toFixed(1)}
        </span>
        <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
          ({totalRatings || 0})
        </span>
      </div>
    );
  };

  if (loading) {
    return <Loading text="Loading dashboard..." />;
  }

  return (
    <div className="dashboard-page">
      <AdminSidebar sidebarOpen={sidebarOpen} user={user} />
      
      <div className={`dashboard-main ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        <NavigationBar
          title="Dashboard"
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onProfileClick={() => setProfileOpen(true)}
          userRole="admin"
          userName={user?.displayName || 'Admin'}
          userEmail={user?.email || ''}
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
            {/* Inventory Analytics Section */}
            <div className="chart-card" style={{ gridColumn: 'span 2' }}>
              <div className="card-header">
                <div>
                  <h2>Inventory Analytics</h2>
                  <p style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: '0.25rem' }}>
                    Real-time inventory status and alerts
                  </p>
                </div>
                <button className="view-details" onClick={() => window.location.href = '#/inventory'}>
                  View Inventory
                </button>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', padding: '1.5rem', borderBottom: '1px solid #E5E7EB' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: '#3b82f6', marginBottom: '0.5rem' }}>
                    ₱{inventoryStats.totalValue.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>Total Inventory Value</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: '#f59e0b', marginBottom: '0.5rem' }}>
                    {inventoryStats.lowStockCount}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>Low Stock Items</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: '#DC2626', marginBottom: '0.5rem' }}>
                    {inventoryStats.outOfStockCount}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>Out of Stock</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981', marginBottom: '0.5rem' }}>
                    {stats.totalParts}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>Total Parts</div>
                </div>
              </div>

              <div style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#374151' }}>
                  Low Stock Alerts
                </h3>
                {lowStockItems.length > 0 ? (
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {lowStockItems.map((item) => (
                      <div 
                        key={item.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '1rem',
                          background: item.status === 'Out of Stock' ? '#FEE2E2' : '#FEF3C7',
                          borderRadius: '8px',
                          borderLeft: `4px solid ${item.status === 'Out of Stock' ? '#DC2626' : '#F59E0B'}`
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: '#111827', marginBottom: '0.25rem' }}>
                            {item.name}
                          </div>
                          <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                            {item.category} • Min Stock: {item.minStock}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{
                            fontSize: '1.25rem',
                            fontWeight: 700,
                            color: item.status === 'Out of Stock' ? '#DC2626' : '#F59E0B'
                          }}>
                            {item.quantity}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>units left</div>
                        </div>
                        <div style={{
                          marginLeft: '1rem',
                          padding: '0.5rem 1rem',
                          background: item.status === 'Out of Stock' ? '#DC2626' : '#F59E0B',
                          color: 'white',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          whiteSpace: 'nowrap'
                        }}>
                          {item.status}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    padding: '2rem',
                    textAlign: 'center',
                    color: '#9CA3AF',
                    background: '#F9FAFB',
                    borderRadius: '8px'
                  }}>
                    <Package size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                    <div>All inventory levels are healthy!</div>
                  </div>
                )}
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
                    {topMechanics.length > 0 ? (
                      topMechanics.map((mechanic, index) => (
                        <tr key={mechanic.id || index}>
                          <td>{mechanic.name}</td>
                          <td>{mechanic.servicesCompleted}</td>
                          <td>
                            {mechanic.rating > 0 ? (
                              <StarRating 
                                rating={mechanic.rating} 
                                totalRatings={mechanic.totalRatings}
                              />
                            ) : (
                              <span style={{ fontSize: '0.875rem', color: '#9CA3AF' }}>No ratings yet</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: '#9CA3AF' }}>
                          No mechanics found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="bottom-row" style={{ marginTop: '2rem' }}>
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

            <div className="chart-card">
              <div className="card-header">
                <h2>Top Categories</h2>
              </div>
              <div style={{ padding: '1.5rem' }}>
                {inventoryStats.topCategories.map((cat, index) => {
                  const colors = ['#3b82f6', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6'];
                  const color = colors[index % colors.length];
                  const maxCount = inventoryStats.topCategories[0]?.count || 1;
                  const percentage = (cat.count / maxCount) * 100;
                  
                  return (
                    <div key={cat.name} style={{ marginBottom: '1.5rem' }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        marginBottom: '0.5rem',
                        fontSize: '0.875rem'
                      }}>
                        <span style={{ fontWeight: 600, color: '#374151' }}>{cat.name}</span>
                        <span style={{ color: '#6B7280' }}>{cat.count} parts</span>
                      </div>
                      <div style={{
                        width: '100%',
                        height: '8px',
                        background: '#E5E7EB',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${percentage}%`,
                          height: '100%',
                          background: color,
                          borderRadius: '4px',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} user={user} />
    </div>
  );
}
