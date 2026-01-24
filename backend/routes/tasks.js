const express = require('express');
const router = express.Router();
const multer = require('multer');
const taskController = require('../controllers/taskController');
const auth = require('../middleware/auth');
const roleMiddleware = require('../middleware/roleMiddleware');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Routes
router.get('/', auth, roleMiddleware(['admin', 'manager', 'staff']), taskController.getAllTasks);
router.get('/stats', auth, roleMiddleware(['admin', 'manager', 'staff']), taskController.getTaskStats);
router.post('/',
  auth,
  roleMiddleware(['admin', 'manager']),
  upload.single('attachment'),
  taskController.createTask
);
router.put('/:id', auth, roleMiddleware(['admin', 'manager', 'staff']), taskController.updateTask);
router.delete('/:id', auth, roleMiddleware(['admin']), taskController.deleteTask);

module.exports = router;