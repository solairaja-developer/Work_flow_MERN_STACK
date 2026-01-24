// src/components/Auth/Register.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        phone: '',
        department: '',
        position: 'Staff'
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    fullName: formData.fullName,
                    phone: formData.phone,
                    department: formData.department,
                    position: formData.position
                })
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Registration successful! Please login.');
                navigate('/login');
            } else {
                toast.error(data.message || 'Registration failed');
            }
        } catch (error) {
            toast.error('Error connecting to server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-gradient">
            <div className="auth-card" style={{ maxWidth: '600px' }}>
                <div className="text-center mb-5">
                    <div className="btn-icon rounded-circle bg-primary text-white mb-3 mx-auto" style={{ width: '60px', height: '60px', fontSize: '1.5rem' }}>
                        <i className="fas fa-user-plus"></i>
                    </div>
                    <h2 className="mb-1 fw-bold">Create Account</h2>
                    <p className="text-muted">Fill in the details to join the platform</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="row g-3">
                        <div className="col-md-6 mb-3">
                            <label className="form-label small fw-bold text-uppercase">Full Name *</label>
                            <input
                                type="text"
                                name="fullName"
                                className="form-control py-2 rounded-3"
                                placeholder="John Doe"
                                value={formData.fullName}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="col-md-6 mb-3">
                            <label className="form-label small fw-bold text-uppercase">Username *</label>
                            <input
                                type="text"
                                name="username"
                                className="form-control py-2 rounded-3"
                                placeholder="johndoe"
                                value={formData.username}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="mb-3">
                        <label className="form-label small fw-bold text-uppercase">Email Address *</label>
                        <input
                            type="email"
                            name="email"
                            className="form-control py-2 rounded-3"
                            placeholder="john@company.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="row g-3">
                        <div className="col-md-6 mb-3">
                            <label className="form-label small fw-bold text-uppercase">Password *</label>
                            <input
                                type="password"
                                name="password"
                                className="form-control py-2 rounded-3"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="col-md-6 mb-3">
                            <label className="form-label small fw-bold text-uppercase">Confirm Password *</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                className="form-control py-2 rounded-3"
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="row g-3">
                        <div className="col-md-6 mb-3">
                            <label className="form-label small fw-bold text-uppercase">Phone Number</label>
                            <input
                                type="tel"
                                name="phone"
                                className="form-control py-2 rounded-3"
                                placeholder="+1 (555) 000-0000"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="col-md-6 mb-3">
                            <label className="form-label small fw-bold text-uppercase">Department</label>
                            <select
                                name="department"
                                className="form-select py-2 rounded-3"
                                value={formData.department}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Department</option>
                                <option value="Diary">Diary</option>
                                <option value="Note Book">Note Book</option>
                                <option value="Calendar">Calendar</option>
                            </select>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="form-label small fw-bold text-uppercase">Role / Position</label>
                        <select
                            name="position"
                            className="form-select py-2 rounded-3"
                            value={formData.position}
                            onChange={handleChange}
                        >
                            <option value="Staff">Staff</option>
                            <option value="Manager">Manager</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="btn-premium w-100 justify-content-center py-3 mb-4"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2"></span>
                                Creating Account...
                            </>
                        ) : (
                            <>Register Now <i className="fas fa-user-check ms-2"></i></>
                        )}
                    </button>

                    <div className="text-center">
                        <p className="small text-muted mb-0">
                            Already have an account? <Link to="/login" className="text-primary text-decoration-none fw-bold">Sign In</Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;