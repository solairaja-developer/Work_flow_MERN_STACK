import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { adminAPI, managerAPI, IMAGE_BASE_URL } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const DepartmentView = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    const [selectedDept, setSelectedDept] = useState('all');
    const [selectedStaffId, setSelectedStaffId] = useState('');

    const { data: usersData, isLoading: usersLoading } = useQuery(
        ['allUsersForDept'],
        () => isAdmin ? adminAPI.getUsers() : managerAPI.getTeam(),
        { staleTime: 60000 }
    );

    const { data: staffPerformance, isLoading: staffLoading } = useQuery(
        ['staffPerformance', selectedStaffId],
        () => (isAdmin ? adminAPI.getStaffPerformance(selectedStaffId) : managerAPI.getStaffPerformance(selectedStaffId)),
        { enabled: !!selectedStaffId }
    );

    if (usersLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    const users = isAdmin ? (usersData?.users || []) : (usersData?.team || []);
    
    // Group users by department
    const departments = users.reduce((acc, curr) => {
        const dept = curr.department || 'Unassigned';
        if (!acc[dept]) {
            acc[dept] = {
                name: dept,
                manager: [],
                staff: [],
                total: 0,
                allMembers: []
            };
        }
        acc[dept].allMembers.push(curr);
        if (curr.role === 'manager') acc[dept].manager.push(curr);
        else if (curr.role === 'staff') acc[dept].staff.push(curr);
        acc[dept].total++;
        return acc;
    }, {});

    const deptList = Object.values(departments).sort((a, b) => a.name.localeCompare(b.name));
    const allDeptNames = deptList.map(d => d.name);

    // Filtered members for dropdown
    const availableStaff = selectedDept === 'all' 
        ? users 
        : (departments[selectedDept]?.allMembers || []);

    return (
        <div className="container-fluid py-2">
            <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                    <h2 className="mb-0">Departmental Overview</h2>
                    <p className="text-muted mb-0">Browse through departments and their team structures</p>
                </div>
                <div className="d-flex gap-2">
                    {/* Department Dropdown */}
                    <select 
                        className="form-select border-0 shadow-sm rounded-pill px-3" 
                        style={{ width: '180px', fontSize: '0.85rem' }}
                        value={selectedDept}
                        onChange={(e) => {
                            setSelectedDept(e.target.value);
                            setSelectedStaffId(''); // Reset staff selection when dept changes
                        }}
                    >
                        <option value="all">All Departments</option>
                        {allDeptNames.map(name => (
                            <option key={name} value={name}>{name}</option>
                        ))}
                    </select>

                    {/* Staff Dropdown */}
                    <select 
                        className="form-select border-0 shadow-sm rounded-pill px-3" 
                        style={{ width: '180px', fontSize: '0.85rem' }}
                        value={selectedStaffId}
                        onChange={(e) => setSelectedStaffId(e.target.value)}
                    >
                        <option value="">Select Employee</option>
                        {availableStaff.map(s => (
                            <option key={s._id} value={s._id}>{s.fullName}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Department Cards Row */}
            <div className="row g-4 mb-5">
                {deptList.filter(d => selectedDept === 'all' || d.name === selectedDept).map((dept) => (
                    <div className="col-xl-4 col-md-6" key={dept.name}>
                        <div className="premium-card h-100 department-card">
                            <div className="d-flex justify-content-between align-items-start mb-4">
                                <div>
                                    <h4 className="mb-1 fw-bold">{dept.name}</h4>
                                    <span className="badge-premium bg-light text-primary border">
                                        {dept.total} Total Members
                                    </span>
                                </div>
                                <div className="btn-icon rounded-circle bg-primary-light text-primary">
                                    <i className={`fas ${dept.name === 'Diary' ? 'fa-book' : dept.name === 'Note Book' ? 'fa-sticky-note' : dept.name === 'Calendar' ? 'fa-calendar-alt' : 'fa-building'}`}></i>
                                </div>
                            </div>

                            <div className="mb-4">
                                <h6 className="text-uppercase extra-small fw-bold text-muted mb-3 ls-1">Department Manager</h6>
                                {dept.manager.length > 0 ? (
                                    dept.manager.map(mgr => (
                                        <div className="d-flex align-items-center p-3 rounded-4 bg-light mb-2 border border-dashed" key={mgr._id}>
                                            {mgr.profileImage ? (
                                                <img 
                                                    src={`${IMAGE_BASE_URL}/${mgr.profileImage}`} 
                                                    alt="" 
                                                    className="rounded-circle me-3" 
                                                    style={{ width: '38px', height: '38px', objectFit: 'cover' }} 
                                                />
                                            ) : (
                                                <div className="avatar sm bg-primary text-white me-3 rounded-circle shadow-sm">
                                                    {mgr.fullName.charAt(0)}
                                                </div>
                                            )}
                                            <div>
                                                <div className="fw-bold small">{mgr.fullName}</div>
                                                <div className="extra-small text-muted">{mgr.email}</div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-muted small p-3 rounded-4 border border-dashed text-center italic">
                                        No manager assigned
                                    </div>
                                )}
                            </div>

                            <div>
                                <h6 className="text-uppercase extra-small fw-bold text-muted mb-3 ls-1">Staff Members ({dept.staff.length})</h6>
                                <div className="staff-list-scroll pe-2" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                    {dept.staff.length > 0 ? (
                                        dept.staff.map(member => (
                                            <div className="d-flex align-items-center mb-2 p-2 hover-bg-light rounded-3 transition-3" key={member._id}>
                                                {member.profileImage ? (
                                                    <img 
                                                        src={`${IMAGE_BASE_URL}/${member.profileImage}`} 
                                                        alt="" 
                                                        className="rounded-circle me-2" 
                                                        style={{ width: '28px', height: '28px', objectFit: 'cover' }} 
                                                    />
                                                ) : (
                                                    <div className="avatar xs bg-info text-white me-2 rounded-circle" style={{ width: '28px', height: '28px', fontSize: '0.65rem', lineHeight: '28px' }}>
                                                        {member.fullName.charAt(0)}
                                                    </div>
                                                )}
                                                <div className="flex-grow-1">
                                                    <div className="fw-500 extra-small">{member.fullName}</div>
                                                </div>
                                                <span className={`dot ${member.status === 'active' ? 'bg-success' : 'bg-danger'}`} style={{ width: '5px', height: '5px' }}></span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-2 opacity-50">
                                            <p className="extra-small mb-0">No staff members</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Individual Staff Report Table */}
            {selectedStaffId && (
                <div className="premium-card mt-4">
                    <div className="d-flex align-items-center justify-content-between mb-4">
                        <h5 className="mb-0">
                            <i className="fas fa-user-chart text-primary me-2"></i> 
                            Staff Performance Report: {users.find(u => u._id === selectedStaffId)?.fullName}
                        </h5>
                        {staffLoading && <div className="spinner-border spinner-border-sm text-primary"></div>}
                    </div>

                    {staffPerformance?.performance ? (
                        <>
                            <div className="row g-3 mb-4">
                                <div className="col-md-3">
                                    <div className="p-3 bg-light rounded-4 text-center">
                                        <h3 className="mb-0 fw-bold text-primary">{staffPerformance.performance.totalTasks}</h3>
                                        <small className="text-muted text-uppercase fw-bold">Total Tasks</small>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="p-3 bg-light rounded-4 text-center">
                                        <h3 className="mb-0 fw-bold text-success">{staffPerformance.performance.completedTasks}</h3>
                                        <small className="text-muted text-uppercase fw-bold">Completed</small>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="p-3 bg-light rounded-4 text-center">
                                        <h3 className="mb-0 fw-bold text-warning">{staffPerformance.performance.onTimeRate}%</h3>
                                        <small className="text-muted text-uppercase fw-bold">On-Time Rate</small>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="p-3 bg-light rounded-4 text-center">
                                        <h3 className="mb-0 fw-bold text-info">{staffPerformance.performance.completionRate}%</h3>
                                        <small className="text-muted text-uppercase fw-bold">Efficiency</small>
                                    </div>
                                </div>
                            </div>

                            <div className="table-responsive">
                                <table className="premium-table">
                                    <thead>
                                        <tr>
                                            <th>Task Name</th>
                                            <th>Status</th>
                                            <th>Progress</th>
                                            <th>Priority</th>
                                            <th>Last Updated</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {staffPerformance.performance.recentActivity?.map(task => (
                                            <tr key={task._id}>
                                                <td className="fw-500">{task.title}</td>
                                                <td>
                                                    <span className={`badge-premium badge-${task.status.replace(' ', '_')}`}>
                                                        {task.status}
                                                    </span>
                                                </td>
                                                <td style={{ width: '150px' }}>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <div className="progress flex-grow-1" style={{ height: '5px' }}>
                                                            <div className="progress-bar bg-primary" style={{ width: `${task.progress}%` }}></div>
                                                        </div>
                                                        <small className="extra-small text-muted">{task.progress}%</small>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`text-${task.priority === 'High' ? 'danger' : task.priority === 'Medium' ? 'warning' : 'info'} small fw-bold`}>
                                                        {task.priority}
                                                    </span>
                                                </td>
                                                <td>{new Date(task.updatedAt).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                        {(!staffPerformance.performance.recentActivity || staffPerformance.performance.recentActivity.length === 0) && (
                                            <tr>
                                                <td colSpan="5" className="text-center py-4 text-muted">No recent activity found</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : !staffLoading && (
                        <div className="text-center py-5">
                            <i className="fas fa-chart-bar fa-3x mb-3 text-muted opacity-25"></i>
                            <p className="text-muted">No performance data available for this staff member.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DepartmentView;
