// src/components/Admin/UserManagement.jsx
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { adminAPI, managerAPI, IMAGE_BASE_URL } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const UserManagement = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const queryClient = useQueryClient();

    const location = useLocation();

    // Auto-open modal if requested
    React.useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('action') === 'add') {
            setShowAddModal(true);
        }
    }, [location.search]);

    const { user: currentUser } = useAuth();
    const isAdmin = currentUser?.role === 'admin';

    const { data, isLoading } = useQuery(
        ['users'],
        () => isAdmin ? adminAPI.getUsers() : managerAPI.getTeam(),
        {
            refetchInterval: 20000, // Auto-refresh every 20 seconds
            refetchOnWindowFocus: true
        }
    );

    const users = isAdmin ? (data?.users || []) : (data?.team || []);

    const createMutation = useMutation(isAdmin ? adminAPI.createUser : managerAPI.addStaff, {
        onSuccess: () => {
            toast.success(isAdmin ? 'User created successfully' : 'Staff member added successfully');
            queryClient.invalidateQueries(['users']);
            setShowAddModal(false);
        },
        onError: (error) => {
            toast.error(error.message || 'Error creating user');
        }
    });

    const updateMutation = useMutation(
        ({ id, ...data }) => adminAPI.updateUser(id, data),
        {
            onSuccess: () => {
                toast.success('User updated successfully');
                queryClient.invalidateQueries(['users']);
                setShowAddModal(false);
                setEditingUser(null);
            },
            onError: (error) => {
                toast.error(error.message || 'Error updating user');
            }
        }
    );

    const deleteMutation = useMutation(adminAPI.deleteUser, {
        onSuccess: () => {
            toast.success('User deleted successfully');
            queryClient.invalidateQueries(['users']);
        },
        onError: (error) => {
            toast.error(error.message || 'Error deleting user');
        }
    });

    const filteredUsers = users.filter(user =>
        user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDelete = (userId) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            deleteMutation.mutate(userId);
        }
    };

    const handleAddUser = (userData) => {
        createMutation.mutate(userData);
    };

    const handleEditUser = (userData) => {
        updateMutation.mutate({ id: editingUser._id, ...userData });
    };

    if (isLoading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid py-2">
            <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                    <h2 className="mb-0">User Management</h2>
                    <p className="text-muted mb-0">Manage system users, roles and permissions</p>
                </div>
                <button
                    className="btn-premium py-2 px-4 shadow-sm"
                    onClick={() => setShowAddModal(true)}
                >
                    <i className="fas fa-plus"></i> Add New User
                </button>
            </div>

            <div className="premium-card mb-4">
                <div className="row align-items-center">
                    <div className="col-md-6">
                        <div className="search-bar w-100 mb-0">
                            <i className="fas fa-search text-muted"></i>
                            <input
                                type="text"
                                placeholder="Search by name, email or role..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="premium-card">
                <div className="table-responsive">
                    <table className="premium-table">
                        <thead>
                            <tr>
                                <th>Staff ID</th>
                                <th>Full Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Department</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => (
                                <tr key={user._id}>
                                    <td className="fw-bold text-primary">{user.staffId || 'N/A'}</td>
                                    <td>
                                        <div className="d-flex align-items-center">
                                            {user.profileImage ? (
                                                <img 
                                                    src={`${IMAGE_BASE_URL}/${user.profileImage}`} 
                                                    alt={user.fullName} 
                                                    className="avatar sm me-2 rounded-circle border shadow-sm"
                                                    style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                                                    onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=' + user.fullName; }}
                                                />
                                            ) : (
                                                <div className="avatar sm bg-light me-2 rounded-circle text-center" style={{ width: '32px', height: '32px', fontSize: '0.8rem', lineHeight: '32px' }}>
                                                    {user.fullName?.charAt(0)}
                                                </div>
                                            )}
                                            {user.fullName}
                                        </div>
                                    </td>
                                    <td><span className="text-muted small">{user.email}</span></td>
                                    <td>
                                        <span className={`badge-premium badge-${user.role === 'admin' ? 'pending' : user.role === 'manager' ? 'inprogress' : 'completed'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td>{user.department}</td>
                                    <td>
                                        <span className={`dot ${user.status === 'active' ? 'bg-success' : 'bg-danger'} me-2`} style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%' }}></span>
                                        {user.status}
                                    </td>
                                    <td>
                                        <div className="d-flex gap-2">
                                            <button
                                                className="btn-icon bg-light text-info"
                                                onClick={() => {
                                                    setEditingUser(user);
                                                    setShowAddModal(true);
                                                }}
                                                title="Edit User"
                                            >
                                                <i className="fas fa-edit"></i>
                                            </button>
                                            <button
                                                className="btn-icon bg-light text-danger"
                                                onClick={() => handleDelete(user._id)}
                                                title="Delete User"
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredUsers.length === 0 && (
                        <div className="text-center py-5 text-muted">
                            <i className="fas fa-users-slash fa-3x mb-3 opacity-25"></i>
                            <p>No users found matching your search</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit User Modal */}
            {showAddModal && (
                <UserModal
                    show={showAddModal}
                    onClose={() => {
                        setShowAddModal(false);
                        setEditingUser(null);
                    }}
                    onSubmit={editingUser ? handleEditUser : handleAddUser}
                    loading={editingUser ? updateMutation.isLoading : createMutation.isLoading}
                    user={editingUser}
                    isAdmin={isAdmin}
                />
            )}
        </div>
    );
};

const UserModal = ({ show, onClose, onSubmit, loading, user = null, isAdmin }) => {
    const [formData, setFormData] = useState({
        username: user?.username || '',
        email: user?.email || '',
        password: '',
        fullName: user?.fullName || '',
        role: user?.role || 'staff',
        department: user?.department || '',
        phone: user?.phone || '',
        position: user?.position || 'Staff',
        profileImage: null
    });

    const [previewUrl, setPreviewUrl] = useState(user?.profileImage ? `${IMAGE_BASE_URL}/${user.profileImage}` : null);

    React.useEffect(() => {
        if (user) {
            setFormData({
                username: user.username || '',
                email: user.email || '',
                password: '', // Password should not be pre-filled for security
                fullName: user.fullName || '',
                role: user.role || 'staff',
                department: user.department || '',
                phone: user.phone || '',
                position: user.position || 'Staff'
            });
        } else {
            setFormData({
                username: '',
                email: '',
                password: '',
                fullName: '',
                role: 'staff',
                department: '',
                phone: '',
                position: 'Staff',
                profileImage: null
            });
            setPreviewUrl(null);
        }
    }, [user]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, profileImage: file });
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Full Validation
        if (formData.fullName.trim().length < 3) {
            toast.error('Full Name must be at least 3 characters');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            toast.error('Please enter a valid email address');
            return;
        }

        if (formData.username.trim().length < 4) {
            toast.error('Username must be at least 4 characters');
            return;
        }

        if (!user && formData.password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        if (isAdmin && !formData.department) {
            toast.error('Please select a department');
            return;
        }

        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (formData[key] !== null && formData[key] !== '') {
                data.append(key, formData[key]);
            }
        });
        onSubmit(data);
    };

    if (!show) return null;

    return (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content border-0 rounded-4 shadow-lg">
                    <div className="modal-header border-0 pb-0">
                        <h5 className="modal-title fw-bold">
                            <i className="fas fa-user-plus text-primary me-2"></i>
                            {user ? 'Edit System User' : 'Register New User'}
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body py-4">
                            <div className="row g-3">
                                <div className="col-12 text-center mb-3">
                                    <div className="position-relative d-inline-block">
                                        <div className="avatar-upload rounded-circle border overflow-hidden shadow-sm" style={{ width: '100px', height: '100px', margin: '0 auto', background: '#f8f9fa' }}>
                                            {previewUrl ? (
                                                <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <div className="h-100 d-flex align-items-center justify-content-center text-muted">
                                                    <i className="fas fa-user-circle fa-4x"></i>
                                                </div>
                                            )}
                                        </div>
                                        <label htmlFor="imageUpload" className="btn btn-sm btn-primary position-absolute bottom-0 end-0 rounded-circle" style={{ width: '32px', height: '32px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>
                                            <i className="fas fa-camera"></i>
                                        </label>
                                        <input 
                                            type="file" 
                                            id="imageUpload" 
                                            accept="image/*" 
                                            className="d-none" 
                                            onChange={handleFileChange} 
                                        />
                                    </div>
                                    <p className="mt-2 small text-muted">Click to upload profile photo</p>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label small fw-bold">Full Name *</label>
                                    <input
                                        type="text"
                                        className="form-control rounded-3"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label small fw-bold">Email Address *</label>
                                    <input
                                        type="email"
                                        className="form-control rounded-3"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label small fw-bold">Username *</label>
                                    <input
                                        type="text"
                                        className="form-control rounded-3"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label small fw-bold">
                                        {user ? 'New Password' : 'Password *'}
                                    </label>
                                    <input
                                        type="password"
                                        className="form-control rounded-3"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required={!user}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label small fw-bold">Phone Number</label>
                                    <input
                                        type="tel"
                                        className="form-control rounded-3"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                {isAdmin && (
                                    <>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold">Assign Role *</label>
                                            <select
                                                className="form-select rounded-3"
                                                value={formData.role}
                                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                                required
                                            >
                                                <option value="staff">Staff</option>
                                                <option value="manager">Manager</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold">Department *</label>
                                            <select
                                                className="form-select rounded-3"
                                                value={formData.department}
                                                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                                required
                                            >
                                                <option value="">Select Department</option>
                                                <option value="Diary">Diary</option>
                                                <option value="Note Book">Note Book</option>
                                                <option value="Calendar">Calendar</option>
                                            </select>
                                        </div>
                                    </>
                                )}
                                <div className="col-md-6">
                                    <label className="form-label small fw-bold">Position</label>
                                    <input
                                        type="text"
                                        className="form-control rounded-3"
                                        value={formData.position}
                                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer border-0 pt-0">
                            <button type="button" className="btn btn-light rounded-pill px-4" onClick={onClose}>
                                Cancel
                            </button>
                            <button type="submit" className="btn-premium rounded-pill px-4" disabled={loading}>
                                {loading ? 'Processing...' : user ? 'Update User' : 'Register Member'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;