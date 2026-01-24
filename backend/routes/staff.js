// backend/routes/staff.js
const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// All staff routes require authentication
router.use(auth, role('staff', 'manager', 'admin'));

// Dashboard
router.get('/dashboard', staffController.getStaffDashboard);

// Task Management
router.get('/tasks', staffController.getMyTasks);
router.get('/tasks/:id', staffController.getTaskDetails);
router.put('/tasks/:id/progress', staffController.updateTaskProgress);
router.post('/tasks/:id/comments', staffController.addTaskComment);

// Profile
router.get('/profile', staffController.getMyProfile);
router.put('/profile', staffController.updateProfile);

// Notifications
router.get('/notifications', staffController.getNotifications);
router.put('/notifications/:id/read', staffController.markNotificationRead);
router.put('/notifications/read-all', staffController.markAllNotificationsRead);

module.exports = router;