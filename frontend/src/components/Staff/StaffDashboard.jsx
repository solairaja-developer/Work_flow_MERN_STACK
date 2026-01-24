// components/Staff/StaffDashboard.jsx
import React from 'react';
import { useQuery } from 'react-query';
import { staffAPI } from '../../services/api';

const StaffDashboard = () => {
    const { data: myTasks } = useQuery(
        'staffTasks',
        staffAPI.getMyTasks
    );
    
    const { data: performance } = useQuery(
        'staffPerformance',
        staffAPI.getPerformanceStats
    );
    
    return (
        <div className="container-fluid">
            {/* Welcome Header */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="welcome-card bg-gradient-primary text-white p-4 rounded">
                        <h3>Welcome back, [Staff Name]!</h3>
                        <p>Here's your work overview for today</p>
                    </div>
                </div>
            </div>
            
            {/* Task Summary */}
            <div className="row mb-4">
                <div className="col-md-3 mb-3">
                    <div className="card">
                        <div className="card-body text-center">
                            <h2>{myTasks?.total || 0}</h2>
                            <p className="text-muted">Total Tasks</p>
                        </div>
                    </div>
                </div>
                
                <div className="col-md-3 mb-3">
                    <div className="card">
                        <div className="card-body text-center">
                            <h2 className="text-warning">{myTasks?.pending || 0}</h2>
                            <p className="text-muted">Pending</p>
                        </div>
                    </div>
                </div>
                
                <div className="col-md-3 mb-3">
                    <div className="card">
                        <div className="card-body text-center">
                            <h2 className="text-info">{myTasks?.inProgress || 0}</h2>
                            <p className="text-muted">In Progress</p>
                        </div>
                    </div>
                </div>
                
                <div className="col-md-3 mb-3">
                    <div className="card">
                        <div className="card-body text-center">
                            <h2 className="text-success">{myTasks?.completed || 0}</h2>
                            <p className="text-muted">Completed</p>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Tasks List */}
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <h5>My Tasks</h5>
                        </div>
                        <div className="card-body">
                            <TaskList tasks={myTasks?.tasks} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};