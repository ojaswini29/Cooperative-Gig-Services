const express = require('express');
const router = express.Router();
const welfareController = require('../controllers/welfareController');
const { validateBody } = require('../middleware/validate');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');
const { welfareSchemas } = require('../validators/schemas');

router.get('/worker/status', authenticateJWT, authorizeRoles('gig_worker'), welfareController.getWorkerWelfareStatus);
router.post('/claims', authenticateJWT, authorizeRoles('gig_worker'), validateBody(welfareSchemas.submitClaim), welfareController.submitClaim);
router.get('/claims', authenticateJWT, welfareController.listClaims);
router.patch('/claims/:id/status', authenticateJWT, authorizeRoles('cooperative_admin'), validateBody(welfareSchemas.updateClaimStatus), welfareController.updateClaimStatus);
router.get('/summary', authenticateJWT, authorizeRoles('cooperative_admin'), welfareController.getWelfareSummary);

module.exports = router;
