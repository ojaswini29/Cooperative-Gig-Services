const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const { validateQuery } = require('../middleware/validate');
const { authenticateJWT } = require('../middleware/auth');
const { matchSchemas } = require('../validators/schemas');

router.get('/workers', authenticateJWT, validateQuery(matchSchemas.findNearby), matchController.findNearbyWorkers);
router.get('/booking/:bookingId', authenticateJWT, matchController.matchBooking);

module.exports = router;
