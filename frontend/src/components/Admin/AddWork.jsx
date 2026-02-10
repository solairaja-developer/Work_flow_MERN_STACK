import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const AddWork = () => {
    const [taskForm, setTaskForm] = useState({
        title: '',
        description: '',
        department: '',
        priority: 'medium',
        assignedTo: '',
        dueDate: ''
    });

    const queryClient = useQueryClient();
    const navigate = useNavigate();

    // Real-time data fetching with auto-refresh
    const { data: userData } = useQuery(
        ['allUsers'],
        () => adminAPI.getUsers(),
        {
            refetchInterval: 30000, // Refresh every 30 seconds
            refetchOnWindowFocus: true
        }
    );

    const { data: tasksData, isLoading: tasksLoading } = useQuery(
        ['allTasks'],
        () => adminAPI.getTasks(),
        {
            refetchInterval: 10000, // Refresh every 10 seconds for real-time updates
            refetchOnWindowFocus: true
        }
    );

    const createTaskMutation = useMutation(adminAPI.createTask, {
        onSuccess: () => {
            toast.success('Work added to pool successfully');
            queryClient.invalidateQueries(['allTasks']);
            queryClient.invalidateQueries(['adminDashboard']);
            setTaskForm({
                title: '',
                description: '',
                department: '',
                priority: 'medium',
                assignedTo: '',
                dueDate: ''
            });
        },
        onError: (err) => {
            toast.error(err.message || 'Error creating task');
        }
    });

    const allStaff = userData?.users?.filter(u => u.role === 'staff' || u.role === 'manager') || [];
    const departmentStaff = taskForm.department 
        ? allStaff.filter(s => s.department === taskForm.department) 
        : [];

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (taskForm.title.trim().length < 5) return toast.error('Task title must be at least 5 characters');
        if (taskForm.description.trim().length < 10) return toast.error('Description must be at least 10 characters');
        if (!taskForm.department) return toast.error('Please select a department');
        
        const selectedDate = new Date(taskForm.dueDate);
        const today = new Date();
        today.setHours(0,0,0,0);
        if (selectedDate < today) return toast.error('Due date cannot be in the past');

        createTaskMutation.mutate(taskForm);
    };

    const allTasks = tasksData?.tasks || [];

    return (
        <div className="container-fluid py-2 py-md-3">
            {/* Header Section - Responsive */}
            <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between mb-3 mb-md-4 gap-3">
                <div>
                    <h2 className="mb-1 fs-4 fs-md-3">Add New Work</h2>
                    <p className="text-muted mb-0 small">Create and assign work to departments and staff members</p>
                </div>
                <button
                    className="btn btn-light rounded-pill px-3 px-md-4 w-100 w-md-auto"
                    onClick={() => navigate('/admin/dashboard')}
                >
                    <i className="fas fa-arrow-left me-2"></i> Back to Dashboard
                </button>
            </div>

            <div className="row g-3 g-md-4">
                {/* Work Creation Form - Responsive */}
                <div className="col-12 col-lg-5 order-2 order-lg-1">
                    <div className="premium-card position-lg-sticky" style={{ top: '20px' }}>
                        <h5 className="mb-3 mb-md-4 d-flex align-items-center fs-6">
                            <i className="fas fa-plus-circle text-primary me-2"></i> Create New Work
                        </h5>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label small fw-bold">
                                    <i className="fas fa-heading text-primary me-2"></i>Title *
                                </label>
                                <input 
                                    type="text" 
                                    className="form-control rounded-3" 
                                    required 
                                    value={taskForm.title} 
                                    onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} 
                                    placeholder="Enter task title..."
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label small fw-bold">
                                    <i className="fas fa-align-left text-primary me-2"></i>Description *
                                </label>
                                <textarea 
                                    className="form-control rounded-3" 
                                    rows="3" 
                                    required 
                                    value={taskForm.description} 
                                    onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                                    placeholder="Describe the task details..."
                                />
                            </div>
                            <div className="row g-2 g-md-3">
                                <div className="col-12 col-sm-6 mb-2 mb-md-3">
                                    <label className="form-label small fw-bold">
                                        <i className="fas fa-building text-primary me-2"></i>Department *
                                    </label>
                                    <select 
                                        className="form-select rounded-3" 
                                        required 
                                        value={taskForm.department} 
                                        onChange={e => setTaskForm({ ...taskForm, department: e.target.value, assignedTo: '' })}
                                    >
                                        <option value="">Select Department</option>
                                        <option value="Diary">Diary</option>
                                        <option value="Note Book">Note Book</option>
                                        <option value="Calendar">Calendar</option>
                                    </select>
                                </div>
                                <div className="col-12 col-sm-6 mb-2 mb-md-3">
                                    <label className="form-label small fw-bold">
                                        <i className="fas fa-user-check text-primary me-2"></i>Assign Staff
                                    </label>
                                    <select 
                                        className="form-select rounded-3" 
                                        value={taskForm.assignedTo} 
                                        onChange={e => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                                        disabled={!taskForm.department}
                                    >
                                        <option value="">{taskForm.department ? 'Select Staff (Optional)' : 'Select Department First'}</option>
                                        {departmentStaff.map(staff => (
                                            <option key={staff._id} value={staff._id}>
                                                {staff.fullName} ({staff.staffId})
                                            </option>
                                        ))}
                                    </select>
                                    <small className="text-muted d-block mt-1">Leave empty to add to department work pool</small>
                                </div>
                            </div>
                            <div className="row g-2 g-md-3">
                                <div className="col-12 col-sm-6">
                                    <label className="form-label small fw-bold">
                                        <i className="fas fa-exclamation-circle text-primary me-2"></i>Priority
                                    </label>
                                    <select 
                                        className="form-select rounded-3" 
                                        value={taskForm.priority} 
                                        onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                                <div className="col-12 col-sm-6">
                                    <label className="form-label small fw-bold">
                                        <i className="fas fa-calendar-alt text-primary me-2"></i>Due Date *
                                    </label>
                                    <input 
                                        type="date" 
                                        className="form-control rounded-3" 
                                        required 
                                        value={taskForm.dueDate} 
                                        onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })} 
                                    />
                                </div>
                            </div>
                            <button 
                                type="submit" 
                                className="btn-premium w-100 rounded-pill px-4 mt-3 mt-md-4 py-2 py-md-3"
                                disabled={createTaskMutation.isLoading}
                            >
                                {createTaskMutation.isLoading ? (
                                    <><span className="spinner-border spinner-border-sm me-2"></span>Creating Work...</>
                                ) : (
                                    <><i className="fas fa-plus-circle me-2"></i>Create Work</>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Recently Added Works - Responsive */}
                <div className="col-12 col-lg-7 order-1 order-lg-2">
                    <div className="premium-card">
                        <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-3 mb-md-4 gap-2">
                            <h5 className="mb-0 fs-6">
                                <i className="fas fa-tasks text-primary me-2"></i> Recently Added Works
                            </h5>
                            <div className="d-flex align-items-center gap-2">
                                <span className="badge bg-primary rounded-pill px-3 py-2">
                                    {allTasks.length} Total
                                </span>
                                <button 
                                    className="btn btn-sm btn-outline-primary rounded-pill"
                                    onClick={() => queryClient.invalidateQueries(['allTasks'])}
                                    title="Refresh"
                                >
                                    <i className="fas fa-sync-alt"></i>
                                </button>
                            </div>
                        </div>

                        {tasksLoading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : allTasks.length > 0 ? (
                            <>
                                {/* Desktop Table View */}
                                <div className="table-responsive d-none d-md-block">
                                    <table className="premium-table">
                                        <thead>
                                            <tr>
                                                <th>Work ID</th>
                                                <th>Title</th>
                                                <th>Department</th>
                                                <th>Assigned To</th>
                                                <th>Status</th>
                                                <th>Priority</th>
                                                <th>Due Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {allTasks.slice(0, 10).map((task) => (
                                                <tr key={task._id}>
                                                    <td><span className="fw-bold small text-primary">{task.workId || 'N/A'}</span></td>
                                                    <td className="fw-500">{task.title}</td>
                                                    <td><span className="badge bg-soft-primary text-primary">{task.department}</span></td>
                                                    <td>{task.assignedTo?.fullName || <span className="text-muted small">Unassigned</span>}</td>
                                                    <td>
                                                        <span className={`badge-premium badge-${(task.status || 'pending').toLowerCase().replace(' ', '_')}`}>
                                                            {(task.status || 'pending').replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`badge-premium badge-${task.priority}`}>
                                                            {task.priority.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="small text-muted">
                                                        {new Date(task.dueDate).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Card View */}
                                <div className="d-md-none">
                                    {allTasks.slice(0, 10).map((task) => (
                                        <div key={task._id} className="card mb-3 border-0 shadow-sm">
                                            <div className="card-body p-3">
                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                    <h6 className="mb-1 fw-bold">{task.title}</h6>
                                                    <span className={`badge-premium badge-${task.priority} ms-2`}>
                                                        {task.priority.toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="small mb-2">
                                                    <span className="text-primary fw-bold me-2">#{task.workId || 'N/A'}</span>
                                                    <span className="badge bg-soft-primary text-primary">{task.department}</span>
                                                </div>
                                                <div className="d-flex justify-content-between align-items-center small">
                                                    <div>
                                                        <i className="fas fa-user me-1 text-muted"></i>
                                                        {task.assignedTo?.fullName || <span className="text-muted">Unassigned</span>}
                                                    </div>
                                                    <div className="text-muted">
                                                        <i className="fas fa-calendar me-1"></i>
                                                        {new Date(task.dueDate).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                <div className="mt-2">
                                                    <span className={`badge-premium badge-${(task.status || 'pending').toLowerCase().replace(' ', '_')}`}>
                                                        {(task.status || 'pending').replace('_', ' ')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-5">
                                <div className="btn-icon bg-light text-muted rounded-circle mx-auto mb-3" style={{ width: '60px', height: '60px' }}>
                                    <i className="fas fa-inbox fa-2x"></i>
                                </div>
                                <h5 className="text-muted">No Works Created Yet</h5>
                                <p className="text-muted small">Create your first work using the form</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddWork;
