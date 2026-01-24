import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from 'react-query';
import { taskAPI } from '../../services/api';
import toast from 'react-hot-toast';

const TaskCard = ({ task }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const getPriorityBadge = (priority) => {
    const classes = {
      low: 'priority-low',
      medium: 'priority-medium',
      high: 'priority-high',
      urgent: 'priority-urgent'
    };
    return classes[priority] || 'priority-medium';
  };

  const getStatusBadge = (status) => {
    const classes = {
      pending: 'badge bg-warning',
      in_progress: 'badge bg-info',
      completed: 'badge bg-success',
      cancelled: 'badge bg-danger'
    };
    return classes[status] || 'badge bg-secondary';
  };

  const updateMutation = useMutation(
    (data) => taskAPI.update(task._id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tasks');
        queryClient.invalidateQueries('taskStats');
        toast.success('Task updated successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Error updating task');
      }
    }
  );

  const deleteMutation = useMutation(
    () => taskAPI.delete(task._id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tasks');
        queryClient.invalidateQueries('taskStats');
        toast.success('Task deleted successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Error deleting task');
      }
    }
  );

  const handleStatusChange = (newStatus) => {
    updateMutation.mutate({ status: newStatus });
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteMutation.mutate();
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateDaysLeft = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: 'Overdue', class: 'text-danger' };
    if (diffDays === 0) return { text: 'Due today', class: 'text-warning' };
    if (diffDays <= 3) return { text: `Due in ${diffDays} days`, class: 'text-warning' };
    return { text: `Due in ${diffDays} days`, class: 'text-success' };
  };

  const daysLeft = calculateDaysLeft(task.dueDate);

  return (
    <div className="task-card">
      <div className="task-header">
        <span className="task-id">{task.workId}</span>
        <span className={`priority-badge ${getPriorityBadge(task.priority)}`}>
          {task.priority}
        </span>
      </div>
      
      <h6 className="task-title">{task.title}</h6>
      
      <div className="task-details">
        <p className="mb-2">
          <i className="fas fa-user-tie me-2"></i>
          {task.assignedTo?.fullName || 'Unassigned'}
        </p>
        <p className="mb-2">
          <i className="fas fa-calendar-alt me-2"></i>
          Due: {formatDate(task.dueDate)}
          <small className={`ms-2 ${daysLeft.class}`}>
            ({daysLeft.text})
          </small>
        </p>
        <p className="mb-2">
          <i className="fas fa-layer-group me-2"></i>
          Category: {task.category}
        </p>
      </div>
      
      <div className="task-progress">
        <div className="d-flex justify-content-between mb-1">
          <span>Progress: {task.progress || 0}%</span>
          <span className={getStatusBadge(task.status).replace('badge ', '')}>
            {task.status.replace('_', ' ')}
          </span>
        </div>
        <div className="progress">
          <div 
            className="progress-bar" 
            style={{ width: `${task.progress || 0}%` }}
          ></div>
        </div>
      </div>
      
      <div className="task-actions">
        <button
          className="btn btn-sm btn-outline-primary"
          onClick={() => navigate(`/tasks/${task._id}`)}
        >
          <i className="fas fa-eye me-1"></i> View
        </button>
        
        {task.status !== 'completed' && (
          <button
            className="btn btn-sm btn-outline-success"
            onClick={() => handleStatusChange('completed')}
            disabled={updateMutation.isLoading}
          >
            <i className="fas fa-check me-1"></i> Complete
          </button>
        )}
        
        {task.status === 'pending' && (
          <button
            className="btn btn-sm btn-outline-info"
            onClick={() => handleStatusChange('in_progress')}
            disabled={updateMutation.isLoading}
          >
            <i className="fas fa-play me-1"></i> Start
          </button>
        )}
        
        <button
          className="btn btn-sm btn-outline-danger"
          onClick={handleDelete}
          disabled={deleteMutation.isLoading}
        >
          <i className="fas fa-trash me-1"></i> Delete
        </button>
      </div>
    </div>
  );
};

export default TaskCard;