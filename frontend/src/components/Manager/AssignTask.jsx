// src/components/Manager/AssignTask.jsx
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { managerAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';

const AssignTask = () => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        assignedTo: '',
        priority: 'medium',
        dueDate: ''
    });

    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const location = useLocation();

    const params = new URLSearchParams(location.search);
    const taskId = params.get('taskId');

    // Fetch existing task if taskId is present
    const { data: existingTaskData, isLoading: taskLoading } = useQuery(
        ['taskDetails', taskId],
        () => managerAPI.getTaskDetails(taskId),
        {
            enabled: !!taskId,
            onSuccess: (data) => {
                if (data.task) {
                    setFormData({
                        title: data.task.title,
                        description: data.task.description,
                        priority: data.task.priority,
                        dueDate: data.task.dueDate ? new Date(data.task.dueDate).toISOString().split('T')[0] : '',
                        assignedTo: ''
                    });
                }
            }
        }
    );

    const { data: teamData, isLoading: teamLoading } = useQuery(
        ['team'],
        () => managerAPI.getTeam()
    );

    const assignMutation = useMutation(managerAPI.assignTask, {
        onSuccess: () => {
            toast.success('Task assigned successfully!');
            queryClient.invalidateQueries(['tasks']);
            queryClient.invalidateQueries(['unassignedTasks']);
            navigate('/manager/work-pool');
        },
        onError: (error) => {
            toast.error(error.message || 'Error assigning task');
        }
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!formData.title.trim()) return toast.error('Task title is required');
        if (!formData.description.trim()) return toast.error('Task description is required');
        if (!formData.dueDate) return toast.error('Due date is required');
        
        const selectedDate = new Date(formData.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate < today) return toast.error('Due date cannot be in the past');

        if (!formData.assignedTo) {
            toast.error('Please select a team member from the list');
            return;
        }

        const submitData = taskId
            ? { taskId, assignedTo: formData.assignedTo }
            : formData;

        assignMutation.mutate(submitData);
    };

    if (taskLoading || teamLoading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid py-2">
            <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                    <h2 className="mb-0">{taskId ? 'Select Staff for Assignment' : 'Assign New Work'}</h2>
                    <p className="text-muted mb-0">{taskId ? 'Distribute this pool task to a member' : 'Delegate tasks to your team members'}</p>
                </div>
                <button
                    className="btn btn-light rounded-pill px-4"
                    onClick={() => navigate(-1)}
                >
                    <i className="fas fa-arrow-left me-2"></i> Go Back
                </button>
            </div>

            <div className="row g-4">
                <div className="col-lg-8">
                    <div className="premium-card">
                        <form onSubmit={handleSubmit}>
                            <div className="row g-4">
                                <div className="col-12">
                                    <label className="form-label small fw-bold">
                                        <i className="fas fa-heading text-primary me-2"></i>Task Title
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        className="form-control rounded-3"
                                        placeholder="Enter work title..."
                                        value={formData.title}
                                        onChange={handleChange}
                                        required
                                        readOnly={!!taskId}
                                    />
                                </div>

                                <div className="col-12">
                                    <label className="form-label small fw-bold">
                                        <i className="fas fa-align-left text-primary me-2"></i>Work Description
                                    </label>
                                    <textarea
                                        name="description"
                                        className="form-control rounded-3"
                                        rows="4"
                                        placeholder="Describe the task details..."
                                        value={formData.description}
                                        onChange={handleChange}
                                        required
                                        readOnly={!!taskId}
                                    />
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label small fw-bold">
                                        <i className="fas fa-exclamation-circle text-primary me-2"></i>Priority
                                    </label>
                                    <select
                                        name="priority"
                                        className="form-select rounded-3"
                                        value={formData.priority}
                                        onChange={handleChange}
                                        required
                                        disabled={!!taskId}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label small fw-bold">
                                        <i className="fas fa-calendar-alt text-primary me-2"></i>Due Date
                                    </label>
                                    <input
                                        type="date"
                                        name="dueDate"
                                        className="form-control rounded-3"
                                        value={formData.dueDate}
                                        onChange={handleChange}
                                        required
                                        readOnly={!!taskId}
                                    />
                                </div>

                                <div className="col-12 mt-4">
                                    <button
                                        type="submit"
                                        className="btn-premium w-100 py-3 rounded-pill shadow"
                                        disabled={assignMutation.isLoading}
                                    >
                                        {assignMutation.isLoading ? (
                                            <><span className="spinner-border spinner-border-sm me-2"></span>Assigning...</>
                                        ) : (
                                            <><i className="fas fa-paper-plane me-2"></i> Assign Task to Member</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="col-lg-4">
                    <div className="premium-card h-100">
                        <h5 className="mb-4 d-flex align-items-center">
                            <i className="fas fa-users text-primary me-2"></i> Select Member
                        </h5>
                        <div className="member-list overflow-auto" style={{ maxHeight: '600px' }}>
                            {teamData?.team?.map(member => (
                                <div
                                    key={member._id}
                                    className={`member-card p-3 rounded-4 mb-3 cursor-pointer border ${formData.assignedTo === member._id ? 'border-primary bg-primary bg-opacity-10' : 'border-light'}`}
                                    onClick={() => setFormData(prev => ({ ...prev, assignedTo: member._id }))}
                                >
                                    <div className="d-flex align-items-center">
                                        <div className="avatar sm bg-light me-3 rounded-circle text-center" style={{ width: '40px', height: '40px', lineHeight: '40px' }}>
                                            {member.fullName?.charAt(0)}
                                        </div>
                                        <div>
                                            <h6 className="mb-0 small fw-bold">{member.fullName}</h6>
                                            <p className="extra-small text-muted mb-0">{member.position}</p>
                                        </div>
                                        {formData.assignedTo === member._id && (
                                            <i className="fas fa-check-circle text-primary ms-auto"></i>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssignTask;