import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Layout.css';

const Sidebar = ({ collapsed, isMobileOpen, toggleSidebar, closeMobileSidebar }) => {
  const { user } = useAuth();

  const menuItems = [
    {
      path: user?.role === 'admin' ? '/admin/dashboard' : user?.role === 'manager' ? '/manager/dashboard' : '/dashboard',
      icon: 'fas fa-th-large',
      label: 'Dashboard',
      roles: ['admin', 'manager', 'staff']
    },
    {
      path: '/admin/users?action=add',
      icon: 'fas fa-user-shield',
      label: 'User Management',
      roles: ['admin']
    },
    {
      path: '/admin/dashboard?action=add-work',
      icon: 'fas fa-file-signature',
      label: 'Add Work',
      roles: ['admin']
    },
    { path: '/manager/work-pool', icon: 'fas fa-layer-group', label: 'Available Work', roles: ['manager'] },
    { path: '/tasks', icon: 'fas fa-project-diagram', label: 'Task Status', roles: ['admin', 'manager', 'staff'] },
    { path: '/notifications', icon: 'fas fa-bell', label: 'Messages', roles: ['admin', 'manager', 'staff'] },
    { path: '/reports', icon: 'fas fa-chart-line', label: 'Analytics', roles: ['admin', 'manager'] },
  ];

  const filteredMenuItems = menuItems.filter(item =>
    item.roles.includes(user?.role || '')
  );

  const roleLabel = user?.role === 'admin' ? 'Admin' : user?.role === 'manager' ? 'Manager' : 'Staff';

  return (
    <>
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${isMobileOpen ? 'show' : ''}`}>
        <div className="logo-container">
          <NavLink to="/" className="logo" onClick={closeMobileSidebar}>
            <div className="logo-icon">
              <i className="fas fa-layer-group"></i>
            </div>
            {!collapsed && (
              <div className="logo-text">
                <h3>WorkFlow</h3>
                <p className="text-white-50 small">
                  {roleLabel} Portal {user?.department && `| ${user.department}`}
                </p>
              </div>
            )}
          </NavLink>
        </div>

        <ul className="nav-menu">
          {filteredMenuItems.map((item) => (
            <li key={item.path} className="menu-item">
              <NavLink
                to={item.path}
                className={({ isActive }) => isActive ? 'active' : ''}
                onClick={closeMobileSidebar}
                title={collapsed ? item.label : ''}
              >
                <i className={`menu-icon ${item.icon}`}></i>
                {!collapsed && <span className="menu-text">{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>

        {!collapsed && (
          <div className="sidebar-footer p-3 mt-auto">
            <div className="rounded-3 p-3 bg-white bg-opacity-10">
              <p className="extra-small text-white-50 mb-0">Logged in as</p>
              <p className="small mb-0 text-white truncate-1">{user?.fullName}</p>
              {user?.department && (
                <p className="extra-small text-white-50 mt-1 truncate-1">
                  <i className="fas fa-building me-1"></i> {user.department}
                </p>
              )}
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;