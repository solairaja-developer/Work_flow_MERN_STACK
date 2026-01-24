// src/components/Shared/TaskStatus.jsx
import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { sharedAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

const TaskStatus = () => {
    const { user } = useAuth();
    const [filter, setFilter] = useState('all');
    const { data: tasks, isLoading } = useQuery(
        ['tasks', filter],
        () => sharedAPI.getTaskStatus({ status: filter === 'all' ? '' : filter })
    );

    if (isLoading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;

    const taskList = Array.isArray(tasks) ? tasks : (tasks?.tasks || []);

    return (
        <div className="container-fluid py-2">
            <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                    <h2 className="mb-0">Task Overview</h2>
                    <p className="text-muted mb-0">Track progress and status of all assignments</p>
                </div>
                <div className="d-flex gap-2">
                    {['all', 'pending', 'in_progress', 'completed'].map((f) => (
                        <button
                            key={f}
                            className={`btn btn-sm rounded-pill px-3 ${filter === f ? 'btn-primary' : 'btn-light'}`}
                            onClick={() => setFilter(f)}
                        >
                            {f.replace('_', ' ').charAt(0).toUpperCase() + f.replace('_', ' ').slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="premium-card">
                <div className="table-responsive">
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
                            {taskList.map((task) => (
                                <tr key={task._id}>
                                    <td className="fw-bold text-primary">{task.workId}</td>
                                    <td>
                                        <div className="fw-500">{task.title}</div>
                                        <small className="text-muted text-truncate d-inline-block" style={{ maxWidth: '200px' }}>
                                            {task.description}
                                        </small>
                                    </td>
                                    <td>{task.assignedTo?.fullName || 'N/A'}</td>
                                    <td>{task.department}</td>
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
                                    <td>{new Date(task.dueDate).toLocaleDateString()}</td>
                                    <td>
                                        <Link to={`/tasks/${task._id}`} className="btn-icon bg-light text-primary">
                                            <i className="fas fa-eye"></i>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {taskList.length === 0 && (
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
