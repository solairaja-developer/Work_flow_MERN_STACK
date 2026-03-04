// backend/controllers/staffController.js
const User = require('../models/User');
const Task = require('../models/Task');
const Notification = require('../models/Notification');

// Get Staff Dashboard Stats
exports.getStaffDashboard = async (req, res) => {
    try {
        const staffId = req.user.id;

        const [
            totalTasks,
            pendingTasks,
            inProgressTasks,
            completedTasks,
            overdueTasks,
            recentTasks,
            notifications
        ] = await Promise.all([
            Task.countDocuments({ assignedTo: staffId }),
            Task.countDocuments({
                assignedTo: staffId,
                status: 'pending'
            }),
            Task.countDocuments({
                assignedTo: staffId,
                status: 'in_progress'
            }),
            Task.countDocuments({
                assignedTo: staffId,
                status: 'completed'
            }),
            Task.countDocuments({
                assignedTo: staffId,
                dueDate: { $lt: new Date() },
                status: { $in: ['pending', 'in_progress'] }
            }),
            Task.find({ assignedTo: staffId })
                .sort({ createdAt: -1 })
                .limit(5),
            Notification.find({
                user: staffId,
                isRead: false
            })
                .sort({ createdAt: -1 })
                .limit(5)
        ]);

        // Weekly progress
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const weeklyTasks = await Task.aggregate([
            {
                $match: {
                    assignedTo: staffId,
                    createdAt: { $gte: oneWeekAgo }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                    },
                    count: { $sum: 1 },
                    completed: {
                        $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
                    }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            success: true,
            dashboard: {
                stats: {
                    totalTasks,
                    pendingTasks,
                    inProgressTasks,
                    completedTasks,
                    overdueTasks
                },
                recentTasks,
                notifications,
                weeklyProgress: weeklyTasks
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get My Tasks
exports.getMyTasks = async (req, res) => {
    try {
        const staffId = req.user.id;
        const { status, priority, category, search } = req.query;

        let filter = { assignedTo: staffId };

        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        if (category) filter.category = category;

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { workId: { $regex: search, $options: 'i' } }
            ];
        }

        const tasks = await Task.find(filter)
            .populate('assignedBy', 'fullName')
            .sort({ dueDate: 1 });

        res.json({
            success: true,
            tasks,
            total: tasks.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update Task Progress
exports.updateTaskProgress = async (req, res) => {
    try {
        const staffId = req.user.id;
        const { id } = req.params;
        const { status, progress, comment } = req.body;

        const task = await Task.findOne({
            _id: id,
            assignedTo: staffId
        }).populate('assignedTo', 'fullName department');

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found or not assigned to you'
            });
        }

        const oldStatus = task.status;

        // Update task
        if (status) task.status = status;
        if (progress !== undefined) task.progress = progress;

        // Auto-complete if progress reaches 100% or status is set to completed
        if (status === 'completed' || (progress === 100 && task.status !== 'completed')) {
            task.status = 'completed';
            task.completedDate = new Date();
            task.progress = 100;
        }

        // Add comment if provided
        if (comment) {
            task.comments.push({
                user: staffId,
                text: comment
            });
        }

        await task.save();

        // Create notifications for manager and admin when status or progress changes
        const progressChanged = progress !== undefined && progress !== task.progress;
        const statusChanged = status && status !== oldStatus;

        if (statusChanged || progressChanged) {
            // Find all admins
            const admins = await User.find({ role: 'admin' });
            
            // Find manager of the same department
            const manager = await User.findOne({ 
                role: 'manager', 
                department: task.assignedTo.department 
            });

            let notificationMessage = '';
            let notificationTitle = 'Task Updated';

            if (statusChanged && progressChanged) {
                notificationMessage = `${req.user.fullName} updated task "${task.title}": Status to ${status.replace('_', ' ')} and Progress to ${progress}%`;
                notificationTitle = 'Task Status & Progress Updated';
            } else if (statusChanged) {
                notificationMessage = `${req.user.fullName} updated task "${task.title}" status from ${oldStatus.replace('_', ' ')} to ${status.replace('_', ' ')}`;
                notificationTitle = 'Task Status Updated';
            } else {
                notificationMessage = `${req.user.fullName} updated progress for "${task.title}" to ${task.progress}%`;
                notificationTitle = 'Task Progress Updated';
            }

            const notifications = [];

            // Helper to add notification
            const addNotification = (userId) => {
                if (userId.toString() === staffId) return;
                notifications.push({
                    user: userId,
                    type: 'task_updated',
                    title: notificationTitle,
                    message: notificationMessage,
                    link: `/tasks/${task._id}`,
                    sender: staffId,
                    senderName: req.user.fullName
                });
            };

            // Notify all admins
            for (const admin of admins) {
                addNotification(admin._id);
            }

            // Notify manager if exists
            if (manager) {
                addNotification(manager._id);
            }

            // Also notify the task creator
            if (task.createdBy) {
                const isAlreadyNotified = notifications.some(
                    n => n.user.toString() === task.createdBy.toString()
                );
                if (!isAlreadyNotified) {
                    addNotification(task.createdBy);
                }
            }

            // Save all notifications
            if (notifications.length > 0) {
                await Notification.insertMany(notifications);
            }
        }

        res.json({
            success: true,
            message: 'Task updated successfully',
            task
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Add Task Comment
exports.addTaskComment = async (req, res) => {
    try {
        const staffId = req.user.id;
        const { id } = req.params;
        const { text } = req.body;

        const task = await Task.findOne({
            _id: id,
            assignedTo: staffId
        }).populate('assignedTo', 'fullName department');

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found or not assigned to you'
            });
        }

        task.comments.push({
            user: staffId,
            text
        });

        await task.save();

        // Create notifications for manager and admin when comment is added
        const admins = await User.find({ role: 'admin' });
        
        // Find manager of the same department
        const manager = await User.findOne({ 
            role: 'manager', 
            department: task.assignedTo.department 
        });

        const notificationMessage = `${req.user.fullName} commented on "${task.title}": "${text.substring(0, 60)}${text.length > 60 ? '...' : ''}"`;
        const notifications = [];

        // Helper to add notification
        const addNotification = (userId) => {
            if (!userId || userId.toString() === staffId) return;
            
            // Check if already in list
            if (notifications.some(n => n.user.toString() === userId.toString())) return;

            notifications.push({
                user: userId,
                type: 'task_comment',
                title: 'New Task Comment',
                message: notificationMessage,
                link: `/tasks/${task._id}`,
                sender: staffId,
                senderName: req.user.fullName
            });
        };

        // 1. Notify all admins
        for (const admin of admins) {
            addNotification(admin._id);
        }

        // 2. Notify department manager
        if (manager) {
            addNotification(manager._id);
        }

        // 3. Notify the person who assigned the task
        if (task.assignedBy) {
            addNotification(task.assignedBy);
        }

        // 4. Notify the task creator (if different from assigner)
        if (task.createdBy) {
            addNotification(task.createdBy);
        }

        // Save all notifications
        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }

        res.json({
            success: true,
            message: 'Comment added successfully',
            comment: task.comments[task.comments.length - 1]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get Task Details
exports.getTaskDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const { id: userId, role, department } = req.user;

        let query = { _id: id };

        // Role-based visibility logic
        if (role === 'admin') {
            // Admin can see everything, no extra filter
        } else if (role === 'manager') {
            // Manager can see tasks in their department
            query.department = department;
        } else {
            // Staff can only see assigned tasks
            query.assignedTo = userId;
        }

        const task = await Task.findOne(query)
            .populate('assignedBy', 'fullName email photo')
            .populate('assignedTo', 'fullName email photo')
            .populate('comments.user', 'fullName photo');

        if (!task) {
            return res.status(404).json({
                success: true, // Send success: true but null task for frontend handling if needed, 
                               // or stay with 404. The prompt says "Task details not found", 
                               // which is handled by frontend if task is null.
                task: null,
                message: 'Task not found or permission denied'
            });
        }

        res.json({
            success: true,
            task
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get My Profile
exports.getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json({
            success: true,
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update Profile
exports.updateProfile = async (req, res) => {
    try {
        const { password, ...updateData } = req.body;

        // Prevent updating sensitive fields
        delete updateData.role;
        delete updateData.staffId;
        delete updateData.department;
        delete updateData.email; // Usually email updates require verification

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get Notifications
exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({
            success: true,
            notifications
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Mark Notification as Read
exports.markNotificationRead = async (req, res) => {
    try {
        const { id } = req.params;

        await Notification.findOneAndUpdate(
            { _id: id, user: req.user.id },
            { isRead: true }
        );

        res.json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Mark All Notifications as Read
exports.markAllNotificationsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { user: req.user.id, isRead: false },
            { isRead: true }
        );

        res.json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};