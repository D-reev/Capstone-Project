# 🚗 MotoHub - Automotive Service Management System

A comprehensive web-based automotive service management platform built with React and Firebase, designed to streamline operations for auto repair shops, mechanics, and vehicle owners.

![React](https://img.shields.io/badge/React-19.1.0-blue.svg)
![Firebase](https://img.shields.io/badge/Firebase-12.0.0-orange.svg)
![Vite](https://img.shields.io/badge/Vite-7.0.4-purple.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [User Roles](#user-roles)
- [Screenshots](#screenshots)
- [Contributing](#contributing)

## 🎯 Overview

MotoHub is a modern, full-featured automotive service management system that connects vehicle owners with mechanics and administrators. The platform provides role-based access control, real-time updates, and comprehensive vehicle service tracking capabilities.

## ✨ Features

### For Customers (Vehicle Owners)
- 🚙 **Vehicle Management** - Add, edit, and track multiple vehicles
- 📅 **Service History** - Complete service record tracking with downloadable reports
- 🔧 **Service Requests** - Submit and track repair/maintenance requests
- 📊 **Dashboard** - Overview of all vehicles and service statuses
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile

### For Mechanics
- 🛠️ **Service Management** - View and manage assigned service tasks
- 📦 **Parts Requests** - Request parts inventory for repairs
- 📋 **Service Reports** - Create detailed service reports for customers
- 🔔 **Notifications** - Real-time updates on request approvals
- 🎨 **Custom Theme** - Yellow/black branded interface

### For Administrators
- 👥 **User Management** - Manage customers, mechanics, and admin accounts
- 📊 **Analytics Dashboard** - View system-wide statistics and metrics
- 🏷️ **Inventory Management** - Track and manage parts inventory
- ✅ **Request Approval** - Approve or reject parts and service requests
- 📝 **Activity Logs** - Comprehensive audit trail of all system activities
- 🔍 **Advanced Search & Filters** - Quickly find and manage data

## 🛠️ Tech Stack

### Frontend
- **React 19.1.0** - Modern UI library
- **Vite** - Lightning-fast build tool
- **React Router DOM** - Client-side routing
- **Ant Design (antd)** - Enterprise-grade UI components
- **Lucide React** - Beautiful icon library
- **Tailwind CSS** - Utility-first CSS framework

### Backend & Services
- **Firebase Authentication** - Secure user authentication with Google OAuth
- **Cloud Firestore** - NoSQL real-time database
- **Firebase Hosting** - Fast and secure hosting

### Additional Libraries
- **jsPDF & jsPDF-AutoTable** - PDF generation for reports
- **Day.js** - Date manipulation and formatting
- **Ant Design Charts** - Data visualization
- **Vite PWA Plugin** - Progressive Web App capabilities

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/D-reev/Capstone-Project.git
   cd Capstone-Project/Motohub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password and Google)
   - Create a Firestore database
   - Copy your Firebase config

4. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Build for production**
   ```bash
   npm run build
   ```

## 📁 Project Structure

```
Motohub/
├── src/
│   ├── assets/          # Images and static assets
│   ├── components/      # Reusable React components
│   │   ├── modals/      # Modal dialogs
│   │   ├── AdminSidebar.jsx
│   │   ├── MechanicSidebar.jsx
│   │   ├── UserSidebar.jsx
│   │   └── TopBar.jsx
│   ├── config/          # Firebase configuration
│   ├── context/         # React Context (Auth)
│   ├── css/             # Component styles
│   ├── hooks/           # Custom React hooks
│   ├── pages/           # Main page components
│   │   ├── AdminDashboard.jsx
│   │   ├── AdminRequests.jsx
│   │   ├── Inventory.jsx
│   │   ├── MechanicDashboard.jsx
│   │   ├── UserDashboard.jsx
│   │   └── UserManagement.jsx
│   ├── utils/           # Utility functions
│   ├── App.jsx          # Main app component
│   └── main.jsx         # Entry point
├── public/              # Public assets
├── package.json
└── vite.config.js
```

## 👤 User Roles

### Customer
- Access to personal dashboard
- Vehicle and service management
- Request services and view history

### Mechanic
- Service task management
- Parts request submission
- Service report creation

### Admin
- Full system access
- User and inventory management
- System analytics and logs
- Request approval workflow

## 🎨 Key Components

### Authentication
- Protected routes based on user roles
- Firebase Authentication with email/password and Google OAuth
- Automatic role-based dashboard routing

### Modals
- Add/Edit Car Modal
- Service History Modal
- Parts Request Modal
- Service Report Modal
- User Management Modals
- Profile Management

### Features Implementation
- **Real-time Updates** - Firestore listeners for live data
- **PDF Export** - Generate service reports and invoices
- **Search & Filter** - Advanced filtering across all data tables
- **Responsive Design** - Mobile-first approach with breakpoints
- **Theme Consistency** - Role-based color schemes (Yellow for mechanics, Blue for admin)

## 🔐 Security

- Firebase Authentication for secure user access
- Role-based access control (RBAC)
- Protected API routes
- Firestore security rules
- Environment variable protection

## 📱 Progressive Web App

MotoHub includes PWA capabilities:
- Offline functionality
- Install to home screen
- Service worker caching
- Fast load times

## 👨‍💻 Authors

- **D-reev** - [GitHub Profile](https://github.com/D-reev)

## 🙏 Acknowledgments

- React and Vite teams for excellent development tools
- Firebase for backend infrastructure
- Ant Design for UI components
- Lucide for beautiful icons

## 📞 Support

For support, hed-aabellera@smu.edu.ph or open an issue in the GitHub repository.

---

**Built with ❤️ using React and Firebase**
