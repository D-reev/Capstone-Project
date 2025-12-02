import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { App as AntdApp } from "antd";
import { AuthProvider } from "./context/AuthContext";
import { SidebarProvider } from "./context/SidebarContext";
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
import MyCars from "./pages/MyCars";
import AdminPromotions from "./pages/AdminPromotions";
import PendingReports from "./pages/PendingReports";

import "./App.css";

function App() {
  return (
    <AntdApp>
      <AuthProvider>
        <SidebarProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
          
          {/* Admin Routes */}
          <Route path="/admindashboard" element={
            <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admindashboard/profile" element={
            <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
              <ProfileSection />
            </ProtectedRoute>
          } />
          <Route path="/admindashboard/users" element={
            <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
              <UserManagement />
            </ProtectedRoute>
          } />
          <Route path="/admindashboard/inventory" element={
            <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
              <Inventory />
            </ProtectedRoute>
          } />
          <Route path="/admindashboard/adminrequest" element={
            <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
              <AdminRequests />
            </ProtectedRoute>
          } />
          <Route path="/admindashboard/logs" element={
            <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
              <AdminLogs />
            </ProtectedRoute>
          } />
          <Route path="/admindashboard/promotions" element={
            <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
              <AdminPromotions />
            </ProtectedRoute>
          } />

          {/* Mechanic Routes */}
          <Route path="/mechanicdashboard" element={
            <ProtectedRoute allowedRoles={['mechanic', 'admin', 'superadmin']}>
              <MechanicDashboard />
            </ProtectedRoute>
          } />
          <Route path="/mechanicdashboard/profile" element={
            <ProtectedRoute allowedRoles={['mechanic', 'admin', 'superadmin']}>
              <ProfileSection />
            </ProtectedRoute>
          } />
          <Route path="/mechanicdashboard/requests" element={
            <ProtectedRoute allowedRoles={['mechanic', 'admin', 'superadmin']}>
              <MechanicINVRequest />
            </ProtectedRoute>
          } />
          <Route path="/mechanicdashboard/pendingreports" element={
            <ProtectedRoute allowedRoles={['mechanic', 'admin', 'superadmin']}>
              <PendingReports />
            </ProtectedRoute>
          } />

          {/* User Routes */}
          <Route path="/userdashboard" element={
            <ProtectedRoute allowedRoles={['user', 'superadmin']}>
              <UserDashboard />
            </ProtectedRoute>
          } />
          <Route path="/mycars" element={
            <ProtectedRoute allowedRoles={['user', 'superadmin']}>
              <MyCars />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute allowedRoles={['user', 'superadmin']}>
              <ProfileSection />
            </ProtectedRoute>
          } />
          <Route path="/servicehistory" element={
            <ProtectedRoute allowedRoles={['user', 'superadmin']}>
              <ServiceHistory />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
          </Router>
        </SidebarProvider>
      </AuthProvider>
    </AntdApp>
  );
}

export default App;