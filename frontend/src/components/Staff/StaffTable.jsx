import React from 'react';

const StaffTable = ({ staff, onEdit, onDelete, onResetPassword }) => {
  const getDepartmentClass = (department) => {
    return `department-badge department-${department.replace(' ', '-')}`;
  };

  const getPositionClass = (position) => {
    return `position-badge position-${position}`;
  };

  const getInitials = (fullName) => {
    const parts = fullName.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  return (
    <div className="table-responsive">
      <table className="table table-hover">
        <thead>
          <tr>
            <th>ID</th>
            <th>Staff Member</th>
            <th>Email</th>
            <th>Department</th>
            <th>Position</th>
            <th>Status</th>
            <th>Phone</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {staff.length === 0 ? (
            <tr>
              <td colSpan="8" className="text-center py-5">
                <i className="fas fa-users fa-3x text-muted mb-3"></i>
                <h5>No staff members found</h5>
                <p className="text-muted">Add your first staff member</p>
              </td>
            </tr>
          ) : (
            staff.map((member) => (
              <tr key={member._id}>
                <td>
                  <span className="badge bg-light text-dark border">
                    {member.staffId || 'N/A'}
                  </span>
                </td>
                <td>
                  <div className="d-flex align-items-center">
                    <div className="flex-shrink-0 me-3">
                      <div className="staff-avatar-small">
                        {getInitials(member.fullName)}
                      </div>
                    </div>
                    <div className="flex-grow-1">
                      <strong className="d-block">{member.fullName}</strong>
                      <small className="text-muted">
                        Joined: {new Date(member.joinDate).toLocaleDateString()}
                      </small>
                    </div>
                  </div>
                </td>
                <td>
                  <small className="text-truncate d-block">
                    {member.email}
                  </small>
                </td>
                <td>
                  <span className={getDepartmentClass(member.department)}>
                    {member.department}
                  </span>
                </td>
                <td>
                  <span className={getPositionClass(member.position)}>
                    {member.position}
                  </span>
                </td>
                <td>
                  <span className={`badge bg-${member.status === 'active' ? 'success' : 'danger'}`}>
                    {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                  </span>
                </td>
                <td>
                  <small>{member.phone}</small>
                </td>
                <td>
                  <div className="btn-group-sm">
                    <button
                      className="btn btn-outline-primary me-1"
                      onClick={() => onEdit(member)}
                      title="Edit"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      className="btn btn-outline-warning me-1"
                      onClick={() => onResetPassword(member)}
                      title="Reset Password"
                    >
                      <i className="fas fa-key"></i>
                    </button>
                    <button
                      className="btn btn-outline-danger"
                      onClick={() => onDelete(member)}
                      title="Delete"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default StaffTable;