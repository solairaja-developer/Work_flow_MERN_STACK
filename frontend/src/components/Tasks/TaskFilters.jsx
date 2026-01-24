import React from 'react';

const TaskFilters = ({ filters, onFilterChange }) => {
  const handleFilterChange = (field, value) => {
    onFilterChange({
      ...filters,
      [field]: value
    });
  };

  const clearFilters = () => {
    onFilterChange({
      status: '',
      category: '',
      priority: '',
      assignedTo: ''
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <div className="task-filters">
      <div className="row">
        <div className="col-md-3 mb-3">
          <label className="form-label">Status</label>
          <select
            className="form-select"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        
        <div className="col-md-3 mb-3">
          <label className="form-label">Category</label>
          <select
            className="form-select"
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="Diary">Diary</option>
            <option value="Note Book">Note Book</option>
            <option value="Calendar">Calendar</option>
          </select>
        </div>
        
        <div className="col-md-3 mb-3">
          <label className="form-label">Priority</label>
          <select
            className="form-select"
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        
        <div className="col-md-3 mb-3 d-flex align-items-end">
          <div className="w-100">
            <label className="form-label">&nbsp;</label>
            <div className="d-flex gap-2">
              {hasActiveFilters && (
                <button
                  className="btn btn-outline-secondary flex-grow-1"
                  onClick={clearFilters}
                >
                  <i className="fas fa-times me-2"></i>
                  Clear Filters
                </button>
              )}
              <button
                className="btn btn-primary flex-grow-1"
                onClick={() => {
                  // Trigger filter application
                  onFilterChange({ ...filters });
                }}
              >
                <i className="fas fa-filter me-2"></i>
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {hasActiveFilters && (
        <div className="active-filters mt-3">
          <small className="text-muted me-2">Active filters:</small>
          {Object.entries(filters).map(([key, value]) => {
            if (!value) return null;
            
            let displayValue = value;
            if (key === 'status') {
              displayValue = value.replace('_', ' ');
            }
            
            return (
              <span key={key} className="badge bg-info me-2">
                {key}: {displayValue}
                <button
                  className="btn-close btn-close-white ms-2"
                  style={{ fontSize: '0.6rem' }}
                  onClick={() => handleFilterChange(key, '')}
                ></button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TaskFilters;