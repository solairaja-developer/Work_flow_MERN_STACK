import React, { useState, useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import { useMutation, useQueryClient } from 'react-query';
import { staffAPI } from '../../services/api';
import toast from 'react-hot-toast';

const StaffForm = ({ show, onClose, staff = null }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    status: 'active',
    address: '',
    notes: ''
  });
  
  const [errors, setErrors] = useState({});
  const queryClient = useQueryClient();

  useEffect(() => {
    if (staff) {
      setFormData({
        fullName: staff.fullName,
        email: staff.email,
        phone: staff.phone,
        department: staff.department,
        position: staff.position,
        status: staff.status,
        address: staff.address || '',
        notes: staff.notes || ''
      });
    } else {
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        department: '',
        position: '',
        status: 'active',
        address: '',
        notes: ''
      });
    }
  }, [staff]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) newErrors.phone = 'Phone must be 10 digits';
    
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.position) newErrors.position = 'Position is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createMutation = useMutation(staffAPI.create, {
    onSuccess: (response) => {
      toast.success('Staff added successfully!');
      if (response.data.credentials) {
        toast(
          <div>
            <strong>Login Credentials:</strong><br />
            Username: {response.data.credentials.username}<br />
            Email: {response.data.credentials.email}<br />
            Password: {response.data.credentials.password}<br />
            <small className="text-danger">Staff should change password on first login!</small>
          </div>,
          { duration: 10000 }
        );
      }
      queryClient.invalidateQueries('staff');
      queryClient.invalidateQueries('staffStats');
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error adding staff');
    }
  });

  const updateMutation = useMutation(
    (data) => staffAPI.update(staff._id, data),
    {
      onSuccess: () => {
        toast.success('Staff updated successfully!');
        queryClient.invalidateQueries('staff');
        queryClient.invalidateQueries('staffStats');
        onClose();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Error updating staff');
      }
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const submissionData = {
      ...formData,
      phone: formData.phone.replace(/\D/g, '')
    };

    if (staff) {
      updateMutation.mutate(submissionData);
    } else {
      createMutation.mutate(submissionData);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const isLoading = createMutation.isLoading || updateMutation.isLoading;

  return (
    <Modal show={show} onHide={onClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          {staff ? 'Edit Staff Member' : 'Add New Staff Member'}
        </Modal.Title>
      </Modal.Header>
      <form onSubmit={handleSubmit}>
        <Modal.Body>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                name="fullName"
                className={`form-control ${errors.fullName ? 'is-invalid' : ''}`}
                value={formData.fullName}
                onChange={handleChange}
              />
              {errors.fullName && (
                <div className="invalid-feedback">{errors.fullName}</div>
              )}
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                name="email"
                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && (
                <div className="invalid-feedback">{errors.email}</div>
              )}
            </div>
          </div>
          
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Phone Number *</label>
              <input
                type="tel"
                name="phone"
                className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                value={formData.phone}
                onChange={handleChange}
                placeholder="10-digit number"
              />
              {errors.phone && (
                <div className="invalid-feedback">{errors.phone}</div>
              )}
              <small className="text-muted">Format: 9876543210</small>
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Department *</label>
              <select
                name="department"
                className={`form-select ${errors.department ? 'is-invalid' : ''}`}
                value={formData.department}
                onChange={handleChange}
              >
                <option value="">Select Department</option>
                <option value="Diary">Diary</option>
                <option value="Note Book">Note Book</option>
                <option value="Calendar">Calendar</option>
              </select>
              {errors.department && (
                <div className="invalid-feedback">{errors.department}</div>
              )}
            </div>
          </div>
          
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Position *</label>
              <select
                name="position"
                className={`form-select ${errors.position ? 'is-invalid' : ''}`}
                value={formData.position}
                onChange={handleChange}
              >
                <option value="">Select Position</option>
                <option value="Manager">Manager</option>
                <option value="Staff">Staff</option>
              </select>
              {errors.position && (
                <div className="invalid-feedback">{errors.position}</div>
              )}
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Status *</label>
              <select
                name="status"
                className="form-select"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          
          <div className="mb-3">
            <label className="form-label">Address</label>
            <textarea
              name="address"
              className="form-control"
              rows="3"
              value={formData.address}
              onChange={handleChange}
            />
          </div>
          
          <div className="mb-3">
            <label className="form-label">Notes</label>
            <textarea
              name="notes"
              className="form-control"
              rows="2"
              value={formData.notes}
              onChange={handleChange}
            />
          </div>
        </Modal.Body>
        
        <Modal.Footer>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                {staff ? 'Updating...' : 'Adding...'}
              </>
            ) : (
              staff ? 'Update Staff' : 'Add Staff'
            )}
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

export default StaffForm;