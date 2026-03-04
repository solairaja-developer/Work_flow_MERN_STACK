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
    const [localProgress, setLocalProgress] = useState(null);
    const [isAdjusting, setIsAdjusting] = useState(false);

    const { data: tasksData, isLoading } = useQuery(
        ['task', id],
        () => staffAPI.getTaskDetails(id)
    );

    const task = tasksData?.task;

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

    React.useEffect(() => {
        if (task && localProgress === null) {
            setLocalProgress(task.progress);
        }
    }, [task, localProgress]);

    const handleProgressSave = () => {
        updateMutation.mutate({ 
            progress: localProgress,
            // If they move to 100, automatically suggest completed status
            status: localProgress === 100 ? 'completed' : task.status
        });
        setIsAdjusting(false);
    };

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
            {/* Printable Report Header */}
            <div className="print-only">
                <div className="print-report-header">
                    <h2 className="fw-bold mb-0">TASK COMPLETION SUMMARY</h2>
                    <p className="mb-0">Reference ID: <span className="fw-bold">#{task.workId}</span></p>
                    <p className="extra-small text-muted">Generated: {new Date().toLocaleString()}</p>
                </div>

                <table className="print-table">
                    <tbody>
                        <tr>
                            <th style={{ width: '25%' }}>Project Workspace</th>
                            <td colSpan="3" className="fw-bold fs-5">{task.title}</td>
                        </tr>
                        <tr>
                            <th>Dept / Category</th>
                            <td style={{ width: '25%' }}>{task.department}</td>
                            <th style={{ width: '25%' }}>Priority Rank</th>
                            <td>{task.priority?.toUpperCase()}</td>
                        </tr>
                        <tr>
                            <th>Assigned By</th>
                            <td style={{ width: '25%' }} className="fw-bold">{task.assignedBy?.fullName || 'Admin'}</td>
                            <th>Assigned To</th>
                            <td className="fw-bold">{task.assignedTo?.fullName || 'N/A'}</td>
                        </tr>
                        <tr>
                            <th>Task Created</th>
                            <td style={{ width: '25%' }}>{new Date(task.createdAt).toLocaleDateString()}</td>
                            <th>Final Deadline</th>
                            <td className="text-danger fw-bold">{new Date(task.dueDate).toLocaleDateString()}</td>
                        </tr>
                        <tr>
                            <th>Current Status</th>
                            <td>{task.status?.replace('_', ' ').toUpperCase()}</td>
                            <th>Completion Date</th>
                            <td className="text-success fw-bold">
                                {task.completedDate ? new Date(task.completedDate).toLocaleDateString() : 'INCOMPLETE'}
                            </td>
                        </tr>
                        <tr>
                            <th>Overall Progress</th>
                            <td colSpan="3" className="fw-bold">
                                {task.progress}% - {task.progress === 100 ? 'Verified & Completed' : 'Under Execution'}
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div className="signature-area">
                    <div className="sig-box">
                        <p className="mb-0 fw-bold">Staff Signature</p>
                        <p className="extra-small text-muted">{task.assignedTo?.fullName}</p>
                    </div>
                    <div className="sig-box">
                        <p className="mb-0 fw-bold">Manager Signature</p>
                        <p className="extra-small text-muted">{task.department} Head</p>
                    </div>
                </div>
            </div>

            <div className="d-flex align-items-center justify-content-end mb-4 no-print">
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

                        <div className="mb-0 no-print">
                            <h6 className="fw-bold mb-3">Execution Progress</h6>
                            <div className="progress mb-3" style={{ height: '10px' }}>
                                <div className="progress-bar progress-bar-striped progress-bar-animated" style={{ width: `${task.progress}%` }}></div>
                            </div>
                            
                            <div className="p-3 border rounded-4 bg-light">
                                <div className="d-flex align-items-center justify-content-between mb-2">
                                    <span className="small text-muted fw-bold">Adjust Progress</span>
                                    <span className={`badge ${localProgress !== task.progress ? 'bg-warning' : 'bg-primary'} rounded-pill`}>
                                        {localProgress ?? task.progress}%
                                    </span>
                                </div>
                                <div className="d-flex align-items-center gap-3">
                                    <button 
                                        className="btn btn-sm btn-outline-primary rounded-circle"
                                        style={{ width: '32px', height: '32px', padding: '0' }}
                                        onClick={() => {
                                            setLocalProgress(prev => Math.max(0, (prev ?? task.progress) - 1));
                                            setIsAdjusting(true);
                                        }}
                                    >
                                        <i className="fas fa-minus small"></i>
                                    </button>
                                    
                                    <input 
                                        type="range" 
                                        className="form-range flex-grow-1 progress-slider" 
                                        min="0" 
                                        max="100" 
                                        value={localProgress ?? task.progress} 
                                        onChange={(e) => {
                                            setLocalProgress(parseInt(e.target.value));
                                            setIsAdjusting(true);
                                        }}
                                        onMouseUp={handleProgressSave}
                                        onTouchEnd={handleProgressSave}
                                    />
                                    
                                    <button 
                                        className="btn btn-sm btn-outline-primary rounded-circle"
                                        style={{ width: '32px', height: '32px', padding: '0' }}
                                        onClick={() => {
                                            setLocalProgress(prev => Math.min(100, (prev ?? task.progress) + 1));
                                            setIsAdjusting(true);
                                        }}
                                    >
                                        <i className="fas fa-plus small"></i>
                                    </button>
                                </div>
                                <div className="d-flex justify-content-between align-items-center mt-2 px-1">
                                    <span className="extra-small text-muted">0%</span>
                                    {isAdjusting && localProgress !== task.progress && (
                                        <button className="btn btn-xs btn-primary py-0 px-2 rounded-pill" style={{ fontSize: '0.7rem' }} onClick={handleProgressSave}>
                                            Save Changes
                                        </button>
                                    )}
                                    <span className="extra-small text-muted">100%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Comments */}
                    <div className="premium-card no-print">
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

                    <div className="premium-card mb-4">
                        <h6 className="fw-bold mb-4 text-uppercase small text-muted">Staff Information</h6>
                        <div className="d-flex align-items-center gap-3 p-2">
                             <div className="avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px' }}>
                                 {task.assignedTo?.fullName?.charAt(0) || 'U'}
                             </div>
                             <div>
                                 <h6 className="mb-0 fw-bold">{task.assignedTo?.fullName || 'Unassigned'}</h6>
                                 <p className="extra-small text-muted mb-0">{task.department} Specialist</p>
                             </div>
                        </div>
                    </div>

                    <div className="premium-card">
                        <h6 className="fw-bold mb-4 text-uppercase small text-muted">Operational Metadata</h6>
                        <div className="timeline small">
                            <div className="d-flex justify-content-between mb-3 pb-3 border-bottom">
                                <span className="text-muted">Record Created</span>
                                <span className="fw-bold">{new Date(task.createdAt).toLocaleString()}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-3 pb-3 border-bottom">
                                <span className="text-muted">Last Activity</span>
                                <span className="fw-bold">{new Date(task.updatedAt).toLocaleString()}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-3 pb-3 border-bottom">
                                <span className="text-muted">Target Deadline</span>
                                <span className="fw-bold text-danger">{new Date(task.dueDate).toLocaleDateString()}</span>
                            </div>
                            {task.status === 'completed' && (
                                <div className="d-flex justify-content-between mb-3 pb-3 border-bottom">
                                    <span className="text-muted">Finalized On</span>
                                    <span className="fw-bold text-success">{new Date(task.completedDate || task.updatedAt).toLocaleDateString()}</span>
                                </div>
                            )}
                            {task.status === 'completed' && (
                                <div className="mt-3">
                                    <div className={`alert ${new Date(task.completedDate || task.updatedAt) <= new Date(task.dueDate) ? 'alert-success' : 'alert-danger'} py-2 mb-0 rounded-3 border-0`}>
                                        <i className={`fas ${new Date(task.completedDate || task.updatedAt) <= new Date(task.dueDate) ? 'fa-check-circle' : 'fa-exclamation-circle'} me-2`}></i>
                                        <span className="extra-small fw-bold">
                                            {new Date(task.completedDate || task.updatedAt) <= new Date(task.dueDate) ? 'DELIVERED ON-TIME' : 'DELIVERED WITH DELAY'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskDetails;