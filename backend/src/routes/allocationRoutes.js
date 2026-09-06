const express = require('express');
const router = express.Router();
const allocationController = require('../controllers/allocationController');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');

router.get('/score/:bookingId', authenticateJWT, allocationController.scoreWorkersForBooking);
router.post('/auto-assign/:bookingId', authenticateJWT, authorizeRoles('customer', 'cooperative_admin'), allocationController.autoAssignWorker);

module.exports = router;
