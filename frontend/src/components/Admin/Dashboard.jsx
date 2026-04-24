// frontend/src/components/Admin/Dashboard.jsx
import React from 'react';
import { useQuery } from 'react-query';
import { adminAPI, IMAGE_BASE_URL } from '../../services/api';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

// Custom plugin to show values on top of bars/points
const datalabelsPlugin = {
    id: 'datalabels',
    afterDatasetsDraw(chart) {
        const { ctx, data } = chart;
        ctx.save();
        data.datasets.forEach((dataset, i) => {
            const meta = chart.getDatasetMeta(i);
            if (meta.hidden) return;
            meta.data.forEach((element, index) => {
                const value = dataset.data[index];
                const label = data.labels[index];
                if (value === null || value === undefined) return;
                
                ctx.fillStyle = '#1e293b';
                ctx.font = 'bold 10px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                
                const { x, y } = element.tooltipPosition();
                if (chart.config.type === 'pie' || chart.config.type === 'doughnut') {
                    ctx.fillText(`${label}: ${value}`, x, y);
                } else {
                    ctx.fillText(value, x, y - 5);
                }
            });
        });
        ctx.restore();
    }
};

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [showTaskModal, setShowTaskModal] = React.useState(false);
    const [taskForm, setTaskForm] = React.useState({
        title: '',
        description: '',
        department: '',
        priority: 'medium',
        assignedTo: '',
        dueDate: ''
    });

    const [performanceReport, setPerformanceReport] = React.useState(null);
    const [isGeneratingReport, setIsGeneratingReport] = React.useState(false);

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
            refetchInterval: 30000,
            refetchOnWindowFocus: true
        }
    );

    const { data: adminAnalytics, isLoading: analyticsLoading } = useQuery(
        ['adminAnalytics'],
        () => adminAPI.getAnalytics(),
        {
            refetchInterval: 30000,
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

    const handlePrintReport = async () => {
        try {
            setIsGeneratingReport(true);
            const response = await adminAPI.getStaffPerformanceReport();
            if (response.success) {
                setPerformanceReport(response.report);
                // Small delay to ensure state is updated before print dialog opens
                setTimeout(() => {
                    window.print();
                    setIsGeneratingReport(false);
                }, 500);
            } else {
                toast.error('Failed to generate report');
                setIsGeneratingReport(false);
            }
        } catch (error) {
            console.error('Error fetching performance report:', error);
            toast.error('Error generating report');
            setIsGeneratingReport(false);
        }
    };

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
            <div className="d-flex align-items-center justify-content-between mb-4 no-print">
                <div>
                    <h2 className="mb-0">System Overview</h2>
                    <p className="text-muted mb-0">Total system performance and user activity</p>
                </div>
                <div className="d-flex gap-2">
                    <button className="btn btn-primary py-2 px-4 shadow-sm rounded-pill" onClick={() => setShowTaskModal(true)}>
                        <i className="fas fa-plus-circle me-2"></i> Add Work
                    </button>
                    <button 
                        className="btn-premium rounded-circle shadow-sm d-flex align-items-center justify-content-center" 
                        style={{ width: '42px', height: '42px', padding: 0 }} 
                        onClick={handlePrintReport}
                        disabled={isGeneratingReport}
                        title="Print Staff Performance Report"
                    >
                        {isGeneratingReport ? (
                            <span className="spinner-border spinner-border-sm" role="status"></span>
                        ) : (
                            <i className="fas fa-print"></i>
                        )}
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
            <div className="row g-4 mb-4 no-print">
                {[
                    { label: 'Global Tasks', value: stats?.tasks?.total || 0, icon: 'fas fa-layer-group', color: 'primary', trend: 'Total Work' },
                    { label: 'Pending', value: stats?.tasks?.pending || 0, icon: 'fas fa-clock', color: 'warning', trend: 'To Start' },
                    { label: 'In Progress', value: stats?.tasks?.inProgress || 0, icon: 'fas fa-spinner', color: 'info', trend: 'Ongoing' },
                    { label: 'Completed', value: stats?.tasks?.completed || 0, icon: 'fas fa-check-circle', color: 'success', trend: 'Finished' }
                ].map((stat, i) => (
                    <div className="col-xl-3 col-md-6" key={i}>
                        <div className={`premium-card h-100 ${taskFilter === stat.label.toLowerCase().replace(' ', '_') ? 'border-primary' : ''}`} 
                             style={{ cursor: 'pointer' }}
                             onClick={() => {
                                 const status = stat.label.toLowerCase().replace(' ', '_') === 'global_tasks' ? 'all' : stat.label.toLowerCase().replace(' ', '_');
                                 navigate(`/tasks?status=${status}`);
                             }}>
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

            {/* Strategic Insights (Graphs) */}
            <div className="row g-4 mb-4 no-print">
                <div className="col-lg-8">
                    <div className="premium-card h-100">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h5 className="mb-0 small text-uppercase fw-bold text-muted ls-1">Department Performance Index</h5>
                            <Link to="/reports" className="btn btn-sm btn-link text-primary text-decoration-none small">Detailed Analytics <i className="fas fa-chevron-right ms-1"></i></Link>
                        </div>
                        <div style={{ height: '300px' }}>
                            {analyticsLoading ? (
                                <div className="h-100 d-flex align-items-center justify-content-center">
                                    <div className="spinner-border text-primary-light"></div>
                                </div>
                            ) : (
                                <Bar 
                                    data={{
                                        labels: adminAnalytics?.analytics?.departmentPerformance?.map(d => d.department) || [],
                                        datasets: [{
                                            label: 'On-Time Delivery Rate %',
                                            data: adminAnalytics?.analytics?.departmentPerformance?.map(d => Math.round(d.onTimeRate)) || [],
                                            backgroundColor: '#4361ee',
                                            borderRadius: 8
                                        }]
                                    }} 
                                    options={{ 
                                        maintainAspectRatio: false,
                                        plugins: { 
                                            legend: { display: false },
                                            datalabels: {}
                                        },
                                        scales: { 
                                            y: { 
                                                beginAtZero: true, 
                                                max: 100,
                                                title: { display: true, text: 'OTD Index (%)', font: { size: 10 } }
                                            } 
                                        }
                                    }} 
                                    plugins={[datalabelsPlugin]}
                                />
                            )}
                        </div>
                    </div>
                </div>
                <div className="col-lg-4">
                    <div className="premium-card h-100">
                        <h5 className="mb-4 small text-uppercase fw-bold text-muted ls-1">Global Status Mix</h5>
                        <div style={{ height: '300px' }}>
                            {analyticsLoading ? (
                                <div className="h-100 d-flex align-items-center justify-content-center">
                                    <div className="spinner-border text-primary-light"></div>
                                </div>
                            ) : (
                                <Pie 
                                    data={{
                                        labels: adminAnalytics?.analytics?.taskStatusDistribution?.map(s => s._id?.toUpperCase()) || [],
                                        datasets: [{
                                            data: adminAnalytics?.analytics?.taskStatusDistribution?.map(s => s.count) || [],
                                            backgroundColor: ['#4361ee', '#06d6a0', '#4cc9f0', '#ffd166', '#ef476f'],
                                            borderWidth: 0
                                        }]
                                    }} 
                                    options={{ 
                                        maintainAspectRatio: false,
                                        plugins: { 
                                            legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } },
                                            datalabels: {}
                                        }
                                    }} 
                                    plugins={[datalabelsPlugin]}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-4 mb-5 no-print">
                <div className="col-lg-8">
                    <div className="premium-card h-100">
                        <h5 className="mb-4 small text-uppercase fw-bold text-muted ls-1">Completion Trend (Last 30 Days)</h5>
                        <div style={{ height: '300px' }}>
                            {analyticsLoading ? (
                                <div className="h-100 d-flex align-items-center justify-content-center">
                                    <div className="spinner-border text-primary-light"></div>
                                </div>
                            ) : (
                                <Line 
                                    data={{
                                        labels: adminAnalytics?.analytics?.completionTrend?.map(t => t._id) || [],
                                        datasets: [{
                                            label: 'Completed Tasks',
                                            data: adminAnalytics?.analytics?.completionTrend?.map(t => t.count) || [],
                                            borderColor: '#06d6a0',
                                            backgroundColor: 'rgba(6, 214, 160, 0.1)',
                                            fill: true,
                                            tension: 0.4
                                        }]
                                    }} 
                                    options={{ 
                                        maintainAspectRatio: false,
                                        plugins: { 
                                            legend: { display: false },
                                            datalabels: {}
                                        },
                                        scales: { 
                                            y: { 
                                                beginAtZero: true, 
                                                ticks: { stepSize: 1 }
                                            } 
                                        }
                                    }} 
                                    plugins={[datalabelsPlugin]}
                                />
                            )}
                        </div>
                    </div>
                </div>
                <div className="col-lg-4">
                    <div className="premium-card h-100">
                        <h5 className="mb-4 small text-uppercase fw-bold text-muted ls-1">Workload Priority Heatmap</h5>
                        <div style={{ height: '300px' }}>
                            {analyticsLoading ? (
                                <div className="h-100 d-flex align-items-center justify-content-center">
                                    <div className="spinner-border text-primary-light"></div>
                                </div>
                            ) : (
                                <Doughnut 
                                    data={{
                                        labels: adminAnalytics?.analytics?.priorityDistribution?.map(p => p._id?.toUpperCase()) || [],
                                        datasets: [{
                                            data: adminAnalytics?.analytics?.priorityDistribution?.map(p => p.count) || [],
                                            backgroundColor: ['#ef476f', '#f77f00', '#ffd166', '#118ab2'],
                                            borderWidth: 0,
                                            cutout: '75%'
                                        }]
                                    }} 
                                    options={{ 
                                        maintainAspectRatio: false,
                                        plugins: { 
                                            legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } },
                                            datalabels: {}
                                        }
                                    }} 
                                    plugins={[datalabelsPlugin]}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-4 no-print">
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
                                        <th className="text-end">Action</th>
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
                                            <td className="text-end">
                                                <Link to={`/tasks/${activity._id}`} className="btn-icon bg-light text-primary mx-auto" title="View Details">
                                                    <i className="fas fa-eye"></i>
                                                </Link>
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

        {/* Staff Performance printable Report */}
        {performanceReport && (
            <div className="print-only">
                <div className="print-report-header">
                    <h2 className="fw-bold text-uppercase mb-1">Staff Performance Audit Report</h2>
                    <p className="text-muted small">Generated on: {new Date().toLocaleString()}</p>
                    <div className="d-flex justify-content-between mt-3 px-4">
                        <p><strong>Entity:</strong> Admin Dashboard</p>
                        <p><strong>Classification:</strong> Internal Operations</p>
                    </div>
                </div>

                {performanceReport.map((deptData, idx) => (
                    <div key={idx} className="mb-5">
                        <h5 className="border-bottom pb-2 mb-3">Department: {deptData._id}</h5>
                        <table className="print-table">
                            <thead>
                                <tr>
                                    <th>Staff Name</th>
                                    <th>Staff ID</th>
                                    <th className="text-center">Finished</th>
                                    <th className="text-center">Incomplete</th>
                                    <th className="text-center">Delay</th>
                                    <th className="text-center">Success Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {deptData.staffMembers.map((staff, sIdx) => {
                                    const total = staff.finished + staff.incomplete;
                                    const successRate = total > 0 ? Math.round((staff.finished / total) * 100) : 0;
                                    return (
                                        <tr key={sIdx}>
                                            <td><strong>{staff.name}</strong></td>
                                            <td>{staff.staffId || 'N/A'}</td>
                                            <td className="text-center text-success">{staff.finished}</td>
                                            <td className="text-center">{staff.incomplete}</td>
                                            <td className="text-center text-danger">{staff.delayed}</td>
                                            <td className="text-center">
                                                <span className={`fw-bold ${successRate >= 80 ? 'text-success' : successRate >= 50 ? 'text-warning' : 'text-danger'}`}>
                                                    {successRate}%
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ))}

                <div className="signature-area mt-5">
                    <div className="sig-box">
                        <p className="small mb-0">Authorized Admin Signature</p>
                    </div>
                    <div className="sig-box">
                        <p className="small mb-0">System Timestamp Verification</p>
                    </div>
                </div>
            </div>
        )}
    </div>
);
};

export default AdminDashboard;
