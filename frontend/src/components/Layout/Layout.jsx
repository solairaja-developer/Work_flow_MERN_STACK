// src/components/Layout/Layout.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import './Layout.css';

const Layout = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="layout">
            <Sidebar
                collapsed={collapsed}
                isMobileOpen={mobileOpen}
                closeMobileSidebar={() => setMobileOpen(false)}
            />

            <div className={`main-wrapper ${collapsed ? 'expanded' : ''}`}>
                {/* Top Header */}
                <header className="top-header">
                    <div className="d-flex align-items-center gap-3">
                        <button
                            className="btn-icon d-lg-none"
                            onClick={() => setMobileOpen(!mobileOpen)}
                        >
                            <i className="fas fa-bars"></i>
                        </button>
                        <button
                            className="btn-icon d-none d-lg-flex"
                            onClick={() => setCollapsed(!collapsed)}
                        >
                            <i className={`fas fa-${collapsed ? 'indent' : 'outdent'}`}></i>
                        </button>

                        <div className="search-bar d-none d-md-flex">
                            <i className="fas fa-search text-muted"></i>
                            <input type="text" placeholder="Search tasks, staff..." />
                        </div>
                    </div>

                    <div className="d-flex align-items-center gap-3">
                        <div className="btn-icon">
                            <i className="fas fa-bell"></i>
                        </div>

                        <div className="user-profile d-flex align-items-center gap-2 cursor-pointer" onClick={() => navigate('/profile')}>
                            <div className="avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                {user?.fullName?.charAt(0)}
                            </div>
                            <div className="d-none d-sm-block">
                                <h6 className="mb-0" style={{ fontSize: '0.9rem' }}>{user?.fullName}</h6>
                                <p className="mb-0 text-muted" style={{ fontSize: '0.75rem' }}>{user?.role}</p>
                            </div>
                        </div>

                        <button className="btn-icon text-danger" onClick={handleLogout} title="Logout">
                            <i className="fas fa-sign-out-alt"></i>
                        </button>
                    </div>
                </header>

                {/* Content Area */}
                <main className="fade-in">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;