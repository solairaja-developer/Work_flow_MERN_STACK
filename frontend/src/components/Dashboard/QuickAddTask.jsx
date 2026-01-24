import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { taskAPI } from '../../services/api';
import toast from 'react-hot-toast';

const QuickAddTask = () => {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const createTaskMutation = useMutation(taskAPI.create, {
    onSuccess: () => {
      queryClient.invalidateQueries('taskStats');
      toast.success('Task added successfully!');
      setTitle('');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error adding task');
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    const taskData = {
      title,
      category: 'General',
      assignedTo: '', // You might want to set a default or get from context
      priority: 'medium',
      startDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: title
    };

    createTaskMutation.mutate(taskData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Enter task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={createTaskMutation.isLoading}
        />
      </div>
      <button
        type="submit"
        className="btn btn-primary w-100"
        disabled={createTaskMutation.isLoading}
      >
        {createTaskMutation.isLoading ? (
          <>
            <i className="fas fa-spinner fa-spin me-2"></i>
            Adding...
          </>
        ) : (
          <>
            <i className="fas fa-plus me-2"></i>
            Add Quick Task
          </>
        )}
      </button>
    </form>
  );
};

export default QuickAddTask;