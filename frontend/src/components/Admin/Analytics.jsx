// src/components/Admin/Analytics.jsx
import React from 'react';
import { useQuery } from 'react-query';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { adminAPI } from '../../services/api';

const Analytics = () => {
    const { data: analytics, isLoading } = useQuery(
        ['analytics'],
        adminAPI.getAnalytics
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

    const { monthlyTasks, departmentTasks, userPerformance } = analytics?.analytics || {};

    // Monthly tasks chart
    const monthlyChartData = {
        labels: monthlyTasks?.map(item => `${item._id.month}/${item._id.year}`) || [],
        datasets: [{
            label: 'Total Tasks',
            data: monthlyTasks?.map(item => item.total) || [],
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
        }, {
            label: 'Completed Tasks',
            data: monthlyTasks?.map(item => item.completed) || [],
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
        }]
    };

    // Department tasks chart
    const departmentChartData = {
        labels: departmentTasks?.map(item => item._id) || [],
        datasets: [{
            label: 'Tasks by Department',
            data: departmentTasks?.map(item => item.total) || [],
            backgroundColor: [
                '#FF6384',
                '#36A2EB',
                '#FFCE56',
                '#4BC0C0',
                '#9966FF'
            ]
        }]
    };

    return (
        <div className="container-fluid">
            <h1 className="h3 mb-4 text-gray-800">Analytics Dashboard</h1>
            
            <div className="row">
                <div className="col-xl-8 col-lg-7">
                    <div className="card shadow mb-4">
                        <div className="card-header py-3">
                            <h6 className="m-0 font-weight-bold text-primary">
                                Monthly Task Performance
                            </h6>
                        </div>
                        <div className="card-body">
                            <Bar data={monthlyChartData} />
                        </div>
                    </div>
                </div>
                
                <div className="col-xl-4 col-lg-5">
                    <div className="card shadow mb-4">
                        <div className="card-header py-3">
                            <h6 className="m-0 font-weight-bold text-primary">
                                Department Distribution
                            </h6>
                        </div>
                        <div className="card-body">
                            <Pie data={departmentChartData} />
                        </div>
                    </div>
                </div>
            </div>
            
            {/* User Performance Table */}
            <div className="card shadow mb-4">
                <div className="card-header py-3">
                    <h6 className="m-0 font-weight-bold text-primary">
                        Top Performers
                    </h6>
                </div>
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="table table-bordered">
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Name</th>
                                    <th>Department</th>
                                    <th>Total Tasks</th>
                                    <th>Completed</th>
                                    <th>Completion Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {userPerformance?.map((user, index) => (
                                    <tr key={user.userId}>
                                        <td>{index + 1}</td>
                                        <td>{user.fullName}</td>
                                        <td>{user.department}</td>
                                        <td>{user.totalTasks}</td>
                                        <td>{user.completedTasks}</td>
                                        <td>
                                            <div className="progress">
                                                <div 
                                                    className="progress-bar bg-success" 
                                                    style={{ width: `${user.completionRate}%` }}
                                                >
                                                    {user.completionRate.toFixed(1)}%
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;