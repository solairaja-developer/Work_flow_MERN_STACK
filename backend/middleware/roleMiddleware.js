
// middleware/roleMiddleware.js
const roleMiddleware = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }
        
        next();
    };
};

// Export only the middleware function
module.exports = roleMiddleware;

// REMOVE THE BELOW LINES - they don't belong in a middleware file:
// // Usage in routes
// router.get('/admin/stats', 
//     authMiddleware, 
//     roleMiddleware(['admin']), 
//     adminController.getStats
// );
// 
// router.get('/manager/team',
//     authMiddleware,
//     roleMiddleware(['admin', 'manager']),
//     managerController.getTeam
// );
// 
// router.get('/staff/tasks',
//     authMiddleware,
//     roleMiddleware(['admin', 'manager', 'staff']),
//     staffController.getMyTasks
// );
