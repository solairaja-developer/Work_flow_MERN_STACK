// src/components/Shared/Notifications.jsx
import React from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { sharedAPI } from '../../services/api';
import toast from 'react-hot-toast';

const Notifications = () => {
    const queryClient = useQueryClient();
    const { data: notifications, isLoading } = useQuery(
        ['notifications'],
        sharedAPI.getNotifications
    );

    const markAllReadMutation = useMutation(
        sharedAPI.markAllNotificationsRead,
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['notifications']);
                toast.success('All notifications marked as read');
            }
        }
    );

    if (isLoading) {
        return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;
    }

    return (
        <div className="container-fluid py-2">
            <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                    <h2 className="mb-0">Messages & Notifications</h2>
                    <p className="text-muted mb-0">Stay updated with your latest tasks and system alerts</p>
                </div>
                <button
                    className="btn btn-outline-primary rounded-pill px-4"
                    onClick={() => markAllReadMutation.mutate()}
                    disabled={notifications?.length === 0}
                >
                    Mark all as read
                </button>
            </div>

            <div className="premium-card">
                <div className="notification-list">
                    {notifications?.length > 0 ? (
                        notifications.map((notif) => (
                            <div key={notif._id} className={`p-4 mb-3 rounded-4 border-start border-4 ${notif.isRead ? 'bg-light border-light' : 'bg-white border-primary shadow-sm'}`}>
                                <div className="d-flex justify-content-between align-items-start">
                                    <div className="d-flex gap-3">
                                        <div className={`btn-icon rounded-circle ${notif.isRead ? 'bg-secondary text-white' : 'bg-primary text-white'}`}>
                                            <i className={notif.type === 'task_assigned' ? 'fas fa-tasks' : 'fas fa-bell'}></i>
                                        </div>
                                        <div>
                                            <h6 className={`mb-1 ${notif.isRead ? 'text-muted' : 'fw-bold'}`}>{notif.title}</h6>
                                            <p className="mb-2 text-muted">{notif.message}</p>
                                            <div className="d-flex align-items-center gap-3">
                                                <small className="text-muted">
                                                    <i className="far fa-clock me-1"></i>
                                                    {new Date(notif.createdAt).toLocaleString()}
                                                </small>
                                                {notif.senderName && (
                                                    <small className="text-muted">
                                                        <i className="far fa-user me-1"></i>
                                                        Sent by {notif.senderName}
                                                    </small>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {!notif.isRead && <span className="badge bg-primary rounded-pill">New</span>}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-5">
                            <i className="fas fa-envelope-open fa-3x text-muted mb-3 opacity-25"></i>
                            <h4>No notifications yet</h4>
                            <p className="text-muted">Tasks and updates will appear here</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Notifications;
