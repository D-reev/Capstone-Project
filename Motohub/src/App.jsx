import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import PrivateRoute from "./components/ProtectedRoute";
import UserManagement from "./pages/UserManagement";
import ServiceHistory from "./pages/ServiceHistory";
import MechanicDashboard from "./pages/MechanicDashboard";
import Inventory from "./pages/Inventory";
import AdminRequest from "./pages/AdminRequests";
import ProfileSection from "./pages/ProfileSection";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          
          {/* Admin Routes */}
          <Route path="/admindashboard/*" element={
            <PrivateRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </PrivateRoute>
          } />
          
          {/* Mechanic Routes */}
          <Route path="/mechanicdashboard/*" element={
            <PrivateRoute allowedRoles={['admin', 'mechanic']}>
              <MechanicDashboard />
            </PrivateRoute>
          } />
          
          {/* User Routes */}
          <Route path="/userdashboard/*" element={
            <PrivateRoute allowedRoles={['user']}>
              <UserDashboard />
            </PrivateRoute>
          } />

          <Route path="/userdashboard/profilesection" element={
            <PrivateRoute allowedRoles={['user']}>
              <ProfileSection />
            </PrivateRoute>
          } />
          
          <Route
            path="/servicehistory/*"
            element={
              <PrivateRoute>
                <ServiceHistory />
              </PrivateRoute>
            }
          />
          <Route
            path="/admindashboard/users"
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <UserManagement />
              </PrivateRoute>
            }
          />
          <Route
            path="/admindashboard/inventory"
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <Inventory />
              </PrivateRoute>
            }
          />
          <Route
            path="/admindashboard/adminrequest"
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <AdminRequest />
              </PrivateRoute>
            }
          />
        </Routes>
        
        
      </AuthProvider>
    </Router>
  );
}

export default App;