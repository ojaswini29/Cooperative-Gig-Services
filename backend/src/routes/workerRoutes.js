const express = require('express');
const router = express.Router();
const workerController = require('../controllers/workerController');
const { validateBody } = require('../middleware/validate');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');
const { workerSchemas } = require('../validators/schemas');

router.get('/me', authenticateJWT, authorizeRoles('gig_worker'), workerController.getMyProfile);
router.put('/profile', authenticateJWT, authorizeRoles('gig_worker'), validateBody(workerSchemas.updateProfile), workerController.updateWorkerProfile);
router.put('/location', authenticateJWT, authorizeRoles('gig_worker'), validateBody(workerSchemas.updateLocation), workerController.updateLocationAndAvailability);
router.post('/skills', authenticateJWT, authorizeRoles('gig_worker'), validateBody(workerSchemas.addSkill), workerController.addSkill);
router.delete('/skills/:skillId', authenticateJWT, authorizeRoles('gig_worker'), workerController.removeSkill);

// Admin endpoints
router.get('/pending', authenticateJWT, authorizeRoles('cooperative_admin'), workerController.getPendingWorkers);
router.patch('/:id/verify', authenticateJWT, authorizeRoles('cooperative_admin'), validateBody(workerSchemas.verifyWorker), workerController.verifyWorker);

module.exports = router;
