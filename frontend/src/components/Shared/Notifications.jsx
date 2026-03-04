// src/components/Shared/Notifications.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { sharedAPI, notificationAPI } from '../../services/api';
import toast from 'react-hot-toast';

const Notifications = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [selectedNotif, setSelectedNotif] = React.useState(null);

    const { data: notifications, isLoading } = useQuery(
        ['notifications'],
        sharedAPI.getNotifications,
        { refetchInterval: 30000 }
    );

    const markReadMutation = useMutation(
        (id) => notificationAPI.markAsRead(id),
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['notifications']);
            }
        }
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

    const handleNotifClick = (notif) => {
        setSelectedNotif(notif);
        if (!notif.isRead) {
            markReadMutation.mutate(notif._id);
        }
    };

    const handleAction = () => {
        if (selectedNotif?.link) {
            navigate(selectedNotif.link);
            setSelectedNotif(null);
        }
    };

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
                            <div 
                                key={notif._id} 
                                className={`p-4 mb-3 rounded-4 border-start border-4 transition-all hover-shadow cursor-pointer ${notif.isRead ? 'bg-light border-light' : 'bg-white border-primary shadow-sm'}`}
                                onClick={() => handleNotifClick(notif)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="d-flex justify-content-between align-items-start">
                                    <div className="d-flex gap-3">
                                        <div className={`btn-icon rounded-circle ${notif.isRead ? 'bg-secondary text-white' : 'bg-primary text-white'}`}>
                                            <i className={notif.type === 'task_assigned' ? 'fas fa-tasks' : 'fas fa-bell'}></i>
                                        </div>
                                        <div>
                                            <h6 className={`mb-1 ${notif.isRead ? 'text-muted' : 'fw-bold'}`}>{notif.title}</h6>
                                            <p className="mb-2 text-muted truncate-1">{notif.message}</p>
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

            {/* Notification View Modal */}
            {selectedNotif && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 rounded-4 shadow-lg animate-up">
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title fw-bold">Message Details</h5>
                                <button type="button" className="btn-close" onClick={() => setSelectedNotif(null)}></button>
                            </div>
                            <div className="modal-body p-4">
                                <div className="d-flex align-items-center gap-3 mb-4 p-3 bg-light rounded-3">
                                    <div className="btn-icon rounded-circle bg-primary text-white">
                                        <i className={selectedNotif.type === 'task_assigned' ? 'fas fa-tasks' : 'fas fa-bell'}></i>
                                    </div>
                                    <div>
                                        <h6 className="mb-0 fw-bold">{selectedNotif.title}</h6>
                                        <small className="text-muted">{new Date(selectedNotif.createdAt).toLocaleString()}</small>
                                    </div>
                                </div>
                                
                                <label className="extra-small text-muted text-uppercase fw-bold ls-1 mb-2">Message Content</label>
                                <div className="p-3 border rounded-3 bg-white mb-4">
                                    <p className="mb-0 text-dark" style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                                        {selectedNotif.message}
                                    </p>
                                </div>

                                {selectedNotif.senderName && (
                                    <div className="mb-4">
                                        <label className="extra-small text-muted text-uppercase fw-bold ls-1 mb-1">Sender Information</label>
                                        <div className="d-flex align-items-center gap-2">
                                            <div className="bg-primary bg-opacity-10 text-primary rounded-pill px-3 py-1 small fw-bold">
                                                <i className="fas fa-user-circle me-1"></i> {selectedNotif.senderName}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="d-flex gap-2">
                                    {selectedNotif.link && (
                                        <button className="btn btn-primary w-100 rounded-pill py-2 fw-bold" onClick={handleAction}>
                                            <i className="fas fa-external-link-alt me-2"></i> View Related Task
                                        </button>
                                    )}
                                    <button className="btn btn-light w-100 rounded-pill py-2 fw-bold" onClick={() => setSelectedNotif(null)}>
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Notifications;
