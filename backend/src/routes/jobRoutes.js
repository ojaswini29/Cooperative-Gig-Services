const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { validateBody } = require('../middleware/validate');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');
const { jobSchemas } = require('../validators/schemas');

router.get('/my-jobs', authenticateJWT, authorizeRoles('gig_worker'), jobController.getMyJobs);
router.post('/:bookingId/accept', authenticateJWT, authorizeRoles('gig_worker'), jobController.acceptJob);
router.post('/:bookingId/start', authenticateJWT, authorizeRoles('gig_worker'), jobController.startJob);
router.post('/:bookingId/complete', authenticateJWT, authorizeRoles('gig_worker'), validateBody(jobSchemas.completeJob), jobController.completeJob);

module.exports = router;
