import React from 'react';
import { useForm } from 'react-hook-form';

const TaskForm = ({ staffMembers, onSubmit, loading }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: {
      title: '',
      category: '',
      assignedTo: '',
      priority: 'medium',
      startDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: ''
    }
  });

  const handleFormSubmit = (data) => {
    onSubmit(data);
    reset();
  };

  return (
    <div className="card">
      <div className="card-header">
        <h5><i className="fas fa-plus-circle me-2"></i> Add New Work Task</h5>
      </div>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">
                <i className="fas fa-heading"></i> Work Title *
              </label>
              <input
                type="text"
                className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                placeholder="Enter work title"
                {...register('title', { required: 'Title is required' })}
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
                {...register('category', { required: 'Category is required' })}
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
                {...register('assignedTo', { required: 'Assign to is required' })}
              >
                <option value="">Select Staff Member</option>
                {staffMembers.map(staff => (
                  <option key={staff._id} value={staff.user?._id || staff._id}>
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
                {...register('priority', { required: 'Priority is required' })}
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
                {...register('startDate', { required: 'Start date is required' })}
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
                {...register('dueDate', { 
                  required: 'Due date is required',
                  validate: (value, formValues) => 
                    new Date(value) >= new Date(formValues.startDate) || 
                    'Due date must be after start date'
                })}
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
              rows="4"
              placeholder="Enter detailed work description..."
              {...register('description', { required: 'Description is required' })}
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
              accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt"
              {...register('attachment')}
            />
            <small className="text-muted">
              Accepted files: Images, PDF, Word, Text (max 10MB)
            </small>
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
    </div>
  );
};

export default TaskForm;