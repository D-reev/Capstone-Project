import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import UserManagement from "./pages/UserManagement";
import ServiceHistory from "./pages/ServiceHistory";
import MechanicDashboard from "./pages/MechanicDashboard";
import Inventory from "./pages/Inventory";
import AdminRequests from "./pages/AdminRequests";
import AdminLogs from "./pages/AdminLogs";
import ProfileSection from "./pages/ProfileSection";
import MechanicINVRequest from "./pages/MechanicINVRequest";

import "./App.css";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          
          {/* Admin Routes */}
          <Route path="/admindashboard" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admindashboard/profile" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ProfileSection />
            </ProtectedRoute>
          } />
          <Route path="/admindashboard/users" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UserManagement />
            </ProtectedRoute>
          } />
          <Route path="/admindashboard/inventory" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Inventory />
            </ProtectedRoute>
          } />
          <Route path="/admindashboard/adminrequest" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminRequests />
            </ProtectedRoute>
          } />
          <Route path="/admindashboard/logs" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLogs />
            </ProtectedRoute>
          } />

          {/* Mechanic Routes */}
          <Route path="/mechanicdashboard" element={
            <ProtectedRoute allowedRoles={['mechanic', 'admin']}>
              <MechanicDashboard />
            </ProtectedRoute>
          } />
          <Route path="/mechanicdashboard/profile" element={
            <ProtectedRoute allowedRoles={['mechanic', 'admin']}>
              <ProfileSection />
            </ProtectedRoute>
          } />
          <Route path="/mechanicdashboard/requests" element={
            <ProtectedRoute allowedRoles={['mechanic', 'admin']}>
              <MechanicINVRequest />
            </ProtectedRoute>
          } />

          {/* User Routes */}
          <Route path="/userdashboard" element={
            <ProtectedRoute allowedRoles={['user']}>
              <UserDashboard />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute allowedRoles={['user']}>
              <ProfileSection />
            </ProtectedRoute>
          } />
          <Route path="/servicehistory" element={
            <ProtectedRoute allowedRoles={['user']}>
              <ServiceHistory />
            </ProtectedRoute>
          } />

          {/* Catch all - redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;