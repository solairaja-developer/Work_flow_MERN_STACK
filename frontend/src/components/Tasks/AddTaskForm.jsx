import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { taskAPI } from '../../services/api';
import toast from 'react-hot-toast';

const schema = yup.object({
  title: yup.string().required('Title is required'),
  category: yup.string().required('Category is required'),
  assignedTo: yup.string().required('Assign to is required'),
  priority: yup.string().required('Priority is required'),
  startDate: yup.date().required('Start date is required'),
  dueDate: yup.date()
    .required('Due date is required')
    .min(yup.ref('startDate'), 'Due date must be after start date'),
  description: yup.string().required('Description is required'),
});

const AddTaskForm = ({ staffMembers, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [attachment, setAttachment] = useState(null);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      startDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: 'medium',
    }
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        formData.append(key, data[key]);
      });
      
      if (attachment) {
        formData.append('attachment', attachment);
      }

      const response = await taskAPI.create(formData);
      
      toast.success(response.data.message);
      reset();
      setAttachment(null);
      
      if (onSuccess) {
        onSuccess(response.data.task);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error creating task');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      
      // Validate file type
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast.error('Invalid file type');
        return;
      }
      
      setAttachment(file);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card">
      <div className="card-header">
        <h5><i className="fas fa-plus-circle me-2"></i> Add New Work Task</h5>
      </div>
      
      <div className="card-body">
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">
              <i className="fas fa-heading"></i> Work Title *
            </label>
            <input
              type="text"
              className={`form-control ${errors.title ? 'is-invalid' : ''}`}
              {...register('title')}
              placeholder="Enter work title"
            />
            {errors.title && (
              <div className="invalid-feedback">{errors.title.message}</div>
            )}
          </div>
          
          <div className="col-md-6 mb-3">
            <label className="form-label">
              <i className="fas fa-layer-group"></i> Category *
            </label>
            <select
              className={`form-select ${errors.category ? 'is-invalid' : ''}`}
              {...register('category')}
            >
              <option value="">Select Category</option>
              <option value="Diary">Diary</option>
              <option value="Note Book">Note Book</option>
              <option value="Calendar">Calendar</option>
            </select>
            {errors.category && (
              <div className="invalid-feedback">{errors.category.message}</div>
            )}
          </div>
        </div>
        
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">
              <i className="fas fa-user-tie"></i> Assign To *
            </label>
            <select
              className={`form-select ${errors.assignedTo ? 'is-invalid' : ''}`}
              {...register('assignedTo')}
            >
              <option value="">Select Staff Member</option>
              {staffMembers.map(staff => (
                <option key={staff._id} value={staff.user._id}>
                  {staff.fullName} ({staff.position})
                </option>
              ))}
            </select>
            {errors.assignedTo && (
              <div className="invalid-feedback">{errors.assignedTo.message}</div>
            )}
          </div>
          
          <div className="col-md-6 mb-3">
            <label className="form-label">
              <i className="fas fa-flag"></i> Priority *
            </label>
            <select
              className={`form-select ${errors.priority ? 'is-invalid' : ''}`}
              {...register('priority')}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            {errors.priority && (
              <div className="invalid-feedback">{errors.priority.message}</div>
            )}
          </div>
        </div>
        
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">
              <i className="fas fa-calendar-alt"></i> Start Date *
            </label>
            <input
              type="date"
              className={`form-control ${errors.startDate ? 'is-invalid' : ''}`}
              {...register('startDate')}
            />
            {errors.startDate && (
              <div className="invalid-feedback">{errors.startDate.message}</div>
            )}
          </div>
          
          <div className="col-md-6 mb-3">
            <label className="form-label">
              <i className="fas fa-calendar-times"></i> Due Date *
            </label>
            <input
              type="date"
              className={`form-control ${errors.dueDate ? 'is-invalid' : ''}`}
              {...register('dueDate')}
            />
            {errors.dueDate && (
              <div className="invalid-feedback">{errors.dueDate.message}</div>
            )}
          </div>
        </div>
        
        <div className="mb-3">
          <label className="form-label">
            <i className="fas fa-align-left"></i> Description *
          </label>
          <textarea
            className={`form-control ${errors.description ? 'is-invalid' : ''}`}
            {...register('description')}
            rows="4"
            placeholder="Enter detailed work description..."
          />
          {errors.description && (
            <div className="invalid-feedback">{errors.description.message}</div>
          )}
        </div>
        
        <div className="mb-4">
          <label className="form-label">
            <i className="fas fa-paperclip"></i> Attachments (Optional)
          </label>
          <input
            type="file"
            className="form-control"
            onChange={handleFileChange}
            accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt"
          />
          <small className="text-muted">
            Accepted files: Images, PDF, Word, Text (max 10MB)
          </small>
          {attachment && (
            <div className="mt-2">
              <small>Selected: {attachment.name}</small>
            </div>
          )}
        </div>
        
        <div className="d-flex justify-content-between mt-4 pt-3 border-top">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => reset()}
          >
            <i className="fas fa-redo me-2"></i> Reset Form
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
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
      </div>
    </form>
  );
};

export default AddTaskForm;