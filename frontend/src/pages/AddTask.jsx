import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { taskAPI, staffAPI } from '../services/api';
import toast from 'react-hot-toast';

const AddTask = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [staffMembers, setStaffMembers] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  
  // Fetch staff members for assignment
  const { data: staffData, isLoading: staffLoading } = useQuery(
    'staff',
    staffAPI.getAll,
    {
      onSuccess: (data) => {
        console.log('Staff data fetched:', data);
        if (Array.isArray(data)) {
          setStaffMembers(data);
        }
      },
      onError: (error) => {
        console.error('Error fetching staff:', error);
        toast.error('Failed to load staff members');
      }
    }
  );

  // Create task mutation
  const createTaskMutation = useMutation(taskAPI.create, {
    onSuccess: (data) => {
      toast.success('Task created successfully!');
      queryClient.invalidateQueries('taskStats');
      queryClient.invalidateQueries('tasks');
      navigate('/tasks');
    },
    onError: (error) => {
      console.error('Task creation error:', error);
      toast.error(error.response?.data?.message || 'Error creating task');
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const taskData = {
      title: formData.get('title'),
      category: formData.get('category'),
      assignedTo: formData.get('assignedTo'),
      priority: formData.get('priority'),
      startDate: formData.get('startDate'),
      dueDate: formData.get('dueDate'),
      description: formData.get('description')
    };

    // Validation
    if (!taskData.title || !taskData.category || !taskData.assignedTo || 
        !taskData.startDate || !taskData.dueDate || !taskData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (new Date(taskData.dueDate) < new Date(taskData.startDate)) {
      toast.error('Due date must be after start date');
      return;
    }

    createTaskMutation.mutate(taskData);
  };

  if (staffLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="row mb-4">
        <div className="col-12">
          <div className="header">
            <div className="page-title">
              <h2>Add New Work Task</h2>
              <p>Create and assign new tasks to staff members</p>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header">
              <h5><i className="fas fa-plus-circle me-2"></i> Add New Work Task</h5>
            </div>
            
            <form onSubmit={handleSubmit} className="card-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    <i className="fas fa-heading"></i> Work Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    className="form-control"
                    placeholder="Enter work title"
                    required
                  />
                </div>
                
                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    <i className="fas fa-layer-group"></i> Category *
                  </label>
                  <select
                    name="category"
                    className="form-select"
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="Diary">Diary</option>
                    <option value="Note Book">Note Book</option>
                    <option value="Calendar">Calendar</option>
                  </select>
                </div>
              </div>
              
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    <i className="fas fa-user-tie"></i> Assign To *
                  </label>
                  <select
                    name="assignedTo"
                    className="form-select"
                    required
                  >
                    <option value="">Select Staff Member</option>
                    {staffMembers.length > 0 ? (
                      staffMembers.map(staff => {
                        // Handle different response formats
                        const staffId = staff.user?._id || staff._id;
                        const staffName = staff.fullName || 'Unknown Staff';
                        const position = staff.position || 'Staff';
                        
                        return (
                          <option key={staff._id} value={staffId}>
                            {staffName} ({position})
                          </option>
                        );
                      })
                    ) : (
                      <option value="" disabled>No staff members available</option>
                    )}
                  </select>
                  {staffMembers.length === 0 && (
                    <small className="text-danger">
                      No active staff members found. Please add staff members first.
                    </small>
                  )}
                </div>
                
                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    <i className="fas fa-flag"></i> Priority *
                  </label>
                  <select
                    name="priority"
                    className="form-select"
                    required
                    defaultValue="medium"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    <i className="fas fa-calendar-alt"></i> Start Date *
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    className="form-control"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                
                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    <i className="fas fa-calendar-times"></i> Due Date *
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    className="form-control"
                    defaultValue={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>
              
              <div className="mb-3">
                <label className="form-label">
                  <i className="fas fa-align-left"></i> Description *
                </label>
                <textarea
                  name="description"
                  className="form-control"
                  rows="4"
                  placeholder="Enter detailed work description..."
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="form-label">
                  <i className="fas fa-paperclip"></i> Attachments (Optional)
                </label>
                <input
                  type="file"
                  name="attachment"
                  className="form-control"
                  accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt"
                />
                <small className="text-muted">
                  Accepted files: Images, PDF, Word, Text (max 10MB)
                </small>
              </div>
              
              <div className="d-flex justify-content-between mt-4 pt-3 border-top">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => navigate('/tasks')}
                >
                  <i className="fas fa-times me-2"></i> Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={createTaskMutation.isLoading || staffMembers.length === 0}
                >
                  {createTaskMutation.isLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin me-2"></i> Adding...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane me-2"></i> Add Work Task
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        <div className="col-lg-4">
          {/* Recent Tasks Sidebar */}
          <div className="card mb-4">
            <div className="card-header">
              <h5><i className="fas fa-history me-2"></i> Available Staff</h5>
            </div>
            <div className="card-body">
              {staffMembers.length > 0 ? (
                <div className="staff-list">
                  {staffMembers.map(staff => (
                    <div key={staff._id} className="mb-3 p-2 border rounded">
                      <strong>{staff.fullName}</strong>
                      <div className="d-flex justify-content-between">
                        <small className="text-muted">{staff.position}</small>
                        <small className="text-muted">{staff.department}</small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-center py-4">
                  No staff members available
                </p>
              )}
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="card">
            <div className="card-header">
              <h5><i className="fas fa-info-circle me-2"></i> Quick Info</h5>
            </div>
            <div className="card-body">
              <ul className="list-unstyled">
                <li className="mb-2">
                  <i className="fas fa-check-circle text-success me-2"></i>
                  <small>All fields marked with * are required</small>
                </li>
                <li className="mb-2">
                  <i className="fas fa-bell text-warning me-2"></i>
                  <small>Assigned staff will receive a notification</small>
                </li>
                <li className="mb-2">
                  <i className="fas fa-calendar text-info me-2"></i>
                  <small>Due date must be after start date</small>
                </li>
                <li>
                  <i className="fas fa-file text-primary me-2"></i>
                  <small>Maximum file size: 10MB</small>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTask;