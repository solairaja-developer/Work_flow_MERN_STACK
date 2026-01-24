import React from 'react';
import { Link } from 'react-router-dom';

const RecentTasks = ({ tasks = [] }) => {
  if (tasks.length === 0) {
    return (
      <p className="text-muted text-center py-4">No recent tasks found.</p>
    );
  }

  const getPriorityBadge = (priority) => {
    const classes = {
      low: 'badge bg-success',
      medium: 'badge bg-warning',
      high: 'badge bg-danger',
      urgent: 'badge bg-purple'
    };
    return classes[priority] || 'badge bg-secondary';
  };

  return (
    <div className="recent-tasks">
      {tasks.map(task => (
        <div key={task._id} className="task-item mb-3 p-3 border rounded">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <Link to={`/tasks/${task._id}`} className="task-title">
              <strong>{task.title}</strong>
            </Link>
            <span className={getPriorityBadge(task.priority)}>
              {task.priority}
            </span>
          </div>
          <div className="task-details">
            <small className="text-muted">
              <i className="fas fa-user me-1"></i>
              {task.assignedTo?.fullName || 'Unassigned'}
            </small>
            <small className="text-muted ms-3">
              <i className="fas fa-calendar me-1"></i>
              Due: {new Date(task.dueDate).toLocaleDateString()}
            </small>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecentTasks;