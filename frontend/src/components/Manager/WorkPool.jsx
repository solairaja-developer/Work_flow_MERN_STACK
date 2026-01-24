// src/components/Manager/WorkPool.jsx
import React from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { managerAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const WorkPool = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const { data: unassignedData, isLoading } = useQuery(
        ['unassignedTasks'],
        managerAPI.getUnassignedTasks
    );

    if (isLoading) return (
        <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
        </div>
    );

    const tasks = unassignedData?.tasks || [];

    return (
        <div className="container-fluid py-2">
            <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                    <h2 className="mb-0">Departmental Work Pool</h2>
                    <p className="text-muted mb-0">Review and distribute admin-issued work to your team</p>
                </div>
            </div>

            <div className="row g-4">
                {tasks.length > 0 ? (
                    tasks.map((task) => (
                        <div className="col-lg-6" key={task._id}>
                            <div className="premium-card h-100 d-flex flex-column">
                                <div className="d-flex justify-content-between mb-3">
                                    <span className="badge bg-soft-primary text-primary px-3 py-2 rounded-pill">
                                        <i className="fas fa-hashtag me-1 small"></i>{task.workId}
                                    </span>
                                    <span className={`badge-premium badge-${task.priority}`}>
                                        {task.priority.toUpperCase()}
                                    </span>
                                </div>
                                <h5 className="fw-bold mb-2">{task.title}</h5>
                                <p className="text-muted small mb-4 flex-grow-1 text-truncate-3">{task.description}</p>

                                <div className="contact-info bg-light p-3 rounded-3 mb-4">
                                    <div className="d-flex align-items-center mb-2">
                                        <i className="fas fa-calendar-alt text-primary me-2 small"></i>
                                        <span className="extra-small text-muted">Deadline: {new Date(task.dueDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="d-flex align-items-center">
                                        <i className="fas fa-user-edit text-primary me-2 small"></i>
                                        <span className="extra-small text-muted">Issued by System Admin</span>
                                    </div>
                                </div>

                                <button
                                    className="btn-premium w-100 py-2 rounded-pill shadow-sm"
                                    onClick={() => navigate(`/manager/assign-task?taskId=${task._id}`)}
                                >
                                    <i className="fas fa-user-plus me-2"></i> Assign to Member
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-12 text-center py-5">
                        <div className="premium-card border-dashed py-5">
                            <div className="btn-icon bg-light text-success rounded-circle mx-auto mb-3" style={{ width: '80px', height: '80px' }}>
                                <i className="fas fa-check-double fa-2x"></i>
                            </div>
                            <h4>Work Pool is Empty</h4>
                            <p className="text-muted mb-0">All department tasks have been successfully delegated.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WorkPool;
