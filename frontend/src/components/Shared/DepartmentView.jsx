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

    const VALID_DEPARTMENTS = ['Diary', 'Note Book', 'Calendar'];
    const users = (isAdmin ? (usersData?.users || []) : (usersData?.team || []))
        .filter(u => VALID_DEPARTMENTS.includes(u.department));
    
    // Group users by department with more data
    const departments = users.reduce((acc, curr) => {
        const dept = curr.department || 'Unassigned';
        if (!acc[dept]) {
            acc[dept] = {
                name: dept,
                managers: [],
                staff: [],
                totalTasks: 0,
                completedTasks: 0,
                allMembers: []
            };
        }
        acc[dept].allMembers.push(curr);
        if (curr.role === 'manager') acc[dept].managers.push(curr);
        else if (curr.role === 'staff') {
            acc[dept].staff.push(curr);
            acc[dept].totalTasks += (curr.taskStats?.total || 0);
            acc[dept].completedTasks += (curr.taskStats?.completed || 0);
        }
        return acc;
    }, {});

    const deptList = Object.values(departments).sort((a, b) => a.name.localeCompare(b.name));
    const allDeptNames = deptList.map(d => d.name);

    // Filtered members for dropdown
    const availableStaff = selectedDept === 'all' 
        ? users 
        : (departments[selectedDept]?.allMembers || []);

    return (
        <div className="container-fluid py-4">
            {/* Header Section */}
            <div className="premium-card mb-4 border-0 bg-transparent shadow-none p-0">
                <div className="row align-items-center">
                    <div className="col-md-6 text-center text-md-start mb-3 mb-md-0">
                        <h2 className="fw-bold text-primary mb-1">
                            <i className="fas fa-building-user me-2"></i>
                            Departmental Governance
                        </h2>
                        <p className="text-muted small mb-0">Monitor team hierarchies and execution capabilities across {deptList.length} divisions</p>
                    </div>
                    <div className="col-md-6">
                        <div className="d-flex flex-column flex-sm-row flex-wrap gap-2 gap-md-3 justify-content-center justify-content-md-end">
                            <div className="search-group bg-white rounded-pill px-3 shadow-sm d-flex align-items-center border w-100 flex-sm-grow-0" style={{ maxWidth: '100%', flexBasis: 'auto' }}>
                                <i className="fas fa-filter text-muted me-2 small"></i>
                                <select 
                                    className="border-0 bg-transparent py-2 small fw-bold flex-grow-1" 
                                    style={{ outline: 'none', minWidth: '0' }}
                                    value={selectedDept}
                                    onChange={(e) => {
                                        setSelectedDept(e.target.value);
                                        setSelectedStaffId('');
                                    }}
                                >
                                    <option value="all">Global View (All)</option>
                                    {allDeptNames.map(name => (
                                        <option key={name} value={name}>{name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="search-group bg-white rounded-pill px-3 shadow-sm d-flex align-items-center border w-100 flex-sm-grow-0" style={{ maxWidth: '100%', flexBasis: 'auto' }}>
                                <i className="fas fa-user-tie text-muted me-2 small"></i>
                                <select 
                                    className="border-0 bg-transparent py-2 small fw-bold flex-grow-1" 
                                    style={{ outline: 'none', minWidth: '0' }}
                                    value={selectedStaffId}
                                    onChange={(e) => setSelectedStaffId(e.target.value)}
                                >
                                    <option value="">Performance Deep-Dive...</option>
                                    {availableStaff.map(s => (
                                        <option key={s._id} value={s._id}>{s.fullName}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Department Grid */}
            <div className="row g-4">
                {deptList.filter(d => selectedDept === 'all' || d.name === selectedDept).map((dept) => (
                    <div className="col-xl-4 col-lg-6" key={dept.name}>
                        <div className="premium-card border-0 shadow-sm h-100 p-0 overflow-hidden">
                            {/* Card Header (Dept Colored) */}
                            <div className="p-4 border-bottom bg-light">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div className="d-flex align-items-center">
                                        <div className="bg-primary text-white rounded-3 p-2 me-3 shadow-sm">
                                            <i className={`fas fa-lg ${dept.name === 'Diary' ? 'fa-book' : dept.name === 'Note Book' ? 'fa-sticky-note' : dept.name === 'Calendar' ? 'fa-calendar-alt' : 'fa-network-wired'}`}></i>
                                        </div>
                                        <div>
                                            <h5 className="mb-0 fw-bold">{dept.name}</h5>
                                            <span className="extra-small text-muted text-uppercase fw-bold ls-1">{dept.allMembers.length} Members</span>
                                        </div>
                                    </div>
                                    <div className="text-end">
                                        <div className="h5 mb-0 fw-bold text-success">
                                            {Math.round((dept.completedTasks / (dept.totalTasks || 1)) * 100)}%
                                        </div>
                                        <div className="extra-small text-muted fw-bold">EFFICIENCY</div>
                                    </div>
                                </div>
                                <div className="progress mt-3" style={{ height: '5px', borderRadius: '10px' }}>
                                    <div 
                                        className="progress-bar bg-success" 
                                        style={{ width: `${(dept.completedTasks / (dept.totalTasks || 1)) * 100}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="p-4">
                                {/* Manager Section */}
                                <div className="mb-4">
                                    <label className="text-muted extra-small fw-bold text-uppercase mb-3 d-block ls-1">Leadership</label>
                                    {dept.managers.length > 0 ? (
                                        dept.managers.map(mgr => (
                                            <div className="d-flex align-items-center mb-2 p-2 rounded-3 hover-bg-light border border-light" key={mgr._id}>
                                                <div className="position-relative">
                                                    {mgr.profileImage ? (
                                                        <img src={`${IMAGE_BASE_URL}/${mgr.profileImage}`} alt="" className="rounded-circle shadow-sm" style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div className="avatar sm bg-primary text-white rounded-circle shadow-sm">
                                                            {mgr.fullName.charAt(0)}
                                                        </div>
                                                    )}
                                                    <span className="position-absolute bottom-0 end-0 bg-success border border-white rounded-circle" style={{ width: '10px', height: '10px' }}></span>
                                                </div>
                                                <div className="ms-3">
                                                    <div className="fw-bold small">{mgr.fullName}</div>
                                                    <div className="extra-small text-muted">{mgr.position || 'Department Manager'}</div>
                                                </div>
                                                <div className="ms-auto no-print">
                                                    <button className="btn btn-xs btn-link text-primary p-0">
                                                        <i className="fas fa-envelope"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-3 rounded-3 border border-dashed bg-light">
                                            <span className="text-muted small italic">No Manager Appointed</span>
                                        </div>
                                    )}
                                </div>

                                {/* Staff Section */}
                                <div>
                                    <label className="text-muted extra-small fw-bold text-uppercase mb-3 d-block ls-1">Team Execution ({dept.staff.length})</label>
                                    <div className="staff-grid-compact d-flex flex-wrap gap-2">
                                        {dept.staff.length > 0 ? (
                                            dept.staff.slice(0, 7).map(member => (
                                                <div className="text-center" key={member._id} title={member.fullName} style={{ width: 'calc(25% - 8px)', minWidth: '45px' }}>
                                                    {member.profileImage ? (
                                                        <img src={`${IMAGE_BASE_URL}/${member.profileImage}`} alt="" className="rounded-circle border border-white shadow-sm mb-1 hover-scale" style={{ width: '32px', height: '32px', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div className="avatar xs bg-info text-white rounded-circle mx-auto mb-1 shadow-sm" style={{ width: '32px', height: '32px' }}>
                                                            {member.fullName.charAt(0)}
                                                        </div>
                                                    )}
                                                    <div className="extra-small truncate-1 text-muted" style={{ fontSize: '0.6rem' }}>{member.fullName.split(' ')[0]}</div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="col-12 text-center py-2">
                                                <span className="text-muted extra-small">Vacant</span>
                                            </div>
                                        )}
                                        {dept.staff.length > 7 && (
                                            <div className="text-center">
                                                <div className="avatar xs bg-light text-primary rounded-circle mx-auto mb-1 border shadow-sm fw-bold" style={{ width: '32px', height: '32px', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    +{dept.staff.length - 7}
                                                </div>
                                                <div className="extra-small text-muted" style={{ fontSize: '0.6rem' }}>More</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Card Footer Actions */}
                            <div className="px-4 py-3 bg-light border-top d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center">
                                    <i className="fas fa-tasks text-muted me-2 small"></i>
                                    <span className="small fw-bold text-muted">{dept.completedTasks}/{dept.totalTasks} Tasks</span>
                                </div>
                                <button className="btn btn-sm btn-outline-primary rounded-pill px-3" onClick={() => setSelectedDept(dept.name)}>
                                    Details <i className="fas fa-chevron-right ms-1 extra-small"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Performance Deep Dive Table Section */}
            {selectedStaffId && (
                <div className="premium-card mt-5 border-0 shadow-lg animate-up">
                    <div className="d-flex align-items-center justify-content-between mb-4 border-bottom pb-3">
                        <div className="d-flex align-items-center">
                            <div className="bg-primary text-white rounded-circle p-2 me-3">
                                <i className="fas fa-chart-line"></i>
                            </div>
                            <div>
                                <h5 className="mb-0 fw-bold">Individual Execution Analytics</h5>
                                <p className="text-muted small mb-0">Performance report for <span className="text-primary fw-bold">{users.find(u => u._id === selectedStaffId)?.fullName}</span></p>
                            </div>
                        </div>
                        <button className="btn-close" onClick={() => setSelectedStaffId('')}></button>
                    </div>

                    {staffPerformance?.performance ? (
                        <>
                            <div className="row g-4 mb-4">
                                {[
                                    { label: 'Total Tasks', value: staffPerformance.performance.totalTasks, color: 'primary', icon: 'fa-list-check' },
                                    { label: 'Completed', value: staffPerformance.performance.completedTasks, color: 'success', icon: 'fa-check-double' },
                                    { label: 'On-Time', value: `${staffPerformance.performance.onTimeRate}%`, color: 'warning', icon: 'fa-bolt' },
                                    { label: 'Efficiency', value: `${staffPerformance.performance.completionRate}%`, color: 'info', icon: 'fa-fire' }
                                ].map((stat, i) => (
                                    <div className="col-md-3" key={i}>
                                        <div className={`p-3 border-start border-${stat.color} border-4 bg-light rounded-3`}>
                                            <div className="d-flex justify-content-between align-items-start">
                                                <div>
                                                    <div className="h4 mb-0 fw-bold">{stat.value}</div>
                                                    <div className="extra-small text-muted fw-bold text-uppercase">{stat.label}</div>
                                                </div>
                                                <i className={`fas ${stat.icon} text-${stat.color} opacity-50`}></i>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="table-responsive rounded-3 border">
                                <table className="table table-hover mb-0">
                                    <thead className="bg-light">
                                        <tr className="extra-small text-uppercase fw-bold text-muted">
                                            <th className="px-4 py-3">Task Specification</th>
                                            <th className="py-3">Execution Status</th>
                                            <th className="py-3">Progress</th>
                                            <th className="py-3">Priority</th>
                                            <th className="py-3 text-end px-4">Last Activity</th>
                                        </tr>
                                    </thead>
                                    <tbody className="small">
                                        {staffPerformance.performance.recentActivity?.map(task => (
                                            <tr key={task._id} className="align-middle">
                                                <td className="px-4 py-3">
                                                    <div className="fw-bold text-dark">{task.title}</div>
                                                    <div className="extra-small text-muted">Work ID: #{task.workId || 'N/A'}</div>
                                                </td>
                                                <td>
                                                    <span className={`badge rounded-pill fw-500 bg-${task.status === 'completed' ? 'success-light text-success' : task.status === 'in_progress' ? 'primary-light text-primary' : 'warning-light text-warning'} px-3 py-1`}>
                                                        {task.status.replace('_', ' ').toUpperCase()}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <div className="progress flex-grow-1" style={{ height: '6px' }}>
                                                            <div className="progress-bar bg-primary" style={{ width: `${task.progress}%` }}></div>
                                                        </div>
                                                        <span className="fw-bold">{task.progress}%</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`text-${task.priority === 'High' ? 'danger' : task.priority === 'Medium' ? 'warning' : 'info'} fw-bold`}>
                                                        <i className="fas fa-circle me-1" style={{ fontSize: '6px' }}></i> {task.priority}
                                                    </span>
                                                </td>
                                                <td className="text-end px-4 text-muted">{new Date(task.updatedAt).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-5">
                            <div className="spinner-grow text-primary" role="status"></div>
                            <p className="mt-3 text-muted">Analyzing staff metrics...</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DepartmentView;
