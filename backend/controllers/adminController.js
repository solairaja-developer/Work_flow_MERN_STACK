// backend/controllers/adminController.js
const User = require('../models/User');
const Task = require('../models/Task');
const Notification = require('../models/Notification');

// Get User by ID
exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

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

// Toggle User Status
exports.toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Toggle status
        user.status = user.status === 'active' ? 'inactive' : 'active';
        await user.save();

        res.json({
            success: true,
            message: `User ${user.status === 'active' ? 'activated' : 'deactivated'} successfully`,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                status: user.status
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get All Tasks (Admin)
exports.getAllTasks = async (req, res) => {
    try {
        const { status, department, priority, search } = req.query;
        let filter = {};

        if (status) filter.status = status;
        if (department) filter.department = department;
        if (priority) filter.priority = priority;

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { workId: { $regex: search, $options: 'i' } }
            ];
        }

        const tasks = await Task.find(filter)
            .populate('assignedTo', 'fullName email staffId')
            .populate('assignedBy', 'fullName email')
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

// Get Task by ID
exports.getTaskById = async (req, res) => {
    try {
        const { id } = req.params;
        const task = await Task.findById(id)
            .populate('assignedTo', 'fullName email staffId phone')
            .populate('assignedBy', 'fullName email')
            .populate('comments.user', 'fullName');

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
        )
            .populate('assignedTo', 'fullName email')
            .populate('assignedBy', 'fullName email');

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

// Delete Task
exports.deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        const task = await Task.findByIdAndDelete(id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        res.json({
            success: true,
            message: 'Task deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Generate User Report
exports.generateUserReport = async (req, res) => {
    try {
        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 });

        // You can format this as CSV, PDF, etc.
        res.json({
            success: true,
            report: {
                type: 'user',
                generatedAt: new Date(),
                totalUsers: users.length,
                activeUsers: users.filter(u => u.status === 'active').length,
                inactiveUsers: users.filter(u => u.status === 'inactive').length,
                users: users.map(user => ({
                    id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    role: user.role,
                    department: user.department,
                    status: user.status,
                    createdAt: user.createdAt
                }))
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Generate Task Report
exports.generateTaskReport = async (req, res) => {
    try {
        const { startDate, endDate, department } = req.query;
        let filter = {};

        if (startDate && endDate) {
            filter.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        if (department) {
            filter.department = department;
        }

        const tasks = await Task.find(filter)
            .populate('assignedTo', 'fullName email')
            .populate('assignedBy', 'fullName email')
            .sort({ createdAt: -1 });

        const stats = {
            total: tasks.length,
            pending: tasks.filter(t => t.status === 'pending').length,
            inProgress: tasks.filter(t => t.status === 'in_progress').length,
            completed: tasks.filter(t => t.status === 'completed').length,
            cancelled: tasks.filter(t => t.status === 'cancelled').length
        };

        res.json({
            success: true,
            report: {
                type: 'task',
                generatedAt: new Date(),
                period: startDate && endDate ? `${startDate} to ${endDate}` : 'All time',
                stats,
                tasks: tasks.map(task => ({
                    id: task._id,
                    workId: task.workId,
                    title: task.title,
                    assignedTo: task.assignedTo?.fullName,
                    assignedBy: task.assignedBy?.fullName,
                    department: task.department,
                    priority: task.priority,
                    status: task.status,
                    progress: task.progress,
                    startDate: task.startDate,
                    dueDate: task.dueDate,
                    completedDate: task.completedDate
                }))
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Dashboard Stats
exports.getDashboardStats = async (req, res) => {
    try {
        const [
            totalUsers,
            managersCount,
            totalTasks,
            pendingTasks,
            inProgressTasks,
            completedTasks,
            overdueTasks,
            recentActivities,
            recentUsers
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: 'manager' }),
            Task.countDocuments(),
            Task.countDocuments({ status: 'pending' }),
            Task.countDocuments({ status: 'in_progress' }),
            Task.countDocuments({ status: 'completed' }),
            Task.countDocuments({
                dueDate: { $lt: new Date() },
                status: { $in: ['pending', 'in_progress'] }
            }),
            Task.find()
                .populate('assignedTo', 'fullName')
                .sort({ createdAt: -1 })
                .limit(8),
            User.find()
                .select('fullName email role department createdAt')
                .sort({ createdAt: -1 })
                .limit(5)
        ]);

        res.json({
            success: true,
            stats: {
                users: {
                    total: totalUsers,
                    managers: managersCount
                },
                tasks: {
                    total: totalTasks,
                    pending: pendingTasks,
                    inProgress: inProgressTasks,
                    completed: completedTasks,
                    overdue: overdueTasks
                }
            },
            recentActivities,
            recentUsers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get Analytics
exports.getAnalytics = async (req, res) => {
    try {
        // Task distribution by department
        const taskDistribution = await Task.aggregate([
            { $group: { _id: '$department', count: { $sum: 1 } } }
        ]);

        // User distribution by role
        const userDistribution = await User.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } }
        ]);

        // Task completion rate (simple calculation)
        const totalTasks = await Task.countDocuments();
        const completedTasks = await Task.countDocuments({ status: 'completed' });
        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        res.json({
            success: true,
            analytics: {
                taskDistribution,
                userDistribution,
                completionRate: Math.round(completionRate * 100) / 100
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get All Users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json({
            success: true,
            users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Create User
exports.createUser = async (req, res) => {
    try {
        const { email, password, username, fullName, department, phone, role } = req.body;

        // Check if user already exists
        let user = await User.findOne({ $or: [{ email }, { username }] });
        if (user) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }

        user = new User({
            username,
            email,
            password,
            fullName,
            department,
            phone,
            role: role || 'staff',
            profileImage: req.file ? req.file.path.replace(/\\/g, '/') : ''
        });

        await user.save();

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update User
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        // Prevent password update through this route for security, unless specifically intended
        const { password, ...updateData } = req.body;

        if (req.file) {
            updateData.profileImage = req.file.path.replace(/\\/g, '/');
        }

        const user = await User.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User updated successfully',
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete User
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByIdAndDelete(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get All Tasks
exports.getAllTasks = async (req, res) => {
    try {
        const { status, priority, department, category } = req.query;
        let filter = {};

        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        if (department) filter.department = department;

        const tasks = await Task.find(filter)
            .populate('assignedTo', 'fullName staffId')
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

// Create Task (Work Creation)
exports.createTask = async (req, res) => {
    try {
        const { title, description, department, priority, dueDate, assignedTo } = req.body;
        const adminId = req.user.id;

        const task = new Task({
            title,
            description,
            department,
            priority: priority || 'medium',
            dueDate: new Date(dueDate),
            startDate: new Date(),
            assignedBy: adminId,
            assignedTo: assignedTo || null, // Can be unassigned
            status: assignedTo ? 'pending' : 'pending' // Still pending but maybe a special 'unassigned' tag in future
        });

        await task.save();

        // Notify Managers of the department
        const managers = await User.find({ role: 'manager', department });
        
        let notifications = managers.map(mgr => ({
            user: mgr._id,
            type: 'task_assigned',
            title: 'New Work Added to Department',
            message: assignedTo === mgr._id.toString() 
                ? `You have been specifically assigned to manage this task: "${title}"`
                : `Admin added a new task to your department: "${title}".`,
            link: `/tasks/${task._id}`,
            createdBy: adminId
        }));

        // If assignedTo is a staff (not in managers list), notify them too
        if (assignedTo && !managers.find(m => m._id.toString() === assignedTo)) {
            notifications.push({
                user: assignedTo,
                type: 'task_assigned',
                title: 'New Task Assigned',
                message: `Admin has assigned you a new task: "${title}"`,
                link: `/tasks/${task._id}`,
                createdBy: adminId
            });
        }

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }

        res.status(201).json({
            success: true,
            message: 'Task created successfully',
            task
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get Unassigned Tasks for Manager to pick up
exports.getUnassignedTasks = async (req, res) => {
    try {
        const { department } = req.query;
        let filter = { assignedTo: null };
        if (department) filter.department = department;

        const tasks = await Task.find(filter)
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
