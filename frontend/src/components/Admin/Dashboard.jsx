// frontend/src/components/Admin/Dashboard.jsx
import React from 'react';
import { useQuery } from 'react-query';
import { adminAPI, IMAGE_BASE_URL } from '../../services/api';
import { Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
    const [showTaskModal, setShowTaskModal] = React.useState(false);
    const [taskForm, setTaskForm] = React.useState({
        title: '',
        description: '',
        department: '',
        priority: 'medium',
        assignedTo: '',
        dueDate: ''
    });

    const { data: dashboardData, isLoading, refetch } = useQuery(
        ['adminDashboard'],
        adminAPI.getDashboardStats,
        {
            refetchInterval: 15000, // Auto-refresh every 15 seconds
            refetchOnWindowFocus: true,
            refetchOnMount: true
        }
    );

    const { data: userData } = useQuery(
        ['allUsers'],
        () => adminAPI.getUsers(),
        {
            refetchInterval: 30000, // Refresh every 30 seconds
            refetchOnWindowFocus: true
        }
    );

    const location = useLocation();

    const [taskFilter, setTaskFilter] = React.useState('all');

    // Auto-open task modal if requested
    React.useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('action') === 'add-work') {
            setShowTaskModal(true);
        }
    }, [location.search]);

    if (isLoading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    const { stats, recentActivities, recentUsers } = dashboardData || {};
    const allStaff = userData?.users?.filter(u => u.role === 'staff' || u.role === 'manager') || [];
    const departmentStaff = taskForm.department 
        ? allStaff.filter(s => s.department === taskForm.department) 
        : [];

    return (
        <div className="container-fluid py-2">
            {/* Page Header */}
            <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                    <h2 className="mb-0">System Overview</h2>
                    <p className="text-muted mb-0">Total system performance and user activity</p>
                </div>
                <div className="d-flex gap-2">
                    <button className="btn btn-primary py-2 px-4 shadow-sm rounded-pill" onClick={() => setShowTaskModal(true)}>
                        <i className="fas fa-plus-circle me-2"></i> Add Work
                    </button>
                    <button className="btn-premium py-2 px-4 shadow-sm" onClick={() => window.print()}>
                        <i className="fas fa-file-export"></i> Export Report
                    </button>
                </div>
            </div>

            {/* Task Creation Modal */}
            {showTaskModal && (
                <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 rounded-4">
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title fw-bold">Create New Work Pool</h5>
                                <button type="button" className="btn-close" onClick={() => setShowTaskModal(false)}></button>
                            </div>
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                if (taskForm.title.trim().length < 5) return toast.error('Task title must be at least 5 characters');
                                if (taskForm.description.trim().length < 10) return toast.error('Description must be at least 10 characters');
                                if (!taskForm.department) return toast.error('Please select a department');
                                const selectedDate = new Date(taskForm.dueDate);
                                const today = new Date();
                                today.setHours(0,0,0,0);
                                if (selectedDate < today) return toast.error('Due date cannot be in the past');
                                try {
                                    await adminAPI.createTask(taskForm);
                                    toast.success('Work added to pool successfully');
                                    setShowTaskModal(false);
                                    refetch();
                                    setTaskForm({
                                        title: '',
                                        description: '',
                                        department: '',
                                        priority: 'medium',
                                        assignedTo: '',
                                        dueDate: ''
                                    });
                                } catch (err) {
                                    toast.error(err.message || 'Error creating task');
                                }
                            }}>
                                <div className="modal-body py-4">
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold">
                                            <i className="fas fa-heading text-primary me-2"></i>Title *
                                        </label>
                                        <input type="text" className="form-control" required value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold">
                                            <i className="fas fa-align-left text-primary me-2"></i>Description *
                                        </label>
                                        <textarea className="form-control" rows="3" required value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} />
                                    </div>
                                    <div className="row g-3">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label small fw-bold">
                                                <i className="fas fa-building text-primary me-2"></i>Department *
                                            </label>
                                            <select className="form-select" required value={taskForm.department} onChange={e => setTaskForm({ ...taskForm, department: e.target.value, assignedTo: '' })}>
                                                <option value="">Select Department</option>
                                                <option value="Diary">Diary</option>
                                                <option value="Note Book">Note Book</option>
                                                <option value="Calendar">Calendar</option>
                                            </select>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label small fw-bold">
                                                <i className="fas fa-user-check text-primary me-2"></i>Assign Staff
                                            </label>
                                            <select 
                                                className="form-select" 
                                                value={taskForm.assignedTo} 
                                                onChange={e => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                                                disabled={!taskForm.department}
                                            >
                                                <option value="">{taskForm.department ? 'Select Staff' : 'Select Department First'}</option>
                                                {departmentStaff.map(staff => (
                                                    <option key={staff._id} value={staff._id}>
                                                        {staff.fullName} ({staff.staffId})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold">
                                                <i className="fas fa-exclamation-circle text-primary me-2"></i>Priority
                                            </label>
                                            <select className="form-select" value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>
                                                <option value="low">Low</option>
                                                <option value="medium">Medium</option>
                                                <option value="high">High</option>
                                                <option value="urgent">Urgent</option>
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold">
                                                <i className="fas fa-calendar-alt text-primary me-2"></i>Due Date *
                                            </label>
                                            <input type="date" className="form-control" required value={taskForm.dueDate} onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer border-0 pt-0">
                                    <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setShowTaskModal(false)}>Cancel</button>
                                    <button type="submit" className="btn-premium rounded-pill px-4">Create Work</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="row g-4 mb-5">
                {[
                    { label: 'Global Tasks', value: stats?.tasks?.total || 0, icon: 'fas fa-layer-group', color: 'primary', trend: 'Total Work' },
                    { label: 'Pending', value: stats?.tasks?.pending || 0, icon: 'fas fa-clock', color: 'warning', trend: 'To Start' },
                    { label: 'In Progress', value: stats?.tasks?.inProgress || 0, icon: 'fas fa-spinner', color: 'info', trend: 'Ongoing' },
                    { label: 'Completed', value: stats?.tasks?.completed || 0, icon: 'fas fa-check-circle', color: 'success', trend: 'Finished' }
                ].map((stat, i) => (
                    <div className="col-xl-3 col-md-6" key={i}>
                        <div className={`premium-card h-100 ${taskFilter === stat.label.toLowerCase().replace(' ', '_') ? 'border-primary' : ''}`} 
                             style={{ cursor: 'pointer' }}
                             onClick={() => setTaskFilter(stat.label.toLowerCase().replace(' ', '_') === 'global_tasks' ? 'all' : stat.label.toLowerCase().replace(' ', '_'))}>
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
                <div className="col-lg-7">
                    <div className="premium-card h-100">
                        <div className="d-flex align-items-center justify-content-between mb-4">
                            <h5 className="mb-0">
                                <i className="fas fa-project-diagram text-primary me-2"></i> Task Overview
                            </h5>
                            <div className="d-flex gap-2">
                                {['all', 'pending', 'in_progress', 'completed'].map((f) => (
                                    <button
                                        key={f}
                                        className={`btn btn-xs rounded-pill px-2 ${taskFilter === f ? 'btn-primary' : 'btn-light'}`}
                                        style={{ fontSize: '0.7rem' }}
                                        onClick={() => setTaskFilter(f)}
                                    >
                                        {f.replace('_', ' ').charAt(0).toUpperCase() + f.replace('_', ' ').slice(1)}
                                    </button>
                                ))}
                                <Link to="/tasks" className="btn btn-sm btn-link text-primary text-decoration-none p-0 ms-2">View All</Link>
                            </div>
                        </div>
                        <div className="table-responsive">
                            <table className="premium-table">
                                <thead>
                                    <tr>
                                        <th>Task ID</th>
                                        <th>Activity</th>
                                        <th>Assigned To</th>
                                        <th>Status</th>
                                        <th>Progress</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentActivities?.filter(a => taskFilter === 'all' || a.status === taskFilter).slice(0, 8).map((activity) => (
                                        <tr key={activity._id}>
                                            <td><span className="fw-bold small">{activity.workId || 'N/A'}</span></td>
                                            <td className="fw-500">{activity.title}</td>
                                            <td>{activity.assignedTo?.fullName || 'Unassigned'}</td>
                                            <td>
                                                <span className={`badge-premium badge-${(activity.status || 'pending').toLowerCase().replace(' ', '_')}`}>
                                                    {(activity.status || 'pending').replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center gap-2">
                                                    <div className="progress flex-grow-1" style={{ height: '4px', minWidth: '60px' }}>
                                                        <div
                                                            className="progress-bar bg-primary"
                                                            style={{ width: `${activity.progress || 0}%` }}
                                                        ></div>
                                                    </div>
                                                    <small className="extra-small text-muted">{activity.progress || 0}%</small>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!recentActivities || recentActivities.filter(a => taskFilter === 'all' || a.status === taskFilter).length === 0) && (
                                        <tr>
                                            <td colSpan="5" className="text-center py-4 text-muted small">No tasks found for this status</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Recent Users */}
                <div className="col-lg-5">
                    <div className="premium-card h-100">
                        <div className="d-flex align-items-center justify-content-between mb-4">
                            <h5 className="mb-0">
                                <i className="fas fa-user-plus text-primary me-2"></i> New Registrations
                            </h5>
                            <Link to="/admin/users" className="btn btn-sm btn-link text-primary text-decoration-none fw-bold">Manage Users</Link>
                        </div>
                        <div className="user-list">
                            {recentUsers?.slice(0, 5).map((user) => (
                                <div key={user._id} className="d-flex align-items-center justify-content-between p-3 mb-2 rounded-3 bg-light transition-all cursor-pointer hover-shadow">
                                    <div className="d-flex align-items-center gap-3">
                                        {user.profileImage ? (
                                            <img 
                                                src={`${IMAGE_BASE_URL}/${user.profileImage}`} 
                                                alt="" 
                                                className="rounded-circle border" 
                                                style={{ width: '40px', height: '40px', objectFit: 'cover' }} 
                                            />
                                        ) : (
                                            <div className="avatar bg-white text-primary fw-bold rounded-circle d-flex align-items-center justify-content-center border" style={{ width: '40px', height: '40px' }}>
                                                {user.fullName.charAt(0)}
                                            </div>
                                        )}
                                        <div>
                                            <h6 className="mb-0 small fw-bold">{user.fullName}</h6>
                                            <p className="mb-0 text-muted extra-small">{user.department} • {user.role}</p>
                                        </div>
                                    </div>
                                    <span className="small text-muted">{new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;