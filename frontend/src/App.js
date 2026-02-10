// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Layout Components
import Layout from './components/Layout/Layout';

// Auth Pages
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';

// Admin Pages
import AdminDashboard from './components/Admin/Dashboard';
import UserManagement from './components/Admin/UserManagement';
import AddWork from './components/Admin/AddWork';

// Manager Pages
import ManagerDashboard from './components/Manager/Dashboard';
import TeamManagement from './components/Manager/TeamManager';
import AssignTask from './components/Manager/AssignTask';
import WorkPool from './components/Manager/WorkPool';

// Staff Pages
import StaffDashboard from './components/Staff/Dashboard';
import MyTasks from './components/Staff/MyTasks';
import TaskDetails from './components/Staff/TaskDetails';

// Shared Pages
import Notifications from './components/Shared/Notifications';
import TaskStatus from './components/Shared/TaskStatus';
import Reports from './components/Shared/Reports';
import DepartmentView from './components/Shared/DepartmentView';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to={`/${user.role === 'admin' ? 'admin' : user.role === 'manager' ? 'manager' : ''}/dashboard`} />;
    }

    return <Layout>{children}</Layout>;
};

const queryClient = new QueryClient();

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <NotificationProvider>
                    <Router>
                    <Toaster position="top-right" />
                    <Routes>
                        {/* Auth Routes */}
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        {/* Root Redirect */}
                        <Route path="/" element={<ProtectedRoute><NavigateToDashboard /></ProtectedRoute>} />

                        {/* Admin Routes */}
                        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
                        <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><UserManagement /></ProtectedRoute>} />
                        <Route path="/admin/add-work" element={<ProtectedRoute allowedRoles={['admin']}><AddWork /></ProtectedRoute>} />

                        {/* Manager Routes */}
                        <Route path="/manager/dashboard" element={<ProtectedRoute allowedRoles={['manager', 'admin']}><ManagerDashboard /></ProtectedRoute>} />
                        <Route path="/manager/team" element={<ProtectedRoute allowedRoles={['admin']}><TeamManagement /></ProtectedRoute>} />
                        <Route path="/manager/assign-task" element={<ProtectedRoute allowedRoles={['manager', 'admin']}><AssignTask /></ProtectedRoute>} />
                        <Route path="/manager/work-pool" element={<ProtectedRoute allowedRoles={['manager', 'admin']}><WorkPool /></ProtectedRoute>} />

                        {/* Staff Routes */}
                        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['staff', 'manager', 'admin']}><StaffDashboard /></ProtectedRoute>} />

                        {/* Shared/Universal Routes */}
                        <Route path="/tasks" element={<ProtectedRoute allowedRoles={['staff', 'manager', 'admin']}><TaskStatus /></ProtectedRoute>} />
                        <Route path="/tasks/:id" element={<ProtectedRoute allowedRoles={['staff', 'manager', 'admin']}><TaskDetails /></ProtectedRoute>} />
                        <Route path="/notifications" element={<ProtectedRoute allowedRoles={['staff', 'manager', 'admin']}><Notifications /></ProtectedRoute>} />
                        <Route path="/reports" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><Reports /></ProtectedRoute>} />
                        <Route path="/departments" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><DepartmentView /></ProtectedRoute>} />

                        {/* Fallback */}
                        <Route path="*" element={<Navigate to="/login" />} />
                    </Routes>
                </Router>
                </NotificationProvider>
            </AuthProvider>
        </QueryClientProvider>
    );
}

// Helper to redirect to role-based dashboard
const NavigateToDashboard = () => {
    const { user } = useAuth();
    if (user?.role === 'admin') return <Navigate to="/admin/dashboard" />;
    if (user?.role === 'manager') return <Navigate to="/manager/dashboard" />;
    return <Navigate to="/dashboard" />;
};

export default App;