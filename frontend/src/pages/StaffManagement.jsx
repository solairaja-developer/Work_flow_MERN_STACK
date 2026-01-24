import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { staffAPI } from '../services/api';
import toast from 'react-hot-toast';
import StaffForm from '../components/Staff/StaffForm';
import StaffTable from '../components/Staff/StaffTable';

const StaffManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const queryClient = useQueryClient();

  // Fetch staff data - ensure we get an array
  const { 
    data: staffResponse, 
    isLoading, 
    error 
  } = useQuery('staff', staffAPI.getAll, {
    // Transform the response to ensure we always get an array
    select: (data) => {
      // If data is already an array, return it
      if (Array.isArray(data)) return data;
      
      // If data has a data property that's an array (common with Axios)
      if (data && Array.isArray(data.data)) return data.data;
      
      // If data has a results property
      if (data && Array.isArray(data.results)) return data.results;
      
      // If data is an object with staff array
      if (data && data.staff && Array.isArray(data.staff)) return data.staff;
      
      // Default to empty array
      console.warn('Unexpected staff data format:', data);
      return [];
    }
  });

  // Fetch staff stats
  const { data: stats } = useQuery('staffStats', staffAPI.getStats);

  // Delete staff mutation
  const deleteMutation = useMutation(staffAPI.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries('staff');
      queryClient.invalidateQueries('staffStats');
      toast.success('Staff deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error deleting staff');
    }
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation(staffAPI.resetPassword, {
    onSuccess: (data) => {
      toast.success(`Password reset to: ${data.data.newPassword}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error resetting password');
    }
  });

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleDelete = (staff) => {
    if (window.confirm(`Are you sure you want to delete ${staff.fullName}?`)) {
      deleteMutation.mutate(staff._id);
    }
  };

  const handleResetPassword = (staff) => {
    if (window.confirm(`Reset password for ${staff.fullName}? The new password will be their phone number.`)) {
      resetPasswordMutation.mutate(staff._id);
    }
  };

  // Ensure staff is always an array
  const staff = Array.isArray(staffResponse) ? staffResponse : [];
  
  // Filter staff based on search term
  const filteredStaff = staff.filter(s => {
    if (!s) return false;
    
    const nameMatch = s.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const emailMatch = s.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const positionMatch = s.position?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    
    return nameMatch || emailMatch || positionMatch;
  });

  if (error) {
    return (
      <div className="alert alert-danger">
        Error loading staff data: {error.message}
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-xl-3 col-lg-6 mb-4">
          <div className="stats-card total-staff">
            <div className="stats-icon">
              <i className="fas fa-users"></i>
            </div>
            <div className="stats-content">
              <h3>{stats?.total || 0}</h3>
              <p>Total Staff</p>
            </div>
          </div>
        </div>
        
        <div className="col-xl-3 col-lg-6 mb-4">
          <div className="stats-card active-staff">
            <div className="stats-icon">
              <i className="fas fa-user-check"></i>
            </div>
            <div className="stats-content">
              <h3>{stats?.active || 0}</h3>
              <p>Active Staff</p>
            </div>
          </div>
        </div>
        
        <div className="col-xl-3 col-lg-6 mb-4">
          <div className="stats-card inactive-staff">
            <div className="stats-icon">
              <i className="fas fa-user-clock"></i>
            </div>
            <div className="stats-content">
              <h3>{stats?.inactive || 0}</h3>
              <p>Inactive Staff</p>
            </div>
          </div>
        </div>
        
        <div className="col-xl-3 col-lg-6 mb-4">
          <div className="stats-card new-staff">
            <div className="stats-icon">
              <i className="fas fa-user-plus"></i>
            </div>
            <div className="stats-content">
              <h3>{stats?.newThisMonth || 0}</h3>
              <p>New This Month</p>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Management Card */}
      <div className="card">
        <div className="card-header">
          <h5><i className="fas fa-users me-2"></i> Staff Management</h5>
          <div className="d-flex align-items-center gap-3">
            <div className="search-box">
              <div className="position-relative">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search staff..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
            >
              <i className="fas fa-plus me-2"></i> Add Staff
            </button>
          </div>
        </div>
        
        <div className="card-body">
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <StaffTable
              staff={filteredStaff}
              onEdit={setEditingStaff}
              onDelete={handleDelete}
              onResetPassword={handleResetPassword}
            />
          )}
        </div>
      </div>

      {/* Add/Edit Modals */}
      {showAddModal && (
        <StaffForm
          show={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            queryClient.invalidateQueries('staff');
            queryClient.invalidateQueries('staffStats');
          }}
        />
      )}

      {editingStaff && (
        <StaffForm
          show={!!editingStaff}
          staff={editingStaff}
          onClose={() => setEditingStaff(null)}
          onSuccess={() => {
            setEditingStaff(null);
            queryClient.invalidateQueries('staff');
            queryClient.invalidateQueries('staffStats');
          }}
        />
      )}
    </div>
  );
};

export default StaffManagement;