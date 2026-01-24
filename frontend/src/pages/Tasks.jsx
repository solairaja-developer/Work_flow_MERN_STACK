import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { taskAPI } from '../services/api';
import TaskCard from '../components/Tasks/TaskCard';
import TaskFilters from '../components/Tasks/TaskFilters';
import './Tasks.css';

const Tasks = () => {
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    priority: '',
    assignedTo: ''
  });

  // Fetch tasks with filters
  const { data: tasks = [], isLoading, error } = useQuery(
    ['tasks', filters],
    () => taskAPI.getAll(filters)
  );

  // Fetch task statistics
  const { data: stats } = useQuery('taskStats', taskAPI.getStats);

  if (error) {
    return (
      <div className="alert alert-danger">
        Error loading tasks: {error.message}
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="row mb-4">
        <div className="col-12">
          <div className="header">
            <div className="page-title">
              <h2>Tasks & Work Status</h2>
              <p>Track and manage all work tasks</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="row mb-4">
        <div className="col-xl-3 col-lg-6 mb-4">
          <div className="stats-card total-work">
            <div className="stats-icon">
              <i className="fas fa-tasks"></i>
            </div>
            <div className="stats-content">
              <h3>{stats?.total || 0}</h3>
              <p>Total Tasks</p>
            </div>
          </div>
        </div>
        
        <div className="col-xl-3 col-lg-6 mb-4">
          <div className="stats-card pending">
            <div className="stats-icon">
              <i className="fas fa-clock"></i>
            </div>
            <div className="stats-content">
              <h3>{stats?.pending || 0}</h3>
              <p>Pending</p>
            </div>
          </div>
        </div>
        
        <div className="col-xl-3 col-lg-6 mb-4">
          <div className="stats-card in-progress">
            <div className="stats-icon">
              <i className="fas fa-spinner fa-spin"></i>
            </div>
            <div className="stats-content">
              <h3>{stats?.inProgress || 0}</h3>
              <p>In Progress</p>
            </div>
          </div>
        </div>
        
        <div className="col-xl-3 col-lg-6 mb-4">
          <div className="stats-card completed">
            <div className="stats-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="stats-content">
              <h3>{stats?.completed || 0}</h3>
              <p>Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <TaskFilters filters={filters} onFilterChange={setFilters} />
        </div>
      </div>

      {/* Tasks List */}
      <div className="card">
        <div className="card-header">
          <h5><i className="fas fa-list me-2"></i> All Tasks</h5>
          <a href="/tasks/add" className="btn btn-sm btn-primary">
            <i className="fas fa-plus me-2"></i> Add New Task
          </a>
        </div>
        
        <div className="card-body">
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-tasks fa-3x text-muted mb-3"></i>
              <h5>No tasks found</h5>
              <p className="text-muted">Create your first task to get started</p>
              <a href="/tasks/add" className="btn btn-primary">
                <i className="fas fa-plus me-2"></i> Create Task
              </a>
            </div>
          ) : (
            <div className="row">
              {tasks.map(task => (
                <div key={task._id} className="col-lg-6 mb-4">
                  <TaskCard task={task} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tasks;