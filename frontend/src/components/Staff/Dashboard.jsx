// frontend/src/components/Staff/Dashboard.jsx
import React from 'react';
import { useQuery } from 'react-query';
import { staffAPI } from '../../services/api';
import { Link } from 'react-router-dom';

const StaffDashboard = () => {
    const { data: dashboardData, isLoading } = useQuery(
        ['staffDashboard'],
        staffAPI.getDashboard
    );

    const { data: notifications } = useQuery(
        ['notifications'],
        staffAPI.getNotifications
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

    const { stats, recentTasks } = dashboardData?.dashboard || {};

    return (
        <div className="container-fluid py-2">
            {/* Page Header */}
            <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                    <h2 className="mb-0">My Workspace</h2>
                    <p className="text-muted mb-0">Track your progress and upcoming tasks</p>
                </div>
                <div className="d-flex gap-2">
                    <Link to="/tasks" className="btn-premium py-2 px-4 shadow-sm">
                        <i className="fas fa-list-alt"></i> My Tasks
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="row g-4 mb-5">
                {[
                    { label: 'Assigned Tasks', value: stats?.totalTasks || 0, icon: 'fas fa-clipboard-list', color: 'primary', trend: 'Live' },
                    { label: 'In Progress', value: stats?.inProgressTasks || 0, icon: 'fas fa-spinner', color: 'info', trend: 'Active' },
                    { label: 'Completed', value: stats?.completedTasks || 0, icon: 'fas fa-check-double', color: 'success', trend: 'Done' },
                    { label: 'Pending/Hold', value: stats?.pendingTasks || 0, icon: 'fas fa-pause-circle', color: 'warning', trend: 'Action req.' }
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
                {/* Recent Tasks Table */}
                <div className="col-lg-8">
                    <div className="premium-card">
                        <div className="d-flex align-items-center justify-content-between mb-4">
                            <h5 className="mb-0">
                                <i className="fas fa-tasks text-primary me-2"></i> Active Tasks
                            </h5>
                            <Link to="/tasks" className="btn btn-sm btn-outline-primary rounded-pill px-3">View All</Link>
                        </div>
                        <div className="table-responsive">
                            <table className="premium-table">
                                <thead>
                                    <tr>
                                        <th>Task ID</th>
                                        <th>Task Description</th>
                                        <th>Due Date</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentTasks?.map((task) => (
                                        <tr key={task._id}>
                                            <td><span className="fw-bold">TSK-{task._id.slice(-4).toUpperCase()}</span></td>
                                            <td>{task.title}</td>
                                            <td>{new Date(task.dueDate).toLocaleDateString()}</td>
                                            <td>
                                                <span className={`badge-premium badge-${task.status?.toLowerCase().replace(' ', '_')}`}>
                                                    {task.status?.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td>
                                                <Link to={`/tasks/${task._id}`} className="btn-icon bg-light">
                                                    <i className="fas fa-arrow-right"></i>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!recentTasks || recentTasks.length === 0) && (
                                        <tr>
                                            <td colSpan="5" className="text-center py-4 text-muted">No active tasks assigned</td>
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
                    <div className="premium-card mb-4">
                        <div className="d-flex align-items-center justify-content-between mb-4">
                            <h5 className="mb-0">
                                <i className="fas fa-bell text-primary me-2"></i> Messages
                            </h5>
                            <button className="btn btn-sm btn-link text-primary p-0 text-decoration-none">Read All</button>
                        </div>
                        <div className="notification-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {notifications?.length > 0 ? (
                                notifications.map((notif) => (
                                    <div key={notif._id} className="p-3 mb-2 rounded-3 bg-light border-start border-4 border-primary">
                                        <div className="d-flex justify-content-between align-items-start">
                                            <h6 className="mb-1" style={{ fontSize: '0.85rem' }}>{notif.title}</h6>
                                            <small className="text-muted" style={{ fontSize: '0.7rem' }}>{new Date(notif.createdAt).toLocaleDateString()}</small>
                                        </div>
                                        <p className="mb-0 text-muted small">{notif.message}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-4 text-muted small">
                                    <i className="fas fa-envelope-open fa-2x mb-2 opacity-50"></i>
                                    <p>Your inbox is clear</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Progress Card */}
                    <div className="premium-card bg-primary text-white">
                        <h5 className="mb-4 text-white">
                            <i className="fas fa-rocket me-2"></i> Performance
                        </h5>
                        <div className="text-center py-3">
                            <div className="display-4 fw-bold mb-1">
                                {stats?.totalTasks ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%
                            </div>
                            <p className="small opacity-75">Tasks Completion Rate</p>
                            <div className="progress bg-white bg-opacity-25 mt-3" style={{ height: '8px' }}>
                                <div
                                    className="progress-bar bg-white"
                                    style={{ width: `${stats?.totalTasks ? (stats.completedTasks / stats.totalTasks) * 100 : 0}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaffDashboard;