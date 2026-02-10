// src/components/Shared/TaskStatus.jsx
import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { sharedAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

const TaskStatus = () => {
    const { user } = useAuth();
    const [filter, setFilter] = useState('all');
    
    const { data: tasks, isLoading, error, refetch } = useQuery(
        ['tasks', filter],
        () => sharedAPI.getTaskStatus({ status: filter === 'all' ? '' : filter }),
        {
            refetchInterval: 10000, // Auto-refresh every 10 seconds
            refetchOnWindowFocus: true,
            retry: 3,
            onError: (err) => {
                console.error('Error fetching tasks:', err);
            }
        }
    );

    if (isLoading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="text-muted mt-3">Loading tasks...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container-fluid py-2">
                <div className="premium-card text-center py-5">
                    <i className="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                    <h5 className="text-muted">Error Loading Tasks</h5>
                    <p className="text-muted small">{error.message || 'Failed to load tasks'}</p>
                    <button className="btn btn-primary mt-3" onClick={() => refetch()}>
                        <i className="fas fa-sync-alt me-2"></i>Retry
                    </button>
                </div>
            </div>
        );
    }

    const taskList = Array.isArray(tasks) ? tasks : (tasks?.tasks || []);

    return (
        <div className="container-fluid py-2">
            <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between mb-4 gap-3">
                <div>
                    <h2 className="mb-0 fs-4 fs-md-3">Task Overview</h2>
                    <p className="text-muted mb-0 small">Track progress and status of all assignments</p>
                </div>
                <div className="d-flex flex-wrap gap-2">
                    {['all', 'pending', 'in_progress', 'completed'].map((f) => (
                        <button
                            key={f}
                            className={`btn btn-sm rounded-pill px-3 ${filter === f ? 'btn-primary' : 'btn-light'}`}
                            onClick={() => setFilter(f)}
                        >
                            {f.replace('_', ' ').charAt(0).toUpperCase() + f.replace('_', ' ').slice(1)}
                        </button>
                    ))}
                    <button 
                        className="btn btn-sm btn-outline-primary rounded-pill px-3"
                        onClick={() => refetch()}
                        title="Refresh"
                    >
                        <i className="fas fa-sync-alt"></i>
                    </button>
                </div>
            </div>

            <div className="premium-card">
                {/* Desktop Table View */}
                <div className="table-responsive d-none d-md-block">
                    <table className="premium-table">
                        <thead>
                            <tr>
                                <th>Work ID</th>
                                <th>Title</th>
                                <th>Assigned To</th>
                                <th>Department</th>
                                <th>Status</th>
                                <th>Progress</th>
                                <th>Due Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {taskList.length > 0 ? (
                                taskList.map((task) => (
                                    <tr key={task._id}>
                                        <td className="fw-bold text-primary">{task.workId || `WF-${task._id.slice(-3).toUpperCase()}`}</td>
                                        <td>
                                            <div className="fw-500">{task.title}</div>
                                            <small className="text-muted text-truncate d-inline-block" style={{ maxWidth: '200px' }}>
                                                {task.description}
                                            </small>
                                        </td>
                                        <td>{task.assignedTo?.fullName || 'Unassigned'}</td>
                                        <td><span className="badge bg-soft-primary text-primary">{task.department}</span></td>
                                        <td>
                                            <span className={`badge-premium badge-${task.status?.toLowerCase().replace(' ', '_')}`}>
                                                {task.status?.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="d-flex align-items-center gap-2">
                                                <div className="progress flex-grow-1" style={{ height: '6px' }}>
                                                    <div
                                                        className={`progress-bar ${task.status === 'completed' ? 'bg-success' : 'bg-primary'}`}
                                                        style={{ width: `${task.progress || 0}%` }}
                                                    ></div>
                                                </div>
                                                <small className="text-muted">{task.progress || 0}%</small>
                                            </div>
                                        </td>
                                        <td className="small">{new Date(task.dueDate).toLocaleDateString()}</td>
                                        <td>
                                            <Link to={`/tasks/${task._id}`} className="btn-icon bg-light text-primary">
                                                <i className="fas fa-eye"></i>
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="text-center py-5">
                                        <i className="fas fa-clipboard-list fa-3x text-muted mb-3 opacity-25"></i>
                                        <p className="text-muted">No tasks found for this selection</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="d-md-none">
                    {taskList.length > 0 ? (
                        taskList.map((task) => (
                            <div key={task._id} className="card mb-3 border-0 shadow-sm">
                                <div className="card-body p-3">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <div className="flex-grow-1">
                                            <h6 className="mb-1 fw-bold">{task.title}</h6>
                                            <small className="text-muted d-block mb-2">{task.description}</small>
                                        </div>
                                        <span className={`badge-premium badge-${task.status?.toLowerCase().replace(' ', '_')} ms-2`}>
                                            {task.status?.replace('_', ' ')}
                                        </span>
                                    </div>
                                    
                                    <div className="small mb-2">
                                        <span className="text-primary fw-bold me-2">#{task.workId || `WF-${task._id.slice(-3).toUpperCase()}`}</span>
                                        <span className="badge bg-soft-primary text-primary">{task.department}</span>
                                    </div>
                                    
                                    <div className="mb-2">
                                        <div className="d-flex justify-content-between align-items-center small mb-1">
                                            <span className="text-muted">Progress</span>
                                            <span className="fw-bold">{task.progress || 0}%</span>
                                        </div>
                                        <div className="progress" style={{ height: '6px' }}>
                                            <div
                                                className={`progress-bar ${task.status === 'completed' ? 'bg-success' : 'bg-primary'}`}
                                                style={{ width: `${task.progress || 0}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    
                                    <div className="d-flex justify-content-between align-items-center small">
                                        <div>
                                            <i className="fas fa-user me-1 text-muted"></i>
                                            {task.assignedTo?.fullName || 'Unassigned'}
                                        </div>
                                        <div className="text-muted">
                                            <i className="fas fa-calendar me-1"></i>
                                            {new Date(task.dueDate).toLocaleDateString()}
                                        </div>
                                    </div>
                                    
                                    <div className="mt-3">
                                        <Link to={`/tasks/${task._id}`} className="btn btn-sm btn-primary w-100">
                                            <i className="fas fa-eye me-2"></i>View Details
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-5">
                            <i className="fas fa-clipboard-list fa-3x text-muted mb-3 opacity-25"></i>
                            <p className="text-muted">No tasks found for this selection</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TaskStatus;
