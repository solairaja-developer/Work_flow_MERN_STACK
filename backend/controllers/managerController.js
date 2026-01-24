// backend/controllers/managerController.js
const User = require('../models/User');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

// Get Manager Dashboard Stats
exports.getManagerDashboard = async (req, res) => {
    try {
        const managerId = req.user.id;
        const department = req.user.department;

        // Get team members
        const teamMembers = await User.find({
            department: department,
            role: 'staff',
            status: 'active'
        }).select('fullName email position staffId');

        // Get department tasks
        const [
            totalTasks,
            pendingTasks,
            inProgressTasks,
            completedTasks,
            overdueTasks,
            teamPerformance
        ] = await Promise.all([
            Task.countDocuments({ department }),
            Task.countDocuments({
                department,
                status: 'pending'
            }),
            Task.countDocuments({
                department,
                status: 'in_progress'
            }),
            Task.countDocuments({
                department,
                status: 'completed'
            }),
            Task.countDocuments({
                department,
                dueDate: { $lt: new Date() },
                status: { $in: ['pending', 'in_progress'] }
            }),
            Task.aggregate([
                {
                    $match: { department }
                },
                {
                    $group: {
                        _id: "$assignedTo",
                        total: { $sum: 1 },
                        completed: {
                            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
                        }
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "_id",
                        foreignField: "_id",
                        as: "user"
                    }
                },
                { $unwind: "$user" },
                {
                    $project: {
                        userId: "$_id",
                        fullName: "$user.fullName",
                        totalTasks: "$total",
                        completedTasks: "$completed",
                        completionRate: {
                            $multiply: [
                                { $divide: ["$completed", "$total"] },
                                100
                            ]
                        }
                    }
                }
            ])
        ]);

        // Recent department activities
        const recentActivities = await Task.find({ department })
            .populate('assignedTo', 'fullName')
            .populate('assignedBy', 'fullName')
            .sort({ createdAt: -1 })
            .limit(8);

        res.json({
            success: true,
            dashboard: {
                stats: {
                    teamSize: teamMembers.length,
                    totalTasks,
                    pendingTasks,
                    inProgressTasks,
                    completedTasks,
                    overdueTasks,
                    completionRate: totalTasks > 0 ?
                        Math.round((completedTasks / totalTasks) * 100) : 0
                },
                teamMembers,
                teamPerformance,
                recentActivities
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get Team Members
exports.getTeamMembers = async (req, res) => {
    try {
        const department = req.user.department;
        const { search } = req.query;

        let filter = {
            department: department,
            role: 'staff',
            status: 'active'
        };

        if (search) {
            filter.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { staffId: { $regex: search, $options: 'i' } }
            ];
        }

        const teamMembers = await User.find(filter)
            .select('-password')
            .sort({ fullName: 1 });

        // Get task stats for each team member
        const teamWithStats = await Promise.all(
            teamMembers.map(async (member) => {
                const taskStats = await Task.aggregate([
                    {
                        $match: { assignedTo: member._id }
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: 1 },
                            completed: {
                                $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
                            },
                            pending: {
                                $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
                            },
                            inProgress: {
                                $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] }
                            }
                        }
                    }
                ]);

                return {
                    ...member.toObject(),
                    taskStats: taskStats[0] || {
                        total: 0,
                        completed: 0,
                        pending: 0,
                        inProgress: 0
                    }
                };
            })
        );

        res.json({
            success: true,
            team: teamWithStats,
            total: teamWithStats.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Assign Task to Team Member
exports.assignTask = async (req, res) => {
    try {
        const managerId = req.user.id;
        const {
            taskId, // Added taskId to support assigning from pool
            title,
            description,
            assignedTo,
            category,
            priority,
            dueDate
        } = req.body;

        // Validate assigned user
        const assignedUser = await User.findById(assignedTo);
        if (!assignedUser || assignedUser.role !== 'staff') {
            return res.status(400).json({
                success: false,
                message: 'Invalid staff member selected'
            });
        }

        let task;
        if (taskId) {
            // Assign existing task from pool
            task = await Task.findById(taskId);
            if (!task) {
                return res.status(404).json({ success: false, message: 'Task not found' });
            }
            task.assignedTo = assignedTo;
            task.assignedBy = managerId;
            task.status = 'in_progress';
            await task.save();
        } else {
            // Create new task (standard workflow)
            task = new Task({
                title,
                description,
                assignedTo,
                assignedBy: managerId,
                department: req.user.department,
                category: category || req.user.department,
                priority: priority || 'medium',
                startDate: new Date(),
                dueDate: new Date(dueDate)
            });
            await task.save();
        }

        // Create notification for the assigned staff
        const notification = new Notification({
            user: assignedTo,
            type: 'task_assigned',
            title: 'New Task Assigned',
            message: `You have been assigned a new task: "${task.title}"`,
            link: `/tasks/${task._id}`,
            createdBy: managerId
        });

        await notification.save();

        res.status(taskId ? 200 : 201).json({
            success: true,
            message: taskId ? 'Task picked from pool and assigned' : 'Task created and assigned',
            task,
            notification
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get Department Tasks
exports.getDepartmentTasks = async (req, res) => {
    try {
        const department = req.user.department;
        const { status, priority, assignedTo, search } = req.query;

        let filter = { department };

        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        if (assignedTo) filter.assignedTo = assignedTo;

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { workId: { $regex: search, $options: 'i' } }
            ];
        }

        const tasks = await Task.find(filter)
            .populate('assignedTo', 'fullName email staffId')
            .populate('assignedBy', 'fullName')
            .sort({ createdAt: -1 });

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

// Get Team Member Details
exports.getTeamMemberDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Team member not found'
            });
        }

        // Get extended stats
        const stats = await Task.aggregate([
            { $match: { assignedTo: user._id } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
                    pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
                    inProgress: { $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] } }
                }
            }
        ]);

        res.json({
            success: true,
            user,
            stats: stats[0] || { total: 0, completed: 0, pending: 0, inProgress: 0 }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get Member Tasks
exports.getMemberTasks = async (req, res) => {
    try {
        const { id } = req.params;
        const tasks = await Task.find({ assignedTo: id })
            .populate('assignedBy', 'fullName')
            .sort({ createdAt: -1 });

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

// Get Task Details
exports.getTaskDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const task = await Task.findById(id)
            .populate('assignedTo', 'fullName email staffId photo')
            .populate('assignedBy', 'fullName email')
            .populate('comments.user', 'fullName photo');

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        res.json({
            success: true,
            task
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update Task
exports.updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const task = await Task.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
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

// Update Task Status
exports.updateTaskStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const task = await Task.findByIdAndUpdate(
            id,
            {
                status,
                ...(status === 'completed' ? { completedDate: new Date(), progress: 100 } : {})
            },
            { new: true }
        );

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        // Notify user about status change
        if (task.assignedTo && status) {
            const notification = new Notification({
                user: task.assignedTo,
                type: 'task_status_updated',
                title: 'Task Status Updated',
                message: `Task "${task.title}" status changed to ${status}`,
                link: `/tasks/${task._id}`,
                createdBy: req.user.id
            });
            await notification.save();
        }

        res.json({
            success: true,
            message: `Task status updated to ${status}`,
            task
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get Team Performance
exports.getTeamPerformance = async (req, res) => {
    try {
        const department = req.user.department;

        const performance = await Task.aggregate([
            { $match: { department } },
            {
                $group: {
                    _id: "$assignedTo",
                    totalTasks: { $sum: 1 },
                    completedTasks: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
                    avgProgress: { $avg: "$progress" }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" },
            {
                $project: {
                    userId: "$_id",
                    fullName: "$user.fullName",
                    totalTasks: 1,
                    completedTasks: 1,
                    avgProgress: { $round: ["$avgProgress", 1] },
                    completionRate: {
                        $round: [{ $multiply: [{ $divide: ["$completedTasks", { $max: ["$totalTasks", 1] }] }, 100] }, 1]
                    }
                }
            },
            { $sort: { completionRate: -1 } }
        ]);

        res.json({
            success: true,
            performance
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get Member Performance
exports.getMemberPerformance = async (req, res) => {
    try {
        const { id } = req.params;

        // Detailed performance metrics for a single member
        const [taskStats, recentTasks] = await Promise.all([
            Task.aggregate([
                { $match: { assignedTo: new mongoose.Types.ObjectId(id) } },
                {
                    $group: {
                        _id: null,
                        totalTasks: { $sum: 1 },
                        completedTasks: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
                        onTimeCompletion: {
                            $sum: {
                                $cond: [
                                    {
                                        $and: [
                                            { $eq: ["$status", "completed"] },
                                            { $lte: ["$completedDate", "$dueDate"] }
                                        ]
                                    },
                                    1,
                                    0
                                ]
                            }
                        }
                    }
                }
            ]),
            Task.find({ assignedTo: id })
                .sort({ updatedAt: -1 })
                .limit(5)
                .select('title status progress updatedAt')
        ]);

        const stats = taskStats[0] || { totalTasks: 0, completedTasks: 0, onTimeCompletion: 0 };

        res.json({
            success: true,
            performance: {
                ...stats,
                completionRate: stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0,
                onTimeRate: stats.completedTasks > 0 ? Math.round((stats.onTimeCompletion / stats.completedTasks) * 100) : 0,
                recentActivity: recentTasks
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Add New Staff Member
exports.addStaffMember = async (req, res) => {
    try {
        const { username, email, password, fullName, phone, position } = req.body;
        const department = req.user.department; // Staff is added to manager's department

        // Check if user exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email or username already exists'
            });
        }

        // Create staff user
        const user = new User({
            username,
            email,
            password,
            fullName,
            role: 'staff',
            department,
            phone,
            position: position || 'Staff',
            status: 'active'
        });

        await user.save();

        res.status(201).json({
            success: true,
            message: 'Staff member added successfully',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                department: user.department,
                staffId: user.staffId
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get Unassigned Tasks for Manager's Department
exports.getUnassignedDepartmentTasks = async (req, res) => {
    try {
        const department = req.user.department;
        const tasks = await Task.find({
            department,
            assignedTo: null
        })
            .populate('assignedBy', 'fullName')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            tasks
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};