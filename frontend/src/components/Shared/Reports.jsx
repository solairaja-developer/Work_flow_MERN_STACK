// src/components/Shared/Reports.jsx
import React from 'react';
import { useQuery } from 'react-query';
import { adminAPI, managerAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const Reports = () => {
    const { user } = useAuth();

    const [selectedStaffId, setSelectedStaffId] = React.useState('');

    // Fetch data based on role
    const { data: adminStats, isLoading: adminLoading } = useQuery(
        ['adminReports'],
        adminAPI.getDashboardStats,
        { enabled: user?.role === 'admin' }
    );

    const { data: userData } = useQuery(
        ['allUsers'],
        () => adminAPI.getUsers(),
        { enabled: user?.role === 'admin' }
    );

    const { data: managerData, isLoading: managerLoading } = useQuery(
        ['managerReports'],
        managerAPI.getDashboard,
        { enabled: user?.role === 'manager' }
    );

    const { data: staffPerformance, isLoading: staffLoading } = useQuery(
        ['staffPerformance', selectedStaffId],
        () => (user?.role === 'admin' ? adminAPI.getStaffPerformance(selectedStaffId) : managerAPI.getStaffPerformance(selectedStaffId)),
        { enabled: !!selectedStaffId }
    );

    const isLoading = adminLoading || managerLoading || staffLoading;

    if (isLoading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;

    const stats = user?.role === 'admin' ? adminStats?.stats : managerData?.dashboard?.stats;

    return (
        <div className="container-fluid py-2">
            <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                    <h2 className="mb-0">Analytics & Reports</h2>
                    <p className="text-muted mb-0">Detailed statistical overview of {user?.role === 'admin' ? 'the entire system' : 'your department'}</p>
                </div>
                <div className="d-flex gap-3 align-items-center">
                    <select 
                        className="form-select border-0 shadow-sm rounded-pill px-4" 
                        style={{ width: '250px' }}
                        value={selectedStaffId}
                        onChange={(e) => setSelectedStaffId(e.target.value)}
                    >
                        <option value="">Full {user?.role === 'admin' ? 'System' : 'Department'} View</option>
                        {(user?.role === 'admin' ? (userData?.users || []) : (managerData?.dashboard?.teamMembers || [])).map(staff => (
                            <option key={staff?._id} value={staff?._id}>
                                {staff?.fullName} ({staff?.staffId || 'Staff'})
                            </option>
                        ))}
                    </select>
                    <button className="btn-premium py-2 px-4 shadow-sm" onClick={() => window.print()}>
                        <i className="fas fa-download"></i> Download PDF
                    </button>
                </div>
            </div>

            {selectedStaffId && staffPerformance ? (
                <div className="row g-4 mb-5">
                    <ReportCard label="Total Tasks" value={staffPerformance.performance?.totalTasks} icon="fas fa-tasks" color="primary" />
                    <ReportCard label="Completed" value={staffPerformance.performance?.completedTasks} icon="fas fa-check-circle" color="success" />
                    <ReportCard label="On-Time Rate" value={`${staffPerformance.performance?.onTimeRate || 0}%`} icon="fas fa-bolt" color="warning" />
                    <ReportCard label="Efficiency" value={`${staffPerformance.performance?.completionRate || 0}%`} icon="fas fa-chart-line" color="info" />
                </div>
            ) : (
                <div className="row g-4 mb-5">
                    {user?.role === 'admin' ? (
                        <>
                            <ReportCard label="Total Users" value={stats?.users?.total} icon="fas fa-users" color="primary" />
                            <ReportCard label="Global Tasks" value={stats?.tasks?.total} icon="fas fa-project-diagram" color="info" />
                            <ReportCard label="Active Sessions" value="24" icon="fas fa-signal" color="success" />
                            <ReportCard label="Department Count" value="3" icon="fas fa-building" color="warning" />
                        </>
                    ) : (
                        <>
                            <ReportCard label="Team Size" value={stats?.teamSize} icon="fas fa-users" color="primary" />
                            <ReportCard label="Department Tasks" value={stats?.totalTasks} icon="fas fa-tasks" color="info" />
                            <ReportCard label="Completed (%)" value={`${stats?.completionRate}%`} icon="fas fa-check-circle" color="success" />
                            <ReportCard label="Overdue" value={stats?.overdueTasks} icon="fas fa-exclamation-triangle" color="danger" />
                        </>
                    )}
                </div>
            )}

            <div className="row g-4 mb-5">
                <div className="col-lg-8">
                    <div className="premium-card h-100">
                        <h5 className="mb-4">
                            {selectedStaffId 
                                ? `Activity Log: ${(user?.role === 'admin' ? (userData?.users || []) : (managerData?.dashboard?.teamMembers || []))?.find(m => m._id === selectedStaffId)?.fullName}` 
                                : 'Performance Trends'}
                        </h5>
                        {selectedStaffId && staffPerformance?.performance?.recentActivity ? (
                            <div className="table-responsive">
                                <table className="premium-table">
                                    <thead>
                                        <tr>
                                            <th>Task</th>
                                            <th>Status</th>
                                            <th>Progress</th>
                                            <th>Updated</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {staffPerformance.performance.recentActivity.map(task => (
                                            <tr key={task._id}>
                                                <td className="fw-bold">{task.title}</td>
                                                <td>
                                                    <span className={`badge-premium badge-${task.status.replace(' ', '_')}`}>
                                                        {task.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <div className="progress flex-grow-1" style={{ height: '6px' }}><div className="progress-bar bg-primary" style={{ width: `${task.progress}%` }}></div></div>
                                                        <small>{task.progress}%</small>
                                                    </div>
                                                </td>
                                                <td>{new Date(task.updatedAt).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : user?.role === 'manager' && managerData?.dashboard?.teamMembers ? (
                            <div className="table-responsive">
                                <table className="premium-table">
                                    <thead>
                                        <tr>
                                            <th>Staff Name</th>
                                            <th>Completed</th>
                                            <th>Pending</th>
                                            <th>Efficiency</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {managerData.dashboard.teamMembers.map(member => (
                                            <tr key={member._id}>
                                                <td className="fw-bold">{member.fullName}</td>
                                                <td><span className="text-success">{member.taskStats?.completed || 0}</span></td>
                                                <td><span className="text-warning">{member.taskStats?.pending || 0}</span></td>
                                                <td>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <div className="progress flex-grow-1" style={{ height: '6px' }}><div className="progress-bar bg-success" style={{ width: `${(member.taskStats?.completed / (member.taskStats?.total || 1)) * 100}%` }}></div></div>
                                                        <small>{Math.round((member.taskStats?.completed / (member.taskStats?.total || 1)) * 100)}%</small>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-5 text-center bg-light rounded-4">
                                <i className="fas fa-chart-line fa-4x text-muted mb-3 opacity-25"></i>
                                <p className="text-muted">Visual charts (Chart.js) will be integrated here for daily/monthly trends.</p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="col-lg-4">
                    <div className="premium-card h-100">
                        <h5 className="mb-4">Quick Insights</h5>
                        <div className="list-group list-group-flush">
                            <div className="list-group-item bg-transparent px-0 border-0 mb-3">
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="small fw-bold">Task Completion</span>
                                    <span className="small text-primary fw-bold">85%</span>
                                </div>
                                <div className="progress" style={{ height: '6px' }}><div className="progress-bar" style={{ width: '85%' }}></div></div>
                            </div>
                            <div className="list-group-item bg-transparent px-0 border-0 mb-3">
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="small fw-bold">Team Efficiency</span>
                                    <span className="small text-success fw-bold">92%</span>
                                </div>
                                <div className="progress" style={{ height: '6px' }}><div className="progress-bar bg-success" style={{ width: '92%' }}></div></div>
                            </div>
                            <div className="list-group-item bg-transparent px-0 border-0 mb-3">
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="small fw-bold">Server Uptime</span>
                                    <span className="small text-info fw-bold">99.9%</span>
                                </div>
                                <div className="progress" style={{ height: '6px' }}><div className="progress-bar bg-info" style={{ width: '99%' }}></div></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ReportCard = ({ label, value, icon, color }) => (
    <div className="col-xl-3 col-md-6">
        <div className="premium-card border-top border-4" style={{ borderColor: `var(--bs-${color}) !important` }}>
            <div className="d-flex justify-content-between align-items-center">
                <div>
                    <h3 className="mb-1 fw-bold">{value || 0}</h3>
                    <p className="text-muted mb-0 small text-uppercase fw-bold">{label}</p>
                </div>
                <div className={`btn-icon rounded-circle bg-${color} text-white`}>
                    <i className={icon}></i>
                </div>
            </div>
        </div>
    </div>
);

export default Reports;
