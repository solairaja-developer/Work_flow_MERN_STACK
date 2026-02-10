// src/components/Auth/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { email, password } = formData;

        if (!email || !password) {
            toast.error('Please fill in all fields');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast.error('Please enter a valid email address');
            return;
        }

        setLoading(true);
        const result = await login(email, password);
        setLoading(false);

        if (result.success) {
            toast.success('Welcome back!');
            const user = result.user; // Use from result if available, or fetch
            if (user?.role === 'admin') {
                navigate('/admin/dashboard');
            } else if (user?.role === 'manager') {
                navigate('/manager/dashboard');
            } else {
                navigate('/dashboard');
            }
        } else {
            toast.error(result.message || 'Login failed');
        }
    };

    return (
        <div className="auth-gradient">
            <div className="auth-card">
                <div className="text-center mb-5">
                    <div className="btn-icon rounded-circle bg-primary text-white mb-3 mx-auto" style={{ width: '60px', height: '60px', fontSize: '1.5rem' }}>
                        <i className="fas fa-layer-group"></i>
                    </div>
                    <h2 className="mb-1 fw-bold">WorkFlow Sign In</h2>
                    <p className="text-muted">Enter your credentials to access your dashboard</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="form-label small fw-bold text-uppercase">Email Address</label>
                        <div className="input-group">
                            <span className="input-group-text bg-white border-end-0 rounded-start-3">
                                <i className="fas fa-envelope text-muted"></i>
                            </span>
                            <input
                                type="email"
                                name="email"
                                className="form-control border-start-0 rounded-end-3 py-2"
                                placeholder="name@company.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="form-label small fw-bold text-uppercase">Password</label>
                        <div className="input-group">
                            <span className="input-group-text bg-white border-end-0 rounded-start-3">
                                <i className="fas fa-lock text-muted"></i>
                            </span>
                            <input
                                type="password"
                                name="password"
                                className="form-control border-start-0 rounded-end-3 py-2"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn-premium w-100 justify-content-center py-3 mb-4"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2"></span>
                                Authenticating...
                            </>
                        ) : (
                            <>Sign In <i className="fas fa-arrow-right ms-2"></i></>
                        )}
                    </button>

                    <div className="text-center">
                        <p className="small text-muted mb-0">
                            Forgot your password? <button type="button" className="btn btn-link p-0 small text-decoration-none">Reset here</button>
                        </p>
                    </div>
                </form>

                <div className="mt-5 p-3 rounded-3 bg-light border border-dashed text-center">
                    <p className="extra-small text-muted mb-1 fw-bold text-uppercase">Admin Quick Access</p>
                    <code className="extra-small">admin@workflow.com / admin123</code>
                </div>
            </div>
        </div>
    );
};

export default Login;