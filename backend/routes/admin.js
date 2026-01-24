
// backend/routes/admin.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const roleMiddleware = require('../middleware/roleMiddleware');

// All admin routes require authentication and admin role
router.use(auth, roleMiddleware(['admin']));

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);
router.get('/analytics', adminController.getAnalytics);

// User Management
router.get('/users', adminController.getAllUsers);
router.post('/users', adminController.createUser);
router.delete('/users/:id', adminController.deleteUser);
router.put('/users/:id', adminController.updateUser);

// Task Management
router.post('/tasks', adminController.createTask);
router.get('/tasks/unassigned', adminController.getUnassignedTasks);
router.get('/tasks', adminController.getAllTasks);
router.get('/tasks/:id', adminController.getTaskById);
router.put('/tasks/:id', adminController.updateTask);
router.delete('/tasks/:id', adminController.deleteTask);

// Reports
router.get('/reports/users', adminController.generateUserReport);
router.get('/reports/tasks', adminController.generateTaskReport);

module.exports = router;
