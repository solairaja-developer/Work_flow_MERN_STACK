import React from 'react';
import { useQuery } from 'react-query';
import { staffAPI } from '../../services/api';
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
import { Doughnut, Line, Bar } from 'react-chartjs-2';

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

const StaffAnalytics = () => {
    const { data: analyticsData, isLoading } = useQuery(
        ['staffAnalytics'],
        staffAPI.getAnalytics,
        {
            refetchInterval: 60000,
            refetchOnWindowFocus: true
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

    const analytics = analyticsData?.analytics;
    const summary = analytics?.summary || { totalCompleted: 0, onTime: 0, delayed: 0, onTimeRate: 0 };
    const trend = analytics?.trend || [];
    const statusDistribution = analytics?.statusDistribution || [];
    const priorityDistribution = analytics?.priorityDistribution || [];

    // Helper to extract specifically required data
    const getStatusCount = (statusName) => {
        const item = statusDistribution.find(s => s._id === statusName);
        return item ? item.count : 0;
    };

    return (
        <div className="container-fluid py-2">
            <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                    <h2 className="mb-0">My Analytics</h2>
                    <p className="text-muted mb-0">Deep dive into your personal performance data</p>
                </div>
                <div className="d-flex gap-2">
                    <button className="btn-icon bg-white shadow-sm">
                        <i className="fas fa-download"></i>
                    </button>
                    <button className="btn-icon bg-white shadow-sm">
                        <i className="fas fa-filter"></i>
                    </button>
                </div>
            </div>

            {/* Top Level KPIs */}
            <div className="row g-4 mb-4">
                {[
                    { label: 'On-Time Rate', value: `${summary.onTimeRate}%`, icon: 'fas fa-stopwatch', color: 'primary', info: 'Tasks finished before deadline' },
                    { label: 'Total Completed', value: summary.totalCompleted, icon: 'fas fa-check-double', color: 'success', info: 'Last 30 days' },
                    { label: 'Active Tasks', value: getStatusCount('in_progress'), icon: 'fas fa-spinner', color: 'info', info: 'Currently in progress' },
                    { label: 'Pending', value: getStatusCount('pending'), icon: 'fas fa-pause-circle', color: 'warning', info: 'Awaiting your action' }
                ].map((stat, i) => (
                    <div className="col-xl-3 col-md-6" key={i}>
                        <div className="premium-card h-100 border-start border-4" style={{ borderColor: `var(--bs-${stat.color})` }}>
                            <div className="d-flex justify-content-between align-items-start mb-2">
                                <div className={`btn-icon rounded-circle bg-${stat.color} bg-opacity-10 text-${stat.color}`}>
                                    <i className={stat.icon}></i>
                                </div>
                            </div>
                            <h3 className="mb-1 display-6 fw-bold">{stat.value}</h3>
                            <p className="text-muted mb-1 fw-bold">{stat.label}</p>
                            <small className="text-muted opacity-75">{stat.info}</small>
                        </div>
                    </div>
                ))}
            </div>

            <div className="row g-4 mb-4">
                {/* 30-Day Completion Trend */}
                <div className="col-lg-8">
                    <div className="premium-card h-100">
                        <h5 className="mb-4 small text-uppercase fw-bold text-muted ls-1">30-Day Completion Trend</h5>
                        <div style={{ height: '300px' }}>
                            <Line 
                                data={{
                                    labels: trend.map(t => t._id),
                                    datasets: [{
                                        label: 'Tasks Completed',
                                        data: trend.map(t => t.completed),
                                        borderColor: '#4cc9f0',
                                        backgroundColor: 'rgba(76, 201, 240, 0.1)',
                                        borderWidth: 3,
                                        fill: true,
                                        tension: 0.4,
                                        pointBackgroundColor: '#fff',
                                        pointBorderColor: '#4cc9f0',
                                        pointBorderWidth: 2,
                                        pointRadius: 4,
                                        pointHoverRadius: 6
                                    }]
                                }} 
                                options={{ 
                                    maintainAspectRatio: false,
                                    plugins: { 
                                        legend: { display: false },
                                        datalabels: {}
                                    },
                                    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                                }} 
                                plugins={[datalabelsPlugin]}
                            />
                        </div>
                    </div>
                </div>

                {/* Priority Heatmap */}
                <div className="col-lg-4">
                    <div className="premium-card h-100">
                        <h5 className="mb-4 small text-uppercase fw-bold text-muted ls-1">Current Backlog Priority</h5>
                        <div style={{ height: '300px' }} className="d-flex justify-content-center align-items-center">
                            {priorityDistribution.length > 0 ? (
                                <Doughnut 
                                    data={{
                                        labels: priorityDistribution.map(p => p._id.charAt(0).toUpperCase() + p._id.slice(1)),
                                        datasets: [{
                                            data: priorityDistribution.map(p => p.count),
                                            backgroundColor: [
                                                '#ef476f', // urgent/high
                                                '#f78c6b', // medium
                                                '#ffd166', // low
                                                '#06d6a0'  // routine
                                            ],
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
                            ) : (
                                <div className="text-center text-muted">
                                    <i className="fas fa-check-circle fa-3x mb-3 text-success opacity-50"></i>
                                    <p>No pending backlog</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-4">
                <div className="col-lg-12">
                     <div className="premium-card bg-primary text-white p-4">
                        <div className="row align-items-center">
                            <div className="col-md-8">
                                <h4 className="text-white mb-2"><i className="fas fa-trophy text-warning me-2"></i> Performance Summary</h4>
                                <p className="mb-0 text-white-50">
                                    You have an on-time completion rate of <strong>{summary.onTimeRate}%</strong> over the past 30 days. 
                                    {summary.onTimeRate > 80 ? ' Keep up the phenomenal work!' : summary.onTimeRate > 50 ? ' Good job, aim to close tasks slightly faster.' : ' Needs improvement on hitting deadlines.'}
                                </p>
                            </div>
                            <div className="col-md-4 text-md-end text-center mt-3 mt-md-0">
                                <div className="display-4 fw-bold">{summary.totalCompleted}</div>
                                <div className="text-white-50 small text-uppercase ls-1">Tasks Done</div>
                            </div>
                        </div>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default StaffAnalytics;
