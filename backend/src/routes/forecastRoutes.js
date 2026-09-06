const express = require('express');
const router = express.Router();
const forecastController = require('../controllers/forecastController');
const { authenticateJWT } = require('../middleware/auth');

router.get('/demand-features', authenticateJWT, forecastController.getDemandFeatures);
router.get('/predict', authenticateJWT, forecastController.getPredictiveDemand);

module.exports = router;
