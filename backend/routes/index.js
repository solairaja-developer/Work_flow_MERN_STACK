// routes/index.js
const express = require('express');
const router = express.Router();

// Import route files
const authRoutes = require('./authRoutes'); // Updated name
const adminRoutes = require('./admin');
const managerRoutes = require('./manager');
const staffRoutes = require('./staff');
const taskRoutes = require('./tasks'); // If you have tasks routes
const notificationRoutes = require('./notifications'); // If you have notifications routes

// Import middleware
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/roleMiddleware');

// Auth routes (public)
router.use('/auth', authRoutes);

// Admin routes
router.use('/admin', authMiddleware, roleMiddleware(['admin']), adminRoutes);

// Manager routes
router.use('/manager', authMiddleware, roleMiddleware(['admin', 'manager']), managerRoutes);

// Staff routes
router.use('/staff', authMiddleware, roleMiddleware(['admin', 'manager', 'staff']), staffRoutes);

// Task routes (adjust based on your needs)
// Task routes
router.use('/tasks', authMiddleware, taskRoutes);

// Notification routes
router.use('/notifications', authMiddleware, notificationRoutes);

module.exports = router;
