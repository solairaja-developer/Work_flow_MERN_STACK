// src/components/Staff/MyTasks.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { staffAPI } from '../../services/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const MyTasks = () => {
    const [filter, setFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [tempProgress, setTempProgress] = useState(0);
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

    const openProgressModal = (task) => {
        setSelectedTask(task);
        setTempProgress(task.progress);
        setShowModal(true);
    };

    const saveProgress = () => {
        if (selectedTask) {
            updateMutation.mutate({
                id: selectedTask._id,
                data: { progress: tempProgress }
            });
            setShowModal(false);
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
                                                    className="btn btn-sm btn-outline-success"
                                                    onClick={() => openProgressModal(task)}
                                                    title="Adjust Progress"
                                                >
                                                    <i className="fas fa-percentage me-1"></i> Update
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

            {/* Progress Update Modal */}
            {showModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content premium-card border-0">
                            <div className="modal-header border-0">
                                <h5 className="modal-title fw-bold">Update Execution Progress</h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <div className="modal-body py-4">
                                <div className="text-center mb-4">
                                    <h6 className="text-muted mb-2">{selectedTask?.title}</h6>
                                    <div className="display-4 fw-bold text-primary">{tempProgress}%</div>
                                </div>
                                
                                <div className="d-flex align-items-center gap-3 mb-4">
                                    <button 
                                        className="btn btn-icon bg-light text-primary rounded-circle"
                                        onClick={() => setTempProgress(prev => Math.max(0, prev - 1))}
                                    >
                                        <i className="fas fa-minus"></i>
                                    </button>
                                    
                                    <input 
                                        type="range" 
                                        className="form-range flex-grow-1 progress-slider" 
                                        min="0" 
                                        max="100" 
                                        value={tempProgress} 
                                        onChange={(e) => setTempProgress(parseInt(e.target.value))}
                                    />
                                    
                                    <button 
                                        className="btn btn-icon bg-light text-primary rounded-circle"
                                        onClick={() => setTempProgress(prev => Math.min(100, prev + 1))}
                                    >
                                        <i className="fas fa-plus"></i>
                                    </button>
                                </div>

                                <div className="row g-2">
                                    {[0, 25, 50, 75, 100].map(val => (
                                        <div key={val} className="col">
                                            <button 
                                                className={`btn btn-sm w-100 rounded-pill ${tempProgress === val ? 'btn-primary' : 'btn-outline-light text-dark border'}`}
                                                onClick={() => setTempProgress(val)}
                                            >
                                                {val}%
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="modal-footer border-0">
                                <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="button" className="btn btn-primary rounded-pill px-4" onClick={saveProgress}>Save Progress</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyTasks;