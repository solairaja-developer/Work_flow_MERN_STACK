import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { IMAGE_BASE_URL } from '../../services/api';

const Header = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();

  return (
    <header className="header">
      <div className="page-title">
        <h2>{user?.role === 'admin' ? 'WorkFlow Admin' : user?.role === 'manager' ? `${user.department} Manager` : 'Staff Portal'}</h2>
        <p>Welcome, {user?.fullName || 'User'}!</p>
      </div>

      <div className="header-actions">
        <Link to="/notifications" className="notification-bell position-relative">
          <i className="fas fa-bell"></i>
          {unreadCount > 0 && (
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.6rem' }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>

        <div className="dropdown">
          <button
            className="btn btn-outline-primary dropdown-toggle d-flex align-items-center gap-2"
            type="button"
            data-bs-toggle="dropdown"
          >
            {user?.profileImage ? (
              <img 
                src={`${IMAGE_BASE_URL}/${user.profileImage}`} 
                alt="" 
                className="rounded-circle" 
                style={{ width: '24px', height: '24px', objectFit: 'cover' }} 
              />
            ) : (
              <i className="fas fa-user-circle"></i>
            )}
            <span>{user?.fullName || 'User'}</span>
          </button>
          <ul className="dropdown-menu dropdown-menu-end">
            <li><h6 className="dropdown-header">Logged in as</h6></li>
            <li><span className="dropdown-item-text"><strong>{user?.fullName}</strong></span></li>
            <li><span className="dropdown-item-text small text-muted">
              {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ''}
              {user?.department ? ` • ${user.department}` : ''}
            </span></li>
            <li><hr className="dropdown-divider" /></li>
            <li>
              <Link className="dropdown-item" to="/profile">
                <i className="fas fa-user me-2"></i> Profile
              </Link>
            </li>
            <li>
              <button className="dropdown-item" onClick={logout}>
                <i className="fas fa-sign-out-alt me-2"></i> Logout
              </button>
            </li>
          </ul>
        </div>

        <button className="toggle-btn" onClick={toggleSidebar}>
          <i className="fas fa-bars"></i>
        </button>
      </div>
    </header>
  );
};

export default Header;