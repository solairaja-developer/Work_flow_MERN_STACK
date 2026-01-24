// backend/routes/manager.js
const express = require('express');
const router = express.Router();
const managerController = require('../controllers/managerController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// All manager routes require authentication and manager role
router.use(auth, role('manager', 'admin'));

// Dashboard
router.get('/dashboard', managerController.getManagerDashboard);

// Team Management
router.get('/team', managerController.getTeamMembers);
router.post('/team', managerController.addStaffMember);
router.get('/team/:id', managerController.getTeamMemberDetails);
router.get('/team/:id/tasks', managerController.getMemberTasks);

// Task Management
router.get('/tasks/unassigned', managerController.getUnassignedDepartmentTasks);
router.get('/tasks', managerController.getDepartmentTasks);
router.post('/tasks/assign', managerController.assignTask);
router.get('/tasks/:id', managerController.getTaskDetails);
router.put('/tasks/:id', managerController.updateTask);
router.patch('/tasks/:id/status', managerController.updateTaskStatus);

// Performance
router.get('/performance', managerController.getTeamPerformance);
router.get('/performance/:id', managerController.getMemberPerformance);

module.exports = router;