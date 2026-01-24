// frontend/src/components/Manager/Dashboard.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { managerAPI, authAPI } from '../../services/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const ManagerDashboard = () => {
    const queryClient = useQueryClient();
    const [quickTask, setQuickTask] = useState({
        title: '',
        assignedTo: '',
        dueDate: '',
        priority: 'Medium'
    });

    const { data: dashboardData, isLoading } = useQuery(
        ['managerDashboard'],
        managerAPI.getDashboard
    );

    const { data: teamData } = useQuery(
        ['team'],
        () => managerAPI.getTeam()
    );

    const createTaskMutation = useMutation(
        (taskData) => managerAPI.assignTask(taskData),
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['managerDashboard']);
                toast.success('Task assigned successfully!');
                setQuickTask({ title: '', assignedTo: '', dueDate: '', priority: 'Medium' });
            },
            onError: (error) => {
                toast.error(error.message || 'Failed to assign task');
            }
        }
    );

    if (isLoading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    const { stats, recentActivities } = dashboardData?.dashboard || {};
    const teamMembers = teamData?.team || [];

    const handleQuickTaskSubmit = (e) => {
        e.preventDefault();
        if (!quickTask.title || !quickTask.assignedTo || !quickTask.dueDate) {
            toast.error('Please fill all fields');
            return;
        }
        createTaskMutation.mutate(quickTask);
    };

    return (
        <div className="container-fluid py-2">
            {/* Page Header */}
            <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                    <h2 className="mb-0">Overview</h2>
                    <p className="text-muted mb-0">Departmental performance and activities</p>
                </div>
                <div className="d-flex gap-2">
                    <button className="btn-icon bg-white shadow-sm">
                        <i className="fas fa-calendar"></i>
                    </button>
                    <button className="btn-icon bg-white shadow-sm">
                        <i className="fas fa-filter"></i>
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="row g-4 mb-5">
                {[
                    { label: 'Total Staff', value: stats?.teamSize || 0, icon: 'fas fa-users', color: 'primary', trend: '+ Live update' },
                    { label: 'Active Work', value: stats?.totalTasks - stats?.completedTasks || 0, icon: 'fas fa-tasks', color: 'success', trend: '↑ Real-time' },
                    { label: 'Completed', value: stats?.completedTasks || 0, icon: 'fas fa-check-circle', color: 'info', trend: '↑ Updated' },
                    { label: 'Pending', value: stats?.pendingTasks || 0, icon: 'fas fa-clock', color: 'warning', trend: '! Needs attention' }
                ].map((stat, i) => (
                    <div className="col-xl-3 col-md-6" key={i}>
                        <div className="premium-card h-100">
                            <div className="d-flex justify-content-between align-items-start mb-3">
                                <div className={`btn-icon rounded-circle bg-${stat.color} text-white`}>
                                    <i className={stat.icon}></i>
                                </div>
                                <small className={`text-${stat.color} fw-bold`}>{stat.trend}</small>
                            </div>
                            <h3 className="mb-1">{stat.value}</h3>
                            <p className="text-muted mb-0">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="row g-4">
                {/* Recent Activities Table */}
                <div className="col-lg-8">
                    <div className="premium-card">
                        <div className="d-flex align-items-center justify-content-between mb-4">
                            <h5 className="mb-0">
                                <i className="fas fa-project-diagram text-primary me-2"></i> Task Overview
                            </h5>
                            <Link to="/tasks" className="btn btn-sm btn-outline-primary rounded-pill px-3">View All Status</Link>
                        </div>
                        <div className="table-responsive">
                            <table className="premium-table">
                                <thead>
                                    <tr>
                                        <th>Task ID</th>
                                        <th>Title</th>
                                        <th>Assigned To</th>
                                        <th>Status</th>
                                        <th>Progress</th>
                                        <th>Due Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentActivities?.slice(0, 6).map((task) => (
                                        <tr key={task._id}>
                                            <td><span className="fw-bold">WF-{task._id.slice(-3).toUpperCase()}</span></td>
                                            <td>{task.title}</td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <div className="avatar sm bg-light me-2 rounded-circle text-center" style={{ width: '24px', height: '24px', fontSize: '0.7rem', lineHeight: '24px' }}>
                                                        {task.assignedTo?.fullName?.charAt(0)}
                                                    </div>
                                                    {task.assignedTo?.fullName}
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge-premium badge-${(task.status || 'pending').toLowerCase().replace(' ', '_')}`}>
                                                    {(task.status || 'pending').replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center gap-2">
                                                    <div className="progress flex-grow-1" style={{ height: '4px', minWidth: '80px' }}>
                                                        <div
                                                            className="progress-bar bg-success"
                                                            style={{ width: `${task.progress || 0}%` }}
                                                        ></div>
                                                    </div>
                                                    <small className="extra-small text-muted">{task.progress || 0}%</small>
                                                </div>
                                            </td>
                                            <td>{new Date(task.dueDate).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                    {(!recentActivities || recentActivities.length === 0) && (
                                        <tr>
                                            <td colSpan="6" className="text-center py-4 text-muted">No recent activities found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Sidebar Cards */}
                <div className="col-lg-4">
                    {/* Notifications Card */}
                    <div className="premium-card mb-4" style={{ minHeight: '200px' }}>
                        <div className="d-flex align-items-center justify-content-between mb-4">
                            <h5 className="mb-0">
                                <i className="fas fa-bell text-primary me-2"></i> Notifications
                            </h5>
                            <button className="btn btn-sm btn-link text-primary p-0 text-decoration-none">Mark All Read</button>
                        </div>
                        <div className="d-flex flex-column align-items-center justify-content-center text-muted py-4">
                            <i className="fas fa-bell-slash fa-2x mb-2 opacity-50"></i>
                            <p className="small mb-0">No notifications</p>
                        </div>
                    </div>

                    {/* Assign Work Shortcut Card */}
                    <div className="premium-card">
                        <div className="text-center py-4">
                            <div className="btn-icon bg-primary text-white rounded-circle mx-auto mb-3" style={{ width: '60px', height: '60px' }}>
                                <i className="fas fa-tasks fa-lg"></i>
                            </div>
                            <h5 className="mb-2">Manage Unassigned Work</h5>
                            <p className="text-muted small mb-4">Pick up tasks from the pool that were issued by Admin and delegate them to your staff.</p>
                            <Link
                                to="/manager/work-pool"
                                className="btn-premium w-100 justify-content-center text-decoration-none"
                            >
                                <i className="fas fa-layer-group"></i> View Work Pool
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManagerDashboard;