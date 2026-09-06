const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');

router.get('/dashboard', authenticateJWT, authorizeRoles('cooperative_admin'), adminController.getDashboardStats);
router.get('/users', authenticateJWT, authorizeRoles('cooperative_admin'), adminController.listUsers);
router.patch('/users/:id/status', authenticateJWT, authorizeRoles('cooperative_admin'), adminController.updateUserStatus);

module.exports = router;
