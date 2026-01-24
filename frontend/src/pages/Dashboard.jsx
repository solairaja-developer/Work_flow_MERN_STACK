import React from 'react';
import { useQuery } from 'react-query';
import { taskAPI, staffAPI } from '../services/api';
import StatsCards from '../components/Dashboard/StatsCards';
import RecentTasks from '../components/Dashboard/RecentTasks';
import QuickAddTask from '../components/Dashboard/QuickAddTask';
import ProgressSummary from '../components/Dashboard/ProgressSummary';

const Dashboard = () => {
  // Fetch dashboard data
  const { data: taskStats, isLoading: tasksLoading } = useQuery(
    'taskStats',
    taskAPI.getStats
  );

  const { data: staffStats, isLoading: staffLoading } = useQuery(
    'staffStats',
    staffAPI.getStats
  );

  if (tasksLoading || staffLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Staff',
      value: staffStats?.total || 0,
      icon: 'fas fa-users',
      color: 'primary',
      change: '+12%'
    },
    {
      title: 'Active Work',
      value: taskStats?.total || 0,
      icon: 'fas fa-tasks',
      color: 'warning',
      change: '+8%'
    },
    {
      title: 'Completed Tasks',
      value: taskStats?.completed || 0,
      icon: 'fas fa-check-circle',
      color: 'success',
      change: '+24%'
    },
    {
      title: 'Pending Tasks',
      value: taskStats?.pending || 0,
      icon: 'fas fa-clock',
      color: 'danger',
      change: '-3%'
    }
  ];

  return (
    <div className="container-fluid">
      <div className="row mb-4">
        <div className="col-12">
          <div className="header">
            <div className="page-title">
              <h2>Dashboard</h2>
              <p>Welcome back!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        {stats.map((stat, index) => (
          <div key={index} className="col-xl-3 col-lg-6 mb-4">
            <StatsCards {...stat} />
          </div>
        ))}
      </div>

      <div className="row">
        <div className="col-lg-8">
          {/* Recent Activities */}
          <div className="card mb-4">
            <div className="card-header">
              <h5><i className="fas fa-chart-line me-2"></i> Recent Activities</h5>
              <a href="/tasks" className="btn btn-sm btn-outline-primary">
                View All
              </a>
            </div>
            <div className="card-body">
              <RecentTasks tasks={taskStats?.recentTasks || []} />
            </div>
          </div>

          {/* Quick Add Task */}
          <div className="card">
            <div className="card-header">
              <h5><i className="fas fa-plus-circle me-2"></i> Quick Add Task</h5>
            </div>
            <div className="card-body">
              <QuickAddTask />
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          {/* Progress Summary */}
          <div className="card mb-4">
            <div className="card-header">
              <h5><i className="fas fa-chart-pie me-2"></i> Progress Summary</h5>
            </div>
            <div className="card-body">
              <ProgressSummary stats={taskStats} />
            </div>
          </div>

          {/* Notifications */}
          <div className="card">
            <div className="card-header">
              <h5><i className="fas fa-bell me-2"></i> Notifications</h5>
              <button className="btn btn-sm btn-outline-primary">
                Mark All Read
              </button>
            </div>
            <div className="card-body">
              {/* Notifications list would go here */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;