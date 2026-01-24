const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');
const roleMiddleware = require('../middleware/roleMiddleware');

// Routes
router.get('/', auth, roleMiddleware(['admin', 'manager', 'staff']), notificationController.getNotifications);
router.put('/:id/read', auth, roleMiddleware(['admin', 'manager', 'staff']), notificationController.markAsRead);
router.put('/read-all', auth, roleMiddleware(['admin', 'manager', 'staff']), notificationController.markAllAsRead);
router.post('/', auth, roleMiddleware(['admin', 'manager']), notificationController.createNotification);

module.exports = router;