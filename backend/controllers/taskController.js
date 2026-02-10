const Task = require('../models/Task');
const User = require('../models/User');
const Notification = require('../models/Notification');

exports.createTask = async (req, res) => {
  try {
    const {
      title,
      assignedTo,
      priority,
      startDate,
      dueDate,
      description
    } = req.body;

    console.log('Creating task with data:', {
      title, assignedTo, priority, startDate, dueDate, description
    });

    // Check if assigned user exists
    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser) {
      return res.status(404).json({ message: 'Assigned user not found' });
    }

    // Create task
    const task = new Task({
      title,
      assignedTo,
      createdBy: req.user.id,
      priority: priority || 'medium',
      startDate: new Date(startDate),
      dueDate: new Date(dueDate),
      description,
      status: 'pending',
      progress: 0
    });

    // Handle file upload if exists
    if (req.file) {
      task.attachment = `/uploads/${req.file.filename}`;
    }

    await task.save();
    console.log('Task saved successfully:', task._id);

    // Create notification for assigned user
    const notification = new Notification({
      user: assignedTo,
      type: 'task_assigned',
      title: 'New Task Assigned',
      message: `You have been assigned a new task: ${title}`,
      link: `/tasks/${task._id}`,
      sender: req.user.id,
      senderName: req.user.fullName || 'System'
    });

    await notification.save();

    res.status(201).json({
      message: 'Task created successfully',
      task: {
        ...task.toObject(),
        workId: task.workId // Ensure workId is included in response
      },
      notification
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getAllTasks = async (req, res) => {
  try {
    const { status, priority, assignedTo } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;

    // If user is not admin, filter based on role
    if (req.user.role === 'manager') {
      filter.department = req.user.department;
    } else if (req.user.role === 'staff') {
      filter.assignedTo = req.user.id;
    }

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'fullName email')
      .populate('createdBy', 'fullName email')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getTaskStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let filter = {};
    if (userRole !== 'admin') {
      filter.assignedTo = userId;
    }

    const total = await Task.countDocuments(filter);
    const pending = await Task.countDocuments({ ...filter, status: 'pending' });
    const inProgress = await Task.countDocuments({ ...filter, status: 'in_progress' });
    const completed = await Task.countDocuments({ ...filter, status: 'completed' });

    // Get overdue tasks
    const overdue = await Task.countDocuments({
      ...filter,
      dueDate: { $lt: new Date() },
      status: { $in: ['pending', 'in_progress'] }
    });

    // Get recent tasks
    const recentTasks = await Task.find(filter)
      .populate('assignedTo', 'fullName')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      total,
      pending,
      inProgress,
      completed,
      overdue,
      recentTasks
    });
  } catch (error) {
    console.error('Error fetching task stats:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && task.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    const updates = req.body;

    // If status is changing, create notification
    if (updates.status && updates.status !== task.status) {
      const notification = new Notification({
        user: task.createdBy,
        type: 'task_updated',
        title: 'Task Status Updated',
        message: `Task "${task.title}" status changed from ${task.status} to ${updates.status}`,
        link: `/tasks/${task._id}`,
        sender: req.user.id,
        senderName: req.user.fullName
      });
      await notification.save();
    }

    // Update task
    Object.keys(updates).forEach(key => {
      task[key] = updates[key];
    });

    await task.save();

    res.json({ message: 'Task updated successfully', task });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this task' });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: error.message });
  }
};