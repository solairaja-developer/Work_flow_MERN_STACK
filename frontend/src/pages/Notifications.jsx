import React from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { notificationAPI } from '../services/api';
import toast from 'react-hot-toast';
import './Notifications.css';

const Notifications = () => {
  const queryClient = useQueryClient();
  
  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery(
    'notifications',
    notificationAPI.getAll
  );

  // Mark as read mutation
  const markAsReadMutation = useMutation(notificationAPI.markAsRead, {
    onSuccess: () => {
      queryClient.invalidateQueries('notifications');
      toast.success('Notification marked as read');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error updating notification');
    }
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation(notificationAPI.markAllAsRead, {
    onSuccess: () => {
      queryClient.invalidateQueries('notifications');
      toast.success('All notifications marked as read');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error updating notifications');
    }
  });

  const handleMarkAsRead = (id) => {
    markAsReadMutation.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    if (notifications.some(n => !n.isRead)) {
      markAllAsReadMutation.mutate();
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      task_assigned: 'fas fa-tasks',
      task_completed: 'fas fa-check-circle',
      task_updated: 'fas fa-sync',
      message: 'fas fa-envelope',
      system: 'fas fa-cog',
      warning: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle'
    };
    return icons[type] || 'fas fa-bell';
  };

  const getNotificationColor = (type) => {
    const colors = {
      task_assigned: 'primary',
      task_completed: 'success',
      task_updated: 'info',
      message: 'warning',
      system: 'secondary',
      warning: 'danger',
      info: 'info'
    };
    return colors[type] || 'secondary';
  };

  const formatTime = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hour${Math.floor(diffInMinutes / 60) > 1 ? 's' : ''} ago`;
    return notificationDate.toLocaleDateString();
  };

  return (
    <div className="container-fluid">
      <div className="row mb-4">
        <div className="col-12">
          <div className="header">
            <div className="page-title">
              <h2>Notifications</h2>
              <p>Stay updated with system alerts</p>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header">
              <h5><i className="fas fa-bell me-2"></i> All Notifications</h5>
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={handleMarkAllAsRead}
                disabled={markAllAsReadMutation.isLoading || !notifications.some(n => !n.isRead)}
              >
                {markAllAsReadMutation.isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin me-2"></i>
                    Processing...
                  </>
                ) : (
                  'Mark All Read'
                )}
              </button>
            </div>
            
            <div className="card-body p-0">
              {isLoading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-bell-slash fa-3x text-muted mb-3"></i>
                  <h5>No notifications</h5>
                  <p className="text-muted">You're all caught up!</p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {notifications.map(notification => (
                    <div
                      key={notification._id}
                      className={`list-group-item border-0 px-4 py-3 notification-item ${
                        !notification.isRead ? 'unread' : ''
                      }`}
                      onClick={() => handleMarkAsRead(notification._id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="d-flex">
                          <div className={`notification-icon bg-${getNotificationColor(notification.type)}`}>
                            <i className={getNotificationIcon(notification.type)}></i>
                          </div>
                          <div className="ms-3">
                            <h6 className="mb-1">{notification.title}</h6>
                            <p className="mb-1">{notification.message}</p>
                            {notification.senderName && notification.senderName !== 'System' && (
                              <small className="text-muted d-block">
                                From: {notification.senderName}
                              </small>
                            )}
                            <small className="text-muted">
                              {formatTime(notification.createdAt)}
                            </small>
                          </div>
                        </div>
                        {!notification.isRead && (
                          <span className="badge bg-primary">New</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="col-lg-4">
          {/* Notification Stats */}
          <div className="card mb-4">
            <div className="card-header">
              <h5><i className="fas fa-chart-bar me-2"></i> Notification Stats</h5>
            </div>
            <div className="card-body">
              <div className="notification-stats">
                <div className="stat-item">
                  <span className="stat-label">Total</span>
                  <span className="stat-value">{notifications.length}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Unread</span>
                  <span className="stat-value">
                    {notifications.filter(n => !n.isRead).length}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Read</span>
                  <span className="stat-value">
                    {notifications.filter(n => n.isRead).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Notification Types */}
          <div className="card">
            <div className="card-header">
              <h5><i className="fas fa-filter me-2"></i> Notification Types</h5>
            </div>
            <div className="card-body">
              <div className="notification-types">
                {['task_assigned', 'task_completed', 'message', 'system'].map(type => {
                  const count = notifications.filter(n => n.type === type).length;
                  return count > 0 && (
                    <div key={type} className="type-item">
                      <i className={`${getNotificationIcon(type)} text-${getNotificationColor(type)} me-2`}></i>
                      <span className="type-label">
                        {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      <span className="type-count">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;