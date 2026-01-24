// src/components/Staff/MyTasks.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { staffAPI } from '../../services/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const MyTasks = () => {
    const [filter, setFilter] = useState('all');
    const queryClient = useQueryClient();

    const { data: tasksData, isLoading } = useQuery(
        ['tasks', filter],
        () => staffAPI.getMyTasks({ status: filter === 'all' ? '' : filter })
    );

    const updateMutation = useMutation(
        ({ id, data }) => staffAPI.updateTaskProgress(id, data),
        {
            onSuccess: () => {
                toast.success('Task updated successfully');
                queryClient.invalidateQueries(['tasks']);
                queryClient.invalidateQueries(['staffDashboard']);
            },
            onError: (error) => {
                toast.error(error.message || 'Error updating task');
            }
        }
    );

    const handleUpdateProgress = (taskId, progress) => {
        updateMutation.mutate({
            id: taskId,
            data: { progress }
        });
    };

    const handleUpdateStatus = (taskId, status) => {
        updateMutation.mutate({
            id: taskId,
            data: { status }
        });
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

    const tasks = tasksData?.tasks || [];

    return (
        <div className="container-fluid">
            <div className="d-sm-flex align-items-center justify-content-between mb-4">
                <h1 className="h3 mb-0 text-gray-800">My Tasks</h1>
                <div>
                    <select
                        className="form-select form-select-sm"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="all">All Tasks</option>
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
            </div>

            <div className="row">
                {tasks.map(task => (
                    <div key={task._id} className="col-lg-4 col-md-6 mb-4">
                        <div className={`card h-100 ${task.status === 'overdue' ? 'border-danger' : ''}`}>
                            <div className="card-header">
                                <div className="d-flex justify-content-between align-items-center">
                                    <span className="badge bg-primary">{task.workId}</span>
                                    <span className={`badge ${task.status === 'completed' ? 'bg-success' : task.status === 'in_progress' ? 'bg-info' : 'bg-warning'}`}>
                                        {task.status?.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>
                            <div className="card-body">
                                <h5 className="card-title">{task.title}</h5>
                                <p className="card-text text-muted">{task.description?.substring(0, 100)}...</p>

                                <div className="mb-3">
                                    <small className="text-muted">Assigned by:</small>
                                    <p className="mb-1">{task.assignedBy?.fullName}</p>
                                </div>

                                <div className="mb-3">
                                    <small className="text-muted">Due Date:</small>
                                    <p className="mb-1">{new Date(task.dueDate).toLocaleDateString()}</p>
                                </div>

                                <div className="mb-4">
                                    <small className="text-muted">Progress:</small>
                                    <div className="progress">
                                        <div
                                            className="progress-bar"
                                            style={{ width: `${task.progress}%` }}
                                        >
                                            {task.progress}%
                                        </div>
                                    </div>
                                </div>

                                <div className="d-flex justify-content-between align-items-center">
                                    <Link
                                        to={`/tasks/${task._id}`}
                                        className="btn btn-sm btn-info"
                                    >
                                        View Details
                                    </Link>

                                    <div className="btn-group">
                                        {task.status !== 'completed' && (
                                            <>
                                                <button
                                                    className="btn btn-sm btn-success"
                                                    onClick={() => handleUpdateProgress(task._id, Math.min(task.progress + 25, 100))}
                                                >
                                                    +25%
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-primary"
                                                    onClick={() => handleUpdateStatus(task._id, 'in_progress')}
                                                >
                                                    Start
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-warning"
                                                    onClick={() => updateMutation.mutate({ id: task._id, data: { status: 'completed', progress: 100 } })}
                                                >
                                                    Complete
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {tasks.length === 0 && (
                <div className="text-center py-5">
                    <i className="fas fa-tasks fa-3x text-muted mb-3"></i>
                    <h4>No tasks found</h4>
                    <p className="text-muted">You don't have any tasks assigned yet.</p>
                </div>
            )}
        </div>
    );
};

export default MyTasks;