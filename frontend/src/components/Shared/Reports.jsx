// src/components/Shared/Reports.jsx
import React from 'react';
import { useQuery } from 'react-query';
import { adminAPI, managerAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement,
    LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement, 
    BarElement, ArcElement, Title, Tooltip, Legend, Filler
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
                
                // For Pie/Doughnut charts, show Label: Value
                if (chart.config.type === 'pie' || chart.config.type === 'doughnut') {
                    ctx.fillText(`${label}: ${value}`, x, y);
                } else if (data.datasets.length > 1) {
                    // For multi-dataset bar/line charts, show Value only to avoid clutter
                    ctx.fillText(value, x, y - 5);
                } else {
                    // For single dataset charts, show Value
                    ctx.fillText(value, x, y - 5);
                }
            });
        });
        ctx.restore();
    }
};

const Reports = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const [selectedDept, setSelectedDept] = React.useState('');
    const [dateRange, setDateRange] = React.useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    // Queries
    const { data: adminAnalytics, isLoading: aAnalyticsLoading } = useQuery(
        ['adminAnalytics', dateRange, selectedDept],
        () => adminAPI.getAnalytics({ ...dateRange, department: selectedDept }),
        { enabled: isAdmin, refetchInterval: 60000 }
    );

    const { data: managerAnalytics, isLoading: mAnalyticsLoading } = useQuery(
        ['managerAnalytics', dateRange],
        () => managerAPI.getAnalytics(dateRange),
        { enabled: user?.role === 'manager', refetchInterval: 60000 }
    );

    const { data: detailedReport, isLoading: detailLoading } = useQuery(
        ['detailedReport', dateRange, selectedDept],
        () => managerAPI.getDetailedReport({ ...dateRange, department: selectedDept }),
        { enabled: true } // Support both admin and manager
    );

    const { data: dashboardStats } = useQuery(
        ['dashboardStats'],
        isAdmin ? adminAPI.getDashboardStats : managerAPI.getDashboard
    );

    const isLoading = aAnalyticsLoading || mAnalyticsLoading || detailLoading;

    if (isLoading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;

    const data = isAdmin ? adminAnalytics?.analytics : managerAnalytics?.analytics;
    const summary = data?.summary;
    const stats = isAdmin ? dashboardStats?.stats : dashboardStats?.dashboard?.stats;

    // --- Chart Data ---
    const trendData = {
        labels: data?.trend?.map(t => t._id) || data?.completionTrend?.map(t => t._id) || [],
        datasets: [{
            label: `Task Completion Velocity ${selectedDept ? `(${selectedDept})` : ''}`,
            data: data?.trend?.map(t => t.completed) || data?.completionTrend?.map(t => t.count) || [],
            borderColor: '#4361ee',
            backgroundColor: 'rgba(67, 97, 238, 0.1)',
            fill: true,
            tension: 0.4
        }]
    };

    const deptPerfData = {
        labels: data?.departmentPerformance?.map(d => d.department) || [],
        datasets: [
            {
                label: 'On-Time Delivery %',
                data: data?.departmentPerformance?.map(d => Math.round(d.onTimeRate)) || [],
                backgroundColor: '#06d6a0',
                borderRadius: 6
            },
            {
                label: 'Avg Lead Time (Days)',
                data: data?.departmentPerformance?.map(d => d.avgLeadTime) || [],
                backgroundColor: '#4cc9f0',
                borderRadius: 6
            }
        ]
    };

    const statusData = {
        labels: data?.taskStatusDistribution?.map(s => s._id.toUpperCase()) || data?.categories?.map(c => c._id.toUpperCase()) || [],
        datasets: [{
            data: data?.taskStatusDistribution?.map(s => s.count) || data?.categories?.map(c => c.count) || [],
            backgroundColor: ['#4361ee', '#06d6a0', '#ffd166', '#ef476f', '#4cc9f0'],
            borderWidth: 0
        }]
    };

    return (
        <div className="container-fluid py-4 report-container">
            {/* Professional Header */}
            <div className="d-flex align-items-center justify-content-between mb-4 no-print">
                <div>
                    <h2 className="fw-bold text-dark mb-1">
                        {isAdmin ? 'Corporate Performance Intelligence' : 'Departmental Operations Report'}
                    </h2>
                    <p className="text-muted small">Period: {dateRange.startDate} to {dateRange.endDate} {isAdmin && selectedDept && `| Unit: ${selectedDept}`}</p>
                </div>
                <div className="d-flex gap-3 align-items-center">
                    {isAdmin && (
                        <div className="d-flex align-items-center gap-2 bg-white rounded-pill px-3 shadow-sm border py-2">
                             <i className="fas fa-building text-primary small"></i>
                             <select 
                                className="border-0 small fw-bold text-dark" 
                                style={{ outline: 'none', background: 'transparent' }}
                                value={selectedDept}
                                onChange={(e) => setSelectedDept(e.target.value)}
                             >
                                <option value="">All Departments</option>
                                <option value="Diary">Diary</option>
                                <option value="Note Book">Note Book</option>
                                <option value="Calendar">Calendar</option>
                             </select>
                        </div>
                    )}
                    <div className="d-flex align-items-center gap-2 bg-white rounded-pill px-4 shadow-sm border py-2">
                        <i className="fas fa-calendar-alt text-primary small"></i>
                        <input type="date" className="border-0 small fw-bold" value={dateRange.startDate} onChange={e => setDateRange({...dateRange, startDate: e.target.value})} />
                        <span className="text-muted">→</span>
                        <input type="date" className="border-0 small fw-bold" value={dateRange.endDate} onChange={e => setDateRange({...dateRange, endDate: e.target.value})} />
                    </div>
                    <button className="btn-premium rounded-circle shadow-sm d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px', padding: 0 }} onClick={() => window.print()} title="Print Report">
                        <i className="fas fa-print"></i>
                    </button>
                </div>
            </div>

            {/* Executive Summary Cards */}
            <div className="row g-4 mb-5 no-print">
                <MetricCard 
                    label="Operations Efficiency" 
                    value={isAdmin ? `${Math.round(data?.departmentPerformance?.reduce((acc, curr) => acc + curr.onTimeRate, 0) / data?.departmentPerformance?.length || 0)}%` : `${Math.round((summary?.onTime / (summary?.total || 1)) * 100)}%`}
                    subtext="On-Time Delivery Rate"
                    icon="fas fa-tachometer-alt"
                    color="primary"
                />
                <MetricCard 
                    label="Completion Volume" 
                    value={isAdmin ? data?.completionTrend?.reduce((acc, curr) => acc + curr.count, 0) : summary?.total}
                    subtext="Units Completed in Period"
                    icon="fas fa-check-double"
                    color="success"
                />
                <MetricCard 
                    label="System Latency" 
                    value={isAdmin ? `${(data?.departmentPerformance?.reduce((acc, curr) => acc + curr.avgLeadTime, 0) / data?.departmentPerformance?.length || 0).toFixed(1)}d` : `${summary?.avgLeadTime}d`}
                    subtext="Average Lead Time"
                    icon="fas fa-hourglass-half"
                    color="info"
                />
                <MetricCard 
                    label="Critical Risks" 
                    value={isAdmin ? data?.departmentPerformance?.reduce((acc, curr) => acc + curr.overdue, 0) : summary?.delayed}
                    subtext="Delayed/Overdue Tasks"
                    icon="fas fa-exclamation-triangle"
                    color="danger"
                />
            </div>

            {/* Analytic Graphs */}
            <div className="row g-4 mb-5 no-print">
                <div className="col-lg-8">
                    <div className="premium-card h-100">
                        <h6 className="fw-bold text-muted mb-4 ls-1">OPERATIONAL VELOCITY TREND</h6>
                        <div style={{ height: '300px' }}>
                            <Line data={trendData} options={{ 
                                maintainAspectRatio: false, 
                                plugins: { 
                                    legend: { display: true, position: 'top' },
                                    datalabels: {} 
                                } 
                            }} plugins={[datalabelsPlugin]} />
                        </div>
                    </div>
                </div>
                <div className="col-lg-4">
                    <div className="premium-card h-100">
                        <h6 className="fw-bold text-muted mb-4 ls-1">WORKLOAD DISTRIBUTION</h6>
                        <div style={{ height: '300px' }}>
                            <Pie data={statusData} options={{ 
                                maintainAspectRatio: false, 
                                plugins: { 
                                    legend: { position: 'bottom' },
                                    datalabels: {}
                                } 
                            }} plugins={[datalabelsPlugin]} />
                        </div>
                    </div>
                </div>
                {isAdmin && (
                    <div className="col-12">
                        <div className="premium-card">
                            <h6 className="fw-bold text-muted mb-4 ls-1">DEPARTMENTAL EFFICIENCY AUDIT</h6>
                            <div style={{ height: '350px' }}>
                                <Bar data={deptPerfData} options={{ 
                                    maintainAspectRatio: false,
                                    scales: { y: { beginAtZero: true } },
                                    plugins: {
                                        legend: { display: true, position: 'top' },
                                        datalabels: {}
                                    }
                                }} plugins={[datalabelsPlugin]} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Performance Audit Table */}
            <div className="row g-4 no-print">
                <div className="col-12">
                    <div className="premium-card border-0 shadow-sm">
                        <h6 className="fw-bold text-muted mb-4 ls-1">
                            {isAdmin ? 'ORGANIZATIONAL DIVISION AUDIT' : 'STAFF PERFORMANCE LEADERBOARD'}
                        </h6>
                        <div className="table-responsive">
                            <table className="table align-middle table-hover">
                                <thead className="bg-light">
                                    <tr className="extra-small text-muted text-uppercase">
                                        <th className="ps-4 py-3">{isAdmin ? 'Division' : 'Exectuion Lead'}</th>
                                        <th className="py-3">Completed Work</th>
                                        <th className="py-3">Efficiency Index</th>
                                        <th className="py-3 pe-4 text-end">Operational Health</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(isAdmin ? data?.departmentPerformance : data?.performance)?.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="ps-4 py-3">
                                                <div className="fw-bold text-dark">{isAdmin ? item.department : item.name}</div>
                                            </td>
                                            <td>
                                                <span className="badge rounded-pill bg-light text-dark border px-3">
                                                    {isAdmin ? item.completed : item.completed} Units
                                                </span>
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center gap-2">
                                                    <div className="progress flex-grow-1" style={{ height: '6px', width: '100px' }}>
                                                        <div 
                                                            className={`progress-bar bg-${(isAdmin ? item.onTimeRate : item.onTimeRate) > 80 ? 'success' : 'warning'}`} 
                                                            style={{ width: `${isAdmin ? item.onTimeRate : item.onTimeRate}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="small fw-bold">
                                                        {Math.round(isAdmin ? item.onTimeRate : item.onTimeRate)}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="pe-4 py-3 text-end">
                                                {isAdmin ? (
                                                    <div className="d-flex flex-column align-items-end">
                                                        {item.total === 0 ? (
                                                            <span className="badge bg-light text-muted border px-3 rounded-pill">No Active Load</span>
                                                        ) : item.overdue > 0 ? (
                                                            <span className="badge bg-danger-light text-danger px-3 rounded-pill border-danger border-opacity-25 border">Critical: {item.overdue} Delayed</span>
                                                        ) : (item.completed === 0 || item.onTimeRate >= 80) ? (
                                                            <span className="badge bg-success-light text-success px-3 rounded-pill">Healthy</span>
                                                        ) : (
                                                            <span className="badge bg-warning-light text-warning px-3 rounded-pill">At Risk</span>
                                                        )}
                                                        {item.total > 0 && (
                                                            <small className="extra-small text-muted mt-1 fw-bold">
                                                                {item.avgLeadTime}d Avg Velocity
                                                            </small>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="badge bg-primary-light text-primary px-3 rounded-pill">Top Performer</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* CORPORATE PRINT RECORD - Professional Layout */}
            <div className="print-only">
                <div className="text-center mb-5">
                    <div className="row text-start mb-4">
                        <div className="col-6">
                            <p className="mb-1"><strong>Generating Entity:</strong> Organization Management System</p>
                            <p className="mb-1"><strong>Report Classification:</strong> Internal/Confidential</p>
                            <p className="mb-1"><strong>Auditor:</strong> {user.fullName} ({user.role})</p>
                        </div>
                        <div className="col-6 text-end">
                            <p className="mb-1"><strong>Record Date:</strong> {new Date().toLocaleDateString()}</p>
                            <p className="mb-1"><strong>Department:</strong> {isAdmin ? (selectedDept || 'GLOBAL') : (user.department || 'GENERAL')}</p>
                        </div>
                    </div>
                </div>

                <h5 className="fw-bold text-uppercase bg-light p-2 mb-3">
                    {selectedDept ? `${selectedDept} - Detailed Task Execution Ledger` : 'Full Organizational Task Execution Ledger'}
                </h5>
                <table className="table table-bordered table-sm extra-small">
                    <thead>
                        <tr className="bg-light">
                            <th>Record ID</th>
                            <th>Description</th>
                            <th>Lead Entity</th>
                            <th>Creation Date</th>
                            <th>Finalization</th>
                            <th>Performance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {detailedReport?.report?.tasks?.map((task, idx) => (
                          <tr key={idx}>
                              <td>{task.workId}</td>
                              <td>{task.title}</td>
                              <td>{task.assignedTo?.fullName}</td>
                              <td>{new Date(task.createdAt).toLocaleDateString()}</td>
                              <td>{task.completedDate ? new Date(task.completedDate).toLocaleDateString() : 'N/A'}</td>
                              <td className={task.isOnTime ? 'text-success fw-bold' : 'text-danger'}>
                                  {task.status === 'completed' ? (task.isOnTime ? 'ON-TIME' : 'DELAYED') : 'PENDING'}
                              </td>
                          </tr>
                        ))}
                    </tbody>
                </table>

                <div className="row mt-5 pt-5">
                    <div className="col-6">
                        <div className="border-top pt-2" style={{ width: '200px' }}>
                            <p className="small mb-0">Authorized Signatory</p>
                            <p className="extra-small text-muted">Department Head / Admin</p>
                        </div>
                    </div>
                    <div className="col-6 text-end">
                        <div className="border-top pt-2 ms-auto" style={{ width: '200px' }}>
                            <p className="small mb-0">Record Custodian</p>
                            <p className="extra-small text-muted">System Generated Timestamp</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MetricCard = ({ label, value, subtext, icon, color }) => (
    <div className="col-xl-3 col-md-6">
        <div className="premium-card h-100 border-start border-4 transition-all hover-shadow" style={{ borderColor: `var(--bs-${color}) !important` }}>
            <div className="d-flex justify-content-between align-items-start">
                <div>
                    <p className="extra-small text-uppercase fw-bold text-muted mb-1 ls-1">{label}</p>
                    <h2 className="fw-bold mb-1">{value}</h2>
                    <p className="extra-small text-muted mb-0">{subtext}</p>
                </div>
                <div className={`btn-icon rounded-circle bg-${color}-light text-${color} shadow-sm`}>
                    <i className={`${icon} fa-lg`}></i>
                </div>
            </div>
        </div>
    </div>
);

export default Reports;
