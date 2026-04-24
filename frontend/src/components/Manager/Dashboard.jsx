// frontend/src/components/Manager/Dashboard.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { managerAPI, authAPI, IMAGE_BASE_URL } from '../../services/api';
import { Link, useNavigate } from 'react-router-dom';
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
import { Bar, Doughnut } from 'react-chartjs-2';

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

const ManagerDashboard = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [quickTask, setQuickTask] = useState({
        title: '',
        assignedTo: '',
        dueDate: '',
        priority: 'Medium'
    });
    const [taskFilter, setTaskFilter] = useState('all');

    const { data: dashboardData, isLoading } = useQuery(
        ['managerDashboard'],
        managerAPI.getDashboard,
        {
            refetchInterval: 15000, // Auto-refresh every 15 seconds
            refetchOnWindowFocus: true
        }
    );

    const { data: teamData } = useQuery(
        ['team'],
        () => managerAPI.getTeam(),
        {
            refetchInterval: 30000, // Refresh every 30 seconds
            refetchOnWindowFocus: true
        }
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
                    { label: 'Total Tasks', value: stats?.totalTasks || 0, icon: 'fas fa-tasks', color: 'primary', trend: 'Total Work' },
                    { label: 'Active Work', value: stats?.totalTasks - stats?.completedTasks || 0, icon: 'fas fa-spinner', color: 'success', trend: 'Ongoing' },
                    { label: 'Completed', value: stats?.completedTasks || 0, icon: 'fas fa-check-circle', color: 'info', trend: 'Finished' },
                    { label: 'Pending', value: stats?.pendingTasks || 0, icon: 'fas fa-clock', color: 'warning', trend: 'To Start' }
                ].map((stat, i) => (
                    <div className="col-xl-3 col-md-6" key={i}>
                        <div className={`premium-card h-100 ${taskFilter === stat.label.toLowerCase().replace(' ', '_') ? 'border-primary' : ''}`}
                             style={{ cursor: 'pointer' }}
                             onClick={() => {
                                 const status = stat.label.toLowerCase().replace(' ', '_') === 'total_tasks' ? 'all' : stat.label.toLowerCase().replace(' ', '_') === 'active_work' ? 'in_progress' : stat.label.toLowerCase().replace(' ', '_');
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
            <div className="row g-4 mb-4">
                <div className="col-lg-8">
                    <div className="premium-card h-100">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h5 className="mb-0 small text-uppercase fw-bold text-muted ls-1">Team Member Workload</h5>
                        </div>
                        <div style={{ height: '300px' }}>
                            <Bar 
                                data={{
                                    labels: dashboardData?.dashboard?.teamPerformance?.map(p => p.fullName) || [],
                                    datasets: [
                                        {
                                            label: 'Completed Tasks',
                                            data: dashboardData?.dashboard?.teamPerformance?.map(p => p.completedTasks) || [],
                                            backgroundColor: '#06d6a0',
                                            borderRadius: 4
                                        },
                                        {
                                            label: 'Total Assigned',
                                            data: dashboardData?.dashboard?.teamPerformance?.map(p => p.totalTasks) || [],
                                            backgroundColor: '#4cc9f0',
                                            borderRadius: 4
                                        }
                                    ]
                                }} 
                                options={{ 
                                    maintainAspectRatio: false,
                                    plugins: { 
                                        legend: { position: 'top' },
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
                        </div>
                    </div>
                </div>
                <div className="col-lg-4">
                    <div className="premium-card h-100">
                        <h5 className="mb-4 small text-uppercase fw-bold text-muted ls-1">Department Task Status</h5>
                        <div style={{ height: '300px' }}>
                            <Doughnut 
                                data={{
                                    labels: ['Completed', 'In Progress', 'Pending'],
                                    datasets: [{
                                        data: [
                                            stats?.completedTasks || 0,
                                            stats?.inProgressTasks || 0,
                                            stats?.pendingTasks || 0
                                        ],
                                        backgroundColor: ['#06d6a0', '#4cc9f0', '#ffd166'],
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
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-4">
                {/* Recent Activities Table */}
                <div className="col-lg-8">
                    <div className="premium-card">
                        <div className="d-flex align-items-center justify-content-between mb-4">
                            <h5 className="mb-0">
                                <i className="fas fa-project-diagram text-primary me-2"></i> Task Overview
                            </h5>
                            <div className="d-flex gap-2 align-items-center">
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
                                        <th>Title</th>
                                        <th>Assigned To</th>
                                        <th>Status</th>
                                        <th>Progress</th>
                                        <th>Due Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentActivities?.filter(t => taskFilter === 'all' || t.status === taskFilter).slice(0, 8).map((task) => (
                                        <tr key={task._id}>
                                            <td><span className="fw-bold">{task.workId || `WF-${task._id.slice(-3).toUpperCase()}`}</span></td>
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
                                    {(!recentActivities || recentActivities.filter(t => taskFilter === 'all' || t.status === taskFilter).length === 0) && (
                                        <tr>
                                            <td colSpan="6" className="text-center py-4 text-muted small">No tasks found for this status</td>
                                        </tr>
                                    )}
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