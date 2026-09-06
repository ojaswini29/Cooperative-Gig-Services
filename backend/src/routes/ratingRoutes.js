const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const { validateBody } = require('../middleware/validate');
const { authenticateJWT } = require('../middleware/auth');
const { ratingSchemas } = require('../validators/schemas');

router.post('/', authenticateJWT, validateBody(ratingSchemas.createRating), ratingController.createRating);
router.get('/worker/:workerId', authenticateJWT, ratingController.getWorkerRatings);
router.get('/booking/:bookingId', authenticateJWT, ratingController.getBookingRatings);

module.exports = router;
