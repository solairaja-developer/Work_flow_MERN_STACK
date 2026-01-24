// src/components/Staff/TaskDetails.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { staffAPI } from '../../services/api';
import toast from 'react-hot-toast';

const TaskDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [comment, setComment] = useState('');

    const { data: tasksData, isLoading } = useQuery(
        ['task', id],
        () => staffAPI.getMyTasks({ id }) // Assuming the API can filter by ID or we use a specific detail endpoint
    );

    // If getMyTasks doesn't support ID, we might need a getTaskById in staffAPI
    // Let's assume we use shared/staff API.
    const task = Array.isArray(tasksData?.tasks) ? tasksData.tasks.find(t => t._id === id) : tasksData?.task;

    const updateMutation = useMutation(
        (data) => staffAPI.updateTaskProgress(id, data),
        {
            onSuccess: () => {
                toast.success('Task updated successfully');
                queryClient.invalidateQueries(['task', id]);
                queryClient.invalidateQueries(['tasks']);
            }
        }
    );

    const commentMutation = useMutation(
        (text) => staffAPI.addComment(id, { text }),
        {
            onSuccess: () => {
                toast.success('Comment added');
                setComment('');
                queryClient.invalidateQueries(['task', id]);
            }
        }
    );

    if (isLoading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;

    if (!task) return (
        <div className="text-center py-5">
            <i className="fas fa-search fa-3x text-muted mb-3 opacity-25"></i>
            <h4>Task details not found</h4>
            <button className="btn btn-primary rounded-pill mt-3" onClick={() => navigate('/tasks')}>Back to Tasks</button>
        </div>
    );

    return (
        <div className="container-fluid py-2">
            <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                    <h2 className="mb-0">Task Exploration</h2>
                    <p className="text-muted mb-0">Detailed view and management of work ID: <span className="text-primary fw-bold">#{task.workId}</span></p>
                </div>
                <button className="btn btn-light rounded-pill px-4 shadow-sm" onClick={() => navigate('/tasks')}>
                    <i className="fas fa-arrow-left me-2"></i> Back
                </button>
            </div>

            <div className="row g-4">
                <div className="col-lg-8">
                    <div className="premium-card mb-4">
                        <div className="d-flex justify-content-between align-items-start mb-4">
                            <div>
                                <span className={`badge-premium badge-${task.status?.toLowerCase().replace(' ', '_')} mb-2`}>
                                    {task.status?.replace('_', ' ')}
                                </span>
                                <h3 className="fw-bold">{task.title}</h3>
                            </div>
                            <div className="text-end">
                                <small className="text-muted text-uppercase fw-bold d-block">Priority</small>
                                <span className={`text-${task.priority === 'high' ? 'danger' : 'warning'} fw-bold`}>
                                    <i className="fas fa-circle small me-1"></i> {task.priority}
                                </span>
                            </div>
                        </div>

                        <div className="p-4 bg-light rounded-4 mb-4">
                            <h6 className="fw-bold mb-3">Project Description</h6>
                            <p className="text-muted mb-0" style={{ lineHeight: '1.8' }}>{task.description}</p>
                        </div>

                        <div className="row g-3 mb-4">
                            <div className="col-sm-6">
                                <div className="p-3 border rounded-3">
                                    <small className="text-muted d-block mb-1">Assigned By</small>
                                    <span className="fw-bold">{task.assignedBy?.fullName || 'Manager'}</span>
                                </div>
                            </div>
                            <div className="col-sm-6">
                                <div className="p-3 border rounded-3">
                                    <small className="text-muted d-block mb-1">Deadline Date</small>
                                    <span className="fw-bold text-danger">{new Date(task.dueDate).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mb-0">
                            <h6 className="fw-bold mb-3">Execution Progress</h6>
                            <div className="progress mb-3" style={{ height: '10px' }}>
                                <div className="progress-bar progress-bar-striped progress-bar-animated" style={{ width: `${task.progress}%` }}></div>
                            </div>
                            <div className="d-flex gap-2">
                                {[0, 25, 50, 75, 100].map(v => (
                                    <button key={v} className={`btn btn-sm flex-grow-1 rounded-pill ${task.progress === v ? 'btn-primary' : 'btn-outline-light text-dark border'}`}
                                        onClick={() => updateMutation.mutate({ progress: v })}>
                                        {v}%
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Comments */}
                    <div className="premium-card">
                        <h5 className="fw-bold mb-4">Collaboration & Feedback</h5>
                        <div className="mb-4">
                            <textarea className="form-control rounded-4 p-3 mb-3" rows="3" placeholder="Write a status update or ask a question..."
                                value={comment} onChange={(e) => setComment(e.target.value)}></textarea>
                            <button className="btn-premium px-4" onClick={() => commentMutation.mutate(comment)} disabled={!comment.trim()}>
                                Post Comment <i className="fas fa-paper-plane ms-2"></i>
                            </button>
                        </div>

                        <div className="comment-feed">
                            {task.comments?.map((c, i) => (
                                <div key={i} className="d-flex gap-3 mb-4 p-3 rounded-4 bg-light">
                                    <div className="avatar sm bg-primary text-white rounded-circle flex-shrink-0" style={{ width: '40px', height: '40px', lineHeight: '40px', textAlign: 'center' }}>
                                        {c.user?.fullName?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <div className="d-flex align-items-center gap-2 mb-1">
                                            <span className="fw-bold small">{c.user?.fullName || 'User'}</span>
                                            <span className="extra-small text-muted">• {new Date(c.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className="small mb-0 text-muted">{c.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="col-lg-4">
                    <div className="premium-card mb-4">
                        <h6 className="fw-bold mb-4 text-uppercase small text-muted">Quick Actions</h6>
                        <div className="d-grid gap-2">
                            {task.status !== 'in_progress' && (
                                <button className="btn btn-primary py-3 rounded-3 shadow-sm" onClick={() => updateMutation.mutate({ status: 'in_progress' })}>
                                    <i className="fas fa-play me-2"></i> Start Work
                                </button>
                            )}
                            {task.status !== 'completed' && (
                                <button className="btn btn-success py-3 rounded-3 shadow-sm" onClick={() => updateMutation.mutate({ status: 'completed', progress: 100 })}>
                                    <i className="fas fa-check-circle me-2"></i> Mark Completed
                                </button>
                            )}
                            <button className="btn btn-light py-3 rounded-3" onClick={() => window.print()}>
                                <i className="fas fa-print me-2"></i> Print Summary
                            </button>
                        </div>
                    </div>

                    <div className="premium-card">
                        <h6 className="fw-bold mb-4 text-uppercase small text-muted">Time Tracking</h6>
                        <div className="timeline small">
                            <div className="d-flex justify-content-between mb-3 pb-3 border-bottom">
                                <span className="text-muted">Created</span>
                                <span className="fw-bold">{new Date(task.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-3 pb-3 border-bottom">
                                <span className="text-muted">Last Updated</span>
                                <span className="fw-bold">{new Date(task.updatedAt).toLocaleDateString()}</span>
                            </div>
                            <div className="d-flex justify-content-between text-danger fw-bold">
                                <span>Final Deadline</span>
                                <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskDetails;