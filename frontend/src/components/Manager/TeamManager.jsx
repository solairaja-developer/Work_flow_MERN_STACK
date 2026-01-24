// src/components/Manager/TeamManagement.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { managerAPI } from '../../services/api';
import { Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

const TeamManagement = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);

    const location = useLocation();

    // Auto-open modal if requested
    React.useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('action') === 'add') {
            setShowModal(true);
        }
    }, [location.search]);
    const [newStaff, setNewStaff] = useState({
        username: '',
        email: '',
        password: '',
        fullName: '',
        phone: '',
        position: 'Staff'
    });

    const { data: teamData, isLoading } = useQuery(
        ['team'],
        () => managerAPI.getTeam()
    );

    const addStaffMutation = useMutation(
        (data) => managerAPI.addStaff(data),
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['team']);
                toast.success('Staff member added successfully!');
                setShowModal(false);
                setNewStaff({ username: '', email: '', password: '', fullName: '', phone: '', position: 'Staff' });
            },
            onError: (error) => {
                toast.error(error.message || 'Failed to add staff');
            }
        }
    );

    const handleAddStaff = (e) => {
        e.preventDefault();
        addStaffMutation.mutate(newStaff);
    };

    const filteredTeam = teamData?.team?.filter(member =>
        member.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.position?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                    <h2 className="mb-0">Team Management</h2>
                    <p className="text-muted mb-0">Manage your department staff and their performance</p>
                </div>
                <button
                    className="btn-premium py-2 px-4 shadow-sm"
                    onClick={() => setShowModal(true)}
                >
                    <i className="fas fa-user-plus"></i> Add New Staff
                </button>
            </div>

            <div className="premium-card mb-4">
                <div className="row align-items-center">
                    <div className="col-md-6">
                        <div className="search-bar w-100 mb-0">
                            <i className="fas fa-search text-muted"></i>
                            <input
                                type="text"
                                placeholder="Search team members by name, email or position..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-4">
                {filteredTeam?.map(member => (
                    <div key={member._id} className="col-md-6 col-lg-4">
                        <div className="premium-card h-100">
                            <div className="d-flex align-items-center mb-4">
                                <div className="avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '60px', height: '60px', fontSize: '1.25rem' }}>
                                    {member.fullName?.charAt(0)}
                                </div>
                                <div>
                                    <h5 className="mb-0">{member.fullName}</h5>
                                    <span className="badge-premium badge-inprogress small">{member.position}</span>
                                </div>
                            </div>

                            <div className="grid-stats row mb-4 text-center">
                                <div className="col-6 border-end">
                                    <h4 className="mb-0">{member.taskStats?.total || 0}</h4>
                                    <small className="text-muted">Total Tasks</small>
                                </div>
                                <div className="col-6">
                                    <h4 className="mb-0 text-success">{member.taskStats?.completed || 0}</h4>
                                    <small className="text-muted">Completed</small>
                                </div>
                            </div>

                            <div className="contact-info bg-light p-3 rounded-3 mb-4">
                                <div className="d-flex align-items-center mb-2">
                                    <i className="fas fa-envelope text-primary me-2 small"></i>
                                    <span className="small text-muted text-ellipsis">{member.email}</span>
                                </div>
                                <div className="d-flex align-items-center">
                                    <i className="fas fa-id-card text-primary me-2 small"></i>
                                    <span className="small text-muted">{member.staffId}</span>
                                </div>
                            </div>

                            <div className="d-flex gap-2">
                                <Link
                                    to={`/manager/assign-task?staff=${member._id}`}
                                    className="btn btn-primary btn-sm flex-grow-1 rounded-pill"
                                >
                                    Assign Task
                                </Link>
                                <button className="btn btn-outline-secondary btn-sm rounded-pill">
                                    Performance
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Staff Modal */}
            {showModal && (
                <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 rounded-4 shadow-lg">
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title fw-bold">Add New Staff Member</h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <form onSubmit={handleAddStaff}>
                                <div className="modal-body py-4">
                                    <div className="row g-3">
                                        <div className="col-12">
                                            <label className="form-label small fw-bold"><i className="fas fa-signature text-primary me-2"></i>Full Name</label>
                                            <input type="text" className="form-control rounded-3" required
                                                value={newStaff.fullName} onChange={(e) => setNewStaff({ ...newStaff, fullName: e.target.value })} />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold"><i className="fas fa-user text-primary me-2"></i>Username</label>
                                            <input type="text" className="form-control rounded-3" required
                                                value={newStaff.username} onChange={(e) => setNewStaff({ ...newStaff, username: e.target.value })} />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold"><i className="fas fa-envelope text-primary me-2"></i>Email</label>
                                            <input type="email" className="form-control rounded-3" required
                                                value={newStaff.email} onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })} />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold"><i className="fas fa-lock text-primary me-2"></i>Password</label>
                                            <input type="password" className="form-control rounded-3" required
                                                value={newStaff.password} onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })} />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold"><i className="fas fa-briefcase text-primary me-2"></i>Position</label>
                                            <select className="form-select rounded-3"
                                                value={newStaff.position} onChange={(e) => setNewStaff({ ...newStaff, position: e.target.value })}>
                                                <option value="Staff">Staff</option>
                                                <option value="Supervisor">Supervisor</option>
                                            </select>
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label small fw-bold"><i className="fas fa-phone text-primary me-2"></i>Phone Number</label>
                                            <input type="text" className="form-control rounded-3" required
                                                value={newStaff.phone} onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer border-0 pt-0">
                                    <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setShowModal(false)}>Cancel</button>
                                    <button type="submit" className="btn-premium rounded-pill px-4" disabled={addStaffMutation.isLoading}>
                                        {addStaffMutation.isLoading ? 'Adding...' : 'Confirm Registration'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamManagement;