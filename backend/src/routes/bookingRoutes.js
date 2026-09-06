const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { validateBody } = require('../middleware/validate');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');
const { bookingSchemas } = require('../validators/schemas');

router.post('/', authenticateJWT, authorizeRoles('customer', 'cooperative_admin'), validateBody(bookingSchemas.createBooking), bookingController.createBooking);
router.get('/', authenticateJWT, bookingController.listBookings);
router.get('/:id', authenticateJWT, bookingController.getBookingById);
router.patch('/:id/cancel', authenticateJWT, bookingController.cancelBooking);

module.exports = router;
