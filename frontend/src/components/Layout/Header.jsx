import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <div className="page-title">
        <h2>{user?.role === 'admin' ? 'WorkFlow Admin' : user?.role === 'manager' ? `${user.department} Manager` : 'Staff Portal'}</h2>
        <p>Welcome, {user?.fullName || 'User'}!</p>
      </div>

      <div className="header-actions">
        <div className="notification-bell">
          <i className="fas fa-bell"></i>
        </div>

        <div className="dropdown">
          <button
            className="btn btn-outline-primary dropdown-toggle"
            type="button"
            data-bs-toggle="dropdown"
          >
            <i className="fas fa-user-circle me-2"></i>
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